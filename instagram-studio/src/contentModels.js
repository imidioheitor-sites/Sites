// Biblioteca de MODELOS de conteúdo (Fase 4) — formatos comprovados para o nicho
// de lifestyle universitário / empreendedorismo.
//
// São ESTRUTURAS e GANCHOS (direção), não conteúdo pronto. O motor de
// recomendações escolhe um modelo que combina com cada quadro e te entrega um
// prompt/ângulo — você grava e escreve.

/**
 * @typedef {Object} ContentModel
 * @property {string} id
 * @property {string} name
 * @property {string} structure   como o vídeo se organiza
 * @property {string[]} hookPrompts perguntas que apontam o gancho (direção)
 * @property {string[]} fits       ids de quadro em que este modelo funciona bem
 */

/** @type {ContentModel[]} */
export const CONTENT_MODELS = [
  {
    id: 'erro-comum',
    name: 'Erro comum',
    structure: 'Mostra o erro → por que acontece → como corrigir',
    hookPrompts: ['Qual erro quase todo mundo comete nisso?', 'O que você fazia errado antes?'],
    fits: ['dicas-estudo', 'quickstart-materia', 'comentario-noticia'],
  },
  {
    id: 'antes-depois',
    name: 'Antes e depois',
    structure: 'Estado inicial → a virada → o resultado',
    hookPrompts: ['Qual foi a sua virada nisso?', 'O que mudou do começo pra hoje?'],
    fits: ['rotina-dia', 'dicas-estudo', 'review-livro'],
  },
  {
    id: 'lista-rapida',
    name: 'Lista rápida',
    structure: '3–5 itens em cortes secos, um por corte',
    hookPrompts: ['Quais 3 coisas você faria de novo?', 'Se fosse escolher só 3, quais seriam?'],
    fits: ['dicas-estudo', 'rotina-dia', 'review-livro'],
  },
  {
    id: 'contra-intuitivo',
    name: 'Contra-intuitivo',
    structure: 'Tese contrária ao óbvio → argumento → conclusão',
    hookPrompts: ['Qual verdade impopular você defende sobre isso?', 'No que quase todo mundo erra a leitura?'],
    fits: ['comentario-noticia', 'review-livro', 'dicas-estudo'],
  },
  {
    id: 'bastidor',
    name: 'Bastidor honesto',
    structure: 'Mostra o processo real, sem filtro',
    hookPrompts: ['O que ninguém vê nesse processo?', 'Como é isso na vida real, sem edição?'],
    fits: ['rotina-dia', 'quickstart-materia'],
  },
  {
    id: 'quickstart-60s',
    name: 'Explicação em 60s',
    structure: 'Promessa clara → passo a passo → recap',
    hookPrompts: ['Em 60s, o que a pessoa entende disso?', 'Qual a menor explicação que já resolve?'],
    fits: ['quickstart-materia', 'dicas-estudo'],
  },
];

/** @param {string} quadroId @returns {ContentModel[]} */
export function modelsFor(quadroId) {
  const list = CONTENT_MODELS.filter((m) => m.fits.includes(quadroId));
  return list.length ? list : CONTENT_MODELS.slice(0, 2);
}
