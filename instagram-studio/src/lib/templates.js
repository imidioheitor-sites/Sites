// Os "quadros" que você listou, cada um vira um template nomeado.
// O robô faz a parte mecânica (robot); você entrega a parte criativa (you).
// A IA nunca cria o conteúdo publicado — ela sugere o template e pede a criação.

export const TEMPLATES = [
  {
    id: "agenda-do-dia",
    nome: "O que vou fazer no dia",
    formato: "reel",
    gatilhos: ["hoje", "meu dia", "agenda", "rotina", "vou fazer", "plano do dia"],
    robot: "Corta os clipes da manhã, legenda dinâmica, capa \"AGENDA\".",
    you: "A fala/gravação do plano do dia.",
    render: { saida: "reel", dimensao: "1080x1920", capa: "AGENDA", trilha: "energetica", legenda: "dinamica" },
  },
  {
    id: "comentario-noticia",
    nome: "Comentário sobre notícia",
    formato: "reel",
    gatilhos: ["notícia", "aconteceu", "vi que", "reação", "opinião", "tech", "empreendedorismo"],
    robot: "Sugere a notícia de tech/empreendedorismo do dia; monta lower-third.",
    you: "Sua opinião gravada. A opinião é sempre sua.",
    render: { saida: "reel", dimensao: "1080x1920", capa: "lower-third", trilha: "neutra", legenda: "lower-third" },
  },
  {
    id: "dicas-de-estudo",
    nome: "Dicas de estudo",
    formato: "carrossel",
    gatilhos: ["dica", "estudo", "estudar", "método", "produtividade", "como aprender"],
    robot: "Template de bullets animados + capa da série.",
    you: "A dica e a gravação.",
    render: { saida: "carrossel", dimensao: "1080x1350", capa: "serie", trilha: "nenhuma", legenda: "bullets" },
  },
  {
    id: "review-livro",
    nome: "Review de livro",
    formato: "reel",
    gatilhos: ["livro", "review", "resenha", "li", "leitura", "autor", "nota"],
    robot: "Capa com título/nota, cortes, trilha calma.",
    you: "Foto do livro, sua resenha falada e a nota.",
    render: { saida: "reel", dimensao: "1080x1920", capa: "titulo-nota", trilha: "calma", legenda: "dinamica" },
  },
  {
    id: "quickstart-materia",
    nome: "Quickstart de matéria",
    formato: "reel",
    gatilhos: ["matéria", "aula", "explicando", "resumo", "quickstart", "conceito", "tópico"],
    robot: "Formato \"aula rápida\", marcadores de tópico, capa numerada.",
    you: "A explicação gravada da matéria.",
    render: { saida: "reel", dimensao: "1080x1920", capa: "numerada", trilha: "neutra", legenda: "dinamica" },
  },
];

export function templateById(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}

// Escolha heurística de template a partir de um texto (transcrição + visão).
// Usado no modo dry-run, sem IA. A IA, quando disponível, decide melhor.
export function guessTemplate(text) {
  const hay = (text || "").toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const t of TEMPLATES) {
    const score = t.gatilhos.reduce((n, g) => (hay.includes(g) ? n + 1 : n), 0);
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best || templateById("quickstart-materia");
}
