// Adaptador de Insights do Instagram (Fase 3) — dados reais de performance.
//
// Fonte: Instagram Graph API (conta Profissional). Requer um token de acesso de
// longa duração com escopo instagram_manage_insights / instagram_basic.
// Import dinâmico + fetch nativo (Node 20+) para o demo rodar sem nada disto.
//
// Mapeia a resposta da Graph API para o formato PostInsights que o analyze.js usa.

const GRAPH = 'https://graph.facebook.com/v20.0';

/**
 * Busca as métricas dos posts recentes.
 * @param {{ igUserId?: string, accessToken?: string, limit?: number }} [opts]
 * @returns {Promise<import('../analyze.js').PostInsights[]>}
 */
export async function fetchRecentInsights(opts = {}) {
  const igUserId = opts.igUserId || process.env.IG_USER_ID;
  const token = opts.accessToken || process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token)
    throw new Error('IG_USER_ID / IG_ACCESS_TOKEN não configurados — Insights indisponíveis no modo live.');

  const limit = opts.limit ?? 20;
  // 1) lista as mídias recentes
  const mediaUrl = `${GRAPH}/${igUserId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=${limit}&access_token=${token}`;
  const media = await getJson(mediaUrl);

  /** @type {import('../analyze.js').PostInsights[]} */
  const out = [];
  for (const m of media.data ?? []) {
    // 2) métricas por mídia (nomes de métrica variam por tipo — REELS vs IMAGE)
    const isReel = m.media_type === 'VIDEO' || m.media_type === 'REELS';
    const metrics = isReel
      ? 'reach,saved,shares,plays,ig_reels_avg_watch_time,ig_reels_video_view_total_time,total_interactions'
      : 'reach,saved,shares,total_interactions,follows';
    const insUrl = `${GRAPH}/${m.id}/insights?metric=${metrics}&access_token=${token}`;
    const ins = await getJson(insUrl).catch(() => ({ data: [] }));
    const val = metricMap(ins.data);

    out.push({
      postId: m.id,
      quadroId: 'geral', // casar com o quadro exige um mapa postId→quadro (feito no ingest)
      format: isReel ? 'reel' : 'feed',
      publishedAt: m.timestamp,
      reach: val.reach ?? 0,
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
      shares: val.shares ?? 0,
      saves: val.saved ?? 0,
      followsFromPost: val.follows ?? 0,
      plays: val.plays,
      avgWatchTimeSec: val.ig_reels_avg_watch_time ? val.ig_reels_avg_watch_time / 1000 : undefined,
      // retention3sPct exige o breakdown de retenção (endpoint separado) — TODO
    });
  }
  return out;
}

function metricMap(data) {
  const m = {};
  for (const d of data ?? []) m[d.name] = d.values?.[0]?.value ?? 0;
  return m;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  return res.json();
}
