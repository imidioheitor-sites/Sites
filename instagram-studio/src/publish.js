// Planejador de publicação (Fase 2/4) — decide o que pode ir ao ar.
//
// Une o cronograma (schedule.js) com o estado de aprovação de cada post. Um post
// só é publicável se VOCÊ o aprovou: moveu para 02_aprovados, escreveu a legenda
// e (quando o quadro pede) forneceu a capa. Se faltar sua criação, ele é BARRADO
// — é assim que a regra de ouro vive na camada de postagem.

import { quadroById } from './quadros.js';

/**
 * @typedef {Object} Approval
 * @property {string} folderName
 * @property {string} [caption]      SUA legenda (conteúdo em legenda.txt)
 * @property {boolean} [hasCover]    capa fornecida por você
 * @property {string[]} [mediaUrls]  SEU material editado
 */

/** O quadro exige capa fornecida por você? (data-driven pelo youProvide) */
export function requiresCover(quadroId) {
  return quadroById(quadroId).youProvide.some((d) => /capa|foto/i.test(d));
}

/**
 * Separa as entradas do cronograma em prontas x barradas.
 * @param {import('./schedule.js').ScheduleEntry[]} schedule
 * @param {Approval[]} approvals
 * @param {{ until?: string }} [opts]  só considera entradas até esta data (YYYY-MM-DD)
 * @returns {{ ready: {entry:any,approval:Approval}[], blocked: {entry:any,reason:string}[] }}
 */
export function planPublications(schedule, approvals, opts = {}) {
  const byFolder = new Map(approvals.map((a) => [a.folderName, a]));
  const ready = [];
  const blocked = [];

  for (const entry of schedule) {
    if (!entry.folderName) continue; // stories são direção sua, não entram aqui
    if (opts.until && entry.date > opts.until) continue;

    const a = byFolder.get(entry.folderName);
    if (!a) {
      blocked.push({ entry, reason: 'não aprovado (mova a pasta para 02_aprovados)' });
      continue;
    }
    if (!a.caption || !a.caption.trim()) {
      blocked.push({ entry, reason: '🔒 faltando legenda — você precisa criar (legenda.txt)' });
      continue;
    }
    if (requiresCover(entry.quadroId) && !a.hasCover) {
      blocked.push({ entry, reason: '🔒 faltando capa — você precisa criar (capa.jpg)' });
      continue;
    }
    ready.push({ entry, approval: a });
  }
  return { ready, blocked };
}

/**
 * Despacha as publicações prontas pelo publisher escolhido.
 * @param {{entry:any,approval:Approval}[]} ready
 * @param {{ publish: (job:any)=>Promise<any> }} publisher
 */
export async function dispatch(ready, publisher) {
  const results = [];
  for (const job of ready) results.push(await publisher.publish(job));
  return results;
}
