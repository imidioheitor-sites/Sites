// Agendador (Fase 2) — monta o cronograma coordenando Reels/feed e stories.
//
// Entrada: candidatos (posts propostos/aprovados) + estratégia.
// Saída: uma agenda determinística, sem colisão, que:
//   - põe no máximo 1 post principal por dia, na melhor janela livre;
//   - evita repetir o mesmo quadro em dias muito próximos;
//   - alterna os quadros para o feed não ficar monótono;
//   - gera slots de story por dia (companheiros do post — direção, não conteúdo).

import { DEFAULT_STRATEGY, formatFor } from './strategy.js';

/**
 * @typedef {Object} Candidate
 * @property {string} quadroId
 * @property {string} folderName
 * @property {boolean} hasVideo
 * @property {number} [score]
 */

/**
 * @typedef {Object} ScheduleEntry
 * @property {string} date       YYYY-MM-DD
 * @property {string} time       HH:MM
 * @property {string} tz
 * @property {'reel'|'feed'|'story'} format
 * @property {string} quadroId
 * @property {string} [folderName]
 * @property {string} [note]     para stories: a direção (o que gravar) — você cria
 */

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00'); // meio-dia evita off-by-one de fuso
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
function isWeekend(dateStr) {
  const day = new Date(dateStr + 'T12:00:00').getDay(); // 0=dom, 6=sáb
  return day === 0 || day === 6;
}
export function weekdayName(dateStr) {
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return names[new Date(dateStr + 'T12:00:00').getDay()];
}

/** Intercala os candidatos por quadro (round-robin) para variar o feed. */
function interleaveByQuadro(candidates) {
  /** @type {Map<string, Candidate[]>} */
  const buckets = new Map();
  for (const c of candidates) {
    if (!buckets.has(c.quadroId)) buckets.set(c.quadroId, []);
    buckets.get(c.quadroId).push(c);
  }
  // dentro de cada quadro, mais confiantes primeiro
  for (const list of buckets.values()) list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const order = [];
  const lists = [...buckets.values()];
  let added = true;
  while (added) {
    added = false;
    for (const list of lists) {
      const next = list.shift();
      if (next) {
        order.push(next);
        added = true;
      }
    }
  }
  return order;
}

/**
 * @param {Candidate[]} candidates
 * @param {{ startDate?: string, days?: number, strategy?: typeof DEFAULT_STRATEGY }} [opts]
 * @returns {ScheduleEntry[]}
 */
export function buildSchedule(candidates, opts = {}) {
  const strategy = opts.strategy || DEFAULT_STRATEGY;
  const days = opts.days ?? 14;
  const start = opts.startDate || toDateStr(new Date());

  const horizon = Array.from({ length: days }, (_, i) => addDays(start, i));

  /** estado por dia */
  const dayState = new Map(
    horizon.map((d) => [d, { mainCount: 0, usedTimes: new Set(), mainEntry: /** @type {ScheduleEntry|null} */ (null) }]),
  );
  /** último dia agendado por quadro, p/ respeitar o gap */
  const lastByQuadro = new Map();

  /** @type {ScheduleEntry[]} */
  const entries = [];
  const order = interleaveByQuadro(candidates);

  for (const c of order) {
    const fmt = formatFor(c.quadroId, c.hasVideo, strategy);
    const placed = placeMain(c, fmt, horizon, dayState, lastByQuadro, strategy);
    if (placed) entries.push(placed);
    // Candidatos que não couberam no horizonte ficam para a próxima rodada (fila).
  }

  // Stories: por dia com post principal, gera companheiros (direção, não conteúdo).
  for (const date of horizon) {
    const st = dayState.get(date);
    if (!st.mainEntry) continue;
    const storyTimes = pickWindows('story', date, strategy).filter((t) => !st.usedTimes.has(t));
    const n = Math.min(strategy.cadence.storiesPerDay, storyTimes.length);
    for (let i = 0; i < n; i++) {
      entries.push({
        date,
        time: storyTimes[i],
        tz: strategy.tz,
        format: 'story',
        quadroId: st.mainEntry.quadroId,
        note: i === 0 ? storyTeaser(st.mainEntry) : storyGeneric(),
      });
    }
  }

  entries.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return entries;
}

function placeMain(c, fmt, horizon, dayState, lastByQuadro, strategy) {
  for (const date of horizon) {
    const st = dayState.get(date);
    if (st.mainCount >= strategy.cadence.maxMainPerDay) continue;

    const last = lastByQuadro.get(c.quadroId);
    if (last && daysBetween(last, date) < strategy.cadence.minGapDaysSameQuadro) continue;

    const time = pickWindows(fmt, date, strategy).find((t) => !st.usedTimes.has(t));
    if (!time) continue;

    /** @type {ScheduleEntry} */
    const entry = { date, time, tz: strategy.tz, format: fmt, quadroId: c.quadroId, folderName: c.folderName };
    st.mainCount++;
    st.usedTimes.add(time);
    st.mainEntry = entry;
    lastByQuadro.set(c.quadroId, date);
    return entry;
  }
  return null;
}

function pickWindows(fmt, date, strategy) {
  const set = strategy.windows[fmt];
  return isWeekend(date) ? set.weekend : set.weekday;
}
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
}

function storyTeaser(main) {
  return `Chamada para o post de hoje (${main.format}): grave um bastidor de 5–10s puxando a curiosidade. Você grava.`;
}
function storyGeneric() {
  return 'Story de rotina/enquete: uma caixinha de pergunta ou bastidor do dia. Você grava.';
}
