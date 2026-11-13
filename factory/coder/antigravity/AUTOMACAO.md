# Acionar o Antigravity automaticamente (sem colar nada)

Testado em 2026-11-11 no PC do Heitor (Windows 11, Antigravity com language_server 2.29.1).

## Como funciona
O Antigravity traz uma CLI headless: `resources\bin\language_server.exe agentapi`
(atalho: `%USERPROFILE%\.gemini\antigravity\bin\agentapi.bat`). Ela fala com o daemon que o app abre.

Comandos: `new-conversation [--model=flash_lite|flash|pro] [--title=...] [--profile=...] <prompt>`,
`send-message <conversation_id> <texto>`, `get-conversation-metadata <conversation_id>`.

Ela precisa de duas variaveis de ambiente, lidas de
`%USERPROFILE%\.gemini\antigravity\daemon\hub_<porta>.json` (campos `httpPort` e `csrfToken`):

- `ANTIGRAVITY_LS_ADDRESS=127.0.0.1:<httpPort>`
- `ANTIGRAVITY_CSRF_TOKEN=<csrfToken>`

O token muda cada vez que o Antigravity reinicia, entao o script le o arquivo mais recente toda vez.

## Fluxo para cada novo site
1. O Coder escreve o pedido `[DISPATCH TO ANTIGRAVITY: ASSET GENERATION BATCH]` (>= 20 ativos, itens 01-03 em video loop) em `C:\Contexto Mini Factory\antigravity-assets\<projeto>\DISPATCH.md`.
2. Roda (via thread com acesso ao PC, tarefa agendada ou n8n com Execute Command):
   `powershell -File "C:\Contexto Mini Factory\antigravity-assets\dispatch-antigravity.ps1" -DispatchFile <DISPATCH.md> -Title "<projeto> assets"`
   O script abre o Antigravity se nao estiver aberto, le porta/token e chama `new-conversation`.
3. Acompanhar: os arquivos aparecem em `antigravity-assets\<projeto>\img` e `video`; o fim e confirmado quando todos os caminhos do pedido existem. Para correcoes use `send-message <conversationId> "..."`.
4. O Coder troca os `.svg` provisorios pelos arquivos reais e publica.

## Limites conhecidos
- O app Antigravity precisa estar instalado e logado (o daemon sobe com ele).
- O agente ignora `workspace`: sempre passe caminhos absolutos no prompt.
- Se o PC estiver desligado, o pedido espera; uma tarefa agendada no Windows pode rodar o script no login.
