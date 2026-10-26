// Agrupamento: junta o material solto em "posts completos" e escolhe o template.
// Com IA: o Claude raciocina sobre transcrição + cena e agrupa.
// Sem IA: heurística por proximidade de tempo + gatilhos de template.

import { TEMPLATES, templateById, guessTemplate } from "./templates.js";

// Janela para o agrupamento heurístico: mídias gravadas com menos de N minutos
// de diferença provavelmente pertencem ao mesmo post.
const GAP_MINUTES = 20;

const SYSTEM = `Você organiza o material bruto de um criador de conteúdo em "posts completos" para Instagram.
Você NUNCA cria conteúdo: não escreve legendas, roteiros ou textos finais. Você só agrupa, classifica e sugere uma ideia curta de template.

Templates disponíveis (use exatamente estes id):
${TEMPLATES.map((t) => `- ${t.id}: ${t.nome} — ${t.robot}`).join("\n")}

Responda SOMENTE com JSON no formato:
{"grupos":[{"slug":"kebab-curto","templateId":"<id>","arquivos":["nome1.mp4"],"ideia":"1 frase do que o post parece ser","pedido":"o que você precisa que o criador grave/escreva"}]}
Cada arquivo deve aparecer em exatamente um grupo.`;

export async function groupMedia(analyzed, claude) {
  if (claude) {
    try {
      return await groupWithClaude(analyzed, claude);
    } catch (e) {
      // Se a IA falhar, não perde o trabalho: cai na heurística.
      return { mode: "heuristic-fallback", error: e.message, groups: heuristicGroups(analyzed) };
    }
  }
  return { mode: "heuristic", groups: heuristicGroups(analyzed) };
}

async function groupWithClaude(analyzed, claude) {
  const payload = analyzed.map((a) => ({
    arquivo: a.item.name,
    tipo: a.item.kind,
    gravado_em: a.item.capturedAt,
    transcricao: a.transcript.slice(0, 800),
    cena: a.scene.slice(0, 300),
  }));

  const data = await claude.json(
    SYSTEM,
    "Material bruto para organizar:\n" + JSON.stringify(payload, null, 2)
  );

  const byName = new Map(analyzed.map((a) => [a.item.name, a]));
  const groups = (data.grupos || []).map((g) => ({
    slug: sanitizeSlug(g.slug),
    template: templateById(g.templateId) || guessTemplate(g.ideia || ""),
    items: (g.arquivos || []).map((n) => byName.get(n)).filter(Boolean).map((a) => a.item),
    ideia: g.ideia || "",
    pedido: g.pedido || "",
  }));
  return { mode: "claude", groups: groups.filter((g) => g.items.length) };
}

function heuristicGroups(analyzed) {
  const groups = [];
  let current = null;
  let lastTime = null;

  for (const a of analyzed) {
    const t = new Date(a.item.capturedAt).getTime();
    const gap = lastTime === null ? Infinity : (t - lastTime) / 60000;
    if (!current || gap > GAP_MINUTES) {
      current = { members: [] };
      groups.push(current);
    }
    current.members.push(a);
    lastTime = t;
  }

  return groups.map((g) => {
    const text = g.members
      .map((m) => `${m.item.name} ${m.transcript} ${m.scene}`)
      .join(" ");
    const template = guessTemplate(text);
    return {
      slug: sanitizeSlug(template.id),
      template,
      items: g.members.map((m) => m.item),
      ideia: `Parece um "${template.nome}".`,
      pedido: template.you,
    };
  });
}

function sanitizeSlug(s) {
  return (s || "post")
    .toLowerCase()
    .normalize("NFD")
    // remove marcas de acento combinantes (U+0300–U+036F)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "post";
}
