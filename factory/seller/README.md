# Seller da HELU FACTORY

Dono: thread "Seller". Atualizado em 2026-10-05. Todos os fluxos ficam na pasta **01 Seller** do n8n, inativos até o ok do Heitor para o primeiro envio real.

## Caminho de um lead
1. **Prospectar leads no Google Maps** (AaMGT5qGjxPKDqJe): 7h seg-sáb, 8 buscas cidade × ramo, guarda só negócio aberto, com celular e sem site próprio (ou só Instagram). Dedup por telefone. Grava em helu_leads com status `novo`.
2. **1. Disparar o primeiro contato** (USGPYgZSVzw0hpvT): 10h e 15h, 10 por janela = 20/dia. Metade recebe `helu_primeiro_contato` (A, cidade) e metade `helu_primeiro_contato_b` (B, ramo). Para se `fabrica_pausada=true` ou o phone id do helu_config for placeholder.
3. **Follow-up de quem nao respondeu** (JiLPNVA1ZqPsE0LC): 11h. Toque 2 após 3 dias (`helu_followup_1`), toque 3 após 5 (`helu_followup_2`), `sem_resposta` após 7. No máximo `followups_por_dia` (padrão 30).
4. **2. Inbox e classificacao** (OA98m5taBL6MKCPl): recebe a resposta, transcreve áudio, espera 20s para juntar mensagens seguidas, lê a conversa inteira, classifica com o Claude e decide:
   - **robô** responde: dúvida (tom de celular, sem preço e sem prazo, tempo de digitar), opt-out, alteração, preço/fechado (chama o 4), quer ver (avisa, monta o dossiê e chama o 3);
   - **escalar** para o Heitor: perguntou se é robô, pediu ligação, reclamou, pediu algo fora do escopo, confiança < 0,45 ou urgência alta;
   - **pausado**: fábrica pausada ou lead já com o Heitor (`aguardando_heitor`).
5. **Montar o dossie do lead para o coder** (sxw0CIpCKmyBODQv): Google Maps (detalhes, avaliações, horário, fotos) + busca na web (Brave) + conversa → dossiê JSON feito pelo Claude, salvo em helu_leads.briefing e helu_pedidos.briefing.
6. **4. Negociacao e Pix** (fUWhoQe6sWmwFCCJ): preço calculado em código dentro da faixa; Pix, phone id e faixa vêm do helu_config.
7. **Entregar a demo no WhatsApp** (8OSHoCaMhWGTnYh3): recebe o site pronto do Coder e manda ao cliente. Dentro de 24h da última mensagem dele: link + vídeo opcional + pedido de opinião, escritos pelo Claude com tempo de digitar. Fora de 24h: template `helu_demo_pronta`.

## Contrato com o Coder
- O inbox chama **3. Fabrica de sites** (xGshxmTLzcEPFJsz) sem esperar, com: `lead_id, empresa, categoria, cidade, uf, telefone, plano, briefing` (texto, o dossiê em JSON) e `dossie` (objeto). Campos do dossiê: negocio, o_que_vende, provas_sociais, tom_de_voz, pedidos_do_cliente, contato, secoes_sugeridas, chamada_principal, ideia_visual, paleta_sugerida, ideia_video_hero (inglês, para o Higgsfield), lacunas, fontes, fotos_google.
- Quando o site estiver no ar, o Coder **não manda WhatsApp**: chama "Entregar a demo no WhatsApp" (Execute Workflow, id 8OSHoCaMhWGTnYh3) com `{lead_id, telefone, empresa, site_url, video_url?, destaque?}`. `destaque` é uma frase sobre o que o site tem de melhor (o Claude usa na mensagem).
- O fluxo de entrega marca helu_leads e helu_pedidos como `demo_enviada` e registra em helu_conversas.
- Pedidos de alteração de cliente entram em helu_alteracoes com status `novo`.

## Contrato com o Reacher
- Quando o robô não deve seguir sozinho, o inbox:
  1. grava uma linha em **helu_escalacoes** (FfcXL9bExj2vEalk) com motivo, histórico, última mensagem e sugestão de resposta;
  2. grava em **helu_eventos**: `tipo=lead_precisa_heitor`, `precisa_heitor=true`, `severidade=urgente` (urgência alta) ou `alta`, `origem=Seller | Inbox`, `lead_id`, `titulo`, `detalhe` com motivo, fala do cliente, sugestão e WhatsApp;
  3. muda o lead para `status=aguardando_heitor` e manda uma mensagem curta de espera ("deixa eu ver isso direitinho aqui e ja te falo").
- Enquanto o lead estiver `aguardando_heitor`, o robô não responde esse lead. Para devolver ao robô, o Reacher (ou o Heitor) muda o status do lead para `respondeu` (ou qualquer outro).

## Valores no helu_config que o Seller lê
`whatsapp_phone_number_id`, `fabrica_pausada`, `leads_por_janela` (10), `pix_chave`, `pix_nome`, `preco_teto`, `preco_piso_global`. Opcionais com padrão: `followups_por_dia` (30), `mensalidade_essencial` (79), `mensalidade_profissional` (129), `max_rodadas_negociacao` (4).

## Credenciais que os fluxos esperam
- **WhatsApp Cloud (HELU)** (WhatsApp API): todos os envios e o download de áudio.
- **WhatsApp Trigger (HELU)** (WhatsApp OAuth): gatilho do inbox.
- **Google Places (HELU)** (Custom Auth, `{"headers":{"X-Goog-Api-Key":"SUA_CHAVE"}}`): prospecção e dossiê.
- **Anthropic (HELU)**: classificador, resposta, dossiê e mensagem da demo (hoje apontam para os créditos do n8n, que acabaram).
- OpenAI (transcrição de áudio) e Brave (busca do dossiê) usam os créditos do n8n; se acabarem, criar credenciais próprias.

## Testes feitos (05/10, dados simulados, nada enviado)
- Inbox, dúvida: junta "oi" + "como funciona?", monta histórico, decide `robo`, espera o tempo de digitar e limpa travessão (execução 530).
- Inbox, "isso é robô? quero falar com o dono": decide `escalar`, registra escalação, avisa o Reacher, pausa e manda espera (531).
- Dossiê com lead falso: material e dossiê saem certos (532).
- Entrega da demo: fora de 24h vai template, dentro de 24h vai texto com link garantido (533, 534).
- Prospecção: descarta quem tem site e telefone fixo, mantém celular sem site e só-Instagram (535).
