# WhatsApp Business (Meta) para a fábrica — passo a passo

Complementa as pendências P01, P02, P03, P04 e P11 de `factory/pendencias/pendencias.md`. Leva umas 2 horas de clique, mais a espera da Meta aprovar templates (minutos a 1 dia) e verificar a empresa (1 a 5 dias, não trava o começo).

**Regra de ouro:** token e senhas vão direto na credencial do n8n. Não cole token no chat. O que eu preciso que você me mande são só os IDs (passo 4).

## 1. Número só da fábrica
- Chip novo (pré-pago serve) que **nunca teve WhatsApp instalado**. Se já teve, apague a conta no app antes (Configurações > Conta > Apagar conta).
- Ele só precisa receber um SMS ou ligação uma vez. Depois o chip pode ficar na gaveta.

## 2. Portfólio empresarial
- business.facebook.com > Criar conta > nome **HELU TECH**, seu nome e e-mail.

## 3. App da Meta
- developers.facebook.com > Meus apps > Criar app > caso de uso **"Conectar-se com clientes pelo WhatsApp"** > vincule ao portfólio HELU TECH.
- App > Configurações do app > Básico: preencha **URL da política de privacidade** (se não tiver, me avise que eu publico uma página simples) e depois mude o app para **Publicado/Live**.

## 4. Número e IDs
- No app: WhatsApp > Configuração da API > **Adicionar número de telefone**.
- Nome de exibição: algo como **Heitor | HELU Sites** (a Meta revisa; nome de pessoa sozinho costuma ser recusado).
- Verifique por SMS.
- Copie e me mande: **Phone number ID** e **WhatsApp Business Account ID**.

## 5. Cartão
- business.facebook.com > WhatsApp Manager > Configurações > **Formas de pagamento** > adicionar cartão.
- Custo hoje no Brasil: cada template de marketing (1º contato, follow-up) custa por volta de **US$ 0,06**; responder dentro de 24h depois que o cliente falou é grátis. Com 20 contatos/dia + follow-ups, conte **US$ 40 a 60/mês**.

## 6. Token permanente (vai direto no n8n)
- business.facebook.com > Configurações do portfólio > Usuários > **Usuários do sistema** > Adicionar > nome `n8n-helu`, função **Admin**.
- **Atribuir ativos**: o app (controle total) e a conta do WhatsApp (controle total).
- **Gerar token** > escolha o app > validade **Nunca** > permissões `whatsapp_business_messaging` e `whatsapp_business_management`.
- O token aparece uma vez só. Cole direto no passo 8.

## 7. Templates (WhatsApp Manager > Modelos de mensagem > Criar)
Categoria **Marketing**, idioma **Português (BR)**, sem botão. Nomes exatos:

| Nome | Texto | Variáveis |
|---|---|---|
| `helu_primeiro_contato` | Oi, tudo bem? Aqui é o Heitor, eu faço sites pra pequenos negócios. Vi a {{1}} no Google, aí em {{2}}, e montei uma ideia de site pra vocês. Posso te mandar pra dar uma olhada? Se não quiser receber mensagem minha, é só responder SAIR. | 1 = empresa, 2 = cidade |
| `helu_primeiro_contato_b` | Oi! Sou o Heitor, trabalho com site pra {{2}}. Achei a {{1}} no Google Maps e vi que vocês ainda não têm site, então rascunhei como poderia ficar. Quer ver? Se preferir não receber, responde SAIR. | 1 = empresa, 2 = ramo |
| `helu_followup_1` | Oi, passando de novo aqui. Ainda tenho guardada aquela ideia de site pra {{1}}, quer que eu te mande? Se não tiver interesse, responde SAIR que eu paro. | 1 = empresa |
| `helu_followup_2` | Última vez que te chamo, prometo. Se um dia quiser ver o site que pensei pra {{1}}, é só me responder aqui. | 1 = empresa |
| `helu_demo_pronta` | Oi! Ficou pronta a demonstração do site da {{1}}: {{2}} Dá uma olhada com calma e me fala o que achou. | 1 = empresa, 2 = link |

Os textos já trazem identificação e a saída "SAIR" (LGPD, pendência P11). Como o número é americano (+1), nenhum texto diz "da região". Se quiser mudar o tom, mude aqui antes de enviar para aprovação.

## 8. No n8n (depois do plano assinado)
- Credentials > New > **WhatsApp API** > nome **WhatsApp Cloud (HELU)**: Access Token = token do passo 6, Business Account ID = do passo 4.
- Credentials > New > **WhatsApp OAuth API** > nome **WhatsApp Trigger (HELU)**: Client ID = App ID e Client Secret = Chave secreta do app (developers.facebook.com > app > Configurações > Básico).
- Me avise quando criar: eu ligo as credenciais nos fluxos e coloco o Phone number ID em `helu_config` (`whatsapp_phone_number_id`). O webhook do inbox se registra sozinho na Meta quando o inbox é publicado.

## 9. Verificação da empresa (pode ser em paralelo)
- Configurações do portfólio > Central de segurança > **Verificação da empresa**: CNPJ ou MEI, documento e um site/domínio com o nome HELU.
- Sem verificação dá para mandar até 250 conversas novas por dia, o que cobre os 20/dia do começo.

## Depois disso
Disparo começa com **20 contatos por dia**, metade com cada versão do 1º contato (A e B), e só vai para lead real com o seu ok final.
