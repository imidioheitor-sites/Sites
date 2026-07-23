// Serviço HTTP fino que expõe a ingestão para o n8n (orquestração 24/7).
//
// Endpoints:
//   GET  /health           -> { ok: true }
//   POST /ingest?move=1    -> roda o pipeline sobre a inbox e devolve o resultado
//                             em JSON, incluindo o markdown das sugestões para o
//                             nó Gmail do n8n enviar.
//
// Autenticação opcional por token compartilhado: se STUDIO_TOKEN estiver setado,
// exija o header  Authorization: Bearer <token>  (ou  x-studio-token: <token>).

import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { scaffold, paths } from "./scaffold.js";
import { ingest } from "./pipeline.js";
import { edit } from "./edit.js";
import { publish } from "./publish.js";
import { log } from "./lib/log.js";

const PORT = Number(process.env.STUDIO_PORT || 4599);
const TOKEN = process.env.STUDIO_TOKEN || "";
const MEDIA_TOKEN = process.env.STUDIO_MEDIA_TOKEN || TOKEN;

const MIME = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    // Health check não exige token — útil para o n8n testar a conexão.
    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, { ok: true, service: "instagram-studio", phases: [1, 2] });
    }

    // Mídia para o Metricool baixar. Autenticada por token na query (o Metricool
    // não manda header), separada da API. Fica antes do gate de token da API.
    if (req.method === "GET" && url.pathname.startsWith("/media/")) {
      return serveMedia(req, res, url);
    }

    if (!authorized(req)) {
      return send(res, 401, { ok: false, error: "não autorizado" });
    }

    if (req.method === "POST" && url.pathname === "/ingest") {
      try {
        const move = url.searchParams.get("move") === "1" || url.searchParams.get("move") === "true";
        const config = await loadConfig();
        await scaffold(config);
        const result = await ingest(config, { move });
        return send(res, 200, {
          ok: true,
          mode: result.mode,
          count: result.count ?? result.groups.length,
          subject: result.subject || "",
          suggestions: result.suggestions || "",
          groups: result.groups.map((g) => ({
            folder: g.folder,
            template: g.template.id,
            templateNome: g.template.nome,
            ideia: g.ideia,
            pedido: g.pedido || g.template.you,
            arquivos: g.items.map((i) => i.name),
          })),
        });
      } catch (e) {
        log.err(e.stack || e.message);
        return send(res, 500, { ok: false, error: e.message });
      }
    }

    if (req.method === "POST" && url.pathname === "/edit") {
      try {
        const force = url.searchParams.get("force") === "1" || url.searchParams.get("force") === "true";
        const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
        const config = await loadConfig();
        await scaffold(config);
        const result = await edit(config, { force, dryRun });
        return send(res, 200, {
          ok: true,
          count: result.count,
          novos: result.novos,
          subject: result.subject || "",
          summary: result.summary || "",
          cronograma: result.scheduled,
          posts: result.edited.map((p) => ({
            post: p.post,
            template: p.templateId,
            templateNome: p.templateNome,
            saida: p.saida,
            dimensao: p.dimensao,
            outputs: p.outputs,
            pendencias: p.warnings.length,
            pulado: !!p.pulado,
          })),
        });
      } catch (e) {
        log.err(e.stack || e.message);
        return send(res, 500, { ok: false, error: e.message });
      }
    }

    if (req.method === "POST" && url.pathname === "/publish") {
      try {
        const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
        const config = await loadConfig();
        await scaffold(config);
        const result = await publish(config, { dryRun });
        return send(res, 200, {
          ok: true,
          count: result.count,
          agendados: result.agendados,
          dryRun: result.dryRun,
          subject: result.subject || "",
          summary: result.summary || "",
          results: result.results.map((r) => ({
            post: r.post,
            quando: r.quando,
            igType: r.igType,
            status: r.status,
            httpStatus: r.httpStatus,
            mediaUrls: r.mediaUrls,
            problemas: r.problemas || [],
          })),
        });
      } catch (e) {
        log.err(e.stack || e.message);
        return send(res, 500, { ok: false, error: e.message });
      }
    }

    return send(res, 404, { ok: false, error: "rota não encontrada" });
  });

  server.listen(PORT, () => {
    log.title(`Instagram-Studio ouvindo em http://localhost:${PORT}`);
    log.info(`  GET  /health`);
    log.info(`  POST /ingest?move=1   ${TOKEN ? "(exige token)" : "(sem token)"}`);
    log.info(`  POST /edit?force=1    ${TOKEN ? "(exige token)" : "(sem token)"}`);
    log.info(`  POST /publish?dryRun=1 ${TOKEN ? "(exige token)" : "(sem token)"}`);
    log.info(`  GET  /media/<post>/<arquivo>?token=…  (para o Metricool baixar)`);
    if (!TOKEN) log.warn("STUDIO_TOKEN não setado — o endpoint está aberto. Ok em rede local; num VPS, defina um token.");
  });
  return server;
}

function authorized(req) {
  if (!TOKEN) return true;
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  const header = req.headers["x-studio-token"] || "";
  return bearer === TOKEN || header === TOKEN;
}

// Serve um arquivo de 03_editados/<post>/<arquivo>, com proteção contra path
// traversal e token na query (o Metricool baixa via URL, sem header).
async function serveMedia(req, res, url) {
  if (MEDIA_TOKEN && url.searchParams.get("token") !== MEDIA_TOKEN) {
    return send(res, 401, { ok: false, error: "token de mídia inválido" });
  }
  const parts = url.pathname.split("/").filter(Boolean); // ["media", post, file]
  if (parts.length !== 3) return send(res, 404, { ok: false, error: "caminho inválido" });
  const post = decodeURIComponent(parts[1]);
  const file = decodeURIComponent(parts[2]);
  if (post.includes("..") || file.includes("..") || post.includes("/") || file.includes("/")) {
    return send(res, 400, { ok: false, error: "caminho inválido" });
  }
  const config = await loadConfig();
  const dirs = paths(config);
  const full = path.join(dirs.editados, post, file);
  let s;
  try {
    s = await stat(full);
  } catch {
    return send(res, 404, { ok: false, error: "arquivo não encontrado" });
  }
  if (!s.isFile()) return send(res, 404, { ok: false, error: "não é arquivo" });
  res.writeHead(200, {
    "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    "content-length": s.size,
  });
  createReadStream(full).pipe(res);
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json),
  });
  res.end(json);
}
