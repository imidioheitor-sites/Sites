// Estratégia de postagem (Fase 2) — janelas de horário, cadência e mix de formato.
//
// Estes são valores DEFAULT baseados em boas práticas para público de lifestyle
// universitário / empreendedorismo no Brasil. Na Fase 3, o relatório de Insights
// substitui isto pelos SEUS melhores horários reais — o formato é o mesmo.

/** @typedef {'reel'|'feed'|'story'} Format */

export const DEFAULT_STRATEGY = {
  tz: 'America/Sao_Paulo',

  // Janelas por formato, em ordem de preferência, separadas por dia útil / fim de semana.
  windows: {
    reel: { weekday: ['12:00', '19:00', '21:00'], weekend: ['11:00', '19:00'] },
    feed: { weekday: ['12:30', '18:30'], weekend: ['11:30', '17:00'] },
    story: { weekday: ['09:00', '13:00', '18:00', '21:30'], weekend: ['11:00', '16:00', '20:00'] },
  },

  cadence: {
    maxMainPerDay: 1, // no máximo 1 post principal (reel/feed) por dia
    minGapDaysSameQuadro: 2, // não repetir o mesmo quadro em menos de 2 dias
    storiesPerDay: 2, // slots de story por dia (companheiros do post principal)
  },

  // Formato preferido por quadro. Grupos só com imagem viram 'feed' de qualquer forma.
  formatByQuadro: {
    'rotina-dia': 'reel',
    'comentario-noticia': 'reel',
    'dicas-estudo': 'reel',
    'review-livro': 'feed', // livro combina com carrossel/estático
    'quickstart-materia': 'reel',
    geral: 'feed',
  },
};

/**
 * Decide o formato de um post: preferência do quadro, mas força 'feed' se o
 * material for só imagem (sem vídeo para virar Reel).
 * @param {string} quadroId
 * @param {boolean} hasVideo
 * @param {typeof DEFAULT_STRATEGY} [strategy]
 * @returns {Format}
 */
export function formatFor(quadroId, hasVideo, strategy = DEFAULT_STRATEGY) {
  if (!hasVideo) return 'feed';
  return strategy.formatByQuadro[quadroId] || 'reel';
}
