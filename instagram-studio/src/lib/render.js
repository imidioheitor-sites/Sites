// Motor de edição por template. Constrói um PLANO (dados) com a sequência de
// comandos ffmpeg para montar o post no formato certo. O plano é testável sem
// ffmpeg; a execução real roda os comandos quando o ffmpeg está presente.
//
// A regra de ouro continua: a máquina só EDITA por template. A legenda e a fala
// são suas — o motor nunca as escreve, só as posiciona (lower-third/caption).

import path from "node:path";
import { fillCrop, drawtext, toShell } from "./ffmpeg.js";

const [W_REEL, H_REEL] = [1080, 1920]; // 9:16
const [W_CARD, H_CARD] = [1080, 1350]; // 4:5 (feed/carrossel)

// Constrói o plano de edição de um post aprovado.
//   post: { dir, manifest, files, legenda, capaTitulo }
export function buildPlan(post, config) {
  const render = post.render || {};
  const saida = render.saida || "reel";
  const outputDir = post.outputDir;
  const tmp = path.join(outputDir, "_tmp");

  const cls = classify(post.files);
  const warnings = [];
  const commands = [];
  const outputs = [];

  const lowerThird = post.capaTitulo || post.manifest.templateNome;

  if (saida === "carrossel") {
    buildCarrossel({ post, cls, outputDir, lowerThird, commands, outputs, warnings });
  } else {
    buildReel({ post, cls, outputDir, tmp, render, lowerThird, commands, outputs, warnings });
  }

  // Legenda dinâmica (caption palavra a palavra) precisa de transcrição com
  // timestamps (Whisper verbose_json). Se houver .srt no post, dá para queimar.
  if (render.legenda === "dinamica") {
    const srt = post.files.find((f) => f.toLowerCase().endsWith(".srt"));
    if (srt) {
      warnings.push(`Legendas de ${srt} podem ser queimadas com o filtro subtitles (adicione no passo final).`);
    } else {
      warnings.push(
        "Legenda dinâmica (palavra a palavra) fica pendente: requer transcrição com timestamps (Whisper verbose_json → .srt). O lower-third já entra."
      );
    }
  }

  if (!post.legenda?.presente) {
    warnings.push("Sem legenda.txt na pasta — o robô edita mesmo assim, mas a legenda do post (texto do feed) é sua e precisa entrar antes de publicar.");
  }

  return {
    post: post.manifest.post,
    templateId: post.manifest.templateId,
    templateNome: post.manifest.templateNome,
    saida,
    dimensao: saida === "carrossel" ? `${W_CARD}x${H_CARD}` : `${W_REEL}x${H_REEL}`,
    outputDir,
    legenda: post.legenda || { presente: false, texto: "" },
    lowerThird,
    warnings,
    commands,
    outputs,
  };
}

// ---- reel (vídeo vertical) --------------------------------------------

