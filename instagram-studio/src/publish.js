// Postagem/agendamento via Metricool.
// Lê o cronograma da Fase 2 (03_editados/cronograma.json) e, para cada post,
// agenda no Metricool com a legenda (sua) + a mídia editada. Sem token, roda em
// dry-run: mostra exatamente o payload que seria enviado.
//
// A mídia precisa de uma URL pública. Resolvida nesta ordem:
//   1) 03_editados/<post>/media-url.txt  (uma URL por linha) — você/n8n fornece
//   2) config.metricool.publicBaseUrl    → <base>/media/<post>/<arquivo>[?token]
// Sem nenhuma das duas, o post é pulado (com token) ou mostrado sem mídia (dry-run).

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "./lib/log.js";
import { paths } from "./scaffold.js";
import { metricoolConfigured, buildSchedulePayload, schedulePost } from "./lib/metricool.js";

export async function publish(config, opts = {}) {
  const dirs = paths(config);
  const live = metricoolConfigured(config) && !opts.dryRun;

  log.step("01", "Lendo o cronograma");
  const cronograma = await readJson(path.join(dirs.editados, "cronograma.json"));
  if (!cronograma || cronograma.length === 0) {
    log.warn("Sem cronograma.json em 03_editados — rode `edit` antes.");
    return { count: 0, agendados: 0, results: [], subject: "", summary: "" };
  }
  log.bot(`${cronograma.length} post(s) no cronograma.`);
  if (live) log.bot("Metricool configurado — vou agendar de verdade.");
  else log.warn(opts.dryRun ? "Modo dry-run — só mostro o payload." : "Sem METRICOOL_USER_TOKEN — dry-run (payload apenas).");

  const results = [];
  let agendados = 0;

  for (const item of cronograma) {
    const postDir = path.join(dirs.editados, item.post);
    const outputs = await mediaOutputs(postDir);
    const mediaUrls = await resolveMediaUrls(config, item.post, outputs);
    const caption = (await readText(path.join(postDir, "legenda.txt")))?.trim() || "";
    const igType = item.formato === "carrossel" ? "POST" : "REEL";

    const payload = buildSchedulePayload({
      text: caption,
      mediaUrls,
      dateTimeLocal: item.dateTimeLocal,
      timezone: item.timezone,
      network: "instagram",
      igType,
      autoPublish: config?.metricool?.autoPublish !== false,
      draft: !!config?.metricool?.draft,
    });

    // Guardas antes de mandar de verdade.
    const problemas = [];
    if (mediaUrls.length === 0) problemas.push("sem URL de mídia pública");
    if (!caption) problemas.push("sem legenda.txt");

    if (live && problemas.length) {
      log.warn(`${item.post}: pulado (${problemas.join("; ")}).`);
      results.push({ post: item.post, status: "pulado", problemas, payload });
      continue;
    }

    const res = await schedulePost(config, payload);
    const ok = res.dryRun ? true : res.ok;
    if (res.dryRun) {
      log.you(`${item.post} → ${item.quando} [dry-run] mídia: ${mediaUrls[0] || "(nenhuma)"}`);
    } else if (ok) {
      agendados++;
      log.ok(`${item.post} agendado para ${item.quando}.`);
    } else {
      log.err(`${item.post}: Metricool respondeu ${res.status}. Veja agendamentos.json.`);
    }
    results.push({
      post: item.post,
      quando: item.quando,
      dateTimeLocal: item.dateTimeLocal,
      igType,
      mediaUrls,
      status: res.dryRun ? "dry-run" : ok ? "agendado" : "erro",
      httpStatus: res.status || null,
      resposta: res.data ?? null,
      payload,
    });
  }

  await writeFile(path.join(dirs.editados, "agendamentos.json"), JSON.stringify(results, null, 2), "utf8");

  const result = {
    count: cronograma.length,
    agendados,
    dryRun: !live,
    results,
  };
  result.subject = renderPublishSubject(result);
  result.summary = renderPublishSummary(result);
  return result;
}

// ---- resolução de mídia ------------------------------------------------

async function mediaOutputs(postDir) {
  let files = [];
  try {
    files = await readdir(postDir);
  } catch {
    return [];
  }
  const reels = files.filter((f) => f === "reel.mp4");
  const slides = files.filter((f) => /^slide-.*\.(jpg|jpeg|png)$/i.test(f)).sort();
  return reels.length ? reels : slides;
}

async function resolveMediaUrls(config, post, outputs) {
  const dirs = paths(config);
  // 1) media-url.txt explícito
  const explicit = await readText(path.join(dirs.editados, post, "media-url.txt"));
  if (explicit) {
    return explicit
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // 2) publicBaseUrl + rota /media
  const base = config?.metricool?.publicBaseUrl;
  if (base && outputs.length) {
    const token = process.env.STUDIO_MEDIA_TOKEN || process.env.STUDIO_TOKEN || "";
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    return outputs.map((f) => `${base.replace(/\/$/, "")}/media/${encodeURIComponent(post)}/${encodeURIComponent(f)}${q}`);
  }
  return [];
}

// ---- resumo para o n8n / email ----------------------------------------

export function renderPublishSubject(result) {
  if (result.dryRun) return `Instagram-Studio — cronograma pronto (dry-run, ${result.count} post(s))`;
  return `Instagram-Studio — ${result.agendados}/${result.count} post(s) agendados no Metricool`;
}

export function renderPublishSummary(result) {
  const when = new Date().toLocaleString("pt-BR");
  const L = [];
  L.push(`# Agendamento no Metricool — ${when}`);
  L.push("");
  L.push(
    result.dryRun
      ? `Dry-run: ${result.count} post(s) prontos para agendar (nada foi enviado).`
      : `${result.agendados} de ${result.count} post(s) agendados no Metricool.`
  );
  L.push("");
  for (const r of result.results) {
    L.push(`## \`${r.post}\` — ${statusLabel(r.status)}`);
    if (r.quando) L.push(`- **Quando:** ${r.quando}`);
    L.push(`- **Tipo:** ${r.igType || "-"}`);
    L.push(`- **Mídia:** ${r.mediaUrls?.[0] || "(sem URL pública)"}`);
    if (r.problemas?.length) L.push(`- **Pendências:** ${r.problemas.join("; ")}`);
    if (r.httpStatus) L.push(`- **HTTP:** ${r.httpStatus}`);
    L.push("");
  }
  L.push("---");
  L.push("_A legenda e a mídia são suas; o robô só agenda. Confira no calendário do Metricool antes da publicação._");
  return L.join("\n") + "\n";
}

function statusLabel(s) {
  return { "dry-run": "dry-run", agendado: "agendado ✓", erro: "erro ✗", pulado: "pulado" }[s] || s;
}

async function readJson(file) {
  const t = await readText(file);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

async function readText(file) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}
