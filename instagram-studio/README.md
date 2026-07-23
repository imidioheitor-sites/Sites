# Automatizador de Instagram — Fases 1 e 2

Você despeja o material bagunçado; o sistema **entende** (voz + visão), **agrupa**
em posts completos, **sugere** o template (Fase 1), **edita** por template e
**agenda** nos melhores horários (Fase 2) — mas **nunca cria** a legenda, a fala
ou a imagem. Isso é sempre seu.

> Fundação do pipeline descrito no documento de arquitetura. As fases seguintes
> (postagem via Graph API, relatórios) se conectam a partir das pastas que estas
> fases mantêm.

## A regra de ouro

A IA organiza, entende e sugere. **Toda criação mora com você.** Cada post agrupado
vem com um `_ideia.md` que diz "isto parece um *Review de livro*, template X — me
manda a legenda e a capa". A máquina só potencializa o processo de publicar o que
você fez.

## O que roda hoje

```
FASE 1  inbox ─▶ transcrição (Whisper) ─▶ visão (Claude) ─▶ agrupamento (Claude)
                                                                   │
                                              01_agrupados/  pastas + _ideia.md + post.json
                                                                   │
                                    VOCÊ aprova: move p/ 02_aprovados/ + legenda.txt
                                                                   │
FASE 2  edição por template (ffmpeg) ─▶ 03_editados/ (reel/slides + capa) ─▶ cronograma.json
```

A Fase 1 funciona **sem nenhuma chave de API** em modo heurístico (agrupa por
proximidade de tempo + palavras-chave); com as chaves, o Claude raciocina de
verdade. A Fase 2 funciona **sem ffmpeg** gerando o *plano de edição* + um
`render.sh` executável; com ffmpeg presente, renderiza de verdade.

## Uso

```bash
cd instagram-studio

node src/cli.js scaffold        # cria o esquema de pastas
# jogue fotos/vídeos/áudios em studio-data/Instagram-Studio/00_inbox/
node src/cli.js ingest --move   # FASE 1: organiza e move as mídias para cada post
# você aprova: move a pasta p/ 02_aprovados/ e adiciona legenda.txt
node src/cli.js edit            # FASE 2: edita por template + monta o cronograma
node src/cli.js status          # quantos itens há em cada pasta
node src/cli.js serve           # sobe o serviço HTTP para o n8n chamar
```

Requer **Node 18+** (usa `fetch` e `FormData` nativos). Sem dependências obrigatórias.
A Fase 2 usa **ffmpeg** quando presente; sem ele, gera o plano + `render.sh`.

## Rodando sozinho (n8n) — a Fase 1 completa

O comando manual acima já organiza e sugere. Para o loop automático que o
documento define — **você joga no Drive e recebe as pastas + sugestões por email,
sem tocar em nada** — suba o serviço e importe um dos workflows do n8n:

```bash
STUDIO_TOKEN=um-segredo node src/cli.js serve   # expõe POST /ingest
```

Depois importe `n8n/phase1-schedule.json` (ou `n8n/phase1-drive-trigger.json`) no
seu n8n. O passo a passo completo está em **[`n8n/README.md`](n8n/README.md)**.

## Fase 2 — edição por template & cronograma

Depois que você **aprova** um post (move a pasta de `01_agrupados/` para
`02_aprovados/` e escreve a legenda do feed), o `edit` faz a parte mecânica:

1. lê o `post.json` (sabe o template) e classifica a mídia (vídeo/imagem/áudio);
2. monta o **plano de edição** por template — 9:16 para Reels, 4:5 para carrossel,
   lower-third/capa, cortes, e a composição certa (ex.: **foto + narração** para
   um review de livro);
3. escreve `plano-de-edicao.md` (legível) e `render.sh` (executável) em
   `03_editados/`; com ffmpeg presente, já **renderiza** o `reel.mp4`/slides + capa;
4. monta um `cronograma.json` encaixando cada post no melhor horário por formato.

**O que você coloca na pasta ao aprovar:**

| Arquivo | Obrigatório? | O quê |
|---|---|---|
| `legenda.txt` | recomendado | a legenda do feed — **sua**, a IA nunca escreve |
| `capa.txt` | opcional | título do lower-third/capa (ex.: `O Efeito Composto — 9/10`) |
| `trilha.mp3` | opcional | trilha de fundo (o passo final mistura em volume baixo) |
| `*.srt` | opcional | legendas com timestamps para queimar (caption dinâmica) |

Passos que dependem de assets ainda não fornecidos (trilha, caption palavra a
palavra, bullets animados) saem marcados como **planejados** no plano, com a
instrução do que falta — o robô nunca inventa esse conteúdo.

> O cronograma usa horários-padrão por formato. A **Fase 3 (relatórios)** troca
> esses horários pelos seus números reais de engajamento.

## Esquema de pastas

