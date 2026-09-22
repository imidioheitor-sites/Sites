// Adaptador de visão (etapa 02) — "o que está acontecendo na cena".
//
// Vídeo: extrai keyframes com ffmpeg e manda para o Claude Vision descrever.
// Imagem: manda direto. Requer `@anthropic-ai/sdk`, `fluent-ffmpeg` e ffmpeg no PATH.
// Import dinâmico para o demo rodar sem instalar nada.

/**
 * @typedef {Object} VisionResult
 * @property {string[]} tags
 * @property {string}   summary
 */

/**
 * Descreve um vídeo a partir de alguns keyframes.
 * @param {string} filePath
 * @param {{ apiKey?: string, model?: string, frames?: number }} [opts]
 * @returns {Promise<VisionResult>}
 */
export async function analyzeVideo(filePath, opts = {}) {
  const frames = await extractKeyframes(filePath, opts.frames ?? 3);
  return describeImages(frames, opts);
}

/**
 * Descreve uma imagem.
 * @param {string} filePath
 * @param {{ apiKey?: string, model?: string }} [opts]
 * @returns {Promise<VisionResult>}
 */
export async function analyzeImage(filePath, opts = {}) {
  return describeImages([filePath], opts);
}

/** Extrai N keyframes uniformemente distribuídos; retorna caminhos locais. */
async function extractKeyframes(filePath, n) {
  const os = await import('node:os');
  const path = await import('node:path');
  const ffmpeg = await import('fluent-ffmpeg').then((m) => m.default).catch(() => {
    throw new Error('Pacote "fluent-ffmpeg" (e ffmpeg no PATH) necessário para o modo live.');
  });
  const dir = path.join(os.tmpdir(), `igframes_${Date.now()}`);
  const fs = await import('node:fs');
  fs.mkdirSync(dir, { recursive: true });

  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({ count: n, folder: dir, filename: 'frame-%i.jpg' });
  });
  return fs.readdirSync(dir).map((f) => path.join(dir, f));
}

/** Manda 1..N imagens para o Claude Vision e pede tags + resumo (JSON). */
async function describeImages(imagePaths, opts) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  const model = opts.model || process.env.CLAUDE_MODEL || 'claude-sonnet-5';
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada — visão indisponível no modo live.');

  const fs = await import('node:fs');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const imageBlocks = imagePaths.map((p) => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(p).toString('base64') },
  }));

  const resp = await client.messages.create({
    model,
    max_tokens: 400,
    system:
      'Você descreve objetivamente o que aparece em imagens/frames de vídeo. ' +
      'Responda só JSON: {"tags":[...], "summary":"uma frase"}. Não invente contexto.',
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: 'Descreva a cena. Tags curtas (objetos, ambiente, ação) e um resumo de uma frase.' },
        ],
      },
    ],
  });

  const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try {
    const obj = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return { tags: obj.tags ?? [], summary: obj.summary ?? '' };
  } catch {
    return { tags: [], summary: text.trim().slice(0, 140) };
  }
}
