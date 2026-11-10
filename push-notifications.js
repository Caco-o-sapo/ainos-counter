import { supabase } from "./notas-store.js";

const TOKEN_KEY = "ainos-push-owner-token";

function base64UrlToBytes(value) {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function chaveDoDono() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    token = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function pushDisponivel() {
  return "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window
    && window.isSecureContext;
}

export async function pushAtivo() {
  if (!pushDisponivel()) return false;
  const registro = await navigator.serviceWorker.ready;
  return Boolean(await registro.pushManager.getSubscription());
}

async function salvarInscricao(inscricao) {
  const dados = inscricao.toJSON();
  const chaves = dados.keys || {};
  if (!dados.endpoint || !chaves.p256dh || !chaves.auth) {
    throw new Error("Inscrição push incompleta.");
  }
  const { error } = await supabase.rpc("register_ainos_push_subscription", {
    p_endpoint: dados.endpoint,
    p_p256dh: chaves.p256dh,
    p_auth: chaves.auth,
    p_owner_token: chaveDoDono()
  });
  if (error) throw error;
}

export async function ativarPush(chavePublica) {
  if (!pushDisponivel()) throw new Error("Push não é compatível com este navegador.");
  const registro = await navigator.serviceWorker.ready;
  let inscricao = await registro.pushManager.getSubscription();
  if (!inscricao) {
    inscricao = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(chavePublica)
    });
  }
  try {
    await salvarInscricao(inscricao);
  } catch (erro) {
    if (inscricao) await inscricao.unsubscribe();
    throw erro;
  }
}

export async function desativarPush() {
  if (!pushDisponivel()) return;
  const registro = await navigator.serviceWorker.ready;
  const inscricao = await registro.pushManager.getSubscription();
  if (!inscricao) return;
  await salvarInscricao(inscricao);
  const { error } = await supabase.rpc("remove_ainos_push_subscription", {
    p_endpoint: inscricao.endpoint,
    p_owner_token: chaveDoDono()
  });
  if (error) throw error;
  await inscricao.unsubscribe();
  localStorage.removeItem(TOKEN_KEY);
}
