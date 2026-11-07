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

export default function gerarPreview() {
  const dias = Math.max(
    0,
    Math.floor((paraUtc(dataDeHojeEmSaoPaulo()) - paraUtc(ultimoDiaBom)) / 86400000)
  );
  const ultimaNota = notas[0];
  const textoNota = ultimaNota?.texto
    ? (ultimaNota.texto.length > 132 ? ultimaNota.texto.slice(0, 129) + "…" : ultimaNota.texto)
    : "Nenhuma ocorrência registrada até agora.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 64px",
          color: "#f3eee7",
          background: "radial-gradient(ellipse at 15% 0%, #452b2d 0%, #191a20 48%, #101116 100%)",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1px solid #75503d", background: "#30241f", color: "#ffc887", fontSize: 28, fontWeight: 800 }}>A</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: "#f3eee7", fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>AINOS WATCH</div>
              <div style={{ marginTop: 5, color: "#aaa6a3", fontSize: 15 }}>Central comunitária de monitoramento</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "1px solid #485344", borderRadius: 99, color: "#c0d9c1", background: "#202820", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>MONITORAMENTO ATIVO</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ color: "#f4ad69", fontSize: 17, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Relatório de acompanhamento</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 12 }}>
              <div style={{ color: "#ffc887", fontSize: 154, lineHeight: 1, fontWeight: 800, letterSpacing: -10 }}>{dias}</div>
              <div style={{ color: "#d0c6bd", fontSize: 31, fontWeight: 600 }}>{dias === 1 ? "dia" : "dias"}</div>
            </div>
            <div style={{ color: "#d0c6bd", fontSize: 25 }}>desde o último dia bom do Ainos</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 410, padding: 25, border: "1px solid #403941", borderRadius: 18, background: "#17171d" }}>
            <div style={{ color: "#f4ad69", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Última ocorrência · {ultimaNota?.data || "sem data"}</div>
            <div style={{ marginTop: 13, color: "#e4ded8", fontSize: 22, lineHeight: 1.4 }}>“{textoNota}”</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #34343b", paddingTop: 17, color: "#8e898b", fontSize: 15 }}>
          <div>Humor entre amigos · Dados sujeitos a reclamação.</div>
          <div>Departamento de Azar · Verba: R$ 0,00</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      }
    }
  );
}
