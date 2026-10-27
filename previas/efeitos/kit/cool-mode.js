/*! CoolMode vanilla (HELU/HEsites) — port do Cool Mode do Magic UI (já era JS puro). Partículas jorram do botão/link enquanto o clique fica pressionado, caem com gravidade e giram. Sem dependências.
 *  Uso:  <a class="btn" data-cool-mode data-particle="🍰" data-size="30">Pedir no WhatsApp</a>   ou   var stop = HeluCool.apply(el,{particle:'circle'})  (stop() desliga)
 *  Props (mesmos nomes): particle='circle' | URL de imagem (http… ou /…) | emoji/texto; size (px; padrão sorteia 15/20/25/35/45); particleCount=45 (limite, máx. 45); speedHorz; speedUp.
 *  Container fixo pointer-events:none criado sob demanda e removido ao fim. Touch events em mobile. prefers-reduced-motion: desligado. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', SIZES = [15, 20, 25, 35, 45], count = 0;
  function container() {
    var c = document.getElementById('_coolMode_effect'); if (c) return c;
    c = document.createElement('div'); c.id = '_coolMode_effect'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'overflow:hidden;position:fixed;height:100%;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:2147483647'; document.body.appendChild(c); return c;
  }
  function apply(element, options) {
    options = options || {};
    if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return function () {};
    count++;
    var type = options.particle || 'circle', limit = Math.min(options.particleCount || 45, 45), parts = [], auto = false, mx = 0, my = 0, cont = container(), raf = 0, lastGen = 0;
    function make(el, size) {
      if (type === 'circle') {
        var svg = document.createElementNS(NS, 'svg'), c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', size / 2); c.setAttribute('cy', size / 2); c.setAttribute('r', size / 2); c.setAttribute('fill', 'hsl(' + Math.random() * 360 + ',70%,50%)');
        svg.appendChild(c); svg.setAttribute('width', size); svg.setAttribute('height', size); el.appendChild(svg);
      } else if (/^(http|\/)/.test(type)) {
        var im = document.createElement('img'); im.src = type; im.width = im.height = size; im.alt = ''; im.style.borderRadius = '50%'; el.appendChild(im);
      } else {
        var t = document.createElement('div'); t.textContent = type;
        t.style.cssText = 'font-size:' + Math.round(size * 1.4) + 'px;line-height:1;text-align:center;width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center'; el.appendChild(t);
      }
    }
    function gen() {
      var size = options.size || SIZES[Math.floor(Math.random() * SIZES.length)], d = document.createElement('div'), p = {
        direction: Math.random() <= .5 ? -1 : 1, element: d, left: mx - size / 2, top: my - size / 2, size: size,
        speedHorz: options.speedHorz || Math.random() * 10, speedUp: options.speedUp || Math.random() * 25,
        spinVal: Math.random() * 360, spinSpeed: Math.random() * 35 * (Math.random() <= .5 ? -1 : 1) };
      make(d, size); d.style.position = 'absolute'; d.style.willChange = 'transform'; cont.appendChild(d); parts.push(p);
    }
    function refresh() {
      var H = Math.max(root.innerHeight, document.body.clientHeight);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.left -= p.speedHorz * p.direction; p.top -= p.speedUp; p.speedUp = Math.min(p.size, p.speedUp - 1); p.spinVal += p.spinSpeed;
        if (p.top >= H + p.size) { parts.splice(i, 1); p.element.remove(); continue; }
        p.element.style.cssText = 'position:absolute;will-change:transform;top:' + p.top + 'px;left:' + p.left + 'px;transform:rotate(' + p.spinVal + 'deg)';
      }
    }
    function loop() {
      var now = performance.now();
      if (auto && parts.length < limit && now - lastGen > 30) { gen(); lastGen = now; }
      refresh();
      raf = (auto || parts.length) ? requestAnimationFrame(loop) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    var touch = 'ontouchstart' in root, tap = touch ? 'touchstart' : 'mousedown', tapEnd = touch ? 'touchend' : 'mouseup', move = touch ? 'touchmove' : 'mousemove';
    function pos(e) { if (e.touches) { if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; } } else { mx = e.clientX; my = e.clientY; } }
    function down(e) { pos(e); auto = true; kick(); }
    function off() { auto = false; }
    element.addEventListener(move, pos, { passive: true }); element.addEventListener(tap, down, { passive: true }); element.addEventListener(tapEnd, off, { passive: true }); element.addEventListener('mouseleave', off, { passive: true });
    element.addEventListener('touchcancel', off, { passive: true });
    return function () {
      off(); element.removeEventListener(move, pos); element.removeEventListener(tap, down); element.removeEventListener(tapEnd, off); element.removeEventListener('mouseleave', off); element.removeEventListener('touchcancel', off);
      var iv = setInterval(function () { if (!parts.length) { clearInterval(iv); if (raf) cancelAnimationFrame(raf); if (--count === 0) cont.remove(); } }, 500);
    };
  }
  function init(s) {
    var l = (s || document).querySelectorAll('[data-cool-mode]');
    for (var i = 0; i < l.length; i++) { var el = l[i]; if (el._cool) continue; var d = el.dataset, o = {};
      if (d.particle) o.particle = d.particle; if (d.size) o.size = parseFloat(d.size); if (d.particleCount) o.particleCount = parseFloat(d.particleCount); if (d.speedHorz) o.speedHorz = parseFloat(d.speedHorz); if (d.speedUp) o.speedUp = parseFloat(d.speedUp);
      el._cool = apply(el, o); }
  }
  root.HeluCool = { apply: apply, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); }); else init();
})(window);
