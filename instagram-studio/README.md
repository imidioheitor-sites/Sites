# Automatizador de Instagram — Fase 1

Ingestão & organização automática do Drive. Você despeja o material bagunçado;
o sistema **entende** (voz + visão), **agrupa** em posts completos e **sugere** o
template — mas **nunca cria** a legenda, a fala ou a imagem. Isso é sempre seu.

> Esta é a fundação do pipeline descrito no documento de arquitetura. As fases
> seguintes (edição por template, agendamento, postagem via Graph API, relatórios)
> se conectam a partir das pastas que esta fase mantém.

## A regra de ouro

A IA organiza, entende e sugere. **Toda criação mora com você.** Cada post agrupado
vem com um `_ideia.md` que diz "isto parece um *Review de livro*, template X — me
manda a legenda e a capa". A máquina só potencializa o processo de publicar o que
você fez.

## O que roda hoje

```
inbox bagunçada ──▶ transcrição (Whisper) ──▶ visão (Claude) ──▶ agrupamento (Claude)
                                                                        │
                                                          pastas por post + _ideia.md
                                                                        │
                                                              _sugestoes.md (o "email")
```

Funciona **sem nenhuma chave de API** em modo heurístico: agrupa por proximidade de
tempo de gravação + palavras-chave dos seus quadros. Com as chaves, o Claude passa a
raciocinar de verdade sobre o conteúdo.

## Uso

```bash
cd instagram-studio

node src/cli.js scaffold        # cria o esquema de pastas
# jogue fotos/vídeos/áudios em studio-data/Instagram-Studio/00_inbox/
node src/cli.js ingest          # organiza (mantém os originais na inbox)
node src/cli.js ingest --move   # organiza e move as mídias para cada post
node src/cli.js status          # quantos itens há em cada pasta
node src/cli.js serve           # sobe o serviço HTTP para o n8n chamar
```

Requer **Node 18+** (usa `fetch` e `FormData` nativos). Sem dependências obrigatórias.

## Rodando sozinho (n8n) — a Fase 1 completa

O comando manual acima já organiza e sugere. Para o loop automático que o
documento define — **você joga no Drive e recebe as pastas + sugestões por email,
sem tocar em nada** — suba o serviço e importe um dos workflows do n8n:

```bash
STUDIO_TOKEN=um-segredo node src/cli.js serve   # expõe POST /ingest
```

Depois importe `n8n/phase1-schedule.json` (ou `n8n/phase1-drive-trigger.json`) no
seu n8n. O passo a passo completo está em **[`n8n/README.md`](n8n/README.md)**.

## Esquema de pastas

```
studio-data/Instagram-Studio/
├─ 00_inbox/            você joga tudo aqui, sem pensar
├─ 01_agrupados/        criado automaticamente
│  └─ post_2026-07-24_review-livro/
│     ├─ review-livro-capa.jpg
│     ├─ resenha-falada.m4a
│     ├─ resenha-falada.m4a.transcricao.txt   (gerado)
│     └─ _ideia.md                            (sugestão do Claude p/ você)
├─ 02_aprovados/        você move quando OK + capa/legenda
├─ 03_editados/         saída do editor por template (fase 2)
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

| id | Quadro | O robô faz | Você entrega |
|---|---|---|---|
| `agenda-do-dia` | O que vou fazer no dia | corta clipes da manhã, legenda, capa "AGENDA" | a fala do plano do dia |
| `comentario-noticia` | Comentário sobre notícia | sugere a notícia, monta lower-third | sua opinião gravada |
| `dicas-de-estudo` | Dicas de estudo | bullets animados + capa da série | a dica e a gravação |
| `review-livro` | Review de livro | capa com título/nota, cortes, trilha calma | foto do livro, resenha falada, a nota |
| `quickstart-materia` | Quickstart de matéria | formato "aula rápida", capa numerada | a explicação gravada |

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
├─ cli.js              entrada (scaffold | ingest | status | serve)
├─ server.js           serviço HTTP para o n8n (POST /ingest)
├─ config.js           carrega config + variáveis de ambiente
├─ scaffold.js         cria/mantém o esquema de pastas
├─ pipeline.js         orquestra a ingestão
├─ notify/email.js     monta o resumo das sugestões
└─ lib/
   ├─ media.js         detecta mídia na inbox
   ├─ transcribe.js    Whisper (adapter)
   ├─ vision.js        Claude vision (adapter)
   ├─ group.js         agrupamento (Claude + heurística)
   ├─ claude.js        cliente Anthropic (carregado sob demanda)
   ├─ templates.js     os quadros
   └─ log.js           log
n8n/                   workflows importáveis + guia de setup
```
