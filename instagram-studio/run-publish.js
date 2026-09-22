// Wrapper de produção da postagem (Fase 2/4) — lê 02_aprovados e publica.
//
//   node run-publish.js --check     # lista o que está aprovado e o que falta
//   node run-publish.js --dry-run   # simula a postagem (não posta de verdade)
//   node run-publish.js             # posta via Metricool os que estão prontos e no prazo
//
// Só publica o que VOCÊ aprovou (pasta em 02_aprovados com legenda.txt e, quando o
// quadro pede, capa). O guarda em src/publish.js barra o resto.

import { DriveClient } from './src/adapters/drive.js';
import { loadConfig } from './src/config.js';
import { buildSchedule } from './src/schedule.js';
import { planPublications, dispatch } from './src/publish.js';
import { DryRunPublisher, MetricoolPublisher } from './src/adapters/publisher.js';
import { DriveMediaHost } from './src/adapters/mediaHost.js';
import { parseFolderName } from './src/quadros.js';
import { Store } from './src/store.js';

try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch {
  /* sem .env */
}

const args = new Set(process.argv.slice(2));
const isCheck = args.has('--check');
const isDryRun = args.has('--dry-run');
const log = (m) => process.stderr.write(m + '\n');
const today = new Date().toISOString().slice(0, 10);

async function main() {
  const cfg = loadConfig({ needAnalysisKeys: false });
  const drive = new DriveClient({ inboxFolderId: cfg.drive.inboxFolderId, rootFolderId: cfg.drive.rootFolderId });

  const approvedFolderId = process.env.DRIVE_APROVADOS_FOLDER_ID;
  if (!approvedFolderId) throw new Error('DRIVE_APROVADOS_FOLDER_ID não configurado no .env.');

  log('Lendo 02_aprovados...');
  const approved = await drive.listApproved(approvedFolderId);
  log(`${approved.length} pasta(s) aprovada(s).`);

  // Candidatos p/ o cronograma + estado de aprovação, derivando o quadro do nome.
  const candidates = approved.map((a) => ({
    quadroId: parseFolderName(a.folderName).quadro.id,
    folderName: a.folderName,
    hasVideo: a.mediaFiles.some((m) => m.mimeType.startsWith('video/')),
    score: 1,
  }));
  const approvals = approved.map((a) => ({
    folderName: a.folderName,
    caption: a.caption,
    hasCover: a.hasCover,
    mediaUrls: [], // produção: URLs das mídias editadas (hospedadas) — ver nota abaixo
  }));

  const schedule = buildSchedule(candidates, { startDate: today, days: 14 });
  const { ready, blocked } = planPublications(schedule, approvals, { until: today });

  if (isCheck) {
    log(`\n✅ prontos e no prazo (${ready.length}):`);
    for (const r of ready) log(`   • ${r.entry.folderName} → ${r.entry.date} ${r.entry.time}`);
    log(`\n⛔ barrados/aguardando (${blocked.length}):`);
    for (const b of blocked) log(`   • ${b.entry.folderName} — ${b.reason}`);
    return { ok: true, ready: ready.length, blocked: blocked.length };
  }

  // Fora do dry-run: hospeda a mídia (link público no Drive) e preenche mediaUrls.
  if (!isDryRun && ready.length) {
    const host = new DriveMediaHost(drive);
    for (const r of ready) {
      const ap = approved.find((a) => a.folderName === r.entry.folderName);
      const urls = [];
      for (const m of ap?.mediaFiles ?? []) urls.push(await host.publicUrl(m.id));
      r.approval.mediaUrls = urls;
      log(`   ${r.entry.folderName}: ${urls.length} mídia(s) hospedada(s).`);
    }
  }

  const publisher = isDryRun ? new DryRunPublisher() : new MetricoolPublisher();
  log(`Publicando (${isDryRun ? 'dry-run' : 'Metricool'})...`);
  const results = await dispatch(ready, publisher);

  // Fecha o loop: registra folderName → mediaId para o relatório (Fase 3).
  if (!isDryRun && process.env.STUDIO_STORE) {
    const store = new Store(process.env.STUDIO_STORE).load();
    for (const r of results) if (r.providerId) store.recordPublish(r.folderName, r.providerId);
    store.save();
  }

  for (const r of results) log(`   • ${r.folderName} → ${r.status} @ ${r.when}`);
  return { posted: results.length, blocked: blocked.length };
}

main()
  .then((r) => process.stdout.write(JSON.stringify(r, null, 2) + '\n'))
  .catch((err) => {
    log('\n✖ ' + (err?.message || err));
    process.exit(1);
  });

// Hospedagem de mídia: no modo live, DriveMediaHost torna cada arquivo acessível
// por link e preenche `mediaUrls` automaticamente (o Metricool/Graph postam a
// partir dessas URLs). Para vídeos grandes, se o link do Drive cair na tela de
// aviso do Google, troque o host por um bucket — o contrato publicUrl() é o mesmo.