function buildReel({ post, cls, outputDir, tmp, render, lowerThird, commands, outputs, warnings }) {
  const inDir = post.dir;
  const norm = [];
  let i = 0;

  const hasVideo = cls.videos.length > 0;
  const stillNarration = !hasVideo && cls.images.length && cls.audios.length;

  if (stillNarration) {
    // Caso clássico (ex.: review de livro): foto de fundo + resenha falada.
    const img = path.join(inDir, cls.images[0]);
    const aud = path.join(inDir, cls.audios[0]);
    const out = path.join(tmp, `norm-${pad(i++)}.mp4`);
    commands.push(cmd(
      `Compõe foto "${cls.images[0]}" + narração "${cls.audios[0]}" (duração da fala)`,
      ["-y", "-loop", "1", "-i", img, "-i", aud, "-vf", `${fillCrop(W_REEL, H_REEL)},fps=30`,
       "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", out]
    ));
    norm.push(out);
    // imagens extras viram cenas de 3s
    for (const extra of cls.images.slice(1)) norm.push(pushImageClip(inDir, extra, tmp, i++, commands));
  } else {
    for (const v of cls.videos) {
      const out = path.join(tmp, `norm-${pad(i++)}.mp4`);
      commands.push(cmd(
        `Normaliza clipe "${v}" para 9:16 30fps`,
        ["-y", "-i", path.join(inDir, v), "-vf", `${fillCrop(W_REEL, H_REEL)},fps=30`,
         "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", out]
      ));
      norm.push(out);
    }
    for (const img of cls.images) norm.push(pushImageClip(inDir, img, tmp, i++, commands));
    if (cls.audios.length && hasVideo) {
      warnings.push(`Áudios soltos (${cls.audios.join(", ")}) ignorados: o som provavelmente já está nos vídeos.`);
    }
  }

  if (norm.length === 0) {
    warnings.push("Nenhum vídeo ou imagem utilizável neste post — nada para renderizar.");
    return;
  }

  // Concat via demuxer (todos normalizados com os mesmos parâmetros).
  const listFile = path.join(tmp, "concat.txt");
  const concatOut = path.join(tmp, "concat.mp4");
  commands.push(cmd(
    "Junta as cenas em sequência (concat)",
    ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", concatOut],
    "ok",
    `Antes deste passo, escreva ${rel(outputDir, listFile)} com uma linha "file '<arquivo>'" por cena.`
  ));

  // Passo final: capa/lower-third queimado. (Trilha: passo planejado abaixo.)
  const finalOut = path.join(outputDir, "reel.mp4");
  commands.push(cmd(
    `Queima o lower-third "${lowerThird}" e finaliza`,
    ["-y", "-i", concatOut, "-vf", drawtext(lowerThird, { y: "h-260", size: 54 }),
     "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "copy", finalOut]
  ));
  outputs.push("reel.mp4");

  // Capa (thumbnail) do primeiro segundo.
  const capaOut = path.join(outputDir, "capa.jpg");
  commands.push(cmd(
    "Extrai a capa (primeiro frame com o título)",
    ["-y", "-i", finalOut, "-vf", `select=eq(n\\,15),${drawtext(coverTitle(render, lowerThird), { y: "h/2", size: 72 })}`,
     "-frames:v", "1", capaOut]
  ));
  outputs.push("capa.jpg");

  if (render.trilha && render.trilha !== "nenhuma") {
    warnings.push(
      `Trilha "${render.trilha}" fica planejada: coloque um arquivo trilha.mp3 na pasta do post e o passo final mistura com "-i trilha.mp3 -filter_complex amix" em volume baixo.`
    );
  }
}

function pushImageClip(inDir, img, tmp, i, commands) {
  const out = path.join(tmp, `norm-${pad(i)}.mp4`);
  commands.push(cmd(
    `Imagem "${img}" vira cena de 3s`,
    ["-y", "-loop", "1", "-t", "3", "-i", path.join(inDir, img),
     "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
     "-vf", `${fillCrop(W_REEL, H_REEL)},fps=30`, "-c:v", "libx264", "-preset", "veryfast",
     "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", out]
  ));
  return out;
}

// ---- carrossel (slides verticais) -------------------------------------

function buildCarrossel({ post, cls, outputDir, lowerThird, commands, outputs, warnings }) {
  const imgs = cls.images;
  if (imgs.length === 0) {
    warnings.push("Carrossel sem imagens — grave/exporte os slides como imagens e coloque na pasta.");
  }
  // Capa da série.
  const capa = path.join(outputDir, "slide-00-capa.jpg");
  commands.push(cmd(
    `Capa da série "${lowerThird}"`,
    ["-y", "-f", "lavfi", "-i", `color=c=0x141413:s=${W_CARD}x${H_CARD}`,
     "-vf", drawtext(lowerThird, { y: "h/2-60", size: 84 }), "-frames:v", "1", capa]
  ));
  outputs.push("slide-00-capa.jpg");

  imgs.forEach((img, n) => {
    const out = path.join(outputDir, `slide-${pad(n + 1)}.jpg`);
    commands.push(cmd(
      `Slide ${n + 1} de "${img}" em 4:5`,
      ["-y", "-i", path.join(post.dir, img), "-vf", fillCrop(W_CARD, H_CARD), "-frames:v", "1", out]
    ));
    outputs.push(path.basename(out));
  });

  warnings.push("Bullets animados do carrossel ficam planejados: os slides base saem prontos; a animação de bullets exige um passo de composição (ex.: overlay de texto por slide).");
}

// ---- artefatos: plano + script ----------------------------------------

export function renderPlanArtifacts(plan) {
  const md = renderPlanMarkdown(plan);
  const sh = renderShellScript(plan);
  return { md, sh };
}

function renderPlanMarkdown(plan) {
  const L = [];
  L.push(`# Plano de edição — ${plan.templateNome}`);
  L.push("");
  L.push(`- **Post:** \`${plan.post}\``);
  L.push(`- **Template:** \`${plan.templateId}\` · **Saída:** ${plan.saida} (${plan.dimensao})`);
  L.push(`- **Lower-third:** ${plan.lowerThird}`);
  L.push(`- **Legenda do feed:** ${plan.legenda.presente ? "fornecida (sua)" : "faltando"}`);
  L.push("");
  L.push("## Passos");
  plan.commands.forEach((c, i) => {
    L.push(`${i + 1}. ${c.desc}${c.status === "planejado" ? " _(planejado)_" : ""}`);
    if (c.note) L.push(`   - ${c.note}`);
    L.push("");
    L.push("   ```sh");
    L.push("   " + c.shell);
    L.push("   ```");
  });
  if (plan.warnings.length) {
    L.push("## Observações");
    for (const w of plan.warnings) L.push(`- ${w}`);
    L.push("");
  }
  L.push("## Saídas");
  for (const o of plan.outputs) L.push(`- \`${o}\``);
  L.push("");
  L.push("_A IA editou por template. A legenda do feed e a fala são suas._");
  return L.join("\n") + "\n";
}

function renderShellScript(plan) {
  const L = [];
  L.push("#!/usr/bin/env bash");
  L.push("# Gerado pela Fase 2 do Automatizador de Instagram.");
  L.push("# Rode num ambiente com ffmpeg instalado, de dentro da pasta do post.");
  L.push("set -euo pipefail");
  L.push('cd "$(dirname "$0")"');
  L.push("mkdir -p _tmp");
  L.push("");
  for (const c of plan.commands) {
    L.push(`# ${c.desc}`);
    L.push(c.shell);
    L.push("");
  }
  return L.join("\n") + "\n";
}

// ---- utilidades --------------------------------------------------------

function classify(files) {
  const V = /\.(mp4|mov|m4v|webm|avi|mkv)$/i;
  const I = /\.(jpg|jpeg|png|heic|webp|gif)$/i;
  const A = /\.(m4a|mp3|wav|aac|ogg)$/i;
  const videos = [], images = [], audios = [];
  for (const f of files) {
    if (V.test(f)) videos.push(f);
    else if (I.test(f)) images.push(f);
    else if (A.test(f)) audios.push(f);
  }
  return { videos, images, audios };
}

function cmd(desc, argv, status = "ok", note = "") {
  return { desc, argv, shell: toShell(argv), status, note };
}

function coverTitle(render, fallback) {
  const map = {
    AGENDA: "AGENDA",
    "titulo-nota": fallback,
    numerada: fallback,
    serie: fallback,
    "lower-third": fallback,
  };
  return map[render.capa] || fallback;
}

function pad(n) {
  return String(n).padStart(3, "0");
}

function rel(from, to) {
  return path.relative(from, to) || to;
}
