/* Bots 3D da REDE: personagens em voxel (mesmo traço dos bonecos do painel da Manufactory, agora em 3D de verdade)
 * e as salas isométricas onde cada um mora.
 * Se existir models/<id>.glb (gerado pelo Antigravity/Higgsfield), o perfil usa o GLB no lugar do boneco em voxel:
 * veja window.REDE_GLB mais abaixo. Sem o arquivo, o boneco em voxel continua valendo.
 */
(function (root) {
'use strict';
var T = root.THREE;
var DPR = Math.min(window.devicePixelRatio || 1, 2);

function mat(c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }
function glow(c, k) { return new T.MeshBasicMaterial({ color: c, transparent: k !== undefined, opacity: k === undefined ? 1 : k }); }
function box(g, w, h, d, x, y, z, c, m) {
  var me = new T.Mesh(new T.BoxGeometry(w, h, d), m || mat(c));
  me.position.set(x, y, z); g.add(me); return me;
}
function shade(hex, f) {
  var c = new T.Color(hex); c.multiplyScalar(f); return c;
}

/* ---------- boneco ---------- */
var CORES = {
  organizador: { cor: '#D1A584', luz: '#F0C9A6' },
  estrategista: { cor: '#8DBDB4', luz: '#B7E3DA' },
  agenda: { cor: '#DCC48F', luz: '#F4DFAE' },
  expansor: { cor: '#A9BACB', luz: '#D4E3F2' },
  lembretes: { cor: '#E59474', luz: '#FFB89B' }
};

function makeBot(id) {
  var P = CORES[id] || CORES.organizador;
  var g = new T.Group();
  var corpo = '#2e2f35', metal = '#4a4c55';
  var body = new T.Group(); g.add(body);

  // pernas
  var legL = new T.Group(), legR = new T.Group();
  legL.position.set(-0.13, 0.42, 0); legR.position.set(0.13, 0.42, 0);
  box(legL, 0.15, 0.42, 0.16, 0, -0.21, 0, metal); box(legL, 0.19, 0.08, 0.26, 0, -0.4, 0.04, '#1b1c20');
  box(legR, 0.15, 0.42, 0.16, 0, -0.21, 0, metal); box(legR, 0.19, 0.08, 0.26, 0, -0.4, 0.04, '#1b1c20');
  body.add(legL, legR);

  // tronco
  var torso = new T.Group(); torso.position.y = 0.42; body.add(torso);
  box(torso, 0.56, 0.5, 0.36, 0, 0.28, 0, corpo);
  box(torso, 0.58, 0.1, 0.38, 0, 0.55, 0, shade(P.cor, 0.78));       // ombreira na cor do agente
  box(torso, 0.3, 0.2, 0.02, 0, 0.3, 0.19, P.cor);                    // placa no peito
  box(torso, 0.2, 0.05, 0.03, 0, 0.3, 0.2, '#1b1c20');
  box(torso, 0.62, 0.06, 0.4, 0, 0.02, 0, '#1b1c20');                  // cinto

  // braços
  var armL = new T.Group(), armR = new T.Group();
  armL.position.set(-0.4, 0.72, 0); armR.position.set(0.4, 0.72, 0);
  box(armL, 0.13, 0.42, 0.15, 0, -0.2, 0, corpo); box(armL, 0.15, 0.1, 0.17, 0, -0.44, 0, P.cor);
  box(armR, 0.13, 0.42, 0.15, 0, -0.2, 0, corpo); box(armR, 0.15, 0.1, 0.17, 0, -0.44, 0, P.cor);
  torso.add(armL, armR);

  // cabeça
  var head = new T.Group(); head.position.y = 1.0; body.add(head);
  box(head, 0.14, 0.1, 0.14, 0, 0.0, 0, metal);                         // pescoço
  box(head, 0.56, 0.44, 0.46, 0, 0.3, 0, '#3a3b42');
  box(head, 0.6, 0.06, 0.5, 0, 0.55, 0, shade(P.cor, 0.7));
  box(head, 0.46, 0.2, 0.02, 0, 0.32, 0.24, '#0c0d10');                // viseira
  var olhoL = box(head, 0.1, 0.1, 0.03, -0.1, 0.32, 0.255, null, glow(P.luz));
  var olhoR = box(head, 0.1, 0.1, 0.03, 0.1, 0.32, 0.255, null, glow(P.luz));
  box(head, 0.07, 0.16, 0.12, -0.32, 0.3, 0, P.cor);                    // orelhas
  box(head, 0.07, 0.16, 0.12, 0.32, 0.3, 0, P.cor);
  box(head, 0.03, 0.2, 0.03, 0.14, 0.7, 0, metal);                      // antena
  var ponta = box(head, 0.09, 0.09, 0.09, 0.14, 0.83, 0, null, glow(P.luz));

  var prop = new T.Group(); g.add(prop);
  var extra = { orbit: [], sino: null, radar: null, bolhas: [], dedo: null };
  buildProp(id, g, body, torso, head, prop, armL, armR, P, extra);

  var bot = {
    id: id, group: g, body: body, head: head, armL: armL, armR: armR, legL: legL, legR: legR, torso: torso,
    ponta: ponta, olhos: [olhoL, olhoR], extra: extra, state: 'idle', stateT: 0, walk: 0, hop: 0, seed: Math.random() * 10
  };
  bot.say = function (st, dur) { bot.state = st; bot.stateT = dur || 1.6; };
  bot.update = function (t, dt, moving) { updateBot(bot, t, dt, moving); };
  return bot;
}

function buildProp(id, g, body, torso, head, prop, armL, armR, P, ex) {
  var i;
  if (id === 'organizador') {
    // abas coloridas na cabeça + prancheta na mão direita + pilha de pastas nas costas
    var tabs = ['#D1A584', '#8DBDB4', '#DCC48F', '#A9BACB'];
    for (i = 0; i < 4; i++) box(head, 0.1, 0.1, 0.34, -0.2 + i * 0.13, 0.62, 0, tabs[i]);
    var prancha = new T.Group(); prancha.position.set(0.04, -0.46, 0.18); armR.add(prancha);
    box(prancha, 0.34, 0.42, 0.04, 0, 0.1, 0, '#e9e1d6');
    box(prancha, 0.12, 0.05, 0.05, 0, 0.32, 0.01, '#5a3d2b');
    for (i = 0; i < 4; i++) box(prancha, 0.24, 0.025, 0.05, 0, 0.22 - i * 0.08, 0.02, '#5E5E62');
    for (i = 0; i < 3; i++) box(torso, 0.5, 0.07, 0.26, 0, 0.12 + i * 0.1, -0.3, tabs[i]);
  } else if (id === 'estrategista') {
    // boné de comandante + bandeirinha + bússola no peito
    box(head, 0.62, 0.1, 0.52, 0, 0.62, 0, '#1f3b37');
    box(head, 0.5, 0.08, 0.2, 0, 0.58, 0.32, '#1f3b37');
    box(head, 0.2, 0.06, 0.02, 0, 0.64, 0.27, P.cor);
    var bast = new T.Group(); bast.position.set(0.04, -0.4, 0.12); armR.add(bast);
    box(bast, 0.04, 0.8, 0.04, 0, 0.3, 0, '#46474D');
    ex.flag = box(bast, 0.36, 0.2, 0.03, 0.2, 0.62, 0, P.cor);
    var br = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.03, 20), mat('#DCC48F'));
    br.rotation.x = Math.PI / 2; br.position.set(0, 0.32, 0.215); torso.add(br);
    ex.agulha = box(torso, 0.02, 0.1, 0.02, 0, 0.32, 0.24, '#c0392b');
  } else if (id === 'agenda') {
    // calendário flutuante girando + relógio no peito
    var cal = new T.Group(); cal.position.set(0.85, 1.35, 0.1); g.add(cal); ex.cal = cal;
    box(cal, 0.62, 0.62, 0.06, 0, 0, 0, '#f1ede6');
    box(cal, 0.62, 0.16, 0.08, 0, 0.23, 0, P.cor);
    box(cal, 0.05, 0.1, 0.12, -0.18, 0.34, 0, '#46474D'); box(cal, 0.05, 0.1, 0.12, 0.18, 0.34, 0, '#46474D');
    for (i = 0; i < 12; i++) box(cal, 0.09, 0.07, 0.075, -0.22 + (i % 4) * 0.147, 0.1 - Math.floor(i / 4) * 0.13, 0, i === 6 ? '#c0392b' : '#8C8F94');
    var rel = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.03, 24), mat('#f1ede6'));
    rel.rotation.x = Math.PI / 2; rel.position.set(0, 0.32, 0.215); torso.add(rel);
    ex.ponteiro = box(torso, 0.015, 0.08, 0.02, 0, 0.35, 0.24, '#1b1c20');
    ex.ponteiro.geometry.translate(0, 0.04, 0); ex.ponteiro.position.y = 0.32;
  } else if (id === 'expansor') {
    // parabólica nas costas + nós de rede orbitando
    var dish = new T.Group(); dish.position.set(0, 0.45, -0.3); torso.add(dish); ex.radar = dish;
    box(dish, 0.05, 0.3, 0.05, 0, 0.1, 0, '#46474D');
    var cone = new T.Mesh(new T.ConeGeometry(0.26, 0.2, 18, 1, true), new T.MeshLambertMaterial({ color: P.cor, side: T.DoubleSide }));
    cone.rotation.x = -Math.PI / 2.4; cone.position.set(0, 0.34, -0.02); dish.add(cone);
    box(dish, 0.03, 0.03, 0.2, 0, 0.36, 0.11, '#46474D');
    for (i = 0; i < 4; i++) {
      var n = new T.Mesh(new T.SphereGeometry(0.07, 14, 12), glow(P.luz)); g.add(n);
      ex.orbit.push({ m: n, a: i * Math.PI / 2, r: 0.85 + (i % 2) * 0.12, h: 0.7 + i * 0.28 });
    }
  } else if (id === 'lembretes') {
    // sino na cabeça balançando + bolhas de notificação
    var sino = new T.Group(); sino.position.set(0, 0.7, 0); head.add(sino); ex.sino = sino;
    var cup = new T.Mesh(new T.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), mat('#DCC48F'));
    cup.position.y = -0.02; sino.add(cup);
    box(sino, 0.34, 0.03, 0.34, 0, -0.04, 0, '#b8975a');
    var bad = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), mat('#46474D')); bad.position.y = -0.1; sino.add(bad);
    for (i = 0; i < 3; i++) {
      var b = new T.Group(); g.add(b);
      box(b, 0.34, 0.2, 0.05, 0, 0, 0, '#f1ede6'); box(b, 0.22, 0.03, 0.06, -0.03, 0.03, 0, '#8C8F94'); box(b, 0.14, 0.03, 0.06, -0.07, -0.03, 0, '#8C8F94');
      box(b, 0.07, 0.07, 0.08, 0.15, 0.1, 0, '#c0392b');
      ex.bolhas.push({ m: b, a: i * 2.1, r: 0.9 });
    }
  }
}

