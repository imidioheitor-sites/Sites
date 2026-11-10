/*! HeluMagicTransform vanilla (HELU/HEsites) — port em JS puro do magic-transform do React Bits (equivalente: mesmas props principais e visual geral, reescrito sem React/three/gsap). Sem dependências.
 *  Uso: <div data-magic-transform data-colors='["#a78bfa","#34d399","#fbbf24","#f472b6"]' data-label="IA" style="height:260px"></div> (props: colors, label=✦, rate=1.2 docs/s, speed=1)
 *  Atributo: data-magic-transform · API: HeluMagicTransform.create(el, opts) · desliga com prefers-reduced-motion. */
(function (root) {
  'use strict';
  var H = (function () {
    var rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var touch = !!(window.matchMedia && matchMedia('(hover: none)').matches);
    function css(id, t) { id = 'helu-' + id; if (document.getElementById(id)) return; var s = document.createElement('style'); s.id = id; s.textContent = t; document.head.appendChild(s); }
    function num(el, k, d) { var v = parseFloat(el.getAttribute('data-' + k)); return isNaN(v) ? d : v; }
    function str(el, k, d) { var v = el.getAttribute('data-' + k); return v == null || v === '' ? d : v; }
    function bool(el, k, d) { var v = el.getAttribute('data-' + k); if (v == null) return d; return !(v === 'false' || v === '0'); }
    function list(el, k, d) { var v = el.getAttribute('data-' + k); if (!v) return d; try { var a = JSON.parse(v); if (Array.isArray(a)) return a; } catch (e) {} var b = v.split(/[|,]/).map(function (s) { return s.trim(); }).filter(Boolean); return b.length ? b : d; }
    function loop(el, fn) {
      var run = false, id = 0, last = 0, vis = true, io = null;
      function tick(now) { if (!run) return; id = requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; fn(now / 1000, dt); }
      function start() { if (!run && vis) { run = true; last = performance.now(); id = requestAnimationFrame(tick); } }
      function stop() { run = false; cancelAnimationFrame(id); }
      if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) start(); else stop(); }); io.observe(el); }
      start();
      return { stop: function () { stop(); if (io) io.disconnect(); }, start: start };
    }
    function layer(el, z, over) {
      var c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:' + (z || 0);
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      if (over) el.appendChild(c); else el.insertBefore(c, el.firstChild);
      var o = { c: c, w: 1, h: 1, dpr: 1, x: null };
      function rs() { var r = el.getBoundingClientRect(); o.dpr = Math.min(2, window.devicePixelRatio || 1); o.w = Math.max(1, r.width); o.h = Math.max(1, r.height); c.width = Math.round(o.w * o.dpr); c.height = Math.round(o.h * o.dpr); }
      rs(); var ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(el);
      o.resize = rs; o.destroy = function () { if (ro) ro.disconnect(); if (c.parentNode) c.parentNode.removeChild(c); };
      return o;
    }
    function ptr(el, mv, lv) {
      function m(e) { var r = el.getBoundingClientRect(); mv(e.clientX - r.left, e.clientY - r.top, r, e); }
      function l(e) { if (lv) lv(e); }
      el.addEventListener('pointermove', m); el.addEventListener('pointerleave', l);
      return function () { el.removeEventListener('pointermove', m); el.removeEventListener('pointerleave', l); };
    }
    function rgb(h) {
      h = String(h || '#fff').trim(); var m;
      if ((m = /^#([0-9a-f]{3})$/i.exec(h))) h = '#' + m[1].split('').map(function (x) { return x + x; }).join('');
      if ((m = /^#([0-9a-f]{6})/i.exec(h))) { var n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
      if ((m = /rgba?\(([^)]+)\)/.exec(h))) { var p = m[1].split(',').map(parseFloat); return [p[0] / 255, p[1] / 255, p[2] / 255]; }
      return [1, 1, 1];
    }
    function glBuild(el, frag, o) {
      o = o || {}; var L = layer(el, o.z || 0), g = L.c.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
      if (!g || rm && o.noMotionStatic === false) { L.destroy(); if (o.fallback) el.style.background = o.fallback; return null; }
      function sh(t, s) { var x = g.createShader(t); g.shaderSource(x, s); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) { if (window.console) console.warn('shader', g.getShaderInfoLog(x)); return null; } return x; }
      var vs = sh(g.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
      var fs = sh(g.FRAGMENT_SHADER, 'precision highp float;uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;\n' + (o.decl || '') + '\n' + frag);
      if (!vs || !fs) { L.destroy(); if (o.fallback) el.style.background = o.fallback; return null; }
      var pr = g.createProgram(); g.attachShader(pr, vs); g.attachShader(pr, fs); g.linkProgram(pr); g.useProgram(pr);
      var b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
      var pl = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(pl); g.vertexAttribPointer(pl, 2, g.FLOAT, false, 0, 0);
      var U = {}, loc = function (n) { return U[n] || (U[n] = g.getUniformLocation(pr, n)); };
      var vals = o.u || {}, mouse = [0.5, 0.5], tm = [0.5, 0.5], off = null;
      function setU(n, v) { var l = loc(n); if (!l) return; if (typeof v === 'number') g.uniform1f(l, v); else if (v.length === 2) g.uniform2fv(l, v); else if (v.length === 3) g.uniform3fv(l, v); else g.uniform4fv(l, v); }
      if (o.mouse !== false) off = ptr(el, function (x, y, r) { tm = [x / r.width, 1 - y / r.height]; }, function () { tm = [0.5, 0.5]; });
      var t0 = 0, lp = loop(el, function (t, dt) {
        if (rm) { dt = 0; }
        t0 += dt * (o.speed || 1); mouse[0] += (tm[0] - mouse[0]) * 0.08; mouse[1] += (tm[1] - mouse[1]) * 0.08;
        g.viewport(0, 0, L.c.width, L.c.height); setU('uRes', [L.c.width, L.c.height]); setU('uTime', t0); setU('uMouse', mouse);
        for (var k in vals) setU(k, vals[k]); g.drawArrays(g.TRIANGLES, 0, 3);
      });
      return { set: function (k, v) { vals[k] = v; }, destroy: function () { lp.stop(); if (off) off(); var ex = g.getExtension('WEBGL_lose_context'); if (ex) ex.loseContext(); L.destroy(); } };
    }
    function gl(el, frag, o) {
      o = o || {}; var inst = null, timer = 0, dead = false, io = null;
      function show() { clearTimeout(timer); if (!inst && !dead) inst = glBuild(el, frag, o) || { none: 1 }; }
      function hide() { timer = setTimeout(function () { if (inst && inst.destroy) inst.destroy(); inst = null; }, 1500); }
      if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) show(); else hide(); }); io.observe(el); } else show();
      return { set: function (k, v) { (o.u = o.u || {})[k] = v; }, destroy: function () { dead = true; if (io) io.disconnect(); clearTimeout(timer); if (inst && inst.destroy) inst.destroy(); } };
    }
    function reg(name, attr, create) {
      function mk(el, o) { el.__helu = el.__helu || {}; if (el.__helu[name]) return el.__helu[name]; var a = create(el, o || {}) || {}; return (el.__helu[name] = a); }
      function init(scope) { var l = (scope || document).querySelectorAll('[' + attr + ']'); for (var i = 0; i < l.length; i++) mk(l[i]); }
      root[name] = { create: mk, init: init };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); }); else init();
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function sr(el, text) { var s = document.createElement('span'); s.className = 'helu-sr'; s.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap'; s.textContent = text; el.appendChild(s); }
    function inview(el, fn, once, th) { if (!('IntersectionObserver' in window)) { fn(); return { stop: function () {} }; } var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { fn(); if (once !== false) io.disconnect(); } }, { threshold: th || 0.2 }); io.observe(el); return { stop: function () { io.disconnect(); } }; }
    function split(el, by) { var t = el.textContent; el.textContent = ''; sr(el, t); var out = []; var parts = by === 'words' ? t.split(/(\s+)/) : t.split(''); parts.forEach(function (p) { if (by === 'words' && /^\s+$/.test(p)) { var sp2 = document.createElement('span'); sp2.style.cssText = 'display:inline-block;white-space:pre'; sp2.textContent = ' '; sp2.setAttribute('aria-hidden', 'true'); el.appendChild(sp2); return; } var s = document.createElement('span'); s.setAttribute('aria-hidden', 'true'); s.style.display = 'inline-block'; s.textContent = p === ' ' ? ' ' : p; el.appendChild(s); out.push(s); }); return out; }
    function cols(el, k, d) { return list(el, k, d).map(rgb); }
    function fbm() { return 'float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vn(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return v;}'; }
    return { cols: cols, fbm: fbm, rm: rm, touch: touch, css: css, num: num, str: str, bool: bool, list: list, loop: loop, layer: layer, ptr: ptr, rgb: rgb, gl: gl, reg: reg, esc: esc, sr: sr, inview: inview, split: split };
  })();

