// Renderizador de vídeo (Fase 2) — monta o Reel 9:16 a partir do SEU material.
//
// buildFfmpegArgs é uma função PURA (testável) que constrói o filtergraph:
//   - escala + corta cada clipe para 1080x1920 (9:16), 30fps
//   - concatena os clipes NA ORDEM da receita, preservando a SUA voz
//   - queima as legendas (.ass) geradas a partir da sua fala
//   - mixa a trilha por baixo, em volume baixo
//
// renderPost executa o ffmpeg (binário no PATH) — não precisa de pacote npm.
// O renderizador só EDITA o que você gravou; nada de conteúdo gerado.

import { spawn } from 'node:child_process';

/**
 * @param {{
 *   videos: string[],        // caminhos dos clipes, na ordem da receita
 *   out: string,             // caminho de saída .mp4
 *   musicPath?: string,      // trilha (opcional)
 *   subtitlePath?: string,   // .ass das legendas dinâmicas (opcional)
 *   musicVolume?: number,    // 0..1 (padrão 0.25)
 * }} spec
 * @returns {string[]} argumentos do ffmpeg
 */
export function buildFfmpegArgs(spec) {
  const { videos, out } = spec;
  if (!videos?.length) throw new Error('buildFfmpegArgs: nenhum clipe de vídeo informado.');
  const musicVolume = spec.musicVolume ?? 0.25;

  const args = [];
  for (const v of videos) args.push('-i', v);

  let musicIdx = -1;
  if (spec.musicPath) {
    args.push('-stream_loop', '-1', '-i', spec.musicPath); // loop p/ cobrir a duração
    musicIdx = videos.length;
  }

  const parts = [];
  const concatInputs = [];
  for (let i = 0; i < videos.length; i++) {
    parts.push(
      `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[v${i}]`,
    );
    parts.push(`[${i}:a]aresample=async=1[a${i}]`);
    concatInputs.push(`[v${i}][a${i}]`);
  }
  parts.push(`${concatInputs.join('')}concat=n=${videos.length}:v=1:a=1[cv][ca]`);

  let vLabel = '[cv]';
  let aLabel = '[ca]';
  if (spec.subtitlePath) {
    parts.push(`[cv]ass=${escFilterPath(spec.subtitlePath)}[cvs]`);
    vLabel = '[cvs]';
  }
  if (spec.musicPath) {
    // Atenua só a trilha ([musicIdx:a] → [bg]) e mixa com a voz ([ca]).
    // normalize=0 evita o amix reduzir a voz automaticamente.
    parts.push(
      `[${musicIdx}:a]volume=${musicVolume}[bg];[ca][bg]amix=inputs=2:duration=first:normalize=0[aout]`,
    );
    aLabel = '[aout]';
  }

  args.push('-filter_complex', parts.join(';'));
  args.push('-map', vLabel, '-map', aLabel);
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', '-shortest', '-y', out);
  return args;
}

/** Caminho para o filtro ass= — escapa ':' e '\' que o ffmpeg interpreta. */
function escFilterPath(p) {
  return p.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

/**
 * Executa o ffmpeg com os argumentos construídos. Requer o binário no PATH.
 * @param {Parameters<typeof buildFfmpegArgs>[0]} spec
 * @param {{ onLog?: (m:string)=>void, ffmpegBin?: string }} [opts]
 * @returns {Promise<string>} caminho do arquivo gerado
 */
export function renderPost(spec, opts = {}) {
  const args = buildFfmpegArgs(spec);
  const bin = opts.ffmpegBin || 'ffmpeg';
  return new Promise((resolve, reject) => {
    const ff = spawn(bin, args);
    ff.stderr.on('data', (d) => opts.onLog?.(d.toString()));
    ff.on('error', (e) =>
      reject(new Error(`Falha ao iniciar o ffmpeg (${bin} está no PATH?): ${e.message}`)),
    );
    ff.on('close', (code) =>
      code === 0 ? resolve(spec.out) : reject(new Error(`ffmpeg saiu com código ${code}`)),
    );
  });
}
