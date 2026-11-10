import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
import { notas as notasLegadas } from "./notas.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function paraIso(data) {
  const partes = String(data || "").split("/");
  if (partes.length !== 3) return null;
  return partes[2] + "-" + partes[1].padStart(2, "0") + "-" + partes[0].padStart(2, "0");
}

function paraDataBr(data) {
  if (!data) return "";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return dia + "/" + mes + "/" + ano;
}

function idLegado(nota) {
  if (nota.id) return String(nota.id);
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

function daLinha(row) {
  return {
    id: String(row.id),
    data: paraDataBr(row.data),
    texto: row.texto || "",
    diaBom: row.dia_bom === true,
    categoria: row.categoria || undefined,
    position: row.position || 0
  };
}

export async function listarNotas() {
  const { data, error } = await supabase
    .from("ainos_notes")
    .select("id,data,texto,dia_bom,categoria,position")
    .order("data", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(daLinha);
}

export async function importarNotasLegadas() {
  const registros = notasLegadas.map((nota, position) => ({
    id: idLegado(nota),
    data: paraIso(nota.data),
    texto: String(nota.texto || "").trim(),
    dia_bom: nota.diaBom === true,
    categoria: nota.categoria || null,
    position
  })).filter((nota) => nota.data && nota.texto);
  const { error } = await supabase
    .from("ainos_notes")
    .upsert(registros, { onConflict: "id" });
  if (error) throw error;
  return registros.length;
}

export function notaParaLinha(nota) {
  return daLinha(nota);
}
