# HEsites Estudos — guia para quem for editar

Site de estudo do Heitor (University of Notre Dame): uma página por matéria, com as provas, o que cai, tópicos, fórmulas, flashcards, simulado e plano de estudo.

- No ar: https://hesites-estudos.vercel.app
- Fonte: pasta `estudos-nd/` do repo `imidioheitor-sites/sites`, branch `claude/project-thread-fxzhg5`
- Publicação: fluxo n8n **"HELU | Publicar estudos ND"** (id `CyMirTpW1YVe1QeK`); conferência: "HELU | Conferir site de estudos ND" (id `QrzvfduVcLCTLHH3`)

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
4. Rode o fluxo n8n `CyMirTpW1YVe1QeK` (MCP do n8n: `execute_workflow`, modo manual, gatilho "Publicar agora"). Ele lê a pasta inteira direto do GitHub, não precisa listar arquivos.
5. Confira: o proxy da sessão bloqueia *.vercel.app, então rode o fluxo `QrzvfduVcLCTLHH3` (busca as páginas e devolve o status).

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
  "imagem": "/assets/img/acct-20100.jpg",   // capa da matéria (card da home e topo da página); opcional
  "links": [{ "titulo": "Canvas", "url": "https://..." }],
  "provas": [
    {
      "id": "exam-2",             // único na matéria; vira o #âncora da URL
      "nome": "Exam 2",
      "imagem": "/assets/img/acct-20100-exam-2.jpg",   // faixa no topo da aba da prova; opcional
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

## Fotos (Higgsfield)

Cada matéria tem uma capa (`imagem`) e cada prova pode ter a sua (`provas[].imagem`). Padrão: foto editorial gerada no Higgsfield (modelo `gpt_image_2_5`, 16:9), paleta Meia-noite, **sem texto dentro da imagem**. Se a foto não existir, o bloco some sozinho.

As fotos **não ficam no repositório**: a sessão do Claude não consegue baixar do CDN do Higgsfield. O caminho é:

1. Gerar no Higgsfield (MCP `generate_image_batch`) e pegar os `result_url`.
2. No n8n, abrir **"HELU | Preparar imagens estudos ND"** (id `0RBrgWzMde7UqPqM`), pôr a lista `{ arquivo, url }` no nó "Uma por item" e rodar. Ele baixa, reduz para jpg de 1600px (uns 70 KB), sobe na Vercel e devolve o manifesto.
3. Acrescentar o resultado em `dados/imagens.json` (arquivo, sha, size, origem) e apontar `imagem` no JSON da matéria para `/` + arquivo.
4. Validar, push e publicar. O fluxo de publicar inclui no deploy as fotos listadas em `dados/imagens.json`.

Se um deploy falhar dizendo que falta arquivo na Vercel, rode de novo o "Preparar imagens" com as `origem` de `dados/imagens.json`.

## Publicar

Fluxo n8n "HELU | Publicar estudos ND": o nó **Pedido** tem os padrões `ref` (branch), `pasta` e `projeto` (Vercel `hesites-estudos`, time helu1). Ele pega o último commit da branch e sobe a pasta toda, menos arquivos `.md` e `ferramentas/`, mais as fotos de `dados/imagens.json`. Código do fluxo: `/mnt/project-files/estudos-nd/publicar-estudos.ts`. O conector Vercel do Claude não escreve no time helu1, por isso a publicação passa pelo n8n.
