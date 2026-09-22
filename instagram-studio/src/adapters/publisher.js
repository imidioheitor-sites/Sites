// Camada de postagem (Fase 2/4) — publica o post no horário agendado.
//
// Dois backends com o mesmo contrato `publish({ entry, approval })`:
//   - DryRunPublisher: registra o que SERIA postado (usado no demo/testes)
//   - MetricoolPublisher: agenda/posta via API do Metricool (parceiro oficial da
//     Meta) — caminho recomendado para o MVP. Publer/Graph API seguem o mesmo shape.
//
// REGRA DE OURO: o publisher só recebe posts já aprovados por você, com a SUA
// legenda (e capa, quando o quadro pede). Quem barra o que não está pronto é o
// planejador em publish.js — o publisher nunca inventa legenda nem capa.

/**
 * @typedef {Object} PublishResult
 * @property {string} folderName
 * @property {'dry-run'|'scheduled'|'posted'} status
 * @property {string} when   ISO ou "date time tz"
 * @property {string} [providerId]
 */

/** Backend offline: não posta nada, só registra. */
export class DryRunPublisher {
  constructor() {
    /** @type {PublishResult[]} */
    this.published = [];
  }
  /** @param {{ entry: any, approval: any }} job */
  async publish({ entry }) {
    const res = {
      folderName: entry.folderName,
      status: /** @type {const} */ ('dry-run'),
      when: `${entry.date} ${entry.time} ${entry.tz}`,
    };
    this.published.push(res);
    return res;
  }
}

/**
 * Backend de produção via Metricool. Agenda o post para a data/hora do cronograma.
 * Requer METRICOOL_TOKEN e METRICOOL_BLOG_ID. fetch nativo (Node 20+).
 */
export class MetricoolPublisher {
  /** @param {{ token?: string, blogId?: string, base?: string }} [cfg] */
  constructor(cfg = {}) {
    this.token = cfg.token || process.env.METRICOOL_TOKEN;
    this.blogId = cfg.blogId || process.env.METRICOOL_BLOG_ID;
    this.base = cfg.base || 'https://app.metricool.com/api';
    if (!this.token || !this.blogId)
      throw new Error('METRICOOL_TOKEN / METRICOOL_BLOG_ID não configurados — postagem live indisponível.');
  }

  /**
   * @param {{ entry: any, approval: { caption: string, mediaUrls: string[] } }} job
   * @returns {Promise<PublishResult>}
   */
  async publish({ entry, approval }) {
    const providerFormat = { reel: 'REEL', feed: 'INSTAGRAM', story: 'STORY' }[entry.format] || 'INSTAGRAM';
    const body = {
      text: approval.caption, // SUA legenda — nunca gerada aqui
      media: approval.mediaUrls, // SEU material editado
      network: 'instagram',
      publicationType: providerFormat,
      scheduledAt: `${entry.date}T${entry.time}:00`,
      timezone: entry.tz,
    };
    const res = await fetch(`${this.base}/v2/scheduler/posts?blogId=${this.blogId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Mc-Auth': this.token },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Metricool ${res.status}: ${await res.text()}`);
    const data = await res.json().catch(() => ({}));
    return {
      folderName: entry.folderName,
      status: 'scheduled',
      when: body.scheduledAt,
      providerId: data.id,
    };
  }
}

/**
 * Backend de produção via Instagram Graph API (Fase 4) — postagem oficial direta.
 * Fluxo de 2 passos: cria o container de mídia e depois publica.
 * Requer IG_USER_ID + IG_ACCESS_TOKEN e a permissão instagram_content_publish.
 * As mídias precisam estar em URLs públicas acessíveis (image_url/video_url).
 */
export class GraphPublisher {
  /** @param {{ igUserId?: string, accessToken?: string, base?: string }} [cfg] */
  constructor(cfg = {}) {
    this.igUserId = cfg.igUserId || process.env.IG_USER_ID;
    this.token = cfg.accessToken || process.env.IG_ACCESS_TOKEN;
    this.base = cfg.base || 'https://graph.facebook.com/v20.0';
    if (!this.igUserId || !this.token)
      throw new Error('IG_USER_ID / IG_ACCESS_TOKEN não configurados — GraphPublisher indisponível.');
  }

  /**
   * @param {{ entry: any, approval: { caption: string, mediaUrls: string[] } }} job
   * @returns {Promise<import('./publisher.js').PublishResult>}
   */
  async publish({ entry, approval }) {
    const media = approval.mediaUrls?.[0];
    if (!media) throw new Error(`Sem URL de mídia para ${entry.folderName}.`);

    // 1) cria o container
    const params = new URLSearchParams({ caption: approval.caption, access_token: this.token });
    if (entry.format === 'reel') {
      params.set('media_type', 'REELS');
      params.set('video_url', media);
    } else if (entry.format === 'story') {
      params.set('media_type', 'STORIES');
      params.set(/\.(mp4|mov)$/i.test(media) ? 'video_url' : 'image_url', media);
    } else {
      params.set('image_url', media);
    }
    const container = await postJson(`${this.base}/${this.igUserId}/media`, params);

    // 2) publica o container
    const pub = await postJson(
      `${this.base}/${this.igUserId}/media_publish`,
      new URLSearchParams({ creation_id: container.id, access_token: this.token }),
    );

    return { folderName: entry.folderName, status: 'posted', when: new Date().toISOString(), providerId: pub.id };
  }
}

async function postJson(url, params) {
  const res = await fetch(url, { method: 'POST', body: params });
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  return res.json();
}
