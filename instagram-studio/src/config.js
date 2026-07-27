// Carrega config.json (se existir), com config.example.json como base,
// e permite override por variáveis de ambiente. Também lê um .env (um lugar só
// para todos os seus segredos) — sem dependência externa.

import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, "..");

// Carrega .env para process.env (não sobrescreve o que já existe no ambiente).
// É chamado uma vez, na importação, para valer em toda a CLI/serviço.
export function loadEnv(file = path.join(dir, ".env")) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnv();

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export async function loadConfig() {
  const example = (await readJson(path.join(dir, "config.example.json"))) || {};
  const user = (await readJson(path.join(dir, "config.json"))) || {};
  const merged = deepMerge(example, user);

  // Overrides por ambiente
  if (process.env.STUDIO_ROOT) merged.root = process.env.STUDIO_ROOT;

  // Resolve a raiz para caminho absoluto, relativo à pasta do projeto.
  merged.root = path.resolve(dir, merged.root || "./studio-data/Instagram-Studio");
  merged._projectDir = dir;
  return merged;
}

function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object") {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
