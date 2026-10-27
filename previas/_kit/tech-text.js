/*! TechText vanilla (HELU/HEsites) — port direto do TechText do React Bits (canvas 2D): wordmark que vira contorno tracejado sob o cursor, com moldura de seleção, specks, letras arrastáveis com mola, clickKick, guias tipográficas e intros. Sem dependências.
 *  Uso:  <div class="marca" data-tech-text data-text="HEsites" data-font-size="150" data-reveal="letter" style="height:420px"></div>   ou   HeluTech.create(el,{text:'HEsites'})
 *  Props (mesmos nomes/padrões): text='React Bits' (padrão: texto do elemento), fontFamily='' (vazio = fonte do site), fontWeight=600, fontSize=150, letterSpacing=-0.05, align='center', color='currentColor', accentColor='currentColor',
 *  reveal='letter'|'area'|'off', reach=200, softness=.7, dashLength=4, dashGap=2, lineStyle='dashed'|'solid', strokeWidth=1.5, specks=15, selection=true, labels=true, draggable=true, bounce=.4, clickKick=true,
 *  intro='none'|'type'|'assemble'|'metrics', introDuration=2, guides=false, sweep=true, speed=1. Container com altura (ex.: 420px). role=img + aria-label. prefers-reduced-motion: sem intro nem kick.
 *  Efeito de nicho (título/logotipo de marca em estúdio, tech, portfólio); fora do Agente 2 por padrão. Em toque só arrasta letras (rolagem vertical continua). */
