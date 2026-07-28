// Demo do relatório de performance (Fase 3) — offline, zero dependências.
//
//   node report-demo.js
//
// Lê fixtures/sample-insights.json (métricas como viriam da Graph API), roda a
// análise, imprime o resumo no console e escreve o email HTML em out/report.html.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePosts } from './src/analyze.js';
import { renderReportText, renderReportEmail } from './src/report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');

const insights = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-insights.json'), 'utf8'));
const analysis = analyzePosts(insights);

console.log('\n' + renderReportText(analysis));

mkdirSync(OUT, { recursive: true });
const html = renderReportEmail(analysis, { period: '28/07 – 02/08' });
const dest = join(OUT, 'report.html');
writeFileSync(dest, html, 'utf8');
console.log(`\n  Email HTML gerado: ${dest.replace(process.cwd() + '/', './')}`);
console.log('  (em produção, este HTML é enviado por Gmail — ver src/adapters/email.js)\n');
