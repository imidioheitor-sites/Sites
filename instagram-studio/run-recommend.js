// Wrapper de produção das recomendações (Fase 4).
//
//   node run-recommend.js --dry-run   # usa fixtures (insights + notícias)
//   node run-recommend.js             # notícias reais (RSS) + Insights, se houver
//
// Sempre direção — nunca conteúdo pronto.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePosts } from './src/analyze.js';
import { weeklyRecommendations, renderRecommendationsText } from './src/recommend.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch {
  /* sem .env */
}
const isDryRun = new Set(process.argv.slice(2)).has('--dry-run');
const log = (m) => process.stderr.write(m + '\n');

async function main() {
  // Notícias: RSS real fora do dry-run; fixture no dry-run.
  let news;
  if (isDryRun) {
    news = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-news.json'), 'utf8'));
  } else {
    const { fetchNews } = await import('./src/adapters/news.js');
    log('Buscando trends (RSS)...');
    news = await fetchNews();
  }

  // Análise: Insights reais se houver chave; senão fixture (ou nada).
  let analysis;
  if (process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN && !isDryRun) {
    const { fetchRecentInsights } = await import('./src/adapters/insights.js');
    analysis = analyzePosts(await fetchRecentInsights());
  } else {
    try {
      analysis = analyzePosts(JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-insights.json'), 'utf8')));
    } catch {
      analysis = undefined; // sem dados ainda → foco de equilíbrio
    }
  }

  const recs = weeklyRecommendations({ analysis, news });
  const text = renderRecommendationsText(recs);
  log('\n' + text);

  const OUT = join(__dirname, 'out');
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'recommendations.txt'), text + '\n', 'utf8');
  return { focus: recs.focus.length, ideas: recs.ideas.length, news: recs.news.length };
}

main()
  .then((r) => process.stdout.write(JSON.stringify(r, null, 2) + '\n'))
  .catch((err) => {
    log('\n✖ ' + (err?.message || err));
    process.exit(1);
  });
