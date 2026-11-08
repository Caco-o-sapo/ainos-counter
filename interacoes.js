import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const emojis = ["😂", "😭", "💀", "😮", "❤️"];

function visitanteId() {
  const chave = "ainos-visitor-id";
  try {
    let id = localStorage.getItem(chave);
    if (!id) {
      id = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(chave, id);
    }
    return id;
  } catch {
    return "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

const meuVisitanteId = visitanteId();

export function obterIdNota(nota) {
  if (nota.id) return String(nota.id);
  // ID derivado do conteúdo para manter o notas.js simples, sem campo extra por nota.
  // Se a data ou o texto mudar, a nota passa a ter outro ID.
  const texto = (nota.data || "") + "|" + (nota.texto || "");
  let a = 2166136261;
  let b = 2246822519;
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    a = Math.imul(a ^ codigo, 16777619);
    b = Math.imul(b ^ codigo, 3266489917);
  }
  return "n-" + (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}

function botao(classe, texto, aria) {
  const elemento = document.createElement("button");
  elemento.type = "button";
  elemento.className = classe;
  elemento.textContent = texto;
  if (aria) elemento.setAttribute("aria-label", aria);
  return elemento;
}

function formatarData(valor, idioma) {
  const data = new Date(valor);
  return new Intl.DateTimeFormat(idioma === "en" ? "en" : "pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(data);
}

export async function renderizarInteracoesNota(destino, noteId, t) {
  const area = document.createElement("section");
  area.className = "note-community";
  area.setAttribute("aria-label", t.communityLabel);

  const barra = document.createElement("div");
  barra.className = "reaction-bar";
  const status = document.createElement("p");
  status.className = "community-status";
  status.setAttribute("role", "status");

  const comentarios = document.createElement("div");
  comentarios.className = "comments-panel";
  comentarios.hidden = true;

  const toggleComentarios = botao("comments-toggle", t.commentsLoading, t.commentsLabel);
  toggleComentarios.setAttribute("aria-expanded", "false");
  toggleComentarios.addEventListener("click", async () => {
    const abrir = comentarios.hidden;
    comentarios.hidden = !abrir;
    toggleComentarios.setAttribute("aria-expanded", String(abrir));
    if (abrir) await carregarComentarios();
  });

  area.append(barra, toggleComentarios, comentarios, status);
  destino.appendChild(area);

  async function atualizarReacoes() {
    barra.replaceChildren();
    try {
      const { data, error } = await supabase
        .from("ainos_reactions")
        .select("emoji,visitor_id")
        .eq("note_id", noteId);
      if (error) throw error;
      const contagem = Object.fromEntries(emojis.map((emoji) => [emoji, 0]));
      const minhas = new Set();
      (data || []).forEach((reacao) => {
        if (Object.hasOwn(contagem, reacao.emoji)) contagem[reacao.emoji]++;
        if (reacao.visitor_id === meuVisitanteId) minhas.add(reacao.emoji);
      });
      emojis.forEach((emoji) => {
        const escolhido = minhas.has(emoji);
        const item = botao("reaction-button" + (escolhido ? " selected" : ""), emoji + " " + contagem[emoji], t.reactWith + " " + emoji);
        item.setAttribute("aria-pressed", String(escolhido));
        item.addEventListener("click", async () => {
          item.disabled = true;
          status.textContent = "";
          const resultado = escolhido
            ? await supabase.from("ainos_reactions").delete().eq("note_id", noteId).eq("visitor_id", meuVisitanteId).eq("emoji", emoji)
            : await supabase.from("ainos_reactions").insert({ note_id: noteId, visitor_id: meuVisitanteId, emoji });
          if (resultado.error) {
            status.textContent = t.interactionError;
          }
          await atualizarReacoes();
        });
        barra.appendChild(item);
      });
    } catch (erro) {
      barra.replaceChildren();
      status.textContent = t.interactionUnavailable;
    }
  }

  async function carregarComentarios() {
    comentarios.replaceChildren();
    const carregando = document.createElement("p");
    carregando.className = "comments-empty";
    carregando.textContent = t.commentsLoading;
    comentarios.appendChild(carregando);

    try {
      const { data, error, count } = await supabase
        .from("ainos_comments")
        .select("id,nickname,body,created_at", { count: "exact" })
        .eq("note_id", noteId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      toggleComentarios.textContent = t.commentsLabel + " (" + (count || 0) + ")";
      comentarios.replaceChildren();

      if (!data || !data.length) {
        const vazio = document.createElement("p");
        vazio.className = "comments-empty";
        vazio.textContent = t.noComments;
        comentarios.appendChild(vazio);
      } else {
        const lista = document.createElement("div");
        lista.className = "comment-list";
        data.forEach((comentario) => {
          const item = document.createElement("article");
          item.className = "comment-item";
          const topo = document.createElement("div");
          topo.className = "comment-meta";
          const nome = document.createElement("strong");
          nome.textContent = comentario.nickname || t.anonymous;
          const dataComentario = document.createElement("time");
          dataComentario.dateTime = comentario.created_at;
          dataComentario.textContent = formatarData(comentario.created_at, t.locale);
          const corpo = document.createElement("p");
          corpo.textContent = comentario.body;
          topo.append(nome, dataComentario);
          item.append(topo, corpo);
          lista.appendChild(item);
        });
        comentarios.appendChild(lista);
      }

      const form = document.createElement("form");
      form.className = "comment-form";
      const nome = document.createElement("input");
      nome.className = "comment-name";
      nome.type = "text";
      nome.maxLength = 30;
      nome.placeholder = t.namePlaceholder;
      nome.setAttribute("aria-label", t.namePlaceholder);
      try { nome.value = localStorage.getItem("ainos-display-name") || ""; } catch {}
      const texto = document.createElement("textarea");
      texto.maxLength = 500;
      texto.required = true;
      texto.rows = 3;
      texto.placeholder = t.commentPlaceholder;
      texto.setAttribute("aria-label", t.commentPlaceholder);
      const enviar = botao("comment-submit", t.sendComment);
      enviar.type = "submit";
      form.append(nome, texto, enviar);
      form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const body = texto.value.trim();
        const nickname = nome.value.trim().slice(0, 30) || t.anonymous;
        if (!body) return;
        enviar.disabled = true;
        status.textContent = "";
        const { error } = await supabase.from("ainos_comments").insert({
          note_id: noteId,
          nickname,
          body
        });
        if (error) {
          status.textContent = t.interactionError;
          enviar.disabled = false;
          return;
        }
        try { localStorage.setItem("ainos-display-name", nickname); } catch {}
        status.textContent = t.commentSent;
        await carregarComentarios();
        texto.focus();
      });
      comentarios.appendChild(form);
    } catch (erro) {
      comentarios.replaceChildren();
      const falha = document.createElement("p");
      falha.className = "comments-empty";
      falha.textContent = t.interactionUnavailable;
      comentarios.appendChild(falha);
      toggleComentarios.textContent = t.commentsLabel;
    }
  }

  await Promise.all([atualizarReacoes(), atualizarContagemComentarios()]);

  async function atualizarContagemComentarios() {
    try {
      const { count, error } = await supabase
        .from("ainos_comments")
        .select("id", { count: "exact", head: true })
        .eq("note_id", noteId);
      if (error) throw error;
      toggleComentarios.textContent = t.commentsLabel + " (" + (count || 0) + ")";
    } catch {
      toggleComentarios.textContent = t.commentsLabel;
    }
  }
}
