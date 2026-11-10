import { supabase } from "./notas-store.js";
import { importarNotasLegadas, listarNotas } from "./notas-store.js";

const $ = (id) => document.getElementById(id);
const loginPanel = $("loginPanel");
const adminPanel = $("adminPanel");
const loginStatus = $("loginStatus");
const adminStatus = $("adminStatus");
let notas = [];
let notaEditando = null;
let emailAtual = "";

function mostrarStatus(elemento, mensagem, tipo = "") {
  elemento.textContent = mensagem;
  elemento.className = "status" + (tipo ? " " + tipo : "");
}

function dataHoje() {
  const agora = new Date();
  return agora.getFullYear() + "-" + String(agora.getMonth() + 1).padStart(2, "0") + "-" + String(agora.getDate()).padStart(2, "0");
}
$("noteDate").value = dataHoje();

function paraIso(dataBr) {
  const [dia, mes, ano] = String(dataBr || "").split("/");
  return ano && mes && dia ? ano + "-" + mes.padStart(2, "0") + "-" + dia.padStart(2, "0") : "";
}
function obterId(nota) {
  if (nota.id) return String(nota.id);
  const texto = (nota.data || "") + "|" + (nota.texto || "");
  let a = 2166136261, b = 2246822519;
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    a = Math.imul(a ^ codigo, 16777619);
    b = Math.imul(b ^ codigo, 3266489917);
  }
  return "n-" + (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}

function resetarEditor() {
  notaEditando = null;
  $("noteForm").reset();
  $("noteDate").value = dataHoje();
  $("editorTitle").textContent = "Adicionar ocorrência";
  $("cancelEdit").hidden = true;
}

function prepararEdicao(nota) {
  notaEditando = nota;
  $("noteDate").value = paraIso(nota.data);
  $("noteText").value = nota.texto || "";
  $("noteGood").checked = nota.diaBom === true;
  $("noteCategory").value = nota.categoria || "";
  $("editorTitle").textContent = "Editar ocorrência";
  $("cancelEdit").hidden = false;
  $("noteForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function botao(rotulo, acao, classe = "button") {
  const elemento = document.createElement("button");
  elemento.type = "button";
  elemento.className = classe;
  elemento.textContent = rotulo;
  elemento.addEventListener("click", acao);
  return elemento;
}

function renderizarNotas() {
  const lista = $("noteList");
  lista.replaceChildren();
  $("noteCount").textContent = notas.length + (notas.length === 1 ? " ocorrência cadastrada" : " ocorrências cadastradas");
  if (!notas.length) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "O arquivo ainda está vazio. Use “Importar notas atuais” para carregar as notas existentes do notas.js.";
    lista.append(vazio);
    return;
  }
  notas.forEach((nota) => {
    const linha = document.createElement("article");
    linha.className = "row";
    const principal = document.createElement("div");
    principal.className = "row-main";
    const titulo = document.createElement("p");
    titulo.className = "row-title";
    titulo.textContent = (nota.diaBom ? "☀ DIA BOM · " : "") + (nota.data || "Sem data") + (nota.categoria ? " · " + nota.categoria : " · categoria automática");
    const texto = document.createElement("p");
    texto.className = "row-text";
    texto.textContent = nota.texto;
    principal.append(titulo, texto);
    const acoes = document.createElement("div");
    acoes.className = "row-actions";
    acoes.append(
      botao("Editar", () => prepararEdicao(nota)),
      botao("Apagar", async () => {
        if (!confirm("Apagar esta ocorrência? Os comentários vinculados também deixarão de aparecer associados a uma nota.")) return;
        const { error } = await supabase.from("ainos_notes").delete().eq("id", nota.id);
        if (error) return mostrarStatus(adminStatus, "Não foi possível apagar: " + error.message, "error");
        await carregarNotas();
        mostrarStatus(adminStatus, "Ocorrência apagada.", "ok");
      }, "danger")
    );
    linha.append(principal, acoes);
    lista.append(linha);
  });
}

async function carregarNotas() {
  try {
    notas = await listarNotas();
    renderizarNotas();
  } catch (error) {
    mostrarStatus(adminStatus, "Erro ao carregar notas. Confira se executou supabase-admin.sql: " + error.message, "error");
  }
}

async function carregarAdministradores() {
  const lista = $("adminList");
  lista.replaceChildren();
  const { data, error } = await supabase.from("ainos_admin_allowlist").select("email,created_at").order("email");
  if (error) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Não foi possível carregar a lista: " + error.message;
    lista.append(vazio);
    return;
  }
  if (!data.length) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Nenhum e-mail autorizado.";
    lista.append(vazio);
    return;
  }
  data.forEach((registro) => {
    const linha = document.createElement("article");
    linha.className = "row admin-row";
    const email = document.createElement("span");
    email.textContent = registro.email;
    const remover = botao("Remover", async () => {
      if (!confirm("Remover " + registro.email + " do acesso administrativo?")) return;
      const { error: rpcError } = await supabase.rpc("set_ainos_admin_email", { p_email: registro.email, p_allowed: false });
      if (rpcError) return mostrarStatus(adminStatus, "Não foi possível remover: " + rpcError.message, "error");
      await carregarAdministradores();
      mostrarStatus(adminStatus, "Acesso removido.", "ok");
    }, "danger");
    linha.append(email, remover);
    lista.append(linha);
  });
}

