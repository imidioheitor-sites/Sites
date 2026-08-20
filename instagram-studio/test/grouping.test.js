import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupAssets, scoreAsset } from '../src/grouping.js';

const dir = dirname(fileURLToPath(import.meta.url));
const assets = JSON.parse(readFileSync(join(dir, '..', 'fixtures', 'sample-inbox.json'), 'utf8'));

test('agrupa 9 arquivos em 6 posts', () => {
  const { groups } = groupAssets(assets);
  assert.equal(groups.length, 6);
});

test('junta os dois clipes de rotina do mesmo dia num só post', () => {
  const { groups } = groupAssets(assets);
  const rotina = groups.find((g) => g.quadroId === 'rotina-dia');
  assert.ok(rotina, 'grupo rotina-dia existe');
  assert.equal(rotina.assetIds.length, 2);
  assert.equal(rotina.folderName, 'post_2026-07-24_rotina-dia');
});

test('imagem sem sinal cai no fallback "geral"', () => {
  const { groups } = groupAssets(assets);
  const geral = groups.find((g) => g.quadroId === 'geral');
  assert.ok(geral, 'grupo geral existe');
  assert.deepEqual(geral.assetIds, ['img_009']);
  assert.equal(geral.score, 0);
});

test('scoreAsset reconhece o quadro pela fala/tags', () => {
  const book = assets.find((a) => a.id === 'vid_004');
  const s = scoreAsset(book);
  assert.equal(s.quadroId, 'review-livro');
  assert.ok(s.score > 0);
  assert.ok(s.hits.includes('livro'));
});

test('grupos vêm ordenados por prontidão (mais itens primeiro)', () => {
  const { groups } = groupAssets(assets);
  for (let i = 1; i < groups.length; i++) {
    assert.ok(groups[i - 1].assetIds.length >= groups[i].assetIds.length);
  }
});
