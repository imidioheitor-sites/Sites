import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePosts } from '../src/analyze.js';

const dir = dirname(fileURLToPath(import.meta.url));
const insights = JSON.parse(readFileSync(join(dir, '..', 'fixtures', 'sample-insights.json'), 'utf8'));
const a = analyzePosts(insights);

test('detecta gancho fraco (retenção 3s abaixo do limite)', () => {
  const rotina = a.perPost.find((p) => p.postId === 'post_2026-07-24_rotina-dia');
  const weak = rotina.flags.find((f) => f.severity === 'critical' && /gancho fraco/i.test(f.message));
  assert.ok(weak, 'rotina-dia (0.38) deve ter flag de gancho fraco');
});

test('marca gancho forte quando a retenção é alta', () => {
  const quick = a.perPost.find((p) => p.postId === 'post_2026-07-25_quickstart-materia');
  const good = quick.flags.find((f) => f.severity === 'good' && /gancho forte/i.test(f.message));
  assert.ok(good, 'quickstart (0.61) deve ter flag de gancho forte');
});

test('melhor horário sai no fuso correto (não em UTC)', () => {
  // dicas-estudo (Sáb 11:00 BRT) tem o maior engajamento — não pode virar 14:00 UTC.
  assert.equal(a.bestTimes[0].slot, 'Sáb 11:00');
});

test('ranking por quadro lidera pelo maior salvamento', () => {
  assert.equal(a.perQuadro[0].quadroId, 'dicas-estudo');
});

test('gera recomendação de gancho quando há Reels fracos', () => {
  const rec = a.recommendations.find((r) => /gancho fraco/i.test(r.message));
  assert.ok(rec, 'deve recomendar reabrir os 3s');
});

test('totais somam corretamente', () => {
  assert.equal(a.totals.posts, 6);
  assert.equal(a.totals.follows, 12 + 20 + 55 + 8 + 40 + 2);
});
