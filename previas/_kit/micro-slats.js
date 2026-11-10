/*! MicroSlats vanilla (HELU/HEsites) — equivalente em canvas 2D do componente MicroSlats do React Bits. Sem dependências, sem WebGL, sem 3D.
 *  Uso:  <div class="fundo" data-microslats data-preset="swell" data-color="#A855F7" ...></div>   ou   HeluSlats.create(el, {color:'#A855F7'})
 *  Props: preset('swell'|'ripple'|'tide'), color, glintColor, backgroundColor, slatWidth=10, slatHeight=25, gap=3, roundness=0.75,
 *         interactive=true, cursorStrength=1, cursorSize=40, swirl=0, trail=1.4, lean=0, intro=true, scale=1.5, speed=0.6,
 *         direction=250 (graus), chop=0.55, stretch=0, glint=0.7, contrast=1.25, perspective=0.55 (afunila o fundo, efeito 2D), fog=0.55,
 *         introDuration=1.5, paused=false.
 *  Efeito decorativo plano: nada de objetos 3D. Um por site, nunca no primeiro quadro (hero só vídeo).
 *  Dispositivo fraco, saveData ou prefers-reduced-motion: desenha 1 quadro estático e não anima. Pausa fora da tela e com a aba oculta. */
(function (root) {
  'use strict';
  var DEF = { preset: 'swell', color: '#A855F7', glintColor: '#ffffff', backgroundColor: '#120f17', slatWidth: 10, slatHeight: 25, gap: 3,
    roundness: 0.75, interactive: true, cursorStrength: 1, cursorSize: 40, swirl: 0, trail: 1.4, lean: 0, intro: true, scale: 1.5, speed: 0.6,
    direction: 250, chop: 0.55, stretch: 0, glint: 0.7, contrast: 1.25, perspective: 0.55, fog: 0.55, introDuration: 1.5, paused: false };
  var BOOL = { interactive: 1, intro: 1, paused: 1 }, STR = { preset: 1, color: 1, glintColor: 1, backgroundColor: 1 };
  var PRESETS = { swell: { k2: 0.55, w2: 1.3 }, ripple: { k2: 1.4, w2: 0.8 }, tide: { k2: 0.25, w2: 0.6 } };

  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function rgb(h) {
    var c = document.createElement('canvas').getContext('2d'); c.fillStyle = h; var v = c.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
    var m = v.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]];
  }
  function weak() {
    var n = navigator, c = n.connection;
    return !!((c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2));
  }
  function reduced() { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function Slats(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k); if (c in DEF) { var v = el.dataset[k]; this.o[c] = BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    this.cv = document.createElement('canvas');
    this.cv.setAttribute('aria-hidden', 'true');
    this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.insertBefore(this.cv, el.firstChild);
    this.ctx = this.cv.getContext('2d');
    this.static = reduced() || weak();
    this.t0 = performance.now(); this.t = 0; this.pts = []; this.vis = true;
    this.cache();
    this.resize();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el); }
    if ('IntersectionObserver' in root) { this.io = new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; self.kick(); }); this.io.observe(el); }
    document.addEventListener('visibilitychange', function () { self.kick(); });
    if (this.o.interactive && !this.static) {
      var mv = function (e) {
        var r = el.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
        var x = p.clientX - r.left, y = p.clientY - r.top;
        if (x < -80 || y < -80 || x > r.width + 80 || y > r.height + 80) return;
        self.pts.push({ x: x, y: y, t: performance.now() }); if (self.pts.length > 40) self.pts.shift();
      };
      root.addEventListener('pointermove', mv, { passive: true });
    }
    this.kick();
  }
  Slats.prototype.cache = function () {
    var o = this.o; this.cBg = rgb(o.backgroundColor); this.cCol = rgb(o.color); this.cGl = rgb(o.glintColor);
  };
  Slats.prototype.resize = function () {
    var r = this.el.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.d = d;
    this.cv.width = Math.round(this.W * d); this.cv.height = Math.round(this.H * d);
    this.draw(performance.now());
  };
  Slats.prototype.kick = function () {
    var self = this;
    if (this.raf || this.static || this.o.paused || !this.vis || document.hidden) return;
    var loop = function (now) {
      self.raf = 0;
      if (self.o.paused || !self.vis || document.hidden) return;
      self.draw(now); self.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  };
  Slats.prototype.draw = function (now) {
    var o = this.o, ctx = this.ctx, d = this.d, W = this.W, H = this.H, i, j;
    var t = this.static ? 2.2 : ((now - this.t0) / 1000) * o.speed;
    var intro = !o.intro || this.static ? 1 : Math.min(1, ((now - this.t0) / 1000) / Math.max(0.1, o.introDuration));
    var bg = this.cBg, col = this.cCol, gl = this.cGl;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = o.backgroundColor; ctx.fillRect(0, 0, W, H);
    var sw = o.slatWidth, sh = o.slatHeight, g = o.gap, cw = sw + g, ch = sh + g;
    var cols = Math.ceil(W / cw) + 1, rows = Math.ceil(H / ch) + 1;
    var a = o.direction * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
    var pr = PRESETS[o.preset] || PRESETS.swell, freq = 0.012 / Math.max(0.2, o.scale) * 3;
    var stretch = 1 / (1 + Math.max(0, o.stretch) * 2);
    // pontos do cursor com cauda: peso decai com a idade (trail = segundos)
    var pts = [], life = Math.max(0.1, o.trail) * 1000;
    for (i = 0; i < this.pts.length; i++) { var age = now - this.pts[i].t; if (age < life) pts.push({ x: this.pts[i].x, y: this.pts[i].y, w: 1 - age / life }); }
    this.pts = this.pts.filter(function (p) { return now - p.t < life; });
    var rad = Math.max(10, o.cursorSize) * 2.2, rr = o.roundness * Math.min(sw, sh) / 2;
    for (j = 0; j < rows; j++) {
      var py = j * ch + sh / 2, ny = py / H;                        // 0 topo → 1 base
      var depth = 1 - o.perspective * 0.5 * (1 - ny);               // afunila para cima (efeito plano)
      var rowW = sw * depth, rowCw = cw * depth, x0 = (W - cols * rowCw) / 2;
      var fogA = 1 - o.fog * (1 - ny) * (1 - ny);
      for (i = 0; i < cols; i++) {
        var px = x0 + i * rowCw + rowCw / 2;
        var sx = px, sy = py, boost = 0, lean = 0;
        for (var p = 0; p < pts.length; p++) {
          var ddx = px - pts[p].x, ddy = py - pts[p].y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < rad) {
            var f = Math.exp(-(dd * dd) / (rad * rad * 0.35)) * pts[p].w;
            boost += f * o.cursorStrength; lean += (ddx / (dd + 1)) * f * o.lean;
            if (o.swirl) { var an = f * o.swirl * 2, cs = Math.cos(an), sn = Math.sin(an); sx = pts[p].x + ddx * cs - ddy * sn; sy = pts[p].y + ddx * sn + ddy * cs; }
          }
        }
        var u = (sx * dx + sy * dy) * freq * stretch, w = (-sx * dy + sy * dx) * freq * 0.35;
        var v = 0.5 + 0.28 * Math.sin(u * 2.2 + t * 2.4 + w) + 0.22 * Math.sin(u * 2.2 * pr.k2 * 2 - t * 2.4 * pr.w2 + w * 2.3 + 1.7);
        if (o.chop > 0) { var q = Math.floor(v * 5 + 0.5) / 5; v = v + (q - v) * o.chop; }
        v = (v - 0.5) * o.contrast + 0.5 + boost * 0.35;
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        var rev = intro < 1 ? Math.max(0, Math.min(1, intro * 2.2 - (1 - ny) * 0.6 - (i / cols) * 0.4)) : 1;
        if (rev <= 0) continue;
        var vv = v * fogA * rev;
        var r = bg[0] + (col[0] - bg[0]) * vv, gg = bg[1] + (col[1] - bg[1]) * vv, b = bg[2] + (col[2] - bg[2]) * vv;
        var gk = o.glint * Math.pow(Math.max(0, v - 0.72) / 0.28, 2) * fogA * rev;
        if (gk > 0) { r += (gl[0] - r) * gk; gg += (gl[1] - gg) * gk; b += (gl[2] - b) * gk; }
        ctx.fillStyle = 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')';
        var h2 = sh * depth * (0.82 + 0.18 * v + boost * 0.1), x = px - rowW / 2 + lean * 3, y = py - h2 / 2;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, rowW, h2, rr * depth); ctx.fill(); }
        else ctx.fillRect(x, y, rowW, h2);
      }
    }
  };
  Slats.prototype.set = function (k, v) { this.o[k] = v; this.cache(); if (k === 'paused') this.kick(); };
  Slats.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); this.cv.remove(); };

  root.HeluSlats = {
    create: function (el, o) { if (el._slats) return el._slats; return (el._slats = new Slats(el, o)); },
    init: function (s) { var l = (s || document).querySelectorAll('[data-microslats]'); for (var i = 0; i < l.length; i++) root.HeluSlats.create(l[i]); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluSlats.init(); }); else root.HeluSlats.init();
})(window);
