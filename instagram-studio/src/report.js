// Renderiza o relatório de performance (Fase 3): resumo para console + email HTML.
//
// O email é "email-safe": tabelas + estilos inline, tema claro único (clientes de
// email não lidam bem com temas). Paleta alinhada ao documento de arquitetura
// (grafite + dourado) para o produto parecer coeso.

import { quadroById } from './quadros.js';
import { pct } from './analyze.js';

const C = {
  ink: '#1A1D24',
  soft: '#474D57',
  faint: '#757C86',
  line: '#E4E7EC',
  bg: '#F3F5F8',
  gold: '#96661A',
  goldWash: '#F6EBD6',
  good: '#3C8A54',
  warn: '#B0722A',
  bad: '#AF4B39',
};
const SEV = { good: C.good, warn: C.warn, critical: C.bad };
const SEV_LABEL = { good: '✓', warn: '!', critical: '✕' };

/** @param {ReturnType<import('./analyze.js').analyzePosts>} a */
export function renderReportText(a) {
  const L = [];
  const bar = '─'.repeat(60);
  L.push(bar);
  L.push('  RELATÓRIO DE PERFORMANCE — Instagram Studio');
  L.push(bar);
  L.push(
    `  ${a.totals.posts} posts · alcance ${a.totals.reach} · ${a.totals.saves} salvos · +${a.totals.follows} seguidores`,
  );
  L.push(`  engajamento médio ${pct(a.totals.avgEngRate)}\n`);

  L.push('  RANKING POR QUADRO (por taxa de salvamento)');
  for (const q of a.perQuadro)
    L.push(`   • ${q.name.padEnd(42)} save ${pct(q.avgSaveRate)} · eng ${pct(q.avgEngRate)} · ${q.posts}p`);
  L.push('');

  L.push('  RECOMENDAÇÕES');
  for (const r of a.recommendations) L.push(`   [${r.priority}] ${r.message}\n            → ${r.action}`);
  L.push('');

  L.push('  DESTAQUES POR POST');
  for (const p of a.perPost) {
    if (!p.flags.length) continue;
    L.push(`   ${p.postId} (${quadroById(p.quadroId).name})`);
    for (const f of p.flags) L.push(`     ${SEV_LABEL[f.severity]} ${f.message}  → ${f.action}`);
  }
  L.push('\n  As recomendações são direção — roteiro, legenda e capa continuam seus.');
  L.push(bar);
  return L.join('\n');
}

/** @param {ReturnType<import('./analyze.js').analyzePosts>} a @param {{period?:string}} [opts] */
export function renderReportEmail(a, opts = {}) {
  const period = opts.period || 'últimos posts';
  const kpi = (label, value) => `
    <td style="padding:14px 16px;background:#fff;border:1px solid ${C.line};border-radius:10px;">
      <div style="font:600 22px/1.1 -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};">${value}</div>
      <div style="font:500 11px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${C.faint};margin-top:4px;">${label}</div>
    </td>`;

  const quadroRows = a.perQuadro
    .map(
      (q, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${C.line};font:${i === 0 ? 700 : 400} 14px -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};">${i === 0 ? '🏆 ' : ''}${esc(q.name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${C.line};font:600 14px ui-monospace,Menlo,monospace;color:${C.gold};text-align:right;">${pct(q.avgSaveRate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${C.line};font:400 14px ui-monospace,Menlo,monospace;color:${C.soft};text-align:right;">${pct(q.avgEngRate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${C.line};font:400 14px ui-monospace,Menlo,monospace;color:${C.soft};text-align:right;">${q.avgReach}</td>
    </tr>`,
    )
    .join('');

  const recRows = a.recommendations
    .map(
      (r) => `
    <tr><td style="padding:12px 14px;border-left:3px solid ${C.gold};background:${C.goldWash};border-radius:8px;">
      <div style="font:600 11px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.gold};">Prioridade ${esc(r.priority)}</div>
      <div style="font:500 15px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};margin:4px 0;">${esc(r.message)}</div>
      <div style="font:400 14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:${C.soft};">→ ${esc(r.action)}</div>
    </td></tr><tr><td style="height:8px;"></td></tr>`,
    )
    .join('');

  const postRows = a.perPost
    .filter((p) => p.flags.length)
    .map((p) => {
      const flags = p.flags
        .map(
          (f) =>
            `<div style="font:400 13px/1.4 -apple-system,sans-serif;color:${C.soft};margin-top:3px;"><span style="color:${SEV[f.severity]};font-weight:700;">${SEV_LABEL[f.severity]}</span> ${esc(f.message)} <span style="color:${C.faint};">→ ${esc(f.action)}</span></div>`,
        )
        .join('');
      return `
    <tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};">
      <div style="font:600 14px -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};">${esc(p.postId)}
        <span style="font-weight:400;color:${C.faint};">· ${esc(quadroById(p.quadroId).name)} · ${p.format}</span></div>
      ${flags}
    </td></tr>`;
    })
    .join('');

  return `<!-- email-safe: tabelas + estilos inline -->
<div style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden;">

  <tr><td style="padding:26px 28px 8px;">
    <div style="font:600 11px -apple-system,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};">Instagram Studio · Relatório</div>
    <div style="font:600 24px/1.15 Georgia,'Times New Roman',serif;color:${C.ink};margin-top:6px;">Como seus posts foram — ${esc(period)}</div>
  </td></tr>

  <tr><td style="padding:14px 28px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${kpi('Posts', a.totals.posts)}<td style="width:10px;"></td>
      ${kpi('Alcance', a.totals.reach)}<td style="width:10px;"></td>
      ${kpi('Salvos', a.totals.saves)}<td style="width:10px;"></td>
      ${kpi('Seguidores', '+' + a.totals.follows)}
    </tr></table>
  </td></tr>

  <tr><td style="padding:22px 28px 6px;">
    <div style="font:600 15px -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};margin-bottom:10px;">O que fazer a seguir</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${recRows}</table>
  </td></tr>

  <tr><td style="padding:12px 28px 6px;">
    <div style="font:600 15px -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};margin-bottom:6px;">Ranking por quadro</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 12px;font:600 10px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.faint};">Quadro</td>
        <td style="padding:6px 12px;font:600 10px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.faint};text-align:right;">Salvam.</td>
        <td style="padding:6px 12px;font:600 10px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.faint};text-align:right;">Engaj.</td>
        <td style="padding:6px 12px;font:600 10px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.faint};text-align:right;">Alcance</td>
      </tr>
      ${quadroRows}
    </table>
  </td></tr>

  <tr><td style="padding:20px 28px 6px;">
    <div style="font:600 15px -apple-system,Segoe UI,Roboto,sans-serif;color:${C.ink};margin-bottom:4px;">Destaques por post</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${postRows}</table>
  </td></tr>

  <tr><td style="padding:18px 28px 26px;">
    <div style="font:400 12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:${C.faint};border-top:1px solid ${C.line};padding-top:14px;">
      🔒 As recomendações são <b>direção</b>. Roteiro, legenda e capa continuam sendo criados por você — o Studio só organiza, edita e mede.
    </div>
  </td></tr>

</table>
</td></tr></table>
</div>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
