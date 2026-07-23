# Instagram Studio — Fase 1

Automatizador de Instagram que **organiza, entende, edita, agenda e posta** o
conteúdo que **você** cria — e nunca cria o conteúdo publicado no seu lugar.

Esta pasta contém a **Fase 1**: a fundação de tudo. Você joga fotos e vídeos
soltos numa pasta do Google Drive; o sistema transcreve a voz, entende a cena,
**agrupa o que combina em posts** e escreve um _brief_ (`_ideia.md`) que te dá a
ideia e pede a criação.

> 🔒 **Regra de ouro:** a IA organiza, entende, edita por template, agenda, posta
> e analisa. Toda **criação** (legenda, capa, fala, imagem) é sua. Os briefs dão
> **direção** (perguntas/ângulos), nunca legenda pronta.

## Rodar o demo (zero dependências, zero credenciais)

```bash
cd instagram-studio
node demo.js
```

Ele lê `fixtures/sample-inbox.json` (um dia de material bruto já "analisado"),
roda o agrupamento e escreve as pastas propostas + `_ideia.md` em `./out/`.
Abra qualquer `out/01_agrupados/*/_ideia.md` para ver um brief real.

Exemplo de saída: 9 arquivos soltos → 6 posts (rotina do dia, review de livro,
quickstart de matéria, comentário de notícia, dica de estudo, e 1 "a classificar").

## Como mapeia na arquitetura

| Etapa | Onde está | Estado |
|---|---|---|
| 01 · Captura no Drive | `adapters/drive.js` → `listInbox` | pronto (precisa de credencial) |
| 02 · Voz + Visão | `adapters/transcribe.js`, `adapters/vision.js` | pronto (precisa de chaves) |
| 03 · Agrupamento | `grouping.js` (heurística) · `adapters/claude.js` (Claude) | **funcionando offline** |
| 03 · Cria pastas + brief | `ideaBrief.js`, `pipeline.js` | **funcionando offline** |
| 04 · Move p/ 01_agrupados | `pipeline.js` → `ingestFromDrive` | pronto (precisa de credencial) |

O agrupamento tem dois motores: uma **heurística determinística** (roda sem rede,
é o que o demo usa) e o **Claude** (`useClaude: true`) para produção, com mais
nuance. O prompt do Claude (`prompts.js`) carrega a regra de ouro no system.

## Estrutura

```
instagram-studio/
├── demo.js                  # roda a Fase 1 offline contra fixtures
├── fixtures/sample-inbox.json
├── src/
│   ├── quadros.js           # os 5 quadros como templates nomeados
│   ├── grouping.js          # agrupamento heurístico (reconhece o quadro)
│   ├── ideaBrief.js         # gera _ideia.md (dá a ideia, pede a criação)
│   ├── prompts.js           # prompt de agrupamento do Claude (regra de ouro)
│   ├── pipeline.js          # orquestrador (planFromAssets / ingestFromDrive)
│   ├── types.js             # modelo de dados (JSDoc)
│   └── adapters/
│       ├── drive.js         # Google Drive (listar, criar pasta, mover)
│       ├── transcribe.js    # voz → texto (Whisper)
│       ├── vision.js        # cena → tags + resumo (Claude Vision + ffmpeg)
│       └── claude.js        # agrupamento via Claude
└── n8n/phase1-ingest.md     # como o n8n orquestra este núcleo
```

## Os quadros

Cada quadro do perfil vira um template nomeado em `src/quadros.js`:
**O que vou fazer no dia**, **Comentário sobre notícia (tech/empreendedorismo)**,
**Dicas de estudo**, **Review de livro** e **Quickstart de matéria**. Cada um
define o que o robô aplica (capa, formato, legendas, trilha) e o que **você**
precisa criar. Adicione/edite quadros ali.

## Modo produção (live)

Ainda não conectado — precisa de decisões e credenciais suas.

### Pré-requisitos
1. **Conta Instagram Profissional** (Business/Creator) ligada a uma **Página do
   Facebook** — obrigatório para postagem automática oficial (Fases 2–4).
2. **Google Drive**: uma pasta do estúdio com `00_inbox/`, `01_agrupados/`,
   `02_aprovados/`, `03_editados/`, `04_publicados/`, e uma **service account**
   com acesso a ela.
3. Chaves: `ANTHROPIC_API_KEY` (Claude) e `OPENAI_API_KEY` (Whisper).
4. `ffmpeg` no PATH (extração de keyframes para a visão).

### Setup
```bash
cp .env.example .env      # preencha as chaves e os IDs das pastas
npm i @anthropic-ai/sdk googleapis openai fluent-ffmpeg
```
Depois, um wrapper `run-ingest.js` (ver `n8n/phase1-ingest.md`) chama
`ingestFromDrive()` com os adaptadores reais — e o n8n dispara isso a cada lote.

## Roadmap

- **Fase 1 — ingestão & agrupamento** ← _você está aqui_ (núcleo funcionando)
- **Fase 2** — edição por template dos quadros + cronograma + postagem (MVP via
  Metricool/Publer)
- **Fase 3** — relatórios de performance por email (Graph Insights → Claude → Gmail)
- **Fase 4** — Graph API própria (postagem 100% autônoma) + recomendações de trend

Documento de arquitetura completo (visual): veja o artifact gerado na conversa.
