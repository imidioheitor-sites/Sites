// Wrapper de produção do relatório (Fase 3) — Insights → análise → email.
//
//   node run-report.js --dry-run   # usa fixture (ou Insights, se houver chave) e
//                                   # escreve out/report.html, SEM enviar email
//   node run-report.js             # busca Insights reais, mapeia o quadro e envia
//                                   # o email pelo Gmail
//
// Mapeia cada métrica (que vem por mediaId) ao quadro certo via src/store.js.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePosts } from './src/analyze.js';
import { renderReportText, renderReportEmail } from './src/report.js';
import { Store } from './src/store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch {
  /* sem .env */
}

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const log = (m) => process.stderr.write(m + '\n');

async function main() {
  const hasIg = !!(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
  let insights;

  if (hasIg) {
    log('Buscando Insights na Graph API...');
    const { fetchRecentInsights } = await import('./src/adapters/insights.js');
    insights = await fetchRecentInsights();
    insights = mapQuadros(insights);
  } else if (isDryRun) {
    log('Sem IG_* no .env — usando fixture de exemplo.');
    insights = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-insights.json'), 'utf8'));
  } else {
    throw new Error('IG_USER_ID / IG_ACCESS_TOKEN não configurados — não dá para gerar o relatório real.');
  }

  const analysis = analyzePosts(insights);
  log('\n' + renderReportText(analysis));
  const html = renderReportEmail(analysis, { period: 'últimos posts' });

  if (isDryRun || !process.env.REPORT_TO) {
    const OUT = join(__dirname, 'out');
    mkdirSync(OUT, { recursive: true });
    const dest = join(OUT, 'report.html');
    writeFileSync(dest, html, 'utf8');
    log(`\nEmail HTML escrito em ${dest} (não enviado).`);
    return { posts: analysis.totals.posts, sent: false };
  }

  log('Enviando por Gmail...');
  const { sendEmail } = await import('./src/adapters/email.js');
  await sendEmail({ to: process.env.REPORT_TO, subject: 'Seu relatório do Instagram Studio', html });
  log('Enviado.');
  return { posts: analysis.totals.posts, sent: true };
}

/** Usa a store p/ atribuir o quadro certo a cada métrica (vem por mediaId). */
function mapQuadros(insights) {
  const storePath = process.env.STUDIO_STORE;
  if (!storePath) return insights;
  const store = new Store(storePath).load();
  return insights.map((i) => ({ ...i, quadroId: store.quadroForMedia(i.postId) || i.quadroId || 'geral' }));
}

main()
  .then((r) => process.stdout.write(JSON.stringify(r, null, 2) + '\n'))
  .catch((err) => {
    log('\n✖ ' + (err?.message || err));
    process.exit(1);
  });
