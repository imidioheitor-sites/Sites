/*! InteractiveGridPattern vanilla (HELU/HEsites) — port do Interactive Grid Pattern do Magic UI. Grade de quadrados SVG; o quadrado sob o cursor acende (100ms) e apaga devagar (1000ms). Sem dependências.
 *  Uso:  <div class="fundo" data-interactive-grid data-width="40" data-height="40" data-squares="24,24"></div>   ou   HeluIGrid.create(el,{squares:[24,24]})
 *  Props (mesmos nomes/padrões): width=40, height=40, squares=[24,24] (horizontal, vertical; JSON ou "24,24"). Extras: data-line-color (rgba(156,163,175,.3) = gray-400/30), data-active-color (rgba(209,213,219,.3) = gray-300/30).
 *  Leve: a grade é um <pattern> SVG e UM listener pointermove no container (não 576 listeners). Sem hover em touch. prefers-reduced-motion: sem transição de apagar.
 *  O container precisa de position e tamanho (ex.: absolute; inset:0). Cores de linha/preenchimento aceitam qualquer cor CSS. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', uid = 0;
  function Grid(el, opts) {
    var self = this, d = el.dataset, o = { width: 40, height: 40, squares: [24, 24], lineColor: 'rgba(156,163,175,.3)', activeColor: 'rgba(209,213,219,.3)' };
    if (d.width) o.width = parseFloat(d.width); if (d.height) o.height = parseFloat(d.height); if (d.lineColor) o.lineColor = d.lineColor; if (d.activeColor) o.activeColor = d.activeColor;
    if (d.squares) { try { var a = JSON.parse(d.squares.charAt(0) === '[' ? d.squares : '[' + d.squares + ']'); if (a.length === 2) o.squares = a; } catch (e) {} }
    if (opts) for (var k in opts) if (opts[k] !== undefined) o[k] = opts[k];
    this.o = o; this.el = el; var id = 'ig' + (++uid), W = o.width * o.squares[0], H = o.height * o.squares[1];
    this.rm = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touch = root.matchMedia('(hover: none)').matches;
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    svg.innerHTML = '<defs><pattern id="' + id + '" width="' + o.width + '" height="' + o.height + '" patternUnits="userSpaceOnUse"><path d="M' + o.width + ' 0H0V' + o.height + '" fill="none" stroke="' + o.lineColor + '" stroke-width="1"/></pattern></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + ')"/><rect width="' + W + '" height="' + H + '" fill="none" stroke="' + o.lineColor + '"/>';
    this.svg = svg; this.layer = document.createElementNS(NS, 'g'); svg.insertBefore(this.layer, svg.firstChild.nextSibling); el.appendChild(svg);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    this.cells = {}; this.cur = -1;
    if (this.touch) return;
    this.mv = function (e) {
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, cx = Math.floor(x / o.width), cy = Math.floor(y / o.height), idx = -1;
      if (cx >= 0 && cy >= 0 && cx < o.squares[0] && cy < o.squares[1]) idx = cy * o.squares[0] + cx;
      if (idx === self.cur) return; if (self.cur >= 0) self.off(self.cur); self.cur = idx; if (idx >= 0) self.on(idx, cx, cy);
    };
    this.lv = function () { if (self.cur >= 0) self.off(self.cur); self.cur = -1; };
    el.addEventListener('pointermove', this.mv, { passive: true }); el.addEventListener('pointerleave', this.lv, { passive: true });
  }
  Grid.prototype.on = function (idx, cx, cy) {
    var r = this.cells[idx]; if (!r) { r = document.createElementNS(NS, 'rect'); r.setAttribute('x', cx * this.o.width); r.setAttribute('y', cy * this.o.height); r.setAttribute('width', this.o.width); r.setAttribute('height', this.o.height); r.setAttribute('stroke', this.o.lineColor); this.layer.appendChild(r); this.cells[idx] = r; }
    clearTimeout(r._t); r.style.transition = this.rm ? 'none' : 'fill 100ms ease-in-out'; r.setAttribute('fill', this.o.activeColor);
  };
  Grid.prototype.off = function (idx) {
    var r = this.cells[idx], self = this; if (!r) return;
    r.style.transition = this.rm ? 'none' : 'fill 1000ms ease-in-out'; r.setAttribute('fill', 'transparent');
    r._t = setTimeout(function () { if (self.cur !== idx) { r.remove(); delete self.cells[idx]; } }, this.rm ? 0 : 1100);
  };
  Grid.prototype.destroy = function () { if (this.mv) { this.el.removeEventListener('pointermove', this.mv); this.el.removeEventListener('pointerleave', this.lv); } this.svg.remove(); this.el._igrid = null; };
  root.HeluIGrid = { create: function (el, o) { return el._igrid || (el._igrid = new Grid(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-interactive-grid]'); for (var i = 0; i < l.length; i++) root.HeluIGrid.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluIGrid.init(); }); else root.HeluIGrid.init();
})(window);
