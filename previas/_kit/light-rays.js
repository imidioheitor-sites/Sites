/*! LightRays vanilla (HELU/HEsites) — equivalente em canvas 2D do componente LightRays do React Bits. Sem dependências, sem WebGL, sem 3D.
 *  Uso:  <div data-lightrays data-rays-origin="top-center" data-rays-color="#ffffff" ...></div>   ou   HeluRays.create(el, {...})
 *  Props: raysOrigin('top-center'|'top-left'|'top-right'|'left'|'right'|'bottom-center'|'bottom-left'|'bottom-right')='top-center', raysColor='#ffffff', raysSpeed=1,
 *         lightSpread=0.5, rayLength=3, glow=0.6, haze=0.25, followMouse=true, mouseInfluence=0.1, rayDensity=1, tilt=0 (graus), raySharpness=0.35,
 *         atmosphere=1, intensity=1, fadeDistance=1, saturation=1, noiseAmount=0, distortion=0, pulsating=false, cursorShadow=true, clickPulse=true,
 *         intro=true, lightMode=false.
 *  Canvas transparente (soma luz sobre a cor do container). Fraco/saveData/reduced-motion: 1 quadro estático. Pausa fora da tela e aba oculta. */
(function (root) {
  'use strict';
  var DEF = { raysOrigin: 'top-center', raysColor: '#ffffff', raysSpeed: 1, lightSpread: 0.5, rayLength: 3, glow: 0.6, haze: 0.25, followMouse: true,
    mouseInfluence: 0.1, rayDensity: 1, tilt: 0, raySharpness: 0.35, atmosphere: 1, intensity: 1, fadeDistance: 1, saturation: 1, noiseAmount: 0,
    distortion: 0, pulsating: false, cursorShadow: true, clickPulse: true, intro: true, lightMode: false };
  var BOOL = { followMouse: 1, pulsating: 1, cursorShadow: 1, clickPulse: 1, intro: 1, lightMode: 1 }, STR = { raysOrigin: 1, raysColor: 1 };
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function rgb(h) { var c = document.createElement('canvas').getContext('2d'); c.fillStyle = h; var v = c.fillStyle; if (v.charAt(0) === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)]; var m = v.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; }
  function weak() { var n = navigator, c = n.connection; return !!((c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)); }
  function reduced() { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function rnd(s) { s = Math.sin(s * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  var ORG = { 'top-center': [0.5, -0.08, 90], 'top-left': [0, -0.08, 55], 'top-right': [1, -0.08, 125], left: [-0.08, 0.5, 0], right: [1.08, 0.5, 180],
    'bottom-center': [0.5, 1.08, 270], 'bottom-left': [0, 1.08, 305], 'bottom-right': [1, 1.08, 235] };

  function Rays(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k); if (c in DEF) { var v = el.dataset[k]; this.o[c] = BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    this.cv = document.createElement('canvas'); this.cv.setAttribute('aria-hidden', 'true');
    this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.insertBefore(this.cv, el.firstChild);
    this.ctx = this.cv.getContext('2d'); this.static = reduced() || weak(); this.t0 = performance.now(); this.vis = true;
    this.m = { x: 0.5, y: 0.5, px: 0, py: 0, in: false }; this.sm = { x: 0.5, y: 0.5 }; this.pulse = 0; this.pulseT = 0;
    var c0 = rgb(this.o.raysColor), l = 0.299 * c0[0] + 0.587 * c0[1] + 0.114 * c0[2], s = this.o.saturation;
    this.col = [l + (c0[0] - l) * s, l + (c0[1] - l) * s, l + (c0[2] - l) * s].map(function (v) { return Math.max(0, Math.min(255, v)) | 0; });
    var n = document.createElement('canvas'); n.width = n.height = 96; var nx = n.getContext('2d'), id = nx.createImageData(96, 96);
    for (var i = 0; i < id.data.length; i += 4) { var q = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = q; id.data[i + 3] = 255; } nx.putImageData(id, 0, 0); this.noise = n;
    this.resize();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el); }
    if ('IntersectionObserver' in root) { this.io = new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; self.kick(); }); this.io.observe(el); }
    document.addEventListener('visibilitychange', function () { self.kick(); });
    if (!this.static) {
      root.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); self.m.px = e.clientX - r.left; self.m.py = e.clientY - r.top; self.m.x = self.m.px / r.width; self.m.y = self.m.py / r.height; self.m.in = self.m.x >= 0 && self.m.x <= 1 && self.m.y >= 0 && self.m.y <= 1; }, { passive: true });
      root.addEventListener('pointerdown', function () { if (self.m.in && self.o.clickPulse) { self.pulse = 1; self.pulseT = performance.now(); } });
    }
    this.kick();
  }
  Rays.prototype.resize = function () {
    var r = this.el.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.d = d; this.cv.width = Math.round(this.W * d); this.cv.height = Math.round(this.H * d); this.draw(performance.now());
  };
  Rays.prototype.kick = function () {
    var self = this; if (this.raf || this.static || !this.vis || document.hidden) return;
    var loop = function (now) { self.raf = 0; if (!self.vis || document.hidden) return; self.draw(now); self.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  Rays.prototype.draw = function (now) {
    var o = this.o, ctx = this.ctx, d = this.d, W = this.W, H = this.H, i;
    var t = this.static ? 4 : ((now - this.t0) / 1000) * o.raysSpeed;
    var intro = o.intro && !this.static ? Math.min(1, (now - this.t0) / 1800) : 1; intro = 1 - Math.pow(1 - intro, 3);
    var og = ORG[o.raysOrigin] || ORG['top-center'], ox = og[0] * W, oy = og[1] * H, base = og[2] * Math.PI / 180;
    this.sm.x += (this.m.x - this.sm.x) * 0.06; this.sm.y += (this.m.y - this.sm.y) * 0.06;
    var follow = o.followMouse && this.m.in ? (this.sm.x - 0.5) * o.mouseInfluence * 6 : 0;
    var pulse = 0; if (this.pulse) { var age = (now - this.pulseT) / 1000; pulse = Math.max(0, 1 - age / 1.2); if (age > 1.2) this.pulse = 0; }
    var pul = o.pulsating ? 0.8 + 0.2 * Math.sin(t * 2) : 1;
    var inten = o.intensity * pul * (1 + pulse * 0.8) * intro;
    var L = Math.max(W, H) * Math.min(o.rayLength, 6) * 0.55, col = this.col.join(',');
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = o.lightMode ? 'source-over' : 'lighter';
    var n = Math.round(24 * o.rayDensity * (this.static ? 0.8 : 1)), spread = o.lightSpread * 1.6 + 0.2, tilt = o.tilt * Math.PI / 180;
    var sharp = 0.15 + o.raySharpness * 0.85, fade = Math.max(0.2, o.fadeDistance);
    for (i = 0; i < n; i++) {
      var r1 = rnd(i + 1), r2 = rnd(i + 9), r3 = rnd(i + 21);
      var a = base + tilt + follow + (r1 - 0.5) * spread + Math.sin(t * (0.3 + r2 * 0.4) + r3 * 6.28) * (0.05 + o.distortion * 0.12);
      var w = (0.012 + r2 * 0.05) * (1.1 - sharp * 0.6), len = L * (0.5 + r3 * 0.5) * fade;
      var al = (0.05 + r3 * 0.12) * inten * (0.6 + 0.4 * Math.sin(t * (0.7 + r1) + r2 * 9));
      // direção: ângulo medido a partir do eixo x com y para baixo; 90° aponta para baixo
      var dx = Math.cos(a), dy = Math.sin(a), nxv = -dy, nyv = dx, ex = ox + dx * len, ey = oy + dy * len, hw = len * w;
      var g = ctx.createLinearGradient(ox, oy, ex, ey);
      g.addColorStop(0, 'rgba(' + col + ',' + al * 1.2 + ')'); g.addColorStop(0.55, 'rgba(' + col + ',' + al * 0.35 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex + nxv * hw, ey + nyv * hw); ctx.lineTo(ex - nxv * hw, ey - nyv * hw); ctx.closePath(); ctx.fill();
    }
    if (o.glow > 0) {
      var gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(W, H) * 0.7 * Math.min(2, 0.5 + o.glow));
      gr.addColorStop(0, 'rgba(' + col + ',' + 0.35 * o.glow * inten + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
    if (o.haze > 0) {
      var hz = ctx.createLinearGradient(ox, oy, W / 2 + (W / 2 - ox) * 0.2, H / 2 + (H / 2 - oy) * 0.2);
      hz.addColorStop(0, 'rgba(' + col + ',' + 0.12 * o.haze * o.atmosphere * inten + ')'); hz.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (o.cursorShadow && this.m.in && !this.static) {
      ctx.globalCompositeOperation = 'destination-out';
      var cs = ctx.createRadialGradient(this.m.px, this.m.py, 0, this.m.px, this.m.py, 110);
      cs.addColorStop(0, 'rgba(0,0,0,.85)'); cs.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = cs; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
    if (o.noiseAmount > 0) { ctx.globalAlpha = o.noiseAmount * 0.3; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(this.noise, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  };
  Rays.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); this.cv.remove(); };
  root.HeluRays = { create: function (el, o) { return el._rays || (el._rays = new Rays(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-lightrays]'); for (var i = 0; i < l.length; i++) root.HeluRays.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluRays.init(); }); else root.HeluRays.init();
})(window);
