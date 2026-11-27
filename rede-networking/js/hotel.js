/* O HOTEL — prédio em corte, um quarto por ramo, cada pessoa com personalidade e animação própria.
 * Depende de js/bots.js (REDE3D._lib) e do three.js r128. */
(function (root) {
'use strict';
var T = root.THREE, LIB = root.REDE3D._lib, shade = LIB.shade;

/* ---------- geometria e materiais compartilhados ---------- */
var UNIT = new T.BoxGeometry(1, 1, 1), MC = {}, GC = {};
function M(c) { var k = '' + c; if (!MC[k]) MC[k] = new T.MeshLambertMaterial({ color: new T.Color(c) }); return MC[k]; }
function E(c, o) { var k = c + '|' + (o === undefined ? 1 : o); if (!GC[k]) GC[k] = new T.MeshBasicMaterial({ color: new T.Color(c), transparent: o !== undefined, opacity: o === undefined ? 1 : o }); return GC[k]; }
function bx(p, w, h, d, x, y, z, c) { var m = new T.Mesh(UNIT, c && c.isMaterial ? c : M(c)); m.scale.set(w, h, d); m.position.set(x, y, z); p.add(m); return m; }
function bg(p, w, h, d, x, y, z, c, o) { return bx(p, w, h, d, x, y, z, E(c, o)); }
function cil(p, r1, r2, h, x, y, z, c, seg) { var m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 16), c && c.isMaterial ? c : M(c)); m.position.set(x, y, z); p.add(m); return m; }
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rnd(h, n) { return ((h >>> n) % 1000) / 1000; }

/* ---------- móveis reutilizáveis ---------- */
function tapete(g, x, z, w, d, c) { bx(g, w, 0.04, d, x, 0.03, z, shade(c, 0.3)); bx(g, w - 0.3, 0.05, d - 0.3, x, 0.035, z, shade(c, 0.22)); }
function mesaRet(g, x, z, w, d, c, h) {
  h = h || 0.74; bx(g, w, 0.09, d, x, h, z, c || '#7E573E');
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { bx(g, 0.1, h, 0.1, x + p[0] * (w / 2 - 0.12), h / 2, z + p[1] * (d / 2 - 0.12), '#2f3036'); });
}
function cadeira(g, x, z, ry, c) {
  var s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry || 0; g.add(s);
  bx(s, 0.46, 0.08, 0.46, 0, 0.44, 0, c || '#46474D'); bx(s, 0.46, 0.5, 0.09, 0, 0.72, -0.2, c || '#46474D');
  cil(s, 0.06, 0.06, 0.42, 0, 0.21, 0, '#2f3036', 10); bx(s, 0.42, 0.06, 0.42, 0, 0.03, 0, '#2f3036'); return s;
}
function sofa(g, x, z, ry, c, len) {
  var s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry || 0; g.add(s); len = len || 2.0;
  bx(s, len, 0.34, 0.9, 0, 0.3, 0, c); bx(s, len, 0.5, 0.22, 0, 0.62, -0.36, shade(c, 1.12));
  bx(s, 0.22, 0.42, 0.9, -len / 2 + 0.11, 0.5, 0, shade(c, 0.88)); bx(s, 0.22, 0.42, 0.9, len / 2 - 0.11, 0.5, 0, shade(c, 0.88));
  bx(s, len - 0.6, 0.1, 0.6, 0, 0.5, 0.04, shade(c, 1.2)); return s;
}
function planta(g, x, z, s) {
  s = s || 1; bx(g, 0.4 * s, 0.34 * s, 0.4 * s, x, 0.17 * s, z, '#5a3d2b');
  bx(g, 0.58 * s, 0.5 * s, 0.58 * s, x, 0.6 * s, z, '#3f6b5c'); bx(g, 0.4 * s, 0.4 * s, 0.4 * s, x + 0.05 * s, 1.0 * s, z, '#4f857d'); bx(g, 0.22 * s, 0.26 * s, 0.22 * s, x - 0.04 * s, 1.3 * s, z, '#8DBDB4');
}
function quadro(g, x, y, w, h, z, c, borda) { bx(g, w + 0.1, h + 0.1, 0.05, x, y, z, borda || '#2a2b30'); bx(g, w, h, 0.03, x, y, z + 0.02, c); }
function luminaria(g, x, z, c) { bx(g, 0.34, 0.05, 0.34, x, 0.03, z, '#2f3036'); cil(g, 0.035, 0.035, 1.5, x, 0.78, z, '#46474D', 8); var a = cil(g, 0.22, 0.14, 0.26, x, 1.62, z, '#f1ede6', 14); bg(g, 0.3, 0.06, 0.3, x, 1.5, z, c, 0.65); return a; }
function monitorM(g, x, y, z, cor, ry, w, h) {
  var m = new T.Group(); m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m); w = w || 0.9; h = h || 0.56;
  bx(m, w, h, 0.06, 0, h / 2 + 0.16, 0, '#15161a'); var tela = bg(m, w - 0.08, h - 0.08, 0.02, 0, h / 2 + 0.16, 0.04, cor, 0.9);
  bx(m, 0.1, 0.14, 0.1, 0, 0.08, 0, '#3A3B42'); bx(m, 0.34, 0.04, 0.22, 0, 0.02, 0, '#3A3B42'); return tela;
}
function estante(g, x, z, ry, larg, h2) {
  var s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry || 0; g.add(s);
  var L = larg || 1.8, H = h2 || 2.3, niv = 4, i, j;
  bx(s, L, H, 0.1, 0, H / 2, -0.17, '#4a3626'); bx(s, 0.1, H, 0.42, -L / 2, H / 2, 0, '#5a3d2b'); bx(s, 0.1, H, 0.42, L / 2, H / 2, 0, '#5a3d2b');
  var cores = ['#8a3b32', '#2f5d53', '#7b6128', '#3a4a70', '#6a3560', '#2d6b4a', '#8a5a2a'];
  for (i = 0; i < niv; i++) {
    var y = 0.16 + i * (H - 0.3) / niv; bx(s, L, 0.07, 0.42, 0, y, 0, '#5a3d2b');
    var n = 9 + (i % 2);
    for (j = 0; j < n; j++) {
      var hh = 0.4 + ((i * 7 + j * 3) % 4) * 0.05, w = (L - 0.3) / n - 0.02;
      bx(s, w, hh, 0.3, -L / 2 + 0.17 + j * (L - 0.3) / n, y + 0.04 + hh / 2, 0, cores[(i * 5 + j) % cores.length]);
    }
  }
  return s;
}
function rack(g, x, z, ry, cor) {
  var s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry || 0; g.add(s);
  bx(s, 0.9, 2.2, 0.62, 0, 1.1, 0, '#24252a'); bx(s, 0.82, 2.04, 0.04, 0, 1.1, 0.3, '#15161a');
  var leds = [];
  for (var i = 0; i < 9; i++) { bx(s, 0.76, 0.16, 0.03, 0, 0.28 + i * 0.21, 0.33, '#2e2f35'); for (var j = 0; j < 4; j++) leds.push(bg(s, 0.07, 0.06, 0.03, -0.26 + j * 0.17, 0.28 + i * 0.21, 0.35, j === 3 ? '#E59474' : cor, 0.9)); }
  return leds;
}

