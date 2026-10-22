// Renderiza o _ideia.md de cada post proposto.
//
// REGRA DE OURO (inegociável): este arquivo dá a IDEIA e pede a CRIAÇÃO.
// Ele nunca escreve a legenda final, nunca gera imagem, nunca produz texto
// pronto para postar. O que ele entrega é: o que o robô entendeu, uma DIREÇÃO
// criativa (perguntas/ângulos) e a lista do que VOCÊ precisa criar.

import { quadroById } from './quadros.js';

/**
 * @param {import('./types.js').PostGroup} group
 * @param {import('./types.js').MediaAsset[]} assets  todos os assets (filtra pelos ids do grupo)
 * @param {Map<string, {score:number,hits:string[]}>} [scored]
 * @returns {string} conteúdo markdown do _ideia.md
 */
export function renderIdeaBrief(group, assets, scored) {
  const q = quadroById(group.quadroId);
  const items = group.assetIds
    .map((id) => assets.find((a) => a.id === id))
    .filter(Boolean);

  const confPct = Math.round(group.score * 100);
  const confLabel = group.score >= 0.66 ? 'alta' : group.score >= 0.34 ? 'média' : 'baixa';

  const lines = [];
  lines.push(`# ${q.name}`);
  lines.push('');
  lines.push(`> Post proposto automaticamente — **você aprova, ajusta e cria**.`);
  lines.push('');
  lines.push(`- **Data sugerida:** ${group.date}`);
  lines.push(`- **Quadro:** ${q.name}`);
  lines.push(`- **Confiança do match:** ${confLabel} (${confPct}%)`);
  lines.push(`- **Por que foi agrupado:** ${group.rationale}`);
  lines.push('');

  lines.push('## O que o robô entendeu');
  for (const a of items) {
    const dur = a.durationSec ? ` · ${a.durationSec}s` : '';
    const kind = a.kind === 'video' ? '🎬' : '🖼️';
    lines.push(`- ${kind} **${a.name}**${dur}`);
    if (a.transcript) lines.push(`  - Fala: “${truncate(a.transcript, 160)}”`);
    if (a.visualSummary) lines.push(`  - Cena: ${a.visualSummary}`);
    const hits = scored?.get(a.id)?.hits ?? [];
    if (hits.length) lines.push(`  - Sinais do quadro: ${hits.join(', ')}`);
  }
  lines.push('');

  lines.push('## Ideia / ângulo sugerido');
  lines.push('_Direção, não legenda pronta. Use como ponto de partida para o SEU texto._');
  lines.push('');
  for (const p of q.anglePrompts) lines.push(`- ${p}`);
  lines.push('');

  lines.push('## 🔒 Você cria (a IA não faz)');
  for (const item of q.youProvide) lines.push(`- [ ] ${item}`);
  lines.push('');

  lines.push('## Template de edição que será aplicado');
  const t = q.templateSpec;
  lines.push(`- **Capa:** ${t.coverLabel}`);
  lines.push(`- **Formato:** ${t.aspect}`);
  lines.push(`- **Legendas:** ${t.captionStyle}`);
  lines.push(`- **Trilha:** ${t.musicMood}`);
  lines.push(`- **Notas:** ${t.notes}`);
  lines.push('');

  lines.push('## Para aprovar este post');
  lines.push('1. Escreva sua legenda em `legenda.txt` dentro desta pasta.');
  lines.push('2. Coloque a capa/foto que você criou em `capa.jpg` (se o quadro pedir).');
  lines.push('3. Mova a pasta inteira para `02_aprovados/`.');
  lines.push('4. O editor por template (Fase 2) processa e agenda automaticamente.');
  lines.push('');

  return lines.join('\n');
}

/** @param {string} s @param {number} n */
function truncate(s, n) {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n - 1) + '…' : clean;
}
