// Cria (e mantém) o esquema de pastas que o robô usa.
//
// 📁 Instagram-Studio/
// ├─ 00_inbox/          você joga tudo aqui, sem pensar
// ├─ 01_agrupados/      criado automaticamente
// ├─ 02_aprovados/      você move quando OK + capa/legenda
// ├─ 03_editados/       saída do editor por template
// └─ 04_publicados/     arquivo do que já foi ao ar

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { log } from "./lib/log.js";

export const FOLDERS = {
  inbox: "00_inbox",
  agrupados: "01_agrupados",
  aprovados: "02_aprovados",
  editados: "03_editados",
  publicados: "04_publicados",
};

const INBOX_README = `# 00_inbox — joga tudo aqui

Despeje fotos, vídeos e áudios soltos nesta pasta, sem organizar.

Depois rode:

    npm run ingest        (ou: node src/cli.js ingest)

O sistema vai:
  1. detectar os arquivos novos
  2. transcrever a fala (Whisper) e descrever a cena (visão)
  3. agrupar em "posts completos" dentro de ../01_agrupados/
  4. deixar um _ideia.md em cada post com a sugestão de template

A IA nunca escreve sua legenda nem cria conteúdo — ela só organiza e sugere.
`;

export async function scaffold(config) {
  const root = config.root;
  await mkdir(root, { recursive: true });

  for (const name of Object.values(FOLDERS)) {
    const dir = path.join(root, name);
    await mkdir(dir, { recursive: true });
    log.ok(path.relative(config._projectDir, dir) + "/");
  }

  const inboxReadme = path.join(root, FOLDERS.inbox, "LEIA-ME.md");
  if (!(await exists(inboxReadme))) {
    await writeFile(inboxReadme, INBOX_README, "utf8");
  }

  return root;
}

export function paths(config) {
  const p = {};
  for (const [key, name] of Object.entries(FOLDERS)) {
    p[key] = path.join(config.root, name);
  }
  return p;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
