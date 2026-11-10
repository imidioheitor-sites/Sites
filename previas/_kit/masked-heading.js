/*! MaskedHeading vanilla (HELU/HEsites) — port direto do MaskedHeading do React Bits: título em que imagem ou vídeo aparece só dentro das letras (clip-path SVG por letra), com entradas rise/scale/blur/wipe/fade, spotlight, outline, parallax, drift e hoverZoom. O gsap foi trocado por animação própria (rAF). Sem dependências.
 *  Uso:  <h2 data-masked-heading data-media-type="video" data-src="reel.mp4" data-poster="reel.jpg" data-reveal="scale" data-spotlight data-outline>Shot on location</h2>   ou   HeluMasked.create(el,{src:'x.jpg'})
 *  Props (mesmos nomes/padrões): text (padrão: texto do elemento), mediaType='image'|'video', src, poster, reveal='rise'|'scale'|'blur'|'wipe'|'fade'|'none', trigger='view'|'mount'|'hover', duration=1.1, stagger=.09, spotlight=false, spotlightRadius=160,
 *  outline=false, outlineColor='' (=currentColor), outlineWidth=1, fillScale=1.25, parallax=26, drift=18, hoverZoom=0, brightness=1, saturation=1, grayscale=false, tint='', align='center', weight=700, tracking=-0.03, lineHeight=1.06, textScale=.115 (fração da largura).
 *  O elemento (h1/h2/…) mantém a semântica. prefers-reduced-motion: sem entrada/drift e vídeo pausado. Vídeo leve no mobile (<700px / saveData: preload metadata, sem autoplay). Irmão do Video Text, com mais controle. Não usar no hero (1º quadro só vídeo). */
