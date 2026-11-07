import { createElement as h } from "react";
import { ImageResponse } from "@vercel/og";
import { notas, ultimoDiaBom } from "../notas.js";

function dataDeHojeEmSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value;
  return [valor("year"), valor("month"), valor("day")].join("-");
}

function paraUtc(dataIso) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function bloco(style, ...children) {
  return h("div", { style }, ...children);
}

export function GET() {
  const dias = Math.max(
    0,
    Math.floor((paraUtc(dataDeHojeEmSaoPaulo()) - paraUtc(ultimoDiaBom)) / 86400000)
  );
  const ultimaNota = notas[0];
  const textoNota = ultimaNota?.texto
    ? (ultimaNota.texto.length > 132 ? ultimaNota.texto.slice(0, 129) + "…" : ultimaNota.texto)
    : "Nenhuma ocorrência registrada até agora.";

  const imagem = bloco({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "52px 64px",
    color: "#f3eee7",
    background: "radial-gradient(ellipse at 15% 0%, #452b2d 0%, #191a20 48%, #101116 100%)",
    fontFamily: "Arial, sans-serif"
  },
    bloco({ display: "flex", justifyContent: "space-between", alignItems: "center" },
      bloco({ display: "flex", alignItems: "center", gap: 16 },
        bloco({ display: "flex", width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1px solid #75503d", background: "#30241f", color: "#ffc887", fontSize: 28, fontWeight: 800 }, "A"),
        bloco({ display: "flex", flexDirection: "column" },
          bloco({ color: "#f3eee7", fontSize: 22, fontWeight: 800, letterSpacing: 2 }, "AINOS WATCH"),
          bloco({ marginTop: 5, color: "#aaa6a3", fontSize: 15 }, "Central comunitária de monitoramento")
        )
      ),
      bloco({ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "1px solid #485344", borderRadius: 99, color: "#c0d9c1", background: "#202820", fontSize: 14, fontWeight: 700, letterSpacing: 1 }, "MONITORAMENTO ATIVO")
    ),

    bloco({ display: "flex", alignItems: "center", gap: 70 },
      bloco({ display: "flex", flexDirection: "column", flex: 1 },
        bloco({ color: "#f4ad69", fontSize: 17, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }, "Relatório de acompanhamento"),
        bloco({ display: "flex", alignItems: "baseline", gap: 18, marginTop: 12 },
          bloco({ color: "#ffc887", fontSize: 154, lineHeight: 1, fontWeight: 800, letterSpacing: -10 }, String(dias)),
          bloco({ color: "#d0c6bd", fontSize: 31, fontWeight: 600 }, dias === 1 ? "dia" : "dias")
        ),
        bloco({ color: "#d0c6bd", fontSize: 25 }, "desde o último dia bom do Ainos")
      ),
      bloco({ display: "flex", flexDirection: "column", width: 410, padding: 25, border: "1px solid #403941", borderRadius: 18, background: "#17171d" },
        bloco({ color: "#f4ad69", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }, "Última ocorrência · " + (ultimaNota?.data || "sem data")),
        bloco({ marginTop: 13, color: "#e4ded8", fontSize: 22, lineHeight: 1.4 }, "“" + textoNota + "”")
      )
    ),

    bloco({ display: "flex", justifyContent: "space-between", borderTop: "1px solid #34343b", paddingTop: 17, color: "#8e898b", fontSize: 15 },
      bloco({}, "Humor entre amigos · Dados sujeitos a reclamação."),
      bloco({}, "Departamento de Azar · Verba: R$ 0,00")
    )
  );

  return new ImageResponse(imagem, {
    width: 1200,
    height: 630,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    }
  });
}
