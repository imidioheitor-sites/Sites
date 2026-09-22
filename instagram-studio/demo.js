// Demo offline da Fase 1 — zero dependências, zero credenciais.
//
//   node demo.js
//
// Lê fixtures/sample-inbox.json (material bruto já "analisado"), roda o
// agrupamento heurístico, escreve as pastas propostas + _ideia.md em ./out/
// e imprime um resumo. É o que a produção fará no Drive, só que local e sem rede.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planFromAssets } from './src/pipeline.js';
import { quadroById } from './src/quadros.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
const AGRUPADOS = join(OUT, '01_agrupados');

function main() {
  const assets = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-inbox.json'), 'utf8'));

  // Heurístico (offline). Para usar o Claude: planFromAssets(assets, { useClaude: true }).
  return planFromAssets(assets).then(({ groups, briefs }) => {
    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(AGRUPADOS, { recursive: true });

    for (const g of groups) {
      const folder = join(AGRUPADOS, g.folderName);
      mkdirSync(folder, { recursive: true });
      const brief = briefs.find((b) => b.folderName === g.folderName);
      writeFileSync(join(folder, '_ideia.md'), brief.ideia, 'utf8');
      // No Drive, os arquivos de mídia seriam MOVIDOS para cá; local, só registramos.
      writeFileSync(
        join(folder, 'manifest.json'),
        JSON.stringify({ ...g, assets: g.assetIds }, null, 2),
        'utf8',
      );
    }

    printSummary(assets, groups);
  });
}

function printSummary(assets, groups) {
  const line = '─'.repeat(64);
  console.log('\n' + line);
  console.log('  INSTAGRAM STUDIO — Fase 1 (demo offline)');
  console.log(line);
  console.log(`  Inbox: ${assets.length} arquivo(s)  →  ${groups.length} post(s) proposto(s)\n`);

  for (const g of groups) {
    const q = quadroById(g.quadroId);
    const conf = Math.round(g.score * 100);
    const bar = confBar(g.score);
    console.log(`  📁 ${g.folderName}`);
    console.log(`     quadro: ${q.name}`);
    console.log(`     confiança: ${bar} ${conf}%   ·   ${g.assetIds.length} item(s)`);
    console.log(`     ${g.rationale}`);
    console.log('');
  }

  console.log(line);
  console.log(`  Escrito em: ${rel(OUT)}`);
  console.log(`  Abra qualquer _ideia.md para ver o brief (a IA pede a criação, não cria).`);
  console.log(line + '\n');
}

function confBar(score) {
  const n = Math.round(score * 10);
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

function rel(p) {
  return p.replace(process.cwd() + '/', './');
}

main().catch((err) => {
  console.error('Falhou:', err);
  process.exit(1);
});
