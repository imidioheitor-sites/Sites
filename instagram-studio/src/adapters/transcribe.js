// Adaptador de transcrição de voz (etapa 02).
//
// Provider default: OpenAI Whisper (`openai`). Trocável por qualquer STT —
// o pipeline só depende da função `transcribe(filePath) -> string`.
// Import dinâmico para o demo rodar sem instalar nada.

/**
 * Transcreve a fala de um arquivo de áudio/vídeo.
 * @param {string} filePath  caminho local do arquivo
 * @param {{ apiKey?: string, model?: string, language?: string }} [opts]
 * @returns {Promise<string>}
 */
export async function transcribe(filePath, opts = {}) {
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada — transcrição indisponível no modo live.');

  const fs = await import('node:fs');
  const { default: OpenAI } = await import('openai').catch(() => {
    throw new Error('Pacote "openai" não instalado — rode `npm i openai` para o modo live.');
  });
  const client = new OpenAI({ apiKey });

  const res = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: opts.model || 'whisper-1',
    language: opts.language || 'pt',
  });
  return (res.text || '').trim();
}
