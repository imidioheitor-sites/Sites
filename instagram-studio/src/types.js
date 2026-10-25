// Modelo de dados do pipeline. JSDoc para ter tipos no editor sem build de TS.

/**
 * Um arquivo de mídia depois de analisado (voz transcrita + visão descrita).
 * É o que sai da etapa 02 (voz + visão) e entra na etapa 03 (agrupamento).
 *
 * @typedef {Object} MediaAsset
 * @property {string}   id           ID do arquivo (no Drive, em produção)
 * @property {string}   name         Nome do arquivo original
 * @property {'video'|'image'} kind
 * @property {string}   createdAt    ISO 8601 — quando foi gravado/enviado
 * @property {number}   [durationSec] Duração (vídeo)
 * @property {string}   transcript   Fala transcrita (Whisper). '' para imagem.
 * @property {string[]} visualTags   Tags do que aparece na cena (visão)
 * @property {string}   visualSummary Uma linha descrevendo a cena (visão)
 */

/**
 * Um "quadro" do perfil vira um template nomeado. A parte que o robô executa
 * é `templateSpec`; a parte criativa que fica com você é `youProvide`.
 *
 * @typedef {Object} Quadro
 * @property {string}   id
 * @property {string}   name
 * @property {string}   slug
 * @property {string[]} keywords     Sinais (na fala/tags) que indicam este quadro
 * @property {TemplateSpec} templateSpec
 * @property {string[]} youProvide   O que VOCÊ cria (a IA nunca faz)
 * @property {string[]} anglePrompts Perguntas que ajudam a achar o ângulo — direção, não legenda pronta
 */

/**
 * @typedef {Object} TemplateSpec
 * @property {string} coverLabel   Rótulo da capa (ex.: "AGENDA DO DIA")
 * @property {string} aspect       Proporção (ex.: "9:16")
 * @property {string} captionStyle Estilo das legendas dinâmicas no vídeo
 * @property {string} musicMood    Clima da trilha
 * @property {string} notes        Observações de edição
 */

/**
 * Um post proposto: um agrupamento de assets sob um quadro, num dia.
 *
 * @typedef {Object} PostGroup
 * @property {string}   quadroId
 * @property {string}   date        YYYY-MM-DD
 * @property {string}   slug
 * @property {string}   folderName  ex.: post_2026-07-24_review-livro
 * @property {string[]} assetIds
 * @property {number}   score       Confiança do match do quadro (0..1)
 * @property {string}   rationale   Por que esses assets foram juntados
 */

export {};