function updateBot(b, t, dt, moving) {
  var s = b.seed, bob, k;
  b.stateT = Math.max(0, b.stateT - dt);
  if (b.stateT === 0 && b.state !== 'idle') b.state = 'idle';
  b.walk += moving ? dt * 9 : 0;
  bob = moving ? Math.abs(Math.sin(b.walk)) * 0.05 : Math.sin(t * 1.8 + s) * 0.018;
  var st = b.state, hopY = 0, rotY = 0;
  // pernas e braços (andando)
  var sw = moving ? Math.sin(b.walk) * 0.7 : 0;
  b.legL.rotation.x = sw; b.legR.rotation.x = -sw;
  var armLx = -sw * 0.6, armRx = sw * 0.6, armRz = 0, armLz = 0, headY = Math.sin(t * 0.6 + s) * 0.25, headX = 0, torsoX = 0;
  if (st === 'wave') {
    armRz = -2.5 + Math.sin(t * 9) * 0.4; armRx = 0;
  } else if (st === 'think') {
    armRx = -1.6; armRz = 0.15; headX = 0.18; headY = Math.sin(t * 2) * 0.3;
  } else if (st === 'dance') {
    k = t * 6; hopY = Math.abs(Math.sin(k)) * 0.14; armLz = 2.2 + Math.sin(k) * 0.5; armRz = -2.2 - Math.cos(k) * 0.5;
    rotY = Math.sin(k * 0.5) * 0.5; headY = Math.sin(k) * 0.4; armLx = 0; armRx = 0;
  } else if (st === 'jump') {
    k = 1 - b.stateT / 1.0; hopY = Math.sin(Math.min(1, Math.max(0, k)) * Math.PI) * 0.7; armLz = 1.4; armRz = -1.4; armLx = 0; armRx = 0;
  } else if (st === 'nod') {
    headX = Math.sin(t * 10) * 0.2;
  }
  b.body.position.y = bob + hopY; b.body.rotation.y = rotY;
  b.armL.rotation.x = armLx; b.armR.rotation.x = armRx; b.armL.rotation.z = armLz; b.armR.rotation.z = armRz;
  b.head.rotation.y = headY; b.head.rotation.x = headX;
  // brilho da antena e piscada
  var pisca = (Math.sin(t * 2.2 + s) > 0.985) ? 0.1 : 1;
  b.olhos[0].scale.y = b.olhos[1].scale.y = pisca;
  b.ponta.material.opacity = 1; b.ponta.scale.setScalar(1 + Math.sin(t * 4 + s) * 0.18);
  // props
  var e = b.extra, i;
  if (e.cal) { e.cal.rotation.y = t * 0.8; e.cal.position.y = 1.35 + Math.sin(t * 1.4) * 0.07; }
  if (e.ponteiro) e.ponteiro.rotation.z = -t * 0.8;
  if (e.agulha) e.agulha.rotation.z = Math.sin(t * 1.3) * 1.2;
  if (e.flag) e.flag.rotation.y = Math.sin(t * 5) * 0.2;
  if (e.radar) e.radar.rotation.y = Math.sin(t * 0.9) * 1.1;
  for (i = 0; i < e.orbit.length; i++) {
    var o = e.orbit[i], a = o.a + t * 0.9;
    o.m.position.set(Math.cos(a) * o.r, o.h + Math.sin(t * 1.5 + i) * 0.06, Math.sin(a) * o.r);
  }
  if (e.sino) e.sino.rotation.z = Math.sin(t * (st === 'wave' || st === 'dance' ? 12 : 2.4)) * (st === 'idle' ? 0.12 : 0.4);
  for (i = 0; i < e.bolhas.length; i++) {
    var q = e.bolhas[i], aa = q.a + t * 0.7;
    q.m.position.set(Math.cos(aa) * q.r, 1.2 + i * 0.28 + Math.sin(t * 1.6 + i) * 0.05, Math.sin(aa) * q.r);
    q.m.rotation.y = -aa + Math.PI / 2;
  }
}

