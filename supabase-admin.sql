-- Ainos Watch: notas editáveis e acesso administrativo.
-- Execute este arquivo UMA vez no Supabase > SQL Editor.
-- Antes do primeiro login, adicione o e-mail inicial à allowlist no trecho indicado no fim.
-- A chave publishable continua sendo a única chave usada no navegador.

create table if not exists public.ainos_notes (
  id text primary key check (char_length(id) between 1 and 100),
  data date not null,
  texto text not null check (char_length(texto) between 1 and 2000),
  dia_bom boolean not null default false,
  categoria text null check (categoria is null or categoria in ('work','games','health','social','daily','other')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ainos_notes_date_position_idx
  on public.ainos_notes (data desc, position asc, created_at desc);

create table if not exists public.ainos_admin_allowlist (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 320),
  created_at timestamptz not null default now()
);

create table if not exists public.ainos_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.ainos_notes enable row level security;
alter table public.ainos_admin_allowlist enable row level security;
alter table public.ainos_admins enable row level security;

create or replace function public.is_ainos_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ainos_admins
    where user_id = (select auth.uid())
  );
$$;

create or replace function public.claim_ainos_admin_access()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_confirmed_at timestamptz;
begin
  select lower(email), email_confirmed_at
    into v_email, v_confirmed_at
    from auth.users
    where id = (select auth.uid());

  if v_email is null or v_confirmed_at is null then
    return false;
  end if;

  if not exists (
    select 1 from public.ainos_admin_allowlist
    where email = v_email
  ) then
    return false;
  end if;

  insert into public.ainos_admins (user_id, email)
  values ((select auth.uid()), v_email)
  on conflict (user_id) do update set email = excluded.email;

  return true;
end;
$$;

create or replace function public.set_ainos_admin_email(p_email text, p_allowed boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.is_ainos_admin() then
    raise exception 'not_authorized';
  end if;

  if v_email = '' or char_length(v_email) > 320 or position('@' in v_email) < 2 then
    raise exception 'invalid_email';
  end if;

  if p_allowed then
    insert into public.ainos_admin_allowlist(email)
    values (v_email)
    on conflict (email) do nothing;
  else
    if exists (
      select 1 from public.ainos_admins
      where email = v_email
        and user_id = (select auth.uid())
    ) and (select count(*) from public.ainos_admins) <= 1 then
      raise exception 'cannot_remove_last_admin';
    end if;

    delete from public.ainos_admin_allowlist where email = v_email;
    delete from public.ainos_admins where email = v_email;
  end if;

  return true;
end;
$$;

grant execute on function public.is_ainos_admin() to authenticated;
grant execute on function public.claim_ainos_admin_access() to authenticated;
grant execute on function public.set_ainos_admin_email(text, boolean) to authenticated;

grant select on public.ainos_notes to anon, authenticated;
grant insert, update, delete on public.ainos_notes to authenticated;
grant select on public.ainos_admin_allowlist to authenticated;

drop policy if exists "Anyone can read Ainos notes" on public.ainos_notes;
create policy "Anyone can read Ainos notes"
  on public.ainos_notes for select to anon, authenticated
  using (true);

drop policy if exists "Admins can add Ainos notes" on public.ainos_notes;
create policy "Admins can add Ainos notes"
  on public.ainos_notes for insert to authenticated
  with check (public.is_ainos_admin());

drop policy if exists "Admins can edit Ainos notes" on public.ainos_notes;
create policy "Admins can edit Ainos notes"
  on public.ainos_notes for update to authenticated
  using (public.is_ainos_admin())
  with check (public.is_ainos_admin());

drop policy if exists "Admins can delete Ainos notes" on public.ainos_notes;
create policy "Admins can delete Ainos notes"
  on public.ainos_notes for delete to authenticated
  using (public.is_ainos_admin());

drop policy if exists "Admins can view Ainos admin emails" on public.ainos_admin_allowlist;
create policy "Admins can view Ainos admin emails"
  on public.ainos_admin_allowlist for select to authenticated
  using (public.is_ainos_admin());

-- Permite aos administradores moderar comentários sem liberar exclusões públicas.
grant delete on public.ainos_comments to authenticated;
drop policy if exists "Admins can delete Ainos comments" on public.ainos_comments;
create policy "Admins can delete Ainos comments"
  on public.ainos_comments for delete to authenticated
  using (public.is_ainos_admin());

-- Primeiro acesso:
-- 1) Cadastre/convide o usuário em Authentication > Users no Supabase.
-- 2) Troque pelo e-mail dele e rode esta linha no SQL Editor:
-- insert into public.ainos_admin_allowlist(email) values (lower('seu@email.com'))
-- on conflict (email) do nothing;
-- 3) Entre em /admin.html com essa conta. O primeiro login conclui a autorização.
