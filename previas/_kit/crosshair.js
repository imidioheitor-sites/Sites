/*! Crosshair vanilla (HELU/HEsites) — equivalente em canvas 2D do Crosshair do React Bits (mira que segue o cursor). Sem dependências.
 *  Uso:  <section data-crosshair data-color="#ffffff" data-target-effect="lock" data-show-coordinates>...</section>   ou   HeluCrosshair.create(el, {...})
 *  O elemento hospedeiro vira o limite da mira (position não-static). Sem data-crosshair no hospedeiro, use HeluCrosshair.create(null) para cobrir a janela toda.
 *  Props (mesmos nomes/padrões): color='#ffffff', thickness=1, opacity=0.85, lineStyle('solid'|'dashed'|'dotted'), gap=0, fade=0, smoothing=0.35, showCoordinates=true,
 *  targetEffect('lock'|'glitch'|'none')='lock', targetSelector='a, button, [data-crosshair-target]', clickPulse=true, hideCursor=false, blendMode('normal'|'difference').
 *  Desligado automaticamente em toque (pointer: coarse) e sem mouse. prefers-reduced-motion: sem suavização, sem glitch e sem pulso. Nunca no hero (primeiro quadro só vídeo). */
(function (root) {
  'use strict';
  var DEF = { color: '#ffffff', thickness: 1, opacity: 0.85, lineStyle: 'solid', gap: 0, fade: 0, smoothing: 0.35, showCoordinates: true, targetEffect: 'lock',
    targetSelector: 'a, button, [data-crosshair-target]', clickPulse: true, hideCursor: false, blendMode: 'normal' };
  var BOOL = { showCoordinates: 1, clickPulse: 1, hideCursor: 1 }, STR = { color: 1, lineStyle: 1, targetEffect: 1, targetSelector: 1, blendMode: 1 };
  var FONT = '500 10px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', HIDDEN = 'crosshair-cursor-hidden';
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function toRgb(ctx, color) {
    ctx.fillStyle = '#000'; ctx.fillStyle = color; var v = String(ctx.fillStyle);
    if (v.charAt(0) === '#') { var h = parseInt(v.slice(1, 7), 16); return { r: (h >> 16) & 255, g: (h >> 8) & 255, b: h & 255, a: 1 }; }
    var p = (v.match(/[\d.]+/g) || [255, 255, 255, 1]).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] };
  }

  function Cross(host, opts) {
    var self = this, k; this.host = host; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    if (host) for (k in host.dataset) { var c = camel(k.replace(/^crosshair/, '')); c = c.charAt(0).toLowerCase() + c.slice(1); if (c in DEF) { var v = host.dataset[k]; this.o[c] = BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    var o = this.o; o.thickness = clamp(o.thickness, 0.5, 8); o.opacity = clamp(o.opacity, 0, 1); o.fade = clamp(o.fade, 0, 1); o.smoothing = clamp(o.smoothing, 0, 1); o.gap = Math.max(0, o.gap);
    this.reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touch = root.matchMedia && root.matchMedia('(pointer: coarse), (hover: none)').matches;
    if (this.touch) { this.off = true; return; }
    if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
    this.cv = document.createElement('canvas'); this.cv.setAttribute('aria-hidden', 'true');
    this.cv.style.cssText = 'position:' + (host ? 'absolute' : 'fixed') + ';inset:0;width:100%;height:100%;pointer-events:none;z-index:40;mix-blend-mode:' + (o.blendMode === 'difference' ? 'difference' : 'normal');
    (host || document.body).appendChild(this.cv);
    this.ctx = this.cv.getContext('2d'); this.ink = toRgb(this.ctx, o.color);
    this.s = { x: 0, y: 0, tx: 0, ty: 0, cx: 0, cy: 0, inside: false, seen: false, presence: 0, glitch: 0, target: null, lock: { x: 0, y: 0, w: 0, h: 0, a: 0 }, pulses: [] };
    this.size = { w: 0, h: 0, d: 1 }; this.last = 0; this.raf = 0;
    this.resize();
    if ('ResizeObserver' in root) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(host || document.documentElement); }
    var scope = host || root;
    this.onMove = function (e) {
      var r = self.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = self.s;
      s.inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height; s.tx = x; s.ty = y; s.cx = e.clientX; s.cy = e.clientY;
      if (!s.seen) { s.x = x; s.y = y; s.seen = true; }
      if (s.inside && o.hideCursor) (host || document.documentElement).classList.add(HIDDEN);
      var t = null; if (s.inside && o.targetEffect !== 'none') { var el = document.elementFromPoint(e.clientX, e.clientY); t = el && el.closest ? el.closest(o.targetSelector) : null; if (t && host && !host.contains(t)) t = null; }
      if (t !== s.target) { s.target = t; if (t && o.targetEffect === 'glitch' && !self.reduced) s.glitch = 1; }
      self.kick();
    };
    this.onLeave = function () { self.s.inside = false; self.s.target = null; (host || document.documentElement).classList.remove(HIDDEN); self.kick(); };
    this.onDown = function (e) { if (!o.clickPulse || self.reduced || !self.s.inside) return; var r = self.cv.getBoundingClientRect(); self.s.pulses.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }); self.kick(); };
    scope.addEventListener('pointermove', this.onMove, { passive: true }); (host || document.documentElement).addEventListener('pointerleave', this.onLeave); scope.addEventListener('pointerdown', this.onDown, { passive: true });
    if (o.hideCursor && !document.getElementById('crosshair-css')) { var st = document.createElement('style'); st.id = 'crosshair-css'; st.textContent = '.' + HIDDEN + ',.' + HIDDEN + ' *{cursor:none!important}'; document.head.appendChild(st); }
  }
  Cross.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2); this.size.w = r.width; this.size.h = r.height; this.size.d = d;
    this.cv.width = Math.max(1, Math.round(r.width * d)); this.cv.height = Math.max(1, Math.round(r.height * d)); this.kick();
  };
  Cross.prototype.kick = function () {
    var self = this; if (this.raf || this.off) return;
    var f = function (now) { self.raf = 0; var more = self.draw(now); if (more) self.raf = requestAnimationFrame(f); }; this.raf = requestAnimationFrame(f);
  };
  Cross.prototype.rgba = function (a) { var i = this.ink; return 'rgba(' + i.r + ',' + i.g + ',' + i.b + ',' + clamp(a * i.a, 0, 1) + ')'; };
  Cross.prototype.tag = function (text, x, y, align) {
    var ctx = this.ctx, size = this.size, i = this.ink; ctx.font = FONT; var w = ctx.measureText(text).width + 10, h = 16;
    var left = align === 'center' ? x - w / 2 : x, top = align === 'middle' ? y - h / 2 : y; left = clamp(left, 4, size.w - w - 4); top = clamp(top, 4, size.h - h - 4);
    var light = i.r * 0.2126 + i.g * 0.7152 + i.b * 0.0722 > 150; ctx.fillStyle = this.rgba(1); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(left, top, w, h, 3); else ctx.rect(left, top, w, h); ctx.fill();
    ctx.fillStyle = light ? '#0a0a0a' : '#ffffff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(text, left + w / 2, top + h / 2 + 0.5);
  };
  Cross.prototype.seg = function (x1, y1, x2, y2, horiz) {
    var ctx = this.ctx, o = this.o, s = this.s, size = this.size, len = horiz ? x2 - x1 : y2 - y1; if (len <= 0) return;
    if (o.fade > 0) { var g = horiz ? ctx.createLinearGradient(0, 0, size.w, 0) : ctx.createLinearGradient(0, 0, 0, size.h), at = clamp(horiz ? s.x / size.w : s.y / size.h, 0.001, 0.999);
      g.addColorStop(0, this.rgba(1 - o.fade)); g.addColorStop(at, this.rgba(1)); g.addColorStop(1, this.rgba(1 - o.fade)); ctx.strokeStyle = g; } else ctx.strokeStyle = this.rgba(1);
    ctx.beginPath();
    if (s.glitch > 0.01) { var n = Math.max(4, Math.round(len / 28)); for (var i = 0; i < n; i++) { var j = (Math.random() - 0.5) * 14 * s.glitch, a = i / n, b = (i + 1) / n;
      if (horiz) { ctx.moveTo(x1 + len * a, y1 + j); ctx.lineTo(x1 + len * b, y1 + j); } else { ctx.moveTo(x1 + j, y1 + len * a); ctx.lineTo(x1 + j, y1 + len * b); } } }
    else { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
  };
  Cross.prototype.draw = function (now) {
    var o = this.o, ctx = this.ctx, s = this.s, size = this.size, d = size.d, dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 1 / 60; this.last = now;
    var follow = this.reduced || o.smoothing === 0 ? 1 : 1 - Math.exp(-dt / Math.max(0.001, o.smoothing * 0.12));
    s.x += (s.tx - s.x) * follow; s.y += (s.ty - s.y) * follow;
    s.presence += ((s.inside ? 1 : 0) - s.presence) * Math.min(1, dt * 12); s.glitch = Math.max(0, s.glitch - dt * 2.4);
    var L = s.lock, tgt = s.target && this.host !== s.target ? s.target.getBoundingClientRect() : null, cr = this.cv.getBoundingClientRect();
    if (tgt && o.targetEffect === 'lock') { var tx = tgt.left - cr.left, ty = tgt.top - cr.top, f2 = this.reduced ? 1 : Math.min(1, dt * 16); L.x += (tx - L.x) * f2; L.y += (ty - L.y) * f2; L.w += (tgt.width - L.w) * f2; L.h += (tgt.height - L.h) * f2; L.a += (1 - L.a) * Math.min(1, dt * 14); }
    else L.a += (0 - L.a) * Math.min(1, dt * 14);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, size.w, size.h);
    var alive = false;
    if (s.presence > 0.01 && s.seen) {
      var x = Math.round(s.x * d) / d + 0.5 / d, y = Math.round(s.y * d) / d + 0.5 / d; ctx.globalAlpha = o.opacity * s.presence; ctx.lineWidth = o.thickness; ctx.lineCap = 'butt';
      ctx.setLineDash(o.lineStyle === 'dashed' ? [8, 6] : o.lineStyle === 'dotted' ? [1.5, 5] : []);
      this.seg(0, y, x - o.gap, y, true); this.seg(x + o.gap, y, size.w, y, true); this.seg(x, 0, x, y - o.gap, false); this.seg(x, y + o.gap, x, size.h, false);
      ctx.setLineDash([]);
      if (o.hideCursor) { ctx.fillStyle = this.rgba(1); ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, 6.2832); ctx.fill(); }
      if (L.a > 0.02 && o.targetEffect === 'lock') {
        var arm = Math.min(14, L.w / 3, L.h / 3); ctx.strokeStyle = this.rgba(L.a); ctx.lineWidth = Math.max(1, o.thickness);
        [[L.x, L.y, 1, 1], [L.x + L.w, L.y, -1, 1], [L.x, L.y + L.h, 1, -1], [L.x + L.w, L.y + L.h, -1, -1]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(c[0], c[1] + c[3] * arm); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + c[2] * arm, c[1]); ctx.stroke(); });
        if (o.showCoordinates) this.tag(Math.round(L.w) + ' × ' + Math.round(L.h), L.x + L.w / 2, L.y + L.h + 6, 'center');
      }
      if (o.showCoordinates) { this.tag(String(Math.round(s.x)).padStart(4, '0'), s.x, 4, 'center'); this.tag(String(Math.round(s.y)).padStart(4, '0'), size.w - 52, s.y, 'middle'); }
      alive = true;
    }
    for (var i = s.pulses.length - 1; i >= 0; i--) { var p = s.pulses[i], a = (now - p.t) / 650; if (a >= 1) { s.pulses.splice(i, 1); continue; }
      ctx.globalAlpha = o.opacity * (1 - a); ctx.strokeStyle = this.rgba(1); ctx.lineWidth = o.thickness; ctx.beginPath(); ctx.arc(p.x, p.y, 4 + 38 * (1 - Math.pow(1 - a, 3)), 0, 6.2832); ctx.stroke(); alive = true; }
    ctx.globalAlpha = 1;
    return alive || s.glitch > 0.01 || Math.abs(s.tx - s.x) > 0.2 || Math.abs(s.ty - s.y) > 0.2 || s.presence > 0.01 && s.presence < 0.99 || L.a > 0.02 || s.inside;
  };
  Cross.prototype.destroy = function () {
    if (this.off) return; if (this.raf) cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); var scope = this.host || root;
    scope.removeEventListener('pointermove', this.onMove); scope.removeEventListener('pointerdown', this.onDown); (this.host || document.documentElement).removeEventListener('pointerleave', this.onLeave);
    (this.host || document.documentElement).classList.remove(HIDDEN); this.cv.remove(); if (this.host) this.host._cross = null;
  };
  root.HeluCrosshair = { create: function (el, o) { if (el && el._cross) return el._cross; var c = new Cross(el || null, o); if (el) el._cross = c; return c; }, init: function (s) { var l = (s || document).querySelectorAll('[data-crosshair]'); for (var i = 0; i < l.length; i++) root.HeluCrosshair.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluCrosshair.init(); }); else root.HeluCrosshair.init();
})(window);
