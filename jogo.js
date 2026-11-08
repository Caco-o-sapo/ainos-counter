import { supabase, obterIdNota, obterVisitanteId } from "./interacoes.js";

const meuId = obterVisitanteId();
const categorias = ["work", "games", "health", "social", "daily", "other"];
const chefes = ["😈", "👾", "🧟", "🐉", "🤡"];

function elemento(tag, classe, texto) {
  const node = document.createElement(tag);
  if (classe) node.className = classe;
  if (texto !== undefined) node.textContent = texto;
  return node;
}

export async function renderizarJogo(notas, categoriaDaNota, t) {
  const root = document.getElementById("gameRoot");
  if (!root) return;
  root.replaceChildren();

  const reclamacoes = notas.filter((nota) => nota.diaBom !== true);
  if (!reclamacoes.length) {
    const aviso = elemento("p", "game-message", t.gameEmpty);
    root.appendChild(aviso);
    return;
  }

  const atual = reclamacoes[0];
  const rodadaAtual = obterIdNota(atual);
  const cabeçalho = elemento("header", "game-heading");
  cabeçalho.append(
    elemento("p", "extra-kicker", t.gameEyebrow),
    elemento("h2", "game-title", t.gameTitle),
    elemento("p", "game-copy", t.gameIntro)
  );
  root.appendChild(cabeçalho);

  const layout = elemento("div", "game-layout");
  const painelChefe = elemento("section", "panel boss-card");
  const painelPalpite = elemento("section", "panel extra-panel bet-card");
  const painelPlacar = elemento("section", "panel extra-panel leaderboard-card");
  layout.append(painelChefe, painelPalpite, painelPlacar);
  root.appendChild(layout);

  painelChefe.setAttribute("aria-labelledby", "bossName");
  const chefeTopo = elemento("div", "boss-top");
  const arte = elemento("div", "boss-avatar", "😈");
  arte.setAttribute("aria-hidden", "true");
  const nomeArea = elemento("div", "boss-title-area");
  nomeArea.append(elemento("p", "extra-kicker", t.bossKicker));
  const nomeChefe = elemento("h3", "boss-name", t.bossNames[0]);
  nomeChefe.id = "bossName";
  nomeArea.appendChild(nomeChefe);
  chefeTopo.append(arte, nomeArea);
  const chefeDescricao = elemento("p", "boss-description", t.bossDescription);
  const vidaLabel = elemento("div", "boss-health-label");
  const hpName = elemento("span", "", t.bossHealth);
  const hpValue = elemento("strong", "", "100%");
  vidaLabel.append(hpName, hpValue);
  const trilho = elemento("div", "boss-health-track");
  trilho.setAttribute("role", "progressbar");
  trilho.setAttribute("aria-label", t.bossHealth);
  trilho.setAttribute("aria-valuemin", "0");
  trilho.setAttribute("aria-valuemax", "100");
  trilho.setAttribute("aria-valuenow", "100");
  const vida = elemento("span", "boss-health-fill");
  trilho.appendChild(vida);
  const estadoChefe = elemento("p", "boss-status", t.gameLoading);
  const contagemDano = elemento("p", "boss-damage", "");
  painelChefe.append(chefeTopo, chefeDescricao, vidaLabel, trilho, estadoChefe, contagemDano);

  painelPalpite.setAttribute("aria-labelledby", "betTitle");
  const apostaHead = elemento("div", "extra-heading");
  const apostaHeading = elemento("div");
  apostaHeading.append(elemento("p", "extra-kicker", t.betKicker));
  const betTitle = elemento("h3", "", t.betTitle);
  betTitle.id = "betTitle";
  apostaHeading.appendChild(betTitle);
  apostaHead.appendChild(apostaHeading);
  const roundLabel = elemento("span", "round-count", "");
  apostaHead.appendChild(roundLabel);
  const instrucoes = elemento("p", "game-copy", t.betInstructions);
  const fieldset = elemento("div", "bet-options");
  fieldset.setAttribute("role", "group");
  fieldset.setAttribute("aria-label", t.betChoose);
  const nameInput = elemento("input", "bet-name");
  nameInput.type = "text";
  nameInput.maxLength = 30;
  nameInput.autocomplete = "nickname";
  nameInput.placeholder = t.nicknamePlaceholder;
  nameInput.setAttribute("aria-label", t.nicknamePlaceholder);
  try { nameInput.value = localStorage.getItem("ainos-game-name") || ""; } catch {}
  const submit = elemento("button", "tool-button bet-submit", t.betSubmit);
  submit.type = "button";
  submit.disabled = true;
  const betStatus = elemento("p", "bet-status");
  betStatus.setAttribute("role", "status");
  painelPalpite.append(apostaHead, instrucoes, fieldset, nameInput, submit, betStatus);

  painelPlacar.setAttribute("aria-labelledby", "leaderboardTitle");
  const placarHead = elemento("div", "extra-heading");
  const placarTitle = elemento("h3", "", t.leaderboardTitle);
  placarTitle.id = "leaderboardTitle";
  placarHead.appendChild(placarTitle);
  const listaPlacar = elemento("ol", "leaderboard-list");
  const seusPontos = elemento("p", "my-score", t.yourScore + ": —");
  painelPlacar.append(placarHead, listaPlacar, seusPontos);

  let categoriaEscolhida = "";
  const botoesCategoria = [];
  categorias.forEach((categoria) => {
    const botao = elemento("button", "bet-option", t.categories[categoria]);
    botao.type = "button";
    botao.dataset.category = categoria;
    botao.setAttribute("aria-pressed", "false");
    botao.addEventListener("click", () => {
      if (submit.disabled && betStatus.dataset.locked === "true") return;
      categoriaEscolhida = categoria;
      botoesCategoria.forEach((item) => {
        const selecionado = item === botao;
        item.classList.toggle("selected", selecionado);
        item.setAttribute("aria-pressed", String(selecionado));
      });
      submit.disabled = false;
    });
    botoesCategoria.push(botao);
    fieldset.appendChild(botao);
  });

  submit.addEventListener("click", async () => {
    if (!categoriaEscolhida || submit.disabled) return;
    submit.disabled = true;
    betStatus.textContent = t.betSending;
    const nickname = nameInput.value.trim().slice(0, 30) || t.defaultAgent;
    const { error } = await supabase.from("ainos_bets").insert({
      round_id: rodadaAtual,
      visitor_id: meuId,
      nickname,
      guess_category: categoriaEscolhida
    });
    if (error) {
      betStatus.textContent = error.code === "23505" ? t.betAlready : t.gameError;
      submit.disabled = false;
      return;
    }
    try { localStorage.setItem("ainos-game-name", nickname); } catch {}
    await renderizarJogo(notas, categoriaDaNota, t);
  });

  try {
    const { data, error } = await supabase
      .from("ainos_bets")
      .select("round_id,visitor_id,nickname,guess_category")
      .limit(5000);
    if (error) throw error;
    const palpites = data || [];
    const indicePorId = new Map();
    reclamacoes.forEach((nota, indice) => {
      const id = obterIdNota(nota);
      if (!indicePorId.has(id)) indicePorId.set(id, indice);
    });

    const resolvidos = [];
    palpites.forEach((palpite) => {
      const indiceBase = indicePorId.get(palpite.round_id);
      if (indiceBase > 0) {
        const notaResposta = reclamacoes[indiceBase - 1];
        const categoriaReal = categoriaDaNota(notaResposta);
        resolvidos.push({ ...palpite, correto: palpite.guess_category === categoriaReal });
      }
    });

    const acertos = resolvidos.filter((palpite) => palpite.correto);
    const totalAcertos = acertos.length;
    const progresso = totalAcertos % 10;
    const chefaoDerrotado = totalAcertos > 0 && progresso === 0;
    const hp = chefaoDerrotado ? 0 : 100 - progresso * 10;
    const indiceChefe = Math.max(0, Math.floor(Math.max(0, totalAcertos - 1) / 10));
    const nomesChefes = t.bossNames;
    const nomeAtual = nomesChefes[indiceChefe % nomesChefes.length];
    nomeChefe.textContent = nomeAtual;
    arte.textContent = chefes[indiceChefe % chefes.length];
    arte.classList.toggle("boss-defeated", chefaoDerrotado);
    hpValue.textContent = hp + "%";
    vida.style.width = hp + "%";
    trilho.setAttribute("aria-valuenow", String(hp));
    estadoChefe.textContent = chefaoDerrotado ? t.bossDefeated : t.bossStatus;
    contagemDano.textContent = t.bossHits(progresso, 10);

    const apostasAtuais = palpites.filter((palpite) => palpite.round_id === rodadaAtual);
    roundLabel.textContent = t.betCount(apostasAtuais.length);
    const meuPalpite = apostasAtuais.find((palpite) => palpite.visitor_id === meuId);
    if (meuPalpite) {
      const rotulo = t.categories[meuPalpite.guess_category] || meuPalpite.guess_category;
      betStatus.textContent = t.betRecorded + " " + rotulo;
      betStatus.dataset.locked = "true";
      nameInput.disabled = true;
      submit.disabled = true;
      botoesCategoria.forEach((botao) => {
        const selecionado = botao.dataset.category === meuPalpite.guess_category;
        botao.disabled = true;
        botao.classList.toggle("selected", selecionado);
        botao.setAttribute("aria-pressed", String(selecionado));
      });
    } else {
      betStatus.textContent = t.betOpen;
    }

    const pontuacao = new Map();
    acertos.forEach((palpite) => {
      const atual = pontuacao.get(palpite.visitor_id) || { nickname: palpite.nickname || t.defaultAgent, points: 0 };
      atual.nickname = palpite.nickname || atual.nickname;
      atual.points++;
      pontuacao.set(palpite.visitor_id, atual);
    });
    const ranking = [...pontuacao.entries()]
      .map(([visitorId, registro]) => ({ visitorId, ...registro }))
      .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname))
      .slice(0, 8);
    listaPlacar.replaceChildren();
    if (!ranking.length) {
      listaPlacar.appendChild(elemento("li", "leaderboard-empty", t.noScores));
    } else {
      ranking.forEach((registro, indice) => {
        const linha = elemento("li", "leaderboard-row");
        const posicao = elemento("span", "leaderboard-rank", String(indice + 1).padStart(2, "0"));
        const nome = elemento("strong", "leaderboard-name", registro.nickname);
        const pontos = elemento("span", "leaderboard-points", String(registro.points));
        linha.append(posicao, nome, pontos);
        if (registro.visitorId === meuId) linha.classList.add("is-you");
        listaPlacar.appendChild(linha);
      });
    }
    const meusAcertos = pontuacao.get(meuId);
    seusPontos.textContent = t.yourScore + ": " + (meusAcertos ? meusAcertos.points : 0);
  } catch (erro) {
    estadoChefe.textContent = t.gameError;
    contagemDano.textContent = t.gameSqlHint;
    betStatus.textContent = t.gameSqlHint;
    submit.disabled = true;
    fieldset.querySelectorAll("button").forEach((botao) => { botao.disabled = true; });
    listaPlacar.replaceChildren(elemento("li", "leaderboard-empty", t.gameSqlHint));
  }
}
