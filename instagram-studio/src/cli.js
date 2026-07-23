#!/usr/bin/env node
// CLI da Fase 1 — Automatizador de Instagram.
//
//   node src/cli.js scaffold        cria o esquema de pastas
//   node src/cli.js ingest          organiza a inbox (mídias ficam na inbox)
//   node src/cli.js ingest --move   organiza e move as mídias para os posts
//   node src/cli.js edit            edita os posts aprovados por template
//   node src/cli.js status          mostra o estado das pastas
//   node src/cli.js serve           sobe o serviço HTTP para o n8n chamar

import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { scaffold, paths, FOLDERS } from "./scaffold.js";
import { ingest } from "./pipeline.js";
import { edit } from "./edit.js";
import { startServer } from "./server.js";
import { log } from "./lib/log.js";

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const config = await loadConfig();

  switch (cmd) {
    case "scaffold": {
      log.title("Criando o esquema de pastas Instagram-Studio");
      const root = await scaffold(config);
      log.info(`\nRaiz: ${root}`);
      log.info(`Jogue suas mídias em ${path.join(root, FOLDERS.inbox)} e rode: node src/cli.js ingest`);
      break;
    }

    case "ingest": {
      // ingest depende do scaffold; garante que as pastas existem.
      await scaffold(config);
      log.title("Ingestão & agrupamento");
      const move = rest.includes("--move");
      await ingest(config, { move });
      break;
    }

    case "edit": {
      await scaffold(config);
      log.title("Edição por template & cronograma");
      const dryRun = rest.includes("--dry-run");
      const force = rest.includes("--force");
      await edit(config, { dryRun, force });
      break;
    }

    case "serve": {
      // O serviço lê a config por requisição; só garantimos as pastas na subida.
      await scaffold(config);
      startServer();
      break;
    }

    case "status": {
      log.title("Estado do estúdio");
      const dirs = paths(config);
      for (const [key, name] of Object.entries(FOLDERS)) {
        const count = await countEntries(dirs[key]);
        log.bot(`${name.padEnd(14)} ${count}`);
      }
      break;
    }

    default:
      printHelp();
      process.exitCode = cmd ? 1 : 0;
  }
}

async function countEntries(dir) {
  try {
    const entries = await readdir(dir);
    const visible = entries.filter((e) => !e.startsWith(".") && e !== "LEIA-ME.md");
    return `${visible.length} item(ns)`;
  } catch {
    return "(não existe ainda)";
  }
}

function printHelp() {
  console.log(`
Automatizador de Instagram — Fase 1 (ingestão & agrupamento)

Uso:
  node src/cli.js scaffold        cria o esquema de pastas
  node src/cli.js ingest          organiza a inbox (não move os originais)
  node src/cli.js ingest --move   organiza e move as mídias para cada post
  node src/cli.js edit            edita os posts aprovados por template
  node src/cli.js edit --dry-run  só gera o plano, sem renderizar
  node src/cli.js status          mostra quantos itens há em cada pasta
  node src/cli.js serve           sobe o serviço HTTP para o n8n chamar

Configuração:
  copie config.example.json -> config.json e ajuste, ou use variáveis:
  STUDIO_ROOT, ANTHROPIC_API_KEY, OPENAI_API_KEY, STUDIO_PORT, STUDIO_TOKEN
`);
}

main().catch((e) => {
  log.err(e.stack || e.message);
  process.exitCode = 1;
});
