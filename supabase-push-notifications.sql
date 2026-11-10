-- Ainos Watch: armazenamento privado das inscrições Web Push.
-- Execute uma vez em Supabase > SQL Editor. Não altera nem apaga as notas.

create table if not exists public.ainos_push_subscriptions (
  endpoint text primary key check (char_length(endpoint) between 20 and 2000),
  p256dh text not null check (char_length(p256dh) between 40 and 200),
  auth text not null check (char_length(auth) between 8 and 200),
  owner_token text not null check (char_length(owner_token) between 32 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ainos_push_subscriptions enable row level security;
revoke all on public.ainos_push_subscriptions from public, anon, authenticated;

create or replace function public.register_ainos_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_owner_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_endpoint is null or p_endpoint !~ '^https://[^[:space:]]+$'
     or char_length(p_endpoint) not between 20 and 2000
     or char_length(coalesce(p_p256dh, '')) not between 40 and 200
     or char_length(coalesce(p_auth, '')) not between 8 and 200
     or char_length(coalesce(p_owner_token, '')) not between 32 and 128 then
    raise exception 'invalid_push_subscription';
  end if;

  insert into public.ainos_push_subscriptions(endpoint, p256dh, auth, owner_token)
  values (p_endpoint, p_p256dh, p_auth, p_owner_token)
  on conflict (endpoint) do update set
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    owner_token = excluded.owner_token,
    updated_at = now();
end;
$$;

create or replace function public.remove_ainos_push_subscription(
  p_endpoint text,
  p_owner_token text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removida_count integer;
begin
  if p_endpoint is null or p_owner_token is null then
    return false;
  end if;

  delete from public.ainos_push_subscriptions
  where endpoint = p_endpoint
    and owner_token = p_owner_token;
  get diagnostics removida_count = row_count;
  return removida_count > 0;
end;
$$;

revoke all on function public.register_ainos_push_subscription(text, text, text, text) from public;
revoke all on function public.remove_ainos_push_subscription(text, text) from public;
grant execute on function public.register_ainos_push_subscription(text, text, text, text) to anon, authenticated;
grant execute on function public.remove_ainos_push_subscription(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
