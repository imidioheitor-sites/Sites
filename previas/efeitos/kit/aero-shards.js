/*! AeroShards vanilla (HELU/HEsites) — equivalente em canvas 2D do componente AeroShards do React Bits. Sem dependências, sem WebGL.
 *  Interpretação: fundo DECORATIVO plano com paralaxe (cacos com "profundidade" só como escala/desfoque/opacidade); nenhum objeto ou cena 3D.
 *  Uso:  <div data-aeroshards data-shard-color="#896ABD" data-accent-color="#A855F7" data-count="1300" ...></div>   ou   HeluShards.create(el, {...})
 *  Props: shardColor='#896ABD', accentColor='#A855F7', placement('full'|'center'|'top'|'bottom'|'left'|'right')='full', material('glass'|'matte'|'metal')='glass',
 *         markers('plus'|'none')='plus', count=1300, depthOfField=0.75, vignette=0.3, mouseInteraction=true, pulseOnClick=true, holdToGather=true,
 *         lightMode=false, shardSize=1, spread=1, twist=1, billow=1, speed=1, scale=1, glow=0.35, grain=0.06, intro=true, mouseStrength=0.6, parallax=0.5, paused=false.
 *  Dispositivo fraco, saveData ou prefers-reduced-motion: 1 quadro estático, contagem reduzida. Celular: máx. 450 cacos. Pausa fora da tela/aba oculta. */
