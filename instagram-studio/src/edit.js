// Fase 2 — edição por template.
// Lê os posts em 02_aprovados/, monta o plano de edição de cada um, escreve o
// plano + o render.sh em 03_editados/ e, se houver ffmpeg, renderiza de verdade.

import { readdir, readFile, mkdir, writeFile, stat, chmod } from "node:fs/promises";
import path from "node:path";
import { log } from "./lib/log.js";
import { paths } from "./scaffold.js";
import { templateById } from "./lib/templates.js";
import { buildPlan, renderPlanArtifacts } from "./lib/render.js";
import { hasFfmpeg, run } from "./lib/ffmpeg.js";
import { schedule } from "./lib/schedule.js";

export async function edit(config, opts = {}) {
  const dirs = paths(config);

  log.step("01", "Lendo posts aprovados");
  const posts = await listApprovedPosts(dirs.aprovados);
  if (posts.length === 0) {
    log.warn(
      `Nada em ${path.relative(config._projectDir, dirs.aprovados)}. ` +
        `Aprove um post movendo a pasta de 01_agrupados para 02_aprovados (com legenda.txt).`
    );
    return { edited: [], novos: 0, scheduled: [], count: 0, subject: "", summary: "" };
  }
  log.bot(`${posts.length} post(s) aprovado(s).`);

  const ffmpeg = !opts.dryRun && hasFfmpeg();
  if (ffmpeg) log.bot("ffmpeg presente — vou renderizar de verdade.");
  else log.warn(opts.dryRun ? "Modo dry-run — só o plano." : "Sem ffmpeg — gero o plano e o render.sh (rode num runner com ffmpeg).");

  const edited = [];
  let novos = 0;
  for (const post of posts) {
    const outputDir = path.join(dirs.editados, post.manifest.post);
    post.outputDir = outputDir;

    // Idempotência: pula se o alvo desta rodada já existe (a saída renderizada
    // quando há ffmpeg; o plano quando é só plano). --force refaz.
    const alvo = ffmpeg ? firstOutputName(post) : "plano-de-edicao.md";
    const jaFeito = await exists(path.join(outputDir, alvo));
    if (jaFeito && !opts.force) {
      // Reconstrói o plano (barato, só dados) para manter o cronograma completo,
      // mas não re-roda o ffmpeg.
      const plan = buildPlan(post, config);
      plan.pulado = true;
      edited.push(plan);
      log.info(`  (${post.manifest.post} já editado — pulei; use --force para refazer)`);
      continue;
    }

    log.step("02", `Editando ${post.manifest.post}`);
    await mkdir(path.join(outputDir, "_tmp"), { recursive: true });

    const plan = buildPlan(post, config);
    const { md, sh } = renderPlanArtifacts(plan);
    await writeFile(path.join(outputDir, "plano-de-edicao.md"), md, "utf8");
    const shPath = path.join(outputDir, "render.sh");
    await writeFile(shPath, sh, "utf8");
    await chmod(shPath, 0o755).catch(() => {});
    // Copia a legenda do feed adiante, para a fase de agendamento/postagem.
    if (post.legenda?.presente) {
      await writeFile(path.join(outputDir, "legenda.txt"), post.legenda.texto, "utf8");
    }

    log.bot(`Plano: ${plan.commands.length} passo(s) → ${plan.outputs.join(", ")}`);
    for (const w of plan.warnings) log.warn(w);

    if (ffmpeg) {
      await renderNow(plan, outputDir);
    }

    edited.push(plan);
    novos++;
  }

  log.step("03", "Montando o cronograma");
  const scheduled = schedule(edited, config);
  await writeFile(
    path.join(dirs.editados, "cronograma.json"),
    JSON.stringify(scheduled, null, 2),
    "utf8"
  );
  for (const s of scheduled) log.you(`${s.post} → ${s.quando} (${s.formato})`);

  const result = { edited, novos, scheduled, count: edited.length };
  result.subject = renderEditSubject(result);
  result.summary = renderEditSummary(result);
  return result;
}

