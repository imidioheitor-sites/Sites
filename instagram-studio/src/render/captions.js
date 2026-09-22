// Legendas dinâmicas (Fase 2) — transforma a transcrição (que VOCÊ falou) em
// arquivos de legenda para o vídeo. Não gera texto: usa a sua própria fala.
//
// - segmentsToSrt: SRT clássico a partir de segmentos {start,end,text}
// - wordsToAss:    ASS palavra-a-palavra (estilo Reels), a partir de palavras
//                  com timing {word,start,end} (Whisper com granularidade de palavra)

/** @param {number} s segundos → "HH:MM:SS,mmm" */
export function srtTime(s) {
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const total = Math.floor(s);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return `${p2(hh)}:${p2(mm)}:${p2(ss)},${p3(ms)}`;
}

/** @param {number} s segundos → "H:MM:SS.cc" (centésimos, formato ASS) */
export function assTime(s) {
  const cs = Math.round((s - Math.floor(s)) * 100);
  const total = Math.floor(s);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return `${hh}:${p2(mm)}:${p2(ss)}.${p2(cs)}`;
}

/**
 * @param {{start:number,end:number,text:string}[]} segments
 * @returns {string} conteúdo .srt
 */
export function segmentsToSrt(segments) {
  return (
    segments
      .map((seg, i) => `${i + 1}\n${srtTime(seg.start)} --> ${srtTime(seg.end)}\n${seg.text.trim()}\n`)
      .join('\n') + '\n'
  );
}

/**
 * ASS palavra-a-palavra: cada palavra aparece no seu tempo, centralizada e grande.
 * @param {{word:string,start:number,end:number}[]} words
 * @param {{ fontSize?:number, primary?:string, outline?:string, marginV?:number }} [style]
 * @returns {string} conteúdo .ass
 */
export function wordsToAss(words, style = {}) {
  const fontSize = style.fontSize ?? 90;
  const primary = style.primary ?? '&H00FFFFFF'; // branco (BGR + alpha)
  const outline = style.outline ?? '&H00000000'; // contorno preto
  const marginV = style.marginV ?? 260;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: Dyn, Arial, ${fontSize}, ${primary}, ${outline}, &H00000000, 1, 6, 2, 2, 40, 40, ${marginV}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const lines = words
    .filter((w) => w.word && w.word.trim())
    .map(
      (w) =>
        `Dialogue: 0,${assTime(w.start)},${assTime(w.end)},Dyn,,0,0,0,,${assEscape(w.word.trim().toUpperCase())}`,
    );

  return header + '\n' + lines.join('\n') + '\n';
}

function assEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\n/g, '\\N');
}
function p2(n) {
  return String(n).padStart(2, '0');
}
function p3(n) {
  return String(n).padStart(3, '0');
}
