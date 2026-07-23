// Adaptador do Claude para o agrupamento em produção (etapa 03).
//
// Requer o pacote `@anthropic-ai/sdk` e a variável ANTHROPIC_API_KEY.
// O import é dinâmico para o `npm run demo` rodar sem instalar nada.

import { buildGroupingPrompt } from '../prompts.js';
import { quadroById } from '../quadros.js';

/**
 * Agrupa assets usando o Claude. Retorna PostGroup[] no mesmo formato da heurística.
 * @param {import('../types.js').MediaAsset[]} assets
 * @param {{ apiKey?: string, model?: string }} [opts]
 * @returns {Promise<import('../types.js').PostGroup[]>}
 */
export async function groupWithClaude(assets, opts = {}) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  const model = opts.model || process.env.CLAUDE_MODEL || 'claude-sonnet-5';
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada — não é possível agrupar via Claude.');

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const { system, user } = buildGroupingPrompt(assets);
  const resp = await client.messages.create({
    model,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const parsed = parseGroupsJson(text);
  return parsed.map((g) => normalizeGroup(g));
}

/** Extrai o JSON mesmo se vier cercado por ```json ... ```. */
function parseGroupsJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Resposta do Claude sem JSON reconhecível.');
  const obj = JSON.parse(raw.slice(start, end + 1));
  if (!Array.isArray(obj.groups)) throw new Error('JSON do Claude sem "groups".');
  return obj.groups;
}

/** Converte um grupo cru do modelo em PostGroup completo. */
function normalizeGroup(g) {
  const q = quadroById(g.quadroId);
  const date = g.date || new Date().toISOString().slice(0, 10);
  return {
    quadroId: q.id,
    date,
    slug: q.slug,
    folderName: `post_${date}_${q.slug}`,
    assetIds: Array.isArray(g.assetIds) ? g.assetIds : [],
    score: typeof g.score === 'number' ? Math.max(0, Math.min(1, g.score)) : 0.5,
    rationale: g.rationale || '',
    // anglePrompts vindos do modelo são direção extra; os do quadro seguem no brief.
    anglePrompts: Array.isArray(g.anglePrompts) ? g.anglePrompts : undefined,
  };
}