// Nome da primeira saída esperada, para o teste de idempotência.
function firstOutputName(post) {
  const saida = post.render?.saida || "reel";
  return saida === "carrossel" ? "slide-00-capa.jpg" : "reel.mp4";
}

// ---- resumo para o n8n / email ----------------------------------------

export function renderEditSubject(result) {
  if (result.count === 0) return "Instagram-Studio — nada para editar";
  return `Instagram-Studio — ${result.count} post(s) editado(s) e agendado(s)` +
    (result.novos === 0 ? " (nada novo)" : "");
}

export function renderEditSummary(result) {
  const when = new Date().toLocaleString("pt-BR");
  const byPost = new Map(result.scheduled.map((s) => [s.post, s]));
  const L = [];
  L.push(`# Posts editados & agendados — ${when}`);
  L.push("");
  L.push(
    `${result.count} post(s) prontos (${result.novos} novo(s) nesta rodada). ` +
      `A edição é por template; a legenda do feed é sua.`
  );
  L.push("");
  for (const plan of result.edited) {
    const s = byPost.get(plan.post);
    L.push(`## ${plan.templateNome} — \`${plan.post}\``);
    L.push(`- **Saída:** ${plan.saida} (${plan.dimensao})`);
    if (s) L.push(`- **Agendado:** ${s.quando}`);
    L.push(`- **Arquivos:** ${plan.outputs.join(", ")}`);
    if (plan.warnings.length) L.push(`- **Pendências:** ${plan.warnings.length} (veja plano-de-edicao.md)`);
    L.push("");
  }
  L.push("## Cronograma");
  for (const s of result.scheduled) L.push(`- ${s.post} → **${s.quando}** (${s.formato})`);
  L.push("");
  L.push("---");
  L.push("_Fase 2 do Automatizador de Instagram. Revise em `03_editados/` e publique (ou deixe a fase de postagem agendar)._");
  return L.join("\n") + "\n";
}

async function renderNow(plan, outputDir) {
  // Antes do concat, escreve a lista com as cenas normalizadas.
  const norm = plan.commands
    .map((c) => c.argv[c.argv.length - 1])
    .filter((p) => /_tmp[\\/]norm-\d+\.mp4$/.test(p));
  if (norm.length) {
    const list = norm.map((p) => `file '${path.basename(p)}'`).join("\n") + "\n";
    await writeFile(path.join(outputDir, "_tmp", "concat.txt"), list, "utf8");
  }
  for (const c of plan.commands) {
    if (c.status !== "ok") continue;
    const res = await run(c.argv);
    if (res.code === 0) log.ok(c.desc);
    else log.err(`${c.desc} (ffmpeg saiu ${res.code}) — veja plano-de-edicao.md`);
  }
}

async function listApprovedPosts(dir) {
  let names = [];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const posts = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const postDir = path.join(dir, name);
    let s;
    try {
      s = await stat(postDir);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;

    const manifest = await readJson(path.join(postDir, "post.json"));
    if (!manifest) continue; // pasta sem manifesto não é um post da Fase 1

    const template = templateById(manifest.templateId);
    const files = (await readdir(postDir)).filter(
      (f) => !f.startsWith(".") && !f.endsWith(".transcricao.txt") && f !== "post.json" && f !== "_ideia.md"
    );

    const legendaTxt = await readText(path.join(postDir, "legenda.txt"));
    const capaTxt = (await readText(path.join(postDir, "capa.txt")))?.trim();

    posts.push({
      dir: postDir,
      manifest,
      render: template?.render || {},
      files: files.filter((f) => f !== "legenda.txt" && f !== "capa.txt" && f !== "plano-de-edicao.md" && f !== "render.sh"),
      legenda: { presente: !!legendaTxt, texto: legendaTxt || "" },
      capaTitulo: capaTxt || null,
    });
  }
  return posts;
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

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
