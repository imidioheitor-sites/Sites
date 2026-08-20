// Prompt de agrupamento para o Claude (modo produção, etapa 03).
//
// O system prompt CARREGA a regra de ouro: o Claude é um ORGANIZADOR, não um
// criador. Ele agrupa, sugere o quadro e dá DIREÇÃO criativa (perguntas/ângulos).
// Ele nunca escreve a legenda final, hooks prontos para copiar, roteiros de fala
// ou descrições de imagem para gerar. Toda criação é do usuário.

import { QUADROS } from './quadros.js';

export const GROUPING_SYSTEM = `Você é o organizador de conteúdo de um estúdio de Instagram.
Seu trabalho é ENTENDER e ORGANIZAR o material bruto que o criador gravou — nunca criar o conteúdo.

REGRA DE OURO (inegociável):
- Você NÃO escreve legendas finais, NÃO escreve hooks prontos para copiar e colar,
  NÃO escreve roteiros de fala, NÃO descreve imagens para serem geradas por IA.
- Nenhum texto que você produza pode ser publicado como está. Você entrega apenas:
  (a) o agrupamento do material em posts, (b) o quadro sugerido, e
  (c) DIREÇÃO criativa em forma de PERGUNTAS/ângulos que o criador vai executar.
- Se ficar em dúvida entre "sugerir" e "escrever o conteúdo", escolha sempre sugerir.

Responda SOMENTE com JSON válido no schema pedido, sem texto fora do JSON.`;

/**
 * Monta as mensagens para o Claude agrupar os assets.
 * @param {import('./types.js').MediaAsset[]} assets
 * @returns {{ system: string, user: string }}
 */
export function buildGroupingPrompt(assets) {
  const quadrosResumo = QUADROS.map(
    (q) => `- id="${q.id}" (${q.name}) — sinais: ${q.keywords.slice(0, 6).join(', ')}`,
  ).join('\n');

  const material = assets.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    createdAt: a.createdAt,
    durationSec: a.durationSec ?? null,
    transcript: a.transcript || '',
    visualTags: a.visualTags || [],
    visualSummary: a.visualSummary || '',
  }));

  const user = `Quadros disponíveis:
${quadrosResumo}
- id="geral" — use quando não houver sinal claro.

Material bruto (já com voz transcrita e visão descrita):
${JSON.stringify(material, null, 2)}

Tarefa:
1) Agrupe os assets em posts. Regra base: mesmo dia + mesmo quadro = um post.
   Separe em posts diferentes se forem sessões/assuntos claramente distintos.
2) Para cada post, escolha o quadro (id) e dê um "score" de confiança 0..1.
3) Escreva "rationale": por que esses assets ficam bem juntos.
4) Em "anglePrompts": 1–3 PERGUNTAS que ajudem o criador a achar o ângulo.
   NUNCA escreva a legenda ou o texto final — apenas perguntas/direção.

Responda com este JSON:
{
  "groups": [
    {
      "quadroId": "string",
      "date": "YYYY-MM-DD",
      "assetIds": ["..."],
      "score": 0.0,
      "rationale": "string",
      "anglePrompts": ["string"]
    }
  ]
}`;

  return { system: GROUPING_SYSTEM, user };
}
