// Wrapper de produção da Fase 1 — liga o núcleo ao Google Drive real.
//
// Uso (Node 22 carrega o .env sozinho aqui):
//   node run-ingest.js --check     # só valida credenciais e conta a inbox (seguro)
//   node run-ingest.js --dry-run   # analisa e mostra o plano, SEM tocar nas pastas
//   node run-ingest.js             # cria as pastas, escreve _ideia.md e move os arquivos
//
// Requer o .env preenchido e os pacotes de produção:
//   npm i @anthropic-ai/sdk googleapis openai fluent-ffmpeg
// Logs vão para stderr; o resultado final (JSON) vai para stdout — pronto p/ o n8n.

import { DriveClient } from './src/adapters/drive.js';
import { ingestFromDrive } from './src/pipeline.js';
import { loadConfig } from './src/config.js';
import { Store } from './src/store.js';

// Carrega o .env sem depender de flag (Node >= 20.12). Silencioso se não existir.
try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch {
  /* sem .env — as variáveis podem vir do ambiente (ex.: n8n) */
}

const args = new Set(process.argv.slice(2));
const isCheck = args.has('--check');
const isDryRun = args.has('--dry-run');
const log = (m) => process.stderr.write(m + '\n');

async function main() {
  if (isCheck) return check();

  const cfg = loadConfig(); // valida .env e explica o que falta
  log(`Modo: ${isDryRun ? 'DRY-RUN (não escreve)' : 'LIVE (escreve no Drive)'} · agrupamento: ${cfg.useClaude ? 'Claude' : 'heurística'}`);

  const drive = new DriveClient({
    inboxFolderId: cfg.drive.inboxFolderId,
    rootFolderId: cfg.drive.rootFolderId,
  });

  const result = await ingestFromDrive(drive, {
    agrupadosFolderId: cfg.drive.agrupadosFolderId,
    useClaude: cfg.useClaude,
    dryRun: isDryRun,
    onLog: log,
  });

  // Fecha o loop: registra folderName → quadroId para o relatório (Fase 3).
  if (!isDryRun && process.env.STUDIO_STORE) {
    const store = new Store(process.env.STUDIO_STORE).load();
    for (const g of result.groups) store.recordIngest(g.folderName, g.quadroId);
    store.save();
    log(`Store atualizada: ${result.groups.length} post(s) registrado(s).`);
  }

  // stdout = payload p/ o próximo nó do n8n (só o essencial, sem os briefs longos)
  process.stdout.write(
    JSON.stringify(
      {
        assetCount: result.assetCount,
        dryRun: !!result.dryRun,
        posts: result.groups.map((g) => ({
          folderName: g.folderName,
          quadroId: g.quadroId,
          items: g.assetIds.length,
          score: g.score,
        })),
      },
      null,
      2,
    ) + '\n',
  );
}

// Checagem leve: valida só o acesso ao Drive e conta a inbox. Não precisa de chaves de IA.
async function check() {
  const cfg = loadConfig({ needAnalysisKeys: false });
  const drive = new DriveClient({
    inboxFolderId: cfg.drive.inboxFolderId,
    rootFolderId: cfg.drive.rootFolderId,
  });
  log('Testando acesso ao Drive...');
  const files = await drive.listInbox();
  log(`OK — ${files.length} arquivo(s) de mídia na /00_inbox.`);
  for (const f of files.slice(0, 10)) log(`   • ${f.name} (${f.mimeType})`);
  process.stdout.write(JSON.stringify({ ok: true, inboxCount: files.length }, null, 2) + '\n');
}

main().catch((err) => {
  log('\n✖ ' + (err?.message || err));
  process.exit(1);
});
