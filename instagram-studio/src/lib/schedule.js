// Cronograma: encaixa cada post editado num horário que costuma render mais,
// por formato. Heurística simples e honesta — a Fase 3 (relatórios) vai
// substituir esses horários pelos SEUS números reais de engajamento.

// Melhores janelas por formato (horário local), do mais forte para o mais fraco.
// Base: padrões comuns de perfis lifestyle/estudo BR; ajuste conforme seus dados.
const JANELAS = {
  reel: [19, 12, 21],       // fim de tarde/noite renda bem para Reels
  carrossel: [12, 18, 20],  // almoço e início de noite para conteúdo salvável
  feed: [12, 19],
  story: [8, 12, 18],
};

// Distribui os posts em dias/horários sem empilhar dois no mesmo slot.
export function schedule(plans, config, from = new Date()) {
  const usados = new Set();
  const out = [];

  // Um post por dia, começando amanhã, no melhor horário livre do formato.
  let dia = startOfTomorrow(from);

  for (const plan of plans) {
    const formato = plan.saida === "carrossel" ? "carrossel" : "reel";
    const janelas = JANELAS[formato] || JANELAS.reel;

    let slot = null;
    // procura o primeiro dia/horário livre
    for (let d = 0; d < 30 && !slot; d++) {
      const data = addDays(dia, d);
      for (const hora of janelas) {
        const key = `${ymd(data)}T${hora}`;
        if (!usados.has(key)) {
          usados.add(key);
          slot = atHour(data, hora);
          break;
        }
      }
    }
    if (!slot) slot = atHour(addDays(dia, 30), janelas[0]);

    out.push({
      post: plan.post,
      template: plan.templateId,
      formato,
      quando: formatLocal(slot),
      iso: slot.toISOString(),
    });
    // avança o "cursor" de dia para espalhar os posts
    dia = addDays(startOfDay(slot), 1);
  }

  return out;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfTomorrow(d) {
  return addDays(startOfDay(d), 1);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function atHour(d, h) {
  const x = new Date(d);
  x.setHours(h, 0, 0, 0);
  return x;
}
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
function formatLocal(d) {
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
