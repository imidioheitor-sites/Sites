// Carrega config.json (se existir), com config.example.json como base,
// e permite override por variáveis de ambiente.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, "..");

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
