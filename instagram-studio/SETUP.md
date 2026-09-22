# Tutorial — o que falta VOCÊ fazer

Toda a lógica está construída e testada (42 testes, todos os fluxos rodando
offline). O que resta é **integração**: coisas que exigem as suas contas e chaves
— nada que eu consiga fazer por você. Este guia é a lista + o passo a passo, na
ordem de fazer.

> Regra que o sistema respeita em todas as fases: a IA organiza, edita por
> template, agenda, posta e mede. **A criação (legenda, capa, fala) é sempre sua.**

---

## Visão rápida: pronto x falta você

| # | O que falta você fazer | Por quê |
|---|---|---|
| 1 | Deixar o Instagram **Profissional + ligado a uma Página do Facebook** | Pré-requisito de postagem e Insights |
| 2 | Gerar as **chaves de API** (Anthropic, OpenAI, Google, Metricool, Meta) | São segredos — só você cria |
| 3 | **Compartilhar a pasta do Drive** com a service account | Pra o código enxergar as pastas |
| 4 | `cp .env.example .env` e **preencher** | Ligar tudo |
| 5 | `npm i` das dependências de produção | Ativar os adaptadores |
| 6 | Rodar `--check` → `--dry-run` → live, fase a fase | Validar com segurança |
| 7 | Subir o **n8n** e agendar os wrappers | Deixar rodando sozinho |

---

## 1. Conta do Instagram (5 min)

1. No app do Instagram: **Configurações → Conta → Mudar para conta profissional**
   (escolha *Criador* ou *Empresa*).
2. Crie/ível uma **Página do Facebook** e **conecte** a conta do Instagram a ela
   (Configurações da Página → Instagram → Conectar conta).

Sem isso, postagem automática oficial e Insights **não funcionam**.

## 2. As chaves (por serviço)

Pegue na ordem das fases — não precisa de todas de uma vez. **Nunca cole essas
chaves em chat; elas vão só no `.env`** (que está no `.gitignore`).

**Fase 1 (ingestão + agrupamento):**
- `ANTHROPIC_API_KEY` → [console.anthropic.com](https://console.anthropic.com) → *API Keys*.
- `OPENAI_API_KEY` → [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (Whisper).
- **Service account Google** → [console.cloud.google.com](https://console.cloud.google.com):
  crie projeto → ative **Google Drive API** → *IAM & Admin → Service Accounts →
  Create* → *Keys → Add Key → JSON*. Salve o JSON; aponte
  `GOOGLE_APPLICATION_CREDENTIALS` para o caminho dele.
- (Gmail, opcional p/ relatório) ative a **Gmail API** no mesmo projeto e dê o
  escopo `gmail.send`.

**Fase 2 (postagem — MVP):**
- `METRICOOL_TOKEN` + `METRICOOL_BLOG_ID` → conta no
  [metricool.com](https://metricool.com), conecte o Instagram, *Settings → API*.

**Fase 3/4 (Insights e postagem oficial):**
- `IG_USER_ID` + `IG_ACCESS_TOKEN` → [developers.facebook.com](https://developers.facebook.com):
  crie um App → adicione *Instagram Graph API* → gere um token de longa duração.
  Para postar, peça a permissão **`instagram_content_publish`** (passa por App
  Review + verificação de negócio).

## 3. Compartilhar a pasta do Drive (1 min)

A estrutura `Instagram-Studio/` já foi criada no seu Drive. Abra a pasta →
**Compartilhar** → adicione o **email da service account** (algo como
`nome@projeto.iam.gserviceaccount.com`) como *Editor*. Sem isso, o código
autentica mas não vê as pastas.

## 4. Preencher o `.env`

```bash
cd instagram-studio
cp .env.example .env
```

Os IDs das pastas do Drive já foram criados — cole os que te passei no chat:
```env
DRIVE_ROOT_FOLDER_ID=1RUKKrIdmKOhRKc3-lt-X4weJRVAAmi_B
DRIVE_INBOX_FOLDER_ID=10OwMX1UvsJ0bsKd_dlD0hTgm-vPR53_f
DRIVE_AGRUPADOS_FOLDER_ID=1s8RSO7WUTRwe0VTpDm5f2ckIKIAtYTaC
DRIVE_APROVADOS_FOLDER_ID=1LE3oslI5CI11I8BnyNKxQgv3PS2K_ReO
STUDIO_STORE=./data/store.json
```
Preencha o resto (chaves) conforme for avançando de fase.

## 5. Instalar dependências

```bash
npm i @anthropic-ai/sdk googleapis openai
```
(`ffmpeg` precisa estar no PATH para renderizar vídeo — `apt install ffmpeg` /
`brew install ffmpeg`.)

## 6. Rodar fase a fase (sempre check → dry-run → live)

**Fase 1 — ingestão**
```bash
node run-ingest.js --check     # confirma que a service account vê a /00_inbox
node run-ingest.js --dry-run   # joga uns arquivos na inbox e veja o agrupamento
node run-ingest.js             # cria pastas, escreve _ideia.md, move arquivos
```
Depois, abra `01_agrupados/*/_ideia.md`, escreva sua `legenda.txt`, (capa se
pedir) e mova a pasta para `02_aprovados/`.

**Fase 2 — postagem**
```bash
node run-publish.js --check    # o que está pronto x barrado (esperando você)
node run-publish.js --dry-run  # simula
node run-publish.js            # posta via Metricool os prontos e no prazo
```

**Fase 3 — relatório**
```bash
node run-report.js --dry-run   # escreve out/report.html (não envia)
node run-report.js             # envia o email pelo Gmail
```

**Fase 4 — recomendações**
```bash
node run-recommend.js --dry-run
node run-recommend.js          # trends reais (RSS) + seus dados
```

## 7. Colocar no n8n

Suba o n8n (Docker num VPS):
```bash
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```
Crie 4 workflows, cada um com um *Schedule Trigger* + *Execute Command*
chamando um dos `run-*.js`. Detalhes de cada fluxo em `n8n/`:
`phase1-ingest.md`, `phase2-publish.md`, `phase3-report.md`, `phase4-recommend.md`.

## Hospedagem de mídia (já resolvida)

O Metricool/Graph postam a partir de URLs públicas. Isso já está automatizado:
no modo live, o `run-publish.js` usa `DriveMediaHost` para tornar cada mídia
acessível por link e preencher `mediaUrls` sozinho — sem bucket extra. Se um
vídeo grande cair na tela de aviso do Google Drive, dá para trocar por um bucket
(S3/GCS/R2) sem mudar o resto (o contrato `publicUrl()` é o mesmo).

---

## Checklist final

- [ ] Instagram Profissional + Página do Facebook
- [ ] `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` no `.env`
- [ ] Service account criada + **pasta do Drive compartilhada** com ela
- [ ] `node run-ingest.js --check` retorna OK
- [ ] `METRICOOL_TOKEN` + `BLOG_ID` (ou Graph API) para postar
- [ ] `IG_USER_ID` + `IG_ACCESS_TOKEN` para Insights/recomendações
- [ ] 4 workflows no n8n agendados

Me manda o resultado do primeiro `run-ingest.js --check` (ou qualquer erro) que
eu destravou o resto com você.
