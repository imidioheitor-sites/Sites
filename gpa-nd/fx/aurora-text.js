/*! AuroraText vanilla (HELU/HEsites) — port do Aurora Text do Magic UI para JS puro (CSS + um span). Sem dependências.
 *  Uso:  <h1>Doces que fazem a <span data-aurora-text data-colors='["#FF0080","#7928CA","#0070F3","#38bdf8"]' data-speed="1">festa</span> inteira.</h1>
 *  Props (mesmos nomes/padrões): colors=["#FF0080","#7928CA","#0070F3","#38bdf8"] (JSON ou separadas por vírgula), speed=1 (duração = 10/speed s), className (use class normal).
 *  Estrutura gerada: span.sr-only com o texto real + cópia aria-hidden com gradiente linear 135deg (cores + a 1ª repetida), background-size 200%, background-clip:text.
 *  Movimento só 2D (background-position + rotate/scale leves). prefers-reduced-motion: gradiente parado. Pode ir em títulos do bloco do h1 e destaques (não no hero, que é só vídeo). */
(function (root) {
  'use strict';
  var DEF_COLORS = ['#FF0080', '#7928CA', '#0070F3', '#38bdf8'];
  function css() {
    if (document.getElementById('aurora-text-css')) return;
    var s = document.createElement('style'); s.id = 'aurora-text-css';
    s.textContent = '.aurora-text{position:relative;display:inline-block}' +
      '.aurora-text .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
      '.aurora-text__fx{position:relative;display:inline-block;background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:aurora-text 8s ease-in-out infinite alternate}' +
      '@keyframes aurora-text{0%{background-position:0% 50%;transform:rotate(-5deg) scale(.9)}25%{background-position:50% 100%;transform:rotate(5deg) scale(1.1)}50%{background-position:100% 50%;transform:rotate(-3deg) scale(.95)}75%{background-position:50% 0%;transform:rotate(3deg) scale(1.05)}100%{background-position:0% 50%;transform:rotate(-5deg) scale(.9)}}' +
      '@media (prefers-reduced-motion:reduce){.aurora-text__fx{animation:none;transform:none}}';
    document.head.appendChild(s);
  }
  function parseColors(v) {
    if (!v) return DEF_COLORS;
    try { var a = JSON.parse(v); if (Array.isArray(a) && a.length) return a; } catch (e) {}
    var b = String(v).split(',').map(function (x) { return x.trim(); }).filter(Boolean); return b.length ? b : DEF_COLORS;
  }
  function create(el, opts) {
    if (el._aurora) return el._aurora; css();
    var o = opts || {}, colors = o.colors || parseColors(el.dataset.colors), speed = o.speed != null ? o.speed : (el.dataset.speed ? parseFloat(el.dataset.speed) : 1);
    if (!(speed > 0)) speed = 1;
    var text = el.textContent; el.textContent = ''; el.classList.add('aurora-text');
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    var fx = document.createElement('span'); fx.className = 'aurora-text__fx'; fx.setAttribute('aria-hidden', 'true'); fx.textContent = text;
    fx.style.backgroundImage = 'linear-gradient(135deg,' + colors.join(',') + ',' + colors[0] + ')'; fx.style.animationDuration = (10 / speed) + 's';
    el.appendChild(sr); el.appendChild(fx);
    return (el._aurora = { update: function (n) { if (n.colors) fx.style.backgroundImage = 'linear-gradient(135deg,' + n.colors.join(',') + ',' + n.colors[0] + ')'; if (n.speed > 0) fx.style.animationDuration = (10 / n.speed) + 's'; } });
  }
  root.HeluAurora = { create: create, init: function (s) { var l = (s || document).querySelectorAll('[data-aurora-text]'); for (var i = 0; i < l.length; i++) create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluAurora.init(); }); else root.HeluAurora.init();
})(window);
