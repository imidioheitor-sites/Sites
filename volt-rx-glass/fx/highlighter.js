/*! TextHighlighter vanilla (HELU/HEsites) — equivalente do Text Highlighter do Magic UI (traço de marca-texto desenhado à mão). Próprio em SVG, sem rough-notation nem dependências.
 *  Uso:  <span data-highlighter data-action="highlight" data-color="#ffd1dc">palavra</span>   ou   HeluMark.create(el,{action:'circle'})
 *  Props (mesmos nomes/padrões): action = highlight|underline|box|circle|strike-through|crossed-off|bracket ('highlight'), color='#ffd1dc', strokeWidth=1.5, animationDuration=600 (ms), iterations=2, padding=2 (px), multiline=true, isView=true (anima só quando entra na tela; data-is-view="false" desenha já).
 *  Redesenha no resize (ResizeObserver) e quando as fontes carregam, sem reanimar. prefers-reduced-motion: desenha direto. highlight vai atrás do texto; os demais por cima. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var DEF = { action: 'highlight', color: '#ffd1dc', strokeWidth: 1.5, animationDuration: 600, iterations: 2, padding: 2, multiline: true, isView: true };
  var NUM = { strokeWidth: 1, animationDuration: 1, iterations: 1, padding: 1 }, BOOL = { multiline: 1, isView: 1 };
  function rnd(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280 - .5; }; }
  function rects(el, o) {
    var base = el.getBoundingClientRect(), list = o.multiline ? Array.prototype.slice.call(el.getClientRects()) : [base], out = [];
    if (!list.length) list = [base];
    for (var i = 0; i < list.length; i++) { var r = list[i]; if (r.width < 1 || r.height < 1) continue; out.push({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }); }
    return out;
  }
  function paths(o, r, it) {
    var p = o.padding, R = rnd(it + 1 + Math.round(r.w)), j = function (n) { return (R() * n).toFixed(1); }, x1 = r.x - p, x2 = r.x + r.w + p, y1 = r.y - p, y2 = r.y + r.h + p, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = [];
    switch (o.action) {
      case 'underline': { var y = y2 - 1; d.push('M' + x1 + ' ' + (y + +j(2)) + 'Q' + mx + ' ' + (y + +j(3)) + ' ' + x2 + ' ' + (y + +j(2))); break; }
      case 'strike-through': d.push('M' + x1 + ' ' + (my + +j(2)) + 'Q' + mx + ' ' + (my + +j(3)) + ' ' + x2 + ' ' + (my + +j(2))); break;
      case 'crossed-off': d.push('M' + x1 + ' ' + (y1 + +j(3)) + 'L' + x2 + ' ' + (y2 + +j(3))); d.push('M' + x2 + ' ' + (y1 + +j(3)) + 'L' + x1 + ' ' + (y2 + +j(3))); break;
      case 'box': d.push('M' + (x1 + +j(2)) + ' ' + (y1 + +j(2)) + 'L' + (x2 + +j(2)) + ' ' + (y1 + +j(2)) + 'L' + (x2 + +j(2)) + ' ' + (y2 + +j(2)) + 'L' + (x1 + +j(2)) + ' ' + (y2 + +j(2)) + 'L' + (x1 + +j(2)) + ' ' + (y1 + +j(2) - 1)); break;
      case 'circle': { var rx = (x2 - x1) / 2 + 6, ry = (y2 - y1) / 2 + 3, a0 = -2.2 + +j(.3), a = a0, s = 28, pts = []; for (var i = 0; i <= s + 3; i++) { a = a0 + i / s * Math.PI * 2; var k = 1 + +j(.04); pts.push((mx + Math.cos(a) * rx * k).toFixed(1) + ' ' + (my + Math.sin(a) * ry * k).toFixed(1)); } d.push('M' + pts.join('L')); break; }
      case 'bracket': { var b = 8; d.push('M' + (x1 + b) + ' ' + y1 + 'L' + x1 + ' ' + (y1 + +j(1)) + 'L' + x1 + ' ' + y2 + 'L' + (x1 + b) + ' ' + y2); d.push('M' + (x2 - b) + ' ' + y1 + 'L' + x2 + ' ' + (y1 + +j(1)) + 'L' + x2 + ' ' + y2 + 'L' + (x2 - b) + ' ' + y2); break; }
      default: { var h = r.h + p * 2; d.push('M' + (x1 + +j(2)) + ' ' + (my + +j(2)) + 'L' + (x2 + +j(2)) + ' ' + (my + +j(2))); o._hw = h; }
    }
    return d;
  }
  function Mark(el, opts) {
    var self = this, k, d = el.dataset; this.el = el; this.o = {};
    for (k in DEF) { var v = d[k]; this.o[k] = v == null ? DEF[k] : BOOL[k] ? (v === '' || v === 'true') : NUM[k] ? parseFloat(v) : v; }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    this.rm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.isolation = 'isolate'; this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('aria-hidden', 'true');
    this.svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:' + (this.o.action === 'highlight' ? '-1' : '1'); el.appendChild(this.svg);
    this.shown = false; this.animated = false;
    this.ro = new ResizeObserver(function () { if (self.shown) self.draw(false); }); this.ro.observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (self.shown) self.draw(false); });
    if (this.o.isView && 'IntersectionObserver' in root) {
      this.io = new IntersectionObserver(function (e) { if (e[0] && e[0].isIntersecting) { self.io.disconnect(); self.show(); } }, { threshold: .1 }); this.io.observe(el);
    } else this.show();
  }
  Mark.prototype.show = function () { this.shown = true; this.draw(!this.rm && !this.animated); this.animated = true; };
  Mark.prototype.draw = function (animate) {
    var o = this.o, svg = this.svg, rs = rects(this.el, o), n = Math.max(1, o.iterations | 0), per = Math.max(o.animationDuration, 1) / (rs.length * n), t = 0;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var i = 0; i < rs.length; i++) for (var it = 0; it < n; it++) {
      var ds = paths(o, rs[i], it);
      for (var q = 0; q < ds.length; q++) {
        var p = document.createElementNS(NS, 'path'); p.setAttribute('d', ds[q]); p.setAttribute('fill', 'none'); p.setAttribute('stroke', o.color); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
        p.setAttribute('stroke-width', o.action === 'highlight' ? (rs[i].h + o.padding * 2) * (it ? .9 : 1) : o.strokeWidth);
        if (o.action === 'highlight') p.setAttribute('stroke-linecap', 'butt');
        svg.appendChild(p);
        if (animate) { var L = p.getTotalLength ? p.getTotalLength() : 1000; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset ' + per + 'ms ease-out ' + t + 'ms'; (function (pp) { requestAnimationFrame(function () { pp.style.strokeDashoffset = 0; }); })(p); }
      }
      t += per;
    }
  };
  Mark.prototype.destroy = function () { this.ro.disconnect(); if (this.io) this.io.disconnect(); this.svg.remove(); this.el._mark = null; };
  root.HeluMark = { create: function (el, o) { return el._mark || (el._mark = new Mark(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-highlighter]'); for (var i = 0; i < l.length; i++) root.HeluMark.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluMark.init(); }); else root.HeluMark.init();
})(window);
