# n8n — Fase 1: Ingestão & Agrupamento

O n8n é o **esqueleto** que dispara e agenda; a inteligência mora no núcleo
(`src/`). O workflow abaixo é fino de propósito: ele só orquestra e chama o
núcleo (via um passo "Execute Command"/serviço que roda `ingestFromDrive`).

## Fluxo dos nós

```
┌──────────────────────┐
│ 1. Google Drive       │  Trigger: "On file created" na pasta /00_inbox
│    Trigger            │  (ou Schedule Trigger a cada 15 min + lista a inbox)
└──────────┬───────────┘
           │  fileId, name, mimeType
           ▼
┌──────────────────────┐
│ 2. Debounce / Wait    │  Espera ~10 min sem novos arquivos para agrupar um
│    (batch da sessão)  │  lote inteiro de uma vez, não arquivo por arquivo.
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 3. Execute Command    │  Chama o núcleo: `node run-ingest.js`
│    (ou HTTP p/ serviço)│ que executa ingestFromDrive() com os adaptadores reais:
│                       │   • baixa cada mídia da inbox
│                       │   • transcreve voz (Whisper)  ── etapa 02
│                       │   • descreve cena (Claude Vision) ── etapa 02
│                       │   • agrupa (Claude)           ── etapa 03
│                       │   • cria pastas + _ideia.md   ── etapa 03
│                       │   • move os arquivos p/ 01_agrupados
└──────────┬───────────┘
           │  { groups, briefs }
           ▼
┌──────────────────────┐
│ 4. Gmail              │  Envia o resumo: "N posts propostos, abra os briefs".
│    (notificação)      │  Um item por post, com link da pasta no Drive.
└──────────────────────┘
```

## Por que "Execute Command" e não montar tudo em nós do n8n

- O agrupamento, a seleção de quadro e o formato do brief são **lógica de produto**
  — melhor versionada em código (`src/`), testável (`npm run demo`) e reusável.
- O n8n fica responsável só pelo que faz bem: gatilho, agenda, retry, e o email.
- Trocar Whisper por outro STT, ou a heurística pelo Claude, é mudar `src/`, sem
  reconstruir o workflow.

## Wrapper `run-ingest.js` (já existe na raiz do projeto)

O nó "Execute Command" chama `node run-ingest.js`. Ele carrega o `.env`, valida
as credenciais, roda `ingestFromDrive()`, loga em stderr e emite o resultado
(JSON) em stdout — pronto para o próximo nó. Suporta:

```bash
node run-ingest.js --check     # valida acesso ao Drive e conta a inbox
node run-ingest.js --dry-run   # analisa e mostra o plano, sem escrever
node run-ingest.js             # executa: cria pastas, escreve briefs, move arquivos
```

Antes de agendar no n8n, rode `--check` e `--dry-run` manualmente uma vez.

## Deploy do n8n (decisão default: self-hosted)

- Docker num VPS simples: `docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n`.
- Credenciais do Google Drive e chaves de API ficam no cofre do n8n / `.env`.
- Alternativa zero-manutenção: n8n Cloud (mais caro, menos flexível).
