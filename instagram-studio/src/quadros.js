// Os quadros do perfil, como templates nomeados.
//
// Cada quadro descreve:
//   - keywords: o que o robô procura na fala/tags para reconhecer o quadro
//   - templateSpec: a parte MECÂNICA que a edição automática aplica
//   - youProvide: a parte CRIATIVA que fica com você (a IA nunca faz)
//   - anglePrompts: perguntas que apontam um ângulo — direção, nunca legenda pronta
//
// Referência de linguagem visual: perfis de lifestyle universitário /
// empreendedorismo (ex.: Tallis Gomes e afins). Ajuste livremente.

/** @type {import('./types.js').Quadro[]} */
export const QUADROS = [
  {
    id: 'rotina-dia',
    name: 'O que vou fazer no dia',
    slug: 'rotina-dia',
    keywords: [
      'hoje', 'meu dia', 'agenda', 'rotina', 'plano do dia', 'de manhã',
      'acordei', 'vou fazer', 'metas de hoje', 'to do', 'lista de tarefas',
    ],
    templateSpec: {
      coverLabel: 'AGENDA DO DIA',
      aspect: '9:16',
      captionStyle: 'legenda dinâmica palavra-a-palavra, alto contraste',
      musicMood: 'upbeat, manhã produtiva',
      notes: 'abre com o rosto falando; corta em cada tarefa; checklist na tela',
    },
    youProvide: ['A gravação falando o plano do dia', 'A legenda final do post'],
    anglePrompts: [
      'Qual é a UMA coisa que faz o dia valer a pena? Comece por ela.',
      'Tem um contraste (caos x organização) que dá gancho nos 3s iniciais?',
    ],
  },
  {
    id: 'comentario-noticia',
    name: 'Comentário sobre notícia (tech / empreendedorismo)',
    slug: 'comentario-noticia',
    keywords: [
      'notícia', 'saiu hoje', 'li que', 'startup', 'ia', 'inteligência artificial',
      'mercado', 'investimento', 'empreendedorismo', 'tech', 'tecnologia',
      'aconteceu', 'lançou', 'rodada', 'aquisição',
    ],
    templateSpec: {
      coverLabel: 'O QUE ISSO SIGNIFICA',
      aspect: '9:16',
      captionStyle: 'lower-third com a manchete + sua opinião destacada',
      musicMood: 'neutro/tenso, tom de análise',
      notes: 'card da notícia na abertura; corte para você reagindo; sua opinião é sempre sua',
    },
    youProvide: [
      'A notícia que você quer comentar',
      'Sua opinião gravada (a opinião é sempre sua)',
      'A legenda final do post',
    ],
    anglePrompts: [
      'Qual é a sua leitura contrária ao óbvio sobre essa notícia?',
      'Como isso afeta quem está começando? Traga para o seu público.',
    ],
  },
  {
    id: 'dicas-estudo',
    name: 'Dicas de estudo',
    slug: 'dicas-estudo',
    keywords: [
      'dica de estudo', 'estudar', 'revisão', 'prova', 'concentração', 'foco',
      'flashcards', 'anki', 'pomodoro', 'resumo', 'como estudar', 'produtividade',
    ],
    templateSpec: {
      coverLabel: 'DICA DE ESTUDO',
      aspect: '9:16',
      captionStyle: 'bullets animados aparecendo um a um',
      musicMood: 'calmo, foco',
      notes: 'capa da série numerada; cada dica é um corte; CTA de salvar no fim',
    },
    youProvide: ['A dica e a gravação explicando', 'A legenda final do post'],
    anglePrompts: [
      'Qual erro comum essa dica corrige? Abra o vídeo mostrando o erro.',
      'Dá para transformar em "faça isto, não aquilo"?',
    ],
  },
  {
    id: 'review-livro',
    name: 'Review de livro',
    slug: 'review-livro',
    keywords: [
      'livro', 'lendo', 'terminei de ler', 'autor', 'capítulo', 'resenha',
      'recomendo', 'nota', 'leitura', 'página', 'estante',
    ],
    templateSpec: {
      coverLabel: 'REVIEW',
      aspect: '9:16',
      captionStyle: 'título do livro + nota em destaque',
      musicMood: 'calmo, aconchegante',
      notes: 'capa com título/nota; b-roll do livro; corte para a resenha falada',
    },
    youProvide: [
      'Foto/vídeo do livro',
      'Sua resenha falada',
      'A nota que você dá',
      'A legenda final do post',
    ],
    anglePrompts: [
      'Qual frase do livro mudou algo em como você pensa? Comece por ela.',
      'Para quem NÃO é esse livro? Isso filtra e engaja.',
    ],
  },
  {
    id: 'quickstart-materia',
    name: 'Quickstart de matéria',
    slug: 'quickstart-materia',
    keywords: [
      'matéria', 'aula', 'explicando', 'conceito', 'como funciona', 'resumão',
      'cálculo', 'física', 'química', 'história', 'programação', 'do zero',
      'introdução', 'básico', 'quickstart',
    ],
    templateSpec: {
      coverLabel: 'QUICKSTART',
      aspect: '9:16',
      captionStyle: 'marcadores de tópico + timestamps na tela',
      musicMood: 'neutro, didático',
      notes: 'formato aula-rápida; capa numerada por tópico; corte por conceito',
    },
    youProvide: ['A explicação gravada da matéria', 'A legenda final do post'],
    anglePrompts: [
      'Qual a menor coisa que faz a pessoa "entender de vez"? Vá direto nela.',
      'Consegue prometer um resultado claro no gancho ("em 40s você entende X")?',
    ],
  },
];

/** Quadro de fallback quando nenhum sinal claro é detectado. */
export const QUADRO_GERAL = {
  id: 'geral',
  name: 'A classificar',
  slug: 'geral',
  keywords: [],
  templateSpec: {
    coverLabel: 'RASCUNHO',
    aspect: '9:16',
    captionStyle: '—',
    musicMood: '—',
    notes: 'não deu para identificar o quadro; revisar manualmente',
  },
  youProvide: ['Definir de qual quadro isso faz parte'],
  anglePrompts: ['O que você queria dizer com esse material?'],
};

/** @param {string} id */
export function quadroById(id) {
  if (id === QUADRO_GERAL.id) return QUADRO_GERAL;
  return QUADROS.find((q) => q.id === id) ?? QUADRO_GERAL;
}
