# Verifier e Meta Organização

Pasta do n8n: HELU FACTORY / 05 Verifier e Meta. Tags: `helu`, `area:verifier`. Fuso: America/Sao_Paulo.

## O ciclo diário

| Hora (Brasília) | Fluxo | O que faz |
|---|---|---|
| 07:30 | 6c. Vigia da ultima melhoria (`rihv5vmpVdTQmeeh`) | Compara a taxa de erro do fluxo alterado antes e depois da última troca de prompt (últimos 7 dias). Se piorou mais de 15 pontos, com pelo menos 2 erros e 3 execuções depois, chama o 6b e desfaz sozinho. |
| 08:00 | 5. Agente que melhora a fabrica (`FpwZai9wIy2hZeKS`) | Meta Organização. Lê a semana (sites, pedidos, conversas, propostas), os prompts que estão valendo, **as execuções com erro e os fluxos com gatilho desligados**, pesquisa o tema do dia e propõe UMA melhoria em `helu_melhorias`. |
| 08:30 | 6. Aplicador de melhorias (`x40pRjeSnp71IeLD`) | Pega uma proposta `aprovado` do tipo `prompt`, mede na bancada (7), troca o prompt pela API do n8n, guarda a versão anterior e **republica o fluxo alvo se ele estava no ar**. |
| manual / vigia | 6b. Desfazer a ultima melhoria (`EGkmsz6WTGWBeiBr`) | Volta o prompt anterior. Agora também pode ser chamado pelo vigia e republica o alvo. |
| sub-fluxo | 7. Bancada de provas (`mS6Gl6H4P84JaI9O`) | Dá nota 0 a 100 a um prompt candidato (classificador e coerência têm banco; os outros alvos não). |

## Quem decide o quê
- Risco baixo e tipo `prompt`: entra `aprovado` e a fábrica aplica sozinha, se a nota na bancada não cair.
- Risco médio/alto ou tipo `acao` (nó novo, fluxo novo, gasto, canal, oferta): fica `precisa_voce` em `helu_melhorias`. **Contrato com o Reacher / Dashboard:** essas linhas são o que precisa do Heitor.
- **Contrato com o Watchdog:** reparos que ele não faz sozinho entram em `helu_melhorias` com `tipo=acao`, `status=precisa_voce`, `fonte=watchdog`, `area=Meta`. O aplicador nunca toca nessas linhas (só pega `aprovado` + `prompt`); o agente diário as lê no grupo "Saude do n8n" para não repetir e para atacar a causa se ela estiver num prompt. Coluna `area` criada em 2026-10-05; o agente grava `area=Meta` nas propostas dele.
- Status possíveis em `helu_melhorias`: `aprovado`, `precisa_voce`, `aplicado`, `falhou`, `reprovado_na_bancada`, `revertida`.

## Tabelas
- `helu_melhorias` = `vRmv4Hf3GNyOCNea`
- `helu_prompt_versoes` = `YfHEdYHPrbJNOKea`

## O que mudou em 2026-10-05
1. Aplicador e Desfazer: o PUT na API do n8n mandava `settings` com chaves que a API pública recusa (`availableInMCP`, `binaryMode`). Agora só vão as chaves aceitas.
2. Aplicador e Desfazer: com a publicação por versão, o PUT só mexe no rascunho. Agora, se o alvo estava no ar, eles chamam `/activate` para a troca valer.
3. Agente diário: ganhou o grupo "Saude do n8n" (erros da janela por fluxo + fluxos com gatilho desligados). Antes ele nunca sabia quando a fábrica estava quebrada.
4. Novo fluxo 6c (vigia) que desfaz sozinho troca que aumentou erro.

## Ainda não testado de verdade
O n8n Cloud recusa qualquer execução ("Your trial has ended"). Todas as execuções antigas desses fluxos foram com dados de mentira (pin data). Depois do plano ativo e da credencial "n8n API (HELU)" criada, rodar nesta ordem: 5 (manual) → conferir a linha em `helu_melhorias` → 6 (manual) → 6c (manual).

## Limites conhecidos
- Só reescreve o campo system de 9 prompts (fluxos 2 e 3). Mudança de estrutura de fluxo sempre vira `acao` para o Heitor.
- `fabrica_coerencia` e `fabrica_coerencia2` têm hoje o mesmo prompt; o agente pode trocar só um dos dois.
- Só 3 dos 9 alvos têm banco de provas; os outros entram só com as travas de texto.