(function (root) {
  'use strict';
  var DEF = { text: '', mediaType: 'image', src: '', poster: '', fillScale: 1.25, parallax: 26, drift: 18, hoverZoom: 0, brightness: 1, saturation: 1, grayscale: false, tint: '', spotlight: false, spotlightRadius: 160, outline: false, outlineColor: '', outlineWidth: 1, reveal: 'rise', duration: 1.1, stagger: 0.09, trigger: 'view', align: 'center', weight: 700, tracking: -0.03, lineHeight: 1.06, textScale: 0.115 };
  var STR = { text: 1, mediaType: 1, src: 1, poster: 1, tint: 1, outlineColor: 1, reveal: 1, trigger: 1, align: 1 }, BOOL = { grayscale: 1, spotlight: 1, outline: 1 };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var SPOT_MASK = (function () { var st = []; for (var i = 0; i < 9; i++) { var t = i / 8, u = clamp((t - 0.1) / 0.9, 0, 1); st.push('rgba(0, 0, 0, ' + (u * u * u * (u * (u * 6 - 15) + 10)).toFixed(3) + ') ' + (t * 100).toFixed(1) + '%'); } return 'radial-gradient(circle var(--mh-spot-r, 160px) at var(--mh-spot-x, 50%) var(--mh-spot-y, 50%), ' + st.join(', ') + ')'; })();
  var EASE = { 'power4.out': function (t) { return 1 - Math.pow(1 - t, 5); }, 'expo.out': function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }, 'power2.out': function (t) { return 1 - Math.pow(1 - t, 3); }, 'power3.out': function (t) { return 1 - Math.pow(1 - t, 4); }, 'power3.inOut': function (t) { return t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; } };
  var uid = 0, NS = 'http://www.w3.org/2000/svg';
  function css() {
    if (document.getElementById('masked-heading-css')) return;
    var s = document.createElement('style'); s.id = 'masked-heading-css';
    s.textContent = '.masked-heading{position:relative;width:100%;margin:0;padding:0;text-wrap:balance;-webkit-font-smoothing:antialiased}.masked-heading__measure{color:transparent}.masked-heading__word{display:inline-block;white-space:pre}.masked-heading__word:not(:last-child)::after{content:" "}' +
      '.masked-heading__baseline{display:inline-block;width:0;height:0}.masked-heading__defs{position:absolute;width:0;height:0;overflow:hidden}.masked-heading__reveal{position:absolute;inset:0;display:block;pointer-events:none}.masked-heading__clip{position:absolute;inset:0;display:block}' +
      '.masked-heading__media{position:absolute;inset:0;display:block;background:color-mix(in srgb,currentColor 10%,transparent);will-change:transform,filter}.masked-heading__tint{position:absolute;inset:0;display:block;mix-blend-mode:color;pointer-events:none}.masked-heading__spot{position:absolute;inset:0;display:block;pointer-events:none}' +
      '.masked-heading__spot--tone{background:#808080;mix-blend-mode:saturation}.masked-heading__spot--shade{background:#000;opacity:.55}.masked-heading__outline{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;fill:none;stroke-linejoin:round}' +
      '.masked-heading__source{display:block;width:100%;height:100%;object-fit:cover;user-select:none;-webkit-user-drag:none}';
    document.head.appendChild(s);
  }
  function Mask(rootEl, opts) {
    css(); var self = this, k; this.root = rootEl; var S = {};
    for (k in DEF) S[k] = DEF[k];
    var own = rootEl.textContent.trim(); if (own) S.text = own;
    for (k in DEF) { var v = rootEl.dataset[k]; if (v != null) S[k] = STR[k] ? v : BOOL[k] ? (v === '' || v === 'true') : parseFloat(v); }
    if (opts) for (k in opts) if (opts[k] !== undefined) S[k] = opts[k];
    if (!S.text) S.text = 'Designed in the details'; this.S = S;
    var words = String(S.text).split(/\s+/).filter(Boolean), glyphs = []; words.forEach(function (w, wi) { Array.from(w).forEach(function (c) { glyphs.push({ char: c, w: wi }); }); });
    this.words = words; this.glyphs = glyphs; this.clipId = 'mh-' + (++uid);
    rootEl.textContent = ''; rootEl.classList.add('masked-heading'); rootEl.style.textAlign = S.align; rootEl.style.fontWeight = S.weight; rootEl.style.letterSpacing = S.tracking + 'em'; rootEl.style.lineHeight = S.lineHeight;
    // medida (texto real, acessível)
    this.measure = document.createElement('span'); this.measure.className = 'masked-heading__measure'; this.wordEls = []; this.baseEls = [];
    words.forEach(function (w) { var sp = document.createElement('span'); sp.className = 'masked-heading__word'; sp.appendChild(document.createTextNode(w)); var i = document.createElement('i'); i.className = 'masked-heading__baseline'; sp.appendChild(i); self.measure.appendChild(sp); self.wordEls.push(sp); self.baseEls.push(i); });
    rootEl.appendChild(this.measure);
    // defs
    var defs = document.createElementNS(NS, 'svg'); defs.setAttribute('class', 'masked-heading__defs'); defs.setAttribute('aria-hidden', 'true'); defs.setAttribute('focusable', 'false');
    var d = document.createElementNS(NS, 'defs'), cp = document.createElementNS(NS, 'clipPath'); cp.id = this.clipId; cp.setAttribute('clipPathUnits', 'userSpaceOnUse'); this.glyphEls = [];
    glyphs.forEach(function (g) { var t = document.createElementNS(NS, 'text'); t.textContent = g.char; cp.appendChild(t); self.glyphEls.push(t); }); d.appendChild(cp); defs.appendChild(d); rootEl.appendChild(defs);
    // camadas
    this.layer = document.createElement('span'); this.layer.className = 'masked-heading__reveal';
    this.clip = document.createElement('span'); this.clip.className = 'masked-heading__clip'; this.clip.style.clipPath = 'url(#' + this.clipId + ')'; this.clip.style.webkitClipPath = 'url(#' + this.clipId + ')'; this.clip.style.setProperty('--mh-spot-r', Math.max(1, S.spotlightRadius) + 'px');
    this.media = document.createElement('span'); this.media.className = 'masked-heading__media';
    var small = root.innerWidth < 700 || (navigator.connection && navigator.connection.saveData), still = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (S.mediaType === 'video') {
      var vd = document.createElement('video'); vd.className = 'masked-heading__source'; if (S.src) vd.src = S.src; if (S.poster) vd.poster = S.poster; vd.muted = true; vd.defaultMuted = true; vd.loop = true; vd.playsInline = true; vd.setAttribute('playsinline', ''); vd.preload = small ? 'metadata' : 'auto';
      if (!still && !(navigator.connection && navigator.connection.saveData)) { vd.autoplay = true; var pr = vd.play(); if (pr && pr.catch) pr.catch(function () {}); } this.media.appendChild(vd);
    } else { var im = document.createElement('img'); im.className = 'masked-heading__source'; if (S.src) im.src = S.src; im.alt = ''; im.draggable = false; this.media.appendChild(im); }
    this.clip.appendChild(this.media);
    if (S.tint) { var tn = document.createElement('span'); tn.className = 'masked-heading__tint'; tn.style.background = S.tint; this.clip.appendChild(tn); }
    if (S.spotlight) ['tone', 'shade'].forEach(function (n) { var sp = document.createElement('span'); sp.className = 'masked-heading__spot masked-heading__spot--' + n; sp.style.maskImage = SPOT_MASK; sp.style.webkitMaskImage = SPOT_MASK; self.clip.appendChild(sp); });
    this.layer.appendChild(this.clip); rootEl.appendChild(this.layer);
    this.lineEls = [];
    if (S.outline) {
      var ol = document.createElementNS(NS, 'svg'); ol.setAttribute('class', 'masked-heading__outline'); ol.setAttribute('aria-hidden', 'true'); ol.setAttribute('focusable', 'false'); ol.style.stroke = S.outlineColor || 'currentColor'; ol.style.strokeWidth = Math.max(0, S.outlineWidth);
      glyphs.forEach(function (g) { var t = document.createElementNS(NS, 'text'); t.textContent = g.char; ol.appendChild(t); self.lineEls.push(t); }); rootEl.appendChild(ol);
    }
    this.boxes = []; this.states = glyphs.map(function () { return { x: 0, y: 0, s: 1 }; }); this.off = { x: 0, y: 0, tx: 0, ty: 0, zoom: 0, px: 0, py: 0, sx: 0, sy: 0, lit: false }; this.paint = { transform: '', filter: '', spot: '' }; this.tween = null;
    this.mq = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
    this.ro = new ResizeObserver(function () { self.sync(); }); this.ro.observe(rootEl); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (self.alive) self.sync(); }, function () {});
    this.alive = true; this.raf = 0; this.last = 0; this.clock = 0; this.visible = true; this.hovering = false; this.sync();
    this.onMove = function (e) { var r = rootEl.getBoundingClientRect(), s = self.S, off = self.off; off.tx = clamp(((e.clientX - r.left) / (r.width || 1)) * 2 - 1, -1, 1) * -Math.max(0, s.parallax); off.ty = clamp(((e.clientY - r.top) / (r.height || 1)) * 2 - 1, -1, 1) * -Math.max(0, s.parallax); off.px = ((e.clientX - r.left) / (r.width || 1)) * rootEl.clientWidth; off.py = ((e.clientY - r.top) / (r.height || 1)) * rootEl.clientHeight; if (s.spotlight) self.wake(); };
    this.onEnter = function (e) { self.hovering = e.pointerType !== 'touch'; self.onMove(e); self.wake(); };
    this.onLeave = function () { self.hovering = false; self.off.tx = 0; self.off.ty = 0; self.wake(); };
    this.io = new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; if (self.visible) self.wake(); }); this.io.observe(rootEl);
    rootEl.addEventListener('pointermove', this.onMove); rootEl.addEventListener('pointerenter', this.onEnter); rootEl.addEventListener('pointerleave', this.onLeave);
    this.setupReveal(); this.wake();
  }
  Mask.prototype.place = function () {
    var r = this.root, s = this.S, off = this.off, p = this.paint, scale = s.fillScale * (1 + Math.max(0, off.zoom)), mx = Math.max(0, (scale - 1) / 2 * r.clientWidth), my = Math.max(0, (scale - 1) / 2 * r.clientHeight);
    var tr = 'translate3d(' + clamp(off.x, -mx, mx).toFixed(2) + 'px, ' + clamp(off.y, -my, my).toFixed(2) + 'px, 0) scale(' + scale.toFixed(4) + ')', fl = 'brightness(' + s.brightness + ') saturate(' + s.saturation + ')' + (s.grayscale ? ' grayscale(1)' : '');
    if (p.transform !== tr) { p.transform = tr; this.media.style.transform = tr; } if (p.filter !== fl) { p.filter = fl; this.media.style.filter = fl; }
    if (s.spotlight) { var sp = off.sx.toFixed(1) + 'px ' + off.sy.toFixed(1) + 'px'; if (p.spot !== sp) { p.spot = sp; this.clip.style.setProperty('--mh-spot-x', off.sx.toFixed(1) + 'px'); this.clip.style.setProperty('--mh-spot-y', off.sy.toFixed(1) + 'px'); } }
  };
  Mask.prototype.renderGlyphs = function () {
    for (var i = 0; i < this.glyphEls.length; i++) {
      var g = this.glyphEls[i], b = this.boxes[i], st = this.states[i];
      if (!b || !st || (st.x === 0 && st.y === 0 && st.s === 1)) { if (g.hasAttribute('transform')) g.removeAttribute('transform'); continue; }
      var s = Math.max(st.s, 0.0001), tx = b.cx * (1 - s) + st.x * (b.cx - b.lc), ty = b.cy * (1 - s) + st.y; g.setAttribute('transform', 'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') scale(' + s.toFixed(4) + ')');
    }
  };
  Mask.prototype.sync = function () {
    var r = this.root, s = this.S; r.style.fontSize = clamp(r.clientWidth * s.textScale, 20, 200).toFixed(1) + 'px';
    var cs = getComputedStyle(this.measure), fontPx = parseFloat(cs.fontSize) || 48, rr = r.getBoundingClientRect(), ratio = r.offsetWidth ? rr.width / r.offsetWidth || 1 : 1, range = document.createRange(), boxes = [], index = 0;
    for (var w = 0; w < this.wordEls.length; w++) {
      var box = this.wordEls[w], base = this.baseEls[w], node = box && box.firstChild;
      if (!box || !base || !node || node.nodeType !== 3) { index += Array.from(box ? box.textContent : '').length; continue; }
      var br = box.getBoundingClientRect(), baseline = base.offsetTop, offset = 0, chars = Array.from(node.data);
      for (var c = 0; c < chars.length; c++) { var ch = chars[c]; range.setStart(node, offset); range.setEnd(node, offset + ch.length); offset += ch.length; var rc = range.getBoundingClientRect(), x = box.offsetLeft + (rc.left - br.left) / ratio, wd = rc.width / ratio; boxes[index] = { x: x, y: baseline, w: wd, cx: x + wd / 2, cy: baseline - fontPx * 0.36, lc: 0 }; index++; }
    }
    var lines = {}, i; boxes.forEach(function (b) { if (!b) return; var l = lines[b.y] || (lines[b.y] = { left: Infinity, right: -Infinity }); l.left = Math.min(l.left, b.x); l.right = Math.max(l.right, b.x + b.w); });
    boxes.forEach(function (b) { if (!b) return; var l = lines[b.y]; b.lc = (l.left + l.right) / 2; }); this.boxes = boxes;
    for (i = 0; i < boxes.length; i++) { var b2 = boxes[i]; [this.glyphEls[i], this.lineEls[i]].forEach(function (el) { if (!el || !b2) return; el.setAttribute('x', b2.x.toFixed(2)); el.setAttribute('y', '' + b2.y); el.style.fontFamily = cs.fontFamily; el.style.fontSize = cs.fontSize; el.style.fontWeight = cs.fontWeight; el.style.fontStyle = cs.fontStyle; el.style.letterSpacing = cs.letterSpacing; }); }
    this.renderGlyphs(); this.place();
  };
  Mask.prototype.frame = function (now) {
    var self = this, r = this.root, s = this.S, off = this.off; this.raf = 0; var dt = this.last ? Math.min(.05, (now - this.last) / 1000) : 0; this.last = now; var still = !!(this.mq && this.mq.matches);
    if (still) { off.x = 0; off.y = 0; off.zoom = 0; } else {
      this.clock += dt; var dx = Math.sin(this.clock * .21) * s.drift, dy = Math.cos(this.clock * .17) * s.drift * .6, ease = 1 - Math.exp(-dt / .18);
      off.x += (off.tx + dx - off.x) * ease; off.y += (off.ty + dy - off.y) * ease; off.zoom += ((this.hovering ? s.hoverZoom : 0) - off.zoom) * (1 - Math.exp(-dt / .35));
    }
    if (s.spotlight) {
      var w = r.clientWidth, h = r.clientHeight, gx = w / 2, gy = h / 2;
      if (this.hovering) { gx = off.px; gy = off.py; } else if (!still) { gx = w * (.5 + .36 * Math.sin(this.clock * .37)); gy = h * (.5 + .22 * Math.sin(this.clock * .61 + .9)); }
      if (!off.lit || still) { off.sx = gx; off.sy = gy; off.lit = true; } else { var f = 1 - Math.exp(-dt / (this.hovering ? .12 : .6)); off.sx += (gx - off.sx) * f; off.sy += (gy - off.sy) * f; }
    } else off.lit = false;
    this.place(); if (this.visible && !still && this.alive) this.raf = requestAnimationFrame(function (t) { self.frame(t); });
  };
  Mask.prototype.wake = function () { var self = this; if (this.raf || !this.alive) return; this.last = 0; this.raf = requestAnimationFrame(function (t) { self.frame(t); }); };
  // mini-tween (substitui o gsap)
  Mask.prototype.run = function (dur, ease, onUpdate, onDone) {
    var self = this, t0 = performance.now(), f = EASE[ease] || EASE['power3.out'], tw = { dead: false };
    var step = function (now) { if (tw.dead) return; var t = clamp((now - t0) / 1000 / dur, 0, 1); onUpdate(t, f); if (t < 1) tw.id = requestAnimationFrame(step); else if (onDone) onDone(); };
    tw.id = requestAnimationFrame(step); tw.kill = function () { tw.dead = true; cancelAnimationFrame(tw.id); }; return tw;
  };
  Mask.prototype.em = function () { return parseFloat(getComputedStyle(this.root).fontSize) || 48; };
  Mask.prototype.clearLayer = function () { this.layer.style.opacity = '1'; this.layer.style.transform = ''; this.layer.style.clipPath = ''; this.layer.style.filter = ''; };
  Mask.prototype.settle = function () { this.states.forEach(function (st) { st.x = 0; st.y = 0; st.s = 1; }); this.renderGlyphs(); this.clearLayer(); };
  Mask.prototype.restState = function () {
    var S = this.S, size = this.em(), layer = this.layer, rv = S.reveal;
    if (rv === 'rise') this.states.forEach(function (st) { st.y = size * 1.15; });
    else if (rv === 'scale') this.states.forEach(function (st) { st.y = size * .1; st.s = 0; });
    else if (rv === 'blur') { this.states.forEach(function (st) { st.x = .22; }); layer.style.opacity = '0'; layer.style.filter = 'blur(' + (size * .3).toFixed(2) + 'px)'; }
    else if (rv === 'wipe') layer.style.clipPath = 'inset(0% 100% 0% 0%)';
    else if (rv === 'fade') { layer.style.opacity = '0'; layer.style.transform = 'scale(1.08)'; }
    this.renderGlyphs();
  };
  Mask.prototype.play = function () {
    var self = this, S = this.S, size = this.em(), states = this.states, glyphs = this.glyphs, layer = this.layer, dur = S.duration, rv = S.reveal;
    if (this.tween) this.tween.kill();
    var staggered = function (ease, delayOf, from, to, total) {
      var last = delayOf(states.length - 1);
      return self.run(dur + last, ease, function (t) { states.forEach(function (st, i) { var d = delayOf(i), u = clamp((t * (dur + last) - d) / dur, 0, 1), e = (EASE[ease])(u); for (var key in to) st[key] = from[key] + (to[key] - from[key]) * e; }); self.renderGlyphs(); });
    };
    if (rv === 'rise') { this.clearLayer(); this.tween = staggered('power4.out', function (i) { return glyphs[i].w * S.stagger; }, { y: size * 1.15 }, { y: 0 }); states.forEach(function (st) { st.x = 0; st.s = 1; st.y = size * 1.15; }); this.renderGlyphs(); }
    else if (rv === 'scale') { this.clearLayer(); states.forEach(function (st) { st.x = 0; st.y = size * .1; st.s = 0; }); this.tween = staggered('expo.out', function (i) { return i * S.stagger * .35; }, { y: size * .1, s: 0 }, { y: 0, s: 1 }); this.renderGlyphs(); }
    else if (rv === 'blur') {
      layer.style.transform = ''; layer.style.clipPath = ''; layer.style.opacity = '0'; layer.style.filter = 'blur(' + (size * .3).toFixed(2) + 'px)'; var d2 = dur * 1.2;
      this.tween = this.run(d2, 'expo.out', function (t, f) { states.forEach(function (st) { st.x = .22 * (1 - f(t)); }); var e = EASE['power2.out'](t), b = size * .3 * (1 - e); layer.style.filter = b > .05 ? 'blur(' + b.toFixed(2) + 'px)' : ''; layer.style.opacity = e.toFixed(3); self.renderGlyphs(); });
    }
    else if (rv === 'wipe') { this.settle(); layer.style.clipPath = 'inset(0% 100% 0% 0%)'; this.tween = this.run(dur, 'power3.inOut', function (t, f) { layer.style.clipPath = 'inset(0% ' + (100 * (1 - f(t))) + '% 0% 0%)'; }, function () { layer.style.clipPath = ''; }); }
    else { this.settle(); layer.style.opacity = '0'; layer.style.transform = 'scale(1.08)'; this.tween = this.run(dur, 'power3.out', function (t, f) { var e = f(t); layer.style.opacity = e.toFixed(3); layer.style.transform = 'scale(' + (1.08 - .08 * e).toFixed(4) + ')'; }, function () { layer.style.transform = ''; }); }
  };
  Mask.prototype.setupReveal = function () {
    var self = this, S = this.S, reduce = this.mq && this.mq.matches; if (!this.glyphs.length) return;
    if (S.reveal === 'none' || reduce) { this.settle(); return; }
    if (S.trigger === 'hover') { this.settle(); this.onPlay = function () { self.play(); }; this.root.addEventListener('pointerenter', this.onPlay); return; }
    if (S.trigger === 'view') { this.settle(); this.restState(); this.io2 = new IntersectionObserver(function (en) { if (en.some(function (e) { return e.isIntersecting; })) { self.play(); self.io2.disconnect(); } }, { threshold: .25 }); this.io2.observe(this.root); return; }
    this.play();
  };
  Mask.prototype.destroy = function () { this.alive = false; cancelAnimationFrame(this.raf); if (this.tween) this.tween.kill(); this.ro.disconnect(); this.io.disconnect(); if (this.io2) this.io2.disconnect(); this.root.removeEventListener('pointermove', this.onMove); this.root.removeEventListener('pointerenter', this.onEnter); this.root.removeEventListener('pointerleave', this.onLeave); if (this.onPlay) this.root.removeEventListener('pointerenter', this.onPlay); this.root._masked = null; };
  root.HeluMasked = { create: function (el, o) { return el._masked || (el._masked = new Mask(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-masked-heading]'); for (var i = 0; i < l.length; i++) root.HeluMasked.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluMasked.init(); }); else root.HeluMasked.init();
})(window);
