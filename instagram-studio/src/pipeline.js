// Orquestra a Fase 1: inbox -> transcrição/visão -> agrupamento -> pastas + ideia.

import { mkdir, writeFile, rename, access } from "node:fs/promises";
import path from "node:path";
import { log } from "./lib/log.js";
import { scanInbox } from "./lib/media.js";
import { getClaude } from "./lib/claude.js";
import { transcribe } from "./lib/transcribe.js";
import { describe } from "./lib/vision.js";
import { groupMedia } from "./lib/group.js";
import { paths } from "./scaffold.js";
import { deliverSuggestions, renderSubject } from "./notify/email.js";

export async function ingest(config, opts = {}) {
  const dirs = paths(config);

  log.step("01", "Lendo a pasta de entrada");
  const items = await scanInbox(dirs.inbox);
  if (items.length === 0) {
    log.warn(`Nada em ${path.relative(config._projectDir, dirs.inbox)}. Jogue mídias lá e rode de novo.`);
    return { mode: "empty", groups: [], count: 0, subject: "", suggestions: "" };
  }
  log.bot(`${items.length} arquivo(s) de mídia encontrado(s).`);

  const claude = await getClaude(config);
  if (claude) log.bot(`Inteligência ligada: ${claude.model}.`);
  else log.warn("Sem ANTHROPIC_API_KEY (ou SDK) — rodando em modo heurístico.");

  log.step("02", "Entendendo: voz + visão");
  const analyzed = [];
  for (const item of items) {
    const transcript = await transcribe(item, config);
    const scene = await describe(item, claude, config);
    analyzed.push({ item, transcript, scene });
    log.bot(`${item.name} — ${summarize(transcript, scene)}`);
  }

  log.step("03", "Agrupando em posts completos");
  const grouped = await groupMedia(analyzed, claude);
  if (grouped.error) log.warn(`IA falhou (${grouped.error}); usei a heurística.`);
  log.bot(`${grouped.groups.length} post(s) montado(s) [modo: ${grouped.mode}].`);

  log.step("04", "Criando pastas e sugestões");
  const analyzedByName = new Map(analyzed.map((a) => [a.item.name, a]));
  const groupsOut = [];
  for (const g of grouped.groups) {
    const folderName = uniqueFolderName(g);
    const dest = path.join(dirs.agrupados, folderName);
    await mkdir(dest, { recursive: true });

    for (const item of g.items) {
      const a = analyzedByName.get(item.name);
      const target = path.join(dest, item.name);
      if (opts.move) {
        await safeRename(item.path, target);
      }
      // Uma transcrição por arquivo, ao lado dele.
      if (a && a.transcript) {
        await writeFile(path.join(dest, item.name + ".transcricao.txt"), a.transcript, "utf8");
      }
    }

    await writeFile(path.join(dest, "_ideia.md"), renderIdea(g), "utf8");
    // Manifesto legível por máquina — a Fase 2 (edição) lê daqui, não do markdown.
    await writeFile(path.join(dest, "post.json"), JSON.stringify(manifest(g, folderName), null, 2), "utf8");
    log.you(`${folderName}/ — ${g.template.nome}. Pede: ${g.pedido || g.template.you}`);
    groupsOut.push({ ...g, folder: folderName });
  }

  const result = { mode: grouped.mode, groups: groupsOut };
  const { markdown } = await deliverSuggestions(config, result);
  result.count = groupsOut.length;
  result.subject = renderSubject(result);
  result.suggestions = markdown;

  if (!opts.move) {
    log.info(
      "\n(As mídias originais ficaram na inbox. Rode com --move para movê-las para as pastas dos posts.)"
    );
  }
  return result;
}

function manifest(g, folderName) {
  return {
    post: folderName,
    templateId: g.template.id,
    templateNome: g.template.nome,
    formato: g.template.formato,
    ideia: g.ideia,
    pedido: g.pedido || g.template.you,
    criadoEm: new Date().toISOString(),
    arquivos: g.items.map((i) => ({ nome: i.name, tipo: i.kind })),
  };
}

function renderIdea(g) {
  return [
    `# ${g.template.nome}`,
    "",
    `**Template:** \`${g.template.id}\` (${g.template.formato})`,
    "",
    `**Ideia do Claude:** ${g.ideia}`,
    "",
    `**O robô vai fazer:** ${g.template.robot}`,
    "",
    `## O que EU preciso entregar`,
    `> ${g.pedido || g.template.you}`,
    "",
    `_A IA nunca escreve a legenda nem a fala. Grave/escreva a parte criativa e mova esta pasta para \`02_aprovados/\`._`,
    "",
    `## Arquivos neste post`,
    ...g.items.map((i) => `- ${i.name} (${i.kind})`),
    "",
  ].join("\n");
}

function summarize(transcript, scene) {
  const t = (transcript || "").replace(/\s+/g, " ").trim();
  if (t && !t.startsWith("[")) return `"${t.slice(0, 60)}${t.length > 60 ? "…" : ""}"`;
  if (scene && !scene.startsWith("[")) return scene.slice(0, 60);
  return "sem fala/descrição (placeholder)";
}

function uniqueFolderName(g) {
  const date = g.items[0]?.capturedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `post_${date}_${g.slug}`;
}

async function safeRename(from, to) {
  if (await exists(to)) return; // não sobrescreve
  try {
    await rename(from, to);
  } catch {
    // rename entre volumes pode falhar; nesta fase apenas ignoramos e deixamos na inbox.
  }
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