/* ---------- sala isométrica ---------- */
function floor(g, n, c1, c2) {
  var i, j;
  for (i = 0; i < n; i++) for (j = 0; j < n; j++) box(g, 1, 0.1, 1, i - n / 2 + 0.5, -0.05, j - n / 2 + 0.5, (i + j) % 2 ? c1 : c2);
}
function planta(g, x, z) {
  box(g, 0.34, 0.28, 0.34, x, 0.14, z, '#5a3d2b');
  box(g, 0.5, 0.4, 0.5, x, 0.5, z, '#3f6b5c'); box(g, 0.34, 0.34, 0.34, x, 0.84, z, '#4f857d'); box(g, 0.18, 0.2, 0.18, x + 0.06, 1.1, z, '#8DBDB4');
}
function mesa(g, x, z, w, d, cor) {
  box(g, w, 0.08, d, x, 0.74, z, cor || '#7E573E');
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { box(g, 0.08, 0.7, 0.08, x + p[0] * (w / 2 - 0.08), 0.35, z + p[1] * (d / 2 - 0.08), '#3A3B42'); });
}
function monitor(g, x, y, z, cor, ry) {
  var m = new T.Group(); m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m);
  box(m, 0.8, 0.5, 0.06, 0, 0.35, 0, '#15161a'); box(m, 0.72, 0.42, 0.02, 0, 0.35, 0.04, null, glow(cor, 0.9));
  box(m, 0.1, 0.12, 0.1, 0, 0.04, 0, '#3A3B42'); box(m, 0.3, 0.03, 0.2, 0, 0, 0, '#3A3B42');
  return m;
}

