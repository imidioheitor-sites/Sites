# Fase 1 no n8n — orquestração 24/7

Aqui a Fase 1 deixa de ser um comando manual e vira o **loop automático** que o
documento de arquitetura descreve: você joga o material no Drive e **recebe as
pastas prontas + as sugestões por email**, sem tocar em nada.

```
Gatilho (Drive ou agenda) ─▶ HTTP POST /ingest ─▶ tem post novo? ─▶ Gmail
                                    │                                  │
                          serviço instagram-studio            resumo das sugestões
                          (lê a inbox, organiza,              (o que gravar/escrever)
                           devolve JSON + markdown)
```

## Como as peças se encaixam

O **n8n** cuida do gatilho e do envio (vive ligado, tem nós nativos de Drive e
Gmail). A **inteligência** — entender, agrupar, sugerir — mora no serviço
`instagram-studio`, que o n8n chama por HTTP. Cada camada na ferramenta que faz
bem, exatamente como no documento.

> **Importante:** o serviço lê a pasta `00_inbox` **no disco do servidor**. Para
> que ela reflita o Google Drive, sincronize a pasta com **Google Drive para
> Desktop** ou **rclone**. O gatilho de Drive do n8n só avisa "algo mudou"; quem
> lê e organiza os arquivos é o serviço, no disco local sincronizado.

## Passo 1 — subir o serviço

No mesmo servidor (VPS) onde roda o n8n:

```bash
cd instagram-studio
export STUDIO_TOKEN="um-segredo-forte"     # protege o endpoint
export ANTHROPIC_API_KEY="sk-ant-..."      # opcional: liga o agrupamento por IA
export OPENAI_API_KEY="sk-..."             # opcional: transcrição real (Whisper)
export STUDIO_ROOT="/caminho/para/DriveSync/Instagram-Studio"  # a pasta sincronizada
node src/cli.js serve
```

Teste: `curl http://localhost:4599/health` deve responder `{"ok":true,...}`.

Deixe rodando em background (pm2, systemd, `screen`, etc.). Exemplo com pm2:

```bash
STUDIO_TOKEN=... STUDIO_ROOT=... pm2 start "node src/cli.js serve" --name studio
```

## Passo 2 — importar o workflow

Escolha um dos dois (ambos fazem a mesma coisa, mudam só o gatilho):

| Arquivo | Gatilho | Quando usar |
|---|---|---|
| `phase1-schedule.json` | a cada 10 min | **Recomendado.** Simples, não precisa de credencial do Drive no n8n. |
| `phase1-drive-trigger.json` | arquivo novo no Drive | Faithful ao "Gatilhos de Drive"; exige credencial do Google Drive no n8n. |

No n8n: **Workflows → Import from File** → selecione o JSON.

## Passo 3 — ajustar 3 coisas depois de importar

Credenciais e segredos nunca vêm no arquivo — configure na mão:

1. **Nó `studio /ingest` (HTTP Request)**
   - `url`: aponte para o serviço (ex.: `http://localhost:4599/ingest?move=1`).
     Use `?move=1` para mover as mídias para as pastas dos posts; tire o `move`
     para deixar os originais na inbox.
   - Header `x-studio-token`: cole o mesmo valor de `STUDIO_TOKEN`.

2. **Nó `Gmail: enviar sugestões`**
   - Selecione sua credencial do Gmail (OAuth2).
   - `sendTo`: seu email.
   - Assunto e corpo já vêm preenchidos do serviço (`{{ $json.subject }}` e
     `{{ $json.suggestions }}`).

3. **Só no `phase1-drive-trigger.json`:**
   - Selecione a credencial do Google Drive.
   - `folderToWatch`: cole o ID da pasta `00_inbox` no Drive.

Ative o workflow. Pronto — Fase 1 rodando sozinha.

## O que o serviço devolve

`POST /ingest` responde JSON assim (é o que o n8n usa):

```json
{
  "ok": true,
  "mode": "claude",
  "count": 2,
  "subject": "Instagram-Studio — 2 post(s) prontos: Review de livro, Dicas de estudo",
  "suggestions": "# Sugestões de posts — ...markdown...",
  "groups": [
    {
      "folder": "post_2026-07-24_review-livro",
      "template": "review-livro",
      "templateNome": "Review de livro",
      "ideia": "Parece um Review de livro.",
      "pedido": "Foto do livro, sua resenha falada e a nota.",
      "arquivos": ["review-livro-capa.jpg", "resenha-falada.m4a"]
    }
  ]
}
```

O nó **Tem post novo?** só deixa passar para o Gmail quando `count > 0`, então
gatilhos em inbox vazia não geram email.

## Fase 2 — edição por template no n8n

Mesma ideia da Fase 1, um degrau adiante: quando você **aprova** um post (move a
pasta para `02_aprovados/` e solta a `legenda.txt`), o n8n dispara a edição e te
manda o cronograma.

```
Gatilho (aprovação no Drive ou agenda) ─▶ HTTP POST /edit ─▶ editou algo novo? ─▶ Gmail
                                              │                                    │
                                    edita os posts novos,                 resumo + cronograma
                                    monta o cronograma                   (o que foi editado e quando)
```

