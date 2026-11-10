# Configuração do painel administrativo

O site continua público. O painel em `/admin.html` só permite alterações para contas autorizadas pelo Supabase.

## 1. Criar sua conta e confirmar o e-mail

Abra [ainos-counter.vercel.app/admin.html](https://ainos-counter.vercel.app/admin.html), clique em **Criar conta**, use seu e-mail e escolha uma senha. Confirme o e-mail pelo link enviado pelo Supabase.

Se o link não voltar para o painel, abra **Authentication → URL Configuration** no Supabase e inclua `https://ainos-counter.vercel.app/admin.html` nas URLs permitidas.

## 2. Preparar o banco e autorizar o primeiro administrador

No Supabase, abra **SQL Editor**. Cole a versão atual do arquivo [supabase-admin.sql](./supabase-admin.sql) inteiro. No bloco **PRIMEIRO ADMINISTRADOR** no final, troque somente `seu@email.com` pelo e-mail confirmado no cadastro. Execute o arquivo completo.

Esse bloco marca sua conta como **proprietário**. A atualização também adiciona o histórico de atividades. Se você já tinha executado uma versão anterior do SQL, execute o arquivo atualizado inteiro novamente: ele aplica as colunas, funções e gatilhos que faltavam sem apagar as notas.

Não cole comandos dentro de uma função SQL. O bloco de proprietário fica separado no final do arquivo.

## 3. Entrar e importar as notas

Volte a `/admin.html` e entre com seu e-mail e senha. Clique em **Importar notas atuais** uma vez para trazer as ocorrências que já estavam em `notas.js`. A importação não apaga nada que já esteja no banco.

A partir daí, adicione e edite ocorrências no painel. O site público, as estatísticas, o contador e a imagem de prévia passam a buscar as notas do Supabase, sem editar arquivos nem fazer novo deploy por anotação.

## 4. Dar acesso a outras pessoas

Na seção **Administradores** do painel, autorize o e-mail da pessoa. Ela cria a própria conta em `/admin.html`, confirma o e-mail e entra com sua própria senha. Só e-mails autorizados podem alterar o site. Remover um e-mail revoga o acesso; o último administrador não pode remover a si próprio.

## O que o painel controla

- Criar, editar e apagar ocorrências.
- Escolher data, categoria automática ou manual e marcar um dia bom.
- Definir o nome que aparecerá no histórico de atividades.
- Revisar e apagar comentários da comunidade.
- Autorizar ou remover outros administradores; a conta proprietária fica protegida.
- Consultar um histórico de quem criou, editou ou apagou notas, moderou comentários e alterou acessos.

A seção de reações permanece pública para os visitantes, como antes.