/* ---------- pessoa ---------- */
var PELE = ['#f3cfae', '#e5b68d', '#cf9a6f', '#b07a50', '#8a5636', '#64402a'];
var CABELO = ['#17110d', '#39240f', '#6b4423', '#a87a3d', '#d8b870', '#2b2b33', '#7a3320', '#4d4d55'];
var ROUPA = ['#8DBDB4', '#D1A584', '#A9BACB', '#DCC48F', '#C7B8EA', '#E59474', '#7FB0D8', '#9FBF8E', '#D08BA6'];
var PERFIS = [
  { id: 'focado', nome: 'Focado', vel: 0.48, pausa: [4, 9], acoes: ['digitar', 'pensar', 'anotar'], prop: 'laptop' },
  { id: 'social', nome: 'Sociável', vel: 0.78, pausa: [1.4, 3.6], acoes: ['acenar', 'falar', 'rir'], prop: 'cafe' },
  { id: 'calmo', nome: 'Calmo', vel: 0.4, pausa: [5, 11], acoes: ['ler', 'cafe', 'olhar'], prop: 'livro' },
  { id: 'agitado', nome: 'Agitado', vel: 1.05, pausa: [0.9, 2.2], acoes: ['falar', 'alongar', 'pular'], prop: 'celular' },
  { id: 'criativo', nome: 'Criativo', vel: 0.6, pausa: [3, 7], acoes: ['desenhar', 'pensar', 'alongar'], prop: 'prancheta' }
];
function prop(mao, tipo) {
  var g = new T.Group(); g.visible = false; mao.add(g);
  if (tipo === 'cafe') { cil(g, 0.08, 0.07, 0.14, 0, 0, 0, '#f1ede6', 12); bx(g, 0.04, 0.07, 0.03, 0.1, 0, 0, '#f1ede6'); bg(g, 0.1, 0.02, 0.1, 0, 0.07, 0, '#5a3d2b', 0.9); }
  else if (tipo === 'livro') { var a = bx(g, 0.3, 0.03, 0.24, -0.14, 0, 0, '#e9e1d6'), b = bx(g, 0.3, 0.03, 0.24, 0.14, 0, 0, '#e9e1d6'); a.rotation.z = 0.22; b.rotation.z = -0.22; bx(g, 0.04, 0.05, 0.26, 0, -0.01, 0, '#8a3b32'); }
  else if (tipo === 'laptop') { bx(g, 0.42, 0.03, 0.3, 0, 0, 0, '#3A3B42'); var t = bx(g, 0.42, 0.28, 0.03, 0, 0.13, -0.15, '#24252a'); t.rotation.x = 0.25; bg(g, 0.36, 0.22, 0.02, 0, 0.14, -0.12, '#8DBDB4', 0.85); }
  else if (tipo === 'prancheta') { bx(g, 0.3, 0.02, 0.4, 0, 0, 0, '#5a3d2b'); bx(g, 0.26, 0.02, 0.34, 0, 0.02, 0.01, '#f1ede6'); bx(g, 0.12, 0.03, 0.04, 0, 0.03, -0.17, '#8C8F94'); }
  else if (tipo === 'celular') { bx(g, 0.12, 0.02, 0.22, 0, 0, 0, '#15161a'); bg(g, 0.1, 0.01, 0.19, 0, 0.015, 0, '#A9BACB', 0.9); }
  else if (tipo === 'violao') { bx(g, 0.1, 0.5, 0.3, 0, 0.1, 0, '#8a5a2a'); bx(g, 0.08, 0.36, 0.22, 0, 0.1, 0.26, '#8a5a2a'); bx(g, 0.05, 0.06, 0.6, 0, 0.1, -0.44, '#5a3d2b'); }
  else if (tipo === 'caneca') { cil(g, 0.09, 0.08, 0.16, 0, 0, 0, '#D1A584', 12); }
  return g;
}
function makePerson(id, cor, perfil) {
  var h = hash(id), g = new T.Group(), body = new T.Group(); g.add(body);
  var pele = PELE[h % PELE.length], cab = CABELO[(h >>> 4) % CABELO.length], estilo = (h >>> 8) % 5;
  var calca = ['#2f3a52', '#3a3340', '#43372c', '#2b3b34', '#39393f'][(h >>> 12) % 5];
  var alt = 0.94 + rnd(h, 16) * 0.16;
  var legL = new T.Group(), legR = new T.Group(); legL.position.set(-0.11, 0.42, 0); legR.position.set(0.11, 0.42, 0);
  bx(legL, 0.15, 0.42, 0.16, 0, -0.21, 0, calca); bx(legR, 0.15, 0.42, 0.16, 0, -0.21, 0, calca);
  bx(legL, 0.17, 0.08, 0.26, 0, -0.4, 0.04, '#1b1c20'); bx(legR, 0.17, 0.08, 0.26, 0, -0.4, 0.04, '#1b1c20');
  body.add(legL, legR);
  var torso = new T.Group(); torso.position.y = 0.42; body.add(torso);
  bx(torso, 0.52, 0.52, 0.32, 0, 0.26, 0, cor);
  bx(torso, 0.53, 0.07, 0.33, 0, 0.52, 0, shade(cor, 0.72));
  if (estilo === 1) bx(torso, 0.2, 0.5, 0.34, 0, 0.26, 0.005, shade(cor, 1.25));
  if (estilo === 3) { bx(torso, 0.54, 0.1, 0.34, 0, 0.1, 0, shade(cor, 0.6)); }
  var armL = new T.Group(), armR = new T.Group(); armL.position.set(-0.35, 0.48, 0); armR.position.set(0.35, 0.48, 0);
  bx(armL, 0.13, 0.4, 0.14, 0, -0.19, 0, cor); bx(armR, 0.13, 0.4, 0.14, 0, -0.19, 0, cor);
  var maoL = new T.Group(); maoL.position.set(0, -0.44, 0); armL.add(maoL); bx(maoL, 0.13, 0.12, 0.14, 0, 0, 0, pele);
  var maoR = new T.Group(); maoR.position.set(0, -0.44, 0); armR.add(maoR); bx(maoR, 0.13, 0.12, 0.14, 0, 0, 0, pele);
  torso.add(armL, armR);
  var head = new T.Group(); head.position.y = 0.94; body.add(head);
  bx(head, 0.13, 0.1, 0.13, 0, 0, 0, shade(pele, 0.85));
  bx(head, 0.46, 0.42, 0.42, 0, 0.29, 0, pele);
  bx(head, 0.07, 0.08, 0.03, -0.1, 0.31, 0.215, '#17142b'); bx(head, 0.07, 0.08, 0.03, 0.1, 0.31, 0.215, '#17142b');
  var boca = bx(head, 0.13, 0.03, 0.03, 0, 0.17, 0.215, shade(pele, 0.55));
  bx(head, 0.48, 0.12, 0.44, 0, 0.52, 0, cab);
  if (estilo === 0) bx(head, 0.48, 0.36, 0.1, 0, 0.36, -0.21, cab);
  else if (estilo === 1) { bx(head, 0.1, 0.32, 0.44, -0.25, 0.34, 0, cab); bx(head, 0.1, 0.32, 0.44, 0.25, 0.34, 0, cab); bx(head, 0.48, 0.32, 0.1, 0, 0.34, -0.21, cab); }
  else if (estilo === 2) bx(head, 0.52, 0.12, 0.48, 0, 0.59, 0, cab);
  else if (estilo === 3) { bx(head, 0.48, 0.22, 0.1, 0, 0.44, -0.21, cab); bx(head, 0.2, 0.06, 0.08, -0.12, 0.47, 0.2, cab); }
  else { bx(head, 0.5, 0.2, 0.46, 0, 0.5, 0, cab); bx(head, 0.16, 0.22, 0.16, 0, 0.5, -0.26, cab); }
  if ((h >>> 20) % 5 === 0) { bx(head, 0.44, 0.03, 0.03, 0, 0.31, 0.225, '#2a2b30'); bx(head, 0.14, 0.13, 0.02, -0.1, 0.31, 0.23, '#cfe6ff'); bx(head, 0.14, 0.13, 0.02, 0.1, 0.31, 0.23, '#cfe6ff'); }
  if ((h >>> 23) % 7 === 0) bx(head, 0.2, 0.06, 0.03, 0, 0.12, 0.21, shade(cab, 0.9));
  g.scale.setScalar(alt);
  var pf = PERFIS[(h >>> 26) % PERFIS.length]; if (perfil) pf = perfil;
  var o = { id: id, g: g, body: body, torso: torso, legL: legL, legR: legR, armL: armL, armR: armR, maoL: maoL, maoR: maoR, head: head, boca: boca,
    cor: cor, pele: pele, pf: pf, seed: rnd(h, 2) * 10, walk: 0, act: 'parado', actT: 0, pose: 'stand', poseK: 0, mesh: [] };
  o.props = { cafe: prop(maoR, 'cafe'), livro: prop(maoR, 'livro'), laptop: prop(maoR, 'laptop'), prancheta: prop(maoR, 'prancheta'), celular: prop(maoR, 'celular'), caneca: prop(maoR, 'caneca') };
  g.traverse(function (m) { if (m.isMesh) { m.userData.cid = id; o.mesh.push(m); } });
  return o;
}
var PROP_DE = { cafe: 'cafe', ler: 'livro', digitar: 'laptop', anotar: 'prancheta', desenhar: 'prancheta', falar: 'celular' };
function animPerson(o, t, dt, moving) {
  o.actT = Math.max(0, o.actT - dt); if (!o.actT && o.act !== 'parado') o.act = 'parado';
  o.walk += moving ? dt * (7 + o.pf.vel * 3) : 0;
  var sent = o.pose === 'sit' && !moving;
  o.poseK += ((sent ? 1 : 0) - o.poseK) * Math.min(1, dt * 7);
  var k = o.poseK, sw = moving ? Math.sin(o.walk) * 0.72 : 0;
  var bob = moving ? Math.abs(Math.sin(o.walk)) * 0.045 : Math.sin(t * 1.6 + o.seed) * 0.016;
  var aLx = -sw * 0.6, aRx = sw * 0.6, aLz = 0, aRz = 0, hx = 0, hy = moving ? 0 : Math.sin(t * 0.6 + o.seed) * 0.35, tz = 0, hop = 0, pr = null;
  var a = moving ? 'andando' : o.act, ft = 3 - o.actT;
  if (a === 'digitar') { aLx = -1.35; aRx = -1.35; aLz = 0.2; aRz = -0.2; hx = 0.16; hy = 0; o.maoL.rotation.x = Math.sin(t * 16) * 0.22; o.maoR.rotation.x = Math.sin(t * 16 + 1.4) * 0.22; }
  else { o.maoL.rotation.x = 0; o.maoR.rotation.x = 0; }
  if (a === 'pensar') { aRx = -2.0; aRz = 0.5; hx = 0.2; hy = Math.sin(t * 1.2 + o.seed) * 0.35; }
  else if (a === 'anotar') { aRx = -1.5 + Math.sin(t * 5) * 0.12; aLx = -0.9; hx = 0.24; hy = 0; }
  else if (a === 'desenhar') { aRx = -1.45 + Math.sin(t * 4) * 0.3; aRz = Math.cos(t * 4) * 0.25; aLx = -0.7; hx = 0.22; hy = 0; }
  else if (a === 'acenar') { aRx = -0.35; aRz = -1.95 + Math.sin(t * 10) * 0.4; hy = 0.1; }
  else if (a === 'falar') { aRx = -0.9 + Math.sin(t * 5) * 0.5; aLx = -0.5 + Math.cos(t * 4.3) * 0.4; aRz = -0.4; aLz = 0.4; hy = Math.sin(t * 3) * 0.25; }
  else if (a === 'rir') { hop = Math.abs(Math.sin(t * 8)) * 0.05; hx = -0.26; aLz = 0.6; aRz = -0.6; aLx = -1.1; aRx = -1.1; }
  else if (a === 'ler') { aRx = -1.5; aLx = -1.5; aRz = -0.35; aLz = 0.35; hx = 0.3; hy = Math.sin(t * 0.8) * 0.12; }
  else if (a === 'cafe') { aRx = -2.3 + Math.sin(t * 1.4) * 0.22; aRz = -0.3; hx = -0.06; }
  else if (a === 'olhar') { hy = Math.sin(t * 0.9 + o.seed) * 0.9; hx = Math.sin(t * 0.5) * 0.08; }
  else if (a === 'alongar') { aLz = 1.55; aRz = -1.55; aLx = -0.5; aRx = -0.5; aLx = 0; aRx = 0; hx = -0.2; hop = Math.sin(ft * 2) * 0.02; }
  else if (a === 'pular') { hop = Math.abs(Math.sin(t * 7.5)) * 0.3; aLz = 1.3; aRz = -1.3; aLx = -0.8; aRx = -0.8; }
  else if (a === 'dancar') { hop = Math.abs(Math.sin(t * 7)) * 0.16; aLz = 0.9 + Math.sin(t * 7) * 0.55; aRz = -0.9 - Math.cos(t * 7) * 0.55; aLx = -0.7 + Math.sin(t * 7) * 0.5; aRx = -0.7 + Math.cos(t * 7) * 0.5; tz = Math.sin(t * 3.5) * 0.13; hy = Math.sin(t * 7) * 0.4; }
  pr = PROP_DE[a] || null;
  for (var key in o.props) o.props[key].visible = (key === pr);
  // sentado
  o.legL.rotation.x = sw * (1 - k) - 1.5 * k; o.legR.rotation.x = -sw * (1 - k) - 1.5 * k;
  o.body.position.y = bob + hop - 0.3 * k; o.torso.rotation.z = tz; o.torso.rotation.x = 0.06 * k;
  o.armL.rotation.set(aLx, 0, aLz); o.armR.rotation.set(aRx, 0, aRz);
  o.head.rotation.set(hx, hy, 0);
  o.boca.scale.y = 0.03 * ((a === 'falar' || a === 'rir') ? 1 + Math.abs(Math.sin(t * 9)) * 2.6 : 1);
}

