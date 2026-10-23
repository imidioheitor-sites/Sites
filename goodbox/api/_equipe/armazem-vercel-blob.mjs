/* Armazém JSON no Vercel Blob (+ gravação de fotos públicas). Ver equipe-api.mjs. */
import { createHmac, randomBytes } from 'node:crypto';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

export function armazemVercelBlob({ token = process.env.BLOB_READ_WRITE_TOKEN, pasta = 'equipe' } = {}) {
  const sal = createHmac('sha256', String(token || 'local')).update('helu-equipe-kv').digest('hex').slice(0, 24);
  const caminho = chave => `${pasta}/${sal}/${chave}.json`;
  async function lerBruto(chave) {
    const r = await get(caminho(chave), { access: 'public', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return { valor: JSON.parse(await new Response(r.stream).text()), etag: r.blob.etag };
  }
  /* O Blob às vezes demora a mostrar a escrita nova. Só devolvemos "gravado" quando a
     leitura já enxerga o ETag novo; assim a próxima requisição (em outra instância) não lê o valor velho. */
  async function aguardarVisivel(chave, etag) {
    for (let i = 0; i < 12; i++) {
      const atual = await lerBruto(chave).catch(() => null);
      if (atual && atual.etag === etag) return true;
      await new Promise(r => setTimeout(r, 150 + i * 100));
    }
    return false;
  }
  return {
    async ler(chave) {
      try { return await lerBruto(chave); } catch (e) {
        if (/not.?found/i.test(`${e && e.name} ${e && e.message}`)) return null;
        throw e;
      }
    },
    async gravar(chave, valor, { etag, novo } = {}) {
      const base = { access: 'public', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 };
      try {
        const r = await put(caminho(chave), JSON.stringify(valor),
          etag ? { ...base, ifMatch: etag } : novo ? { ...base, allowOverwrite: false } : { ...base, allowOverwrite: true });
        await aguardarVisivel(chave, r.etag);
        return { ok: true, etag: r.etag };
      } catch (e) {
        if (e instanceof BlobPreconditionFailedError) return { ok: false };
        if (novo && /exists/i.test(String(e && e.message))) return { ok: false };
        throw e;
      }
    }
  };
}

export function fotosVercelBlob({ pasta = 'equipe/fotos' } = {}) {
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return {
    async gravar(buffer, tipo) {
      const r = await put(`${pasta}/${Date.now().toString(36)}-${randomBytes(3).toString('hex')}.${ext[tipo]}`, buffer,
        { access: 'public', contentType: tipo, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
      return r.url;
    }
  };
}

/* Autoteste do armazém (grava, relê, confere ETag e conflito). Exposto como GET ?diag=1. */
export async function diagnostico(armazem) {
  const passos = {};
  try {
    const a = await armazem.gravar('diagnostico', { n: 1, t: Date.now() }, {});
    passos.gravar = a.ok;
    const l1 = await armazem.ler('diagnostico');
    passos.reler = !!(l1 && l1.valor.n === 1);
    const b = await armazem.gravar('diagnostico', { n: 2, t: Date.now() }, { etag: l1.etag });
    passos.gravarComEtag = b.ok;
    const c = await armazem.gravar('diagnostico', { n: 3 }, { etag: l1.etag });
    passos.conflitoDetectado = c.ok === false;
    const l2 = await armazem.ler('diagnostico');
    passos.detalhe = { etagL1: l1.etag, etagB: b.etag, etagL2: l2 && l2.etag, n2: l2 && l2.valor.n };
    passos.relerSemCache = !!(l2 && l2.valor.n === 2);
  } catch (e) { passos.erro = String(e && e.message || e).slice(0, 200); }
  passos.ok = !passos.erro && passos.gravar && passos.reler && passos.gravarComEtag && passos.conflitoDetectado && passos.relerSemCache;
  return passos;
}
