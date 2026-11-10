import { notas as notasLegadas } from "../notas.js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../supabase-config.js";

function idNotaLegada(nota) {
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

function escapar(valor) {
  return String(valor || "").replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[caractere]);
}

async function carregarNota(id) {
  try {
    const resposta = await fetch(
      SUPABASE_URL + "/rest/v1/ainos_notes?select=id,data,texto,dia_bom&id=eq." + encodeURIComponent(id) + "&limit=1",
      { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY }, cache: "no-store" }
    );
    if (resposta.ok) {
      const [nota] = await resposta.json();
      if (nota) return {
        id: String(nota.id),
        data: nota.data ? nota.data.split("-").reverse().join("/") : "",
        texto: nota.texto || ""
      };
    }
  } catch {}
  return notasLegadas.find((nota) => idNotaLegada(nota) === id) || null;
}

function paginaErro(status, mensagem) {
  return new Response(mensagem, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(request) {
  const pedido = new URL(request.url);
  const id = pedido.searchParams.get("nota") || "";
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return paginaErro(400, "Link de ocorrência inválido.");

  const nota = await carregarNota(id);
  if (!nota) return paginaErro(404, "Esta ocorrência não foi encontrada.");
  const relato = String(nota.texto || "Sem texto").replace(/\s+/g, " ").trim();
  const resumo = relato.length > 220 ? relato.slice(0, 217).trimEnd() + "…" : relato;
  const titulo = "AINOS WATCH · Ocorrência de " + (nota.data || "data não informada");
  const descricao = "“" + resumo + "”";
  const canonical = new URL("/api/share", pedido.origin);
  canonical.searchParams.set("nota", id);
  const imagem = new URL("/api/og", pedido.origin);
  imagem.searchParams.set("nota", id);
  imagem.searchParams.set("v", "1");
  const destino = new URL("/", pedido.origin);
  destino.searchParams.set("nota", id);
  destino.hash = "panel-archive";

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descricao)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(descricao)}">
<meta property="og:url" content="${escapar(canonical.href)}">
<meta property="og:image" content="${escapar(imagem.href)}">
<meta property="og:image:secure_url" content="${escapar(imagem.href)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapar(descricao)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapar(titulo)}">
<meta name="twitter:description" content="${escapar(descricao)}">
<meta name="twitter:image" content="${escapar(imagem.href)}">
<meta http-equiv="refresh" content="0;url=${escapar(destino.href)}">
</head>
<body>
<p>Abrindo a ocorrência… <a href="${escapar(destino.href)}">Continuar para o Ainos Watch</a></p>
<script>location.replace(${JSON.stringify(destino.href)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