/* ---------- quartos por ramo ---------- */
var RW = 7.6, RH = 4.3, RD = 4.8, GX = 0.5, GY = 1.5, COLS = 4;
function casca(g, cor, op) {
  op = op || {};
  var i, j;
  bx(g, RW, 0.18, RD, 0, -0.09, 0, '#2a2b30');
  for (i = 0; i < 8; i++) for (j = 0; j < 4; j++) bx(g, RW / 8 - 0.02, 0.02, RD / 4 - 0.02, -RW / 2 + RW / 16 + i * RW / 8, 0.01, -RD / 2 + RD / 8 + j * RD / 4, (i + j) % 2 ? shade(op.piso || '#3c3d44', 1) : shade(op.piso || '#3c3d44', 0.82));
  bx(g, RW, RH, 0.16, 0, RH / 2, -RD / 2, op.parede || '#3a3b42');
  bx(g, RW, 0.5, 0.17, 0, 0.25, -RD / 2 + 0.01, shade(op.parede || '#3a3b42', 0.75));
  bx(g, RW, 0.08, 0.2, 0, 0.52, -RD / 2 + 0.02, shade(cor, 0.5));
  bx(g, 0.16, RH, RD, -RW / 2, RH / 2, 0, '#2b2c31'); bx(g, 0.16, RH, RD, RW / 2, RH / 2, 0, '#2b2c31');
  bx(g, RW + 0.36, 0.16, 1.3, 0, RH + 0.08, -RD / 2 + 0.45, '#1c1d21');
  bx(g, RW + 0.36, 0.1, 0.22, 0, RH + 0.05, RD / 2 + 0.05, '#1c1d21');
  bg(g, RW - 1.4, 0.06, 0.34, 0, RH - 0.14, -0.5, '#fff0d8', 0.5);
  bg(g, RW - 0.4, 0.07, 0.14, 0, RH - 0.5, -RD / 2 + 0.1, cor, 0.95);
  bg(g, 0.07, 0.07, RD - 0.3, -RW / 2 + 0.12, RH - 0.5, 0.1, cor, 0.6); bg(g, 0.07, 0.07, RD - 0.3, RW / 2 - 0.12, RH - 0.5, 0.1, cor, 0.6);
  if (op.porta !== false) { bx(g, 0.1, 2.0, 0.95, RW / 2 - 0.1, 1.0, RD / 2 - 0.9, '#4a3626'); bg(g, 0.04, 0.1, 0.1, RW / 2 - 0.18, 1.0, RD / 2 - 1.26, '#DCC48F', 1); }
  if (op.janela) { bx(g, 1.5, 1.1, 0.06, op.janela, 2.5, -RD / 2 + 0.1, '#1a2740'); for (i = 0; i < 7; i++) bg(g, 0.06, 0.06, 0.03, op.janela - 0.58 + ((i * 37) % 10) * 0.12, 2.1 + ((i * 53) % 8) * 0.12, -RD / 2 + 0.14, '#cfe6ff', 0.9); bx(g, 1.62, 0.07, 0.09, op.janela, 3.06, -RD / 2 + 0.11, '#2a2b30'); bx(g, 1.62, 0.07, 0.09, op.janela, 1.94, -RD / 2 + 0.11, '#2a2b30'); bx(g, 0.07, 1.15, 0.09, op.janela, 2.5, -RD / 2 + 0.11, '#2a2b30'); }
}
function poeira(g, cor, n, alt, vel) {
  var ps = [], i;
  for (i = 0; i < n; i++) { var m = bg(g, 0.06, 0.06, 0.06, 0, 0, 0, cor, 0.5); ps.push({ m: m, x: -RW / 2 + 0.6 + Math.random() * (RW - 1.2), z: -RD / 2 + 0.5 + Math.random() * (RD - 1), y: Math.random() * alt, v: (0.1 + Math.random() * 0.2) * (vel || 1), f: Math.random() * 7 }); }
  return function (t) { ps.forEach(function (p) { p.y += p.v * 0.016; if (p.y > alt) p.y = 0.1; p.m.position.set(p.x + Math.sin(t * 0.7 + p.f) * 0.2, p.y, p.z); p.m.material.opacity = 0.14 + 0.3 * Math.sin(p.y / alt * Math.PI); }); };
}

