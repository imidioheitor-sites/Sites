/*! VideoText vanilla (HELU/HEsites) — port do Video Text do Magic UI: vídeo aparece só dentro das letras (mask-image). Sem dependências.
 *  Uso:  <h2 data-videotext data-src="fundo.mp4" data-font-size="20" style="height:40vh">DOCES</h2>   ou   HeluVideoText.create(el,{src:'fundo.mp4',fontSize:20})
 *  Props (mesmos nomes/padrões): src, fontSize=20 (número = vw), fontWeight='bold', textAnchor='middle', dominantBaseline='middle', fontFamily (padrão: a fonte do site, herdada do elemento), preload='auto', autoPlay=true, muted=true, loop=true, as (tag ao criar com create(null,{as,...})).
 *  Texto = conteúdo do elemento (fica sr-only para leitores de tela). A máscara é recalculada no resize e quando as fontes carregam. Renderer: canvas (usa a fonte web do site) ou data-renderer="svg" (SVG data-URL, só fontes do sistema).
 *  Leve no mobile: telas <700px e saveData usam preload=metadata; com saveData/reduced-motion o vídeo fica parado no 1º quadro. Sem suporte a mask-image: texto sólido. O elemento precisa de altura (ex.: 40vh). */
(function (root) {
  'use strict';
  var DEF = { fontSize: 20, fontWeight: 'bold', textAnchor: 'middle', dominantBaseline: 'middle', fontFamily: '', preload: 'auto', autoPlay: true, muted: true, loop: true, renderer: 'canvas' };
  var BOOL = { autoPlay: 1, muted: 1, loop: 1 };
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function css() {
    if (document.getElementById('videotext-css')) return;
    var s = document.createElement('style'); s.id = 'videotext-css';
    s.textContent = '.video-text{position:relative;overflow:hidden;width:100%;margin:0}.video-text .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
      '.video-text__fx{position:absolute;inset:0;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%}.video-text__fx video{width:100%;height:100%;object-fit:cover;display:block}';
    document.head.appendChild(s);
  }
  function VT(el, opts) {
    var self = this, k; css(); this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in DEF) { var v = el.dataset[k]; if (v != null) this.o[k] = BOOL[k] ? (v === '' || v === 'true') : (k === 'fontSize' ? parseFloat(v) : v); }
    if (el.dataset.src) this.o.src = el.dataset.src; if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    var o = this.o, text = (el.textContent || '').trim(); this.text = text;
    this.supports = root.CSS && (CSS.supports('mask-image', 'url(x)') || CSS.supports('-webkit-mask-image', 'url(x)'));
    this.family = o.fontFamily || getComputedStyle(el).fontFamily || 'sans-serif';
    el.textContent = ''; el.classList.add('video-text');
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text; el.appendChild(sr);
    this.fx = document.createElement('div'); this.fx.className = 'video-text__fx'; this.fx.setAttribute('aria-hidden', 'true');
    var conn = navigator.connection || {}, save = !!conn.saveData, small = root.innerWidth < 700, still = save || (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var vd = document.createElement('video'); vd.src = o.src; vd.muted = !!o.muted; vd.defaultMuted = !!o.muted; vd.loop = !!o.loop; vd.playsInline = true; vd.setAttribute('playsinline', ''); vd.preload = (small || save) ? 'metadata' : o.preload;
    this.fx.appendChild(vd); el.appendChild(this.fx); this.video = vd;
    if (o.autoPlay && !still) { vd.autoplay = true; var p = vd.play(); if (p && p.catch) p.catch(function () {}); }
    if (!this.supports) { sr.className = ''; sr.style.cssText = 'position:relative;font-weight:bold;font-size:' + o.fontSize + 'vw'; this.fx.style.display = 'none'; return; }
    this.draw(); var t; this.ro = new ResizeObserver(function () { clearTimeout(t); t = setTimeout(function () { self.draw(); }, 60); }); this.ro.observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.draw(); });
  }
  VT.prototype.draw = function () {
    var o = this.o, w = Math.round(this.el.clientWidth), h = Math.round(this.el.clientHeight); if (!w || !h) return;
    var fs = o.fontSize * root.innerWidth / 100, x = o.textAnchor === 'start' ? 0 : o.textAnchor === 'end' ? w : w / 2, url;
    if (o.renderer === 'svg') {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><text x="' + x + '" y="50%" font-size="' + fs + '" font-weight="' + o.fontWeight + '" text-anchor="' + o.textAnchor + '" dominant-baseline="' + o.dominantBaseline + '" font-family="' + esc(this.family).replace(/"/g, "'") + '" fill="white">' + esc(this.text) + '</text></svg>';
      url = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    } else {
      var dpr = Math.min(root.devicePixelRatio || 1, 2), c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr; var g = c.getContext('2d'); g.scale(dpr, dpr);
      g.font = o.fontWeight + ' ' + fs + 'px ' + this.family; g.fillStyle = '#fff'; g.textAlign = o.textAnchor === 'start' ? 'left' : o.textAnchor === 'end' ? 'right' : 'center';
      g.textBaseline = o.dominantBaseline === 'middle' || o.dominantBaseline === 'central' ? 'middle' : o.dominantBaseline === 'hanging' ? 'top' : 'alphabetic';
      var y = g.textBaseline === 'middle' ? h / 2 : g.textBaseline === 'top' ? 0 : h * .75; g.fillText(this.text, x, y); url = 'url(' + c.toDataURL('image/png') + ')';
    }
    this.fx.style.webkitMaskImage = url; this.fx.style.maskImage = url;
  };
  VT.prototype.destroy = function () { if (this.ro) this.ro.disconnect(); this.video.pause(); this.el._vtext = null; };
  root.HeluVideoText = {
    create: function (el, o) { if (!el) { el = document.createElement((o && o.as) || 'div'); el.textContent = (o && o.text) || ''; } return el._vtext || (el._vtext = new VT(el, o)); },
    init: function (s) { var l = (s || document).querySelectorAll('[data-videotext]'); for (var i = 0; i < l.length; i++) root.HeluVideoText.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluVideoText.init(); }); else root.HeluVideoText.init();
})(window);
