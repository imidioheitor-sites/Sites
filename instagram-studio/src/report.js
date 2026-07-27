// Fase 3 — relatórios de performance.
// Lê os SEUS números reais (relatorios/insights.json), calcula os melhores
// horários, e o Claude analisa o que repetir e o que ajustar. Grava:
//   relatorios/relatorio.md            (corpo do email)
//   relatorios/melhores-horarios.json  (volta a alimentar o cronograma da Fase 2)
//
// A IA analisa — nunca cria conteúdo. Sem chave, o relatório é heurístico.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { log } from "./lib/log.js";
import { getClaude } from "./lib/claude.js";

const SYSTEM = `Você é analista de conteúdo de Instagram. Você NUNCA cria conteúdo (legenda, roteiro, imagem).
Você analisa números reais de posts e recomenda, em português, o que REPETIR e o que AJUSTAR.
Baseie-se só nos dados fornecidos; não invente métricas. Responda SOMENTE JSON:
{"resumo":"1-2 frases","funciona":["..."],"melhorar":["..."],"ganchos":"o que os posts de melhor retenção têm em comum, se der para inferir","recomendacoes":["ações concretas para a próxima semana"]}`;

export async function report(config, opts = {}) {
  const relDir = path.join(config.root, "relatorios");
  await mkdir(relDir, { recursive: true });

  log.step("01", "Lendo seus números (insights.json)");
  const insights = await readJson(path.join(relDir, "insights.json"));
  if (!Array.isArray(insights) || insights.length === 0) {
    log.warn(
      `Sem relatorios/insights.json (ou vazio). Cole seus números lá — veja insights.example.json.`
    );
    return { count: 0, subject: "", summary: "" };
  }
  log.bot(`${insights.length} post(s) com métricas.`);

  // Agregados objetivos (independem de IA).
  const ranked = rankPosts(insights);
  const janelas = bestWindows(insights);

  log.step("02", "Analisando");
  const claude = !opts.dryRun ? await getClaude(config) : null;
  let analise;
  if (claude) {
    try {
      analise = await claude.json(
        SYSTEM,
        "Métricas dos posts:\n" +
          JSON.stringify(insights, null, 2) +
          "\n\nAgregados calculados:\n" +
          JSON.stringify({ topPosts: ranked.slice(0, 3), melhoresHorarios: janelas }, null, 2)
      );
      log.bot(`Análise do Claude (${claude.model}).`);
    } catch (e) {
      log.warn(`IA falhou (${e.message}); relatório heurístico.`);
    }
  }
  if (!analise) analise = heuristicAnalysis(ranked, janelas);

  log.step("03", "Gravando relatório e melhores horários");
  const md = renderReportMarkdown({ insights, ranked, janelas, analise });
  await writeFile(path.join(relDir, "relatorio.md"), md, "utf8");
  await writeFile(
    path.join(relDir, "melhores-horarios.json"),
    JSON.stringify({ atualizadoEm: new Date().toISOString(), fonte: "insights", janelas }, null, 2),
    "utf8"
  );
  log.you("relatorios/melhores-horarios.json atualizado — o próximo `edit` já usa esses horários.");

  const result = {
    count: insights.length,
    janelas,
    analise,
    subject: `Instagram-Studio — relatório de ${insights.length} post(s)`,
    summary: md,
  };
  return result;
}

// ---- métricas ----------------------------------------------------------

// Peso maior para salvamento e compartilhamento (sinais fortes de valor).
function score(i) {
  const raw =
    (i.likes || 0) + 2 * (i.comments || 0) + 3 * (i.saves || 0) + 2 * (i.shares || 0);
  return i.reach > 0 ? raw / i.reach : raw; // taxa de engajamento quando há alcance
}

function rankPosts(insights) {
  return insights
    .map((i) => ({ post: i.post, formato: i.formato, score: round(score(i)), saves: i.saves || 0, views: i.views || 0, retentionPct: i.retentionPct ?? null }))
    .sort((a, b) => b.score - a.score);
}

