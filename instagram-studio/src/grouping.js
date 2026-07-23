// Agrupamento heurístico (etapa 03) — determinístico e sem rede.
//
// Em produção o Claude faz esse agrupamento com mais nuance (ver adapters/claude.js
// e prompts.js). Esta heurística é o fallback offline e o que roda no `npm run demo`:
// ela reconhece o quadro por palavras-chave e junta, por dia + quadro, o que combina.

import { QUADROS, QUADRO_GERAL } from './quadros.js';

/**
 * Normaliza texto para casar palavra-chave sem acento/caixa.
 * Remove marcas combinantes (U+0300–U+036F) por codepoint — evita regex com
 * caracteres combinantes literais no fonte.
 * @param {string} s
 */
function norm(s) {
  const lowered = (s || '').toLowerCase().normalize('NFD');
  let out = '';
  for (const ch of lowered) {
    const c = ch.codePointAt(0);
    if (c >= 0x0300 && c <= 0x036f) continue; // marca combinante (acento)
    out += ch;
  }
  return out;
}

/**
 * Pontua o quanto um asset combina com cada quadro (0..1) por presença de keywords
 * na transcrição + tags + resumo visual.
 * @param {import('./types.js').MediaAsset} asset
 * @returns {{ quadroId: string, score: number, hits: string[] }}
 */
export function scoreAsset(asset) {
  const haystack = norm(
    [asset.transcript, asset.visualSummary, (asset.visualTags || []).join(' ')].join(' '),
  );

  let best = { quadroId: QUADRO_GERAL.id, score: 0, hits: /** @type {string[]} */ ([]) };

  for (const q of QUADROS) {
    const hits = q.keywords.filter((k) => haystack.includes(norm(k)));
    if (hits.length === 0) continue;
    // Confiança satura com poucos hits — 3 acertos já é bem confiante.
    const score = Math.min(1, hits.length / 3);
    if (score > best.score) best = { quadroId: q.id, score, hits };
  }
  return best;
}

/** Data local (YYYY-MM-DD) a partir de um ISO. */
function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Agrupa assets em posts propostos. Regra v0: mesmo dia + mesmo quadro = um post.
 * (Refinamento futuro: separar por janela de sessão — manhã x noite — mesmo quadro.)
 *
 * @param {import('./types.js').MediaAsset[]} assets
 * @returns {{ groups: import('./types.js').PostGroup[], scored: Map<string, ReturnType<typeof scoreAsset>> }}
 */
export function groupAssets(assets) {
  const scored = new Map();
  /** @type {Map<string, import('./types.js').PostGroup>} */
  const byKey = new Map();

  const sorted = [...assets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const asset of sorted) {
    const s = scoreAsset(asset);
    scored.set(asset.id, s);

    const date = dayKey(asset.createdAt);
    const quadro = QUADROS.find((q) => q.id === s.quadroId) ?? QUADRO_GERAL;
    const key = `${date}__${quadro.id}`;

    if (!byKey.has(key)) {
      byKey.set(key, {
        quadroId: quadro.id,
        date,
        slug: quadro.slug,
        folderName: `post_${date}_${quadro.slug}`,
        assetIds: [],
        score: 0,
        rationale: '',
      });
    }
    const g = byKey.get(key);
    g.assetIds.push(asset.id);
    g.score = Math.max(g.score, s.score);
  }

  const groups = [...byKey.values()].map((g) => ({
    ...g,
    rationale: buildRationale(g, scored),
  }));

  // Posts mais "prontos" (mais assets, maior confiança) primeiro.
  groups.sort((a, b) => b.assetIds.length - a.assetIds.length || b.score - a.score);
  return { groups, scored };
}

/**
 * @param {import('./types.js').PostGroup} g
 * @param {Map<string, ReturnType<typeof scoreAsset>>} scored
 */
function buildRationale(g, scored) {
  const hits = new Set();
  for (const id of g.assetIds) {
    for (const h of scored.get(id)?.hits ?? []) hits.add(h);
  }
  const n = g.assetIds.length;
  const plural = n === 1 ? 'clipe' : 'clipes';
  const sinais = hits.size
    ? ` sinais: "${[...hits].slice(0, 4).join('", "')}"`
    : ' sem sinais fortes — revisar';
  return `${n} ${plural} do mesmo dia sob o mesmo quadro;${sinais}.`;
}
