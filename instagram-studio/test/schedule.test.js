import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedule } from '../src/schedule.js';
import { DEFAULT_STRATEGY } from '../src/strategy.js';

const START = '2026-07-28'; // terça

const candidates = [
  { quadroId: 'rotina-dia', folderName: 'p_rotina', hasVideo: true, score: 1 },
  { quadroId: 'review-livro', folderName: 'p_review', hasVideo: false, score: 1 },
  { quadroId: 'quickstart-materia', folderName: 'p_quick', hasVideo: true, score: 1 },
  { quadroId: 'comentario-noticia', folderName: 'p_news', hasVideo: true, score: 1 },
  { quadroId: 'dicas-estudo', folderName: 'p_dicas', hasVideo: true, score: 1 },
];

test('no máximo 1 post principal por dia', () => {
  const schedule = buildSchedule(candidates, { startDate: START, days: 14 });
  const mainPerDay = new Map();
  for (const e of schedule) {
    if (e.format === 'story') continue;
    mainPerDay.set(e.date, (mainPerDay.get(e.date) || 0) + 1);
  }
  for (const [, n] of mainPerDay) assert.ok(n <= DEFAULT_STRATEGY.cadence.maxMainPerDay);
});

test('nenhuma colisão de horário no mesmo dia', () => {
  const schedule = buildSchedule(candidates, { startDate: START, days: 14 });
  const seen = new Set();
  for (const e of schedule) {
    const key = `${e.date} ${e.time}`;
    assert.ok(!seen.has(key), `colisão em ${key}`);
    seen.add(key);
  }
});

test('fim de semana usa as janelas de fim de semana', () => {
  const schedule = buildSchedule(candidates, { startDate: START, days: 14 });
  for (const e of schedule) {
    const day = new Date(e.date + 'T12:00:00').getDay();
    if (day !== 0 && day !== 6) continue;
    const allowed = DEFAULT_STRATEGY.windows[e.format].weekend;
    assert.ok(allowed.includes(e.time), `${e.time} não é janela de fim de semana para ${e.format}`);
  }
});

test('imagem-only vira feed, vídeo respeita o quadro', () => {
  const schedule = buildSchedule(candidates, { startDate: START, days: 14 });
  const review = schedule.find((e) => e.folderName === 'p_review');
  assert.equal(review.format, 'feed'); // review-livro + sem vídeo
  const quick = schedule.find((e) => e.folderName === 'p_quick');
  assert.equal(quick.format, 'reel');
});

test('respeita o gap mínimo entre posts do mesmo quadro', () => {
  const same = [
    { quadroId: 'dicas-estudo', folderName: 'd1', hasVideo: true, score: 1 },
    { quadroId: 'dicas-estudo', folderName: 'd2', hasVideo: true, score: 1 },
  ];
  const schedule = buildSchedule(same, { startDate: START, days: 14 });
  const days = schedule.filter((e) => e.format !== 'story').map((e) => e.date).sort();
  assert.equal(days.length, 2);
  const gap = (new Date(days[1] + 'T12:00:00') - new Date(days[0] + 'T12:00:00')) / 86400000;
  assert.ok(gap >= DEFAULT_STRATEGY.cadence.minGapDaysSameQuadro, `gap ${gap} < mínimo`);
});

test('gera stories para cada dia com post principal', () => {
  const schedule = buildSchedule(candidates, { startDate: START, days: 14 });
  const mainDays = new Set(schedule.filter((e) => e.format !== 'story').map((e) => e.date));
  const storyDays = new Set(schedule.filter((e) => e.format === 'story').map((e) => e.date));
  for (const d of mainDays) assert.ok(storyDays.has(d), `sem story no dia ${d}`);
});
