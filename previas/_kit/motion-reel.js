/*! MotionReel vanilla (HELU/HEsites) — reel de motion design de 14,4 s, sete cenas, palco lógico 1920x1080.
 *  Sem dependências, sem CDN, sem three.js: Canvas 2D (com rasterizador próprio de caixas arredondadas), SVG e DOM.
 *  Princípio central: a animação inteira é uma FUNÇÃO PURA DO TEMPO. seek(t) desenha o quadro de t e nada guarda estado.
 *  Por isso o mesmo módulo serve para loop, scroll, vídeo renderizado e teste por screenshot.
 *
 *  Uso:  <div data-motion-reel data-accent="#FF4D2E" data-titulo="..."></div>
 *        HeluMotionReel.create(el, {...}) -> { play, pause, seek, destroy, duration }
 *  API pública por instância: play(), pause(), seek(t), destroy(). Também em el._reel.
 *
 *  Props (data-* em kebab-case ou objeto em create):
 *    duration=14.4            duração do loop em segundos
 *    scroll=false             se true, t = progresso de rolagem da seção * duration (em vez de relógio)
 *    ink / paper / accent / accent2 / muted   cores (lidas das variáveis CSS do elemento se não vierem)
 *    titulo, subtitulo        cena de abertura (DOM)
 *    rotulos                  rótulos das cenas 1..6, separados por "|"
 *    numeros                  3 números do gráfico (cena 4), separados por "|", ex "120|45|8"
 *    numerosRotulos           rótulos dos números, separados por "|"
 *    manchete, assinatura     cena 7 e encerramento (DOM)
 *    quality=auto             'auto' | 'alta' | 'baixa'
 *    debug=false              também liga com ?debug=1 na URL: mostra timecode e linha do tempo arrastável
 *
 *  Qualidade: devicePixelRatio limitado a 2; rebaixa sozinho se os 60 primeiros quadros vierem lentos;
 *  IntersectionObserver pausa fora da tela, visibilitychange pausa em aba oculta;
 *  prefers-reduced-motion / saveData / GPU fraca mostram um quadro estático (t = 6.0);
 *  se o canvas 2D falhar, o pôster/DOM continua visível e a página não quebra.
 *  Acessibilidade: canvas e svg decorativos são aria-hidden; todo texto importante existe em DOM real.
 */
