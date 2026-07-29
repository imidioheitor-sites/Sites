# n8n — Fase 2/4: Postagem automática

Publica no horário do cronograma o que você já aprovou. O guarda garante que
nada vai ao ar sem a sua legenda/capa.

```
┌───────────────────────┐
│ 1. Schedule Trigger    │  a cada 1h (ou no início do dia)
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 2. Execute Command     │  node run-publish.js
│                        │   • lê 02_aprovados/ no Drive
│                        │   • deriva o quadro de cada pasta
│                        │   • monta o cronograma e filtra o que está no prazo
│                        │   • barra o que falta legenda/capa (regra de ouro)
│                        │   • posta via Metricool os prontos
│                        │   • registra folderName → mediaId na store
└──────────┬────────────┘
           │  { posted, blocked }
           ▼
┌───────────────────────┐
│ 3. Gmail (opcional)    │  avisa "X postados, Y aguardando você"
└───────────────────────┘
```

Antes de agendar: rode `node run-publish.js --check` e `--dry-run` na mão.

**Pendência de produção:** o Metricool posta a partir de URLs de mídia
acessíveis. É preciso hospedar os arquivos editados (03_editados) e preencher
`mediaUrls` em `run-publish.js`. Alternativa: trocar por `GraphPublisher`
(postagem direta pela Graph API — ver `src/adapters/publisher.js`).
