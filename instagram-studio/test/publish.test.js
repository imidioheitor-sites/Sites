import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planPublications, dispatch, requiresCover } from '../src/publish.js';
import { DryRunPublisher } from '../src/adapters/publisher.js';

const schedule = [
  { date: '2026-07-28', time: '12:00', tz: 'America/Sao_Paulo', format: 'reel', quadroId: 'rotina-dia', folderName: 'p_rotina' },
  { date: '2026-07-29', time: '12:30', tz: 'America/Sao_Paulo', format: 'feed', quadroId: 'review-livro', folderName: 'p_review' },
  { date: '2026-07-30', time: '12:00', tz: 'America/Sao_Paulo', format: 'reel', quadroId: 'dicas-estudo', folderName: 'p_dicas' },
  { date: '2026-07-28', time: '09:00', tz: 'America/Sao_Paulo', format: 'story', quadroId: 'rotina-dia', note: 'grave um bastidor' },
];

test('quadro de livro exige capa; rotina não', () => {
  assert.equal(requiresCover('review-livro'), true);
  assert.equal(requiresCover('rotina-dia'), false);
});

test('barra post sem legenda (regra de ouro)', () => {
  const approvals = [{ folderName: 'p_dicas', caption: '', hasCover: false }];
  const { ready, blocked } = planPublications(schedule, approvals);
  assert.equal(ready.length, 0);
  const b = blocked.find((x) => x.entry.folderName === 'p_dicas');
  assert.match(b.reason, /faltando legenda/i);
});

test('barra post de livro sem capa', () => {
  const approvals = [{ folderName: 'p_review', caption: 'minha resenha', hasCover: false }];
  const { ready, blocked } = planPublications(schedule, approvals);
  assert.equal(ready.length, 0);
  const b = blocked.find((x) => x.entry.folderName === 'p_review');
  assert.match(b.reason, /faltando capa/i);
});

test('publica quando aprovado com legenda (e capa quando exigida)', () => {
  const approvals = [
    { folderName: 'p_rotina', caption: 'minha rotina', hasCover: false },
    { folderName: 'p_review', caption: 'minha resenha', hasCover: true },
  ];
  const { ready, blocked } = planPublications(schedule, approvals);
  const readyFolders = ready.map((r) => r.entry.folderName).sort();
  assert.deepEqual(readyFolders, ['p_review', 'p_rotina']);
  // p_dicas segue barrado por não ter aprovação
  assert.ok(blocked.some((b) => b.entry.folderName === 'p_dicas'));
});

test('stories não entram no publisher (são direção sua)', () => {
  const approvals = [{ folderName: 'p_rotina', caption: 'x' }];
  const { ready, blocked } = planPublications(schedule, approvals);
  const all = [...ready.map((r) => r.entry), ...blocked.map((b) => b.entry)];
  assert.ok(all.every((e) => e.format !== 'story'));
});

test('dispatch registra as publicações no dry-run', async () => {
  const approvals = [{ folderName: 'p_rotina', caption: 'minha rotina' }];
  const { ready } = planPublications(schedule, approvals);
  const pub = new DryRunPublisher();
  const results = await dispatch(ready, pub);
  assert.equal(results.length, 1);
  assert.equal(pub.published.length, 1);
  assert.equal(pub.published[0].status, 'dry-run');
  assert.equal(results[0].folderName, 'p_rotina');
});

test('filtro "until" ignora entradas futuras', () => {
  const approvals = [
    { folderName: 'p_rotina', caption: 'a' },
    { folderName: 'p_dicas', caption: 'b' },
  ];
  const { ready } = planPublications(schedule, approvals, { until: '2026-07-28' });
  assert.deepEqual(ready.map((r) => r.entry.folderName), ['p_rotina']);
});
