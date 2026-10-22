// Demo da camada de postagem (Fase 2/4) — offline, zero dependências.
//
//   node publish-demo.js
//
// Monta o cronograma (Fase 1+2), simula quais posts VOCÊ já aprovou e roda o
// publisher em dry-run. Mostra o que iria ao ar e o que fica BARRADO esperando
// a sua criação (legenda/capa).

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupAssets } from './src/grouping.js';
import { buildSchedule } from './src/schedule.js';
import { planPublications, dispatch } from './src/publish.js';
import { DryRunPublisher } from './src/adapters/publisher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const START = '2026-07-28';

const assets = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-inbox.json'), 'utf8'));
const { groups } = groupAssets(assets);
const candidates = groups.map((g) => ({
  quadroId: g.quadroId,
  folderName: g.folderName,
  hasVideo: g.assetIds.some((id) => assets.find((a) => a.id === id)?.kind === 'video'),
  score: g.score,
}));
const schedule = buildSchedule(candidates, { startDate: START, days: 14 });

// Estado de aprovação simulado (na produção vem do Drive: 02_aprovados/*).
const approvals = [
  { folderName: 'post_2026-07-24_rotina-dia', caption: 'Minha rotina de hoje 👇 (legenda escrita por mim)', hasCover: false },
  { folderName: 'post_2026-07-24_review-livro', caption: 'Resenha do livro que terminei', hasCover: true },
  { folderName: 'post_2026-07-25_quickstart-materia', caption: 'Derivada em 60s, do zero', hasCover: false },
  // dicas-estudo: aprovado, mas SEM legenda -> deve ser barrado
  { folderName: 'post_2026-07-24_dicas-estudo', caption: '', hasCover: false },
  // review sem capa seria barrado; comentario-noticia e geral: nem aprovados
];

const { ready, blocked } = planPublications(schedule, approvals);
const publisher = new DryRunPublisher();
const posted = await dispatch(ready, publisher);

const line = '═'.repeat(64);
console.log('\n' + line);
console.log('  INSTAGRAM STUDIO — Postagem (dry-run, demo offline)');
console.log(line);

console.log(`\n  ✅ PRONTOS PARA POSTAR (${posted.length})`);
for (const p of posted) console.log(`     • ${p.folderName}  →  ${p.when}  [${p.status}]`);

console.log(`\n  ⛔ BARRADOS — esperando você (${blocked.length})`);
for (const b of blocked) console.log(`     • ${b.entry.folderName}\n         ${b.reason}`);

console.log('\n' + line);
console.log('  O publisher NUNCA posta sem a sua legenda (e capa, quando o quadro pede).');
console.log('  Troque DryRunPublisher por MetricoolPublisher para postar de verdade.');
console.log(line + '\n');
