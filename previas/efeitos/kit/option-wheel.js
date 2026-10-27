/*! OptionWheel vanilla (HELU/HEsites) — equivalente do OptionWheel do React Bits (roda de opções em curva 2D; rolagem, arrasto e setas). Sem dependências.
 *  Uso:  <div class="roda" data-optionwheel data-items='["Bolos","Doces","Salgados","Festas"]' data-default-selected="1"></div>   ou   HeluWheel.create(el, {items:[...], onChange(i,item){}})
 *  Props (mesmos nomes/padrões): items, defaultSelected=3, onChange, textColor='#a6a6a6', activeColor='#ffffff', side('left'|'right')='left', fontSize=3 (rem), spacing=1.4,
 *  curve=1, tilt=6, blur=2, fade=0.25, minOpacity=0.05, smoothing=200 (ms), inset=80, loop=false, draggable=true, soundUrl='', soundVolume=0.5.
 *  Acessível: role=listbox, setas/Home/End; prefers-reduced-motion: sem suavização. O container precisa de altura (ex.: 420px). */
(function (root) {
  'use strict';
  var DEF = { items: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'], defaultSelected: 3, onChange: null, textColor: '#a6a6a6', activeColor: '#ffffff', side: 'left', fontSize: 3, spacing: 1.4,
    curve: 1, tilt: 6, blur: 2, fade: 0.25, minOpacity: 0.05, smoothing: 200, inset: 80, loop: false, draggable: true, soundUrl: '', soundVolume: 0.5 };
  var BOOL = { loop: 1, draggable: 1 }, STR = { textColor: 1, activeColor: 1, side: 1, soundUrl: 1 };
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function mixHex(a, b, t) { return 'color-mix(in srgb,' + b + ' ' + (t * 100).toFixed(1) + '%,' + a + ')'; }

  function Wheel(el, opts) {
    var self = this, k; this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k.replace(/^optionwheel/, '')); c = c.charAt(0).toLowerCase() + c.slice(1); if (c in DEF) { var v = el.dataset[k]; this.o[c] = c === 'items' ? JSON.parse(v) : BOOL[c] ? (v === '' || v === 'true') : STR[c] ? v : parseFloat(v); } }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    var o = this.o; o.defaultSelected = Math.min(Math.max(0, o.defaultSelected), o.items.length - 1);
    el.classList.add('option-wheel'); el.setAttribute('role', 'listbox'); el.tabIndex = 0;
    el.style.cssText += ';position:relative;overflow:hidden;touch-action:none;outline-offset:4px';
    this.items = o.items.map(function (label, i) {
      var d = document.createElement('div'); d.textContent = label; d.setAttribute('role', 'option');
      d.style.cssText = 'position:absolute;top:50%;white-space:nowrap;cursor:pointer;user-select:none;will-change:transform,opacity,filter;line-height:1;font-weight:600;letter-spacing:-.02em;font-size:' + o.fontSize + 'rem;' +
        (o.side === 'right' ? 'right:' : 'left:') + o.inset + 'px;transform-origin:' + (o.side === 'right' ? 'right' : 'left') + ' center';
      d.addEventListener('click', function () { if (!self.moved) self.go(i, true); });
      el.appendChild(d); return d;
    });
    this.pos = this.target = this.sel = o.defaultSelected; this.last = 0; this.raf = 0;
    this.reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    el.addEventListener('wheel', function (e) {
      e.preventDefault(); clearTimeout(self.wt); self.go(self.target + (e.deltaY > 0 ? 1 : -1) * Math.min(1, Math.abs(e.deltaY) / 100) * 0.6, false);
      self.wt = setTimeout(function () { self.go(Math.round(self.target), true); }, 120);
    }, { passive: false });
    el.addEventListener('keydown', function (e) {
      var m = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in m) { e.preventDefault(); self.go(Math.round(self.target) + m[e.key], true); }
      else if (e.key === 'Home') { e.preventDefault(); self.go(0, true); } else if (e.key === 'End') { e.preventDefault(); self.go(o.items.length - 1, true); }
    });
    if (o.draggable) {
      var drag = null;
      el.addEventListener('pointerdown', function (e) { drag = { y: e.clientY, t: self.target }; self.moved = false; el.setPointerCapture && el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', function (e) { if (!drag) return; var dy = e.clientY - drag.y; if (Math.abs(dy) > 4) self.moved = true; self.go(drag.t - dy / self.rowH(), false); });
      var up = function () { if (!drag) return; drag = null; self.go(Math.round(self.target), true); setTimeout(function () { self.moved = false; }, 0); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    }
    this.layout(1); this.start();
  }
  Wheel.prototype.rowH = function () { return Math.max(this.o.fontSize * this.o.spacing * this.rem, 1); };
  Wheel.prototype.go = function (v, snap) {
    var o = this.o, n = o.items.length;
    if (!o.loop) v = Math.min(Math.max(v, 0), Math.max(n - 1, 0));
    if (snap) v = Math.round(v);
    this.target = v;
    var idx = ((Math.round(v) % n) + n) % n;
    if (idx !== this.sel) {
      this.sel = idx;
      this.items.forEach(function (d, i) { d.setAttribute('aria-selected', i === idx ? 'true' : 'false'); });
      if (typeof o.onChange === 'function') o.onChange(idx, o.items[idx]);
      this.tick();
    }
    this.start();
  };
  Wheel.prototype.tick = function () {
    var o = this.o; if (!o.soundUrl) return;
    var now = performance.now(); if (now - (this.lt || 0) < 70) return; this.lt = now;
    if (!this.audio) { this.audio = new Audio(o.soundUrl); this.audio.preload = 'auto'; }
    this.audio.volume = Math.min(Math.max(o.soundVolume, 0), 1); this.audio.currentTime = 0; var p = this.audio.play(); if (p && p.catch) p.catch(function () {});
  };
  Wheel.prototype.start = function () {
    var self = this; if (this.raf) return; this.last = performance.now();
    var f = function (now) {
      self.raf = 0; var dt = Math.min((now - self.last) / 1000, 0.05); self.last = now;
      var tau = Math.max(self.o.smoothing, 1) / 1000, k = self.reduced ? 1 : 1 - Math.exp(-dt / tau);
      var next = self.pos + (self.target - self.pos) * k, settled = Math.abs(self.target - next) < 0.001; if (settled) next = self.target;
      self.pos = next; self.layout(next); if (!settled) self.raf = requestAnimationFrame(f);
    };
    this.raf = requestAnimationFrame(f);
  };
  Wheel.prototype.layout = function (pos) {
    var o = this.o, n = o.items.length, mirror = o.side === 'right' ? -1 : 1, rowH = this.rowH(), tiltRad = o.tilt * Math.PI / 180, R = tiltRad > 0.0005 ? rowH / tiltRad : 0;
    for (var i = 0; i < n; i++) {
      var el = this.items[i], d = i - pos;
      if (o.loop && n > 1) { d = ((d % n) + n) % n; if (d > n / 2) d -= n; }
      var dist = Math.abs(d), x = 0, y = d * rowH, rot = 0;
      if (R > 0) { var ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad)); y = R * Math.sin(ang); x = -mirror * R * (1 - Math.cos(ang)) * o.curve; rot = mirror * ang * 180 / Math.PI; }
      el.style.transform = 'translate(' + x.toFixed(2) + 'px, calc(' + y.toFixed(2) + 'px - 50%)) rotate(' + rot.toFixed(3) + 'deg)';
      el.style.opacity = String(Math.max(o.minOpacity, 1 - dist * o.fade));
      el.style.filter = o.blur > 0 ? 'blur(' + (dist * o.blur).toFixed(2) + 'px)' : 'none';
      el.style.color = mixHex(o.textColor, o.activeColor, Math.max(0, 1 - Math.min(dist, 1)));
    }
  };
  Wheel.prototype.destroy = function () { if (this.raf) cancelAnimationFrame(this.raf); this.items.forEach(function (d) { d.remove(); }); this.el._wheel = null; };
  root.HeluWheel = { create: function (el, o) { return el._wheel || (el._wheel = new Wheel(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-optionwheel]'); for (var i = 0; i < l.length; i++) root.HeluWheel.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluWheel.init(); }); else root.HeluWheel.init();
})(window);
