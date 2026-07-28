// Motor de análise de performance (Fase 3) — determinístico, offline.
//
// Recebe as métricas reais de cada post (que em produção vêm da Graph API) e
// produz: indicadores por post, ranking por quadro, melhores horários observados
// e RECOMENDAÇÕES acionáveis.
//
// REGRA DE OURO: as recomendações são DIREÇÃO ("faça mais do quadro X", "seu
// gancho nos 3s está fraco, refaça a abertura"). O relatório nunca escreve a
// legenda, o roteiro ou a capa — a criação continua sua.

import { quadroById } from './quadros.js';

/**
 * @typedef {Object} PostInsights
 * @property {string} postId          normalmente o folderName do post
 * @property {string} quadroId
 * @property {'reel'|'feed'|'story'} format
 * @property {string} publishedAt     ISO
 * @property {number} reach
 * @property {number} likes
 * @property {number} comments
 * @property {number} shares
 * @property {number} saves
 * @property {number} followsFromPost
 * @property {number} [plays]
 * @property {number} [avgWatchTimeSec]
 * @property {number} [videoDurationSec]
 * @property {number} [retention3sPct]      0..1 — % que passou dos 3s (gancho)
 */

export const THRESHOLDS = {
  hookWeak: 0.45, // retention3s abaixo disso = gancho fraco
  hookStrong: 0.6,
  saveStrongRate: 0.03, // saves/reach acima disso = conteúdo de valor
  watchLow: 0.35, // avgWatch/duração abaixo disso = ritmo/duração ruins
  reachLowFactor: 0.6, // reach < 0.6× mediana = abaixo do normal
  reachHighFactor: 1.4, // reach > 1.4× mediana = acima do normal
};

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function rate(n, d) {
  return d > 0 ? n / d : 0;
}
const DEFAULT_TZ = 'America/Sao_Paulo';

/**
 * Rótulo do horário no fuso correto (ex.: "Ter 12:00"), robusto ao fuso do runtime.
 * Usa Intl para converter o instante para o fuso alvo — funciona tanto para os
 * timestamps com offset dos fixtures quanto para os UTC da Graph API.
 * @param {string} iso @param {string} tz
 */
function slotLabel(iso, tz = DEFAULT_TZ) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const raw = parts.find((p) => p.type === 'weekday')?.value.replace('.', '') || '';
  const wd = raw.charAt(0).toUpperCase() + raw.slice(1);
  const hour = parts.find((p) => p.type === 'hour')?.value.padStart(2, '0') || '00';
  return `${wd} ${hour}:00`;
}

/**
 * @param {PostInsights[]} insights
 * @param {{ thresholds?: typeof THRESHOLDS, tz?: string }} [opts]
 */
export function analyzePosts(insights, opts = {}) {
  const T = opts.thresholds || THRESHOLDS;
  const tz = opts.tz || DEFAULT_TZ;
  const reachMedian = median(insights.map((p) => p.reach));

  const perPost = insights.map((p) => {
    const eng = p.likes + p.comments + p.shares + p.saves;
    const engRate = rate(eng, p.reach);
    const saveRate = rate(p.saves, p.reach);
    const followRate = rate(p.followsFromPost, p.reach);
    const hookPct = p.retention3sPct ?? null;
    const watchThrough =
      p.avgWatchTimeSec && p.videoDurationSec ? rate(p.avgWatchTimeSec, p.videoDurationSec) : null;

    const flags = [];
    const isVideo = p.format === 'reel';

    if (isVideo && hookPct != null) {
      if (hookPct < T.hookWeak)
        flags.push({
          severity: 'critical',
          message: `Gancho fraco: só ${pct(hookPct)} passaram dos 3s.`,
          action: 'Refaça os 3 primeiros segundos — comece no ponto mais forte da sua fala.',
        });
      else if (hookPct >= T.hookStrong)
        flags.push({ severity: 'good', message: `Gancho forte (${pct(hookPct)} passaram dos 3s).`, action: 'Repita esse tipo de abertura.' });
    }

    if (saveRate >= T.saveStrongRate)
      flags.push({
        severity: 'good',
        message: `Muito salvo (${pct(saveRate)} do alcance salvou).`,
        action: 'Conteúdo de valor — aumente a frequência desse quadro.',
      });

    if (isVideo && watchThrough != null && watchThrough < T.watchLow)
      flags.push({
        severity: 'warn',
        message: `Retenção baixa (assistiram ${pct(watchThrough)} do vídeo).`,
        action: 'Encurte ou acelere o ritmo; corte o que não é essencial.',
      });

    if (reachMedian && p.reach < reachMedian * T.reachLowFactor)
      flags.push({
        severity: 'warn',
        message: `Alcance abaixo do seu normal (${p.reach} vs mediana ${reachMedian}).`,
        action: 'Teste outro horário e reforce o gancho.',
      });
    else if (reachMedian && p.reach > reachMedian * T.reachHighFactor)
      flags.push({ severity: 'good', message: `Alcance acima do normal (${p.reach}).`, action: 'Analise o que puxou o alcance e repita.' });

    return { ...p, engRate, saveRate, followRate, hookPct, watchThrough, flags };
  });

  const perQuadro = aggregateByQuadro(perPost);
  const bestTimes = aggregateByTime(perPost, tz);
  const recommendations = buildRecommendations(perPost, perQuadro, bestTimes, T);

  const totals = {
    posts: perPost.length,
    reach: sum(perPost.map((p) => p.reach)),
    saves: sum(perPost.map((p) => p.saves)),
    follows: sum(perPost.map((p) => p.followsFromPost)),
    avgEngRate: perPost.length ? sum(perPost.map((p) => p.engRate)) / perPost.length : 0,
  };

  return { totals, perPost, perQuadro, bestTimes, recommendations, reachMedian };
}

