// Adapter da API do Metricool (agendamento/postagem).
//
// Contrato (v2), confirmado em várias implementações reais:
//   POST https://app.metricool.com/api/v2/scheduler/posts?blogId=<id>&userId=<id>
//   header: X-Mc-Auth: <userToken>
//   body: { text, providers:[{network:"instagram"}], publicationDate:{dateTime,timezone},
//           media:[<URL pública>], autoPublish, draft, instagramData:{type:"REEL"},
//           saveExternalMediaFiles:true }
//
// Observações importantes:
// - Nomes de campo são case-sensitive: `text` (não content), `providers` (não networks).
// - A mídia precisa ser uma URL PÚBLICA (o Metricool baixa com saveExternalMediaFiles).
// - Tipos de Reel: instagramData.type ∈ POST | REEL | TRIAL_REEL | STORY (singular).
// - O Metricool responde 200 mesmo em falha silenciosa → convém verificar depois.
//
// Sem token, todas as funções operam em modo dry-run: devolvem o payload que
// SERIA enviado, sem tocar na rede.

const BASE = "https://app.metricool.com/api";

export function metricoolConfigured(config) {
  return !!creds(config).token;
}

export function creds(config) {
  const m = config?.metricool || {};
  return {
    token: process.env[m.tokenEnv || "METRICOOL_USER_TOKEN"] || "",
    userId: process.env.METRICOOL_USER_ID || m.userId || "",
    blogId: process.env.METRICOOL_BLOG_ID || m.blogId || "",
    timezone: m.timezone || config?.timezone || "America/Sao_Paulo",
  };
}

// Monta o corpo de um post agendado. Puro (testável sem rede).
export function buildSchedulePayload({
  text,
  mediaUrls = [],
  dateTimeLocal,
  timezone,
  network = "instagram",
  igType = "REEL",
  autoPublish = true,
  draft = false,
}) {
  const payload = {
    autoPublish,
    draft,
    text: text || "",
    providers: [{ network }],
    publicationDate: { dateTime: dateTimeLocal, timezone },
    media: mediaUrls,
    mediaAltText: [],
    saveExternalMediaFiles: true,
    hasNotReadNotes: false,
  };
  if (network === "instagram") {
    payload.instagramData = { type: igType, autoPublish };
  }
  return payload;
}

// Agenda um post. Em dry-run devolve { dryRun:true, payload, url }.
export async function schedulePost(config, payload) {
  const c = creds(config);
  const url = `${BASE}/v2/scheduler/posts?blogId=${encodeURIComponent(c.blogId)}&userId=${encodeURIComponent(c.userId)}`;
  if (!c.token) {
    return { dryRun: true, ok: false, url, payload };
  }
  const res = await mcFetch(url, "POST", c.token, payload);
  // 200 não garante sucesso — devolvemos tudo para o chamador decidir/verificar.
  return { dryRun: false, ok: res.ok, status: res.status, data: res.data, url, payload };
}

// Lista as marcas (brands) da conta — para descobrir o blogId a partir do nome.
export async function listBrands(config) {
  const c = creds(config);
  if (!c.token) return { dryRun: true, brands: [] };
  const url = `${BASE}/v2/settings/brands?userId=${encodeURIComponent(c.userId)}`;
  const res = await mcFetch(url, "GET", c.token);
  return { dryRun: false, ok: res.ok, status: res.status, brands: res.data };
}

// Verifica se um post caiu na agenda perto do horário pedido (200 silencioso).
export async function verifyScheduled(config, { dateFrom, dateTo }) {
  const c = creds(config);
  if (!c.token) return { dryRun: true, posts: [] };
  const url = `${BASE}/v2/scheduler/posts?blogId=${encodeURIComponent(c.blogId)}&userId=${encodeURIComponent(
    c.userId
  )}&from=${encodeURIComponent(dateFrom)}&to=${encodeURIComponent(dateTo)}`;
  const res = await mcFetch(url, "GET", c.token);
  return { dryRun: false, ok: res.ok, status: res.status, posts: res.data };
}

async function mcFetch(url, method, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      "X-Mc-Auth": token,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}
