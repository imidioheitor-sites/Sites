// Demo das recomendações da semana (Fase 4) — offline, zero dependências.
//
//   node recommend-demo.js
//
// Combina os SEUS dados de performance (fixture de insights) + os modelos de
// conteúdo + trends de notícia (fixture) e imprime as recomendações da semana.
// Tudo é direção — você grava e escreve.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePosts } from './src/analyze.js';
import { weeklyRecommendations, renderRecommendationsText } from './src/recommend.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(join(__dirname, 'fixtures', f), 'utf8'));

const analysis = analyzePosts(read('sample-insights.json'));
const news = read('sample-news.json');

const recs = weeklyRecommendations({ analysis, news });
console.log('\n' + renderRecommendationsText(recs));
console.log('\n  (produção: notícias reais via src/adapters/news.js — RSS público, sem raspar o Instagram)\n');