Workflows (mesma estrutura, muda o gatilho):

| Arquivo | Gatilho | Quando usar |
|---|---|---|
| `phase2-schedule.json` | a cada 15 min | **Recomendado.** Sem credencial de Drive; roda o `/edit` idempotente. |
| `phase2-drive-trigger.json` | arquivo novo em `02_aprovados/` | Dispara na hora que você aprova; exige credencial do Google Drive. |

**Importante — ffmpeg no servidor.** A Fase 2 renderiza vídeo. Instale **ffmpeg**
na máquina do serviço; sem ele, o `/edit` gera o plano + `render.sh` mas não
produz o `reel.mp4`. O `/edit` é **idempotente**: posts já editados são pulados
(`novos` conta só os desta rodada), então tanto o gatilho por arquivo quanto o
agendado são seguros de repetir. Para refazer um post, chame `POST /edit?force=1`.

Ajustes após importar: o nó **`studio /edit`** (URL + `x-studio-token`), o nó
**Gmail** (credencial + `sendTo`; assunto/corpo vêm de `{{ $json.subject }}` e
`{{ $json.summary }}`), e — só no drive-trigger — a credencial do Drive + o ID da
pasta `02_aprovados`.

### O que `POST /edit` devolve

```json
{
  "ok": true,
  "count": 2,
  "novos": 1,
  "subject": "Instagram-Studio — 2 post(s) editado(s) e agendado(s)",
  "summary": "# Posts editados & agendados — ...markdown...",
  "cronograma": [
    { "post": "post_2026-07-24_review-livro", "formato": "reel", "quando": "sáb., 25/07, 19:00", "iso": "2026-07-25T19:00:00.000Z" }
  ],
  "posts": [
    { "post": "post_2026-07-24_review-livro", "template": "review-livro", "saida": "reel",
      "dimensao": "1080x1920", "outputs": ["reel.mp4", "capa.jpg"], "pendencias": 2, "pulado": false }
  ]
}
```

O nó **Editou algo novo?** libera o Gmail só quando `novos > 0` — rodadas sem
aprovação nova não geram email.

## Postagem — agendar no Metricool

Último elo: pegar o cronograma da Fase 2 e agendar de verdade no Metricool.

```
Agenda ─▶ HTTP POST /publish ─▶ tem o que agendar? ─▶ Gmail (resultado)
              │
   lê 03_editados/cronograma.json, monta o payload do Metricool
   (legenda sua + mídia editada), agenda e verifica
```

Workflow: **`phase2-publish-schedule.json`** (a cada 30 min → `POST /publish`).

**Pré-requisitos (seus):**

1. **Plano do Metricool com API.** O acesso à API é de planos pagos. Pegue o
   `userToken` em **Configurações → API**, e o `blogId`/`userId` da marca
   (ou liste com `GET /api/v2/settings/brands`).
2. **Instagram conectado como Business/Creator** no Metricool — necessário para
   auto-publicar (`autoPublish: true`).
3. **URL pública para a mídia.** O Metricool baixa o arquivo por URL. Duas opções:
   - Ligue `metricool.publicBaseUrl` no config + `STUDIO_MEDIA_TOKEN`: o serviço
     serve `GET /media/<post>/<arquivo>?token=…` e monta a URL sozinho. A URL
     precisa ser alcançável pelo Metricool (proxy reverso/túnel no VPS).
   - Ou coloque um `media-url.txt` (uma URL por linha) na pasta do post em
     `03_editados/` — útil se você usa links públicos do Drive.
4. **Variáveis no serviço:** `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID`,
   `METRICOOL_BLOG_ID` (e `STUDIO_MEDIA_TOKEN` se usar a opção de servir mídia).

Sem `METRICOOL_USER_TOKEN`, `/publish` roda em **dry-run**: devolve o payload
exato que enviaria, sem tocar no Metricool — dá para testar tudo antes.

### O que `POST /publish` devolve

```json
{
  "ok": true,
  "count": 2,
  "agendados": 2,
  "dryRun": false,
  "subject": "Instagram-Studio — 2/2 post(s) agendados no Metricool",
  "summary": "# Agendamento no Metricool — ...markdown...",
  "results": [
    { "post": "post_2026-07-24_review-livro", "quando": "sáb., 25/07, 19:00",
      "igType": "REEL", "status": "agendado", "httpStatus": 200,
      "mediaUrls": ["https://studio.seudominio.com/media/post_.../reel.mp4?token=…"] }
  ]
}
```

> O Metricool responde **200 mesmo em falha silenciosa** — por isso o serviço
> também guarda a resposta em `03_editados/agendamentos.json`. Confira sempre o
> calendário do Metricool antes da publicação.

## Segurança

- Defina sempre `STUDIO_TOKEN` num VPS — sem ele o endpoint fica aberto.
- Mantenha o serviço em `localhost` (ou rede interna) e deixe o n8n falar com ele
  por ali; não exponha a porta na internet.
