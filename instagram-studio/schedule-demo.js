// Demo do cronograma + receita de edição (Fase 2) — offline, zero dependências.
//
//   node schedule-demo.js
//
// Reusa o agrupamento da Fase 1, trata os posts como candidatos, monta uma
// agenda coordenada (Reels/feed + stories) e imprime uma receita de edição.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupAssets } from './src/grouping.js';
import { buildSchedule, weekdayName } from './src/schedule.js';
import { buildRecipe, renderRecipeMarkdown, ffmpegOutline } from './src/renderRecipe.js';
import { quadroById } from './src/quadros.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const START = '2026-07-28'; // fixo p/ saída reproduzível; em produção = hoje

function main() {
  const assets = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-inbox.json'), 'utf8'));
  const { groups } = groupAssets(assets);

  const candidates = groups.map((g) => ({
    quadroId: g.quadroId,
    folderName: g.folderName,
    hasVideo: g.assetIds.some((id) => assets.find((a) => a.id === id)?.kind === 'video'),
    score: g.score,
  }));

  const schedule = buildSchedule(candidates, { startDate: START, days: 14 });
  printCalendar(schedule);

  // Receita de edição de um post principal (o primeiro Reel).
  const firstReel = groups.find((g) =>
    g.assetIds.some((id) => assets.find((a) => a.id === id)?.kind === 'video'),
  );
  if (firstReel) {
    const recipe = buildRecipe(firstReel, assets);
    console.log('\n' + '═'.repeat(64));
    console.log('  RECEITA DE EDIÇÃO (exemplo)');
    console.log('═'.repeat(64) + '\n');
    console.log(renderRecipeMarkdown(recipe));
    console.log('--- esboço ffmpeg (ilustrativo, não executa aqui) ---\n');
    console.log(ffmpegOutline(recipe));
  }
}

const ICON = { reel: '🎬', feed: '🖼️ ', story: '⚡' };

function printCalendar(schedule) {
  const line = '═'.repeat(64);
  console.log('\n' + line);
  console.log('  INSTAGRAM STUDIO — Cronograma (Fase 2, demo offline)');
  console.log(line);

  const mains = schedule.filter((e) => e.format !== 'story').length;
  const stories = schedule.filter((e) => e.format === 'story').length;
  console.log(`  ${mains} post(s) principal(is) + ${stories} story(ies) em 14 dias\n`);

  let currentDate = null;
  for (const e of schedule) {
    if (e.date !== currentDate) {
      currentDate = e.date;
      console.log(`  ┌─ ${weekdayName(e.date)} ${e.date}`);
    }
    if (e.format === 'story') {
      console.log(`  │   ${e.time}  ${ICON.story} story   ${e.note}`);
    } else {
      const q = quadroById(e.quadroId).name;
      console.log(`  │   ${e.time}  ${ICON[e.format]} ${e.format.toUpperCase().padEnd(5)} ${q}`);
      console.log(`  │           └ ${e.folderName}`);
    }
  }
  console.log('  └' + '─'.repeat(50));
  console.log('\n  ' + line);
  console.log('  Horários = janelas default (boas práticas BR). Na Fase 3, os');
  console.log('  Insights reais do seu perfil substituem essas janelas.');
  console.log('  ' + line);
}

main();
