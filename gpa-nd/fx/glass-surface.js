/*! GlassSurface vanilla (HELU/HEsites) — equivalente em JS puro do componente GlassSurface do React Bits.
 *  Sem dependências. Uso:
 *    <div data-glass data-width="320" data-height="76" data-border-radius="38" data-distortion-scale="-180"
 *         data-displace="0.5" data-background-opacity="0.1">Conteúdo</div>
 *    ou  HeluGlass.create(el, {width:320, height:76, borderRadius:38, ...})
 *  Props (mesmos nomes do React Bits, em camelCase nas opções e kebab-case em data-*):
 *    width, height (px | '100%' | 'auto'), borderRadius=20, borderWidth=0.07, brightness=50, opacity=0.93,
 *    blur=11, displace=0, backgroundOpacity=0, saturation=1, distortionScale=-180,
 *    redOffset=0, greenOffset=10, blueOffset=20, xChannel='R', yChannel='G', mixBlendMode='difference',
 *    shape (URL de SVG: recorta a superfície no formato), backdrop (seletor/elemento img|video para o renderer canvas),
 *    refraction (liga a refração por borda no renderer canvas), renderer='auto'|'svg'|'canvas'|'css'.
 *  Renderers: svg = backdrop-filter:url(#filtro) (Chromium); css = blur+saturate simples (Safari/Firefox);
 *  canvas = redesenha o backdrop dentro da superfície com refração e separação RGB (qualquer navegador).
 *  auto = svg se o navegador suporta, senão css (ou canvas quando há `backdrop` + `refraction`).
 *  Respeita prefers-reduced-transparency e reduced-motion (canvas de vídeo vira quadro estático). */
