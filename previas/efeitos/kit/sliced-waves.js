/*! SlicedWaves vanilla (HELU/HEsites) — equivalente em canvas 2D do componente SlicedWaves do React Bits. Sem dependências, sem WebGL, sem 3D.
 *  Uso:  <div data-slicedwaves data-color1="#ffd9a8" data-color2="#ff5fa2" data-color3="#5b8cff" ...></div>   ou   HeluWaves.create(el, {...})
 *  Props: color1,color2,color3, ribbons=3, spacing=28, perspective=0.45, blur=0.6, glow=1, position=0.78, mouseInteraction=true, barWidth=0.5,
 *         ribbonHeight=0.26, spread=0.1, amplitude=0.1, frequency=1, curve=0.5, slices=0, speed=1, brightness=1.25, rotation=0, grain=0.08, fade=0,
 *         opacity=1, intro=true, lightMode=false.  `perspective` aqui só afunila/escurece as fitas (efeito plano).
 *  Fundo transparente (usa a cor do container). Dispositivo fraco/saveData/reduced-motion: 1 quadro estático. Pausa fora da tela e aba oculta. */
(function (root) {
  'use strict';
  var DEF = { color1: '#ffd9a8', color2: '#ff5fa2', color3: '#5b8cff', ribbons: 3, spacing: 28, perspective: 0.45, blur: 0.6, glow: 1, position: 0.78,
    mouseInteraction: true, barWidth: 0.5, ribbonHeight: 0.26, spread: 0.1, amplitude: 0.1, frequency: 1, curve: 0.5, slices: 0, speed: 1, brightness: 1.25,
    rotation: 0, grain: 0.08, fade: 0, opacity: 1, intro: true, lightMode: false };
  var BOOL = { mouseInteraction: 1, intro: 1, lightMode: 1 }, STR = { color1: 1, color2: 1, color3: 1 };
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function rgb(h) { var c = document.createElement('canvas').getContext('2d'); c.fillStyle = h; var v = c.fillStyle; if (v.charAt(0) === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)]; var m = v.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; }
  function weak() { var n = navigator, c = n.connection; return !!((c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)); }
  function reduced() { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function Waves(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k); if (c in DEF) { var v = el.dataset[k]; this.o[c] = BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    this.cv = document.createElement('canvas'); this.cv.setAttribute('aria-hidden', 'true');
    this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.insertBefore(this.cv, el.firstChild);
    this.ctx = this.cv.getContext('2d'); this.static = reduced() || weak(); this.t0 = performance.now(); this.vis = true; this.m = { x: -999, y: -999 };
    this.c = [rgb(this.o.color1), rgb(this.o.color2), rgb(this.o.color3)];
    var n = document.createElement('canvas'); n.width = n.height = 96; var nx = n.getContext('2d'), id = nx.createImageData(96, 96);
    for (var i = 0; i < id.data.length; i += 4) { var q = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = q; id.data[i + 3] = 255; } nx.putImageData(id, 0, 0); this.noise = n;
    this.resize();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el); }
    if ('IntersectionObserver' in root) { this.io = new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; self.kick(); }); this.io.observe(el); }
    document.addEventListener('visibilitychange', function () { self.kick(); });
    if (this.o.mouseInteraction && !this.static) root.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); self.m.x = e.clientX - r.left; self.m.y = e.clientY - r.top; }, { passive: true });
    this.kick();
  }
  Waves.prototype.resize = function () {
    var r = this.el.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.d = d; this.cv.width = Math.round(this.W * d); this.cv.height = Math.round(this.H * d); this.draw(performance.now());
  };
  Waves.prototype.kick = function () {
    var self = this; if (this.raf || this.static || !this.vis || document.hidden) return;
    var loop = function (now) { self.raf = 0; if (!self.vis || document.hidden) return; self.draw(now); self.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  Waves.prototype.draw = function (now) {
    var o = this.o, ctx = this.ctx, d = this.d, W = this.W, H = this.H, R, x;
    var t = this.static ? 1.7 : ((now - this.t0) / 1000) * o.speed;
    var intro = o.intro && !this.static ? Math.min(1, (now - this.t0) / 2000) : 1; intro = 1 - Math.pow(1 - intro, 3);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(o.rotation * Math.PI / 180); ctx.translate(-W / 2, -H / 2);
    var step = Math.max(6, o.spacing), bw = Math.max(1, step * o.barWidth), n = Math.ceil((W * 1.5) / step) + 2, x0 = -W * 0.25;
    var bright = o.brightness * (o.lightMode ? 0.85 : 1);
    ctx.globalAlpha = o.opacity;
    ctx.globalCompositeOperation = o.lightMode ? 'multiply' : 'lighter';
    var passes = o.glow > 0 ? 2 : 1;
    for (var pass = 0; pass < passes; pass++) {
      if (pass === 1) { ctx.filter = 'blur(' + Math.max(2, o.blur * 14) + 'px)'; ctx.globalAlpha = o.opacity * Math.min(1, o.glow) * 0.6; }
      else if (o.blur > 0) ctx.filter = 'blur(' + (o.blur * 0.9) + 'px)';
      for (R = 0; R < o.ribbons; R++) {
        var off = (R - (o.ribbons - 1) / 2) * o.spread * H * 1.4, ph = R * 1.9;
        for (var i = 0; i < n; i++) {
          x = x0 + i * step; var u = x / W;
          var persp = 1 - o.perspective * 0.5 * Math.abs(u - 0.5) * 2;           // fitas afunilam nas pontas (efeito plano)
          var wave = Math.sin(u * 6.283 * o.frequency * 1.2 + t * 1.3 + ph) + o.curve * Math.sin(u * 6.283 * o.frequency * 2.3 - t * 0.8 + ph * 2);
          var cy = o.position * H + off + wave * o.amplitude * H * (1 - o.curve * 0.25) * intro;
          if (o.mouseInteraction) { var dx = x - this.m.x, dy = cy - this.m.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 160) cy += (dy / (dd + 1)) * (1 - dd / 160) * 28; }
          var h = o.ribbonHeight * H * persp * (0.55 + 0.45 * Math.cos(u * 3.14 - 1.57 + Math.sin(t + R)) ) * intro;
          if (h < 1) continue;
          var c = u < 0.5 ? mix(this.c[0], this.c[1], u * 2) : mix(this.c[1], this.c[2], (u - 0.5) * 2);
          var fa = 1; if (o.fade > 0) { var e = Math.min(u, 1 - u) * 2; fa = Math.max(0, Math.min(1, e / o.fade)); }
          var al = Math.min(1, 0.55 * fa * persp * bright * (1 - R * 0.08));
          if (al <= 0.01) continue;
          var g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
          var col = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0);
          g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.5, 'rgba(' + col + ',' + al + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.fillStyle = g;
          if (o.slices > 0) { var sl = Math.max(1, o.slices), sh = h / sl; for (var s = 0; s < sl; s++) ctx.fillRect(x, cy - h / 2 + s * sh + sh * 0.12, bw, sh * 0.76); }
          else ctx.fillRect(x, cy - h / 2, bw, h);
        }
      }
      ctx.filter = 'none';
    }
    ctx.restore(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (o.grain > 0) { ctx.globalAlpha = o.grain * 0.35; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(this.noise, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  };
  Waves.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); this.cv.remove(); };
  root.HeluWaves = { create: function (el, o) { return el._waves || (el._waves = new Waves(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-slicedwaves]'); for (var i = 0; i < l.length; i++) root.HeluWaves.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluWaves.init(); }); else root.HeluWaves.init();
})(window);
