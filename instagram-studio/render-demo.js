// Demo do renderizador (Fase 2) — offline, zero dependências, sem ffmpeg.
//
//   node render-demo.js
//
// Pega o primeiro Reel da Fase 1, gera as legendas dinâmicas (.ass) a partir da
// SUA fala transcrita e escreve o comando ffmpeg que produziria o vídeo 9:16.
// Não executa o ffmpeg — só mostra o que seria feito.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupAssets } from './src/grouping.js';
import { buildRecipe } from './src/renderRecipe.js';
import { wordsToAss } from './src/render/captions.js';
import { buildFfmpegArgs } from './src/adapters/render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'render');

const assets = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-inbox.json'), 'utf8'));
const { groups } = groupAssets(assets);

const reel = groups.find((g) => g.assetIds.some((id) => assets.find((a) => a.id === id)?.kind === 'video'));
const recipe = buildRecipe(reel, assets);
const videos = recipe.segments.map((s) => s.asset).filter((n) => /\.(mov|mp4|m4v)$/i.test(n));

// Legendas: em produção vêm do Whisper com timing por palavra. Aqui, distribuímos
// as palavras da SUA fala uniformemente na duração (só para demonstrar o formato).
const firstVideo = reel.assetIds.map((id) => assets.find((a) => a.id === id)).find((a) => a?.kind === 'video');
const words = fakeWordTimings(firstVideo.transcript, firstVideo.durationSec || 30);
const ass = wordsToAss(words);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'legendas.ass'), ass, 'utf8');

const args = buildFfmpegArgs({
  videos,
  musicPath: 'musica.mp3',
  subtitlePath: join(OUT, 'legendas.ass'),
  out: join(OUT, 'saida_9x16.mp4'),
});
const cmd = 'ffmpeg ' + args.map((a) => (/[ ;'\\]/.test(a) ? `"${a}"` : a)).join(' ');
writeFileSync(join(OUT, 'command.txt'), cmd + '\n', 'utf8');

const line = '═'.repeat(64);
console.log('\n' + line);
console.log('  INSTAGRAM STUDIO — Renderizador (demo offline, sem ffmpeg)');
console.log(line);
console.log(`  Post: ${reel.folderName}`);
console.log(`  Clipes (na ordem da receita): ${videos.join(', ')}`);
console.log(`  Legendas dinâmicas: ${words.length} palavras → out/render/legendas.ass`);
console.log(`  Comando ffmpeg → out/render/command.txt\n`);
console.log('  Prévia do comando:\n');
console.log('  ' + cmd.replace(/ -/g, '\n    -'));
console.log('\n' + line);
console.log('  Em produção: renderPost(spec) executa isto e gera o .mp4 real.');
console.log(line + '\n');

function fakeWordTimings(transcript, durationSec) {
  const tokens = transcript.split(/\s+/).filter(Boolean);
  const per = durationSec / Math.max(tokens.length, 1);
  return tokens.map((word, i) => ({ word, start: i * per, end: (i + 1) * per }));
}
