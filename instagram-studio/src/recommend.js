// Motor de recomendações (Fase 4) — o que gravar na semana, baseado nos SEUS
// dados + modelos comprovados + trends de notícia.
//
// REGRA DE OURO: tudo aqui é DIREÇÃO (qual quadro priorizar, qual modelo usar,
// qual ângulo). Nunca escreve a legenda, o roteiro ou a capa — você cria.

import { QUADROS, quadroById } from './quadros.js';
import { modelsFor } from './contentModels.js';

/**
 * @param {{
 *   analysis?: ReturnType<import('./analyze.js').analyzePosts>,
 *   news?: import('./adapters/news.js').NewsItem[],
 *   quadros?: import('./types.js').Quadro[],
 * }} input
 */
export function weeklyRecommendations(input = {}) {
  const quadros = input.quadros || QUADROS;
  const analysis = input.analysis;
  const news = input.news || [];

  const focus = buildFocus(analysis);

  // Uma ideia por quadro (plano variado da semana); os do foco vêm marcados.
  const focusIds = new Set(focus.map((f) => f.quadroId));
  const ideas = quadros.map((q) => {
    const model = modelsFor(q.id)[0];
    return {
      quadroId: q.id,
      quadro: q.name,
      highlighted: focusIds.has(q.id),
      model: model.name,
      structure: model.structure,
      prompt: model.hookPrompts[0], // direção — não é legenda
    };
  });

  const newsIdeas = news.slice(0, 3).map((n) => ({
    title: n.title,
    link: n.link,
    source: n.source,
    angle: 'Qual a sua leitura contrária ao óbvio sobre isso? Traga para quem está começando.',
  }));

  return {
    focus,
    ideas,
    news: newsIdeas,
    reminder:
      'Tudo isto é direção. Você grava e escreve — nada é gerado por IA. As notícias servem de tema; a opinião é sempre sua.',
  };
}

function buildFocus(analysis) {
  if (!analysis || !analysis.perQuadro?.length) {
    // Sem dados ainda: mantém equilíbrio entre os quadros.
    return [{ quadroId: 'rotina-dia', why: 'sem dados ainda — comece consistente', action: 'poste em ritmo regular e colete métricas' }];
  }
  const focus = [];
  const top = analysis.perQuadro[0];
  focus.push({
    quadroId: top.quadroId,
    why: `líder em salvamentos (${pct(top.avgSaveRate)})`,
    action: 'aumente a frequência deste quadro',
  });

  // Quadros com gancho fraco recorrente: prioridade de correção.
  const weakByQuadro = new Set(
    (analysis.perPost || [])
      .filter((p) => p.format === 'reel' && p.hookPct != null && p.hookPct < 0.45)
      .map((p) => p.quadroId),
  );
  for (const qid of weakByQuadro) {
    if (qid === top.quadroId) continue;
    focus.push({
      quadroId: qid,
      why: 'gancho fraco nos 3s nos últimos Reels',
      action: 'reabra os 3 primeiros segundos antes de gravar novos',
    });
  }
  return focus;
}

const pct = (x) => `${Math.round(x * 100)}%`;

/** @param {ReturnType<typeof weeklyRecommendations>} r */
export function renderRecommendationsText(r) {
  const L = [];
  const bar = '─'.repeat(60);
  L.push(bar);
  L.push('  RECOMENDAÇÕES DA SEMANA — Instagram Studio');
  L.push(bar);

  L.push('\n  FOCO');
  for (const f of r.focus) L.push(`   • ${quadroById(f.quadroId).name}: ${f.why}\n       → ${f.action}`);

  L.push('\n  IDEIAS POR QUADRO (direção, você cria)');
  for (const i of r.ideas) {
    L.push(`   ${i.highlighted ? '★' : '·'} ${i.quadro} — modelo "${i.model}"`);
    L.push(`       estrutura: ${i.structure}`);
    L.push(`       ângulo: ${i.prompt}`);
  }

  if (r.news.length) {
    L.push('\n  TRENDS PARA COMENTAR (você dá a opinião)');
    for (const n of r.news) L.push(`   • ${n.title} (${n.source})\n       ${n.link}\n       ângulo: ${n.angle}`);
  }

  L.push(`\n  🔒 ${r.reminder}`);
  L.push(bar);
  return L.join('\n');
}