(function (root) {
  'use strict';
  var uid = 0;
  var DEF = {
    width: 'auto', height: 'auto', borderRadius: 20, borderWidth: 0.07, brightness: 50, opacity: 0.93, blur: 11,
    displace: 0, backgroundOpacity: 0, saturation: 1, distortionScale: -180, redOffset: 0, greenOffset: 10,
    blueOffset: 20, xChannel: 'R', yChannel: 'G', mixBlendMode: 'difference', shape: '', backdrop: '',
    refraction: false, renderer: 'auto'
  };
  var NUM = { borderRadius: 1, borderWidth: 1, brightness: 1, opacity: 1, blur: 1, displace: 1, backgroundOpacity: 1,
    saturation: 1, distortionScale: 1, redOffset: 1, greenOffset: 1, blueOffset: 1 };

  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function px(v) { return typeof v === 'number' ? v + 'px' : v; }

  var _svgOk;
  function supportsSvgFilter() {
    if (_svgOk !== undefined) return _svgOk;
    if (typeof navigator === 'undefined' || typeof document === 'undefined') return (_svgOk = false);
    var ua = navigator.userAgent;
    if (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg/.test(ua)) return (_svgOk = false);
    if (/Firefox/.test(ua)) return (_svgOk = false);
    var d = document.createElement('div');
    d.style.backdropFilter = 'url(#glass-test)';
    return (_svgOk = d.style.backdropFilter !== '');
  }
  function supportsBackdrop() {
    return typeof CSS !== 'undefined' && CSS.supports &&
      (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));
  }

  function Glass(el, opts) {
    this.el = el; this.id = 'glass-' + (++uid) + '-' + Math.random().toString(36).slice(2, 6);
    this.o = {}; var k;
    for (k in DEF) this.o[k] = DEF[k];
    for (k in el.dataset) { var c = camel(k.replace(/^glass/, '')); c = c.charAt(0).toLowerCase() + c.slice(1); if (c in DEF) this.o[c] = this._cast(c, el.dataset[k]); }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    this._init();
  }
  Glass.prototype._cast = function (k, v) {
    if (k === 'refraction') return v === '' || v === 'true' || v === '1';
    if (NUM[k]) return parseFloat(v);
    if ((k === 'width' || k === 'height') && /^-?[\d.]+$/.test(v)) return parseFloat(v);
    return v;
  };

  Glass.prototype._init = function () {
    var o = this.o, el = this.el, self = this;
    var kids = document.createDocumentFragment();
    while (el.firstChild) kids.appendChild(el.firstChild);
    this.content = document.createElement('div'); this.content.className = 'glass-surface__content';
    this.content.appendChild(kids); el.appendChild(this.content);
    el.classList.add('glass-surface');
    el.style.width = px(o.width === 'auto' ? '' : o.width) || '';
    el.style.height = px(o.height === 'auto' ? '' : o.height) || '';
    el.style.borderRadius = px(o.borderRadius);
    el.style.setProperty('--glass-frost', o.backgroundOpacity);
    el.style.setProperty('--glass-saturation', o.saturation);

    var want = o.renderer, mode;
    var hasBackdrop = !!o.backdrop;
    if (want === 'auto') {
      if (hasBackdrop && o.refraction && !supportsSvgFilter()) mode = 'canvas';
      else if (supportsSvgFilter()) mode = 'svg';
      else mode = 'css';
    } else mode = want;
    if (mode === 'canvas' && !hasBackdrop) mode = supportsSvgFilter() ? 'svg' : 'css';
    if (mode === 'svg' && !supportsSvgFilter()) mode = 'css';
    if (!supportsBackdrop() && mode !== 'canvas') mode = 'css';
    this.mode = mode;
    el.setAttribute('data-glass-renderer', mode);

    if (o.shape) {
      var m = 'url("' + o.shape + '")';
      el.style.webkitMaskImage = el.style.maskImage = m;
      el.style.webkitMaskSize = el.style.maskSize = '100% 100%';
      el.style.webkitMaskRepeat = el.style.maskRepeat = 'no-repeat';
      el.classList.add('glass-surface--shape');
    }

    if (mode === 'svg') this._svg();
    else if (mode === 'canvas') this._canvas();

    if ('ResizeObserver' in root) {
      this.ro = new ResizeObserver(function () { self.update(); });
      this.ro.observe(el);
    }
    this.update();
  };

  Glass.prototype._size = function () {
    var r = this.el.getBoundingClientRect();
    return { w: Math.max(1, Math.round(r.width)) || 400, h: Math.max(1, Math.round(r.height)) || 200 };
  };

  /* ---------- renderer SVG ---------- */
  Glass.prototype._svg = function () {
    var o = this.o, id = this.id, NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'glass-surface__filter'); svg.setAttribute('aria-hidden', 'true');
    var html = '<defs><filter id="' + id + '" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">' +
      '<feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" class="r" result="dispRed" xChannelSelector="' + o.xChannel + '" yChannelSelector="' + o.yChannel + '"/>' +
      '<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" class="g" result="dispGreen" xChannelSelector="' + o.xChannel + '" yChannelSelector="' + o.yChannel + '"/>' +
      '<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" class="b" result="dispBlue" xChannelSelector="' + o.xChannel + '" yChannelSelector="' + o.yChannel + '"/>' +
      '<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue"/>' +
      '<feBlend in="red" in2="green" mode="screen" result="rg"/><feBlend in="rg" in2="blue" mode="screen" result="output"/>' +
      '<feGaussianBlur in="output" class="gb"/></filter></defs>';
    svg.innerHTML = html;
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;opacity:0;z-index:-1';
    this.el.insertBefore(svg, this.el.firstChild);
    this.svg = svg;
    this.fImage = svg.querySelector('feImage');
    var f = this.el.style;
    f.setProperty('--glass-filter', 'url(#' + id + ')');
  };

  Glass.prototype._map = function (w, h) {
    var o = this.o, edge = Math.min(w, h) * (o.borderWidth * 0.5), rid = this.id + '-r', bid = this.id + '-b';
    var rr = Math.min(parseFloat(o.borderRadius) || 0, Math.min(w, h) / 2);
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + rid + '" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
      '<linearGradient id="' + bid + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="black"/>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + rr + '" fill="url(#' + rid + ')"/>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + rr + '" fill="url(#' + bid + ')" style="mix-blend-mode:' + o.mixBlendMode + '"/>' +
      '<rect x="' + edge + '" y="' + edge + '" width="' + (w - edge * 2) + '" height="' + (h - edge * 2) + '" rx="' + rr +
      '" fill="hsl(0 0% ' + o.brightness + '% / ' + o.opacity + ')" style="filter:blur(' + o.blur + 'px)"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(s);
  };

  /* ---------- renderer canvas (refração + RGB no backdrop informado) ---------- */
  Glass.prototype._canvas = function () {
    var self = this, b = this.o.backdrop;
    this.bd = typeof b === 'string' ? document.querySelector(b) : (b && b.current) || b;
    if (!this.bd) { this.mode = 'css'; this.el.setAttribute('data-glass-renderer', 'css'); return; }
    this.cv = document.createElement('canvas'); this.cv.className = 'glass-surface__canvas';
    this.el.insertBefore(this.cv, this.el.firstChild);
    this.ctx = this.cv.getContext('2d', { willReadFrequently: true });
    this.isVideo = this.bd.tagName === 'VIDEO';
    this.reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.isVideo && !this.bd.complete) this.bd.addEventListener('load', function () { self.update(); });
    var tick = function () {
      self.raf = 0;
      if (self.isVideo && !self.reduced && self.visible !== false) { self._paint(); self.raf = requestAnimationFrame(tick); }
    };
    this._tick = tick;
    if ('IntersectionObserver' in root) {
      this.io = new IntersectionObserver(function (e) {
        self.visible = e[0].isIntersecting;
        if (self.visible && self.isVideo && !self.raf && !self.reduced) self.raf = requestAnimationFrame(tick);
      });
      this.io.observe(this.el);
    }
    root.addEventListener('scroll', function () { if (!self.isVideo) self._paint(); }, { passive: true });
    if (this.isVideo) this.raf = requestAnimationFrame(tick);
  };

  Glass.prototype._paint = function () {
    var cv = this.cv, ctx = this.ctx, bd = this.bd, o = this.o;
    if (!cv || !bd) return;
    var r = this.el.getBoundingClientRect(), br = bd.getBoundingClientRect();
    var w = cv.width, h = cv.height;
    if (!w || !h || !br.width) return;
    var sw = bd.videoWidth || bd.naturalWidth, sh = bd.videoHeight || bd.naturalHeight;
    if (!sw || !sh) return;
    // object-fit: cover do backdrop
    var sc = Math.max(br.width / sw, br.height / sh), dw = sw * sc, dh = sh * sc;
    var ox = br.left + (br.width - dw) / 2, oy = br.top + (br.height - dh) / 2;
    var dpr = cv.width / r.width;
    var base = document.createElement('canvas'); base.width = w; base.height = h;
    var bx = base.getContext('2d');
    if (o.blur) bx.filter = 'blur(' + Math.min(o.blur, 14) * 0.3 + 'px)';
    bx.drawImage(bd, (r.left - ox) / sc, (r.top - oy) / sc, r.width / sc, r.height / sc, 0, 0, w, h);
    bx.filter = 'none';
    var out;
    try { out = ctx.createImageData(w, h); var src = bx.getImageData(0, 0, w, h); }
    catch (e) { ctx.drawImage(base, 0, 0); return; }
    if (!o.refraction) { ctx.putImageData(src, 0, 0); return; }
    var map = this._lut(w, h, dpr), sd = src.data, od = out.data, i, px, ch;
    var sat = o.saturation, scl = [o.distortionScale + o.redOffset, o.distortionScale + o.greenOffset, o.distortionScale + o.blueOffset];
    for (i = 0; i < w * h; i++) {
      var nx = map[i * 3], ny = map[i * 3 + 1], f = map[i * 3 + 2];
      for (ch = 0; ch < 3; ch++) {
        var k = (scl[ch] / 180) * f * 0.5; // -180 ≈ lente forte
        var x = Math.round((i % w) - nx * k * Math.min(w, h) * 0.5), y = Math.round(Math.floor(i / w) - ny * k * Math.min(w, h) * 0.5);
        x = x < 0 ? 0 : x >= w ? w - 1 : x; y = y < 0 ? 0 : y >= h ? h - 1 : y;
        od[i * 4 + ch] = sd[(y * w + x) * 4 + ch];
      }
      od[i * 4 + 3] = 255;
    }
    if (sat !== 1) for (i = 0; i < w * h; i++) {
      var R = od[i * 4], G = od[i * 4 + 1], B = od[i * 4 + 2], L = 0.299 * R + 0.587 * G + 0.114 * B;
      od[i * 4] = L + (R - L) * sat; od[i * 4 + 1] = L + (G - L) * sat; od[i * 4 + 2] = L + (B - L) * sat;
    }
    ctx.putImageData(out, 0, 0);
  };

  // tabela (normal x, normal y, intensidade na borda) por pixel, recalculada só quando o tamanho muda
  Glass.prototype._lut = function (w, h, dpr) {
    var o = this.o, key = w + 'x' + h + ':' + o.borderRadius + ':' + o.borderWidth;
    if (this._lutKey === key) return this._lutData;
    var rr = Math.min(parseFloat(o.borderRadius) * dpr, Math.min(w, h) / 2), edge = Math.max(2, Math.min(w, h) * (o.borderWidth * 0.5 + 0.18));
    var d = new Float32Array(w * h * 3), hw = w / 2, hh = h / 2, x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var px = x + 0.5 - hw, py = y + 0.5 - hh;
      var qx = Math.abs(px) - (hw - rr), qy = Math.abs(py) - (hh - rr);
      var ax = Math.max(qx, 0), ay = Math.max(qy, 0), len = Math.sqrt(ax * ax + ay * ay);
      var sdf = len + Math.min(Math.max(qx, qy), 0) - rr; // <0 dentro
      var nx, ny;
      if (len > 0) { nx = (ax / len) * Math.sign(px); ny = (ay / len) * Math.sign(py); }
      else if (qx > qy) { nx = Math.sign(px); ny = 0; } else { nx = 0; ny = Math.sign(py); }
      var t = Math.min(1, Math.max(0, 1 + sdf / edge)); // 1 na borda, 0 no miolo
      var i = (y * w + x) * 3; d[i] = nx; d[i + 1] = ny; d[i + 2] = t * t * (3 - 2 * t);
    }
    this._lutKey = key; this._lutData = d; return d;
  };

  /* ---------- atualização ---------- */
  Glass.prototype.update = function () {
    var o = this.o, s = this._size();
    if (this.mode === 'svg' && this.svg) {
      this.fImage.setAttribute('href', this._map(s.w, s.h));
      var sc = [o.distortionScale + o.redOffset, o.distortionScale + o.greenOffset, o.distortionScale + o.blueOffset];
      this.svg.querySelector('.r').setAttribute('scale', sc[0]);
      this.svg.querySelector('.g').setAttribute('scale', sc[1]);
      this.svg.querySelector('.b').setAttribute('scale', sc[2]);
      this.svg.querySelector('.gb').setAttribute('stdDeviation', o.displace);
    } else if (this.mode === 'canvas' && this.cv) {
      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      this.cv.width = Math.round(s.w * dpr); this.cv.height = Math.round(s.h * dpr);
      this._lutKey = null;
      this._paint();
    }
  };
  Glass.prototype.destroy = function () {
    if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); if (this.raf) cancelAnimationFrame(this.raf);
    if (this.svg) this.svg.remove(); if (this.cv) this.cv.remove();
  };

  /* ---------- CSS base (injetado uma vez) ---------- */
  function css() {
    if (document.getElementById('glass-surface-css')) return;
    var st = document.createElement('style'); st.id = 'glass-surface-css';
    st.textContent =
      '.glass-surface{position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;isolation:isolate;transition:opacity .26s ease-out;' +
      'background:rgba(255,255,255,var(--glass-frost,0));box-shadow:0 0 2px 1px color-mix(in oklch,white,transparent 65%) inset,0 0 10px 4px color-mix(in oklch,white,transparent 85%) inset,0 4px 16px rgba(17,17,26,.05),0 8px 24px rgba(17,17,26,.05),0 16px 56px rgba(17,17,26,.05),0 4px 16px rgba(17,17,26,.05) inset,0 8px 24px rgba(17,17,26,.05) inset,0 16px 56px rgba(17,17,26,.05) inset}' +
      '.glass-surface--shape{box-shadow:none}' +
      '.glass-surface__content{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:.5rem;border-radius:inherit}' +
      '.glass-surface__canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;border-radius:inherit}' +
      '.glass-surface[data-glass-renderer=svg]{-webkit-backdrop-filter:var(--glass-filter) saturate(var(--glass-saturation,1));backdrop-filter:var(--glass-filter) saturate(var(--glass-saturation,1))}' +
      '.glass-surface[data-glass-renderer=css]{background:rgba(255,255,255,max(var(--glass-frost,0),.12));-webkit-backdrop-filter:blur(12px) saturate(1.8) brightness(1.1);backdrop-filter:blur(12px) saturate(1.8) brightness(1.1);box-shadow:0 8px 32px rgba(31,38,135,.2),0 2px 16px rgba(31,38,135,.1),inset 0 0 0 1px rgba(255,255,255,.35),inset 0 1px 0 rgba(255,255,255,.5)}' +
      '.glass-surface[data-glass-renderer=canvas]{box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),inset 0 1px 0 rgba(255,255,255,.5),0 8px 32px rgba(0,0,0,.18)}' +
      '@media (prefers-reduced-transparency:reduce){.glass-surface[data-glass-renderer]{background:rgba(20,20,24,.78);-webkit-backdrop-filter:none;backdrop-filter:none}.glass-surface__canvas{display:none}}';
    document.head.appendChild(st);
  }

  var HeluGlass = {
    create: function (el, opts) { css(); if (el._glass) return el._glass; return (el._glass = new Glass(el, opts)); },
    init: function (scope) {
      css();
      var list = (scope || document).querySelectorAll('[data-glass]'), out = [];
      for (var i = 0; i < list.length; i++) out.push(HeluGlass.create(list[i]));
      return out;
    },
    supportsSvgFilter: supportsSvgFilter
  };
  root.HeluGlass = HeluGlass;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { HeluGlass.init(); });
  else HeluGlass.init();
})(window);