(function (root) {
  'use strict';
  var DEF = { shardColor: '#896ABD', accentColor: '#A855F7', placement: 'full', material: 'glass', markers: 'plus', count: 1300, depthOfField: 0.75,
    vignette: 0.3, mouseInteraction: true, pulseOnClick: true, holdToGather: true, lightMode: false, shardSize: 1, spread: 1, twist: 1, billow: 1,
    speed: 1, scale: 1, glow: 0.35, grain: 0.06, intro: true, mouseStrength: 0.6, parallax: 0.5, paused: false };
  var BOOL = { mouseInteraction: 1, pulseOnClick: 1, holdToGather: 1, lightMode: 1, intro: 1, paused: 1 }, STR = { shardColor: 1, accentColor: 1, placement: 1, material: 1, markers: 1 };
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function rgb(h) {
    var c = document.createElement('canvas').getContext('2d'); c.fillStyle = h; var v = c.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
    var m = v.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]];
  }
  function rnd(s) { s = Math.sin(s * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function weak() { var n = navigator, c = n.connection; return !!((c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)); }
  function reduced() { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function Shards(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k); if (c in DEF) { var v = el.dataset[k]; this.o[c] = BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    this.cv = document.createElement('canvas'); this.cv.setAttribute('aria-hidden', 'true');
    this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.insertBefore(this.cv, el.firstChild);
    this.ctx = this.cv.getContext('2d');
    this.static = reduced() || weak();
    this.t0 = performance.now(); this.vis = true; this.m = { x: 0, y: 0, in: false, down: false, dx: 0, dy: 0 }; this.pulses = [];
    this.cols = { s: rgb(this.o.shardColor), a: rgb(this.o.accentColor) };
    this.resize();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el); }
    if ('IntersectionObserver' in root) { this.io = new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; self.kick(); }); this.io.observe(el); }
    document.addEventListener('visibilitychange', function () { self.kick(); });
    if (!this.static) {
      root.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        self.m.in = x >= 0 && y >= 0 && x <= r.width && y <= r.height; self.m.x = x; self.m.y = y;
        self.m.dx = (x / r.width - 0.5); self.m.dy = (y / r.height - 0.5);
      }, { passive: true });
      root.addEventListener('pointerdown', function () { if (!self.m.in) return; self.m.down = true; self.m.t = performance.now(); if (self.o.pulseOnClick) self.pulses.push({ x: self.m.x, y: self.m.y, t: performance.now() }); });
      root.addEventListener('pointerup', function () { self.m.down = false; });
    }
    this.kick();
  }
  Shards.prototype.build = function () {
    var o = this.o, W = this.W, H = this.H, n = Math.round(o.count * (this.static ? 0.5 : 1));
    var cap = (root.innerWidth < 700 ? 450 : 2000); n = Math.min(n, cap);
    var pl = o.placement, S = [], i;
    for (i = 0; i < n; i++) {
      var r1 = rnd(i + 1), r2 = rnd(i + 17), r3 = rnd(i + 31), r4 = rnd(i + 53), r5 = rnd(i + 71), x, y;
      x = r1 * W; y = r2 * H;
      var sp = o.spread;
      if (pl === 'center') { x = W / 2 + (r1 - 0.5) * W * 0.55 * sp; y = H / 2 + (r2 - 0.5) * H * 0.6 * sp; }
      else if (pl === 'top') y = r2 * H * 0.45; else if (pl === 'bottom') y = H - r2 * H * 0.45;
      else if (pl === 'left') x = r1 * W * 0.45; else if (pl === 'right') x = W - r1 * W * 0.45;
      else { x = W / 2 + (r1 - 0.5) * W * sp; y = H / 2 + (r2 - 0.5) * H * sp; }
      S.push({ x: x, y: y, z: r3, ang: r4 * 6.283, spin: (r5 - 0.5) * 0.6, size: (6 + r5 * r5 * 26) * o.shardSize, tw: 0.55 + r4 * 0.4, ph: r3 * 6.283,
        acc: r2 > 0.9, mark: r1 > 0.965, vx: 0, vy: 0, ox: 0, oy: 0, sx: (r1 - 0.5) * W * 0.8, sy: (r2 - 0.5) * H * 0.8, k: r5 });
    }
    this.S = S.sort(function (a, b) { return a.z - b.z; });
    // sprite de brilho pré-renderizado (evita shadowBlur por caco)
    var g = document.createElement('canvas'); g.width = g.height = 64; var gx = g.getContext('2d');
    var gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32); var a = this.cols.a;
    gr.addColorStop(0, 'rgba(' + a.join(',') + ',.9)'); gr.addColorStop(1, 'rgba(' + a.join(',') + ',0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64); this.glowSpr = g;
    var n2 = document.createElement('canvas'); n2.width = n2.height = 128; var nx = n2.getContext('2d'), id = nx.createImageData(128, 128);
    for (i = 0; i < id.data.length; i += 4) { var v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } nx.putImageData(id, 0, 0); this.noise = n2;
  };
  Shards.prototype.resize = function () {
    var r = this.el.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.d = d;
    this.cv.width = Math.round(this.W * d); this.cv.height = Math.round(this.H * d);
    this.build(); this.draw(performance.now());
  };
  Shards.prototype.kick = function () {
    var self = this; if (this.raf || this.static || this.o.paused || !this.vis || document.hidden) return;
    var loop = function (now) { self.raf = 0; if (self.o.paused || !self.vis || document.hidden) return; self.draw(now); self.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  Shards.prototype.draw = function (now) {
    var o = this.o, ctx = this.ctx, d = this.d, W = this.W, H = this.H, S = this.S, m = this.m, i;
    var t = this.static ? 3 : ((now - this.t0) / 1000) * o.speed, el = (now - this.t0) / 1000;
    var intro = o.intro && !this.static ? Math.min(1, el / 2.2) : 1, ei = 1 - Math.pow(1 - intro, 3);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    var light = o.lightMode;
    var bgc = light ? '#f4f1fa' : '#0c0914'; ctx.fillStyle = bgc; ctx.fillRect(0, 0, W, H);
    var sc = this.cols.s, ac = this.cols.a, mat = o.material, par = o.parallax, cx = W / 2, cy = H / 2;
    for (var pi = this.pulses.length - 1; pi >= 0; pi--) if (now - this.pulses[pi].t > 1400) this.pulses.splice(pi, 1);
    var mx = m.in && o.mouseInteraction, ms = o.mouseStrength, rad = Math.min(W, H) * 0.28, hold = m.down && o.holdToGather && mx;
    var focal = 0.62, dof = o.depthOfField;
    for (i = 0; i < S.length; i++) {
      var s = S[i], z = s.z;
      var bx = Math.sin(t * 0.35 + s.ph) * 14 * o.billow * (0.4 + z), by = Math.cos(t * 0.28 + s.ph * 1.3) * 18 * o.billow * (0.4 + z);
      var tx = s.x + bx + (m.dx || 0) * -par * 70 * (z - 0.3), ty = s.y + by + (m.dy || 0) * -par * 70 * (z - 0.3);
      if (mx) {
        var ddx = tx + s.ox - m.x, ddy = ty + s.oy - m.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) + 0.01;
        if (dd < rad) { var f = (1 - dd / rad); var dir = hold ? -1 : 1; s.vx += (ddx / dd) * f * ms * 0.9 * dir; s.vy += (ddy / dd) * f * ms * 0.9 * dir; }
      }
      for (var pj = 0; pj < this.pulses.length; pj++) {
        var P = this.pulses[pj], age = (now - P.t) / 1000, dx2 = tx + s.ox - P.x, dy2 = ty + s.oy - P.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 0.01, ring = age * Math.max(W, H) * 0.7;
        var wv = Math.exp(-Math.pow((d2 - ring) / 60, 2)) * (1 - age / 1.4); if (wv > 0) { s.vx += (dx2 / d2) * wv * 2.2; s.vy += (dy2 / d2) * wv * 2.2; }
      }
      s.vx *= 0.9; s.vy *= 0.9; s.ox += s.vx; s.oy += s.vy; s.ox *= 0.985; s.oy *= 0.985;
      var ix = s.sx * (1 - ei), iy = s.sy * (1 - ei);
      var x = tx + s.ox + ix, y = ty + s.oy + iy;
      if (x < -50 || x > W + 50 || y < -50 || y > H + 50) continue;
      var depthScale = (0.55 + z * 0.9) * o.scale, size = s.size * depthScale;
      var blurK = Math.abs(z - focal) * dof, alpha = (0.28 + 0.6 * (1 - blurK * 0.9)) * ei;
      if (alpha <= 0.01) continue;
      var ang = s.ang + t * 0.25 * o.twist * s.spin * 4 + (s.vx + s.vy) * 0.2;
      var c = Math.cos(ang), sn = Math.sin(ang);
      // caco = triângulo irregular
      var ax = x + c * size, ay = y + sn * size, bx2 = x + (-c * 0.55 - sn * 0.8 * s.tw) * size, by2 = y + (-sn * 0.55 + c * 0.8 * s.tw) * size, cx2 = x + (-c * 0.4 + sn * 0.7) * size * 0.8, cy2 = y + (-sn * 0.4 - c * 0.7) * size * 0.8;
      var col = s.acc ? ac : sc, sh = 0.7 + 0.3 * Math.sin(ang * 2 + z * 4);
      var cr = col[0] * sh, cg = col[1] * sh, cb = col[2] * sh;
      if (light) { cr = cr * 0.8 + 40; cg = cg * 0.8 + 40; cb = cb * 0.8 + 50; }
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (blurK > 0.3 ? 0.65 : 1)));
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx2, by2); ctx.lineTo(cx2, cy2); ctx.closePath();
      if (mat === 'glass') {
        var gr = ctx.createLinearGradient(ax, ay, bx2, by2);
        gr.addColorStop(0, 'rgba(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ',' + (0.35 + 0.2 * sh) + ')'); gr.addColorStop(1, 'rgba(255,255,255,' + (light ? 0.35 : 0.08) + ')');
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (blurK > 0.3 ? 0.06 : 0.22) + ')'; ctx.lineWidth = 0.8; ctx.stroke();
      } else if (mat === 'metal') {
        ctx.fillStyle = 'rgb(' + (cr * 0.6 + sh * 70 | 0) + ',' + (cg * 0.6 + sh * 70 | 0) + ',' + (cb * 0.6 + sh * 80 | 0) + ')'; ctx.fill();
      } else { ctx.fillStyle = 'rgb(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ')'; ctx.fill(); }
      if (s.acc && o.glow > 0 && blurK < 0.5) { ctx.globalAlpha = o.glow * alpha * 0.9; var gs = size * 4; ctx.drawImage(this.glowSpr, x - gs / 2, y - gs / 2, gs, gs); }
      if (s.mark && o.markers === 'plus' && blurK < 0.45) {
        ctx.globalAlpha = 0.75 * ei; ctx.strokeStyle = light ? '#3b2a63' : '#fff'; ctx.lineWidth = 1; var L = 5 + z * 4;
        ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (o.vignette > 0) {
      var vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.25, cx, cy, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, (light ? 'rgba(244,241,250,' : 'rgba(0,0,0,') + Math.min(1, o.vignette * 2) + ')');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }
    if (o.grain > 0 && this.noise) { ctx.globalAlpha = o.grain * 0.5; ctx.globalCompositeOperation = light ? 'multiply' : 'overlay'; ctx.fillStyle = ctx.createPattern(this.noise, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  };
  Shards.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); this.cv.remove(); };
  root.HeluShards = {
    create: function (el, o) { if (el._shards) return el._shards; return (el._shards = new Shards(el, o)); },
    init: function (s) { var l = (s || document).querySelectorAll('[data-aeroshards]'); for (var i = 0; i < l.length; i++) root.HeluShards.create(l[i]); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluShards.init(); }); else root.HeluShards.init();
})(window);
