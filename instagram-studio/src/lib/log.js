// Log simples e colorido, sem dependências.

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  gold: "\x1b[33m",
  teal: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

const on = process.stdout.isTTY;
const paint = (c, s) => (on ? c + s + C.reset : s);

export const log = {
  step: (n, msg) => console.log(`${paint(C.gold, `[${n}]`)} ${msg}`),
  bot: (msg) => console.log(`  ${paint(C.teal, "▸")} ${msg}`),
  you: (msg) => console.log(`  ${paint(C.gold, "◆")} ${msg}`),
  ok: (msg) => console.log(`  ${paint(C.green, "✓")} ${msg}`),
  warn: (msg) => console.log(`  ${paint(C.gold, "!")} ${msg}`),
  err: (msg) => console.error(`  ${paint(C.red, "✗")} ${msg}`),
  info: (msg) => console.log(paint(C.dim, msg)),
  title: (msg) => console.log("\n" + paint(C.bold, msg)),
};