(function (root) {
  'use strict';

  var W = 1920, H = 1080;

  var DEF = {
    duration: 14.4,
    scroll: false,
    ink: '', paper: '', accent: '', accent2: '', muted: '',
    titulo: 'MOTION',
    subtitulo: 'design em movimento',
    rotulos: 'estrutura|fluxo|ordem|resultado|forma|matéria',
    numeros: '92|48|12',
    numerosRotulos: 'alcance|cliques|vendas',
    manchete: 'tudo é função do tempo',
    assinatura: 'HEsites',
    quality: 'auto',
    debug: false
  };
  var BOOL = { scroll: 1, debug: 1 };
  var STR = { ink: 1, paper: 1, accent: 1, accent2: 1, muted: 1, titulo: 1, subtitulo: 1, rotulos: 1, numeros: 1, numerosRotulos: 1, manchete: 1, assinatura: 1, quality: 1 };

  /* ---------- utilidades ---------- */
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // progresso normalizado de t dentro de [a,b]
  function span(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eoc(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }   // easeInOutCubic
  function oex(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }                         // easeOutExpo
  function ocu(k) { return 1 - Math.pow(1 - k, 3); }                                        // easeOutCubic
  function icu(k) { return k * k * k; }
  function obk(k) { var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); } // easeOutBack
  // janela suave: 0 fora, 1 no meio, com borda de entrada/saída
  function win(t, a, b, inn, out) {
    if (t < a || t > b) return 0;
    var i = ocu(clamp((t - a) / inn, 0, 1)), o = 1 - icu(clamp((t - (b - out)) / out, 0, 1));
    return i * o;
  }
  function rgbOf(h) {
    var c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#000'; c.fillStyle = h; var v = c.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
    var m = v.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(a, b, k) { return [Math.round(lerp(a[0], b[0], k)), Math.round(lerp(a[1], b[1], k)), Math.round(lerp(a[2], b[2], k))]; }
  function shade(c, k) { return k >= 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k); }
  function reduced() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function weak() {
    var n = navigator, c = n.connection;
    return !!((c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2));
  }
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function hash2(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  // value noise 2D suave (base do curl noise da cena 2)
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm(x, y) { return vnoise(x, y) * 0.6 + vnoise(x * 2.03, y * 2.03) * 0.3 + vnoise(x * 4.01, y * 4.01) * 0.1; }
  // campo de curl: gira o gradiente do fbm 90°, o que dá fluxo sem fontes nem sumidouros
  function curl(x, y, e) {
    e = e || 0.08;
    var dx = (fbm(x, y + e) - fbm(x, y - e)) / (2 * e), dy = (fbm(x + e, y) - fbm(x - e, y)) / (2 * e);
    return [dx, -dy];
  }
  // polígono com cantos arredondados (usado nas faces das caixas)
  function roundPoly(ctx, p, r) {
    var n = p.length; ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = p[i], b = p[(i + 1) % n], c = p[(i + 2) % n];
      var v1x = a[0] - b[0], v1y = a[1] - b[1], v2x = c[0] - b[0], v2y = c[1] - b[1];
      var l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
      var rr = Math.min(r, l1 / 2, l2 / 2);
      var s1 = [b[0] + v1x / l1 * rr, b[1] + v1y / l1 * rr], s2 = [b[0] + v2x / l2 * rr, b[1] + v2y / l2 * rr];
      if (i === 0) ctx.moveTo(s1[0], s1[1]); else ctx.lineTo(s1[0], s1[1]);
      ctx.quadraticCurveTo(b[0], b[1], s2[0], s2[1]);
    }
    ctx.closePath();
  }

  // injeta uma vez o filtro SVG "goo" usado na cena 6; devolve o id ou null se o navegador não aceitar
  function mkGoo() {
    try {
      var id = 'mr-goo';
      if (!document.getElementById(id)) {
        var d = document.createElement('div');
        d.setAttribute('aria-hidden', 'true');
        d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><filter id="' + id + '" color-interpolation-filters="sRGB">' +
          '<feGaussianBlur in="SourceGraphic" stdDeviation="22" result="b"/>' +
          '<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/>' +
          '</filter></svg>';
        document.body.appendChild(d);
      }
      var c = document.createElement('canvas').getContext('2d');
      if (typeof c.filter !== 'string') return null;
      c.filter = 'url(#' + id + ')';
      return c.filter.indexOf(id) >= 0 ? id : null;
    } catch (e) { return null; }
  }

  /* ---------- câmera pseudo-3D (cena 1) ---------- */
  // projeção perspectiva simples: rotação em Y e X, depois divisão por z. Serve de substituto do
  // InstancedMesh + RoundedBoxGeometry da referência, sem carregar nenhuma biblioteca 3D.
  function makeCam(ry, rx, dist, fov) {
    var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    return function (x, y, z) {
      var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      var zz = z2 + dist; if (zz < 0.2) zz = 0.2;
      var k = fov / zz;
      return [W / 2 + x1 * k, H / 2 - y1 * k, zz];
    };
  }

  /* ---------- instância ---------- */
  function Reel(el, opt) {
    var o = {}, k;
    for (k in DEF) o[k] = DEF[k];
    var cs = getComputedStyle(el);
    for (k in DEF) {
      var d = el.getAttribute('data-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }));
      if (d === null) d = el.getAttribute('data-' + k.toLowerCase());
      if (d !== null) o[k] = BOOL[k] ? (d !== 'false' && d !== '0') : STR[k] ? d : parseFloat(d);
    }
    if (opt) for (k in opt) if (opt[k] !== undefined) o[k] = opt[k];
    if (!o.debug && /[?&]debug=1\b/.test(location.search)) o.debug = true;

    // cores: do data-*, senão das variáveis CSS do site, senão o padrão HEsites
    function cvar(name, fb) { var v = cs.getPropertyValue(name); return (v && v.trim()) || fb; }
    this.C = {
      ink: rgbOf(o.ink || cvar('--mr-ink', cvar('--tinta', '#0F0F0F'))),
      paper: rgbOf(o.paper || cvar('--mr-paper', cvar('--papel', '#F2EEE6'))),
      accent: rgbOf(o.accent || cvar('--mr-accent', cvar('--brasa', '#FF4D2E'))),
      accent2: rgbOf(o.accent2 || cvar('--mr-accent-2', cvar('--areia', '#E4DED2'))),
      muted: rgbOf(o.muted || cvar('--mr-muted', cvar('--cinza', '#9A948A')))
    };

    this.o = o; this.el = el; this.D = o.duration;
    this.rotulos = String(o.rotulos).split('|');
    this.numeros = String(o.numeros).split('|').map(function (n) { return parseFloat(n) || 0; });
    this.numRot = String(o.numerosRotulos).split('|');
    this.static = reduced() || weak();
    this.low = o.quality === 'baixa' || weak();
    this.frames = 0; this.slow = 0;
    this.t = 0; this.playing = false; this.vis = true; this.raf = 0;

    this.build();
    this.resize();
    this.seek(this.static ? 6.0 : 0);
    if (!this.static) this.observe();
    if (o.debug) this.buildDebug();
  }

  Reel.prototype.build = function () {
    var el = this.el, C = this.C, o = this.o;
    if (!el.style.position || el.style.position === 'static') {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    }
    el.classList.add('mr-host');
    if (!document.getElementById('mr-css')) {
      var st = document.createElement('style'); st.id = 'mr-css';
      st.textContent = '.mr-host{overflow:hidden}' +
        '.mr-stage{position:absolute;top:50%;left:50%;width:1920px;height:1080px;transform-origin:50% 50%;pointer-events:none}' +
        '.mr-stage>*{position:absolute;inset:0}' +
        '.mr-dom{font-family:var(--mr-font,"Unbounded",system-ui,sans-serif);display:block}' +
        '.mr-dom .mr-l{position:absolute;will-change:transform,opacity}' +
        '.mr-flash{background:#fff;opacity:0;mix-blend-mode:screen}' +
        '.mr-dbg{position:absolute;left:0;right:0;bottom:0;z-index:5;font:12px/1.4 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.6);padding:6px 10px;display:flex;gap:10px;align-items:center}' +
        '.mr-dbg input{flex:1}';
      document.head.appendChild(st);
    }
    var stage = this.stage = document.createElement('div'); stage.className = 'mr-stage';

    var cv = this.cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true'); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    try { this.ctx = cv.getContext('2d'); } catch (e) { this.ctx = null; }

    var svgns = 'http://www.w3.org/2000/svg';
    var svg = this.svg = document.createElementNS(svgns, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080'); svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute'; svg.style.inset = '0'; svg.style.width = '1920px'; svg.style.height = '1080px';
    this.svgG = document.createElementNS(svgns, 'g'); svg.appendChild(this.svgG);

    var dom = this.dom = document.createElement('div'); dom.className = 'mr-dom';
    // o texto importante vive em DOM real (não só pintado no canvas)
    function layer(html, cls) { var d = document.createElement('div'); d.className = 'mr-l ' + (cls || ''); d.innerHTML = html; dom.appendChild(d); return d; }
    var ink = rgba(C.ink, 1), paper = rgba(C.paper, 1), acc = rgba(C.accent, 1);
    this.L = {};
    this.L.intro = layer('<h2 style="margin:0;font-size:168px;font-weight:800;letter-spacing:-.04em;line-height:.9;color:' + paper + '">' + o.titulo + '</h2>' +
      '<p style="margin:18px 0 0;font:400 34px/1.3 var(--mr-font-corpo, Manrope, system-ui, sans-serif);color:' + rgba(C.muted, 1) + '">' + o.subtitulo + '</p>');
    this.L.intro.style.cssText += 'left:140px;top:380px;width:1500px';
    this.L.manchete = layer('<h2 style="margin:0;font-size:150px;font-weight:800;letter-spacing:-.045em;line-height:.9;color:' + ink + '">' + o.manchete + '</h2>');
    this.L.manchete.style.cssText += 'left:140px;top:380px;width:1620px';
    this.L.outro = layer('<div style="font-size:120px;font-weight:800;letter-spacing:-.04em;color:' + paper + '">' + o.assinatura +
      '<span style="color:' + acc + '">.</span></div>');
    this.L.outro.style.cssText += 'left:0;top:470px;width:1920px;text-align:center';
    // rótulos das cenas 1..6
    this.L.rot = [];
    for (var i = 0; i < 6; i++) {
      var r = layer('<span style="font:700 26px/1 var(--mr-font-corpo, Manrope, system-ui, sans-serif);letter-spacing:.28em;text-transform:uppercase;color:' +
        (i === 3 ? ink : paper) + '">' + '0' + (i + 1) + ' &nbsp;' + (this.rotulos[i] || '') + '</span>');
      r.style.cssText += 'left:140px;top:' + (i === 3 ? 140 : 880) + 'px';
      this.L.rot.push(r);
    }
    var fl = this.flash = document.createElement('div'); fl.className = 'mr-flash'; fl.setAttribute('aria-hidden', 'true');

    stage.appendChild(cv); stage.appendChild(svg); stage.appendChild(dom); stage.appendChild(fl);
    el.appendChild(stage);
    this.buildChart();
  };

  // cena 4: gráfico em SVG (barras + linha), construído uma vez e só animado por atributos
  Reel.prototype.buildChart = function () {
    var ns = 'http://www.w3.org/2000/svg', g = this.svgG, C = this.C, self = this;
    while (g.firstChild) g.removeChild(g.firstChild);
    this.ch = { bars: [], caps: [], labels: [], vals: [] };
    var base = 820, x0 = 420, gap = 360, bw = 190;
    var grid = document.createElementNS(ns, 'g'); g.appendChild(grid);
    for (var i = 0; i < 5; i++) {
      var ln = document.createElementNS(ns, 'line'), y = base - i * 130;
      ln.setAttribute('x1', 300); ln.setAttribute('x2', 1620); ln.setAttribute('y1', y); ln.setAttribute('y2', y);
      ln.setAttribute('stroke', rgba(C.ink, 0.12)); ln.setAttribute('stroke-width', 2); grid.appendChild(ln);
    }
    this.ch.grid = grid;
    var mx = Math.max.apply(null, this.numeros) || 1;
    for (var j = 0; j < 3; j++) {
      var h = 540 * (this.numeros[j] / mx), x = x0 + j * gap;
      var rc = document.createElementNS(ns, 'rect');
      rc.setAttribute('x', x); rc.setAttribute('width', bw); rc.setAttribute('rx', 14);
      rc.setAttribute('fill', j === 1 ? rgba(C.accent, 1) : rgba(C.ink, 0.86));
      rc.setAttribute('y', base); rc.setAttribute('height', 0); g.appendChild(rc);
      this.ch.bars.push({ el: rc, h: h, base: base, x: x, w: bw });
      var tv = document.createElementNS(ns, 'text');
      tv.setAttribute('x', x + bw / 2); tv.setAttribute('text-anchor', 'middle');
      tv.setAttribute('font-family', 'Unbounded, system-ui, sans-serif'); tv.setAttribute('font-weight', '800');
      tv.setAttribute('font-size', '64'); tv.setAttribute('fill', rgba(C.ink, 1));
      tv.textContent = '0'; g.appendChild(tv); this.ch.vals.push({ el: tv, v: this.numeros[j], base: base, h: h });
      var tl = document.createElementNS(ns, 'text');
      tl.setAttribute('x', x + bw / 2); tl.setAttribute('y', base + 56); tl.setAttribute('text-anchor', 'middle');
      tl.setAttribute('font-family', 'Manrope, system-ui, sans-serif'); tl.setAttribute('font-weight', '700');
      tl.setAttribute('font-size', '28'); tl.setAttribute('letter-spacing', '6');
      tl.setAttribute('fill', rgba(C.muted, 1)); tl.textContent = (this.numRot[j] || '').toUpperCase();
      g.appendChild(tl); this.ch.labels.push(tl);
    }
    var pl = document.createElementNS(ns, 'path');
    pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', rgba(C.accent, 1)); pl.setAttribute('stroke-width', 8);
    pl.setAttribute('stroke-linecap', 'round');
    var d = 'M ' + (x0 + bw / 2) + ' ' + (base - 540 * (this.numeros[0] / mx));
    for (var q = 1; q < 3; q++) d += ' L ' + (x0 + q * gap + bw / 2) + ' ' + (base - 540 * (this.numeros[q] / mx));
    pl.setAttribute('d', d); g.appendChild(pl); this.ch.line = pl;
    try { this.ch.len = pl.getTotalLength() || 1600; } catch (e) { this.ch.len = 1600; }
    pl.setAttribute('stroke-dasharray', this.ch.len);
  };

  Reel.prototype.resize = function () {
    var r = this.el.getBoundingClientRect();
    if (!r.width) return;
    var s = Math.max(r.width / W, r.height / H); // cover: preenche o contêiner sem distorcer
    this.stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    var dpr = Math.min(2, root.devicePixelRatio || 1) * (this.low ? 0.65 : 1);
    dpr = Math.max(0.5, Math.min(2, dpr * Math.min(1.4, Math.max(0.5, r.width / 900))));
    if (this.dpr === dpr) return;
    this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    if (this.ctx) { this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    this.seek(this.t);
  };

  Reel.prototype.observe = function () {
    var self = this;
    this.ro = root.ResizeObserver ? new ResizeObserver(function () { self.resize(); }) : null;
    if (this.ro) this.ro.observe(this.el); else root.addEventListener('resize', this._rz = function () { self.resize(); });
    this.io = root.IntersectionObserver ? new IntersectionObserver(function (e) {
      self.vis = e[0].isIntersecting; self.vis && !document.hidden ? self.play() : self.pause();
    }, { rootMargin: '120px' }) : null;
    if (this.io) this.io.observe(this.el); else this.play();
    document.addEventListener('visibilitychange', this._vc = function () {
      document.hidden ? self.pause() : (self.vis && self.play());
    });
    if (this.o.scroll) root.addEventListener('scroll', this._sc = function () { self.fromScroll(); }, { passive: true });
  };

  Reel.prototype.fromScroll = function () {
    var r = this.el.getBoundingClientRect(), vh = root.innerHeight || 800;
    var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    this.seek(p * this.D * 0.999);
  };

  Reel.prototype.play = function () {
    if (this.playing || this.static) return;
    if (this.o.scroll) { this.fromScroll(); return; }
    this.playing = true;
    var self = this, t0 = (root.performance || Date).now() - this.t * 1000, last = t0;
    (function loop(now) {
      if (!self.playing) return;
      now = now || (root.performance || Date).now();
      if (self.frames < 60) { // mede os 60 primeiros quadros e rebaixa a qualidade se vier lento
        if (now - last > 26) self.slow++;
        self.frames++;
        if (self.frames === 60 && self.slow > 24 && !self.low) { self.low = true; self.dpr = 0; self.resize(); }
      }
      last = now;
      self.seek(((now - t0) / 1000) % self.D);
      self.raf = requestAnimationFrame(loop);
    })();
  };
  Reel.prototype.pause = function () { this.playing = false; if (this.raf) cancelAnimationFrame(this.raf), this.raf = 0; };

  Reel.prototype.buildDebug = function () {
    var d = document.createElement('div'); d.className = 'mr-dbg'; var self = this;
    d.innerHTML = '<b>t</b><span class="mr-tc">0.00</span><input type="range" min="0" max="' + this.D + '" step="0.01" value="0">';
    this.el.appendChild(d);
    this.tc = d.querySelector('.mr-tc');
    d.querySelector('input').addEventListener('input', function () { self.pause(); self.seek(parseFloat(this.value)); });
    this._slider = d.querySelector('input');
  };

  Reel.prototype.destroy = function () {
    this.pause();
    if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect();
    if (this._rz) root.removeEventListener('resize', this._rz);
    if (this._sc) root.removeEventListener('scroll', this._sc);
    if (this._vc) document.removeEventListener('visibilitychange', this._vc);
    if (this.cv) { this.cv.width = this.cv.height = 1; this.cv.remove(); }
    if (this.stage) this.stage.remove();
    this.el._reel = null; this.ctx = null;
  };

  /* =========================================================================
     seek(t): o quadro inteiro é determinado por t. Nenhuma cena guarda estado.
     Linha do tempo (segundos):
       intro 0–1.15 | leak 1.15–2.0 | s1 2.0–3.2 | s2 3.2–5.0 | s3 5.0–6.3
       flash 6.3–6.5 | s4 6.5–8.1 | s5 8.1–9.9 | s6 9.9–11.1 | disc 11.1–11.5
       s7 11.5–13.2 | outro 13.2–14.4
     ========================================================================= */
  Reel.prototype.seek = function (t) {
    t = ((t % this.D) + this.D) % this.D;
    this.t = t;
    var k = this.D / 14.4; // se a duração mudar, as cenas escalam junto
    var T = t / k;
    var ctx = this.ctx, C = this.C;

    // fundo: claro durante a cena 4 (gráfico) e a cena 7 (manchete), escuro no resto
    var claro = Math.max(win(T, 6.3, 8.3, 0.2, 0.25), win(T, 11.1, 13.4, 0.35, 0.3));
    var bg = mix(C.ink, C.paper, claro);
    this.el.style.background = rgba(bg, 1);

    if (ctx) {
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = rgba(bg, 1); ctx.fillRect(0, 0, W, H);
      this.sIntro(ctx, T);
      this.s1(ctx, T);
      this.s2(ctx, T);
      this.s3(ctx, T);
      this.s5(ctx, T);
      this.s6(ctx, T);
      this.sLeak(ctx, T);
      this.sDisc(ctx, T, bg);
      ctx.restore();
    }
    this.s4(T);
    this.doms(T);
    this.flash.style.opacity = String(Math.max(
      win(T, 6.3, 6.5, 0.04, 0.16) * 0.9,
      win(T, 1.9, 2.05, 0.03, 0.12) * 0.45
    ));
    if (this.tc) { this.tc.textContent = t.toFixed(2); if (this._slider && document.activeElement !== this._slider) this._slider.value = t; }
  };

  /* --- DOM: abertura, manchete, encerramento e rótulos --- */
  Reel.prototype.doms = function (T) {
    var L = this.L;
    // abertura 0–1.15 com saída no leak
    var a = win(T, 0.05, 2.0, 0.5, 0.75);
    L.intro.style.opacity = a;
    L.intro.style.transform = 'translate3d(0,' + (1 - ocu(span(T, 0.05, 0.8))) * 70 + 'px,0) scale(' + lerp(1.04, 1, ocu(span(T, 0.05, 1.1))) + ')';
    // manchete 11.5–13.2
    var b = win(T, 11.45, 13.45, 0.45, 0.5);
    L.manchete.style.opacity = b;
    L.manchete.style.transform = 'translate3d(' + (1 - oex(span(T, 11.45, 12.4))) * -90 + 'px,0,0)';
    // encerramento 13.2–14.4
    var c = win(T, 13.2, 14.4, 0.45, 0.45);
    L.outro.style.opacity = c;
    L.outro.style.transform = 'scale(' + lerp(0.9, 1, obk(clamp(span(T, 13.2, 13.9), 0, 1))) + ')';
    var rg = [[2.0, 3.2], [3.2, 5.0], [5.0, 6.3], [6.5, 8.1], [8.1, 9.9], [9.9, 11.1]];
    for (var i = 0; i < 6; i++) {
      var r = rg[i], w = win(T, r[0] + 0.12, r[1], 0.4, 0.3);
      L.rot[i].style.opacity = w;
      L.rot[i].style.transform = 'translate3d(0,' + (1 - w) * 26 + 'px,0)';
    }
  };

  /* --- abertura: retícula fina que respira atrás do título (0–2.0) --- */
  Reel.prototype.sIntro = function (ctx, T) {
    var w = win(T, 0, 2.05, 0.35, 0.6); if (!w) return;
    var C = this.C, p = span(T, 0, 1.6);
    ctx.save(); ctx.globalAlpha = w * 0.5; ctx.strokeStyle = rgba(C.muted, 0.5); ctx.lineWidth = 1.6;
    var n = 26, sp = W / n;
    for (var i = 0; i <= n; i++) {
      var x = i * sp, d = Math.abs(i / n - 0.5) * 2, o = Math.sin(p * 3.2 - d * 2.4) * 40 * (1 - p * 0.5);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + o, H); ctx.stroke();
    }
    ctx.globalAlpha = w * 0.75;
    // traço de brasa que atravessa a tela
    var q = ocu(span(T, 0.25, 1.5));
    ctx.strokeStyle = rgba(C.accent, 0.9); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(140, 700); ctx.lineTo(140 + 1640 * q, 700); ctx.stroke();
    ctx.restore();
  };

  /* --- cena 1 (2.0–3.2): retícula de caixas arredondadas em pseudo-3D ---
     Substitui o InstancedMesh + RoundedBoxGeometry da referência: projeção perspectiva própria,
     3 faces visíveis por caixa com sombreado (topo claro, lateral direita média, esquerda escura). */
  Reel.prototype.s1 = function (ctx, T) {
    var w = win(T, 1.95, 3.35, 0.3, 0.35); if (!w) return;
    var C = this.C, p = span(T, 1.95, 3.35);
    var nx = this.low ? 9 : 14, nz = this.low ? 5 : 8, s = 1.0, gapv = 1.6;
    var cam = makeCam(-0.5 + p * 0.45, 0.48, 23 - p * 3.5, 1150);
    var top = shade(C.paper, -0.06), rgt = shade(C.accent, -0.18), lft = shade(C.ink, 0.12);
    var list = [];
    for (var ix = 0; ix < nx; ix++) for (var iz = 0; iz < nz; iz++) {
      var x = (ix - (nx - 1) / 2) * gapv, z = (iz - (nz - 1) / 2) * gapv;
      var d = Math.hypot(x, z), ph = ocu(clamp(p * 2.3 - d * 0.1, 0, 1));
      var hgt = 0.45 + (Math.sin(d * 0.9 - p * 5.5) * 0.5 + 0.5) * 2.5 * ph;
      var y = hgt / 2 - 1.2;
      var pr = cam(x, y, z);
      list.push({ x: x, y: y, z: z, h: hgt, d: pr[2], acc: hash2(ix, iz) > 0.84 });
    }
    list.sort(function (a, b) { return b.d - a.d; });
    ctx.save(); ctx.globalAlpha = w;
    for (var i = 0; i < list.length; i++) {
      var b = list[i], hx = s / 2, hy = b.h / 2, hz = s / 2;
      var P = [
        cam(b.x - hx, b.y + hy, b.z - hz), cam(b.x + hx, b.y + hy, b.z - hz),
        cam(b.x + hx, b.y + hy, b.z + hz), cam(b.x - hx, b.y + hy, b.z + hz),
        cam(b.x - hx, b.y - hy, b.z + hz), cam(b.x + hx, b.y - hy, b.z + hz)
      ];
      var corpo = b.acc ? C.accent : C.paper;
      var sz = clamp(1 - (b.d - 14) / 26, 0.25, 1);
      // topo
      ctx.fillStyle = rgba(shade(corpo, b.acc ? 0.14 : -0.04), 1);
      roundPoly(ctx, [[P[0][0], P[0][1]], [P[1][0], P[1][1]], [P[2][0], P[2][1]], [P[3][0], P[3][1]]], 6 * sz); ctx.fill();
      // frente (face +z)
      ctx.fillStyle = rgba(shade(corpo, b.acc ? -0.1 : -0.42), 1);
      roundPoly(ctx, [[P[3][0], P[3][1]], [P[2][0], P[2][1]], [P[5][0], P[5][1]], [P[4][0], P[4][1]]], 6 * sz); ctx.fill();
      // lateral direita (face +x)
      ctx.fillStyle = rgba(shade(corpo, b.acc ? -0.3 : -0.64), 1);
      roundPoly(ctx, [[P[1][0], P[1][1]], [P[2][0], P[2][1]], [P[5][0], P[5][1]]], 5 * sz); ctx.fill();
    }
    // vinheta suave para dar profundidade
    var g = ctx.createRadialGradient(W / 2, H * 0.52, H * 0.2, W / 2, H * 0.52, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, rgba(C.ink, 0.72 * w));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  /* --- cena 2 (3.2–5.0): partículas em campo de curl noise --- */
  Reel.prototype.s2 = function (ctx, T) {
    var w = win(T, 3.15, 5.15, 0.28, 0.4); if (!w) return;
    var C = this.C, p = span(T, 3.15, 5.15);
    var n = this.low ? 380 : 820, steps = this.low ? 9 : 15;
    ctx.save(); ctx.globalAlpha = w; ctx.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      // cada partícula é determinada pelo seu índice e por t: posição = integração do campo, sem estado
      var sx = hash(i * 1.7) * W, sy = hash(i * 3.1 + 11) * H;
      var x = sx, y = sy, life = hash(i * 5.3 + 3);
      var tt = (p + life) % 1;
      var acc = hash(i * 7.9 + 5) > 0.88;
      ctx.strokeStyle = rgba(acc ? C.accent : C.paper, (acc ? 0.9 : 0.26) * (1 - Math.abs(tt - 0.5) * 1.4));
      ctx.lineWidth = acc ? 3.2 : 1.6;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (var s = 0; s < steps; s++) {
        var c = curl(x / 520 + tt * 0.7, y / 520 - tt * 0.4);
        x += c[0] * 46; y += c[1] * 46;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  /* --- cena 3 (5.0–6.3): filotaxia a 137,508° --- */
  Reel.prototype.s3 = function (ctx, T) {
    var w = win(T, 4.95, 6.5, 0.3, 0.25); if (!w) return;
    var C = this.C, p = span(T, 4.95, 6.45);
    var n = this.low ? 420 : 1000, GA = 137.508 * Math.PI / 180;
    var cx = W / 2, cy = H / 2, R = H * 0.44;
    ctx.save(); ctx.globalAlpha = w;
    ctx.translate(cx, cy); ctx.rotate(p * 0.5); ctx.translate(-cx, -cy);
    for (var i = 0; i < n; i++) {
      var f = i / n, g = ocu(clamp(p * 1.8 - f * 0.9, 0, 1));
      if (g <= 0) continue;
      var r = Math.sqrt(f) * R * g, a = i * GA;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      var rad = lerp(2.4, 11, f) * g;
      var acc = (i % 13) === 0;
      ctx.fillStyle = rgba(acc ? C.accent : mix(C.paper, C.muted, f), acc ? 0.95 : lerp(0.9, 0.22, f));
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  };

  /* --- cena 4 (6.5–8.1): gráfico em SVG --- */
  Reel.prototype.s4 = function (T) {
    var w = win(T, 6.45, 8.3, 0.18, 0.3);
    this.svg.style.opacity = w;
    if (!w) return;
    var ch = this.ch;
    for (var i = 0; i < ch.bars.length; i++) {
      var b = ch.bars[i], g = oex(clamp(span(T, 6.6 + i * 0.16, 7.5 + i * 0.16), 0, 1));
      b.el.setAttribute('height', Math.max(0.1, b.h * g));
      b.el.setAttribute('y', b.base - b.h * g);
      var v = ch.vals[i];
      v.el.textContent = Math.round(v.v * g);
      v.el.setAttribute('y', b.base - b.h * g - 26);
      v.el.setAttribute('opacity', g);
    }
    var lp = oex(clamp(span(T, 7.2, 8.05), 0, 1));
    ch.line.setAttribute('stroke-dashoffset', ch.len * (1 - lp));
    ch.line.setAttribute('opacity', lp);
  };

  /* --- cena 5 (8.1–9.9): superfórmula m=8 --- */
  Reel.prototype.s5 = function (ctx, T) {
    var w = win(T, 8.05, 10.05, 0.3, 0.35); if (!w) return;
    var C = this.C, p = span(T, 8.05, 10.05);
    var cx = W / 2, cy = H / 2, rings = this.low ? 5 : 9;
    ctx.save(); ctx.globalAlpha = w; ctx.lineJoin = 'round';
    for (var r = 0; r < rings; r++) {
      var f = r / (rings - 1 || 1), g = ocu(clamp(p * 3.2 - f * 0.45, 0, 1));
      if (g <= 0) continue;
      var m = 8, n1 = lerp(0.30, 1.1, f) + Math.sin(p * 4 + f * 3) * 0.12, n2 = 1.7, n3 = 1.7;
      var R = lerp(150, H * 0.47, f) * lerp(0.55, 1, g);
      ctx.beginPath();
      for (var i = 0; i <= 260; i++) {
        var a = i / 260 * 6.2832 + p * (r % 2 ? -0.75 : 0.75);
        var t1 = Math.pow(Math.abs(Math.cos(m * a / 4)), n2);
        var t2 = Math.pow(Math.abs(Math.sin(m * a / 4)), n3);
        var rr = Math.pow(t1 + t2, -1 / n1) * R;
        var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      var acc = (r === rings - 3);
      if (r === 0) { ctx.fillStyle = rgba(C.accent, 0.16 * g); ctx.fill(); }
      ctx.strokeStyle = rgba(acc ? C.accent : C.paper, lerp(0.95, 0.3, f) * g);
      ctx.lineWidth = acc ? 7 : lerp(4.5, 2, f); ctx.stroke();
    }
    ctx.restore();
  };

  /* --- cena 6 (9.9–11.1): metaballs (filtro SVG goo; plano B em marching squares) --- */
  Reel.prototype.s6 = function (ctx, T) {
    var w = win(T, 9.85, 11.35, 0.3, 0.3); if (!w) return;
    var C = this.C, p = span(T, 9.85, 11.35);
    var nb = this.low ? 6 : 10, B = [];
    for (var i = 0; i < nb; i++) {
      var s1 = hash(i * 2.3) * 6.28, s2 = hash(i * 4.1 + 7) * 6.28, gro = ocu(clamp(p * 2.4 - i * 0.05, 0, 1));
      B.push([W / 2 + Math.cos(p * 2.0 + s1) * (60 + i * 34), H / 2 + Math.sin(p * 1.6 + s2) * (42 + i * 26),
              (64 + hash(i * 9.1) * 78) * gro, hash(i * 3.7) > 0.55]);
    }
    if (this.gooey === undefined) this.gooey = mkGoo();
    ctx.save(); ctx.globalAlpha = w;
    if (this.gooey) {
      // filtro SVG "goo": desfoque + corte no canal alfa. Preserva a cor exata da marca
      // (um contrast() em canvas trabalha por canal de cor e cria franja amarela no laranja).
      // uma única chamada de fill por cor: o filtro é aplicado por desenho, então só
      // as bolhas do mesmo path se fundem. Massa de destaque embaixo, massa clara por cima.
      ctx.filter = 'url(#' + this.gooey + ')';
      for (var g2 = 0; g2 < 2; g2++) {
        ctx.fillStyle = rgba(g2 ? C.paper : C.accent, 1);
        ctx.beginPath();
        for (var b = 0; b < nb; b++) {
          if (!!B[b][3] === !!g2) continue;
          ctx.moveTo(B[b][0] + B[b][2], B[b][1]);
          ctx.arc(B[b][0], B[b][1], B[b][2], 0, 6.2832);
        }
        ctx.fill();
      }
      ctx.filter = 'none';
    } else {
      var step = this.low ? 12 : 8, cols = Math.ceil(W / step), rows = Math.ceil(H / step);
      for (var gy = 0; gy < rows; gy++) {
        var run = -1, rv = 0;
        for (var gx = 0; gx <= cols; gx++) {
          var x = gx * step, y = gy * step, v = 0;
          if (gx < cols) for (var k2 = 0; k2 < nb; k2++) {
            var dx = x - B[k2][0], dy = y - B[k2][1];
            v += (B[k2][2] * B[k2][2]) / (dx * dx + dy * dy + 1);
          }
          var on = gx < cols && v > 1.0;
          if (on) { if (run < 0) run = x; rv = Math.max(rv, v); }
          else if (run >= 0) {
            ctx.fillStyle = rgba(rv > 2.4 ? C.accent : C.paper, 0.92);
            ctx.fillRect(run, y, x - run, step + 0.6); run = -1; rv = 0;
          }
        }
      }
    }
    ctx.restore();
  };

  /* --- transições: light leak (1.15–2.0) e disco (11.1–11.5) --- */
  Reel.prototype.sLeak = function (ctx, T) {
    var w = win(T, 1.15, 2.05, 0.25, 0.4); if (!w) return;
    var C = this.C, p = span(T, 1.15, 2.05);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = w;
    var x = lerp(-W * 0.4, W * 1.2, eoc(p));
    var g = ctx.createLinearGradient(x - 520, 0, x + 520, H);
    g.addColorStop(0, rgba(C.accent, 0)); g.addColorStop(0.45, rgba(C.accent, 0.55));
    g.addColorStop(0.55, rgba([255, 255, 255], 0.5)); g.addColorStop(1, rgba(C.accent, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
  Reel.prototype.sDisc = function (ctx, T, bg) {
    var w = win(T, 11.05, 11.6, 0.02, 0.2); if (!w) return;
    var C = this.C, p = span(T, 11.05, 11.55), r = eoc(p) * Math.hypot(W, H) * 0.62;
    ctx.save(); ctx.globalAlpha = Math.min(1, w * 1.6);
    ctx.fillStyle = rgba(C.paper, 1);
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = rgba(C.accent, 0.9); ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 6.2832); ctx.stroke();
    ctx.restore();
  };

  /* ---------- API global ---------- */
  root.HeluMotionReel = {
    create: function (el, o) { return el._reel || (el._reel = new Reel(el, o)); },
    get: function (el) { return el._reel || null; },
    init: function (s) {
      var l = (s || document).querySelectorAll('[data-motion-reel]');
      for (var i = 0; i < l.length; i++) root.HeluMotionReel.create(l[i]);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluMotionReel.init(); });
  else root.HeluMotionReel.init();
})(window);
