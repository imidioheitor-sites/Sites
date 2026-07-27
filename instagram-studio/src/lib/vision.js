// Descrição da cena (o que acontece na imagem/frame). Análise, não geração.
// Usa Claude vision quando há chave; senão devolve uma descrição mínima
// baseada nos metadados do arquivo.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { kindOf } from "./media.js";

const MEDIA_TYPE = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function describe(item, claude, config) {
  if (config?.vision?.enabled === false) return "";
  if (item.kind !== "image") {
    // Vídeo: sem extração de frame nesta fase; a transcrição carrega o contexto.
    return "";
  }

  const ext = path.extname(item.name).toLowerCase();
  const mediaType = MEDIA_TYPE[ext];
  if (!claude || !mediaType) {
    return `[cena não descrita — imagem "${item.name}"]`;
  }

  try {
    const bytes = await readFile(item.path);
    const res = await claude.client.messages.create({
      model: claude.model,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: bytes.toString("base64") },
            },
            {
              type: "text",
              text: "Descreva em 1-2 frases o que aparece nesta cena (objetos, ambiente, ação). Só descrição factual, em português.",
            },
          ],
        },
      ],
    });
    return res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch (e) {
    return `[descrição de cena falhou: ${e.message}]`;
  }
}

export { kindOf };
