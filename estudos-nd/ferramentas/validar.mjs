// Confere os JSON de dados/ antes de publicar.
// Uso (na pasta estudos-nd):  node ferramentas/validar.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const erros = [], avisos = [];
const ler = f => { try { return JSON.parse(readFileSync(join(root, f), 'utf8')); } catch (e) { erros.push(`${f}: JSON inválido (${e.message})`); return null; } };
const data = /^\d{4}-\d{2}-\d{2}$/, hora = /^\d{2}:\d{2}$/, slugOk = /^[a-z0-9-]+$/;

// fotos: ficam na Vercel (dados/imagens.json) ou no repo (assets/)
const fotos = new Set();
try { const im = JSON.parse(readFileSync(join(root, 'dados/imagens.json'), 'utf8'));
  (im.imagens || []).forEach((x, i) => {
    if (!x.arquivo || !/^[0-9a-f]{40}$/.test(x.sha || '') || !(x.size > 0)) erros.push(`dados/imagens.json imagens[${i}] precisa de "arquivo", "sha" (40 hex) e "size"`);
    else fotos.add('/' + x.arquivo);
  });
} catch (e) { if (e.code !== 'ENOENT') erros.push(`dados/imagens.json: JSON inválido (${e.message})`); }
const fotoOk = src => fotos.has(src) || existsSync(join(root, src));
const confereFoto = (src, onde) => { if (src && (typeof src !== 'string' || !src.startsWith('/') || !fotoOk(src))) avisos.push(`${onde} "imagem" ${src} não está em dados/imagens.json nem na pasta (a foto não aparece)`); };

const idx = ler('dados/materias.json');
if (idx) {
  if (!Array.isArray(idx.materias)) erros.push('materias.json: "materias" precisa ser uma lista de slugs');
  const arquivos = readdirSync(join(root, 'dados/materias')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
  for (const a of arquivos) if (!idx.materias?.includes(a)) avisos.push(`dados/materias/${a}.json existe mas não está em materias.json (não aparece no site)`);
  for (const slug of idx.materias || []) {
    const f = `dados/materias/${slug}.json`;
    if (!arquivos.includes(slug)) { erros.push(`${f} não existe`); continue; }
    const m = ler(f); if (!m) continue;
    const at = s => `${f} ${s}:`;
    if (m.slug !== slug) erros.push(`${f}: "slug" precisa ser "${slug}"`);
    if (!slugOk.test(slug)) erros.push(`${f}: slug só com minúsculas, números e hífen`);
    for (const k of ['codigo', 'nome']) if (!m[k]) erros.push(`${f}: falta "${k}"`);
    confereFoto(m.imagem, f);
    if (m.cor && !/^#[0-9a-fA-F]{6}$/.test(m.cor)) erros.push(`${f}: "cor" precisa ser #RRGGBB`);
    if (!Array.isArray(m.provas)) { erros.push(`${f}: "provas" precisa ser lista`); continue; }
    const ids = new Set();
    m.provas.forEach((p, i) => {
      const w = at(`provas[${i}]`);
      if (!p.id || !slugOk.test(p.id)) erros.push(`${w} "id" obrigatório (minúsculas e hífen)`);
      if (ids.has(p.id)) erros.push(`${w} id "${p.id}" repetido`); ids.add(p.id);
      if (!p.nome) erros.push(`${w} falta "nome"`);
      confereFoto(p.imagem, w);
      if (p.data && !data.test(p.data)) erros.push(`${w} "data" no formato AAAA-MM-DD`);
      if (p.hora && !hora.test(p.hora)) erros.push(`${w} "hora" no formato HH:MM`);
      if (p.status && !['proxima', 'feita'].includes(p.status)) erros.push(`${w} "status" é "proxima" ou "feita"`);
      const titulos = new Set();
      (p.topicos || []).forEach((t, j) => {
        if (!t.titulo) erros.push(`${w} topicos[${j}] sem "titulo"`);
        if (titulos.has(t.titulo)) erros.push(`${w} tópico "${t.titulo}" repetido (o título é a chave do progresso)`); titulos.add(t.titulo);
        if (t.peso && !['alto', 'medio', 'baixo'].includes(t.peso)) erros.push(`${w} topicos[${j}].peso é alto, medio ou baixo`);
      });
      (p.flashcards || []).forEach((c, j) => { if (!c.frente || !c.verso) erros.push(`${w} flashcards[${j}] precisa de "frente" e "verso"`); });
      (p.questoes || []).forEach((q, j) => {
        if (!q.pergunta || !Array.isArray(q.opcoes) || q.opcoes.length < 2) erros.push(`${w} questoes[${j}] precisa de "pergunta" e 2+ "opcoes"`);
        else if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= q.opcoes.length) erros.push(`${w} questoes[${j}].correta é o índice (começa em 0) da opção certa`);
      });
      (p.plano || []).forEach((x, j) => {
        if (!x.tarefa) erros.push(`${w} plano[${j}] sem "tarefa"`);
        if (x.dia && !data.test(x.dia)) erros.push(`${w} plano[${j}].dia no formato AAAA-MM-DD`);
      });
      (p.formulas || []).forEach((x, j) => { if (!x.nome || !(x.latex || x.expr)) erros.push(`${w} formulas[${j}] precisa de "nome" e "latex" (ou "expr")`); });
    });
  }
}
avisos.forEach(a => console.log('aviso: ' + a));
erros.forEach(e => console.log('ERRO:  ' + e));
console.log(erros.length ? `\n${erros.length} erro(s). Corrija antes de publicar.` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
