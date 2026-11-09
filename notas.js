// Adicione uma nota no início da lista para que ela apareça primeiro.
// Para marcar um dia bom, inclua diaBom: true na nota correspondente.
// O contador usa automaticamente a data mais recente marcada assim.
// Categoria é opcional: o site tenta identificar pelo texto. Para corrigir uma nota específica, adicione categoria: "trabalho", "jogos", "saude", "social", "cotidiano" ou "outros".
export const notas = [
  { data: "09/11/2026", texto: "Acordei achando q tava morto. Atacou alergia." },
  { data: "08/11/2026", texto: "minha miseria é o entretenimento de vcs. como assim se escreve entretenimento e nao entreterimento." },
  { data: "08/11/2026", texto: "acho incrivel q chego em casa e o meu nariz começa a trancar" },
  { data: "08/11/2026", texto: "Meu chefe atrasou dnv" },
  { data: "08/11/2026", texto: "AI Q VERGONHA. Fui atender uma mulher e ela tava com umas lentes verde, Ela era MT linda. Me virei dps de atender e comentei com os meus colegas meio alto q achei ela bonita, A mulher uns 2 passo da porta e eu achando q ela já tinha saído." },
  { data: "08/11/2026", texto: "TO PRESO NO BANHEIRO. MEU CHEFE TA ATENDENDO E O BANHEIRO É LOGO ATRÁS" },
  { data: "08/11/2026", texto: "Ainos viu o site: 'VAI SE FODER Q ISSO'" },
  { data: "08/11/2026", texto: "Caí no prato de um carnívoro dnv meu deus" },
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