var KITS = {};
/* Engenharia — oficina de protótipos */
KITS.eng = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#3b3c44', piso: '#42434a', janela: 2.3 });
  // bancada com torno e peça girando
  mesaRet(g, -2.2, -1.1, 3.0, 1.1, '#5f6068', 0.82);
  var peca = new T.Group(); peca.position.set(-3.0, 1.05, -1.1); g.add(peca);
  bx(peca, 0.44, 0.3, 0.44, 0, 0.15, 0, '#A9BACB'); bx(peca, 0.2, 0.42, 0.2, 0, 0.3, 0, '#8C8F94'); bx(peca, 0.56, 0.08, 0.1, 0, 0.3, 0, '#6E8399');
  bx(g, 0.5, 0.26, 0.5, -3.0, 0.95, -1.1, '#2f3036');
  an.push(function (t) { peca.rotation.y = t * 1.4; });
  // braço robótico que solda
  var base = new T.Group(); base.position.set(-1.3, 0.87, -1.1); g.add(base);
  cil(base, 0.3, 0.34, 0.16, 0, 0.08, 0, '#2f3036', 14);
  var b1 = new T.Group(); b1.position.y = 0.16; base.add(b1); bx(b1, 0.2, 0.8, 0.2, 0, 0.4, 0, cor);
  var b2 = new T.Group(); b2.position.y = 0.8; b1.add(b2); bx(b2, 0.17, 0.66, 0.17, 0, 0.33, 0, shade(cor, 0.8));
  var pt = new T.Group(); pt.position.y = 0.66; b2.add(pt); bx(pt, 0.12, 0.2, 0.12, 0, 0.1, 0, '#8C8F94');
  var faisca = bg(pt, 0.14, 0.14, 0.14, 0, 0.24, 0, '#fff0b0', 0.95);
  var luzS = new T.PointLight(0xffd27f, 0, 2.6); pt.add(luzS); luzS.position.y = 0.3;
  an.push(function (t) {
    base.rotation.y = Math.sin(t * 0.5) * 0.9; b1.rotation.x = -0.4 + Math.sin(t * 0.8) * 0.3; b2.rotation.x = 0.7 + Math.cos(t * 0.8) * 0.35;
    var on = Math.sin(t * 13) > 0.1 && Math.sin(t * 0.8) > -0.3;
    faisca.visible = on; faisca.scale.setScalar(0.14 * (0.7 + Math.random() * 0.9)); luzS.intensity = on ? 1.5 : 0;
  });
  // engrenagens na parede
  function eng(x, y, r, c, inv) {
    var e = new T.Group(); e.position.set(x, y, -RD / 2 + 0.12); g.add(e);
    cil(e, r, r, 0.08, 0, 0, 0, c, 20).rotation.x = Math.PI / 2;
    for (var k = 0; k < 10; k++) { var a2 = k / 10 * Math.PI * 2; bx(e, 0.16, 0.16, 0.08, Math.cos(a2) * r, Math.sin(a2) * r, 0, c); }
    cil(e, r * 0.3, r * 0.3, 0.1, 0, 0, 0.01, '#2a2b30', 14).rotation.x = Math.PI / 2;
    an.push(function (t) { e.rotation.z = t * (inv ? -0.5 : 0.5) * (0.6 / r); }); return e;
  }
  eng(-2.5, 3.2, 0.5, '#6E8399'); eng(-1.55, 3.2, 0.42, shade(cor, 0.8), true);
  // quadro de esquema
  quadro(g, 0.3, 2.9, 1.5, 1.0, -RD / 2 + 0.1, '#1d2a38');
  for (i = 0; i < 5; i++) bg(g, 0.9 - i * 0.1, 0.03, 0.02, 0.3, 2.55 + i * 0.18, -RD / 2 + 0.13, cor, 0.7);
  // armário de ferramentas
  bx(g, 1.1, 1.3, 0.6, 2.9, 0.65, -RD / 2 + 0.45, '#8a4a2a');
  for (i = 0; i < 3; i++) { bx(g, 1.0, 0.33, 0.04, 2.9, 0.3 + i * 0.42, -RD / 2 + 0.78, '#6b3a22'); bx(g, 0.3, 0.06, 0.05, 2.9, 0.3 + i * 0.42, -RD / 2 + 0.81, '#DCC48F'); }
  var tela = monitorM(g, 1.9, 0.88, -1.0, cor, -0.5, 0.84, 0.52);
  mesaRet(g, 1.9, -1.0, 1.5, 1.0, '#5f6068', 0.82);
  an.push(function (t) { tela.material.opacity = 0.65 + Math.sin(t * 2.2) * 0.2; });
  planta(g, 3.3, 1.4, 0.9); tapete(g, -0.4, 1.3, 3.2, 1.8, cor);
  var caixas = [[-3.3, 1.6], [-2.8, 1.8]]; caixas.forEach(function (c2, n) { bx(g, 0.7, 0.5, 0.7, c2[0], 0.25 + n * 0.5, c2[1], '#7E573E'); });
  an.push(poeira(g, '#ffcf8a', 7, 2.4, 1.4));
  return { anim: an, spots: [
    { x: -2.6, z: -0.35, ry: Math.PI, pose: 'stand', act: 'anotar' }, { x: -1.3, z: -0.1, ry: Math.PI, pose: 'stand', act: 'pensar' },
    { x: 1.9, z: -0.2, ry: Math.PI, pose: 'stand', act: 'digitar' }, { x: 0.3, z: 1.6, ry: 0, pose: 'stand', act: 'falar' },
    { x: -1.0, z: 2.1, ry: 0.4, pose: 'stand', act: 'olhar' }, { x: 2.9, z: 1.5, ry: -0.6, pose: 'stand', act: 'cafe' } ] };
};
/* Humanidades — biblioteca */
KITS.hum = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#443a30', piso: '#4a3a2c' });
  estante(g, -2.6, -RD / 2 + 0.5, 0, 2.2, 2.6); estante(g, -0.2, -RD / 2 + 0.5, 0, 2.0, 2.6);
  estante(g, RW / 2 - 0.45, -0.4, -Math.PI / 2, 2.4, 2.3);
  // escada de biblioteca
  var esc = new T.Group(); esc.position.set(-1.35, 0, -RD / 2 + 1.0); g.add(esc);
  bx(esc, 0.1, 2.5, 0.1, -0.3, 1.25, 0, '#6b4423'); bx(esc, 0.1, 2.5, 0.1, 0.3, 1.25, 0, '#6b4423');
  for (i = 0; i < 6; i++) bx(esc, 0.7, 0.07, 0.22, 0, 0.35 + i * 0.4, 0, '#8a5a2a');
  // lareira
  bx(g, 1.6, 1.5, 0.5, 2.3, 0.75, -RD / 2 + 0.4, '#5c4a3c'); bx(g, 1.0, 0.9, 0.3, 2.3, 0.55, -RD / 2 + 0.5, '#1b1410');
  var fogo = []; for (i = 0; i < 5; i++) fogo.push(bg(g, 0.18, 0.3, 0.18, 1.95 + i * 0.18, 0.38, -RD / 2 + 0.52, i % 2 ? '#ff9a3c' : '#ffd27f', 0.95));
  var luzF = new T.PointLight(0xff9a3c, 1.1, 5); luzF.position.set(2.3, 0.8, -1.4); g.add(luzF);
  bx(g, 1.9, 0.14, 0.6, 2.3, 1.56, -RD / 2 + 0.42, '#7E573E');
  an.push(function (t) { fogo.forEach(function (f, k) { f.scale.y = 0.3 * (0.6 + Math.abs(Math.sin(t * 6 + k * 1.3)) * 1.4); f.material.opacity = 0.7 + Math.random() * 0.3; }); luzF.intensity = 0.9 + Math.sin(t * 7) * 0.25; });
  // poltrona + luminária + mesinha
  sofa(g, 0.3, 1.3, 0.15, '#6a3a46', 1.3); luminaria(g, 1.5, 1.5, '#ffd27f');
  mesaRet(g, -0.9, 1.5, 0.8, 0.7, '#5a3d2b', 0.5); bx(g, 0.3, 0.1, 0.24, -0.9, 0.57, 1.5, '#e9e1d6');
  // escrivaninha com máquina de escrever
  mesaRet(g, -2.6, 1.2, 1.7, 0.9, '#6b4423', 0.76); cadeira(g, -2.6, 2.0, Math.PI, '#4a3626');
  var maq = new T.Group(); maq.position.set(-2.6, 0.81, 1.2); g.add(maq);
  bx(maq, 0.62, 0.18, 0.46, 0, 0.09, 0, '#2e2f35'); bx(maq, 0.5, 0.1, 0.3, 0, 0.22, 0.04, '#24252a');
  var folha = bx(maq, 0.42, 0.3, 0.02, 0, 0.4, -0.12, '#f1ede6'); folha.rotation.x = -0.25;
  var tecla = bx(maq, 0.42, 0.04, 0.1, 0, 0.2, 0.17, '#8C8F94');
  an.push(function (t) { tecla.position.y = 0.2 - Math.abs(Math.sin(t * 9)) * 0.02; folha.position.y = 0.4 + Math.sin(t * 0.5) * 0.01; });
  // páginas voando
  var pgs = []; for (i = 0; i < 6; i++) pgs.push(bx(g, 0.26, 0.012, 0.2, 0, 0, 0, '#e9e1d6'));
  an.push(function (t) { pgs.forEach(function (p, k) { var a2 = t * 0.35 + k * 1.05; p.position.set(Math.cos(a2) * (1.6 + k * 0.18), 2.0 + Math.sin(a2 * 1.6 + k) * 0.6, 0.6 + Math.sin(a2) * 1.0); p.rotation.set(a2 * 1.4, a2, Math.sin(a2) * 0.6); }); });
  tapete(g, 0.4, 1.4, 3.4, 2.0, '#6a3a46'); planta(g, -3.3, 1.8, 1.0);
  an.push(poeira(g, '#ffd9a0', 10, 2.8, 0.6));
  return { anim: an, spots: [
    { x: -2.6, z: 1.9, ry: 0, pose: 'sit', act: 'digitar' }, { x: 0.3, z: 1.1, ry: 0.15, pose: 'sit', act: 'ler' },
    { x: -1.4, z: 0.2, ry: Math.PI, pose: 'stand', act: 'ler' }, { x: -0.1, z: 0.1, ry: Math.PI, pose: 'stand', act: 'pensar' },
    { x: 2.4, z: 0.4, ry: Math.PI, pose: 'stand', act: 'cafe' }, { x: 1.6, z: 2.1, ry: -0.5, pose: 'stand', act: 'falar' } ] };
};
/* Pesquisa, Saúde e IA — laboratório */
KITS.pes = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#333c40', piso: '#3a4448', janela: -2.6 });
  mesaRet(g, 0.4, -1.2, 4.6, 1.1, '#9aa6ac', 0.86);
  // frascos borbulhando
  [-1.4, -0.5, 0.4].forEach(function (x, n) {
    var cores = ['#8DBDB4', '#C7B8EA', '#DCC48F'][n];
    cil(g, 0.18, 0.22, 0.44, x, 1.12, -1.2, E(cores, 0.55), 14);
    cil(g, 0.1, 0.1, 0.1, x, 1.37, -1.2, '#cfd8dc', 12);
    var bo = []; for (i = 0; i < 4; i++) bo.push(bg(g, 0.07, 0.07, 0.07, x, 1.0, -1.2, '#ffffff', 0.6));
    an.push(function (t) { bo.forEach(function (b, k) { var y = ((t * 0.5 + k * 0.25) % 1); b.position.set(x + Math.sin(t * 3 + k) * 0.05, 0.95 + y * 0.38, -1.2); b.material.opacity = 0.5 * (1 - y); }); });
    cil(g, 0.2, 0.2, 0.06, x, 0.92, -1.2, '#46474D', 12);
  });
  // centrífuga
  var cf = new T.Group(); cf.position.set(1.6, 0.9, -1.2); g.add(cf);
  cil(cf, 0.34, 0.36, 0.3, 0, 0.15, 0, '#e3e7ea', 18);
  var rotor = new T.Group(); rotor.position.y = 0.32; cf.add(rotor);
  for (i = 0; i < 4; i++) { var a3 = i / 4 * Math.PI * 2; bx(rotor, 0.1, 0.16, 0.1, Math.cos(a3) * 0.2, 0, Math.sin(a3) * 0.2, cor); }
  cil(cf, 0.36, 0.36, 0.08, 0, 0.36, 0, E('#cfe6ff', 0.4), 18);
  an.push(function (t) { rotor.rotation.y = t * 9; });
  // microscópio
  var mi = new T.Group(); mi.position.set(2.6, 0.9, -1.2); g.add(mi);
  bx(mi, 0.4, 0.1, 0.34, 0, 0.05, 0, '#2f3036'); bx(mi, 0.1, 0.5, 0.1, 0.1, 0.3, -0.06, '#46474D');
  var tubo = bx(mi, 0.12, 0.42, 0.12, -0.04, 0.56, 0.02, '#2f3036'); tubo.rotation.z = 0.3; bx(mi, 0.3, 0.04, 0.26, -0.04, 0.3, 0.04, '#8C8F94');
  an.push(function (t) { mi.rotation.y = Math.sin(t * 0.4) * 0.25; });
  // monitor com batimento
  var larg = 1.9;
  quadro(g, -1.1, 2.7, larg, 1.1, -RD / 2 + 0.1, '#0e1a1a');
  var pts = []; for (i = 0; i < 26; i++) pts.push(bg(g, larg / 26, 0.05, 0.02, -1.1 - larg / 2 + (i + 0.5) * larg / 26, 2.7, -RD / 2 + 0.13, cor, 0.9));
  an.push(function (t) { pts.forEach(function (p, k) { var ph = (k / 26 + t * 0.25) % 1, v = Math.exp(-Math.pow((ph - 0.5) * 9, 2)) * Math.sin(ph * 30); p.position.y = 2.7 + v * 0.34; p.material.opacity = 0.45 + Math.abs(v) * 0.5; }); });
  // hélice de DNA
  var dna = new T.Group(); dna.position.set(2.5, 1.0, 0.9); g.add(dna);
  var bolas = []; for (i = 0; i < 16; i++) { var m1 = bg(dna, 0.13, 0.13, 0.13, 0, 0, 0, '#8DBDB4', 0.95), m2 = bg(dna, 0.13, 0.13, 0.13, 0, 0, 0, '#D1A584', 0.95), lk = bg(dna, 0.5, 0.05, 0.05, 0, 0, 0, '#ffffff', 0.25); bolas.push([m1, m2, lk, i]); }
  an.push(function (t) { bolas.forEach(function (b) { var y = b[3] * 0.11, a4 = b[3] * 0.55 + t * 1.1; b[0].position.set(Math.cos(a4) * 0.34, y, Math.sin(a4) * 0.34); b[1].position.set(-Math.cos(a4) * 0.34, y, -Math.sin(a4) * 0.34); b[2].position.set(0, y, 0); b[2].rotation.y = -a4; b[2].scale.set(0.58, 0.05, 0.05); }); dna.rotation.y = t * 0.3; });
  bg(g, 0.5, 0.05, 0.5, 2.5, 0.05, 0.9, cor, 0.5);
  // armário de reagentes
  bx(g, 1.0, 1.8, 0.5, -3.1, 0.9, 0.9, '#43474a');
  for (i = 0; i < 9; i++) bg(g, 0.14, 0.26, 0.04, -3.45 + (i % 3) * 0.34, 0.5 + Math.floor(i / 3) * 0.44, 1.17, ['#8DBDB4', '#DCC48F', '#C7B8EA'][i % 3], 0.9);
  tapete(g, 0.4, 1.4, 3.0, 1.6, cor);
  an.push(poeira(g, '#b7f0e4', 8, 2.6, 0.9));
  return { anim: an, spots: [
    { x: -1.0, z: -0.25, ry: Math.PI, pose: 'stand', act: 'anotar' }, { x: 0.4, z: -0.2, ry: Math.PI, pose: 'stand', act: 'pensar' },
    { x: 1.7, z: -0.2, ry: Math.PI, pose: 'stand', act: 'digitar' }, { x: 2.6, z: 0.1, ry: Math.PI, pose: 'stand', act: 'olhar' },
    { x: -0.6, z: 1.9, ry: 0.2, pose: 'stand', act: 'falar' }, { x: -2.4, z: 1.2, ry: -0.3, pose: 'stand', act: 'cafe' } ] };
};
/* Negócios e Produto — sala de reunião */
KITS.neg = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#3d3730', piso: '#45403a', janela: 2.5 });
  // mesa de reunião
  var mesa = new T.Group(); mesa.position.set(-0.3, 0, 0.2); g.add(mesa);
  cil(mesa, 2.1, 2.1, 0.11, 0, 0.76, 0, '#6b4423', 28); mesa.children[0].scale.z = 0.56;
  cil(mesa, 0.5, 0.65, 0.74, 0, 0.37, 0, '#2f3036', 16);
  bx(mesa, 1.0, 0.04, 0.5, 0, 0.83, 0, '#5a3d2b');
  var cads = [[-1.4, -1.0, 0.5], [0, -1.15, 0], [1.4, -1.0, -0.5], [-1.4, 1.3, 2.6], [0, 1.45, Math.PI], [1.4, 1.3, 3.7]];
  cads.forEach(function (c2) { cadeira(g, c2[0] - 0.3, c2[1] + 0.2, c2[2], '#4a4b52'); });
  // tela com barras que crescem
  quadro(g, -1.6, 2.7, 2.3, 1.3, -RD / 2 + 0.1, '#15181d');
  var bars = []; for (i = 0; i < 7; i++) bars.push(bg(g, 1, 1, 1, -2.5 + i * 0.31, 2.4, -RD / 2 + 0.13, i === 6 ? '#8DBDB4' : cor, 0.9));
  bg(g, 2.1, 0.03, 0.02, -1.6, 2.16, -RD / 2 + 0.13, '#8C8F94', 0.7);
  an.push(function (t) { bars.forEach(function (b, k) { var v = 0.22 + (0.18 + k * 0.1) * (0.6 + 0.4 * Math.sin(t * 0.8 + k * 0.6)); b.scale.set(0.22, v, 0.02); b.position.y = 2.18 + v / 2; }); });
  // flip chart
  var fc = new T.Group(); fc.position.set(2.7, 0, -1.3); fc.rotation.y = -0.5; g.add(fc);
  bx(fc, 0.07, 1.9, 0.07, -0.4, 0.95, 0, '#8C8F94'); bx(fc, 0.07, 1.9, 0.07, 0.4, 0.95, 0, '#8C8F94'); bx(fc, 0.06, 1.2, 0.06, 0, 0.6, 0.35, '#8C8F94');
  bx(fc, 1.0, 1.3, 0.04, 0, 1.45, 0, '#f1ede6');
  var seta = bg(fc, 0.8, 0.07, 0.03, 0, 1.3, 0.03, cor, 0.95); seta.rotation.z = 0.5;
  an.push(function (t) { seta.scale.set(0.8 * (0.8 + Math.sin(t * 1.4) * 0.2), 0.07, 0.03); });
  // cafeteira com vapor
  bx(g, 0.9, 0.9, 0.5, -3.2, 0.45, -1.4, '#46474D'); bx(g, 0.5, 0.4, 0.4, -3.2, 1.1, -1.4, '#2f3036'); bg(g, 0.3, 0.2, 0.3, -3.2, 0.95, -1.18, '#D1A584', 0.8);
  var vap = []; for (i = 0; i < 4; i++) vap.push(bg(g, 0.14, 0.14, 0.14, -3.2, 1.4, -1.4, '#ffffff', 0.3));
  an.push(function (t) { vap.forEach(function (v, k) { var y = (t * 0.4 + k * 0.25) % 1; v.position.set(-3.2 + Math.sin(t * 2 + k) * 0.12, 1.35 + y * 0.8, -1.4); v.material.opacity = 0.28 * (1 - y); }); });
  // post-its de produto
  var pc = ['#DCC48F', '#8DBDB4', '#E59474', '#A9BACB'];
  for (i = 0; i < 8; i++) bx(g, 0.3, 0.3, 0.03, 1.1 + (i % 4) * 0.4, 3.3 - Math.floor(i / 4) * 0.4, -RD / 2 + 0.12, pc[(i * 3) % 4]).rotation.z = ((i * 13) % 5 - 2) * 0.05;
  tapete(g, -0.3, 0.3, 4.6, 2.6, cor); planta(g, 3.3, 1.6, 1.0);
  return { anim: an, spots: [
    { x: -1.7, z: -0.8, ry: 0.2, pose: 'sit', act: 'falar' }, { x: -0.3, z: -0.95, ry: 0, pose: 'sit', act: 'digitar' },
    { x: 1.1, z: -0.8, ry: -0.2, pose: 'sit', act: 'pensar' }, { x: -1.7, z: 1.5, ry: Math.PI - 0.3, pose: 'sit', act: 'anotar' },
    { x: 1.1, z: 1.5, ry: Math.PI + 0.3, pose: 'sit', act: 'cafe' }, { x: 2.5, z: 0.4, ry: -1.2, pose: 'stand', act: 'falar' } ] };
};
/* Orientação e Mentoria — sala de conversa */
KITS.ori = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#453a38', piso: '#463c38' });
  sofa(g, -1.3, -0.3, 0.1, '#7a4a52', 2.2); sofa(g, -1.3, 1.9, Math.PI, '#5c5a7a', 2.2);
  mesaRet(g, -1.3, 0.8, 1.5, 0.8, '#6b4423', 0.46);
  bx(g, 0.26, 0.1, 0.2, -1.6, 0.53, 0.8, '#f1ede6'); bx(g, 0.26, 0.1, 0.2, -1.0, 0.53, 0.8, '#D1A584');
  bx(g, 0.5, 0.06, 0.34, -1.3, 0.51, 0.55, '#e9e1d6');
  luminaria(g, 0.3, -0.9, '#ffd9a0');
  // parede de fotos e diplomas
  var cf = ['#8DBDB4', '#DCC48F', '#D1A584', '#A9BACB', '#C7B8EA', '#E59474'];
  for (i = 0; i < 6; i++) quadro(g, -2.6 + (i % 3) * 0.95, 3.1 - Math.floor(i / 3) * 0.85, 0.7, 0.6, -RD / 2 + 0.1, cf[i], '#6b4423');
  quadro(g, 1.5, 2.9, 1.1, 0.8, -RD / 2 + 0.1, '#f1ede6', '#8a6a3a');
  bg(g, 0.6, 0.04, 0.02, 1.5, 2.7, -RD / 2 + 0.13, cor, 0.8);
  // quadro branco pequeno com setas animadas
  var qb = new T.Group(); qb.position.set(2.8, 1.6, -RD / 2 + 0.4); qb.rotation.y = -0.45; g.add(qb);
  bx(qb, 1.5, 1.1, 0.07, 0, 0, 0, '#f1ede6'); bx(qb, 1.6, 1.2, 0.04, 0, 0, -0.03, '#8C8F94');
  var setas = []; for (i = 0; i < 3; i++) setas.push(bg(qb, 0.8, 0.06, 0.02, -0.1, 0.3 - i * 0.3, 0.05, [cor, '#8DBDB4', '#A9BACB'][i], 0.9));
  an.push(function (t) { setas.forEach(function (s, k) { s.scale.set(0.8 * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.2 + k * 0.9))), 0.06, 0.02); }); });
  bx(g, 0.1, 1.6, 0.1, 2.3, 0.8, -RD / 2 + 0.55, '#8C8F94'); bx(g, 0.1, 1.6, 0.1, 3.3, 0.8, -RD / 2 + 0.3, '#8C8F94');
  planta(g, 3.1, 1.6, 1.35); planta(g, -3.4, -1.3, 0.85);
  tapete(g, -1.3, 0.8, 3.6, 2.6, '#7a4a52');
  // relógio
  var rel = cil(g, 0.32, 0.32, 0.07, 0.6, 3.3, -RD / 2 + 0.12, '#f1ede6', 20); rel.rotation.x = Math.PI / 2;
  var pm = bx(g, 0.03, 0.26, 0.03, 0.6, 3.3, -RD / 2 + 0.17, '#1b1c20'); pm.geometry = UNIT; pm.position.y = 3.3;
  an.push(function (t) { pm.rotation.z = -t * 0.6; pm.position.set(0.6 + Math.sin(-t * 0.6) * 0, 3.3 + 0, -RD / 2 + 0.17); });
  an.push(poeira(g, '#ffd9a0', 7, 2.4, 0.5));
  return { anim: an, spots: [
    { x: -2.1, z: -0.2, ry: 0.1, pose: 'sit', act: 'falar' }, { x: -0.6, z: -0.2, ry: 0.1, pose: 'sit', act: 'olhar' },
    { x: -2.1, z: 1.8, ry: Math.PI, pose: 'sit', act: 'pensar' }, { x: -0.6, z: 1.8, ry: Math.PI, pose: 'sit', act: 'cafe' },
    { x: 1.6, z: 0.9, ry: -0.8, pose: 'stand', act: 'desenhar' }, { x: 2.4, z: 1.9, ry: -1.1, pose: 'stand', act: 'acenar' },
    { x: 0.6, z: 2.0, ry: 2.6, pose: 'stand', act: 'rir' } ] };
};
/* Amigos e Comunidade — lounge */
KITS.ami = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#3a3444', piso: '#403a4a' });
  sofa(g, -2.1, 0.5, 0, '#5b5680', 2.5);
  mesaRet(g, -0.7, 1.6, 1.1, 0.8, '#5a3d2b', 0.44);
  // pizza
  cil(g, 0.42, 0.42, 0.05, -0.7, 0.49, 1.6, '#e0b36a', 16);
  for (i = 0; i < 6; i++) { var a5 = i / 6 * 6.28; bg(g, 0.1, 0.03, 0.1, -0.7 + Math.cos(a5) * 0.22, 0.53, 1.6 + Math.sin(a5) * 0.22, '#c0392b', 1); }
  // pebolim
  var pb = new T.Group(); pb.position.set(1.7, 0, 0.6); pb.rotation.y = -0.25; g.add(pb);
  bx(pb, 2.0, 0.12, 1.2, 0, 0.8, 0, '#2d6b4a'); bx(pb, 2.1, 0.3, 1.3, 0, 0.66, 0, '#5a3d2b');
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { bx(pb, 0.1, 0.8, 0.1, p[0] * 0.95, 0.4, p[1] * 0.55, '#3A3B42'); });
  var barras = [];
  for (i = 0; i < 4; i++) { var b = new T.Group(); b.position.set(-0.7 + i * 0.47, 0.95, 0); pb.add(b); bx(b, 0.05, 0.05, 1.5, 0, 0, 0, '#cfd8dc'); for (var j = 0; j < 2; j++) bx(b, 0.14, 0.26, 0.14, 0, -0.08, -0.3 + j * 0.6, i % 2 ? '#D1A584' : '#8DBDB4'); barras.push(b); }
  an.push(function (t) { barras.forEach(function (b, k) { b.rotation.x = Math.sin(t * (3 + k) + k) * 1.2; b.position.z = Math.sin(t * 1.6 + k * 1.1) * 0.22; }); });
  // TV piscando
  quadro(g, -1.6, 2.8, 2.2, 1.25, -RD / 2 + 0.1, '#10131a');
  var tv = []; for (i = 0; i < 6; i++) tv.push(bg(g, 0.34, 1.1, 0.02, -2.5 + i * 0.37, 2.8, -RD / 2 + 0.13, ['#8DBDB4', '#D1A584', '#C7B8EA', '#DCC48F', '#E59474', '#A9BACB'][i], 0.5));
  an.push(function (t) { tv.forEach(function (m, k) { m.material.opacity = 0.25 + 0.5 * Math.abs(Math.sin(t * 1.6 + k * 0.7)); }); });
  // globo de espelhos + luzes de festa
  var gl = new T.Group(); gl.position.set(0.4, 3.5, 0.6); g.add(gl);
  cil(gl, 0.04, 0.04, 0.5, 0, 0.3, 0, '#8C8F94', 8);
  var esf = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), new T.MeshLambertMaterial({ color: 0xcfd8dc, flatShading: true })); gl.add(esf);
  var luzes = []; for (i = 0; i < 7; i++) luzes.push(bg(g, 0.14, 0.14, 0.14, 0, 0, 0, ['#E59474', '#8DBDB4', '#DCC48F', '#C7B8EA'][i % 4], 0.85));
  an.push(function (t) { esf.rotation.y = t * 1.6; luzes.forEach(function (l, k) { var a6 = t * 0.8 + k * 0.9; l.position.set(0.4 + Math.cos(a6) * (1.4 + k * 0.18), 1.4 + Math.sin(a6 * 1.4 + k) * 0.9, 0.6 + Math.sin(a6) * 1.0); l.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(t * 3 + k)); }); });
  // violão encostado
  var vi = new T.Group(); vi.position.set(-3.3, 0.6, 1.9); vi.rotation.z = 0.25; g.add(vi);
  bx(vi, 0.52, 0.62, 0.2, 0, -0.1, 0, '#a8742f'); bx(vi, 0.4, 0.42, 0.18, 0, 0.3, 0, '#a8742f'); bx(vi, 0.12, 0.8, 0.1, 0, 0.85, 0, '#5a3d2b'); bg(vi, 0.2, 0.2, 0.02, 0, -0.05, 0.11, '#2a1a0a', 1);
  an.push(function (t) { vi.rotation.z = 0.25 + Math.sin(t * 0.6) * 0.02; });
  // bandeirinhas
  for (i = 0; i < 9; i++) { var f = bx(g, 0.22, 0.22, 0.02, -3.0 + i * 0.75, 3.75 - Math.abs(i - 4) * 0.06, -RD / 2 + 0.14, ['#E59474', '#8DBDB4', '#DCC48F'][i % 3]); f.rotation.z = 0.78; }
  tapete(g, -0.6, 1.2, 3.6, 2.2, '#5b5680'); planta(g, 3.4, 1.8, 0.9);
  var conf = []; for (i = 0; i < 14; i++) conf.push(bx(g, 0.08, 0.08, 0.02, 0, 0, 0, ['#E59474', '#8DBDB4', '#DCC48F', '#C7B8EA'][i % 4]));
  an.push(function (t) { conf.forEach(function (c2, k) { var y = ((t * 0.25 + k * 0.07) % 1); c2.position.set(-3 + (k * 0.47) % 6, 3.8 - y * 3.6, -1 + (k % 5) * 0.8); c2.rotation.set(t * 2 + k, t * 3, 0); }); });
  return { anim: an, spots: [
    { x: -2.75, z: 0.62, ry: 0, pose: 'sit', act: 'rir' }, { x: -1.5, z: 0.62, ry: 0, pose: 'sit', act: 'falar' },
    { x: 1.5, z: 1.9, ry: -0.3, pose: 'stand', act: 'dancar' }, { x: 2.6, z: -0.2, ry: -1.4, pose: 'stand', act: 'falar' },
    { x: -0.7, z: 2.1, ry: 0.1, pose: 'stand', act: 'cafe' }, { x: -3.1, z: 1.9, ry: -0.6, pose: 'stand', act: 'acenar' },
    { x: 0.5, z: -0.4, ry: 2.9, pose: 'stand', act: 'dancar' } ] };
};
/* Hardware e IoT — sala de máquinas */
KITS.hw = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#2f353c', piso: '#343a40' });
  var leds = rack(g, -2.9, -1.3, 0, cor).concat(rack(g, -1.85, -1.3, 0, '#8DBDB4')).concat(rack(g, -0.8, -1.3, 0, cor));
  an.push(function (t) { leds.forEach(function (l, k) { l.material.opacity = Math.sin(t * (2 + (k % 5)) + k * 0.6) > 0.2 ? 0.95 : 0.12; }); });
  // osciloscópio
  var osc = new T.Group(); osc.position.set(1.4, 0.88, -1.4); g.add(osc);
  bx(osc, 1.1, 0.8, 0.5, 0, 0.4, 0, '#43474a'); bx(osc, 0.78, 0.52, 0.04, 0, 0.46, 0.26, '#0c1510');
  var onda = []; for (i = 0; i < 18; i++) onda.push(bg(osc, 0.042, 0.05, 0.02, -0.36 + i * 0.042, 0.46, 0.29, '#6cf0a8', 0.95));
  for (i = 0; i < 3; i++) cil(osc, 0.06, 0.06, 0.05, -0.3 + i * 0.3, 0.1, 0.26, '#8C8F94', 10).rotation.x = Math.PI / 2;
  an.push(function (t) { onda.forEach(function (p, k) { p.position.y = 0.46 + Math.sin(k * 0.7 + t * 5) * 0.17 * (0.5 + 0.5 * Math.sin(t * 0.7)); }); });
  mesaRet(g, 1.4, -1.4, 1.3, 0.9, '#52565c', 0.84);
  // bancada de solda com fumaça
  mesaRet(g, 2.9, 0.4, 1.5, 1.0, '#52565c', 0.8);
  bx(g, 0.5, 0.04, 0.4, 2.9, 0.84, 0.4, '#1f7a4a');
  for (i = 0; i < 6; i++) bx(g, 0.07, 0.05, 0.07, 2.74 + (i % 3) * 0.14, 0.88, 0.3 + Math.floor(i / 3) * 0.16, '#2a2b30');
  var ferro = bx(g, 0.07, 0.07, 0.42, 3.3, 0.92, 0.5, '#8C8F94'); ferro.rotation.x = 0.5;
  var pt2 = bg(g, 0.07, 0.07, 0.07, 3.22, 0.9, 0.3, '#ff9a3c', 1);
  var fum = []; for (i = 0; i < 4; i++) fum.push(bg(g, 0.12, 0.12, 0.12, 0, 0, 0, '#ffffff', 0.3));
  an.push(function (t) { fum.forEach(function (f, k) { var y = (t * 0.45 + k * 0.25) % 1; f.position.set(3.22 + Math.sin(t * 2.4 + k) * 0.1, 0.95 + y * 0.8, 0.3); f.material.opacity = 0.3 * (1 - y); }); pt2.material.opacity = 0.7 + Math.sin(t * 7) * 0.3; });
  // drone voando
  var dr = new T.Group(); g.add(dr);
  bx(dr, 0.34, 0.1, 0.34, 0, 0, 0, '#2a2b30'); bg(dr, 0.1, 0.05, 0.1, 0, -0.06, 0.12, '#E59474', 1);
  var hel = []; [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]].forEach(function (p) { bx(dr, 0.1, 0.05, 0.1, p[0], 0.02, p[1], '#46474D'); var h2 = bx(dr, 0.44, 0.02, 0.06, p[0], 0.07, p[1], E('#cfd8dc', 0.55)); hel.push(h2); });
  an.push(function (t) { var a7 = t * 0.6; dr.position.set(Math.cos(a7) * 2.0, 2.5 + Math.sin(t * 1.3) * 0.3, 0.6 + Math.sin(a7) * 1.0); dr.rotation.y = -a7; hel.forEach(function (h2, k) { h2.rotation.y = t * (40 + k); }); });
  // placas na parede
  for (i = 0; i < 4; i++) { quadro(g, 0.6 + (i % 2) * 1.0, 3.2 - Math.floor(i / 2) * 0.85, 0.8, 0.62, -RD / 2 + 0.1, '#1f7a4a'); for (var k2 = 0; k2 < 5; k2++) bg(g, 0.1, 0.06, 0.02, 0.35 + (i % 2) * 1.0 + (k2 % 3) * 0.17, 3.05 - Math.floor(i / 2) * 0.85 + Math.floor(k2 / 3) * 0.2, -RD / 2 + 0.13, '#DCC48F', 0.8); }
  tapete(g, 0.4, 1.6, 3.0, 1.6, cor);
  an.push(poeira(g, '#9fd8ff', 6, 2.8, 0.8));
  return { anim: an, spots: [
    { x: 1.4, z: -0.5, ry: Math.PI, pose: 'stand', act: 'digitar' }, { x: 2.9, z: 1.2, ry: Math.PI, pose: 'stand', act: 'desenhar' },
    { x: -1.8, z: -0.2, ry: Math.PI, pose: 'stand', act: 'anotar' }, { x: -0.4, z: 1.3, ry: 0.2, pose: 'stand', act: 'pensar' },
    { x: 0.9, z: 2.1, ry: 0, pose: 'stand', act: 'olhar' }, { x: -2.7, z: 1.4, ry: -0.4, pose: 'stand', act: 'falar' } ] };
};
/* Recepção */
KITS.lobby = function (g, cor) {
  var an = [], i;
  casca(g, cor, { parede: '#46413a', piso: '#4a443c', porta: false });
  // balcão
  var bal = new T.Group(); bal.position.set(-1.6, 0, -0.5); g.add(bal);
  bx(bal, 3.0, 1.1, 0.8, 0, 0.55, 0, '#6b4423'); bx(bal, 3.2, 0.1, 1.0, 0, 1.12, 0, '#D1A584');
  bx(bal, 3.0, 0.3, 0.06, 0, 0.75, 0.42, shade(cor, 0.7));
  cil(bal, 0.1, 0.1, 0.1, 1.2, 1.2, 0, '#DCC48F', 14); cil(bal, 0.16, 0.16, 0.12, 1.2, 1.25, 0, '#DCC48F', 14);
  var mon = monitorM(bal, -1.0, 1.17, 0, cor, 0.3, 0.7, 0.44);
  an.push(function (t) { mon.material.opacity = 0.6 + Math.sin(t * 1.6) * 0.25; });
  // placa REDE
  quadro(g, -1.6, 3.2, 2.2, 0.9, -RD / 2 + 0.1, '#1b1c20', shade(cor, 0.6));
  var letras = ['R', 'E', 'D', 'E'];
  for (i = 0; i < 4; i++) { bg(g, 0.3, 0.44, 0.03, -2.35 + i * 0.5, 3.2, -RD / 2 + 0.14, cor, 0.95); }
  // elevador
  bx(g, 1.7, 2.6, 0.2, 2.5, 1.3, -RD / 2 + 0.14, '#2f3036');
  var pL = bx(g, 0.78, 2.4, 0.08, 2.11, 1.2, -RD / 2 + 0.26, '#5e646b'), pR2 = bx(g, 0.78, 2.4, 0.08, 2.89, 1.2, -RD / 2 + 0.26, '#5e646b');
  bg(g, 0.05, 2.3, 0.03, 2.5, 1.2, -RD / 2 + 0.31, cor, 0.5); bx(g, 0.16, 0.1, 0.05, 2.3, 1.1, -RD / 2 + 0.31, '#2f3036'); bx(g, 0.16, 0.1, 0.05, 2.7, 1.1, -RD / 2 + 0.31, '#2f3036');
  var nums = []; for (i = 0; i < 4; i++) nums.push(bg(g, 0.14, 0.14, 0.03, 2.2 + i * 0.2, 2.75, -RD / 2 + 0.3, cor, 0.3));
  an.push(function (t) { var f = Math.floor(t * 0.6) % 4, ab = Math.sin(t * 0.3) > 0.86 ? 0.45 : 0; nums.forEach(function (n, k) { n.material.opacity = k === f ? 0.95 : 0.2; }); pL.position.x = 2.11 - ab; pR2.position.x = 2.89 + ab; });
  // quadro de chaves
  bx(g, 1.0, 0.9, 0.08, 0.3, 2.5, -RD / 2 + 0.12, '#5a3d2b');
  for (i = 0; i < 8; i++) bg(g, 0.07, 0.14, 0.03, 0.0 + (i % 4) * 0.2, 2.65 - Math.floor(i / 4) * 0.28, -RD / 2 + 0.17, '#DCC48F', 0.9);
  sofa(g, -2.6, 1.8, -0.2, '#6a5a44', 1.9); mesaRet(g, -1.2, 2.0, 0.8, 0.7, '#5a3d2b', 0.44);
  planta(g, -3.5, 0.6, 1.3); planta(g, 3.4, 1.7, 1.1);
  tapete(g, 0.4, 1.6, 2.6, 2.0, '#8a3b32');
  an.push(poeira(g, '#ffd9a0', 6, 2.6, 0.5));
  return { anim: an, spots: [{ x: -2.9, z: 1.8, ry: -0.2, pose: 'sit', act: 'celular' }, { x: 0.6, z: 1.6, ry: 0, pose: 'stand', act: 'olhar' }] };
};

