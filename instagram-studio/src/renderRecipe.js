// Receita de edição por template (Fase 2).
//
// Transforma um post + o template do quadro numa RECEITA concreta de edição:
// ordem dos clipes, papel de cada um, capa, legendas dinâmicas, trilha, formato,
// e um esboço de comando ffmpeg que o renderizador da Fase 2 vai executar.
//
// REGRA DE OURO: a receita EDITA o material que VOCÊ gravou. Ela não gera vídeo,
// não escreve a legenda do post, não inventa a capa — o texto/capa vêm de você.

import { quadroById } from './quadros.js';

/**
 * @param {import('./types.js').PostGroup} group
 * @param {import('./types.js').MediaAsset[]} assets
 */
export function buildRecipe(group, assets) {
  const q = quadroById(group.quadroId);
  const items = group.assetIds.map((id) => assets.find((a) => a.id === id)).filter(Boolean);

  const videos = items.filter((a) => a.kind === 'video');
  const images = items.filter((a) => a.kind === 'image');

  const segments = [];
  videos.forEach((v, i) => {
    segments.push({
      asset: v.name,
      role: i === 0 ? 'abertura / gancho (0–3s)' : 'desenvolvimento',
      note: i === 0 ? 'melhor gancho vai aqui — corte seco no ponto mais forte da fala' : 'manter só o essencial',
    });
  });
  images.forEach((img) => {
    segments.push({ asset: img.name, role: 'b-roll / capa', note: 'usar como capa ou corte de respiro' });
  });

  return {
    format: q.templateSpec.aspect,
    quadro: q.name,
    cover: q.templateSpec.coverLabel,
    captionStyle: q.templateSpec.captionStyle,
    music: q.templateSpec.musicMood,
    editNotes: q.templateSpec.notes,
    segments,
    deliverablesFromUser: q.youProvide, // o que você cria (a IA não faz)
  };
}

/** @param {ReturnType<typeof buildRecipe>} r */
export function renderRecipeMarkdown(r) {
  const L = [];
  L.push(`# Receita de edição — ${r.quadro}`);
  L.push('');
  L.push(`- **Formato:** ${r.format}   ·   **Capa:** ${r.cover}`);
  L.push(`- **Legendas:** ${r.captionStyle}`);
  L.push(`- **Trilha:** ${r.music}`);
  L.push(`- **Notas:** ${r.editNotes}`);
  L.push('');
  L.push('## Linha do tempo');
  r.segments.forEach((s, i) => {
    L.push(`${i + 1}. **${s.asset}** — ${s.role}`);
    L.push(`   - ${s.note}`);
  });
  L.push('');
  L.push('## 🔒 Você fornece (a IA não cria)');
  for (const d of r.deliverablesFromUser) L.push(`- [ ] ${d}`);
  L.push('');
  return L.join('\n');
}

/**
 * Esboço do comando ffmpeg que o renderizador da Fase 2 executará.
 * É ILUSTRATIVO (não roda aqui) — mostra o formato 9:16, a capa, a legenda
 * (cujo texto vem de você) e a trilha.
 * @param {ReturnType<typeof buildRecipe>} r
 */
export function ffmpegOutline(r) {
  const clips = r.segments.map((s) => `  -i "${s.asset}" \\`).join('\n');
  return [
    'ffmpeg \\',
    clips,
    '  -i musica.mp3 \\',
    '  -filter_complex "\\',
    '    [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[v0]; \\',
    '    ...concatena os clipes na ordem da receita...; \\',
    `    drawtext=text='${r.cover}':...(capa)...; \\`,
    '    drawtext=textfile=legenda_dinamica.txt:...(legendas — SEU texto)... \\',
    '  " \\',
    '  -shortest -c:v libx264 -pix_fmt yuv420p saida_9x16.mp4',
  ].join('\n');
}
