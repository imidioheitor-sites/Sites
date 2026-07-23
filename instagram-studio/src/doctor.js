// `doctor` — diz o que está configurado, o que falta e ONDE colocar cada input.
// É o mapa dos seus inputs: rode isto sempre que estiver na dúvida.

import { log } from "./lib/log.js";
import { hasFfmpeg } from "./lib/ffmpeg.js";
import { metricoolConfigured, creds } from "./lib/metricool.js";

export async function doctor(config) {
  const rows = [];
  const env = (k) => (process.env[k] ? "ok" : "");

  rows.push(check("Inteligência (Fase 1/3)", env("ANTHROPIC_API_KEY"),
    "agrupamento por IA + análise de relatório", "ANTHROPIC_API_KEY no .env"));
  rows.push(check("Transcrição (Fase 1)", env("OPENAI_API_KEY"),
    "Whisper transcreve a fala de verdade", "OPENAI_API_KEY no .env"));
  rows.push(check("Renderização (Fase 2)", hasFfmpeg() ? "ok" : "",
    "ffmpeg edita o vídeo; sem ele, só o plano", "instale ffmpeg no servidor"));
  rows.push(check("Serviço/n8n", env("STUDIO_TOKEN"),
    "protege os endpoints HTTP", "STUDIO_TOKEN no .env"));

  const c = creds(config);
  const metOk = metricoolConfigured(config) && c.userId && c.blogId;
  rows.push(check("Postagem (Metricool)", metOk ? "ok" : "",
    "agenda de verdade; sem isso, /publish é dry-run",
    "METRICOOL_USER_TOKEN + METRICOOL_USER_ID + METRICOOL_BLOG_ID no .env"));

  const mediaOk = !!(config?.metricool?.publicBaseUrl);
  rows.push(check("URL de mídia (Metricool)", mediaOk ? "ok" : "",
    "o Metricool baixa a mídia por URL pública",
    "metricool.publicBaseUrl no config.json (ou media-url.txt por post)"));

  log.title("Diagnóstico — seus inputs");
  for (const r of rows) {
    if (r.ok) log.ok(`${r.nome.padEnd(26)} ${r.desc}`);
    else log.warn(`${r.nome.padEnd(26)} FALTA → ${r.onde}`);
  }

  const faltando = rows.filter((r) => !r.ok).length;
  log.info(
    "\n" +
      (faltando === 0
        ? "Tudo configurado. 🎉"
        : `${faltando} item(ns) faltando. O bot roda mesmo assim (dry-run/heurístico) — preencha o .env para ligar cada parte.`)
  );
  return rows;
}

function check(nome, okFlag, desc, onde) {
  return { nome, ok: okFlag === "ok", desc, onde };
}