function buildRoom(scene, id, accent) {
  var g = new T.Group(); scene.add(g);
  var N = 8, H = 3.2, i;
  floor(g, N, '#34353b', '#2b2c31');
  // paredes (fundo esquerdo e fundo direito)
  box(g, N, H, 0.18, 0, H / 2, -N / 2 - 0.09, '#3a3b42');
  box(g, 0.18, H, N, -N / 2 - 0.09, H / 2, 0, '#35363c');
  box(g, N, 0.14, 0.2, 0, 0.07, -N / 2 - 0.09, '#1b1c20'); box(g, 0.2, 0.14, N, -N / 2 - 0.09, 0.07, 0, '#1b1c20');
  box(g, N, 0.06, 0.22, 0, H - 0.4, -N / 2 - 0.08, null, glow(accent));
  box(g, 0.22, 0.06, N, -N / 2 - 0.08, H - 0.4, 0, null, glow(accent));
  // tapete
  box(g, 3.2, 0.03, 2.6, 0.2, 0.02, 0.8, shade(accent, 0.28)); box(g, 2.9, 0.035, 2.3, 0.2, 0.02, 0.8, shade(accent, 0.18));
  planta(g, 3.3, -3.3); planta(g, -3.3, 3.2);
  var luz = new T.PointLight(accent, 0.9, 9); luz.position.set(0, 2.4, 0); scene.add(luz);

  var anim = [];
  if (id === 'organizador') {
    // arquivos
    for (i = 0; i < 4; i++) {
      var ar = new T.Group(); ar.position.set(-3.1 + i * 0.95, 0, -3.5); g.add(ar);
      box(ar, 0.85, 1.7, 0.6, 0, 0.85, 0, '#4a4c55');
      for (var d = 0; d < 3; d++) { box(ar, 0.7, 0.4, 0.04, 0, 0.35 + d * 0.5, 0.31, '#2e2f35'); box(ar, 0.2, 0.05, 0.06, 0, 0.35 + d * 0.5, 0.34, accent); }
    }
    // mesa de triagem com três caixas (origem)
    mesa(g, 2.2, 0.4, 2.2, 1.0, '#5a3d2b');
    var cx = ['#D1A584', '#8DBDB4', '#A9BACB'];
    for (i = 0; i < 3; i++) { box(g, 0.6, 0.16, 0.5, 1.5 + i * 0.7, 0.86, 0.4, cx[i]); box(g, 0.5, 0.02, 0.4, 1.5 + i * 0.7, 0.95, 0.4, '#e9e1d6'); }
    monitor(g, 2.6, 0.78, 0.0, accent, -0.5);
    // pilha de cartões que cai da esteira
    var cards = [];
    for (i = 0; i < 5; i++) { var cd = box(g, 0.3, 0.04, 0.2, -1 + i * 0.1, 0.9, 1.8, '#e9e1d6'); cards.push(cd); }
    anim.push(function (t) { cards.forEach(function (c, k) { c.position.x = -2.6 + ((t * 0.5 + k * 0.28) % 1.4) * 2.4; c.position.y = 0.9; c.rotation.y = Math.sin(t + k) * 0.2; }); });
    box(g, 4.2, 0.12, 0.45, -1.1, 0.78, 1.8, '#1b1c20');
  } else if (id === 'estrategista') {
    // quadro branco com setas e nós
    box(g, 3.6, 1.7, 0.08, -0.4, 1.7, -N / 2 + 0.06, '#e9e1d6'); box(g, 3.8, 1.9, 0.05, -0.4, 1.7, -N / 2 + 0.03, '#46474D');
    var nodes = [[-1.7, 2.2], [-0.5, 2.4], [0.6, 2.1], [-1.2, 1.4], [0.1, 1.3], [1.0, 1.5]];
    nodes.forEach(function (p) { box(g, 0.34, 0.24, 0.1, p[0], p[1], -N / 2 + 0.13, accent); });
    [[-1.7, 2.2, -0.5, 2.4], [-0.5, 2.4, 0.6, 2.1], [-1.2, 1.4, 0.1, 1.3], [0.1, 1.3, 1.0, 1.5], [-0.5, 2.4, -1.2, 1.4], [0.6, 2.1, 1.0, 1.5]].forEach(function (l) {
      var dx = l[2] - l[0], dy = l[3] - l[1], len = Math.hypot(dx, dy);
      var ln = box(g, len, 0.04, 0.05, (l[0] + l[2]) / 2, (l[1] + l[3]) / 2, -N / 2 + 0.12, '#46474D'); ln.rotation.z = Math.atan2(dy, dx);
    });
    // mesa de tabuleiro (xadrez)
    mesa(g, 2.0, 0.6, 2.0, 2.0, '#2e2f35');
    for (i = 0; i < 4; i++) for (var j = 0; j < 4; j++) box(g, 0.34, 0.02, 0.34, 1.35 + i * 0.34, 0.8, -0.1 + j * 0.34, (i + j) % 2 ? '#e9e1d6' : '#46474D');
    [[1.5, 0.1, 0.34], [2.2, 0.8, 0.46], [1.85, 0.45, 0.3]].forEach(function (p) { box(g, 0.12, p[2], 0.12, p[0] + 0.0, 0.8 + p[2] / 2, -0.1 + p[1] * 0.5, accent); });
    // globo
    var gl = new T.Mesh(new T.SphereGeometry(0.42, 18, 14), mat('#4f857d')); gl.position.set(-3.0, 1.25, -2.6); g.add(gl);
    box(g, 0.08, 0.7, 0.08, -3.0, 0.5, -2.6, '#46474D'); box(g, 0.5, 0.06, 0.5, -3.0, 0.03, -2.6, '#46474D');
    anim.push(function (t) { gl.rotation.y = t * 0.5; });
  } else if (id === 'agenda') {
    // calendário gigante na parede + relógio
    box(g, 3.0, 2.0, 0.1, -0.8, 1.7, -N / 2 + 0.07, '#f1ede6'); box(g, 3.0, 0.42, 0.12, -0.8, 2.5, -N / 2 + 0.07, accent);
    for (i = 0; i < 28; i++) box(g, 0.34, 0.2, 0.12, -2.0 + (i % 7) * 0.4, 2.0 - Math.floor(i / 7) * 0.3, -N / 2 + 0.13, (i === 11 || i === 19) ? '#c0392b' : (i === 15 ? accent : '#B9B9BC'));
    var rel = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.1, 28), mat('#f1ede6')); rel.rotation.x = Math.PI / 2; rel.position.set(1.7, 2.3, -N / 2 + 0.1); g.add(rel);
    var hp = box(g, 0.04, 0.34, 0.04, 1.7, 2.3, -N / 2 + 0.2, '#1b1c20'); hp.geometry.translate(0, 0.17, 0);
    var mp = box(g, 0.03, 0.46, 0.04, 1.7, 2.3, -N / 2 + 0.22, '#c0392b'); mp.geometry.translate(0, 0.23, 0);
    anim.push(function (t) { mp.rotation.z = -t * 0.8; hp.rotation.z = -t * 0.07; });
    // mesa com agenda aberta e monitor
    mesa(g, 2.0, 0.6, 2.2, 1.1, '#5a3d2b');
    monitor(g, 2.4, 0.78, 0.4, accent, -0.4);
    box(g, 0.6, 0.03, 0.42, 1.4, 0.8, 0.8, '#f1ede6');
    // slots de tempo flutuando
    var slots = [];
    for (i = 0; i < 4; i++) slots.push(box(g, 0.9, 0.12, 0.06, -2.5, 0.5 + i * 0.3, 1.0 + i * 0.2, i % 2 ? accent : shade(accent, 0.6)));
    anim.push(function (t) { slots.forEach(function (s, k) { s.position.x = -2.5 + Math.sin(t * 0.8 + k) * 0.25; }); });
  } else if (id === 'expansor') {
    // mapa-múndi de pontos na parede + antena
    box(g, 4.2, 2.0, 0.08, -0.4, 1.7, -N / 2 + 0.06, '#1f2227');
    var pins = [];
    for (i = 0; i < 26; i++) {
      var px = -2.3 + ((i * 37) % 21) * 0.19, py = 1.0 + ((i * 53) % 9) * 0.19;
      pins.push(box(g, 0.12, 0.12, 0.08, px, py, -N / 2 + 0.12, null, glow(i % 5 === 0 ? '#fff4d6' : accent, 0.35)));
    }
    anim.push(function (t) { pins.forEach(function (p, k) { p.material.opacity = 0.25 + 0.65 * Math.abs(Math.sin(t * 1.3 + k)); }); });
    // torre de antena
    box(g, 0.12, 2.6, 0.12, 3.1, 1.3, -3.0, '#46474D'); box(g, 0.5, 0.06, 0.5, 3.1, 2.0, -3.0, '#46474D');
    var bea = box(g, 0.2, 0.2, 0.2, 3.1, 2.7, -3.0, null, glow('#fff4d6'));
    anim.push(function (t) { bea.scale.setScalar(1 + Math.sin(t * 4) * 0.3); });
    // mesa de conexões: cartões que viram contatos
    mesa(g, 2.2, 0.8, 2.2, 1.0, '#2e2f35');
    for (i = 0; i < 4; i++) box(g, 0.34, 0.05, 0.22, 1.5 + i * 0.5, 0.82, 0.8, i === 3 ? accent : '#e9e1d6');
    monitor(g, 2.0, 0.78, 0.5, accent, -0.4);
  } else if (id === 'lembretes') {
    // parede de post-its
    box(g, 3.6, 2.0, 0.08, -0.6, 1.7, -N / 2 + 0.06, '#2e2f35');
    var pc = ['#DCC48F', '#E59474', '#8DBDB4', '#D1A584', '#A9BACB'];
    for (i = 0; i < 15; i++) box(g, 0.5, 0.5, 0.05, -2.2 + (i % 5) * 0.62, 2.4 - Math.floor(i / 5) * 0.62, -N / 2 + 0.12, pc[(i * 3) % 5]).rotation.z = ((i * 17) % 7 - 3) * 0.04;
    // sino grande + pilha de cartas
    var sn = new T.Group(); sn.position.set(2.8, 1.9, -3.1); g.add(sn);
    var cup2 = new T.Mesh(new T.SphereGeometry(0.4, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.9), mat('#DCC48F')); sn.add(cup2);
    box(sn, 0.84, 0.05, 0.84, 0, -0.12, 0, '#b8975a'); box(sn, 0.04, 0.4, 0.04, 0, 0.5, 0, '#46474D');
    anim.push(function (t) { sn.rotation.z = Math.sin(t * 2.4) * 0.15; });
    mesa(g, 2.2, 0.8, 2.2, 1.0, '#5a3d2b');
    for (i = 0; i < 4; i++) box(g, 0.5, 0.05, 0.34, 1.6, 0.82 + i * 0.05, 0.8, i % 2 ? '#e9e1d6' : '#f6f2ea').rotation.y = i * 0.18;
    monitor(g, 2.7, 0.78, 0.5, accent, -0.4);
  }
  return { group: g, anim: anim };
}

