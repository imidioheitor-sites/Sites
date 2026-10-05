# Watchdog da fabrica (Vigia da fabrica)

Dono: thread "Watchdog". Atualizado em 2026-10-05.

## O que existe no n8n
- Workflow **HELU FACTORY | Watchdog | Vigia da fabrica** — id `GbvwCyonCOH2p1T9`, pasta 04 Watchdog, etiquetas `helu` + `area:watchdog`, fuso America/Sao_Paulo, error workflow = Caixa de erros. **Ainda nao publicado** (o trial do n8n acabou e falta a credencial "n8n API (HELU)").
- Tabela **helu_watchdog_incidentes** (`hnQhOtCbd7Dw6MAC`): um incidente por problema (chave unica), com severidade, acao tomada, resultado, ocorrencias, `avisar_heitor`, `aviso_status` (nao | pendente; o Reacher pode marcar `entregue`) e `resumo_para_heitor` (2 frases faladas, prontas para a ligacao).
- Tabela **helu_watchdog_estado** (`ONRMPhHtV6YOh065`): memoria chave/valor (ultimo_ciclo, workflows vistos ligados, reativacoes, resumo_ultimo_ciclo). Outra area pode ler `ultimo_ciclo` para saber se o watchdog esta vivo.

## O que ele vigia (a cada 30 min)
| Problema | Chave | Severidade | O que ele faz sozinho |
|---|---|---|---|
| API do n8n nao responde | `api_n8n_fora` | alta | avisa (precisa_heitor) |
| Workflow da fabrica que estava ligado e desligou (sem tag `pausado`) | `inativo:<id>` | alta (Inbox, Caixa de erros) / media | religa Inbox e Caixa de erros, no maximo 1x por 24h |
| Falha gravada pela Caixa de erros em helu_eventos | `erro:<wf>:<no>` | alta nos fluxos 1-4 / media | reexecuta 1x se for passageira (timeout, 429, 5xx, overloaded) nos fluxos 2, 3, 5 e 7; senao o Claude diagnostica |
| Execucao rodando alem do limite (20 min; disparo 75 min) | `travado:<exec>` | media (alta >3h) | registra |
| Disparo ligado e nenhum primeiro contato ate 11h (seg-sab) | `sem_disparo:<data>` | alta | diagnostica |
| >= 50% dos envios de 24h falhando na Meta (min. 5) | `falha_envio_alta` | critica | **pausa o disparo** (desliga o fluxo 1) |
| 30+ primeiros contatos em 48h e zero respostas | `inbox_mudo` | alta | diagnostica |
| Demo prometida ha 30+ min ainda em briefing | `demo_atrasada:<lead>` | alta (critica >90 min) | avisa |
| Pedido em publicacao_falhou / envio_falhou | `demo_falhou:<lead>` | alta | diagnostica |

O Claude (Sonnet 5, creditos do n8n) so diagnostica e sugere `observar`, `propor_melhoria` ou `avisar_heitor`; o codigo decide. Proposta vira linha em helu_melhorias (`tipo=acao`, `status=precisa_voce`, `fonte=watchdog`).

## Contrato com o Reacher e o Dashboard (via helu_eventos)
- Erros `erro_execucao` com status `novo` que o watchdog leu viram `status=em_tratamento`, `tratado_por=watchdog`.
- Cada incidente novo, escalada e resolucao vira uma linha `tipo=watchdog_reparo`, `origem=HELU FACTORY | Watchdog`:
  - `severidade=urgente` quando o incidente e critico (Reacher liga).
  - `precisa_heitor=true` quando so o Heitor resolve, ou quando um problema alto continua por 4 ciclos (2 h).
  - Resolucao: titulo comeca com "Resolvido:", severidade baixa.
  - `detalhe` comeca com o `resumo_para_heitor` (frase pronta para falar) e termina com o id do incidente.
  - `lead_id` preenchido nos incidentes de demo.

## O que falta para ligar
1. Plano do n8n ativo.
2. Credencial "n8n API (HELU)" (Header Auth, `X-N8N-API-KEY`) e selecionar nos 5 nos HTTP do watchdog.
3. Publicar o workflow.
Sem a credencial ele ainda funciona pela metade: le o barramento e as tabelas, mas abre o incidente `api_n8n_fora`.

## Codigo-fonte
Branch `claude/watchdog-248nyt` do repo imidioheitor-sites/Sites, pasta `factory/watchdog/` (codigo do no Diagnosticar com teste local em Node, prompt, e o SDK do workflow).
