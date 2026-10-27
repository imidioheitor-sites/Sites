/*! GridMotion vanilla (HELU/HEsites) — equivalente do GridMotion do React Bits (parede de tiles em linhas que derivam). DOM + CSS, sem dependências.
 *  Uso:  <div class="parede" data-gridmotion data-rows="4" data-items='["fotos/bolo.jpg","fotos/doces.jpg","Texto também vale"]'></div>   ou   HeluGrid.create(el, {items:[...]})
 *  Props (mesmos nomes/padrões): items (url de imagem, texto ou {src,alt}), rows=4, aspectRatio=1.33, gap=16, radius=14, angle=-12, tilt=0 (mantido em 0: sem 3D — valores >0 são ignorados),
 *  speed=24 (px/s), direction('alternate'|'left'|'right'), parallax=0.5, spotlight=0.6, dim=0.35, grayscale=false, fade=0.5, tileColor, textColor, theme('dark'|'light').
 *  O container precisa de altura. prefers-reduced-motion: parede parada. Pausa fora da tela. Uso ideal: galeria com as fotos reais do negócio. */
(function (root) {
  'use strict';
  var THEMES = { dark: { tile: '#1b1922', text: 'rgba(255,255,255,.78)', border: 'rgba(255,255,255,.07)' }, light: { tile: '#f4f4f5', text: '#3f3f46', border: 'rgba(24,24,27,.08)' } };
  var IMAGE = /^(https?:\/\/|\/\/|\/|\.\.?\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;
  var DEF = { items: [], rows: 4, aspectRatio: 1.33, gap: 16, radius: 14, angle: -12, tilt: 0, speed: 24, direction: 'alternate', parallax: 0.5, spotlight: 0.6, dim: 0.35,
    grayscale: false, fade: 0.5, tileColor: '', textColor: '', theme: 'dark' };
  var BOOL = { grayscale: 1 }, STR = { direction: 1, tileColor: 1, textColor: 1, theme: 1 };
  var INERTIA = [0.42, 0.32, 0.26, 0.22], PACE = [1, 0.86, 1.12, 0.94];
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function wrap(v, t) { return ((v % t) + t) % t; }
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function feather(side, zone) {
    var st = [], i, t, a;
    for (i = 0; i <= 12; i++) { t = i / 12; a = t * t * t * (t * (t * 6 - 15) + 10); st.push('rgba(0,0,0,' + a.toFixed(4) + ') ' + (t * zone).toFixed(2) + '%'); }
    var m = []; for (i = 0; i <= 12; i++) { t = (12 - i) / 12; a = t * t * t * (t * (t * 6 - 15) + 10); m.push('rgba(0,0,0,' + a.toFixed(4) + ') ' + (100 - t * zone).toFixed(2) + '%'); }
    return 'linear-gradient(' + side + ',' + st.join(',') + ',' + m.join(',') + ')';
  }
  function Grid(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k.replace(/^gridmotion/, '')); c = c.charAt(0).toLowerCase() + c.slice(1); if (c in DEF) { var v = el.dataset[k]; this.o[c] = c === 'items' ? JSON.parse(v) : BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    var o = this.o; o.rows = clamp(Math.round(o.rows), 1, 12); o.aspectRatio = clamp(o.aspectRatio, 0.3, 4); o.parallax = clamp(o.parallax, 0, 1); o.spotlight = clamp(o.spotlight, 0, 1);
    o.dim = clamp(o.dim, 0, 1); o.fade = clamp(o.fade, 0, 1);
    this.th = THEMES[o.theme] || THEMES.dark;
    this.reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden'; el.style.isolation = 'isolate';
    this.plane = document.createElement('div'); this.plane.style.cssText = 'position:absolute;left:50%;top:50%;will-change:transform';
    this.shade = document.createElement('div'); this.shade.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2';
    var fm = [feather('to right', 18 * o.fade), feather('to bottom', 22 * o.fade)];
    if (o.fade > 0) { el.style.setProperty('-webkit-mask-image', fm[0] + ',' + fm[1]); el.style.setProperty('mask-image', fm[0] + ',' + fm[1]); el.style.setProperty('-webkit-mask-composite', 'source-in'); el.style.setProperty('mask-composite', 'intersect'); }
    el.appendChild(this.plane); el.appendChild(this.shade);
    this.tiles = o.items.map(function (it) {
      if (it && typeof it === 'object' && typeof it.src === 'string') return { kind: 'image', src: it.src, alt: it.alt || '' };
      var t = String(it == null ? '' : it).trim(); return IMAGE.test(t) ? { kind: 'image', src: t, alt: '' } : { kind: 'text', text: t };
    });
    if (!this.tiles.length) this.tiles = [{ kind: 'text', text: '' }];
    this.ptr = { x: 0.5, y: 0.5, px: -9999, py: -9999, on: false }; this.off = []; this.shift = []; this.tp = 0; this.last = 0; this.vis = true;
    this.build();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.build(); }); this.ro.observe(el); }
    if ('IntersectionObserver' in root) { this.io = new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; self.kick(); }); this.io.observe(el); }
    root.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(); self.ptr.x = clamp(e.clientX / root.innerWidth, 0, 1); self.ptr.y = clamp(e.clientY / root.innerHeight, 0, 1);
      self.ptr.px = e.clientX - r.left; self.ptr.py = e.clientY - r.top; self.ptr.on = self.ptr.px >= 0 && self.ptr.py >= 0 && self.ptr.px <= r.width && self.ptr.py <= r.height; self.kick();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () { self.kick(); });
    this.kick();
  }
  Grid.prototype.build = function () {
    var o = this.o, W = this.el.clientWidth, H = this.el.clientHeight; if (!W || !H) return;
    var turn = o.angle * Math.PI / 180, cos = Math.abs(Math.cos(turn)), sin = Math.abs(Math.sin(turn));
    var pH = (W * sin + H * cos) * 1.12, pW = (W * cos + H * sin) * 1.12;
    var tH = Math.max(16, (pH - o.gap * (o.rows - 1)) / o.rows), tW = tH * o.aspectRatio, step = tW + o.gap, perRow = Math.ceil(pW / step) + 1, period = perRow * step, copies = Math.ceil(pW / period) + 2;
    this.L = { W: W, H: H, pW: pW, pH: pH, tW: tW, tH: tH, step: step, period: period, perRow: perRow, copies: copies };
    this.plane.style.width = pW + 'px'; this.plane.style.height = pH + 'px';
    this.plane.textContent = ''; this.rowEls = [];
    var top = (pH - o.rows * tH - (o.rows - 1) * o.gap) / 2, self = this;
    for (var r = 0; r < o.rows; r++) {
      var row = document.createElement('div'); row.style.cssText = 'position:absolute;left:0;top:' + (top + r * (tH + o.gap)) + 'px;height:' + tH + 'px;display:flex;gap:' + o.gap + 'px;will-change:transform';
      for (var c = 0; c < perRow * copies; c++) row.appendChild(this.tile(this.tiles[(c + r * 3) % this.tiles.length], tW, tH));
      this.plane.appendChild(row); this.rowEls.push(row); if (this.off[r] == null) { this.off[r] = 0; this.shift[r] = 0; }
    }
    this.plane.style.transform = 'translate(-50%,-50%) rotate(' + o.angle + 'deg)';
    this.shade.style.background = '';
    this.paint(0);
  };
  Grid.prototype.tile = function (t, w, h) {
    var o = this.o, d = document.createElement('div'); d.style.cssText = 'flex:0 0 ' + w + 'px;height:' + h + 'px;border-radius:' + o.radius + 'px;overflow:hidden;position:relative;background:' + (o.tileColor || this.th.tile) + ';box-shadow:inset 0 0 0 1px ' + this.th.border;
    if (t.kind === 'image') { var im = document.createElement('img'); im.src = t.src; im.alt = t.alt; im.draggable = false; im.decoding = 'async'; im.loading = 'lazy'; im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'; d.appendChild(im); }
    else { var s = document.createElement('span'); s.textContent = t.text; s.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;padding:12px;text-align:center;font-weight:600;color:' + (o.textColor || this.th.text); d.appendChild(s); }
    return d;
  };
  Grid.prototype.kick = function () {
    var self = this; if (this.raf || !this.vis || document.hidden) return;
    var f = function (now) { self.raf = 0; if (!self.vis || document.hidden) return; var dt = self.last ? Math.min((now - self.last) / 1000, 0.05) : 1 / 60; self.last = now; self.paint(dt); self.raf = requestAnimationFrame(f); };
    this.raf = requestAnimationFrame(f);
  };
  Grid.prototype.paint = function (dt) {
    var o = this.o, L = this.L; if (!L) return;
    for (var r = 0; r < o.rows; r++) {
      var dir = o.direction === 'left' ? -1 : o.direction === 'right' ? 1 : (r % 2 ? 1 : -1);
      if (!this.reduced) this.off[r] = wrap((this.off[r] || 0) + dir * o.speed * PACE[r % 4] * dt, L.period);
      var tgt = (this.ptr.x - 0.5) * o.parallax * L.W * 0.6 * (dir || 1) * (r % 2 ? 1 : -1); var inr = INERTIA[r % 4];
      this.shift[r] += (tgt - this.shift[r]) * (1 - Math.exp(-dt / (inr || 0.3)));
      this.rowEls[r].style.transform = 'translateX(' + (-L.period + this.off[r] + this.shift[r]).toFixed(2) + 'px)';
    }
    // spotlight: escurece (e opcionalmente tira a cor) fora do círculo em volta do cursor
    var sp = o.spotlight, rad = Math.max(L.W, L.H) * 0.45 * (sp || 0.0001), cx = this.ptr.on ? this.ptr.px : L.W / 2, cy = this.ptr.on ? this.ptr.py : L.H / 2;
    var cover = (o.dim > 0 || o.grayscale);
    if (!cover) { this.shade.style.background = 'none'; return; }
    var bg = o.theme === 'light' ? '255,255,255' : '12,9,20';
    this.shade.style.background = sp > 0 ? 'radial-gradient(circle ' + rad.toFixed(0) + 'px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, rgba(' + bg + ',0) 0%, rgba(' + bg + ',' + o.dim + ') 100%)' : 'rgba(' + bg + ',' + o.dim + ')';
    if (o.grayscale) {
      var m = sp > 0 ? 'radial-gradient(circle ' + rad.toFixed(0) + 'px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, transparent 0%, #000 100%)' : 'none';
      this.shade.style.backdropFilter = this.shade.style.webkitBackdropFilter = 'grayscale(1)'; this.shade.style.webkitMaskImage = this.shade.style.maskImage = m;
    }
  };
  Grid.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); this.plane.remove(); this.shade.remove(); this.el._grid = null; };
  root.HeluGrid = { create: function (el, o) { return el._grid || (el._grid = new Grid(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-gridmotion]'); for (var i = 0; i < l.length; i++) root.HeluGrid.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluGrid.init(); }); else root.HeluGrid.init();
})(window);
