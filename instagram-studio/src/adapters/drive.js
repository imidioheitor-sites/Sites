// Adaptador do Google Drive (etapas 01, 03, 04).
//
// Requer o pacote `googleapis` e credenciais de service account
// (GOOGLE_APPLICATION_CREDENTIALS) com acesso à pasta do estúdio.
// Import dinâmico para o demo rodar sem instalar nada.
//
// Contrato mínimo que o pipeline usa:
//   listInbox()                       -> DriveFile[]
//   downloadToTmp(fileId, name)       -> caminho local
//   ensureFolder(name, parentId)      -> folderId
//   writeTextFile(name, text, parent) -> fileId
//   moveFile(fileId, newParentId)     -> void

/**
 * @typedef {Object} DriveFile
 * @property {string} id
 * @property {string} name
 * @property {string} mimeType
 * @property {string} createdTime  ISO
 */

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class DriveClient {
  /** @param {{ inboxFolderId: string, rootFolderId: string }} cfg */
  constructor(cfg) {
    this.cfg = cfg;
    this._drive = null;
  }

  async _client() {
    if (this._drive) return this._drive;
    const { google } = await import('googleapis').catch(() => {
      throw new Error('Pacote "googleapis" não instalado — rode `npm i googleapis` para o modo live.');
    });
    const auth = new google.auth.GoogleAuth({ scopes: SCOPES }); // usa GOOGLE_APPLICATION_CREDENTIALS
    this._drive = google.drive({ version: 'v3', auth: await auth.getClient() });
    return this._drive;
  }

  /** @returns {Promise<DriveFile[]>} arquivos de mídia na /00_inbox */
  async listInbox() {
    const drive = await this._client();
    const q = [
      `'${this.cfg.inboxFolderId}' in parents`,
      'trashed = false',
      "(mimeType contains 'video/' or mimeType contains 'image/')",
    ].join(' and ');
    const res = await drive.files.list({
      q,
      fields: 'files(id,name,mimeType,createdTime)',
      orderBy: 'createdTime',
      pageSize: 200,
    });
    return res.data.files ?? [];
  }

  /** Baixa um arquivo para um caminho temporário e retorna o caminho. */
  async downloadToTmp(fileId, name) {
    const os = await import('node:os');
    const path = await import('node:path');
    const fs = await import('node:fs');
    const drive = await this._client();
    const dest = path.join(os.tmpdir(), `igstudio_${fileId}_${name}`);
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const w = fs.createWriteStream(dest);
      res.data.on('end', resolve).on('error', reject).pipe(w);
    });
    return dest;
  }

  /** Cria (ou reaproveita) uma subpasta e retorna o id. */
  async ensureFolder(name, parentId) {
    const drive = await this._client();
    const found = await drive.files.list({
      q: `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
    });
    if (found.data.files?.length) return found.data.files[0].id;
    const created = await drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
      fields: 'id',
    });
    return created.data.id;
  }

  /** Escreve um arquivo de texto (ex.: _ideia.md) dentro de uma pasta. */
  async writeTextFile(name, text, parentId) {
    const drive = await this._client();
    const res = await drive.files.create({
      requestBody: { name, parents: [parentId] },
      media: { mimeType: 'text/markdown', body: text },
      fields: 'id',
    });
    return res.data.id;
  }

  /** Move um arquivo para outra pasta. */
  async moveFile(fileId, newParentId) {
    const drive = await this._client();
    const cur = await drive.files.get({ fileId, fields: 'parents' });
    const prev = (cur.data.parents ?? []).join(',');
    await drive.files.update({ fileId, addParents: newParentId, removeParents: prev, fields: 'id' });
  }

  /** Lista subpastas de uma pasta. */
  async listSubfolders(parentId) {
    const drive = await this._client();
    const res = await drive.files.list({
      q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: 200,
    });
    return res.data.files ?? [];
  }

  /** Lista os arquivos (não-pasta) de uma pasta. */
  async listChildren(parentId) {
    const drive = await this._client();
    const res = await drive.files.list({
      q: `'${parentId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id,name,mimeType)',
      pageSize: 200,
    });
    return res.data.files ?? [];
  }

  /** Lê o conteúdo de texto de um arquivo. */
  async readText(fileId) {
    const drive = await this._client();
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
  }

  /**
   * Estado de aprovação: para cada subpasta de 02_aprovados, detecta a legenda
   * (legenda.txt), a capa (capa.*) e os arquivos de mídia.
   * @param {string} approvedFolderId
   * @returns {Promise<{folderName:string,folderId:string,caption:string,hasCover:boolean,mediaFiles:{id:string,name:string,mimeType:string}[]}[]>}
   */
  async listApproved(approvedFolderId) {
    const folders = await this.listSubfolders(approvedFolderId);
    const out = [];
    for (const f of folders) {
      const files = await this.listChildren(f.id);
      const legenda = files.find((x) => /^legenda\.txt$/i.test(x.name));
      const caption = legenda ? (await this.readText(legenda.id)).trim() : '';
      const hasCover = files.some((x) => /^capa\.(jpg|jpeg|png)$/i.test(x.name));
      const mediaFiles = files.filter((x) => /^(video|image)\//.test(x.mimeType));
      out.push({ folderName: f.name, folderId: f.id, caption, hasCover, mediaFiles });
    }
    return out;
  }
}
