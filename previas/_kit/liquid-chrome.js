/*! HeluLiquidChrome vanilla (HELU/HEsites) — port em JS puro do liquid-chrome do React Bits (equivalente: mesmas props principais e visual geral, reescrito sem React/three/gsap). Sem dependências.
 *  Uso: <section data-liquid-chrome data-base-color="#202228" style="height:480px"></section> (props: base-color, speed=0.2, amplitude=0.5, frequency=3, interactive=true)
 *  Atributo: data-liquid-chrome · API: HeluLiquidChrome.create(el, opts) · desliga com prefers-reduced-motion. */
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

function create(el) {
  var bc = H.rgb(H.str(el, 'base-color', '#1d1f26')), am = H.num(el, 'amplitude', 0.5), fq = H.num(el, 'frequency', 3);
  var g = H.gl(el, 'void main(){vec2 uv=(gl_FragCoord.xy*2.-uRes)/min(uRes.x,uRes.y);uv+=(uMouse-.5)*.8;float t=uTime;for(float i=1.;i<7.;i++){uv.x+=uAmp/i*cos(i*uFq*uv.y+t);uv.y+=uAmp/i*cos(i*uFq*uv.x+t);}float v=abs(sin(uv.x+uv.y+t*.3));vec3 col=uBase*(.35+.9/ (abs(uv.x)+abs(uv.y)+.6)) ;col+=vec3(pow(v,6.))*.55;col=mix(col,vec3(dot(col,vec3(.33))),.35);gl_FragColor=vec4(col,1.);}', { decl: 'uniform vec3 uBase;uniform float uAmp;uniform float uFq;', u: { uBase: bc, uAmp: am, uFq: fq }, speed: H.num(el, 'speed', 0.4), mouse: H.bool(el, 'interactive', true) });
  return { destroy: function () { if (g) g.destroy(); } };
}
H.reg('HeluLiquidChrome', 'data-liquid-chrome', create);

})(window);
