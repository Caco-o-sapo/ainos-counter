# Configuração do painel administrativo

O site continua público. O painel em `/admin.html` só permite alterações para contas autorizadas pelo Supabase.

## 1. Criar as tabelas e regras

No Supabase, abra **SQL Editor**, cole o conteúdo de [supabase-admin.sql](./supabase-admin.sql) e execute uma vez.

Isso cria a tabela de notas, a lista de administradores e as regras que permitem leitura pública, mas reservam alterações para administradores autenticados. Também libera a exclusão de comentários apenas para administradores.

## 2. Criar sua conta

Abra `https://ainos-counter.vercel.app/admin.html`, use **Criar conta** com seu e-mail e escolha uma senha. Confirme o e-mail pelo link enviado pelo Supabase.

Se o Supabase bloquear o redirecionamento, abra **Authentication → URL Configuration** e inclua `https://ainos-counter.vercel.app/admin.html` na lista de URLs permitidas.

## 3. Autorizar a primeira conta

No Supabase, abra **SQL Editor** e execute, trocando pelo e-mail usado no cadastro:

```sql
insert into public.ainos_admin_allowlist(email)
values (lower('seu@email.com'))
on conflict (email) do nothing;
```

Volte ao painel e entre. O primeiro login autorizado conclui o cadastro administrativo. A chave pública do projeto já usada no site continua suficiente; não coloque uma chave `service_role` no navegador.

## 4. Importar o arquivo de notas atual

No painel, clique **Importar notas atuais**. Isso copia as ocorrências de `notas.js` para o banco, mantendo os mesmos IDs usados nos comentários e reações. O botão não apaga notas existentes; use a importação uma vez para iniciar o arquivo no banco.

A partir daí, adicione e edite ocorrências pelo formulário do painel. O site público, as estatísticas, o contador e a imagem de prévia leem as notas do Supabase. Não precisa alterar `notas.js` nem fazer novo deploy para cada anotação.

## 5. Adicionar outros administradores

Na seção **Administradores** do painel, autorize o e-mail da pessoa. Ela cria a própria conta em `/admin.html`, confirma o e-mail e entra com a própria senha. Só e-mails autorizados podem alterar o site. Remover um e-mail revoga o acesso administrativo; o último administrador não pode remover a si próprio.

## O que o painel controla

- Criar, editar e apagar ocorrências.
- Escolher data, categoria automática ou manual e marcar um dia bom.
- Revisar e apagar comentários da comunidade.
- Autorizar ou remover outros administradores.

A seção de reações permanece pública para os visitantes, como antes.