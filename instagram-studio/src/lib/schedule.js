// Cronograma: encaixa cada post editado num horário que costuma render mais,
// por formato. A Fase 3 (relatórios) grava relatorios/melhores-horarios.json com
// os SEUS números reais — se existir, ele substitui as janelas-padrão abaixo.

import { readFileSync } from "node:fs";
import path from "node:path";

// Melhores janelas por formato (horário local), do mais forte para o mais fraco.
// Base: padrões comuns de perfis lifestyle/estudo BR; ajuste conforme seus dados.
const JANELAS_PADRAO = {
  reel: [19, 12, 21],       // fim de tarde/noite renda bem para Reels
  carrossel: [12, 18, 20],  // almoço e início de noite para conteúdo salvável
  feed: [12, 19],
  story: [8, 12, 18],
};

// Lê o override da Fase 3, se existir. Formato: { reel:[19,12], carrossel:[...] }.
function loadJanelas(config) {
  try {
    const file = path.join(config.root, "relatorios", "melhores-horarios.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    const janelas = data.janelas || data;
    if (janelas && typeof janelas === "object") {
      return { ...JANELAS_PADRAO, ...janelas, _fonte: "relatorio" };
    }
  } catch {
    // sem override — usa o padrão
  }
  return { ...JANELAS_PADRAO, _fonte: "padrao" };
}

// Distribui os posts em dias/horários sem empilhar dois no mesmo slot.
export function schedule(plans, config, from = new Date()) {
  const timezone = config?.metricool?.timezone || config?.timezone || "America/Sao_Paulo";
  const JANELAS = loadJanelas(config);
  const usados = new Set();
  const out = [];

  // Um post por dia, começando amanhã, no melhor horário livre do formato.
  let dia = startOfTomorrow(from);

  for (const plan of plans) {
    const formato = plan.saida === "carrossel" ? "carrossel" : "reel";
    const janelas = JANELAS[formato] || JANELAS.reel;

    let slot = null;
    let chosenHora = janelas[0];
    // procura o primeiro dia/horário livre
    for (let d = 0; d < 30 && !slot; d++) {
      const data = addDays(dia, d);
      for (const hora of janelas) {
        const key = `${ymd(data)}T${hora}`;
        if (!usados.has(key)) {
          usados.add(key);
          slot = atHour(data, hora);
          chosenHora = hora;
          break;
        }
      }
    }
    if (!slot) slot = atHour(addDays(dia, 30), (chosenHora = janelas[0]));

    out.push({
      post: plan.post,
      template: plan.templateId,
      formato,
      quando: formatLocal(slot),
      // Fonte da verdade para o Metricool: relógio de parede local + timezone.
      // (Independe do fuso do servidor — o horário escolhido é sempre local.)
      dateTimeLocal: `${ymd(slot)}T${pad2(chosenHora)}:00:00`,
      timezone,
      iso: slot.toISOString(),
    });
    // avança o "cursor" de dia para espalhar os posts
    dia = addDays(startOfDay(slot), 1);
  }

  return out;
}

function pad2(n) {
  return String(n).padStart(2, "0");
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
