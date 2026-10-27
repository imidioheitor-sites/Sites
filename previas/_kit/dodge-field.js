/*! DodgeField vanilla (HELU/HEsites) — port do DodgeField do React Bits (a lib "motion" foi trocada por mola própria em rAF). Um elemento que foge do cursor, desiste depois de N esquivas e vira clicável. Sem dependências.
 *  Uso:  <div data-dodge-field data-patience="3" data-ink-color="#fff"></div> (sem filhos = pílula embutida)   ou   <div data-dodge-field><img src="x.png" alt=""></div> (o filho foge)   ou   HeluDodge.create(el,{patience:3})
 *  Props (mesmos nomes/padrões): taunts=["Catch me","Nope","Too slow","Almost","Okay, okay"] (JSON ou "a|b|c"), notice='', inkColor='#f5f5f5', contrastColor='#18181b', fieldHeight=240, reach=72, radius=120, falloff=2,
 *  fleeDuration=130, returnDuration=620, returnBounce=0.1, axis='both'|'x'|'y', wall='clamp'|'bounce', patience=4, disabled=false.
 *  Eventos (CustomEvent no elemento): "dodge" (detail.count), "relent", "catch". Estado em data-dodges / data-gave / data-caught / data-fleeing no elemento.
 *  NUNCA usar em CTA real (WhatsApp, comprar, contato) nem em recusar/fechar: só easter egg/elemento lúdico. Em toque não foge (mostra data-notice). prefers-reduced-motion: não foge. */
