// Configuração pública do Supabase para o site estático.
// A publishable key pode ficar no navegador; a segurança depende das políticas RLS do banco.
export const SUPABASE_URL = "https://mhnatngyvnrcqsbrgjzn.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SEc0ZXjMFuATgskQnO5EYw_P8Ra78ei";

// Chave pública VAPID para inscrição do navegador (não é uma chave privada).
// Gere o par e cole aqui somente a chave pública; instruções em PUSH_NOTIFICATIONS_SETUP.md.
export const PUSH_VAPID_PUBLIC_KEY = "COLE_A_CHAVE_PUBLICA_VAPID_AQUI";