(function (root) {
  'use strict';
  var LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', FALLOFF_STEPS = 8, SPRING = 320, INHERIT = /^(currentcolor|inherit)$/i, INTRO_DELAY = 0.15, KICK_DECAY = 0.62;
  var DEF = { text: 'React Bits', fontFamily: '', fontWeight: 600, fontSize: 150, letterSpacing: -0.05, color: 'currentColor', accentColor: 'currentColor', align: 'center', reach: 200, softness: 0.7, dashLength: 4, dashGap: 2, strokeWidth: 1.5, lineStyle: 'dashed', reveal: 'letter', specks: 15, selection: true, labels: true, draggable: true, bounce: 0.4, sweep: true, speed: 1, clickKick: true, intro: 'none', introDuration: 2, guides: false };
  var STR = { text: 1, fontFamily: 1, color: 1, accentColor: 1, align: 1, lineStyle: 1, reveal: 1, intro: 1 }, BOOL = { selection: 1, labels: 1, draggable: 1, sweep: 1, clickKick: 1, guides: 1 };
  var approach = function (c, t, dt, sec) { return c + (t - c) * (1 - Math.exp(-dt / sec)); };
  var clamp01 = function (v) { return Math.min(1, Math.max(0, Number(v) || 0)); };
  var smoothstep = function (e0, e1, v) { var t = clamp01((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  var noise = function () { var h = 2166136261; for (var i = 0; i < arguments.length; i++) { h = Math.imul(h ^ (arguments[i] | 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; } return (h >>> 0) / 4294967296; };
  var signed = function (v) { return v > 0 ? '+' + v : v < 0 ? '\u2212' + (-v) : '0'; };
  function css() {
    if (document.getElementById('tech-text-css')) return;
    var s = document.createElement('style'); s.id = 'tech-text-css'; s.textContent = '.tech-text{position:relative;width:100%;touch-action:pan-y;user-select:none}.tech-text-canvas{display:block;width:100%;height:100%}'; document.head.appendChild(s);
  }
  function create(container, opts) {
    if (container._tech) return container._tech; css();
    var S = {}, k; for (k in DEF) S[k] = DEF[k];
    var own = container.textContent.trim(); if (own) S.text = own;
    for (k in DEF) { var v = container.dataset[k]; if (v != null) S[k] = STR[k] ? v : BOOL[k] ? (v === '' || v === 'true') : parseFloat(v); }
    if (opts) for (k in opts) if (opts[k] !== undefined) S[k] = opts[k];
    container.textContent = ''; container.classList.add('tech-text'); container.setAttribute('role', 'img'); container.setAttribute('aria-label', S.text);
    var canvas = document.createElement('canvas'); canvas.className = 'tech-text-canvas'; container.appendChild(canvas);
    var ctx = canvas.getContext('2d'), scratch = document.createElement('canvas'), scratchCtx = scratch.getContext('2d');
    if (!ctx || !scratchCtx) return null;
    var reducedMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var width = 1, height = 1, dpr = 1, raf = 0, last = performance.now(), visible = false, alive = true, layoutKey = '', requestedFont = '', word = null, glyphs = [], presence = 0, clock = 0, pulse = 0, placed = false, dragging = -1, cursor = '', introClock = 0, introKind = '', introducing = false, fontsReady = !document.fonts, guideAlpha = 0;
    var kicks = [], press = { x: 0, y: 0, time: 0, index: -1 }, pointer = { x: 0, y: 0, inside: false }, grab = { x: 0, y: 0 }, lens = { x: 0, y: 0 }, frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };
    var wake;
    var refreshFonts = function () { layoutKey = ''; wake(); }, fontsLoaded = function () { fontsReady = true; refreshFonts(); };
    var family = function (s) { return s.fontFamily || getComputedStyle(container).fontFamily || 'sans-serif'; };
    var fontFor = function (s, size) { return s.fontWeight + ' ' + size + 'px ' + family(s); };
    var palette = function (s) { var cur = getComputedStyle(container).color || '#000000', pick = function (v) { return !v || INHERIT.test(String(v).trim()) ? cur : v; }; return { ink: pick(s.color), accent: pick(s.accentColor) }; };
    var setFont = function (t, s, size) { t.font = fontFor(s, size); if ('letterSpacing' in t) t.letterSpacing = (s.letterSpacing * size) + 'px'; t.textAlign = 'left'; t.textBaseline = 'alphabetic'; };
    var sprite = function (s, view, glyph, stroke, ink) {
      var pad = Math.ceil(s.strokeWidth * 2 + 4), left = glyph.box.x1 - pad, top = glyph.box.y1 - pad, w = glyph.box.x2 - glyph.box.x1 + pad * 2, h = glyph.box.y2 - glyph.box.y1 + pad * 2;
      var image = document.createElement('canvas'); image.width = Math.max(1, Math.ceil(w * dpr)); image.height = Math.max(1, Math.ceil(h * dpr));
      var c = image.getContext('2d'); if (!c) return { image: image, left: left, top: top };
      c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr); setFont(c, s, view.size);
      if (stroke) {
        c.lineJoin = 'round'; c.lineWidth = s.strokeWidth * 2; c.lineCap = 'butt'; c.strokeStyle = ink; if (s.lineStyle !== 'solid') c.setLineDash([Math.max(1, s.dashLength), Math.max(1, s.dashGap)]);
        c.strokeText(glyph.char, glyph.x, view.baseline); c.setLineDash([]); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000000'; c.fillText(glyph.char, glyph.x, view.baseline); c.globalCompositeOperation = 'source-over';
      } else { c.fillStyle = ink; c.fillText(glyph.char, glyph.x, view.baseline); }
      return { image: image, left: left, top: top };
    };
    var ensureLayout = function (s, ink) {
      var key = [s.text, family(s), s.fontWeight, s.fontSize, s.letterSpacing, s.align, ink, s.dashLength, s.dashGap, s.strokeWidth, s.lineStyle, width, height, dpr].join('|');
      if (key === layoutKey && word) return word; layoutKey = key;
      var wanted = fontFor(s, 64); if (document.fonts && wanted !== requestedFont) { requestedFont = wanted; document.fonts.load(wanted, s.text).then(refreshFonts, refreshFonts); }
      var probe = scratchCtx; setFont(probe, s, s.fontSize); var m = probe.measureText(s.text);
      var fit = Math.min(1, (width * 0.9) / Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1), (height * 0.66) / Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1));
      var size = s.fontSize * fit; setFont(probe, s, size); m = probe.measureText(s.text);
      var inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, inkHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, margin = width * 0.05;
      var start = s.align === 'left' ? margin : s.align === 'right' ? width - margin - inkWidth : (width - inkWidth) / 2, x = start + m.actualBoundingBoxLeft, baseline = (height - inkHeight) / 2 + m.actualBoundingBoxAscent;
      var xHeight = baseline - probe.measureText('x').actualBoundingBoxAscent, capHeight = baseline - probe.measureText('H').actualBoundingBoxAscent, ascender = baseline - probe.measureText('d').actualBoundingBoxAscent, descender = baseline + probe.measureText('p').actualBoundingBoxDescent;
      var top = baseline - m.actualBoundingBoxAscent, bottom = baseline + m.actualBoundingBoxDescent, inkTop = Math.min(top, capHeight) - 2, inkBottom = Math.max(bottom, baseline) + 2;
      var lines = [{ y: baseline, label: 'baseline' }, { y: xHeight, label: 'x-height' }, { y: capHeight, label: 'cap height' }]; if (capHeight - ascender > Math.max(11, size * 0.06)) lines.push({ y: ascender, label: 'ascender' }); lines.push({ y: descender, label: 'descender' });
      var next = { size: size, baseline: baseline, left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, top: top, bottom: bottom, lines: lines,
        bands: [{ y0: xHeight, y1: baseline, up: true, order: 0 }, { y0: capHeight, y1: xHeight, up: true, order: 1 }, { y0: inkTop, y1: capHeight, up: true, order: 2 }, { y0: baseline, y1: inkBottom, up: false, order: 1 }].filter(function (b) { return b.y1 - b.y0 > 0.5; }) };
      word = next;
      var chars = Array.from(s.text), previous = glyphs, prefix = ''; glyphs = [];
      chars.forEach(function (char, i) {
        prefix += char; var own = probe.measureText(char), gx = x + probe.measureText(prefix).width - own.width; if (!char.trim()) return;
        var base = { char: char, x: gx, box: { x1: gx - own.actualBoundingBoxLeft, y1: baseline - own.actualBoundingBoxAscent, x2: gx + own.actualBoundingBoxRight, y2: baseline + own.actualBoundingBoxDescent } };
        var kept = previous[glyphs.length];
        glyphs.push({ char: char, x: gx, box: base.box, offset: kept && kept.char === char ? kept.offset : { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, outline: 0, shown: 1, cells: null, assembled: 0, index: i, fill: sprite(s, next, base, false, ink), dashes: sprite(s, next, base, true, ink) });
      });
      dragging = -1; frame.index = -1; return next;
    };
    var glyphAt = function (x, y) {
      if (!word || y < word.top - 24 || y > word.bottom + 24) return -1; var best = -1, bd = Infinity;
      glyphs.forEach(function (g, i) { var x1 = g.box.x1 + g.offset.x, x2 = g.box.x2 + g.offset.x, d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0; if (d < bd) { bd = d; best = i; } });
      return bd < 28 ? best : -1;
    };
    var falloff = function (target, cx, cy, radius, strength, softness) {
      var inner = Math.min(1, Math.max(0, 1 - softness)), g = target.createRadialGradient(cx, cy, 0, cx, cy, radius); g.addColorStop(0, 'rgba(0, 0, 0, ' + strength + ')');
      if (inner > 0.995) { g.addColorStop(0.995, 'rgba(0, 0, 0, ' + strength + ')'); g.addColorStop(1, 'rgba(0, 0, 0, 0)'); return g; }
      for (var i = 0; i <= FALLOFF_STEPS; i++) { var t = i / FALLOFF_STEPS, e = t * t * (3 - 2 * t); g.addColorStop(inner + (1 - inner) * t, 'rgba(0, 0, 0, ' + (strength * (1 - e)) + ')'); }
      return g;
    };
    var blit = function (target, art, dx, dy, ox, oy) { target.drawImage(art.image, Math.round((art.left + dx) * dpr - ox), Math.round((art.top + dy) * dpr - oy)); };
    var drawReveal = function (s) {
      var radius = s.reach * dpr, cx = lens.x * dpr, cy = lens.y * dpr;
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = falloff(ctx, cx, cy, radius, presence, s.softness); ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2); ctx.globalCompositeOperation = 'source-over';
      var x0 = Math.max(0, Math.floor(cx - radius)), y0 = Math.max(0, Math.floor(cy - radius)), x1 = Math.min(canvas.width, Math.ceil(cx + radius)), y1 = Math.min(canvas.height, Math.ceil(cy + radius)); if (x1 <= x0 || y1 <= y0) return;
      var w = x1 - x0, h = y1 - y0; if (scratch.width < w || scratch.height < h) { scratch.width = Math.max(scratch.width, w); scratch.height = Math.max(scratch.height, h); }
      scratchCtx.setTransform(1, 0, 0, 1, 0, 0); scratchCtx.globalCompositeOperation = 'source-over'; scratchCtx.clearRect(0, 0, w, h);
      glyphs.forEach(function (g) { blit(scratchCtx, g.dashes, g.offset.x, g.offset.y, x0, y0); });
      scratchCtx.globalCompositeOperation = 'destination-in'; scratchCtx.fillStyle = falloff(scratchCtx, cx - x0, cy - y0, radius, 1, s.softness); scratchCtx.fillRect(0, 0, w, h); scratchCtx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = presence; ctx.drawImage(scratch, 0, 0, w, h, x0, y0, w, h); ctx.globalAlpha = 1;
    };
    var crisp = function (v) { return (Math.round(v * dpr) + 0.5) / dpr; };
    var perimeterPoint = function (distance, w, h) {
      var P = 2 * (w + h), d = ((distance % P) + P) % P;
      if (d < w) return [frame.x1 + d, frame.y1, 0, -1]; d -= w; if (d < h) return [frame.x2, frame.y1 + d, 1, 0]; d -= h; if (d < w) return [frame.x2 - d, frame.y2, 0, 1]; d -= w; return [frame.x1, frame.y2 - d, -1, 0];
    };
    var drawSpecks = function (s, a, accent) {
      var w = frame.x2 - frame.x1, h = frame.y2 - frame.y1; if (w < 2 || h < 2) return; var perimeter = 2 * (w + h), seed = frame.index + 1, grid = 3; ctx.fillStyle = accent; ctx.strokeStyle = accent;
      for (var kk = 0; kk < s.specks; kk++) {
        var period = 0.5 + noise(seed, kk, 11) * 1.2, t = pulse / period + noise(seed, kk, 17), cycle = Math.floor(t), life = t - cycle; if (life > 0.7) continue;
        var pp = perimeterPoint(noise(seed, kk, cycle) * perimeter, w, h), px = pp[0], py = pp[1], nx = pp[2], ny = pp[3], pick = noise(seed, kk, cycle, 2);
        var size = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11, large = size >= 8, out = (large ? 9 : 4) + Math.floor(noise(seed, kk, cycle, 1) * 5) * grid;
        var x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid, y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid, tone = noise(seed, kk, cycle, 3);
        var blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1, alpha = a * (large ? 0.3 + 0.4 * tone : 0.3 + 0.6 * tone) * blink, left = Math.round(x - size / 2), top = Math.round(y - size / 2);
        ctx.globalAlpha = alpha;
        if (tone < 0.26 || (large && tone < 0.78)) { ctx.strokeRect(left + 0.5, top + 0.5, size, size); if (large && tone > 0.5) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); } else ctx.fillRect(left, top, size, size);
      }
      for (var j = 0; j < 2; j++) { var head = (pulse * 0.42 * s.speed + j * 0.5) * perimeter; for (var i = 0; i < 4; i++) { var q = perimeterPoint(head - i * 6, w, h), sz = i === 0 ? 3 : 2; ctx.globalAlpha = a * [0.95, 0.55, 0.32, 0.16][i]; ctx.fillRect(Math.round(q[0] - sz / 2), Math.round(q[1] - sz / 2), sz, sz); } }
      ctx.globalAlpha = 1;
    };
    var drawFrame = function (s, accent) {
      var glyph = glyphs[frame.index]; if (!glyph || frame.alpha < 0.01) return; var a = frame.alpha, x1 = crisp(frame.x1), y1 = crisp(frame.y1), x2 = crisp(frame.x2), y2 = crisp(frame.y2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = accent; ctx.strokeStyle = accent; ctx.lineWidth = 1;
      var moved = Math.hypot(glyph.offset.x, glyph.offset.y);
      if (moved > 1) {
        var hx = (glyph.box.x1 + glyph.box.x2) / 2, hy = (glyph.box.y1 + glyph.box.y2) / 2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + glyph.offset.x, hy + glyph.offset.y); ctx.setLineDash([3, 4]); ctx.globalAlpha = 0.45 * a; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.rect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4); ctx.globalAlpha = 0.7 * a; ctx.fill();
      }
      ctx.beginPath(); ctx.rect(x1, y1, x2 - x1, y2 - y1); ctx.globalAlpha = 0.5 * a; ctx.stroke();
      ctx.beginPath(); [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].forEach(function (c) { ctx.rect(Math.round(c[0]) - 2, Math.round(c[1]) - 2, 5, 5); }); ctx.globalAlpha = 0.95 * a; ctx.fill(); ctx.globalAlpha = 1;
      if (s.specks > 0) drawSpecks(s, a, accent);
      if (!s.labels) return;
      ctx.font = LABEL_FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillStyle = accent; ctx.globalAlpha = 0.62 * a;
      var label = moved > 1 ? signed(Math.round(glyph.offset.x)) + ', ' + signed(Math.round(-glyph.offset.y)) : glyph.char + '  ' + Math.round(glyph.box.x2 - glyph.box.x1) + ' \u00d7 ' + Math.round(glyph.box.y2 - glyph.box.y1);
      ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7); ctx.globalAlpha = 1;
    };
    var drawLines = function (s, view, accent, alpha, growth) {
      var pad = Math.max(12, view.size * 0.12), x1 = Math.round(view.left - pad), x2 = Math.round(view.right + pad), room = width - x2 > x1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.strokeStyle = accent; ctx.fillStyle = accent; ctx.lineWidth = 1; ctx.font = LABEL_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = room ? 'left' : 'right';
      view.lines.forEach(function (line, kk) {
        var grow = growth(kk); if (grow <= 0.001) return; var y = crisp(line.y), end = x1 + (x2 - x1) * grow;
        ctx.globalAlpha = alpha * 0.4; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(end, y); ctx.stroke();
        ctx.globalAlpha = alpha * 0.9; ctx.fillRect(x1 - 1, Math.round(line.y) - 1, 3, 3); ctx.fillRect(Math.round(end) - 1, Math.round(line.y) - 1, 3, 3);
        if (s.labels) { ctx.globalAlpha = alpha * 0.62 * smoothstep(0.7, 1, grow); ctx.fillText(line.label, room ? x2 + 8 : x1 - 8, Math.round(line.y)); }
      });
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    };
    var ensureCells = function (glyph, view) {
      if (glyph.cells) return glyph.cells; var art = glyph.fill, size = Math.max(3, Math.round(view.size / 26)), w = art.image.width, h = art.image.height, source = art.image.getContext('2d'), cells = []; glyph.cells = cells; glyph.assembled = 0;
      if (!source || w < 2 || h < 2) return cells; var data = source.getImageData(0, 0, w, h).data, gx = Math.floor(art.left / size) * size, gy = Math.floor(art.top / size) * size;
      var cols = Math.ceil((art.left + w / dpr - gx) / size) + 1, rows = Math.ceil((art.top + h / dpr - gy) / size) + 1, hit = new Uint8Array(cols * rows);
      for (var py = 0; py < h; py++) for (var px = 0; px < w; px++) { if (data[(py * w + px) * 4 + 3] < 24) continue; var cx = Math.floor((art.left + px / dpr - gx) / size), cy = Math.floor((art.top + py / dpr - gy) / size); hit[cy * cols + cx] = 1; }
      var center = (glyph.box.x1 + glyph.box.x2) / 2, along = clamp01((center - view.left) / Math.max(1, view.right - view.left));
      for (var kk = 0; kk < hit.length; kk++) {
        if (!hit[kk]) continue; var angle = noise(glyph.index, kk, 1) * Math.PI * 2, distance = view.size * (0.25 + 0.6 * noise(glyph.index, kk, 2)), start = 0.03 + 0.36 * along + 0.12 * noise(glyph.index, kk, 3), land = start + 0.3 + 0.14 * noise(glyph.index, kk, 4);
        cells.push({ x: gx + (kk % cols) * size, y: gy + Math.floor(kk / cols) * size, size: size, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance * 0.7, start: start, land: land }); glyph.assembled = Math.max(glyph.assembled, land);
      }
      return cells;
    };
    var cellRect = function (x, y, size) { var left = Math.round(x * dpr), top = Math.round(y * dpr); return [left, top, Math.round((x + size) * dpr) - left, Math.round((y + size) * dpr) - top]; };
    var drawAssembling = function (glyph, progress, accent) {
      var cells = glyph.cells || []; ctx.save(); ctx.beginPath(); var landed = 0;
      cells.forEach(function (c) { if (progress < c.land) return; var r = cellRect(c.x, c.y, c.size); ctx.rect(r[0], r[1], r[2], r[3]); landed++; });
      if (landed) { ctx.clip(); blit(ctx, glyph.fill, 0, 0, 0, 0); } ctx.restore(); ctx.fillStyle = accent;
      cells.forEach(function (c) {
        if (progress < c.start || progress >= c.land) return; var u = (progress - c.start) / (c.land - c.start), e = 1 - Math.pow(1 - u, 4), size = c.size * (0.4 + 0.6 * e), x = c.x + (c.size - size) / 2 + c.dx * (1 - e), y = c.y + (c.size - size) / 2 + c.dy * (1 - e), r = cellRect(x, y, size);
        ctx.globalAlpha = Math.min(1, u * 4) * (0.55 + 0.45 * e); ctx.fillRect(r[0], r[1], Math.max(1, r[2]), Math.max(1, r[3]));
      });
      ctx.globalAlpha = 1;
    };
    var drawFilling = function (glyph, lead, progress, view) {
      var art = glyph.fill, left = Math.floor(art.left * dpr), top = Math.floor(art.top * dpr), w = art.image.width + 2, fill = clamp01((progress - 0.24 - 0.28 * lead) / 0.48), rects = [];
      view.bands.forEach(function (band) { var amount = smoothstep(0.3 * band.order, 0.3 * band.order + 0.4, fill); if (amount <= 0) return; var span = (band.y1 - band.y0) * amount, y0 = Math.round((band.up ? band.y1 - span : band.y0) * dpr), y1 = Math.round((band.up ? band.y1 : band.y0 + span) * dpr); if (y1 > y0) rects.push([y0, y1 - y0]); });
      var outline = smoothstep(0.08 + 0.2 * lead, 0.22 + 0.2 * lead, progress);
      if (outline > 0.001) { ctx.save(); ctx.beginPath(); ctx.rect(left - 2, top - 2, w + 2, art.image.height + 4); rects.forEach(function (r) { ctx.rect(left - 2, r[0], w + 2, r[1]); }); ctx.clip('evenodd'); ctx.globalAlpha = outline; blit(ctx, glyph.dashes, 0, 0, 0, 0); ctx.restore(); }
      if (rects.length) { ctx.save(); ctx.beginPath(); rects.forEach(function (r) { ctx.rect(left - 2, r[0], w + 2, r[1]); }); ctx.clip(); blit(ctx, glyph.fill, 0, 0, 0, 0); ctx.restore(); }
      ctx.globalAlpha = 1;
    };
    var kick = function (index) {
      var strength = (word ? word.size : 120) * 11; kicks.push({ index: index, at: pulse, velocity: strength });
      for (var d = 1; d < glyphs.length; d++) { var velocity = strength * Math.pow(KICK_DECAY, d); if (velocity < 30) break; [index - d, index + d].forEach(function (j) { if (j >= 0 && j < glyphs.length) kicks.push({ index: j, at: pulse + d * 0.055, velocity: velocity }); }); }
      wake();
    };
    var tick = function (now) {
      raf = 0; var s = S, dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
      var pal = palette(s), ink = pal.ink, accent = pal.accent, view = ensureLayout(s, ink), damping = 2 * Math.sqrt(SPRING) * (1 - clamp01(s.bounce) * 0.96);
      if (s.intro !== introKind) { introKind = s.intro; introClock = 0; }
      var introOn = introKind !== 'none' && !reducedMotion && glyphs.length > 0; if (introOn && fontsReady) introClock += dt;
      var progress = introOn ? clamp01((introClock - INTRO_DELAY) / Math.max(0.3, s.introDuration)) : 1; introducing = introOn && progress < 1;
      var sweeping = !introducing && s.sweep && !reducedMotion && !pointer.inside && dragging < 0; if (sweeping) clock += dt * s.speed; pulse += dt;
      var targetX = pointer.x, targetY = pointer.y;
      if (sweeping) { targetX = view.left + (view.right - view.left) * (0.5 - 0.5 * Math.cos(clock * 0.45)); targetY = view.top + (view.bottom - view.top) * (0.45 + 0.1 * Math.sin(clock * 0.8)); }
      var active = !introducing && (pointer.inside || sweeping || dragging >= 0);
      if (active && !placed) { lens.x = targetX; lens.y = targetY; }
      if (active) { var lag = pointer.inside ? 0.05 : 0.22; lens.x = approach(lens.x, targetX, dt, lag); lens.y = approach(lens.y, targetY, dt, lag); }
      placed = active; presence = approach(presence, s.reveal === 'area' && active && dragging < 0 ? 1 : 0, dt, 0.16);
      for (var kk = kicks.length - 1; kk >= 0; kk--) { if (kicks[kk].at > pulse) continue; var g0 = glyphs[kicks[kk].index]; if (g0) g0.velocity.y -= kicks[kk].velocity; kicks.splice(kk, 1); }
      var moving = false;
      glyphs.forEach(function (glyph, i) {
        if (i === dragging) { glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03); glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03); glyph.velocity.x = 0; glyph.velocity.y = 0; moving = true; return; }
        var off = glyph.offset, vel = glyph.velocity;
        if (Math.abs(off.x) < 0.05 && Math.abs(off.y) < 0.05 && Math.hypot(vel.x, vel.y) < 0.5) { off.x = 0; off.y = 0; vel.x = 0; vel.y = 0; return; }
        vel.x += (-SPRING * off.x - damping * vel.x) * dt; vel.y += (-SPRING * off.y - damping * vel.y) * dt; off.x += vel.x * dt; off.y += vel.y * dt; moving = true;
      });
      var typing = -1;
      if (introducing && introKind === 'type') { var step = 0.86 / glyphs.length, cursorAt = Math.min(glyphs.length - 1, Math.floor(progress / step)); typing = progress < 0.93 ? cursorAt : -1; glyphs.forEach(function (g, i) { g.shown = i < cursorAt ? 1 : i === cursorAt ? smoothstep(0, step * 0.3, progress - i * step) : 0; }); }
      else glyphs.forEach(function (g) { g.shown = 1; });
      var focus = introducing ? typing : dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
      if (focus >= 0 && s.selection) {
        var gl = glyphs[focus], bx1 = gl.box.x1 + gl.offset.x - 6, by1 = gl.box.y1 + gl.offset.y - 6, bx2 = gl.box.x2 + gl.offset.x + 6, by2 = gl.box.y2 + gl.offset.y + 6;
        if (frame.index < 0 || frame.alpha < 0.02) { frame.x1 = bx1; frame.y1 = by1; frame.x2 = bx2; frame.y2 = by2; }
        var glide = focus === dragging ? 0.02 : 0.08; frame.x1 = approach(frame.x1, bx1, dt, glide); frame.y1 = approach(frame.y1, by1, dt, glide); frame.x2 = approach(frame.x2, bx2, dt, glide); frame.y2 = approach(frame.y2, by2, dt, glide); frame.index = focus;
      }
      frame.alpha = approach(frame.alpha, focus >= 0 && s.selection ? 1 : 0, dt, 0.1);
      glyphs.forEach(function (glyph, i) {
        var target = introducing ? (introKind === 'type' && (i === typing || (typing >= 0 && i > typing)) ? 1 : 0) : (s.reveal === 'letter' && i === focus && i !== dragging ? 1 : 0);
        if (introducing && glyph.shown === 0) glyph.outline = target; glyph.outline = approach(glyph.outline, target, dt, 0.09); if (Math.abs(glyph.outline - target) > 0.002) moving = true; else glyph.outline = target;
      });
      guideAlpha = approach(guideAlpha, s.guides && !introducing && (focus >= 0 || presence > 0.4) ? 1 : 0, dt, 0.14);
      var hovering = !introducing && focus >= 0 && pointer.inside, nextCursor = dragging >= 0 ? 'grabbing' : hovering && s.draggable ? 'grab' : hovering && s.clickKick ? 'pointer' : '';
      if (nextCursor !== cursor) { cursor = nextCursor; container.style.cursor = nextCursor; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, canvas.width, canvas.height);
      glyphs.forEach(function (glyph) { var mv = Math.hypot(glyph.offset.x, glyph.offset.y); if (mv > 1) { ctx.globalAlpha = Math.min(1, mv / 24) * 0.55; blit(ctx, glyph.dashes, 0, 0, 0, 0); ctx.globalAlpha = 1; } });
      if (introducing && introKind === 'metrics') drawLines(s, view, accent, 1 - smoothstep(0.84, 1, progress), function (k2) { return smoothstep(0.02 + 0.04 * k2, 0.2 + 0.04 * k2, progress); });
      else if (guideAlpha > 0.005) drawLines(s, view, accent, guideAlpha * 0.6, function () { return 1; });
      glyphs.forEach(function (glyph, i) {
        if (introducing && introKind === 'assemble') { ensureCells(glyph, view); if (progress < glyph.assembled) { drawAssembling(glyph, progress, accent); return; } }
        if (introducing && introKind === 'metrics') { var lead = glyphs.length > 1 ? i / (glyphs.length - 1) : 0; if (progress < 0.72 + 0.28 * lead) { drawFilling(glyph, lead, progress, view); return; } }
        if (glyph.shown < 0.001) return;
        if (glyph.outline < 0.999) { ctx.globalAlpha = (1 - glyph.outline) * glyph.shown; blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0); }
        if (glyph.outline > 0.001) { ctx.globalAlpha = glyph.outline * glyph.shown; blit(ctx, glyph.dashes, glyph.offset.x, glyph.offset.y, 0, 0); }
        ctx.globalAlpha = 1;
      });
      if (presence > 0.001) drawReveal(s); drawFrame(s, accent);
      var settling = moving || introducing || kicks.length > 0 || (guideAlpha > 0.005 && guideAlpha < 0.995) || Math.abs(presence - (s.reveal === 'area' && active && dragging < 0 ? 1 : 0)) > 0.002 || (frame.alpha > 0.01 && frame.alpha < 0.99);
      if ((active || settling) && visible && alive) raf = requestAnimationFrame(tick);
    };
    wake = function () { if (raf || !visible || !alive) return; last = performance.now(); raf = requestAnimationFrame(tick); };
    var resize = function () { width = Math.max(1, container.clientWidth); height = Math.max(1, container.clientHeight); dpr = Math.min(root.devicePixelRatio || 1, 2); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); layoutKey = ''; wake(); };
    var locate = function (e) { var r = container.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    var onMove = function (e) { locate(e); pointer.inside = true; wake(); };
    var onLeave = function () { if (dragging >= 0) return; pointer.inside = false; wake(); };
    var onDown = function (e) {
      locate(e); pointer.inside = true; var primary = e.pointerType !== 'mouse' || e.button === 0, index = introducing || !primary ? -1 : glyphAt(pointer.x, pointer.y);
      press.x = pointer.x; press.y = pointer.y; press.time = performance.now(); press.index = index;
      if (S.draggable && index >= 0) { dragging = index; grab.x = pointer.x - glyphs[index].offset.x; grab.y = pointer.y - glyphs[index].offset.y; if (container.setPointerCapture) container.setPointerCapture(e.pointerId); }
      wake();
    };
    var onUp = function (e) {
      if (dragging >= 0) { dragging = -1; if (container.releasePointerCapture) container.releasePointerCapture(e.pointerId); var r = container.getBoundingClientRect(); pointer.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
      if (e.type === 'pointerup' && press.index >= 0 && S.clickKick && !reducedMotion && performance.now() - press.time < 450) { var r2 = container.getBoundingClientRect(); if (Math.hypot(e.clientX - r2.left - press.x, e.clientY - r2.top - press.y) < 6) kick(press.index); }
      press.index = -1; wake();
    };
    container.addEventListener('pointermove', onMove, { passive: true }); container.addEventListener('pointerenter', onMove, { passive: true }); container.addEventListener('pointerdown', onDown, { passive: true });
    container.addEventListener('pointerup', onUp, { passive: true }); container.addEventListener('pointercancel', onUp, { passive: true }); container.addEventListener('pointerleave', onLeave, { passive: true });
    var ro = new ResizeObserver(resize); ro.observe(container);
    var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; wake(); }); io.observe(container);
    var mo = new MutationObserver(wake); [document.documentElement, document.body].forEach(function (n) { if (n) mo.observe(n, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] }); });
    var sq = root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)'); if (sq && sq.addEventListener) sq.addEventListener('change', wake);
    if (document.fonts) document.fonts.ready.then(fontsLoaded, fontsLoaded);
    resize();
    return (container._tech = { update: function (n) { for (var k2 in n) S[k2] = n[k2]; layoutKey = ''; wake(); }, destroy: function () { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); container.style.cursor = ''; canvas.remove(); container._tech = null; } });
  }
  root.HeluTech = { create: create, init: function (s) { var l = (s || document).querySelectorAll('[data-tech-text]'); for (var i = 0; i < l.length; i++) create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluTech.init(); }); else root.HeluTech.init();
})(window);
