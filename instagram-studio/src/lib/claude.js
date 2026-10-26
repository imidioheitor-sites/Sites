// Wrapper fino sobre o SDK oficial da Anthropic.
// Carregado sob demanda: se o pacote ou a chave não existirem, retorna null
// e o pipeline cai no modo heurístico (dry-run) sem quebrar.

let cached;

export async function getClaude(config) {
  if (cached !== undefined) return cached;

  const keyEnv = config?.ai?.apiKeyEnv || "ANTHROPIC_API_KEY";
  const apiKey = process.env[keyEnv];
  if (!apiKey) {
    cached = null;
    return null;
  }

  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    // Pacote não instalado — segue em modo heurístico.
    cached = null;
    return null;
  }

  const client = new Anthropic({ apiKey });
  const model = config?.ai?.model || "claude-opus-4-8";

  cached = {
    model,
    // Pede JSON e devolve já parseado. Adaptive thinking ligado.
    async json(system, userText, maxTokens = 4096) {
      const res = await client.messages.create({
        model,
        max_tokens: maxTokens,
        thinking: { type: "adaptive" },
        system,
        messages: [{ role: "user", content: userText }],
      });
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      return parseJson(text);
    },
    client,
  };
  return cached;
}

// Extrai o primeiro objeto/array JSON de um texto (tolera cercas de código).
function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error("Resposta da IA sem JSON: " + text.slice(0, 200));
  const slice = raw.slice(start);
  return JSON.parse(slice);
}
