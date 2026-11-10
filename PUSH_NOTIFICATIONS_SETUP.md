# Configurar notificações de novas ocorrências

As notificações são opcionais. Cada visitante ativa os avisos no próprio dispositivo. A primeira configuração exige uma chave VAPID, uma tabela e uma Edge Function no Supabase.

> A chave **privada** VAPID e o segredo do webhook ficam somente nos Secrets do Supabase. Nunca os coloque em arquivos do site.

## 1. Gerar as chaves VAPID

No computador, abra o terminal e execute:

```bash
npx --yes web-push generate-vapid-keys
```

O comando mostra uma chave **public key** e outra **private key**. Guarde as duas.

No GitHub, abra `supabase-config.js` e substitua:

```js
export const PUSH_VAPID_PUBLIC_KEY = "COLE_A_CHAVE_PUBLICA_VAPID_AQUI";
```

pela chave **pública** gerada. Salve a alteração. O Vercel publica o site atualizado automaticamente.

## 2. Criar a tabela de inscrições

No Supabase, abra **SQL Editor**, cole o conteúdo completo de [supabase-push-notifications.sql](./supabase-push-notifications.sql) e clique em **Run** uma vez. O arquivo só adiciona a tabela protegida e funções para registrar/remover inscrições; não altera as notas existentes.

## 3. Criar a Edge Function

No Supabase, abra **Edge Functions** e crie uma função chamada `push-note`. Copie nela o código de [supabase/functions/push-note/index.ts](./supabase/functions/push-note/index.ts) e publique.

Na configuração da função, deixe **Verify JWT** desativado. A função valida um segredo próprio do webhook antes de processar qualquer envio.

## 4. Guardar os segredos no Supabase

Em **Edge Functions → Secrets**, adicione:

| Nome | Valor |
| --- | --- |
| `AINOS_WEBHOOK_SECRET` | Um segredo aleatório longo, que você criará para o webhook |
| `AINOS_VAPID_PUBLIC_KEY` | A chave pública VAPID gerada |
| `AINOS_VAPID_PRIVATE_KEY` | A chave privada VAPID gerada |
| `AINOS_VAPID_SUBJECT` | `mailto:seu-email@example.com` (troque pelo seu e-mail) |

O Supabase fornece `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` à Edge Function. Não copie a service role key para o site.

Para criar um segredo aleatório, pode usar um gerenciador de senhas ou gerar um no terminal:

```bash
openssl rand -hex 32
```

Use o mesmo valor em `AINOS_WEBHOOK_SECRET` e no cabeçalho do passo seguinte.

## 5. Ligar a publicação de notas ao envio

No painel do Supabase, vá a **Database → Webhooks → Create a new hook** e configure:

- **Table:** `public.ainos_notes`
- **Event:** `INSERT`
- **Type:** Supabase Edge Function
- **Function:** `push-note`
- **Method:** `POST`
- **Header:** `x-ainos-webhook-secret` com o mesmo valor de `AINOS_WEBHOOK_SECRET`
- **Header:** `Content-Type: application/json`

Assim, cada nova nota inserida no banco dispara um envio. Editar ou apagar uma nota não dispara aviso.

## 6. Ativar no dispositivo

Abra o site e clique em **Ativar avisos**. Cada pessoa precisa permitir notificações no próprio navegador. No iPhone/iPad, primeiro adicione o site à Tela de Início e abra o app instalado; depois ative os avisos nele.

O botão muda para **Avisos ativos** neste dispositivo. Para parar, clique nele novamente. A permissão também pode ser revogada nas configurações do navegador.

## Se algo não funcionar

- Confira os logs em **Supabase → Edge Functions → push-note → Logs**.
- Confirme que o segredo do cabeçalho e `AINOS_WEBHOOK_SECRET` são idênticos.
- Confirme que a chave pública do arquivo do site é o par da chave privada cadastrada no Supabase.
- Confirme que a tabela SQL foi criada e que o webhook está configurado para `INSERT`.
- Se negou a permissão no navegador, altere-a nas configurações do site e tente novamente.
