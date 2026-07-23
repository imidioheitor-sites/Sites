// Detecção e leitura básica de mídia na pasta de entrada.

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const VIDEO = new Set([".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"]);
const IMAGE = new Set([".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"]);
const AUDIO = new Set([".m4a", ".mp3", ".wav", ".aac", ".ogg"]);

export function kindOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (VIDEO.has(ext)) return "video";
  if (IMAGE.has(ext)) return "image";
  if (AUDIO.has(ext)) return "audio";
  return null;
}

// Lista arquivos de mídia da inbox, com metadados úteis para o agrupamento.
export async function scanInbox(inboxDir) {
  let names = [];
  try {
    names = await readdir(inboxDir);
  } catch {
    return [];
  }

  const items = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const kind = kindOf(name);
    if (!kind) continue;
    const full = path.join(inboxDir, name);
    let s;
    try {
      s = await stat(full);
    } catch {
      continue;
    }
    if (!s.isFile()) continue;
    items.push({
      name,
      path: full,
      kind,
      sizeBytes: s.size,
      // mtime aproxima "quando foi gravado" — usado para agrupar por sessão de gravação.
      capturedAt: s.mtime.toISOString(),
    });
  }
  // Ordena por tempo para o agrupamento por proximidade fazer sentido.
  items.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  return items;
}
