// Persistência leve (JSON em disco) que fecha o loop entre as fases.
//
// Ao ingerir (Fase 1) registramos folderName → quadroId.
// Ao publicar (Fase 2) registramos folderName → mediaId (o id da mídia no Instagram).
// Assim o relatório (Fase 3), que recebe métricas por mediaId, consegue voltar ao
// quadro certo — sem isso os Insights não sabem a qual quadro cada post pertence.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class Store {
  /** @param {string} path caminho do arquivo JSON */
  constructor(path) {
    this.path = path;
    /** @type {{ posts: Record<string, {folderName:string, quadroId?:string, mediaId?:string}> }} */
    this.data = { posts: {} };
  }

  load() {
    try {
      this.data = JSON.parse(readFileSync(this.path, 'utf8'));
      if (!this.data.posts) this.data.posts = {};
    } catch {
      /* arquivo ainda não existe — começa vazio */
    }
    return this;
  }

  save() {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
    return this;
  }

  /** @param {string} folderName @param {string} quadroId */
  recordIngest(folderName, quadroId) {
    const p = (this.data.posts[folderName] ??= { folderName });
    p.quadroId = quadroId;
    return this;
  }

  /** @param {string} folderName @param {string} mediaId */
  recordPublish(folderName, mediaId) {
    const p = (this.data.posts[folderName] ??= { folderName });
    p.mediaId = mediaId;
    return this;
  }

  /** @param {string} mediaId @returns {string|undefined} */
  quadroForMedia(mediaId) {
    return Object.values(this.data.posts).find((p) => p.mediaId === mediaId)?.quadroId;
  }

  /** @param {string} folderName @returns {string|undefined} */
  quadroForFolder(folderName) {
    return this.data.posts[folderName]?.quadroId;
  }
}
