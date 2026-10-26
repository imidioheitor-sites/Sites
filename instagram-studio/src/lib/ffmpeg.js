// Adapter de ffmpeg. Constrói comandos (para o plano de edição e o render.sh)
// e executa quando o ffmpeg está presente. Sem ffmpeg, o pipeline roda em
// dry-run: escreve o plano e o script, sem processar mídia.

import { spawn, spawnSync } from "node:child_process";

let _has;

export function hasFfmpeg() {
  if (_has !== undefined) return _has;
  const ff = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  const fp = spawnSync("ffprobe", ["-version"], { stdio: "ignore" });
  _has = ff.status === 0 && fp.status === 0;
  return _has;
}

// Duração/dimensões de um arquivo, via ffprobe. null se não der.
export function probe(file) {
  if (!hasFfmpeg()) return null;
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries",
     "format=duration:stream=width,height", "-of", "json", file],
    { encoding: "utf8" }
  );
  if (r.status !== 0) return null;
  try {
    const j = JSON.parse(r.stdout);
    const s = (j.streams && j.streams[0]) || {};
    return {
      width: s.width || null,
      height: s.height || null,
      duration: j.format && j.format.duration ? Number(j.format.duration) : null,
    };
  } catch {
    return null;
  }
}

// Executa um argv de ffmpeg. Resolve {code}. Não rejeita em código != 0.
export function run(argv) {
  return new Promise((resolve) => {
    const p = spawn("ffmpeg", argv, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => resolve({ code, stderr: err }));
    p.on("error", (e) => resolve({ code: -1, stderr: e.message }));
  });
}

// ---- helpers de filtro -------------------------------------------------

// Preenche o quadro no formato alvo cortando o excesso (fill-crop).
export function fillCrop(w, h) {
  return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
}

// Texto (lower-third / título) via drawtext. Escapa o que o ffmpeg exige.
export function drawtext(text, { y = "h-260", size = 54, box = true } = {}) {
  const t = escapeDrawtext(text);
  const boxPart = box ? ":box=1:boxcolor=black@0.55:boxborderw=24" : "";
  return `drawtext=text='${t}':fontcolor=white:fontsize=${size}:x=(w-text_w)/2:y=${y}${boxPart}`;
}

function escapeDrawtext(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’") // aspa simples -> tipográfica (evita quebrar o filtro)
    .replace(/%/g, "\\%");
}

// Serializa um argv de ffmpeg em uma linha de shell segura (para o render.sh).
export function toShell(argv) {
  return "ffmpeg " + argv.map(shellQuote).join(" ");
}

function shellQuote(a) {
  if (/^[A-Za-z0-9_./:=,-]+$/.test(a)) return a;
  return "'" + String(a).replace(/'/g, "'\\''") + "'";
}
