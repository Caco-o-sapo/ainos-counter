# 🫡 Central Oficial de Monitoramento do Ainos

> Um projeto de utilidade pública duvidosa para acompanhar os dias bons — e registrar as reclamações do nosso querido Ainos.

## 📡 O que é isso?

Um site estático de zoeira que mostra há quantos dias o Ainos não tem um dia bom e mantém um registro das reclamações mais recentes.

O contador atualiza sozinho. As reclamações ficam no arquivo `notas.js`, separado do HTML para ninguém precisar mexer na estrutura do site toda vez que surgir um novo episódio.

## 🗂️ Arquivos do projeto

```text
.
├── index.html   # Página, visual e contador
├── notas.js     # Reclamações registradas
└── README.md    # Este manual importantíssimo
```

## 📝 Como adicionar uma reclamação

1. Abra o arquivo `notas.js` no GitHub.
2. Adicione uma nova linha **no começo da lista**:

   ```js
   { data: "06/11/2026", texto: "A reclamação mais recente do Ainos." },
   ```

3. Salve/commite a alteração no GitHub.
4. Atualize o site e confira o registro histórico. 📋

A lista deve ficar neste formato:

```js
window.notas = [
  { data: "06/11/2026", texto: "A reclamação mais recente do Ainos." },
  { data: "05/11/2026", texto: "Uma reclamação anterior." }
];
```

Use a data no formato `DD/MM/AAAA` e mantenha as reclamações mais novas no topo. Não esqueça a vírgula entre os registros. Se a frase tiver aspas duplas, escreva `\"` dentro do texto.

## 🔄 Como zerar o contador

Quando acontecer um dia bom — evento raro, mas não impossível — atualize a data no `index.html`:

```js
const ultimoDiaBom = new Date(2026, 10, 5);
```

O formato é `new Date(ano, mês, dia)`. **Janeiro é mês `0`, fevereiro é `1`… novembro é `10`.**

## ⚠️ Aviso da auditoria

Este projeto é público: qualquer pessoa com o link pode ler as anotações. Mantenha as reclamações no espírito da brincadeira e evite publicar informações pessoais que o Ainos não gostaria de ver por aí.

---

**Status:** monitoramento ativo  
**Equipe responsável:** o grupo do Discord  
**Orçamento:** R$ 0,00  
**Perspectiva de um dia bom:** sob análise
