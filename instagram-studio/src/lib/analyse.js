// The Media Analiser — separa conteúdo importante do ruído aleatório.
//
// Depois da transcrição/visão, classifica cada trecho como:
//   importante  → tem conteúdo que vale um post
//   ruido       → background, "yapping"/enrolação, clipe sem conteúdo útil
//
// Não cria conteúdo: só filtra e separa, com um motivo. Com Claude, a decisão
// é semântica; sem chave, uma heurística conservadora (só descarta o que
// claramente não tem sinal).

const SYSTEM = `Você é o "Media Analiser" de um criador de conteúdo. Sua função é separar, entre os trechos gravados, o que tem CONTEÚDO que vale um post do que é RUÍDO.
Você NUNCA cria conteúdo. Só classifica.

Para cada arquivo, decida:
- "importante": fala/cena com conteúdo aproveitável (uma ideia, dica, opinião, review, explicação).
- "ruido": background sem fala útil, enrolação/"yapping" sem substância, ou clipe sem conteúdo.

Responda SOMENTE JSON:
{"itens":[{"arquivo":"nome","tipo":"importante"|"ruido","categoria":"ok"|"background"|"yapping"|"sem-conteudo","motivo":"frase curta"}]}
Todo arquivo de entrada deve aparecer exatamente uma vez.`;

export async function analyse(analyzed, claude) {
  let classified;
  if (claude) {
    try {
      classified = await withClaude(analyzed, claude);
    } catch (e) {
      classified = { mode: "heuristic-fallback", error: e.message, map: heuristic(analyzed) };
    }
  } else {
    classified = { mode: "heuristic", map: heuristic(analyzed) };
  }

  const keep = [];
  const noise = [];
  for (const a of analyzed) {
    const c = classified.map.get(a.item.name) || { tipo: "importante", categoria: "ok", motivo: "" };
    a.classificacao = c;
    (c.tipo === "ruido" ? noise : keep).push(a);
  }
  return { mode: classified.mode, error: classified.error, keep, noise };
}

async function withClaude(analyzed, claude) {
  const payload = analyzed.map((a) => ({
    arquivo: a.item.name,
    tipo: a.item.kind,
    transcricao: (a.transcript || "").slice(0, 800),
    cena: (a.scene || "").slice(0, 300),
  }));
  const data = await claude.json(SYSTEM, "Trechos para classificar:\n" + JSON.stringify(payload, null, 2));
  const map = new Map();
  for (const it of data.itens || []) {
    map.set(it.arquivo, {
      tipo: it.tipo === "ruido" ? "ruido" : "importante",
      categoria: it.categoria || "ok",
      motivo: it.motivo || "",
    });
  }
  return { mode: "claude", map };
}

// Heurística conservadora: sem IA, o filtro NÃO adivinha "yapping". Ele só
// descarta um vídeo/áudio quando há certeza de ausência de conteúdo — ou seja,
// transcrição REAL e vazia (clipe mudo). Um placeholder ("[SEM TRANSCRIÇÃO…]")
// significa "não sei" → mantém, para não filtrar tudo quando não há chave.
// Imagens nunca viram ruído por falta de transcrição (o valor delas é visual).
function heuristic(analyzed) {
  const map = new Map();
  for (const a of analyzed) {
    const t = (a.transcript || "").trim();
    const placeholder = t.startsWith("["); // desconhecido (sem transcrição/erro)
    const falaRealVazia = !placeholder && t === "";
    const semCena = !a.scene || a.scene.trim() === "" || a.scene.trim().startsWith("[");
    const ehVozOuVideo = a.item.kind === "audio" || a.item.kind === "video";
    if (ehVozOuVideo && falaRealVazia && semCena) {
      map.set(a.item.name, { tipo: "ruido", categoria: "sem-conteudo", motivo: "clipe sem fala nem cena" });
    } else {
      map.set(a.item.name, { tipo: "importante", categoria: "ok", motivo: "" });
    }
  }
  return map;
}
