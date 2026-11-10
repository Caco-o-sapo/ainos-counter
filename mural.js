
import { supabase } from "./interacoes.js";

const MURAL_NOTE_ID = "ainos-mural-publico";
const POR_PAGINA = 9;
let idioma = "pt-BR";
let postIts = [];
let pagina = 1;
let carregando = false;

const textos = {
  "pt-BR": {
    anonymous: "Anônimo",
    namePlaceholder: "Como quer assinar?",
    textPlaceholder: "Hoje deu ruim porque…",
    loading: "Carregando mural…",
    empty: "O mural está vazio. Seja a primeira pessoa a deixar um post-it.",
    count: (n) => n + (n === 1 ? " post-it" : " post-its"),
    posting: "Colando seu post-it…",
    success: "Post-it no mural!",
    error: "Não foi possível publicar. Tente novamente.",
    loadError: "Não foi possível carregar o mural. Tente atualizar.",
    page: (a, b) => "Página " + a + " de " + b,
    date: "pt-BR"
  },
  en: {
    anonymous: "Anonymous",
    namePlaceholder: "How should we sign it?",
    textPlaceholder: "Today went wrong because…",
    loading: "Loading wall…",
    empty: "The wall is empty. Be the first to leave a sticky note.",
    count: (n) => n + (n === 1 ? " sticky note" : " sticky notes"),
    posting: "Adding your sticky note…",
    success: "Sticky note added!",
    error: "Could not publish. Please try again.",
    loadError: "Could not load the wall. Try refreshing.",
    page: (a, b) => "Page " + a + " of " + b,
    date: "en"
  }
};

function atual() {
  return textos[idioma === "en" ? "en" : "pt-BR"];
}
const $ = (id) => document.getElementById(id);

function atualizarContagem() {
  $("wallCount").textContent = atual().count(postIts.length);
}

function hashCor(valor) {
  let hash = 0;
  for (const caractere of String(valor)) hash = (hash * 31 + caractere.charCodeAt(0)) | 0;
  return Math.abs(hash) % 4;
}

function renderizarMural() {
  const board = $("wallBoard");
  const controles = $("wallPagination");
  if (!board || !controles) return;
  board.replaceChildren();
  atualizarContagem();

  if (!postIts.length) {
    const vazio = document.createElement("p");
    vazio.className = "wall-empty";
    vazio.textContent = atual().empty;
    board.append(vazio);
    controles.hidden = true;
    return;
  }

  const paginas = Math.max(1, Math.ceil(postIts.length / POR_PAGINA));
  pagina = Math.min(pagina, paginas);
  const inicio = (pagina - 1) * POR_PAGINA;
  postIts.slice(inicio, inicio + POR_PAGINA).forEach((post) => {
    const card = document.createElement("article");
    card.className = "postit tone-" + hashCor(post.id);
    const alfinete = document.createElement("span");
    alfinete.className = "postit-pin";
    alfinete.setAttribute("aria-hidden", "true");
    const autor = document.createElement("p");
    autor.className = "postit-author";
    autor.textContent = post.nickname || atual().anonymous;
    const texto = document.createElement("p");
    texto.className = "postit-text";
    texto.textContent = post.body;
    const data = document.createElement("time");
    data.className = "postit-date";
    data.dateTime = post.created_at;
    data.textContent = new Intl.DateTimeFormat(atual().date, { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.created_at));
    card.append(alfinete, autor, texto, data);
    board.append(card);
  });

  controles.hidden = paginas <= 1;
  $("wallPageLabel").textContent = atual().page(pagina, paginas);
  $("wallPrevious").disabled = pagina <= 1;
  $("wallNext").disabled = pagina >= paginas;
}

export function atualizarMuralIdioma(novoIdioma = document.documentElement.lang) {
  idioma = String(novoIdioma).toLowerCase().startsWith("en") ? "en" : "pt-BR";
  const t = atual();
  if ($("wallName")) $("wallName").placeholder = t.namePlaceholder;
  if ($("wallText")) $("wallText").placeholder = t.textPlaceholder;
  if ($("wallCount") && carregando) $("wallCount").textContent = t.loading;
  if ($("wallBoard")) renderizarMural();
}

async function carregarMural() {
  carregando = true;
  $("wallCount").textContent = atual().loading;
  $("wallRefresh").disabled = true;
  const { data, error } = await supabase
    .from("ainos_comments")
    .select("id,nickname,body,created_at")
    .eq("note_id", MURAL_NOTE_ID)
    .order("created_at", { ascending: false })
    .limit(120);
  carregando = false;
  $("wallRefresh").disabled = false;
  if (error) {
    postIts = [];
    $("wallBoard").replaceChildren();
    const aviso = document.createElement("p");
    aviso.className = "wall-empty";
    aviso.textContent = atual().loadError;
    $("wallBoard").append(aviso);
    $("wallCount").textContent = "—";
    $("wallPagination").hidden = true;
    return;
  }
  postIts = data || [];
  pagina = 1;
  renderizarMural();
}

async function publicar(evento) {
  evento.preventDefault();
  const campo = $("wallText");
  const texto = campo.value.trim();
  const nome = $("wallName").value.trim().slice(0, 30);
  const status = $("wallStatus");
  if (!texto) return;
  if (texto.length > 500) {
    status.textContent = atual().error;
    status.className = "wall-status error";
    return;
  }

  const botao = $("wallSubmit");
  botao.disabled = true;
  status.textContent = atual().posting;
  status.className = "wall-status";

  const { error } = await supabase.from("ainos_comments").insert({
    note_id: MURAL_NOTE_ID,
    nickname: nome || atual().anonymous,
    body: texto
  });

  botao.disabled = false;
  if (error) {
    status.textContent = atual().error;
    status.className = "wall-status error";
    return;
  }
  campo.value = "";
  status.textContent = atual().success;
  status.className = "wall-status ok";
  await carregarMural();
}

export function inicializarMural() {
  const form = $("wallForm");
  if (!form || form.dataset.ready === "true") return;
  form.dataset.ready = "true";
  form.addEventListener("submit", publicar);
  $("wallRefresh").addEventListener("click", carregarMural);
  $("wallPrevious").addEventListener("click", () => {
    if (pagina > 1) {
      pagina--;
      renderizarMural();
    }
  });
  $("wallNext").addEventListener("click", () => {
    pagina++;
    renderizarMural();
  });
  carregarMural();
}