/* ---------- Hotel ---------- */
function Hotel(canvas, layer, onPick, onFoco) {
  var self = this;
  var sc = new T.Scene();
  sc.add(new T.HemisphereLight(0xffffff, 0x2a2b30, 0.9));
  var dl = new T.DirectionalLight(0xfff1de, 0.55); dl.position.set(5, 12, 16); sc.add(dl);
  var rend = LIB.makeRenderer(canvas);
  var cam = new T.OrthographicCamera(-10, 10, 6, -6, 0.1, 160);
  var DIR = new T.Vector3(0, 0.26, 1).normalize();
  var world = new T.Group(); sc.add(world);
  var pessoas = [], salas = [], byId = {}, ray = new T.Raycaster(), mp = new T.Vector2(), hov = null, hoverOn = false;
  var vis = { cx: 0, cy: 0, hh: 6 }, alvo = { cx: 0, cy: 0, hh: 6 }, foco = -1, pronto = false;
  this.visible = false; this.foco = -1;

  function slot(i, n) { var rows = Math.ceil(n / COLS), c = i % COLS, r = Math.floor(i / COLS), H = rows * RH + (rows - 1) * GY; return { x: (c - (COLS - 1) / 2) * (RW + GX), y: H / 2 - RH - r * (RH + GY) }; }
  function limpar() { while (world.children.length) world.remove(world.children[0]); layer.innerHTML = ''; pessoas = []; salas = []; byId = {}; }

  this.setData = function (rooms) {
    limpar();
    var total = rooms.length + 1;
    rooms.concat([{ id: 'lobby', nome: 'Recepção', cor: '#D1A584', pessoas: [], lobby: true }]).forEach(function (r, i) {
      var s = slot(i, total), g = new T.Group(); g.position.set(s.x, s.y, 0); world.add(g);
      var kit = (KITS[r.id] || KITS.lobby)(g, r.cor);
      var veu = bx(g, RW + 0.4, RH + 0.5, 0.04, 0, RH / 2, RD / 2 + 0.6, new T.MeshBasicMaterial({ color: 0x14141a, transparent: true, opacity: 0 }));
      var sala = { g: g, x: s.x, y: s.y, nome: r.nome, cor: r.cor, kit: kit, veu: veu, idx: i, lobby: !!r.lobby, n: r.pessoas.length };
      salas.push(sala);
      var el = document.createElement('button'); el.className = 'h-rot' + (r.lobby ? ' lob' : ''); el.style.setProperty('--c', r.cor);
      el.innerHTML = '<i class="h-num">' + (r.lobby ? '00' : '0' + (i + 1)) + '</i><b>' + r.nome + '</b><small>' + (r.lobby ? 'entrada' : r.pessoas.length + (r.pessoas.length === 1 ? ' pessoa' : ' pessoas')) + '</small>';
      el.onclick = function (e) { e.stopPropagation(); self.focar(i); };
      layer.appendChild(el); sala.el = el;
      if (r.lobby) { var rec = LIB.makeBot('organizador'); rec.group.scale.setScalar(0.66); rec.group.position.set(s.x - 1.6, s.y, 0.5); rec.group.rotation.y = 0.25; world.add(rec.group); sala.rec = rec; }
      var sp = kit.spots;
      r.pessoas.forEach(function (p, k) {
        var o = makePerson(p.id, ROUPA[hash(p.id) % ROUPA.length]);
        o.sala = sala; o.spots = sp; o.si = k % sp.length;
        var s0 = sp[o.si]; o.pos = new T.Vector2(s0.x, s0.z); o.tgt = o.pos.clone(); o.ry = s0.ry; o.pose = s0.pose; o.act = s0.act || 'parado'; o.actT = 3 + Math.random() * 4; o.wait = 1 + Math.random() * 5;
        o.g.position.set(s.x + o.pos.x, s.y, o.pos.y); o.g.rotation.y = o.ry; world.add(o.g);
        o.dados = p; o.alt = 1.76 + (k % 4) * 0.3;
        var ic = document.createElement('button'); ic.className = 'h-ico s-' + p.status; ic.style.setProperty('--c', p.cor); ic.style.setProperty('--p', p.score + '%');
        ic.setAttribute('aria-label', p.nome + ', score ' + p.score);
        ic.innerHTML = '<span class="h-ring"><i>' + p.ini + '</i></span><span class="h-dado"><b>' + p.nome + '</b><small>' + p.score + ' · ' + p.prazo + ' · ' + o.pf.nome + '</small></span>' +
          (p.status === 'atrasado' ? '<em class="h-ex">!</em>' : p.status === 'semana' ? '<em class="h-rel">●</em>' : '');
        ic.onclick = function (e) { e.stopPropagation(); onPick(p.id); };
        ic.onpointerenter = function () { o.act = 'acenar'; o.actT = 1.8; };
        layer.appendChild(ic); o.el = ic; byId[p.id] = o; pessoas.push(o);
      });
    });
    var rows = Math.ceil(total / COLS);
    alvo.cx = 0; alvo.cy = 0; alvo.hh = (rows * RH + (rows - 1) * GY) / 2 + 0.7;
    vis.cx = alvo.cx; vis.cy = alvo.cy; vis.hh = alvo.hh * 1.15; foco = -1; self.foco = -1; pronto = true; canvas._rs = true;
  };
  this.focar = function (i) {
    if (i < 0 || i >= salas.length) return self.verTudo();
    var s = salas[i]; foco = i; self.foco = i;
    alvo.cx = s.x; alvo.cy = s.y + 2.0; alvo.hh = 2.95;
    if (onFoco) onFoco(i, s);
  };
  this.verTudo = function () {
    var rows = Math.ceil(salas.length / COLS); foco = -1; self.foco = -1;
    alvo.cx = 0; alvo.cy = 0; alvo.hh = (rows * RH + (rows - 1) * GY) / 2 + 0.7;
    if (onFoco) onFoco(-1, null);
  };
  this.destaque = function (id) { var o = byId[id]; if (o) { o.act = 'acenar'; o.actT = 2; } };

  function mundo(e) {
    var r = canvas.getBoundingClientRect();
    mp.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    var v = new T.Vector3(mp.x, mp.y, 0.5).unproject(cam), n = DIR.clone(), d = -v.z / n.z;
    return new T.Vector2(v.x + n.x * d, v.y + n.y * d);
  }
  canvas.addEventListener('pointermove', function (e) { hoverOn = true; self._m = mundo(e); });
  canvas.addEventListener('pointerleave', function () { hoverOn = false; if (hov) { hov.el.classList.remove('hot'); hov = null; } });
  canvas.addEventListener('click', function (e) {
    if (hov) return onPick(hov.dados.id);
    var w = mundo(e), achou = -1;
    salas.forEach(function (s, i) { if (Math.abs(w.x - s.x) < RW / 2 && w.y > s.y - 0.3 && w.y < s.y + RH) achou = i; });
    if (achou >= 0 && achou !== foco) self.focar(achou); else if (achou < 0 && foco >= 0) self.verTudo();
  });
  canvas.addEventListener('dblclick', function () { self.verTudo(); });

  function proj(x, y, z) {
    var v = new T.Vector3(x + DIR.x * z, y + DIR.y * z, 0).project(cam);
    return [(v.x * 0.5 + 0.5) * canvas.clientWidth, (-v.y * 0.5 + 0.5) * canvas.clientHeight];
  }
  this.frame = function (t, dt) {
    if (!pronto) return;
    vis.cx += (alvo.cx - vis.cx) * Math.min(1, dt * 3.4); vis.cy += (alvo.cy - vis.cy) * Math.min(1, dt * 3.4); vis.hh += (alvo.hh - vis.hh) * Math.min(1, dt * 3.4);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h) {
      if (canvas._rs) { rend.setSize(w, h, false); canvas._rs = false; }
      var a = w / h, hh = vis.hh, hw = hh * a, need = (foco >= 0 ? RW / 2 + 0.35 : (COLS * RW + (COLS - 1) * GX) / 2 + 0.5);
      if (hw < need) { hw = need; hh = hw / a; }
      cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.updateProjectionMatrix();
      var desl = 0;
      if (foco >= 0 && w > 980) { var livre = (w - 358) / 2 / w; desl = (0.5 - livre) * 2 * hw; }
      desl += (self._desl === undefined ? desl : self._desl - desl) * 0; self._desl = desl;
      cam.position.set(vis.cx + desl + DIR.x * 60, vis.cy + DIR.y * 60, DIR.z * 60); cam.lookAt(vis.cx + desl, vis.cy, 0);
    }
    salas.forEach(function (s, i) {
      var dim = foco >= 0 && i !== foco;
      s.veu.material.opacity += ((dim ? 0.62 : 0) - s.veu.material.opacity) * Math.min(1, dt * 4);
      s.veu.visible = s.veu.material.opacity > 0.01;
      s.el.classList.toggle('off', dim); s.el.classList.toggle('big', foco === i);
      if (!dim || vis.hh > RH) for (var k = 0; k < s.kit.anim.length; k++) s.kit.anim[k](t);
      if (s.rec) s.rec.update(t, dt, false);
      var q = proj(s.x - RW / 2 + 0.24, s.y + RH + 0.2, -RD / 2);
      s.el.style.transform = 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px) translate(0,-100%)';
    });
    pessoas.forEach(function (o) {
      var s = o.sala, moving = false, dim = foco >= 0 && s.idx !== foco;
      if (o.wait > 0) o.wait -= dt;
      else {
        var dx = o.tgt.x - o.pos.x, dz = o.tgt.y - o.pos.y, d = Math.hypot(dx, dz);
        if (d < 0.06) {
          var sp = o.spots[o.si];
          o.pose = sp.pose; o.ry = sp.ry;
          o.wait = o.pf.pausa[0] + Math.random() * (o.pf.pausa[1] - o.pf.pausa[0]);
          o.act = Math.random() < 0.45 ? (sp.act || 'parado') : o.pf.acoes[Math.floor(Math.random() * o.pf.acoes.length)];
          o.actT = o.wait * 0.85;
          o.si = (o.si + 1 + Math.floor(Math.random() * (o.spots.length - 1))) % o.spots.length;
          var ns = o.spots[o.si]; o.tgt.set(ns.x, ns.z);
        } else {
          o.pos.x += dx / d * o.pf.vel * dt; o.pos.y += dz / d * o.pf.vel * dt;
          o.pose = 'stand'; o.g.rotation.y = Math.atan2(dx, dz); moving = true;
        }
      }
      if (!moving) o.g.rotation.y += (o.ry - o.g.rotation.y) * Math.min(1, dt * 4);
      o.g.position.set(s.x + o.pos.x, s.y, o.pos.y);
      animPerson(o, t, dt, moving);
      if (dim && vis.hh < RH * 1.4) { if (o.el.style.display !== 'none') o.el.style.display = 'none'; return; }
      if (o.el.style.display === 'none') o.el.style.display = '';
      var zoom = foco === s.idx, q = proj(s.x + o.pos.x, s.y + (zoom ? o.alt : 1.8) * o.g.scale.x, o.pos.y);
      o.el.style.transform = 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px) translate(-50%,-100%) scale(' + (zoom ? 1 : 0.76) + ')';
      o.el.classList.toggle('zoom', zoom);
    });
    if (hoverOn && self._m) {
      ray.setFromCamera(mp, cam);
      var alvos = []; pessoas.forEach(function (o) { if (!(foco >= 0 && o.sala.idx !== foco)) alvos = alvos.concat(o.mesh); });
      var hit = ray.intersectObjects(alvos, false)[0], o2 = hit ? byId[hit.object.userData.cid] : null;
      if (o2 !== hov) {
        if (hov) hov.el.classList.remove('hot');
        hov = o2; if (hov) { hov.el.classList.add('hot'); if (hov.act === 'parado') { hov.act = 'acenar'; hov.actT = 1.6; } }
        canvas.style.cursor = hov ? 'pointer' : (foco >= 0 ? 'zoom-out' : 'zoom-in');
      }
    }
    rend.render(sc, cam);
  };
  new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; }, { threshold: 0.02 }).observe(canvas);
  new ResizeObserver(function () { canvas._rs = true; }).observe(canvas);
  LIB.loop(this);
}
root.REDE3D.Hotel = Hotel;
root.REDE3D.PERFIS = PERFIS;
})(window);
