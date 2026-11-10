/*! Iphone vanilla (HELU/HEsites) — port do mockup iPhone do Magic UI (moldura SVG 433x882 + mídia em overlay DOM, sem foreignObject). Sem dependências.
 *  Uso:  <div data-iphone data-src="app.jpg" style="width:260px"></div>   ou   <div data-iphone data-video-src="demo.mp4" style="width:260px"></div>   ou   HeluIphone.create(el,{src:'x.jpg'})
 *  Props (mesmos nomes): src (imagem), videoSrc (data-video-src), className/style (use class/style normais no elemento). Tamanho = largura do elemento; proporção fixa 433/882.
 *  Cores: claro #E5E5E5 / branco, escuro #404040 / #262626 (prefers-color-scheme, ou data-theme/.dark no <html>). Vídeo: autoplay loop muted playsInline preload=metadata (pausa com reduced-motion).
 *  Sem mídia só aparece a moldura (a tela fica vazada). */
(function (root) {
  'use strict';
  var W = 433, H = 882, SX = 21.25, SY = 19.25, SW = 389.5, SH = 843.5, SR = 55.75, uid = 0;
  var L = (SX / W * 100), T = (SY / H * 100), WP = (SW / W * 100), HP = (SH / H * 100), RH = (SR / SW * 100), RV = (SR / SH * 100);
  function css() {
    if (document.getElementById('iphone-css')) return;
    var s = document.createElement('style'); s.id = 'iphone-css';
    s.textContent = '.helu-iphone{--ip-a:#E5E5E5;--ip-b:#fff;--ip-c:#F5F5F5;position:relative;display:inline-block;width:100%;vertical-align:middle;line-height:0}' +
      '.helu-iphone .ip-a{fill:var(--ip-a)}.helu-iphone .ip-b{fill:var(--ip-b)}.helu-iphone .ip-c{fill:var(--ip-c)}.helu-iphone .ip-s{stroke:var(--ip-a);stroke-width:.5}' +
      '.helu-iphone .ip-scr{position:absolute;z-index:0;overflow:hidden;pointer-events:none}.helu-iphone .ip-scr>*{display:block;width:100%;height:100%;object-fit:cover}.helu-iphone .ip-scr>img{object-position:top}' +
      '.helu-iphone svg{position:absolute;inset:0;width:100%;height:100%;transform:translateZ(0)}' +
      '@media (prefers-color-scheme:dark){:root:not([data-theme=light]):not(.light) .helu-iphone{--ip-a:#404040;--ip-b:#262626;--ip-c:#262626}}' +
      ':root[data-theme=dark] .helu-iphone,:root.dark .helu-iphone{--ip-a:#404040;--ip-b:#262626;--ip-c:#262626}';
    document.head.appendChild(s);
  }
  function create(el, o) {
    if (el._iphone) return el._iphone; css(); o = o || {};
    var src = o.src || el.dataset.src, vid = o.videoSrc || el.dataset.videoSrc, media = !!(vid || src), id = 'ipPunch' + (++uid);
    el.classList.add('helu-iphone'); el.style.aspectRatio = W + '/' + H;
    var scr = '';
    if (media) {
      scr = '<div class="ip-scr" style="left:' + L + '%;top:' + T + '%;width:' + WP + '%;height:' + HP + '%;border-radius:' + RH + '%/' + RV + '%">' +
        (vid ? '<video src="' + vid + '" autoplay loop muted playsinline preload="metadata"></video>' : '<img src="' + src + '" alt="" loading="lazy">') + '</div>';
    }
    var m = media ? ' mask="url(#' + id + ')"' : '';
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g' + m + '>' +
      '<path class="ip-a" d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"/>' +
      '<path class="ip-a" d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z"/>' +
      '<path class="ip-a" d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z"/>' +
      '<path class="ip-a" d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z"/>' +
      '<path class="ip-a" d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z"/>' +
      '<path class="ip-b" d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"/></g>' +
      '<path class="ip-a" opacity="0.5" d="M174 5H258V5.5C258 6.60457 257.105 7.5 256 7.5H176C174.895 7.5 174 6.60457 174 5.5V5Z"/>' +
      '<path class="ip-a ip-s"' + m + ' d="M' + SX + ' 75C' + SX + ' 44.2101 46.2101 ' + SY + ' 77 ' + SY + 'H355C385.79 ' + SY + ' 410.75 44.2101 410.75 75V807C410.75 837.79 385.79 862.75 355 862.75H77C46.2101 862.75 ' + SX + ' 837.79 ' + SX + ' 807V75Z"/>' +
      '<path class="ip-c" d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"/>' +
      '<path class="ip-c" d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"/>' +
      '<path class="ip-a" d="M254 48.5C254 45.4624 256.462 43 259.5 43C262.538 43 265 45.4624 265 48.5C265 51.5376 262.538 54 259.5 54C256.462 54 254 51.5376 254 48.5Z"/>' +
      '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="' + W + '" height="' + H + '" fill="white"/><rect x="' + SX + '" y="' + SY + '" width="' + SW + '" height="' + SH + '" rx="' + SR + '" ry="' + SR + '" fill="black"/></mask></defs></svg>';
    el.innerHTML = scr + svg;
    var v = el.querySelector('video');
    if (v) { v.muted = true; if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) v.removeAttribute('autoplay'); else { var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); } }
    return (el._iphone = { el: el });
  }
  root.HeluIphone = { create: create, init: function (s) { var l = (s || document).querySelectorAll('[data-iphone]'); for (var i = 0; i < l.length; i++) create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluIphone.init(); }); else root.HeluIphone.init();
})(window);