/* ---------- renderer util ---------- */
function makeRenderer(canvas) {
  var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  r.setPixelRatio(DPR); r.setClearColor(0x000000, 0); return r;
}
function fit(r, cam, canvas, ortho) {
  var w = canvas.clientWidth || canvas.parentNode.clientWidth, h = canvas.clientHeight || canvas.parentNode.clientHeight;
  if (!w || !h) return false;
  r.setSize(w, h, false);
  if (ortho) { var s = ortho, a = w / h; cam.left = -s * a; cam.right = s * a; cam.top = s; cam.bottom = -s; }
  else cam.aspect = w / h;
  cam.updateProjectionMatrix(); return true;
}

var LOOP = [];
var running = false, last = 0;
function tick(now) {
  var t = now / 1000, dt = Math.min(0.05, t - last); last = t;
  for (var i = 0; i < LOOP.length; i++) if (LOOP[i].visible) LOOP[i].frame(t, dt);
  if (document.hidden) { running = false; return; }
  requestAnimationFrame(tick);
}
function start() { if (running) return; running = true; last = performance.now() / 1000; requestAnimationFrame(tick); }
document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });

/* ---------- sala no painel ---------- */
function RoomView(canvas, id, accent) {
  var self = this;
  var sc = new T.Scene();
  sc.add(new T.HemisphereLight(0xffffff, 0x2a2b30, 0.85));
  var dl = new T.DirectionalLight(0xfff1de, 0.7); dl.position.set(5, 9, 6); sc.add(dl);
  var room = buildRoom(sc, id, accent);
  var bot = makeBot(id); sc.add(bot.group);
  var rend = makeRenderer(canvas);
  var cam = new T.OrthographicCamera(-5, 5, 5, -5, 0.1, 60);
  cam.position.set(11, 9.5, 11); cam.lookAt(0, 0.7, 0);
  var wp = [[-0.6, 1.2], [1.2, 2.0], [-1.8, 0.2], [0.4, -0.6], [-0.2, 2.2]], wi = 0, pos = new T.Vector2(wp[0][0], wp[0][1]), wait = 1.2;
  bot.group.position.set(pos.x, 0, pos.y);
  var mouse = null, sized = false;
  this.bot = bot; this.visible = false;
  canvas.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mouse = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; if (bot.state === 'idle') bot.say('wave', 1.6); });
  canvas.addEventListener('pointerleave', function () { mouse = null; });
  this.frame = function (t, dt) {
    if (!sized || canvas._rs) { sized = fit(rend, cam, canvas, 3.5); canvas._rs = false; }
    var moving = false;
    if (wait > 0) wait -= dt;
    else {
      var tx = wp[wi][0], tz = wp[wi][1], dx = tx - pos.x, dz = tz - pos.y, d = Math.hypot(dx, dz);
      if (d < 0.06) { wi = (wi + 1) % wp.length; wait = 2 + Math.random() * 3; if (Math.random() < 0.5) bot.say(['think', 'wave', 'nod'][Math.floor(Math.random() * 3)], 2); }
      else { pos.x += dx / d * 0.7 * dt; pos.y += dz / d * 0.7 * dt; bot.group.rotation.y = Math.atan2(dx, dz); moving = true; }
    }
    bot.group.position.set(pos.x, 0, pos.y);
    bot.update(t, dt, moving);
    for (var i = 0; i < room.anim.length; i++) room.anim[i](t);
    rend.render(sc, cam);
  };
  new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);
  new ResizeObserver(function () { canvas._rs = true; }).observe(canvas);
  LOOP.push(this); start();
}

