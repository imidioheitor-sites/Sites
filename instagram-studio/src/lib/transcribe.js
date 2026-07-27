// Transcrição de fala (Whisper). Análise, não geração — 100% dentro da regra.
// Com OPENAI_API_KEY: usa a API de transcrição. Sem chave: gera um placeholder
// para o pipeline continuar (o texto real entra quando você plugar a chave).

import { readFile } from "node:fs/promises";
import path from "node:path";

export async function transcribe(item, config) {
  if (item.kind === "image") return "";

  const keyEnv = config?.transcribe?.apiKeyEnv || "OPENAI_API_KEY";
  const apiKey = process.env[keyEnv];
  if (!apiKey) {
    return placeholder(item);
  }

  try {
    const bytes = await readFile(item.path);
    const form = new FormData();
    form.append("file", new Blob([bytes]), item.name);
    form.append("model", config?.transcribe?.model || "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Whisper HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return (data.text || "").trim();
  } catch (e) {
    return `[transcrição falhou: ${e.message}]`;
  }
}

function placeholder(item) {
  return `[SEM TRANSCRIÇÃO — configure ${
    item.kind === "audio" ? "OPENAI_API_KEY" : "OPENAI_API_KEY"
  } para transcrever "${path.basename(item.name)}"]`;
}