```
studio-data/Instagram-Studio/
├─ 00_inbox/            você joga tudo aqui, sem pensar
├─ 01_agrupados/        criado automaticamente (Fase 1)
│  └─ post_2026-07-24_review-livro/
│     ├─ review-livro-capa.jpg
│     ├─ resenha-falada.m4a
│     ├─ resenha-falada.m4a.transcricao.txt   (gerado)
│     ├─ _ideia.md                            (sugestão do Claude p/ você)
│     └─ post.json                            (manifesto p/ a Fase 2)
├─ 02_aprovados/        você move quando OK + legenda.txt (capa.txt opcional)
├─ 03_editados/         saída da Fase 2
│  ├─ cronograma.json                         (melhores horários)
│  └─ post_2026-07-24_review-livro/
│     ├─ plano-de-edicao.md                   (passos legíveis)
│     ├─ render.sh                            (executável com ffmpeg)
│     ├─ reel.mp4 / slide-*.jpg               (se ffmpeg presente)
│     └─ capa.jpg
└─ 04_publicados/       arquivo do que já foi ao ar (fase 4)
```

## Configuração

Copie `config.example.json` para `config.json` e ajuste, ou use variáveis de ambiente
(têm prioridade):

| O quê | Variável | Sem ela |
|---|---|---|
| Raiz do estúdio | `STUDIO_ROOT` | `./studio-data/Instagram-Studio` |
| Inteligência (agrupar/sugerir/visão) | `ANTHROPIC_API_KEY` | modo heurístico |
| Transcrição de fala | `OPENAI_API_KEY` | placeholder de transcrição |

O agrupamento por IA usa `claude-opus-4-8`. O SDK `@anthropic-ai/sdk` é uma
dependência **opcional**: se não estiver instalado, o pipeline roda em modo
heurístico sem quebrar. Para ligar a IA de verdade:

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...        # opcional, para transcrição real
node src/cli.js ingest
```

## Os quadros → templates

Seus formatos viram templates nomeados que o agrupador reconhece e o editor
(fase 2) vai saber aplicar:

| id | Quadro | Saída (Fase 2) | Você entrega |
|---|---|---|---|
| `agenda-do-dia` | O que vou fazer no dia | reel 9:16, capa "AGENDA", trilha enérgica | a fala do plano do dia |
| `comentario-noticia` | Comentário sobre notícia | reel 9:16, lower-third da notícia | sua opinião gravada |
| `dicas-de-estudo` | Dicas de estudo | carrossel 4:5 + capa da série | a dica e a gravação |
| `review-livro` | Review de livro | reel 9:16 (foto + narração), capa título/nota | foto do livro, resenha falada, a nota |
| `quickstart-materia` | Quickstart de matéria | reel 9:16 "aula rápida", capa numerada | a explicação gravada |

Cada template carrega uma spec de render (`render` em `src/lib/templates.js`):
formato de saída, dimensão, estilo de capa, trilha e tipo de legenda.

## Como isto se conecta ao n8n

Cada peça é um adaptador isolado; o `serve` amarra tudo num endpoint que o n8n chama:

- **gatilho** → nó de Drive "arquivo novo" (ou agenda) → `POST /ingest`
- **transcrição** → `src/lib/transcribe.js` (Whisper via HTTP)
- **visão** → `src/lib/vision.js` (Claude vision)
- **agrupamento** → `src/lib/group.js` (Claude, com fallback heurístico)
- **serviço HTTP** → `src/server.js` (o que o n8n chama; devolve JSON + markdown)
- **entrega** → nó Gmail do n8n envia o `suggestions` markdown

Em produção 24/7 você quer as APIs por baixo (como aqui), não um MCP amarrado a
uma sessão. Os workflows prontos estão em [`n8n/`](n8n/).

## Estrutura do código

```
src/
├─ cli.js              entrada (scaffold | ingest | edit | status | serve)
├─ server.js           serviço HTTP para o n8n (POST /ingest)
├─ config.js           carrega config + variáveis de ambiente
├─ scaffold.js         cria/mantém o esquema de pastas
├─ pipeline.js         FASE 1 — orquestra a ingestão
├─ edit.js             FASE 2 — orquestra a edição por template
├─ notify/email.js     monta o resumo das sugestões
└─ lib/
   ├─ media.js         detecta mídia na inbox
   ├─ transcribe.js    Whisper (adapter)
   ├─ vision.js        Claude vision (adapter)
   ├─ group.js         agrupamento (Claude + heurística)
   ├─ claude.js        cliente Anthropic (carregado sob demanda)
   ├─ templates.js     os quadros + specs de render
   ├─ render.js        monta o plano de edição (ffmpeg) por template
   ├─ ffmpeg.js        adapter de ffmpeg (detecta, monta e roda)
   ├─ schedule.js      cronograma por melhores horários
   └─ log.js           log
n8n/                   workflows importáveis + guia de setup
```
