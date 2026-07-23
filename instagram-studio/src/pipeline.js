// Orquestrador da Fase 1. Duas entradas:
//
//   planFromAssets(assets, opts)  -> núcleo puro: agrupa + gera briefs (offline)
//   ingestFromDrive(drive, opts)  -> produção: Drive -> análise -> plano -> escreve
//
// O `demo.js` usa planFromAssets contra fixtures. A produção usa ingestFromDrive
// com os adaptadores reais (Drive + transcrição + visão + Claude).

import { groupAssets } from './grouping.js';
import { renderIdeaBrief } from './ideaBrief.js';

/**
 * Núcleo: recebe assets já analisados e devolve o plano de posts + os briefs.
 * @param {import('./types.js').MediaAsset[]} assets
 * @param {{ useClaude?: boolean, claude?: object }} [opts]
 * @returns {Promise<{ groups: import('./types.js').PostGroup[], scored: Map<string, any>, briefs: {folderName:string, ideia:string}[] }>}
 */
export async function planFromAssets(assets, opts = {}) {
  let groups;
  let scored = new Map();

  if (opts.useClaude) {
    const { groupWithClaude } = await import('./adapters/claude.js');
    groups = await groupWithClaude(assets, opts.claude);
  } else {
    const res = groupAssets(assets);
    groups = res.groups;
    scored = res.scored;
  }

  const briefs = groups.map((g) => ({
    folderName: g.folderName,
    ideia: renderIdeaBrief(g, assets, scored),
  }));

  return { groups, scored, briefs };
}

/**
 * Produção: lê a inbox do Drive, analisa cada mídia (voz + visão), planeja e
 * materializa as pastas + _ideia.md, movendo os arquivos para 01_agrupados.
 *
 * @param {import('./adapters/drive.js').DriveClient} drive
 * @param {{
 *   agrupadosFolderId: string,
 *   useClaude?: boolean,
 *   transcribeOpts?: object,
 *   visionOpts?: object,
 *   onLog?: (msg: string) => void,
 * }} opts
 */
export async function ingestFromDrive(drive, opts) {
  const log = opts.onLog || (() => {});
  const { transcribe } = await import('./adapters/transcribe.js');
  const { analyzeVideo, analyzeImage } = await import('./adapters/vision.js');

  log('Lendo /00_inbox...');
  const files = await drive.listInbox();
  log(`${files.length} arquivo(s) na inbox.`);

  /** @type {import('./types.js').MediaAsset[]} */
  const assets = [];
  for (const f of files) {
    const kind = f.mimeType.startsWith('video/') ? 'video' : 'image';
    log(`Analisando ${f.name} (${kind})...`);
    const local = await drive.downloadToTmp(f.id, f.name);

    let transcript = '';
    let vision = { tags: [], summary: '' };
    if (kind === 'video') {
      transcript = await transcribe(local, opts.transcribeOpts).catch(() => '');
      vision = await analyzeVideo(local, opts.visionOpts).catch(() => vision);
    } else {
      vision = await analyzeImage(local, opts.visionOpts).catch(() => vision);
    }

    assets.push({
      id: f.id,
      name: f.name,
      kind,
      createdAt: f.createdTime,
      transcript,
      visualTags: vision.tags,
      visualSummary: vision.summary,
    });
  }

  log('Agrupando...');
  const { groups, briefs, scored } = await planFromAssets(assets, {
    useClaude: opts.useClaude,
  });

  for (const g of groups) {
    log(`Criando pasta ${g.folderName} (${g.assetIds.length} item[s])`);
    const folderId = await drive.ensureFolder(g.folderName, opts.agrupadosFolderId);
    const brief = briefs.find((b) => b.folderName === g.folderName);
    if (brief) await drive.writeTextFile('_ideia.md', brief.ideia, folderId);
    for (const assetId of g.assetIds) await drive.moveFile(assetId, folderId);
  }

  log('Concluído.');
  return { groups, briefs, scored, assetCount: assets.length };
}