function create(el, o) {
  var cols = H.list(el, 'colors', ['#a78bfa', '#34d399', '#fbbf24', '#f472b6']), label = H.str(el, 'label', '✦'), rate = H.num(el, 'rate', 1.2), sp = H.num(el, 'speed', 1);
  var L = H.layer(el, 0), x = L.c.getContext('2d'), parts = [], acc = 0, ink = H.str(el, 'ink', 'rgba(128,128,128,.9)');
  function spawn(t) { var h = L.h; parts.push({ t: 0, y: h * (0.2 + Math.random() * 0.6), col: cols[(Math.random() * cols.length) | 0], j: Math.random() * 6.28, rs: Math.random() * 40 - 20 }); }
  var lp = H.loop(el, function (t, dt) {
    var w = L.w, h = L.h, d = L.dpr, cx = w / 2, cy = h / 2; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    if (!H.rm) { acc += dt * rate * sp; while (acc > 1) { acc -= 1; spawn(t); } } else if (!parts.length) { for (var q = 0; q < 4; q++) { spawn(); parts[q].t = 0.15 + q * 0.2; } }
    var pulse = 0.5 + 0.5 * Math.sin(t * 3); x.save(); x.shadowBlur = 30; x.shadowColor = cols[0]; x.strokeStyle = cols[0]; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, 34 + pulse * 3, 0, 6.28); x.stroke(); x.restore();
    x.fillStyle = cols[0]; x.font = '700 22px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, cx, cy);
    parts.forEach(function (p) { p.t += dt * 0.22 * sp; var u = p.t;
      if (u < 0.5) { var k = u / 0.5, e = k * k, px = -30 + (cx - 30) * e, py = p.y + (cy - p.y) * e, s = 1 - 0.55 * e; x.save(); x.translate(px, py); x.rotate((1 - k) * 0.35 + Math.sin(p.j) * 0.1); x.scale(s, s); x.fillStyle = '#fff'; x.strokeStyle = ink; x.lineWidth = 1.2; x.beginPath(); x.rect(-14, -18, 28, 36); x.fill(); x.stroke(); x.fillStyle = ink; for (var l = 0; l < 4; l++) x.fillRect(-9, -12 + l * 7, l === 3 ? 10 : 18, 2); x.restore(); }
      else { var k2 = (u - 0.5) / 0.5, e2 = 1 - Math.pow(1 - k2, 2), px2 = cx + 30 + (w - cx - 10) * e2, py2 = cy + (p.y - cy) * e2 * 0.6 + p.rs * e2, s2 = 0.5 + 0.55 * Math.min(1, k2 * 2); x.save(); x.globalAlpha = 1 - Math.max(0, k2 - 0.8) * 5; x.translate(px2, py2); x.scale(s2, s2); x.shadowBlur = 16; x.shadowColor = p.col; x.fillStyle = p.col; x.beginPath(); if (x.roundRect) x.roundRect(-15, -15, 30, 30, 9); else x.rect(-15, -15, 30, 30); x.fill(); x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(-8, -6, 16, 3); x.fillRect(-8, 1, 10, 3); x.restore(); } });
    parts = parts.filter(function (p) { return p.t < 1; });
  });
  return { destroy: function () { lp.stop(); L.destroy(); } };
}
H.reg('HeluMagicTransform', 'data-magic-transform', create);

})(window);
