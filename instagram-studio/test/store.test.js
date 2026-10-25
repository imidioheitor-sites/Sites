import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { Store } from '../src/store.js';

function tmpPath() {
  return join(tmpdir(), `igstore_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

test('roundtrip: salva e recarrega', () => {
  const p = tmpPath();
  new Store(p).recordIngest('post_2026-07-24_review-livro', 'review-livro').save();
  const loaded = new Store(p).load();
  assert.equal(loaded.quadroForFolder('post_2026-07-24_review-livro'), 'review-livro');
  rmSync(p, { force: true });
});

test('fecha o loop mídia → quadro', () => {
  const p = tmpPath();
  const s = new Store(p);
  s.recordIngest('post_2026-07-24_dicas-estudo', 'dicas-estudo');
  s.recordPublish('post_2026-07-24_dicas-estudo', 'IG_MEDIA_123');
  assert.equal(s.quadroForMedia('IG_MEDIA_123'), 'dicas-estudo');
  rmSync(p, { force: true });
});

test('load de arquivo inexistente começa vazio', () => {
  const s = new Store(tmpPath()).load();
  assert.deepEqual(s.data, { posts: {} });
  assert.equal(s.quadroForMedia('nope'), undefined);
});

test('recordPublish antes de ingest não perde o folderName', () => {
  const s = new Store(tmpPath());
  s.recordPublish('post_x', 'M1');
  assert.equal(s.data.posts['post_x'].folderName, 'post_x');
  assert.equal(s.data.posts['post_x'].mediaId, 'M1');
});
