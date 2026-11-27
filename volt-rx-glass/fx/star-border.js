/*! StarBorder vanilla (HELU/HEsites) — equivalente em canvas 2D do StarBorder do React Bits (estrela de luz que percorre a borda do botão). Sem dependências.
 *  Uso:  <a class="btn" data-starborder data-radius="999" data-duration="4" data-glow=".6">Chamar no WhatsApp</a>   ou   HeluStar.create(el, {...})
 *  Props (mesmos nomes/padrões): color, trailColor, duration=4, direction('clockwise'|'counterclockwise'), stars=1 (1–6), trailLength=0.3, thickness=1, radius=12,
 *  glow=0.6, hover('lap'|'brighten'|'reveal'|'none')='lap', sparkle=false, clickPulse=true, theme('dark'|'light')='dark', backgroundColor, textColor, borderColor.
 *  Funciona em qualquer elemento (a, button, div). prefers-reduced-motion: estrela parada na posição inicial, sem pulso. Pausa fora da tela. */
(function (root) {
  'use strict';
  var THEMES = { dark: { surface: '#0c0c0f', text: '#fafafa', track: 'rgba(255,255,255,0.1)', light: '#ffffff' },
    light: { surface: '#ffffff', text: '#18181b', track: 'rgba(24,24,27,0.12)', light: '#18181b' } };
  var BLEED = 48, LAP = 0.9, TAU = Math.PI * 2, WHITE = [255, 255, 255];
  var DEF = { color: '', trailColor: '', duration: 4, direction: 'clockwise', stars: 1, trailLength: 0.3, thickness: 1, radius: 12, glow: 0.6, hover: 'lap', sparkle: false,
    clickPulse: true, theme: 'dark', backgroundColor: '', textColor: '', borderColor: '' };
  var BOOL = { sparkle: 1, clickPulse: 1 }, STR = { color: 1, trailColor: 1, direction: 1, hover: 1, theme: 1, backgroundColor: 1, textColor: 1, borderColor: 1 };
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function wrap(v, t) { return ((v % t) + t) % t; }
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  var cc = null;
  function toRgb(color) {
    cc = cc || document.createElement('canvas').getContext('2d'); if (!cc) return WHITE;
    cc.fillStyle = '#000000'; cc.fillStyle = color; var v = String(cc.fillStyle);
    if (v.charAt(0) === '#') { var h = parseInt(v.slice(1, 7), 16); return [(h >> 16) & 255, (h >> 8) & 255, h & 255]; }
    var p = (v.match(/[\d.]+/g) || []).map(Number); return p.length > 2 ? [p[0], p[1], p[2]] : WHITE;
  }
  function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function outline(w, h, radius) {
    var r = Math.max(0, Math.min(radius, w / 2, h / 2)), arc = Math.PI * r / 2, across = Math.max(0, w - 2 * r), down = Math.max(0, h - 2 * r);
    var seg = [{ length: across, x: r, y: 0, dx: 1, dy: 0, angle: null }, { length: arc, x: w - r, y: r, dx: 0, dy: 0, angle: -Math.PI / 2 },
      { length: down, x: w, y: r, dx: 0, dy: 1, angle: null }, { length: arc, x: w - r, y: h - r, dx: 0, dy: 0, angle: 0 },
      { length: across, x: w - r, y: h, dx: -1, dy: 0, angle: null }, { length: arc, x: r, y: h - r, dx: 0, dy: 0, angle: Math.PI / 2 },
      { length: down, x: 0, y: h - r, dx: 0, dy: -1, angle: null }, { length: arc, x: r, y: r, dx: 0, dy: 0, angle: Math.PI }];
    var total = 0; seg.forEach(function (s) { total += s.length; });
    return { r: r, segments: seg, total: Math.max(1, total) };
  }
  function pointAt(shape, d, p) {
    var s = wrap(d, shape.total);
    for (var i = 0; i < shape.segments.length; i++) {
      var g = shape.segments[i];
      if (g.length > 0 && s <= g.length) {
        if (g.angle === null) { p.x = g.x + g.dx * s; p.y = g.y + g.dy * s; p.nx = g.dy; p.ny = -g.dx; }
        else { var a = g.angle + s / shape.r; p.nx = Math.cos(a); p.ny = Math.sin(a); p.x = g.x + p.nx * shape.r; p.y = g.y + p.ny * shape.r; }
        return p;
      }
      s -= g.length;
    }
    return p;
  }
  function project(shape, px, py) {
    var best = Infinity, found = 0, offset = 0;
    shape.segments.forEach(function (g) {
      if (g.length > 0) {
        var s, x, y;
        if (g.angle === null) { s = clamp((px - g.x) * g.dx + (py - g.y) * g.dy, 0, g.length); x = g.x + g.dx * s; y = g.y + g.dy * s; }
        else {
          var a = wrap(Math.atan2(py - g.y, px - g.x) - g.angle, TAU);
          if (a > Math.PI / 2) a = a > Math.PI * 1.25 ? 0 : Math.PI / 2;
          s = a * shape.r; x = g.x + Math.cos(g.angle + a) * shape.r; y = g.y + Math.sin(g.angle + a) * shape.r;
        }
        var d = (px - x) * (px - x) + (py - y) * (py - y);
        if (d < best) { best = d; found = offset + s; }
      }
      offset += g.length;
    });
    return found;
  }

  function Star(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k.replace(/^starborder/, '')); c = c.charAt(0).toLowerCase() + c.slice(1); if (c in DEF) { var v = el.dataset[k]; this.o[c] = BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    var o = this.o, th = THEMES[o.theme] || THEMES.dark;
    o.stars = clamp(Math.round(o.stars), 1, 6); o.trailLength = clamp(o.trailLength, 0, 1); o.glow = clamp(o.glow, 0, 1); o.duration = Math.max(0.3, o.duration);
    o.thickness = Math.max(0.5, o.thickness); o.radius = Math.max(0, o.radius);
    var light = o.color || th.light;
    this.c1 = toRgb(light); this.c2 = toRgb(o.trailColor || light);
    this.sign = o.direction === 'counterclockwise' ? -1 : 1;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.classList.add('star-border');
    el.style.borderRadius = o.radius + 'px';
    el.style.background = o.backgroundColor || th.surface; el.style.color = o.textColor || th.text;
    el.style.border = o.thickness + 'px solid ' + (o.borderColor || th.track);
    el.style.overflow = 'visible';
    this.cv = document.createElement('canvas'); this.cv.setAttribute('aria-hidden', 'true');
    this.cv.style.cssText = 'position:absolute;left:' + (-BLEED - o.thickness) + 'px;top:' + (-BLEED - o.thickness) + 'px;pointer-events:none;z-index:0';
    el.insertBefore(this.cv, el.firstChild);
    // conteúdo acima do canvas
    Array.prototype.forEach.call(el.childNodes, function (n) { if (n !== self.cv && n.nodeType === 1 && getComputedStyle(n).position === 'static') n.style.position = 'relative'; });
    this.ctx = this.cv.getContext('2d'); this.t0 = performance.now(); this.vis = true; this.hov = 0; this.hovT = 0; this.lapAt = -1; this.pulses = [];
    this.reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el); }
    if ('IntersectionObserver' in root) { this.io = new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; self.kick(); }); this.io.observe(el); }
    var enter = function () { self.hov = 1; if (o.hover === 'lap') self.lapAt = performance.now(); self.kick(); };
    var leave = function () { self.hov = 0; self.kick(); };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); el.addEventListener('focus', enter); el.addEventListener('blur', leave);
    el.addEventListener('pointerdown', function (e) {
      if (!o.clickPulse || self.reduced) return;
      var r = el.getBoundingClientRect(); self.pulses.push({ at: project(self.shape, e.clientX - r.left, e.clientY - r.top), t: performance.now() }); self.kick();
    });
    this.kick();
  }
  Star.prototype.resize = function () {
    var r = this.el.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2), pad = BLEED + this.o.thickness;
    this.W = r.width; this.H = r.height; this.d = d;
    this.cv.style.width = (this.W + pad * 2) + 'px'; this.cv.style.height = (this.H + pad * 2) + 'px';
    this.cv.width = Math.round((this.W + pad * 2) * d); this.cv.height = Math.round((this.H + pad * 2) * d);
    this.shape = outline(this.W, this.H, this.o.radius); this.pad = pad; this.draw(performance.now());
  };
  Star.prototype.kick = function () {
    var self = this; if (this.raf || !this.vis || document.hidden || this.reduced && !this.pulses.length) { if (this.reduced) this.draw(performance.now()); return; }
    var loop = function (now) { self.raf = 0; if (!self.vis || document.hidden) return; self.draw(now); self.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  Star.prototype.draw = function (now) {
    var o = this.o, ctx = this.ctx, d = this.d, sh = this.shape, pad = this.pad, p = { x: 0, y: 0, nx: 0, ny: 0 }, i, j;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, this.W + pad * 2, this.H + pad * 2);
    ctx.translate(pad, pad);
    var life = this.reduced ? 0 : (now - this.t0) / 1000, total = sh.total, glow = o.glow;
    var show = 1, bright = 1;
    var lapP = -1;
    if (o.hover === 'lap' && this.lapAt >= 0) { lapP = (now - this.lapAt) / (LAP * 1000); if (lapP > 1) lapP = -1; }
    if (o.hover === 'reveal') show = this.hov ? 1 : (lapP >= 0 ? 1 : 0.0);
    if (o.hover === 'brighten') bright = this.hov ? 1.6 : 1;
    this.hovT += ((this.hov ? 1 : 0) - this.hovT) * 0.12;
    if (o.hover === 'reveal') show = this.hovT;
    var live = false;
    var heads = [];
    if (o.hover !== 'lap' || true) {
      var base = (life / o.duration) * total * this.sign;
      for (i = 0; i < o.stars; i++) heads.push({ at: base + (total / o.stars) * i, strength: 1 });
    }
    if (o.hover === 'lap' && lapP >= 0) { var e = (1 - Math.pow(1 - lapP, 3)); heads.push({ at: total * e * this.sign, strength: 1.4 * (1 - Math.abs(lapP - 0.5) * 0.4) }); }
    for (j = this.pulses.length - 1; j >= 0; j--) {
      var P = this.pulses[j], pa = (now - P.t) / 700;
      if (pa >= 1) { this.pulses.splice(j, 1); continue; }
      heads.push({ at: P.at + total * pa * 0.5, strength: 1.2 * (1 - pa) }); heads.push({ at: P.at - total * pa * 0.5, strength: 1.2 * (1 - pa) });
    }
    ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    var trail = Math.max(0.02, o.trailLength) * total * 0.5, N = 28;
    for (i = 0; i < heads.length; i++) {
      var H = heads[i], str = H.strength * show * bright;
      if (str <= 0.01) continue;
      for (j = 0; j < N; j++) {
        var t0 = j / N, t1 = (j + 1) / N;
        var a0 = H.at - this.sign * t0 * trail, a1 = H.at - this.sign * t1 * trail;
        var f = Math.pow(1 - t0, 2.2), col = mix(this.c1, this.c2, t0);
        pointAt(sh, a0, p); var x0 = p.x, y0 = p.y; pointAt(sh, a1, p);
        ctx.strokeStyle = rgba(col, f * str * 0.95); ctx.lineWidth = o.thickness + 0.6 * f;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      pointAt(sh, H.at, p);
      if (glow > 0) {
        var rad = 18 + 26 * glow, g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, rgba(this.c1, 0.55 * glow * str)); g.addColorStop(1, rgba(this.c1, 0)); ctx.fillStyle = g; ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
      }
      ctx.fillStyle = rgba(WHITE, Math.min(1, str)); ctx.beginPath(); ctx.arc(p.x, p.y, o.thickness + 1.1, 0, TAU); ctx.fill();
      if (o.sparkle) {
        var tw = 0.6 + 0.4 * Math.sin(life * 9 + i), L = 6 + 4 * tw;
        ctx.strokeStyle = rgba(WHITE, 0.8 * str); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y); ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  Star.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); this.cv.remove(); this.el._star = null; };
  root.HeluStar = { create: function (el, o) { return el._star || (el._star = new Star(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-starborder]'); for (var i = 0; i < l.length; i++) root.HeluStar.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluStar.init(); }); else root.HeluStar.init();
})(window);
