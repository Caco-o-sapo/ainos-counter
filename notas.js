// Adicione uma nota no início da lista para que ela apareça primeiro.
// Para marcar um dia bom, inclua diaBom: true na nota correspondente.
// O contador usa automaticamente a data mais recente marcada assim.
// Categoria é opcional: o site tenta identificar pelo texto. Para corrigir uma nota específica, adicione categoria: "trabalho", "jogos", "saude", "social", "cotidiano" ou "outros".
export const notas = [
  { data: "08/11/2026", texto: "Tava atendendo o cliente. Falei 'o que seria para o senhor'. Fechou a cara cmg. 'onde já se viu chamar puto de senhor'. CAI NA GARGALHADA" },
  { data: "08/11/2026", texto: "Eu vivendo o pesadelo de vcs" },
  { data: "08/11/2026", texto: "Será q eu faço um copo de vodka pra mim 😞" },
  { data: "07/11/2026", texto: "Moranguete, Abacatudo, 67, 42 sigma farmando aura no passinho do sabor" },
  { data: "07/11/2026", texto: "Sticker elsa bunduda bunda grande andando" },
  { data: "06/11/2026", diaBom: true, texto: "Dia Bom: 'AQUELA AMIGA Q GANHOU O SEGUNDO DIA DE FOLGA, DEUS É BOM'" },
  { data: "06/11/2026", texto: "Quase mandei minhas horas extras aqui." },
  { data: "05/11/2026", texto: "To Jantando Porra." },
  { data: "05/11/2026", texto: "Hoje o Ainos reclamou que tava com dor de cabeça e do chefe." },
  { data: "04/11/2026", texto: "Reclamou de má sorte no jogo gacha: meu top baniu a lux do meu suporte, reclamou q ele pegou seraphine e dps pickou mf" }
];

const diasBons = notas
  .filter((nota) => nota.diaBom === true && nota.data)
  .map((nota) => {
    const [dia, mes, ano] = nota.data.split("/");
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  })
  .sort((a, b) => b.localeCompare(a));

export const ultimoDiaBom = diasBons[0] || null;