async function carregarComentarios() {
  const lista = $("commentList");
  lista.replaceChildren();
  const { data, error } = await supabase.from("ainos_comments").select("id,note_id,nickname,body,created_at").order("created_at", { ascending: false }).limit(100);
  if (error) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Não foi possível carregar comentários: " + error.message;
    lista.append(vazio);
    return;
  }
  if (!data.length) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Nenhum comentário no arquivo.";
    lista.append(vazio);
    return;
  }
  data.forEach((comentario) => {
    const linha = document.createElement("article");
    linha.className = "row";
    const principal = document.createElement("div");
    principal.className = "row-main";
    const titulo = document.createElement("p");
    titulo.className = "row-title";
    titulo.textContent = (comentario.nickname || "Anônimo") + " · " + new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(comentario.created_at));
    const texto = document.createElement("p");
    texto.className = "row-text comment";
    texto.textContent = comentario.body;
    const relacao = document.createElement("p");
    relacao.className = "muted small";
    relacao.textContent = "Nota: " + comentario.note_id;
    principal.append(titulo, texto, relacao);
    const remover = botao("Apagar", async () => {
      if (!confirm("Apagar este comentário?")) return;
      const { error: deleteError } = await supabase.from("ainos_comments").delete().eq("id", comentario.id);
      if (deleteError) return mostrarStatus(adminStatus, "Não foi possível apagar: " + deleteError.message, "error");
      await carregarComentarios();
      mostrarStatus(adminStatus, "Comentário apagado.", "ok");
    }, "danger");
    linha.append(principal, remover);
    lista.append(linha);
  });
}

async function abrirPainel(user) {
  emailAtual = user.email || "";
  const { data, error } = await supabase.rpc("claim_ainos_admin_access");
  if (error || data !== true) {
    loginPanel.hidden = false;
    adminPanel.hidden = true;
    mostrarStatus(loginStatus, "Esta conta ainda não está autorizada. Peça a um administrador para adicionar " + emailAtual + " à lista.", "error");
    return;
  }
  loginPanel.hidden = true;
  adminPanel.hidden = false;
  $("signedInAs").textContent = "Conectado como " + emailAtual;
  await Promise.all([carregarNotas(), carregarAdministradores(), carregarComentarios()]);
}

$("loginForm").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarStatus(loginStatus, "Entrando…");
  const { error } = await supabase.auth.signInWithPassword({
    email: $("email").value.trim().toLowerCase(),
    password: $("password").value
  });
  if (error) return mostrarStatus(loginStatus, "Não foi possível entrar: " + error.message, "error");
  const { data } = await supabase.auth.getUser();
  await abrirPainel(data.user);
});

$("forgotPassword").addEventListener("click", async () => {
  const email = $("email").value.trim().toLowerCase();
  if (!email) return mostrarStatus(loginStatus, "Informe seu e-mail para receber o link de redefinição.", "error");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) return mostrarStatus(loginStatus, "Não foi possível enviar o link: " + error.message, "error");
  mostrarStatus(loginStatus, "Se esse e-mail tiver uma conta, o Supabase enviará um link de redefinição.", "ok");
});

$("showSignup").addEventListener("click", async () => {
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  if (!email || password.length < 8) return mostrarStatus(loginStatus, "Preencha o e-mail e uma senha com pelo menos 8 caracteres.", "error");
  mostrarStatus(loginStatus, "Criando conta…");
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) return mostrarStatus(loginStatus, "Não foi possível criar a conta: " + error.message, "error");
  mostrarStatus(loginStatus, "Conta criada. Confirme o e-mail e depois entre. O acesso só é liberado se esse e-mail tiver sido autorizado por um administrador.", "ok");
});

$("noteForm").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const data = $("noteDate").value;
  const texto = $("noteText").value.trim();
  if (!data || !texto) return mostrarStatus(adminStatus, "Preencha a data e o texto da ocorrência.", "error");
  const payload = {
    id: notaEditando?.id || crypto.randomUUID(),
    data,
    texto,
    dia_bom: $("noteGood").checked,
    categoria: $("noteCategory").value || null,
    position: notaEditando?.position || 0,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("ainos_notes").upsert(payload, { onConflict: "id" });
  if (error) return mostrarStatus(adminStatus, "Não foi possível salvar: " + error.message, "error");
  resetarEditor();
  await carregarNotas();
  mostrarStatus(adminStatus, "Ocorrência salva. O site já pode carregá-la.", "ok");
});

$("cancelEdit").addEventListener("click", resetarEditor);
$("adminForm").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const email = $("adminEmail").value.trim().toLowerCase();
  const { error } = await supabase.rpc("set_ainos_admin_email", { p_email: email, p_allowed: true });
  if (error) return mostrarStatus(adminStatus, "Não foi possível autorizar: " + error.message, "error");
  $("adminForm").reset();
  await carregarAdministradores();
  mostrarStatus(adminStatus, "E-mail autorizado. A pessoa pode criar a própria conta em /admin.html e confirmar o e-mail.", "ok");
});

$("importLegacy").addEventListener("click", async () => {
  if (!confirm("Importar e atualizar as notas atuais do notas.js? Nenhuma nota já salva no banco será apagada.")) return;
  mostrarStatus(adminStatus, "Importando notas…");
  try {
    const quantidade = await importarNotasLegadas();
    await carregarNotas();
    mostrarStatus(adminStatus, quantidade + " notas importadas/atualizadas. Você pode continuar editando pelo painel.", "ok");
  } catch (error) {
    mostrarStatus(adminStatus, "Não foi possível importar: " + error.message, "error");
  }
});

$("signOut").addEventListener("click", async () => {
  await supabase.auth.signOut();
  adminPanel.hidden = true;
  loginPanel.hidden = false;
  mostrarStatus(loginStatus, "Você saiu do painel.");
});
$("refreshComments").addEventListener("click", carregarComentarios);

const { data: sessionData } = await supabase.auth.getSession();
if (sessionData.session?.user) await abrirPainel(sessionData.session.user);
