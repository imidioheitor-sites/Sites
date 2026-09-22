// Adaptador de notícias (Fase 4) — trends de tech/empreendedorismo via RSS.
//
// Fonte limpa e legal: feeds RSS públicos (nada de raspar o Instagram). Alimenta
// o quadro "Comentário sobre notícia" com temas do dia — você dá a opinião.
// fetch nativo (Node 20+). Parser mínimo de <item>.

/** @typedef {{ title:string, link:string, source:string, publishedAt:string }} NewsItem */

/** Feeds default (troque pelos que você acompanha). */
export const DEFAULT_FEEDS = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Startups (BR)', url: 'https://www.startupi.com.br/feed/' },
];

/**
 * @param {{name:string,url:string}[]} [feeds]
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<NewsItem[]>}
 */
export async function fetchNews(feeds = DEFAULT_FEEDS, opts = {}) {
  const limit = opts.limit ?? 10;
  const items = [];
  for (const f of feeds) {
    try {
      const res = await fetch(f.url, { headers: { 'User-Agent': 'instagram-studio/0.1' } });
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseFeed(xml)) items.push({ ...item, source: f.name });
    } catch {
      /* feed indisponível — segue para o próximo */
    }
  }
  // mais recentes primeiro, quando houver data
  items.sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
  return items.slice(0, limit);
}

/** Extrai itens de RSS (<item>) e Atom (<entry>). */
export function parseFeed(xml) {
  const out = [];
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/g)].map((m) => m[0]);
  for (const b of blocks) {
    const title = tag(b, 'title');
    let link = tag(b, 'link');
    if (!link) {
      const href = /<link[^>]*href="([^"]+)"/.exec(b);
      link = href ? href[1] : '';
    }
    const publishedAt = tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || '';
    if (title) out.push({ title, link, publishedAt });
  }
  return out;
}

function tag(block, name) {
  const m = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`).exec(block);
  if (!m) return '';
  return m[1]
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}
