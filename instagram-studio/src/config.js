// Validação de ambiente para o modo produção (live).
//
// Lê e valida as variáveis do .env, com mensagens claras do que falta. Assim o
// run-ingest.js falha cedo e explicando, em vez de estourar lá no meio.

/**
 * @param {{ needAnalysisKeys?: boolean }} [opts]
 *   needAnalysisKeys: exige as chaves de transcrição/visão (Fase 1 completa).
 *   Passe false para um simples "--check" de conectividade com o Drive.
 */
export function loadConfig(opts = {}) {
  const needAnalysisKeys = opts.needAnalysisKeys !== false;
  const missing = [];
  const need = (k) => {
    const v = process.env[k];
    if (!v) missing.push(k);
    return v;
  };

  const drive = {
    inboxFolderId: need('DRIVE_INBOX_FOLDER_ID'),
    agrupadosFolderId: need('DRIVE_AGRUPADOS_FOLDER_ID'),
    rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID || '',
  };
  need('GOOGLE_APPLICATION_CREDENTIALS');

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (needAnalysisKeys) {
    if (!hasAnthropic) missing.push('ANTHROPIC_API_KEY');
    if (!hasOpenAI) missing.push('OPENAI_API_KEY');
  }

  if (missing.length) {
    throw new Error(
      `Faltam variáveis no .env:\n  - ${missing.join('\n  - ')}\n` +
        `Copie .env.example para .env e preencha. (Chaves são segredos — nunca vão pro repo.)`,
    );
  }

  // Usa o Claude p/ agrupar se houver chave, salvo override explícito.
  const useClaude = process.env.INGEST_USE_CLAUDE
    ? process.env.INGEST_USE_CLAUDE === 'true'
    : hasAnthropic;

  return { drive, useClaude, hasAnthropic, hasOpenAI };
}
