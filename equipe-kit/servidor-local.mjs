/* Servidor de teste: site estático + /api/equipe com armazenamento em arquivos.
   node servidor-local.mjs <pasta-do-site> [porta]   (senha de teste: EQUIPE_SENHA_TESTE, padrão "teste123") */
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { criarApiEquipe, criarHash } from './equipe-api.mjs';

const pasta = path.resolve(process.argv[2] || '.');
const porta = Number(process.argv[3] || 8899);
const dados = path.join(process.env.TMPDIR || '/tmp', 'helu-equipe-dados-' + porta);
await mkdir(path.join(dados, 'fotos'), { recursive: true });
const etag = v => createHash('sha1').update(JSON.stringify(v)).digest('hex');
const armazem = {
  async ler(k) { try { const v = JSON.parse(await readFile(path.join(dados, k + '.json'), 'utf8')); return { valor: v, etag: etag(v) }; } catch { return null; } },
  async gravar(k, v, { etag: e, novo } = {}) {
    const a = await this.ler(k);
    if (novo && a) return { ok: false };
    if (e && (!a || a.etag !== e)) return { ok: false };
    await writeFile(path.join(dados, k + '.json'), JSON.stringify(v)); return { ok: true, etag: etag(v) };
  }
};
let n = 0;
const fotos = { async gravar(buf, tipo) { const f = `f${++n}.${tipo.split('/')[1]}`; await writeFile(path.join(dados, 'fotos', f), buf); return `/_fotos/${f}`; } };
const api = criarApiEquipe({ armazem, fotos, ambiente: { EQUIPE_SENHA_HASH: await criarHash(process.env.EQUIPE_SENHA_TESTE || 'teste123'), EQUIPE_SEGREDO: 'x' } });
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/api/equipe') {
      const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise(r => { const p = []; req.on('data', c => p.push(c)); req.on('end', () => r(Buffer.concat(p))); });
      const r = await api(new Request('http://x' + req.url, { method: req.method, headers: req.headers, body: corpo }));
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    let f = u.pathname.startsWith('/_fotos/') ? path.join(dados, 'fotos', path.basename(u.pathname)) : path.join(pasta, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
    const b = await readFile(f);
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
  } catch { res.writeHead(404); res.end('nao encontrado'); }
}).listen(porta, () => console.log('http://localhost:' + porta));
