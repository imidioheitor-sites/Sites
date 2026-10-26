// Inputs criativos que VOCÊ fornece por post. Ficam em arquivos simples na
// pasta do post, para você preencher sem mexer em código:
//
//   legenda.txt    a legenda do feed (obrigatória p/ publicar) — SUA
//   capa.txt       título do lower-third/capa (opcional)
//   media-url.txt  URL(s) pública(s) da mídia p/ o Metricool (opcional)
//   trilha.mp3     trilha de fundo (opcional)
//   *.srt          legendas com timestamps para queimar (opcional)
//
// Convenção da legenda: linhas começando com "# " (cerquilha + ESPAÇO) são
// comentários de ajuda e são ignoradas. Hashtags de verdade ("#estudos", sem
// espaço) são mantidas normalmente.

import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

export const LEGENDA_TEMPLATE = [
  "# Escreva aqui a legenda do feed (o texto que aparece no post).",
  '# Linhas começando com "# " (cerquilha + espaço) são ignoradas — apague-as.',
  "# Hashtags podem ir em linhas próprias, sem espaço após o #, por exemplo:",
  "# #estudos #empreendedorismo",
  "",
].join("\n");

// Remove linhas de comentário de ajuda e apara.
export function cleanCaption(raw) {
  if (!raw) return "";
  return raw
    .split(/\r?\n/)
    .filter((l) => !/^#\s/.test(l))
    .join("\n")
    .trim();
}

// Lê a legenda de uma pasta de post → { presente, texto }.
export async function readCaption(dir) {
  const texto = cleanCaption(await readText(path.join(dir, "legenda.txt")));
  return { presente: !!texto, texto };
}

// Cria o legenda.txt de rascunho (só se ainda não existir) — o "lugar do input".
export async function ensureLegendaTemplate(dir) {
  const file = path.join(dir, "legenda.txt");
  if (await exists(file)) return false;
  await writeFile(file, LEGENDA_TEMPLATE, "utf8");
  return true;
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
    await access(p);
    return true;
  } catch {
    return false;
  }
}
