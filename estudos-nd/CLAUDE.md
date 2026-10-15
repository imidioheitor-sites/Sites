# HEsites Estudos — guia para quem for editar

Site de estudo do Heitor (University of Notre Dame): uma página por matéria, com as provas, o que cai, tópicos, fórmulas, flashcards, simulado e plano de estudo.

- No ar: https://hesites-estudos.vercel.app
- Fonte: pasta `estudos-nd/` do repo `imidioheitor-sites/sites`, branch `claude/project-thread-fxzhg5`
- Publicação: fluxo n8n **"HELU | Publicar estudos ND"** (ver abaixo)

## Regra principal

**Conteúdo é só JSON.** Para adaptar o site a uma prova, edite apenas `dados/`. Não mexa em `index.html`, `materia.html` nem `assets/` a não ser que o Heitor peça mudança de layout.

```
dados/materias.json            lista de matérias (ordem = ordem no site)
dados/materias/<slug>.json     tudo de uma matéria
ferramentas/validar.mjs        confere os JSON (rode antes de publicar)
```

## Fluxo para atualizar uma prova

1. Edite `dados/materias/<slug>.json` (ou crie um novo e acrescente o slug em `dados/materias.json`).
2. `node ferramentas/validar.mjs` até dar "Tudo certo".
3. Commit e push na branch acima.
4. Rode o fluxo n8n "HELU | Publicar estudos ND" (MCP do n8n: `execute_workflow`). Ele lê a pasta inteira direto do GitHub, não precisa listar arquivos.
5. Abra `https://hesites-estudos.vercel.app/m/<slug>` e confira.

## Formato de uma matéria

```jsonc
{
  "slug": "acct-20100",           // igual ao nome do arquivo; minúsculas e hífen
  "codigo": "ACCT 20100",
  "nome": "Accountancy I",
  "professor": "Prof. Fulano",
  "creditos": 3,
  "cor": "#7C5CFF",               // destaque da matéria (#RRGGBB). Paleta: #7C5CFF #3DDC97 #FFB547 #FF6B8A #5CC8FF #A48CFF
  "exemplo": false,               // true mostra a etiqueta "exemplo"
  "resumo": "Uma ou duas frases.",
  "links": [{ "titulo": "Canvas", "url": "https://..." }],
  "provas": [
    {
      "id": "exam-2",             // único na matéria; vira o #âncora da URL
      "nome": "Exam 2",
      "data": "2026-10-29",       // AAAA-MM-DD; hora local de South Bend
      "hora": "19:00",
      "local": "DeBartolo 101",
      "status": "proxima",        // "proxima" ou "feita" (sem status: vira "feita" depois da data)
      "nota": null,               // nota tirada, aparece quando status = feita
      "peso": 25,                 // % da nota final
      "formato": "25 MC + 3 problemas, 75 min",
      "permitido": "Calculadora simples",
      "foco": "Parágrafo curto: o que mais cai.",
      "topicos": [
        { "titulo": "Adjusting entries", "peso": "alto", "resumo": "...", "pontos": ["...", "..."], "exemplo": "..." }
      ],
      "formulas": [ { "nome": "COGS", "latex": "\\text{COGS} = BI + P - EI", "quando": "Sistema periódico." } ],
      "flashcards": [ { "frente": "Pergunta", "verso": "Resposta" } ],
      "questoes": [ { "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "correta": 1, "explicacao": "..." } ],
      "plano": [ { "dia": "2026-10-20", "tarefa": "..." } ],
      "dicas": ["..."]
    }
  ]
}
```

Todos os campos de uma prova, fora `id` e `nome`, são opcionais; a seção some se o campo estiver vazio.

### Texto

Campos de texto aceitam `**negrito**`, `` `código` `` e fórmula inline `$z = (x-\\mu)/\\sigma$` (KaTeX; no JSON a barra invertida é dupla). Dinheiro como `US$ 10` não vira fórmula. `formulas[].latex` é exibida em destaque; use `expr` para texto simples.

### Cuidados

- `topicos[].titulo` e `flashcards[].frente` são a chave do progresso salvo no navegador do Heitor. Mudar o texto zera a marcação daquele item; corrija só se precisar.
- `questoes[].correta` começa em 0.
- `topicos[].peso`: `alto`, `medio` ou `baixo`.
- Não coloque login, senha nem dado pessoal da universidade aqui: o site é público (só não aparece no Google).
- Conteúdo escrito em português, termos técnicos em inglês como aparecem na matéria.

## Publicar

Fluxo n8n "HELU | Publicar estudos ND": nó **Config** tem `ref` (branch), `pasta` e `projeto` (Vercel `hesites-estudos`, time helu1). O conector Vercel do Claude não escreve no time helu1, por isso a publicação passa pelo n8n.