(function (root) {
  'use strict';
  var DEF = { taunts: ['Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay'], notice: '', inkColor: '#f5f5f5', contrastColor: '#18181b', fieldHeight: 240, reach: 72, radius: 120, falloff: 2, fleeDuration: 130, returnDuration: 620, returnBounce: 0.1, axis: 'both', wall: 'clamp', patience: 4, disabled: false };
  var NUM = { fieldHeight: 1, reach: 1, radius: 1, falloff: 1, fleeDuration: 1, returnDuration: 1, returnBounce: 1, patience: 1 };
  var COUNT_LINE = .55, DEAD = 6, HOLD = 760, INSET = 12;
  function css() {
    if (document.getElementById('dodge-field-css')) return;
    var s = document.createElement('style'); s.id = 'dodge-field-css';
    s.textContent = '.dodge-field{--df-ink:#f5f5f5;--df-contrast:#18181b;--df-height:240px;--df-ease-out:cubic-bezier(.23,1,.32,1);position:relative;display:grid;place-items:center;width:100%;height:var(--df-height)}' +
      '.dodge-field__mover{display:inline-grid;will-change:transform}.dodge-field__pill{display:inline-flex;align-items:center;justify-content:center;height:52px;margin:0;padding:0 28px;border:0;border-radius:999px;background:color-mix(in srgb,var(--df-ink) 8%,transparent);color:color-mix(in srgb,var(--df-ink) 72%,transparent);font-family:inherit;font-size:18px;font-weight:500;line-height:1;letter-spacing:-.012em;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform 160ms var(--df-ease-out),background-color 220ms ease,color 220ms ease}' +
      '.dodge-field__pill:active{transform:scale(.97)}.dodge-field__pill:focus-visible{outline:2px solid color-mix(in srgb,var(--df-ink) 60%,transparent);outline-offset:3px}' +
      '@media (hover:hover) and (pointer:fine){.dodge-field__pill:hover{color:color-mix(in srgb,var(--df-ink) 90%,transparent)}}' +
      '.dodge-field__mover[data-relented=true] .dodge-field__pill{color:var(--df-ink)}.dodge-field__mover[data-caught=true] .dodge-field__pill{background:var(--df-ink);color:var(--df-contrast)}' +
      '.dodge-field__labels{display:grid}.dodge-field__label{grid-area:1/1;white-space:nowrap;transition:opacity 200ms ease,filter 200ms ease}.dodge-field__label[data-active=false]{opacity:0;filter:blur(2px)}' +
      '.dodge-field__notice{position:absolute;inset:auto 0 12px;margin:0;color:color-mix(in srgb,var(--df-ink) 55%,transparent);font-size:12px;text-align:center;pointer-events:none}' +
      '@media (prefers-reduced-motion:reduce){.dodge-field__pill{transition:background-color 220ms ease,color 220ms ease}.dodge-field__pill:active{transform:none}.dodge-field .dodge-field__label{filter:none}}';
    document.head.appendChild(s);
  }
  function wallIt(t, room, wall) {
    if (wall === 'bounce') { if (t > room) return Math.max(-room, 2 * room - t); if (t < -room) return Math.min(room, -2 * room - t); return t; }
    return Math.min(room, Math.max(-room, t));
  }
  function Spring() { this.v = 0; this.p = 0; this.t = 0; this.dur = .13; this.bounce = 0; }
  Spring.prototype.step = function (dt) {
    var w = 2 * Math.PI / Math.max(this.dur, .02), z = Math.max(0, 1 - this.bounce), n = Math.max(1, Math.ceil(dt / .004)), h = dt / n;
    for (var i = 0; i < n; i++) { var a = -w * w * (this.p - this.t) - 2 * z * w * this.v; this.v += a * h; this.p += this.v * h; }
  };
  Spring.prototype.settled = function () { return Math.abs(this.p - this.t) < .05 && Math.abs(this.v) < .05; };
  function Dodge(el, opts) {
    var self = this, k; css(); this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in DEF) { var v = el.dataset[k]; if (v == null) continue; this.o[k] = k === 'taunts' ? (v.charAt(0) === '[' ? JSON.parse(v) : v.split('|')) : k === 'disabled' ? (v === '' || v === 'true') : NUM[k] ? parseFloat(v) : v; }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    var o = this.o, kids = Array.prototype.slice.call(el.childNodes).filter(function (n) { return n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()); });
    el.classList.add('dodge-field'); el.style.setProperty('--df-ink', o.inkColor); el.style.setProperty('--df-contrast', o.contrastColor); el.style.setProperty('--df-height', o.fieldHeight + 'px');
    this.mover = document.createElement('div'); this.mover.className = 'dodge-field__mover';
    if (kids.length) kids.forEach(function (n) { self.mover.appendChild(n); });
    else {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'dodge-field__pill'; b.setAttribute('aria-label', o.taunts[0]);
      var lab = document.createElement('span'); lab.className = 'dodge-field__labels';
      o.taunts.forEach(function (t, i) { var s = document.createElement('span'); s.className = 'dodge-field__label'; s.textContent = t; s.setAttribute('aria-hidden', 'true'); s.dataset.active = i === 0 ? 'true' : 'false'; lab.appendChild(s); });
      b.appendChild(lab); this.mover.appendChild(b); this.labels = lab.children;
    }
    el.appendChild(this.mover);
    this.rm = root.matchMedia('(prefers-reduced-motion: reduce)').matches; this.fine = root.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.sx = new Spring(); this.sy = new Spring(); this.dodges = 0; this.caught = false; this.inside = false; this.armed = true; this.p = null; this.bear = { x: 1, y: 0 }; this.raf = 0; this.last = 0; this.room = { x: 0, y: 0 };
    if (!this.fine && o.notice) { var n = document.createElement('p'); n.className = 'dodge-field__notice'; n.textContent = o.notice; el.appendChild(n); }
    this.measure = function () { self.room = { x: Math.max(0, (el.clientWidth - self.mover.offsetWidth) / 2 - INSET), y: Math.max(0, (el.clientHeight - self.mover.offsetHeight) / 2 - INSET) }; };
    this.measure(); this.ro = new ResizeObserver(this.measure); this.ro.observe(el); this.ro.observe(this.mover);
    this.mover.addEventListener('click', function () {
      self.caught = true; self.fire('catch'); self.state(); clearTimeout(self.hold);
      self.hold = setTimeout(function () { self.caught = false; self.dodges = 0; self.armed = false; self.state(); self.tick(); }, HOLD);
    });
    this.state();
    if (!this.fine || o.disabled) return;
    this.onMove = function (e) { if (e.pointerType === 'touch') return; self.p = { x: e.clientX, y: e.clientY }; self.tick(); };
    this.onLeave = function () { self.p = null; self.tick(); };
    this.onScroll = function () { self.tick(); };
    root.addEventListener('pointermove', this.onMove, { passive: true }); root.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    document.addEventListener('pointerleave', this.onLeave); root.addEventListener('blur', this.onLeave);
  }
  Dodge.prototype.fire = function (n, d) { this.el.dispatchEvent(new CustomEvent(n, { detail: d || {} })); };
  Dodge.prototype.gave = function () { return this.dodges >= Math.max(1, this.o.patience); };
  Dodge.prototype.still = function () { return this.gave() || this.caught || this.o.disabled || this.rm; };
  Dodge.prototype.state = function () {
    var m = this.mover, el = this.el, g = this.gave(), o = this.o;
    m.dataset.fled = (this.inside && !this.still()) ? 'true' : 'false'; m.dataset.relented = g ? 'true' : 'false'; m.dataset.caught = this.caught ? 'true' : 'false';
    el.dataset.dodges = this.dodges; el.dataset.gave = g; el.dataset.caught = this.caught; el.dataset.fleeing = this.inside && !this.still();
    if (this.labels) { var idx = g || this.caught ? o.taunts.length - 1 : Math.min(this.dodges, Math.max(0, o.taunts.length - 2)); for (var i = 0; i < this.labels.length; i++) this.labels[i].dataset.active = i === idx ? 'true' : 'false'; }
  };
  Dodge.prototype.tick = function () { var self = this; if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(function (t) { self.frame(t); }); } };
  Dodge.prototype.frame = function (t) {
    var o = this.o, dt = Math.min((t - this.last) / 1000, .05); this.last = t; this.raf = 0;
    var r = this.el.getBoundingClientRect(), zoom = r.width / (this.el.offsetWidth || r.width) || 1, p = this.p;
    var dx = p ? (p.x - (r.left + r.width / 2)) / zoom : Infinity, dy = p ? (p.y - (r.top + r.height / 2)) / zoom : Infinity, d = Math.hypot(dx, dy), inside = d <= o.radius, still = this.still();
    if (!still) {
      if (d < o.radius * COUNT_LINE) { if (this.armed) { this.armed = false; this.dodges++; this.fire('dodge', { count: this.dodges }); if (this.gave()) this.fire('relent'); this.state(); } }
      else if (d > o.radius) this.armed = true;
    }
    if (isFinite(d) && d > DEAD) this.bear = o.axis === 'x' ? { x: Math.sign(dx) || 1, y: 0 } : o.axis === 'y' ? { x: 0, y: Math.sign(dy) || 1 } : { x: dx / d, y: dy / d };
    var flee = inside && !this.still() ? Math.pow(1 - d / o.radius, o.falloff) : 0;
    this.sx.t = wallIt(-this.bear.x * flee * o.reach, this.room.x, o.wall); this.sy.t = wallIt(-this.bear.y * flee * o.reach, this.room.y, o.wall);
    var dur = (flee > 0 ? o.fleeDuration : o.returnDuration) / 1000, bn = flee > 0 ? 0 : o.returnBounce;
    this.sx.dur = this.sy.dur = dur; this.sx.bounce = this.sy.bounce = bn;
    if (this.rm) { this.sx.p = this.sy.p = this.sx.v = this.sy.v = 0; } else { this.sx.step(dt); this.sy.step(dt); }
    this.mover.style.transform = 'translate(' + this.sx.p.toFixed(2) + 'px,' + this.sy.p.toFixed(2) + 'px)';
    if (inside !== this.inside) { this.inside = inside; this.state(); }
    if (inside || this.inside || !this.sx.settled() || !this.sy.settled()) this.tick();
  };
  Dodge.prototype.destroy = function () {
    root.removeEventListener('pointermove', this.onMove); root.removeEventListener('scroll', this.onScroll, { capture: true }); document.removeEventListener('pointerleave', this.onLeave); root.removeEventListener('blur', this.onLeave);
    cancelAnimationFrame(this.raf); clearTimeout(this.hold); this.ro.disconnect(); this.el._dodge = null;
  };
  root.HeluDodge = { create: function (el, o) { return el._dodge || (el._dodge = new Dodge(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-dodge-field]'); for (var i = 0; i < l.length; i++) root.HeluDodge.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluDodge.init(); }); else root.HeluDodge.init();
})(window);
