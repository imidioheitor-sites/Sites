import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePosts } from '../src/analyze.js';
import { weeklyRecommendations } from '../src/recommend.js';
import { parseFeed } from '../src/adapters/news.js';
import { modelsFor } from '../src/contentModels.js';

const dir = dirname(fileURLToPath(import.meta.url));
const insights = JSON.parse(readFileSync(join(dir, '..', 'fixtures', 'sample-insights.json'), 'utf8'));
const news = JSON.parse(readFileSync(join(dir, '..', 'fixtures', 'sample-news.json'), 'utf8'));

test('foco prioriza o quadro líder em salvamentos', () => {
  const analysis = analyzePosts(insights);
  const recs = weeklyRecommendations({ analysis, news });
  assert.equal(recs.focus[0].quadroId, 'dicas-estudo');
});

test('gera uma ideia por quadro, com ângulo (direção)', () => {
  const recs = weeklyRecommendations({ analysis: analyzePosts(insights), news });
  assert.equal(recs.ideas.length, 5); // 5 quadros
  for (const i of recs.ideas) {
    assert.ok(i.prompt && i.prompt.length > 0);
    assert.ok(i.model && i.structure);
  }
});

test('marca como destaque os quadros do foco', () => {
  const recs = weeklyRecommendations({ analysis: analyzePosts(insights), news });
  const dicas = recs.ideas.find((i) => i.quadroId === 'dicas-estudo');
  assert.equal(dicas.highlighted, true);
});

test('trends viram temas com ângulo, sem opinião pronta', () => {
  const recs = weeklyRecommendations({ analysis: analyzePosts(insights), news });
  assert.equal(recs.news.length, 3);
  for (const n of recs.news) assert.match(n.angle, /sua leitura|opinião|ângulo|leitura contrária/i);
});

test('sem dados de análise, mantém recomendação de equilíbrio', () => {
  const recs = weeklyRecommendations({ news });
  assert.ok(recs.focus.length >= 1);
  assert.match(recs.focus[0].why, /sem dados/i);
});

test('modelsFor sempre retorna ao menos um modelo', () => {
  assert.ok(modelsFor('review-livro').length >= 1);
  assert.ok(modelsFor('inexistente').length >= 1);
});

test('parseFeed lê RSS (item) e Atom (entry)', () => {
  const rss = `<rss><channel>
    <item><title>Notícia A</title><link>https://x/a</link><pubDate>Mon, 27 Jul 2026 10:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const atom = `<feed>
    <entry><title>Notícia B</title><link href="https://x/b"/><updated>2026-07-27T10:00:00Z</updated></entry>
  </feed>`;
  const a = parseFeed(rss);
  const b = parseFeed(atom);
  assert.equal(a[0].title, 'Notícia A');
  assert.equal(a[0].link, 'https://x/a');
  assert.equal(b[0].title, 'Notícia B');
  assert.equal(b[0].link, 'https://x/b');
});
