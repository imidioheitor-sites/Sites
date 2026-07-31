// Hospedagem de mídia (Fase 2/4) — resolve URLs públicas para o material editado.
//
// Metricool e a Graph API postam a partir de URLs de mídia acessíveis sem login.
// Em vez de exigir um bucket novo, reaproveitamos o Drive: deixamos o arquivo
// "qualquer pessoa com o link pode ver" e devolvemos a URL de download direto.
//
// Isso NÃO expõe suas pastas — só o arquivo específico que vai ser postado (que,
// afinal, vira público no Instagram de qualquer forma). Nada aqui gera conteúdo.

/**
 * URL de download direto de um arquivo público do Drive.
 * @param {string} fileId
 */
export function directDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/** Contrato mínimo: publicUrl(fileId) -> Promise<string>. */
export class DriveMediaHost {
  /** @param {import('./drive.js').DriveClient} drive */
  constructor(drive) {
    this.drive = drive;
  }

  /** Torna o arquivo acessível por link e retorna a URL direta. */
  async publicUrl(fileId) {
    await this.drive.makePublic(fileId);
    return directDownloadUrl(fileId);
  }
}

// NOTA: para vídeos grandes, o link uc?export=download do Drive pode cair na
// tela de aviso de antivírus do Google. Se isso atrapalhar o Metricool/Graph,
// troque este host por um bucket (S3/GCS/R2) — o contrato publicUrl() é o mesmo.