function aggregateByQuadro(perPost) {
  const map = new Map();
  for (const p of perPost) {
    if (!map.has(p.quadroId)) map.set(p.quadroId, []);
    map.get(p.quadroId).push(p);
  }
  const rows = [...map.entries()].map(([quadroId, posts]) => ({
    quadroId,
    name: quadroById(quadroId).name,
    posts: posts.length,
    avgReach: Math.round(avg(posts.map((p) => p.reach))),
    avgSaveRate: avg(posts.map((p) => p.saveRate)),
    avgFollowRate: avg(posts.map((p) => p.followRate)),
    avgEngRate: avg(posts.map((p) => p.engRate)),
  }));
  rows.sort((a, b) => b.avgSaveRate - a.avgSaveRate);
  return rows;
}

function aggregateByTime(perPost, tz) {
  const map = new Map();
  for (const p of perPost) {
    const slot = slotLabel(p.publishedAt, tz);
    if (!map.has(slot)) map.set(slot, []);
    map.get(slot).push(p.engRate);
  }
  const rows = [...map.entries()].map(([slot, rates]) => ({ slot, avgEngRate: avg(rates), n: rates.length }));
  rows.sort((a, b) => b.avgEngRate - a.avgEngRate);
  return rows;
}

function buildRecommendations(perPost, perQuadro, bestTimes, T) {
  const recs = [];

  const topQuadro = perQuadro[0];
  if (topQuadro && topQuadro.avgSaveRate >= T.saveStrongRate)
    recs.push({
      priority: 'alta',
      message: `"${topQuadro.name}" é seu líder em salvamentos (${pct(topQuadro.avgSaveRate)}).`,
      action: 'Aumente a frequência desse quadro no cronograma.',
    });

  const weakest = [...perQuadro].sort((a, b) => a.avgEngRate - b.avgEngRate)[0];
  if (weakest && perQuadro.length > 1 && weakest.avgEngRate < topQuadro.avgEngRate * 0.5)
    recs.push({
      priority: 'média',
      message: `"${weakest.name}" tem o menor engajamento (${pct(weakest.avgEngRate)}).`,
      action: 'Reveja o formato ou reduza a frequência até acertar o ângulo.',
    });

  const weakHooks = perPost.filter((p) => p.format === 'reel' && p.hookPct != null && p.hookPct < T.hookWeak);
  if (weakHooks.length)
    recs.push({
      priority: 'alta',
      message: `${weakHooks.length} Reel(s) com gancho fraco nos 3s.`,
      action: 'Priorize reabrir os 3 primeiros segundos antes de gravar novos.',
    });

  if (bestTimes[0])
    recs.push({
      priority: 'média',
      message: `Melhor horário observado: ${bestTimes[0].slot} (engajamento ${pct(bestTimes[0].avgEngRate)}).`,
      action: 'Concentre lançamentos nesse horário — realimente a estratégia da Fase 2.',
    });

  return recs;
}

const pct = (x) => `${Math.round(x * 100)}%`;
const sum = (a) => a.reduce((s, x) => s + x, 0);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
export { pct };
