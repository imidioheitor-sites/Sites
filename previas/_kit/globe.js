/*! HeluGlobe vanilla (HELU/HEsites) — port em JS puro do globe do React Bits (equivalente: mesmas props principais e visual geral, reescrito sem React/three/gsap). Sem dependências.
 *  Uso: <div data-globe style="width:480px;height:480px"></div> (props: color=#7dd3fc, arc-color=#fbbf24, dots=1400, arcs=6, speed=1, drag=true)
 *  Atributo: data-globe · API: HeluGlobe.create(el, opts) · desliga com prefers-reduced-motion. */
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
  var col = H.str(el, 'color', '#7dd3fc'), ac = H.str(el, 'arc-color', '#fbbf24'), N = H.num(el, 'dots', 1400), NA = H.num(el, 'arcs', 6), sp = H.num(el, 'speed', 1), drag = H.bool(el, 'drag', true);
  var L = H.layer(el, 0), x = L.c.getContext('2d'), pts = [], arcs = [], rot = 0.5, tilt = 0.35, vel = 0, dn = false, lx = 0;
  function land(la, lo) { return Math.sin(lo * 2.1 + 1) * Math.cos(la * 3.1) + 0.6 * Math.sin(lo * 4.3 - la * 2) + 0.4 * Math.sin(la * 5.7 + lo) > 0.15; }
  var ga = Math.PI * (3 - Math.sqrt(5)); for (var i = 0; i < N * 3 && pts.length < N; i++) { var y = 1 - (i / (N * 3 - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i, la = Math.asin(y), lo = Math.atan2(Math.sin(th) * r, Math.cos(th) * r); if (land(la, lo)) pts.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
  function ll(la, lo) { return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]; }
  for (i = 0; i < NA; i++) arcs.push({ a: ll((Math.random() - 0.5) * 2, Math.random() * 6.28), b: ll((Math.random() - 0.5) * 2, Math.random() * 6.28), t: Math.random() * 2, s: 0.25 + Math.random() * 0.3 });
  function pr(p) { var cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt), a = p[0] * cr + p[2] * sr, b = -p[0] * sr + p[2] * cr, y = p[1] * ct - b * st, z = p[1] * st + b * ct; return [a, y, z]; }
  function slerp(a, b, f) { var d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(d), s = Math.sin(om) || 1, k1 = Math.sin((1 - f) * om) / s, k2 = Math.sin(f * om) / s, v = [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2], lift = 1 + Math.sin(f * Math.PI) * om * 0.22; return [v[0] * lift, v[1] * lift, v[2] * lift]; }
  function dd(e) { if (!drag) return; dn = true; lx = e.clientX; } function mm(e) { if (dn) { vel = (e.clientX - lx) * 0.005; rot += vel; lx = e.clientX; } } function uu() { dn = false; }
  el.addEventListener('pointerdown', dd); window.addEventListener('pointermove', mm); window.addEventListener('pointerup', uu);
  var lp = H.loop(el, function (t, dt) {
    if (!dn) { vel += (0.15 * sp - vel) * 0.05; if (!H.rm) rot += vel * dt; }
    var w = L.w, h = L.h, d = L.dpr, R = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    var gr = x.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.25); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = col; for (var i = 0; i < pts.length; i++) { var p = pr(pts[i]); if (p[2] < -0.1) continue; x.globalAlpha = 0.25 + 0.75 * Math.max(0, p[2]); x.fillRect(cx + p[0] * R - 1, cy - p[1] * R - 1, 2, 2); } x.globalAlpha = 1;
    x.lineCap = 'round'; arcs.forEach(function (A) { A.t += dt * A.s * sp; if (A.t > 1.6) { A.t = 0; A.a = ll((Math.random() - 0.5) * 2, Math.random() * 6.28); A.b = ll((Math.random() - 0.5) * 2, Math.random() * 6.28); }
      var head = Math.min(1, A.t), tail = Math.max(0, A.t - 0.6); x.strokeStyle = ac; x.lineWidth = 1.6; x.beginPath(); var on = false;
      for (var k = 0; k <= 24; k++) { var f = tail + (head - tail) * k / 24, p = pr(slerp(A.a, A.b, f)); if (p[2] < -0.05) { on = false; continue; } var X = cx + p[0] * R, Y = cy - p[1] * R; if (!on) { x.moveTo(X, Y); on = true; } else x.lineTo(X, Y); } x.stroke();
      var e = pr(slerp(A.a, A.b, head)); if (e[2] > 0 && A.t < 1) { x.fillStyle = ac; x.beginPath(); x.arc(cx + e[0] * R, cy - e[1] * R, 3, 0, 6.28); x.fill(); } });
  });
  return { destroy: function () { lp.stop(); el.removeEventListener('pointerdown', dd); window.removeEventListener('pointermove', mm); window.removeEventListener('pointerup', uu); L.destroy(); } };
}
H.reg('HeluGlobe', 'data-globe', create);

})(window);