/* ---------- perfil (viewer 3D interativo) ---------- */
function ProfileView(canvas) {
  var self = this;
  var sc = new T.Scene();
  sc.add(new T.HemisphereLight(0xffffff, 0x2a2b30, 0.95));
  var dl = new T.DirectionalLight(0xfff1de, 0.9); dl.position.set(3, 6, 5); sc.add(dl);
  var rim = new T.PointLight(0xffffff, 0.8, 10); rim.position.set(-3, 2, -3); sc.add(rim);
  var rend = makeRenderer(canvas);
  var cam = new T.PerspectiveCamera(36, 1, 0.1, 40);
  var holder = new T.Group(); sc.add(holder);
  var ped = new T.Group(); sc.add(ped);
  var bot = null, yaw = 0.5, pitch = 0.12, dist = 6.4, auto = true, vel = 0, dragging = false, lx = 0, ly = 0, sized = false, tgtY = 1.35;
  this.visible = false;
  function pedestal(color) {
    while (ped.children.length) ped.remove(ped.children[0]);
    var base = new T.Mesh(new T.CylinderGeometry(1.0, 1.1, 0.16, 36), mat('#2a2b30')); base.position.y = -0.08; ped.add(base);
    var ring = new T.Mesh(new T.TorusGeometry(0.98, 0.025, 8, 60), glow(color)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.005; ped.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(1.14, 0.015, 8, 60), glow(color, 0.4)); ring2.rotation.x = Math.PI / 2; ring2.position.y = -0.1; ped.add(ring2);
  }
  this.set = function (id, accent) {
    if (bot) holder.remove(bot.group);
    bot = makeBot(id); bot.group.scale.setScalar(1.35); holder.add(bot.group); pedestal(accent); self.bot = bot;
    yaw = 0.5; dist = 6.4; auto = true;
    var url = (root.REDE_GLB || {})[id];
    if (url && T.GLTFLoader) { // upgrade opcional para o modelo gerado
      new T.GLTFLoader().load(url, function (gl) { holder.remove(bot.group); gl.scene.scale.setScalar(1.6); holder.add(gl.scene); });
    }
  };
  this.say = function (st, d) { if (bot) bot.say(st, d); };
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', function (e) { dragging = true; auto = false; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); if (bot && bot.state === 'idle') bot.say('jump', 1); });
  canvas.addEventListener('pointermove', function (e) { if (!dragging) return; vel = (e.clientX - lx) * 0.01; yaw += vel; pitch = Math.max(-0.2, Math.min(0.6, pitch + (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener('pointerup', function () { dragging = false; });
  canvas.addEventListener('wheel', function (e) { e.preventDefault(); dist = Math.max(3.2, Math.min(8, dist + e.deltaY * 0.004)); }, { passive: false });
  this.frame = function (t, dt) {
    if (!bot) return;
    if (!sized || canvas._rs) { sized = fit(rend, cam, canvas, 0); canvas._rs = false; }
    if (!dragging) { if (auto) yaw += dt * 0.4; else { yaw += vel; vel *= 0.94; } }
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, tgtY + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
    cam.lookAt(0, tgtY, 0);
    bot.update(t, dt, false);
    rend.render(sc, cam);
  };
  new ResizeObserver(function () { canvas._rs = true; }).observe(canvas);
  LOOP.push(this); start();
}


root.REDE3D = { RoomView: RoomView, ProfileView: ProfileView, CORES: CORES,
  _lib: { mat: mat, glow: glow, box: box, shade: shade, makeRenderer: makeRenderer, makeBot: makeBot,
          loop: function (v) { LOOP.push(v); start(); } } };
})(window);