// Melhores horários por formato, a partir dos dados reais.
function bestWindows(insights) {
  const acc = {}; // formato -> hora -> {sum,count}
  for (const i of insights) {
    const fmt = i.formato === "carrossel" ? "carrossel" : "reel";
    const hora = hourOf(i.publishedAt);
    if (hora == null) continue;
    acc[fmt] ??= {};
    acc[fmt][hora] ??= { sum: 0, count: 0 };
    acc[fmt][hora].sum += score(i);
    acc[fmt][hora].count += 1;
  }
  const out = {};
  for (const [fmt, horas] of Object.entries(acc)) {
    const rankedHoras = Object.entries(horas)
      .map(([h, v]) => ({ hora: Number(h), media: v.sum / v.count }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 3)
      .map((x) => x.hora);
    if (rankedHoras.length) out[fmt] = rankedHoras;
  }
  return out;
}

function heuristicAnalysis(ranked, janelas) {
  const top = ranked[0];
  const funciona = [];
  if (top) funciona.push(`Seu melhor post foi ${top.post} (formato ${top.formato}).`);
  const bySaves = [...ranked].sort((a, b) => b.saves - a.saves)[0];
  if (bySaves && bySaves.saves) funciona.push(`Mais salvo: ${bySaves.post} (${bySaves.saves} salvamentos).`);
  const horarioStr = Object.entries(janelas)
    .map(([f, hs]) => `${f}: ${hs.map((h) => h + "h").join(", ")}`)
    .join(" · ");
  return {
    resumo: `Análise heurística de ${ranked.length} post(s). Configure ANTHROPIC_API_KEY para uma leitura mais rica.`,
    funciona,
    melhorar: ["Sem IA: compare os posts de menor score e teste ganchos diferentes nos primeiros 3s."],
    ganchos: "",
    recomendacoes: [horarioStr ? `Priorize os horários: ${horarioStr}.` : "Junte mais dados para achar padrões de horário."],
  };
}

// ---- render ------------------------------------------------------------

function renderReportMarkdown({ insights, ranked, janelas, analise }) {
  const when = new Date().toLocaleString("pt-BR");
  const L = [];
  L.push(`# Relatório de performance — ${when}`);
  L.push("");
  L.push(`Base: ${insights.length} post(s). ${analise.resumo || ""}`);
  L.push("");
  L.push("## O que está funcionando");
  for (const f of analise.funciona || []) L.push(`- ${f}`);
  L.push("");
  L.push("## O que ajustar");
  for (const m of analise.melhorar || []) L.push(`- ${m}`);
  if (analise.ganchos) {
    L.push("");
    L.push("## Ganchos (retenção)");
    L.push(analise.ganchos);
  }
  L.push("");
  L.push("## Recomendações para a próxima semana");
  for (const r of analise.recomendacoes || []) L.push(`- ${r}`);
  L.push("");
  L.push("## Ranking dos posts (por engajamento)");
  ranked.slice(0, 10).forEach((r, i) => {
    L.push(`${i + 1}. \`${r.post}\` — score ${r.score}${r.saves ? `, ${r.saves} salv.` : ""}${r.retentionPct != null ? `, ret. ${r.retentionPct}%` : ""}`);
  });
  L.push("");
  L.push("## Melhores horários (aplicados no cronograma)");
  for (const [f, hs] of Object.entries(janelas)) L.push(`- **${f}:** ${hs.map((h) => h + "h").join(", ")}`);
  L.push("");
  L.push("---");
  L.push("_A IA analisou seus números; a criação continua sua. Estes horários já alimentam o próximo `edit`._");
  return L.join("\n") + "\n";
}

// ---- utils -------------------------------------------------------------

function hourOf(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.getHours();
}
function round(n) {
  return Math.round(n * 1000) / 1000;
}
async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}
