/* ============================================================
   HELU · API da aba de equipe (kit reutilizável para sites estáticos)

   Uma função da Vercel + Vercel Blob. Sem login da Vercel, sem banco.
     GET  ?a=catalogo        -> { ok, data, rev }            público
     POST ?a=login           { senha } -> { ok, token }
     PUT  ?a=catalogo        { data, rev } (Bearer)          grava (rev evita sobrescrever outro aparelho)
     POST ?a=foto            corpo = imagem (Bearer)         -> { ok, url }
     POST ?a=senha           { nova } (Bearer)               troca a senha

   Senha: variável EQUIPE_SENHA_HASH (scrypt, nunca texto puro; veja gerar-hash.mjs)
   como senha inicial; depois de trocada pelo painel, vale a gravada no Blob.
   Token: HMAC com validade de 12 h, amarrado ao hash da senha (trocar a senha
   desloga todo mundo).
   ============================================================ */

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const VALIDADE_MS = 12 * 3600 * 1000;
const MAX_FOTO = 4 * 1024 * 1024;
const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const scryptP = (s, sal) => new Promise((ok, no) => scrypt(s, sal, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? no(e) : ok(k))));

export async function criarHash(senha) {
  const sal = randomBytes(16).toString('hex');
  return `scrypt$${sal}$${(await scryptP(senha, sal)).toString('hex')}`;
}
async function conferirHash(senha, hash) {
  const [t, sal, h] = String(hash).split('$');
  if (t !== 'scrypt' || !sal || !h) return false;
  const a = await scryptP(senha, sal), b = Buffer.from(h, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

const json = (dados, status = 200) => new Response(JSON.stringify(dados), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const erro = (status, mensagem, extra) => json({ ok: false, erro: mensagem, ...extra }, status);
const espera = ms => new Promise(r => setTimeout(r, ms));

/* tentativas erradas por IP (best-effort, vive na instância) */
const falhas = new Map();
const bloqueado = ip => { const f = falhas.get(ip); return !!f && Date.now() - f.t < 300000 && f.n >= 10; };
const falhou = ip => { const f = falhas.get(ip); falhas.set(ip, !f || Date.now() - f.t >= 300000 ? { t: Date.now(), n: 1 } : { t: f.t, n: f.n + 1 }); if (falhas.size > 500) falhas.clear(); };

/* armazem: { ler(chave) -> {valor, etag}|null, gravar(chave, valor, {etag}) -> {ok, etag} }
   fotos:   { gravar(buffer, tipo) -> url } */
export function criarApiEquipe({ armazem, fotos, ambiente = process.env }) {
  async function hashAtivo() {
    const reg = await armazem.ler('auth');
    if (reg && reg.valor && reg.valor.hash) return reg.valor.hash;
    return ambiente.EQUIPE_SENHA_HASH || '';
  }
  const chaveToken = hash => createHmac('sha256', String(ambiente.EQUIPE_SEGREDO || '') + hash).update('helu-token').digest();
  const emitir = hash => {
    const corpo = Buffer.from(JSON.stringify({ exp: Date.now() + VALIDADE_MS })).toString('base64url');
    return `${corpo}.${createHmac('sha256', chaveToken(hash)).update(corpo).digest('base64url')}`;
  };
  async function autorizado(req) {
    const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') || '');
    if (!m) return false;
    const [corpo, sig] = m[1].split('.');
    const hash = await hashAtivo();
    if (!corpo || !sig || !hash) return false;
    const esperado = createHmac('sha256', chaveToken(hash)).update(corpo).digest('base64url');
    if (sig.length !== esperado.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))) return false;
    try { return JSON.parse(Buffer.from(corpo, 'base64url').toString()).exp > Date.now(); } catch { return false; }
  }

  return async function tratar(req) {
    const url = new URL(req.url);
    const a = url.searchParams.get('a') || 'catalogo';
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';
    try {
      if (a === 'catalogo' && req.method === 'GET') {
        const reg = await armazem.ler('catalogo');
        return json({ ok: true, data: reg ? reg.valor.data : null, rev: reg ? reg.valor.rev : 0 });
      }
      if (a === 'login' && req.method === 'POST') {
        if (bloqueado(ip)) return erro(429, 'Muitas tentativas. Aguarde alguns minutos.');
        const { senha } = await req.json().catch(() => ({}));
        const hash = await hashAtivo();
        if (!hash) return erro(503, 'Senha da equipe ainda não configurada.');
        if (!senha || !(await conferirHash(String(senha), hash))) { falhou(ip); await espera(700); return erro(401, 'Senha incorreta.'); }
        return json({ ok: true, token: emitir(hash) });
      }
      if (!(await autorizado(req))) return erro(401, 'Entre com a senha da equipe.');

      if (a === 'catalogo' && req.method === 'PUT') {
        const corpo = await req.json().catch(() => null);
        if (!corpo || corpo.data == null) return erro(400, 'Catálogo vazio.');
        const atual = await armazem.ler('catalogo');
        const revAtual = atual ? atual.valor.rev : 0;
        if (atual && Number(corpo.rev) !== revAtual) return erro(409, 'Outro aparelho salvou antes. Recarregue o painel.', { rev: revAtual, conflito: true });
        const r = await armazem.gravar('catalogo', { data: corpo.data, rev: revAtual + 1, em: new Date().toISOString() }, atual ? { etag: atual.etag } : { novo: true });
        if (!r.ok) return erro(409, 'Outro aparelho salvou ao mesmo tempo. Tente de novo.', { conflito: true });
        return json({ ok: true, rev: revAtual + 1 });
      }
      if (a === 'foto' && req.method === 'POST') {
        const tipo = (req.headers.get('content-type') || '').split(';')[0].trim();
        if (!TIPOS[tipo]) return erro(415, 'Envie uma foto JPG, PNG ou WebP.');
        const buf = Buffer.from(await req.arrayBuffer());
        if (!buf.length) return erro(400, 'Foto vazia.');
        if (buf.length > MAX_FOTO) return erro(413, 'Foto grande demais (limite 4 MB).');
        return json({ ok: true, url: await fotos.gravar(buf, tipo) });
      }
      if (a === 'senha' && req.method === 'POST') {
        const { nova } = await req.json().catch(() => ({}));
        if (!nova || String(nova).length < 6) return erro(400, 'A nova senha precisa ter ao menos 6 caracteres.');
        const atual = await armazem.ler('auth');
        await armazem.gravar('auth', { hash: await criarHash(String(nova)), em: new Date().toISOString() }, atual ? { etag: atual.etag } : {});
        const hash = await hashAtivo();
        return json({ ok: true, token: emitir(hash) });
      }
      return erro(404, 'Rota não encontrada.');
    } catch (e) {
      console.error('[equipe] falha', e);
      return erro(500, 'Falha no servidor. Tente de novo.');
    }
  };
}
