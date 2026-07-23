# Onde colocar os seus inputs

Um mapa único de tudo que **você** fornece e o lugar exato de cada coisa.
Rode `node src/cli.js doctor` a qualquer momento para ver o que falta.

## 1. Segredos e chaves → um arquivo só: `.env`

Copie `.env.example` para `.env` e preencha. Deixe em branco o que não tiver —
o bot roda em dry-run/heurístico sem quebrar.

| Você quer… | Preencha no `.env` | Sem isso |
|---|---|---|
| Agrupamento por IA + análise do relatório | `ANTHROPIC_API_KEY` | heurística |
| Transcrição real da fala | `OPENAI_API_KEY` | placeholder |
| Proteger o serviço p/ o n8n | `STUDIO_TOKEN` | endpoint aberto |
| Agendar no Metricool | `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID`, `METRICOOL_BLOG_ID` | `/publish` vira dry-run |
| Token da URL de mídia p/ o Metricool | `STUDIO_MEDIA_TOKEN` | usa `STUDIO_TOKEN` |

Ajustes não-secretos (timezone, `publicBaseUrl`, autoPublish) ficam em
`config.json` (copie de `config.example.json`).

## 2. Inputs criativos → na pasta de cada post

Quando você **aprova** um post (move de `01_agrupados/` para `02_aprovados/`),
a pasta já vem com um `legenda.txt` de rascunho. Preencha estes arquivos:

| Arquivo | Obrigatório? | O quê |
|---|---|---|
| `legenda.txt` | p/ publicar | a legenda do feed — **sua**. Linhas com `# ` (espaço) são ajuda e são ignoradas; hashtags `#assim` ficam. |
| `capa.txt` | opcional | título do lower-third/capa (ex.: `O Efeito Composto — 9/10`) |
| `trilha.mp3` | opcional | trilha de fundo |
| `*.srt` | opcional | legendas com timestamps para queimar |
| `media-url.txt` | opcional | URL(s) pública(s) da mídia p/ o Metricool (1 por linha), se não usar `publicBaseUrl` |

## 3. Seus números → `relatorios/insights.json` (Fase 3)

Cole as métricas dos posts publicados aqui (veja `relatorios/insights.example.json`).
O `report` analisa e atualiza os melhores horários automaticamente.

Campos por post: `post`, `formato` (`reel`/`carrossel`), `publishedAt` (ISO),
`views`, `reach`, `likes`, `comments`, `saves`, `shares`, `retentionPct` (opcional).

## O fluxo completo

```
1. inbox           você joga a mídia bruta em 00_inbox/
2. ingest          → 01_agrupados/ (pastas + _ideia.md + legenda.txt em branco)
3. VOCÊ            preenche legenda.txt e move p/ 02_aprovados/
4. edit            → 03_editados/ (reel/slides + cronograma.json)
5. publish         agenda no Metricool
6. VOCÊ            cola os números em relatorios/insights.json
7. report          → relatório + melhores-horarios.json (volta ao passo 4)
```

Cada passo tem um comando (`node src/cli.js <passo>`) e um endpoint HTTP para o
n8n rodar sozinho. Veja `n8n/README.md`.
