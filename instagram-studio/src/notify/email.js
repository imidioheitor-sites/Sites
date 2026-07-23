// Entrega das sugestões. Nesta fase, o "email" é escrito em disco como um
// resumo Markdown na raiz do estúdio (_sugestoes.md). Quando você plugar SMTP
// ou um MCP de Gmail no n8n, é só trocar esta função.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "../lib/log.js";

export async function deliverSuggestions(config, result) {
  const markdown = renderSuggestions(result);
  const out = path.join(config.root, "_sugestoes.md");
  await writeFile(out, markdown, "utf8");
  log.ok("Resumo salvo em " + path.relative(config._projectDir, out));

  if (config?.email?.enabled) {
    // O envio real por email é responsabilidade do n8n (nó Gmail), que lê o
    // markdown devolvido pelo serviço HTTP. Aqui apenas registramos a intenção.
    log.info(
      `(email ligado no config → o nó Gmail do n8n envia para ${config.email.to || "voce@exemplo.com"})`
    );
  }
  return { path: out, markdown };
}

// Assunto curto para o email, com base no resultado.
export function renderSubject(result) {
  const n = result.groups.length;
  if (n === 0) return "Instagram-Studio — nada novo na inbox";
  const nomes = [...new Set(result.groups.map((g) => g.template.nome))].slice(0, 3).join(", ");
  return `Instagram-Studio — ${n} post(s) prontos: ${nomes}`;
}

export function renderSuggestions(result) {
  const when = new Date().toLocaleString("pt-BR");
  const lines = [];
  lines.push(`# Sugestões de posts — ${when}`);
  lines.push("");
  lines.push(
    `Modo de agrupamento: **${result.mode}**. ${result.groups.length} post(s) montado(s). ` +
      `A IA organizou e sugeriu — a criação é sua.`
  );
  lines.push("");

  for (const g of result.groups) {
    lines.push(`## ${g.template.nome} — \`${g.folder}\``);
    lines.push(`- **Ideia:** ${g.ideia}`);
    lines.push(`- **O robô faz:** ${g.template.robot}`);
    lines.push(`- **Você entrega:** ${g.pedido || g.template.you}`);
    lines.push(`- **Arquivos:** ${g.items.map((i) => i.name).join(", ")}`);
    lines.push("");
  }

  lines.push("---");
  lines.push(
    "_Gerado pela Fase 1 do Automatizador de Instagram. Aprove movendo a pasta para `02_aprovados/` com a capa e a legenda._"
  );
  return lines.join("\n") + "\n";
}
