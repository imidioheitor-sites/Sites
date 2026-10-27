/*! Cubes vanilla (HELU/HEsites) — port direto do Cubes do React Bits (WebGL2, mesmos shaders e física). Grade de cubos que viram para o cursor, com ripple no clique, intro e auto-animação. Sem dependências.
 *  Uso:  <div class="fundo" data-cubes data-grid-size="10" data-face-color="#120F17" data-edge-color="#ffffff" data-max-angle="45" data-radius="3" style="height:600px"></div>   ou   HeluCubes.create(el,{gridSize:10})
 *  Props (mesmos nomes/padrões): gridSize=10, gap=.18, faceColor='#120F17', edgeColor='#ffffff', edgeWidth=1, edgeStyle='solid'|'dashed'|'dotted'|'none', faceOpacity=1, shading=.6, maxAngle=45, radius=3, speed=1, bounce=.4, brush=1,
 *  perspective=0 (vista frontal plana; padrão do kit), autoAnimate=true, rippleOnClick=true, rippleColor='#ffffff', rippleSpeed=1, intro=true, paused=false, dpr (máx. 2).
 *  EXCEÇÃO DE NICHO: os cubos giram em 3D de verdade. Só tech/estúdio/gamer, nunca no hero, fora do Agente 2 por padrão. Sem WebGL2: grade de quadrados CSS. prefers-reduced-motion: sem intro/ripple/auto. Pausa fora da tela.
 *  O container precisa de altura (ex.: 600px) e position. */
(function (root) {
  'use strict';
  var VERTEX = '#version 300 es\nin vec3 aPosition;\nin vec3 aNormal;\nin vec2 aUv;\nin vec2 aCenter;\nin vec4 aRotation;\nin vec2 aState;\nuniform mat4 uProjection;\nuniform float uSize;\nout vec3 vNormal;\nout vec2 vUv;\nout float vFlash;\n' +
    'vec3 turn(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }\n' +
    'void main() { vec3 local = turn(aRotation, aPosition * uSize * aState.y); vNormal = turn(aRotation, aNormal); vUv = aUv; vFlash = aState.x; gl_Position = uProjection * vec4(vec3(aCenter, 0.0) + local, 1.0); }';
  var FRAGMENT = '#version 300 es\nprecision highp float;\nin vec3 vNormal;\nin vec2 vUv;\nin float vFlash;\nuniform vec3 uFace;\nuniform vec3 uEdge;\nuniform vec3 uRipple;\nuniform vec3 uLight;\nuniform float uShading;\nuniform float uEdgeWidth;\nuniform float uStyle;\nuniform float uMarks;\nuniform float uOpacity;\nout vec4 outColor;\n' +
    'void main() {\n vec2 span = max(fwidth(vUv), vec2(0.00001));\n vec2 border = min(vUv, 1.0 - vUv) / span;\n bool vertical = border.x < border.y;\n float distance = min(border.x, border.y);\n float halfWidth = uEdgeWidth * 0.5;\n' +
    ' float cover = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, distance);\n float along = vertical ? vUv.y : vUv.x;\n float phase = along * uMarks;\n float step = max(vertical ? span.y : span.x, 0.00001) * uMarks;\n float offset = abs(fract(phase + 0.5) - 0.5);\n' +
    ' if (uStyle > 0.5 && uStyle < 1.5) { cover *= 1.0 - smoothstep(0.25 - step, 0.25 + step, offset); }\n else if (uStyle > 1.5 && uStyle < 2.5) { float radius = max(uEdgeWidth * 0.9, 1.0); float dot = length(vec2(offset / step, distance)); cover = 1.0 - smoothstep(radius - 0.75, radius + 0.75, dot); }\n else if (uStyle > 2.5) { cover = 0.0; }\n' +
    ' vec3 normal = normalize(vNormal);\n cover *= smoothstep(0.06, 0.28, abs(normal.z));\n float side = clamp(1.0 - normal.z, 0.0, 1.0);\n float toward = clamp(0.6 + 0.6 * dot(normalize(normal.xy + vec2(0.00001)), normalize(uLight.xy)), 0.0, 1.0);\n' +
    ' vec3 face = mix(uFace, uEdge, side * mix(0.12, 0.42, toward) * uShading);\n face = mix(face, uRipple, vFlash * 0.22);\n vec3 edge = mix(uEdge, uRipple, vFlash);\n vec3 color = mix(face, edge, cover);\n float alpha = mix(uOpacity, 1.0, cover);\n outColor = vec4(color * alpha, alpha);\n}';
  var FACES = [[0, 0, 1, 1, 0, 0, 0, 1, 0], [0, 0, -1, -1, 0, 0, 0, 1, 0], [1, 0, 0, 0, 0, -1, 0, 1, 0], [-1, 0, 0, 0, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 0, 0, 0, -1], [0, -1, 0, 1, 0, 0, 0, 0, 1]];
  function buildCube() {
    var v = [], ix = [];
    FACES.forEach(function (f, face) {
      [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(function (uv) { var u = uv[0], w = uv[1];
        v.push(f[0] * .5 + (u - .5) * f[3] + (w - .5) * f[6], f[1] * .5 + (u - .5) * f[4] + (w - .5) * f[7], f[2] * .5 + (u - .5) * f[5] + (w - .5) * f[8], f[0], f[1], f[2], u, w); });
      var b = face * 4; ix.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    return { vertices: new Float32Array(v), indices: new Uint16Array(ix) };
  }
  var STYLES = { solid: 0, dashed: 1, dotted: 2, none: 3 }, INTRO = 1.1;
  var DEF = { gridSize: 10, gap: .18, faceColor: '#120F17', edgeColor: '#ffffff', edgeWidth: 1, edgeStyle: 'solid', faceOpacity: 1, shading: .6, maxAngle: 45, radius: 3, speed: 1, bounce: .4, brush: 1, perspective: 0, autoAnimate: true, rippleOnClick: true, rippleColor: '#ffffff', rippleSpeed: 1, intro: true, paused: false, dpr: 0 };
  var STR = { faceColor: 1, edgeColor: 1, edgeStyle: 1, rippleColor: 1 }, BOOL = { autoAnimate: 1, rippleOnClick: 1, intro: 1, paused: 1 };
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function compile(gl, t, s) { var h = gl.createShader(t); gl.shaderSource(h, s); gl.compileShader(h); if (gl.getShaderParameter(h, gl.COMPILE_STATUS)) return h; gl.deleteShader(h); return null; }
  function link(gl) {
    var v = compile(gl, gl.VERTEX_SHADER, VERTEX), f = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT), p = gl.createProgram(); if (!v || !f || !p) return null;
    gl.attachShader(p, v); gl.attachShader(p, f); ['aPosition', 'aNormal', 'aUv', 'aCenter', 'aRotation', 'aState'].forEach(function (n, i) { gl.bindAttribLocation(p, i, n); });
    gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null; }
    var u = {}, c = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (var i = 0; i < c; i++) { var info = gl.getActiveUniform(p, i); if (info) u[info.name] = gl.getUniformLocation(p, info.name); }
    return { program: p, uniforms: u };
  }
  function toRotation(rx, ry, out, o) { var a = Math.hypot(rx, ry); if (a < 1e-6) { out[o] = 0; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 1; return; } var s = Math.sin(a / 2) / a; out[o] = rx * s; out[o + 1] = ry * s; out[o + 2] = 0; out[o + 3] = Math.cos(a / 2); }
  function multiply(a, b, out, o) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[o] = aw * bx + ax * bw + ay * bz - az * by; out[o + 1] = aw * by - ax * bz + ay * bw + az * bx; out[o + 2] = aw * bz + ax * by - ay * bx + az * bw; out[o + 3] = aw * bw - ax * bx - ay * by - az * bz;
  }
  function projection(w, h, scale, pers) {
    var hw = w / 2 / scale, hh = h / 2 / scale, depth = Math.max(hw, hh) * 4 + 4;
    if (pers <= .001) return new Float32Array([1 / hw, 0, 0, 0, 0, 1 / hh, 0, 0, 0, 0, -1 / depth, 0, 0, 0, 0, 1]);
    var fov = (8 + pers * 52) * Math.PI / 180, dist = hh / Math.tan(fov / 2), near = Math.max(.1, dist - depth), far = dist + depth, f = 1 / Math.tan(fov / 2), asp = hw / hh;
    return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far) - (far + near) / (near - far) * dist, dist]);
  }
  function css() {
    if (document.getElementById('cubes-css')) return;
    var s = document.createElement('style'); s.id = 'cubes-css';
    s.textContent = '.cubes-container{position:relative;overflow:hidden;touch-action:pan-y}.cubes-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}';
    document.head.appendChild(s);
  }
  function Cubes(el, opts) {
    css(); var k, self = this; this.el = el; var S = {};
    for (k in DEF) S[k] = DEF[k];
    for (k in DEF) { var v = el.dataset[k]; if (v != null) S[k] = STR[k] ? v : BOOL[k] ? (v === '' || v === 'true') : parseFloat(v); }
    if (opts) for (k in opts) if (opts[k] !== undefined) S[k] = opts[k];
    this.S = S; el.classList.add('cubes-container');
    var canvas = document.createElement('canvas'); canvas.className = 'cubes-canvas'; canvas.setAttribute('aria-hidden', 'true'); el.appendChild(canvas); this.canvas = canvas;
    var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, stencil: false }), shader = gl && link(gl);
    if (!gl || !shader) { this.fallback(); return; }
    this.gl = gl; this.shader = shader; var cube = buildCube();
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);
    var inb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, inb);
    [[3, 2, 0], [4, 4, 8], [5, 2, 24]].forEach(function (a) { gl.enableVertexAttribArray(a[0]); gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, 32, a[2]); gl.vertexAttribDivisor(a[0], 1); });
    this.vao = vao; this.bufs = [vb, ib, inb]; this.inb = inb;
    this.probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); this.cc = {};
    this.reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.view = { width: 1, height: 1, ratio: 1, scale: 1 }; this.pointer = { x: 0, y: 0, inside: false, moved: 0 }; this.cursor = { x: 0, y: 0, vx: 0, vy: 0, weight: 0, primed: false };
    this.grid = { size: 0, count: 0 }; this.rings = []; this.clock = 0; this.introClock = S.intro && !this.reduce ? 0 : 99; this.raf = 0; this.last = 0; this.visible = true;
    this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el);
    this.io = new IntersectionObserver(function (e) { self.visible = e.some(function (x) { return x.isIntersecting; }); if (self.visible) { self.last = 0; self.wake(); } }); this.io.observe(el);
    this.onMove = function (e) { var r = el.getBoundingClientRect(), p = self.pointer; p.x = e.clientX - r.left; p.y = e.clientY - r.top; p.inside = p.x >= 0 && p.y >= 0 && p.x <= r.width && p.y <= r.height; if (p.inside) p.moved = self.clock; self.wake(); };
    this.onLeave = function () { self.pointer.inside = false; self.wake(); };
    this.onDown = function (e) { var r = el.getBoundingClientRect(); self.ripple(e.clientX - r.left, e.clientY - r.top); };
    this.onVis = function () { self.last = 0; self.wake(); };
    root.addEventListener('pointermove', this.onMove, { passive: true }); document.documentElement.addEventListener('pointerleave', this.onLeave); el.addEventListener('pointerdown', this.onDown); document.addEventListener('visibilitychange', this.onVis);
    this.resize();
  }
  Cubes.prototype.fallback = function () {
    var S = this.S, n = Math.round(clamp(S.gridSize, 1, 40)), p = 100 / n, g = S.gap * p / 2; this.canvas.remove();
    this.el.style.backgroundColor = S.faceColor; this.el.style.backgroundImage = 'linear-gradient(to right,' + S.edgeColor + ' ' + S.edgeWidth + 'px,transparent 0),linear-gradient(to bottom,' + S.edgeColor + ' ' + S.edgeWidth + 'px,transparent 0)'; this.el.style.backgroundSize = p + '% ' + p + '%';
  };
  Cubes.prototype.rgb = function (v) { if (this.cc[v]) return this.cc[v]; var rgb = [1, 1, 1], p = this.probe; if (p) { p.clearRect(0, 0, 1, 1); p.fillStyle = '#ffffff'; p.fillStyle = v; p.fillRect(0, 0, 1, 1); var d = p.getImageData(0, 0, 1, 1).data; rgb = [d[0] / 255, d[1] / 255, d[2] / 255]; } return (this.cc[v] = rgb); };
  Cubes.prototype.allocate = function (size) {
    var g = this.grid; if (g.size === size) return; g.size = size; g.count = size * size;
    this.rx = new Float32Array(g.count); this.ry = new Float32Array(g.count); this.wx = new Float32Array(g.count); this.wy = new Float32Array(g.count); this.glow = new Float32Array(g.count); this.delays = new Float32Array(g.count); this.instances = new Float32Array(g.count * 8);
    var c = (size - 1) / 2; for (var i = 0; i < g.count; i++) this.delays[i] = Math.hypot(i % size - c, Math.floor(i / size) - c) / Math.max(1, size / 2);
  };
  Cubes.prototype.toWorld = function (x, y) { var v = this.view; return [(x - v.width / 2) / v.scale, (v.height / 2 - y) / v.scale]; };
  Cubes.prototype.ripple = function (x, y) { if (!this.S.rippleOnClick || this.reduce) return; var o = this.toWorld(x, y); this.rings.push({ x: o[0], y: o[1], born: this.clock }); if (this.rings.length > 6) this.rings.shift(); this.wake(); };
  Cubes.prototype.render = function () {
    var gl = this.gl, S = this.S, v = this.view, u = this.shader.uniforms, c = this.canvas; gl.viewport(0, 0, c.width, c.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); if (!this.grid.count) return;
    gl.useProgram(this.shader.program); gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.inb); gl.bufferData(gl.ARRAY_BUFFER, this.instances, gl.DYNAMIC_DRAW);
    var gap = clamp(S.gap, 0, .9), ew = Math.max(0, S.edgeWidth);
    gl.uniformMatrix4fv(u.uProjection, false, projection(v.width, v.height, v.scale, clamp(S.perspective, 0, 1))); gl.uniform1f(u.uSize, 1 - gap);
    gl.uniform3fv(u.uFace, this.rgb(S.faceColor)); gl.uniform3fv(u.uEdge, this.rgb(S.edgeColor)); gl.uniform3fv(u.uRipple, this.rgb(S.rippleColor));
    var l = [-.42, .55, .72], len = Math.hypot(l[0], l[1], l[2]); gl.uniform3f(u.uLight, l[0] / len, l[1] / len, l[2] / len);
    gl.uniform1f(u.uShading, Math.max(0, S.shading)); gl.uniform1f(u.uEdgeWidth, ew * v.ratio); gl.uniform1f(u.uStyle, STYLES[S.edgeStyle] != null ? STYLES[S.edgeStyle] : 0);
    var cp = (1 - gap) * v.scale, sp = S.edgeStyle === 'dotted' ? Math.max(4, ew * 4) : Math.max(6, ew * 6); gl.uniform1f(u.uMarks, Math.max(1, Math.round(cp / sp))); gl.uniform1f(u.uOpacity, clamp(S.faceOpacity, 0, 1));
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (S.faceOpacity >= .999) { gl.depthMask(true); gl.cullFace(gl.BACK); gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, this.grid.count); }
    else { gl.depthMask(false); gl.cullFace(gl.FRONT); gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, this.grid.count); gl.cullFace(gl.BACK); gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, this.grid.count); gl.depthMask(true); }
  };
  Cubes.prototype.step = function (dt) {
    var S = this.S, g = this.grid, cur = this.cursor, ptr = this.pointer, rings = this.rings, rx = this.rx, ry = this.ry, wx = this.wx, wy = this.wy, glow = this.glow, inst = this.instances;
    this.allocate(Math.round(clamp(S.gridSize, 1, 40))); g = this.grid; rx = this.rx; ry = this.ry; wx = this.wx; wy = this.wy; glow = this.glow; inst = this.instances;
    this.clock += dt; if (this.introClock < 99) this.introClock += dt;
    var reduce = this.reduce, live = S.autoAnimate && !reduce && (!ptr.inside || this.clock - ptr.moved > 3), gx = cur.x, gy = cur.y, engaged = false;
    if (ptr.inside && this.clock - ptr.moved <= 3) { var w = this.toWorld(ptr.x, ptr.y); gx = w[0]; gy = w[1]; engaged = true; }
    else if (live) { var reach = g.size * .42; gx = Math.sin(this.clock * .37) * reach * Math.cos(this.clock * .11); gy = Math.sin(this.clock * .53 + 1.2) * reach; engaged = true; }
    if (!cur.primed && engaged) { cur.x = gx; cur.y = gy; cur.primed = true; }
    var follow = 1 - Math.exp(-dt * 18), px = cur.x, py = cur.y; cur.x += (gx - cur.x) * follow; cur.y += (gy - cur.y) * follow;
    var blend = 1 - Math.exp(-dt * 10); cur.vx += ((cur.x - px) / Math.max(dt, .001) - cur.vx) * blend; cur.vy += ((cur.y - py) / Math.max(dt, .001) - cur.vy) * blend;
    cur.weight += ((engaged ? 1 : 0) - cur.weight) * (1 - Math.exp(-dt * (engaged ? 6 : 2.5)));
    var speed = Math.max(.05, S.speed), bounce = clamp(S.bounce, 0, 1), radius = Math.max(.5, S.radius), stiffness = 160 * speed * speed, damping = 2 * (1 - .82 * bounce) * Math.sqrt(stiffness), maxAngle = S.maxAngle * Math.PI / 180, lift = .8, travel = 8 * Math.max(.05, S.rippleSpeed), fade = Math.exp(-dt * 3.2), reachLimit = g.size * 1.5 + 2;
    for (var kk = rings.length - 1; kk >= 0; kk--) if ((this.clock - rings[kk].born) * travel > reachLimit) rings.splice(kk, 1);
    var spd = Math.hypot(cur.vx, cur.vy), sX = spd > 1e-4 ? -cur.vy / spd : 0, sY = spd > 1e-4 ? cur.vx / spd : 0, sweep = reduce ? 0 : Math.min(spd, 40) * Math.max(0, S.brush) * 1.6, moving = false, c0 = (g.size - 1) / 2;
    for (var i = 0; i < g.count; i++) {
      var cx = i % g.size - c0, cy = c0 - Math.floor(i / g.size), dx = cx - cur.x, dy = cy - cur.y, dist = Math.hypot(dx, dy), t = dist / radius, fo = t < 1 ? (1 - t * t) * (1 - t * t) * cur.weight : 0, tX = 0, tY = 0;
      if (fo > 0 && dist > 1e-4) { var tilt = maxAngle * fo * (dist / Math.hypot(dist, lift)); tX = dy / dist * tilt; tY = -dx / dist * tilt; }
      if (fo > 0 && sweep > 0) { wx[i] += sX * sweep * fo * dt * 4; wy[i] += sY * sweep * fo * dt * 4; }
      glow[i] *= fade;
      for (var r = 0; r < rings.length; r++) { var ring = rings[r], ox = cx - ring.x, oy = cy - ring.y, rc = Math.hypot(ox, oy), now = (this.clock - ring.born) * travel; if (rc > now || rc <= now - travel * dt || rc < 1e-4) continue; var st = Math.exp(-rc / (g.size * .8)); wx[i] -= oy / rc * 13 * st; wy[i] += ox / rc * 13 * st; glow[i] = Math.max(glow[i], st); }
      if (glow[i] > .01) moving = true;
      if (reduce) { rx[i] = tX; ry[i] = tY; wx[i] = 0; wy[i] = 0; } else { wx[i] += (stiffness * (tX - rx[i]) - damping * wx[i]) * dt; wy[i] += (stiffness * (tY - ry[i]) - damping * wy[i]) * dt; rx[i] += wx[i] * dt; ry[i] += wy[i] * dt; }
      if (Math.abs(tX - rx[i]) + Math.abs(tY - ry[i]) > .0005 || Math.abs(wx[i]) + Math.abs(wy[i]) > .0005) moving = true;
      var grow = 1, tumble = 0;
      if (this.introClock < 99) { var loc = clamp((this.introClock - this.delays[i] * .55) / INTRO, 0, 1), ez = 1 - Math.pow(1 - loc, 3); grow = ez; tumble = (1 - ez) * Math.PI / 2; if (loc < 1) moving = true; }
      var tl = [0, 0, 0, 1]; toRotation(rx[i], ry[i], tl, 0); var turn = [Math.sin(tumble / 2), 0, 0, Math.cos(tumble / 2)], b = i * 8;
      inst[b] = cx; inst[b + 1] = cy; multiply(tl, turn, inst, b + 2); inst[b + 6] = glow[i]; inst[b + 7] = grow;
    }
    if (this.introClock >= INTRO + .6 && this.introClock < 99) this.introClock = 99;
    return moving || live || rings.length > 0 || (engaged && spd > .01) || Math.abs((engaged ? 1 : 0) - cur.weight) > .002;
  };
  Cubes.prototype.frame = function (now) {
    var self = this; this.raf = 0; if (!this.visible || document.hidden) return;
    var dt = this.last ? Math.min(.05, (now - this.last) / 1000) : 1 / 60; this.last = now;
    var active = this.S.paused ? false : this.step(dt); this.render();
    if (active) this.raf = requestAnimationFrame(function (t) { self.frame(t); }); else this.last = 0;
  };
  Cubes.prototype.wake = function () { var self = this; if (!this.raf && this.visible && !document.hidden && this.gl) this.raf = requestAnimationFrame(function (t) { self.frame(t); }); };
  Cubes.prototype.resize = function () {
    var S = this.S, v = this.view, el = this.el, c = this.canvas, w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight), n = Math.round(clamp(S.gridSize, 1, 40));
    v.ratio = Math.min(S.dpr || root.devicePixelRatio || 1, 2); v.width = w; v.height = h; v.scale = Math.min(w, h) / (n + .9); c.width = Math.max(1, Math.round(w * v.ratio)); c.height = Math.max(1, Math.round(h * v.ratio));
    this.allocate(n); if (!this.raf) { this.step(0); this.render(); } this.wake();
  };
  Cubes.prototype.update = function (n) { for (var k in n) this.S[k] = n[k]; if (this.gl) { this.resize(); } };
  Cubes.prototype.destroy = function () {
    cancelAnimationFrame(this.raf); if (this.ro) { this.ro.disconnect(); this.io.disconnect(); root.removeEventListener('pointermove', this.onMove); document.documentElement.removeEventListener('pointerleave', this.onLeave); this.el.removeEventListener('pointerdown', this.onDown); document.removeEventListener('visibilitychange', this.onVis); }
    this.canvas.remove(); this.el._cubes = null;
  };
  root.HeluCubes = { create: function (el, o) { return el._cubes || (el._cubes = new Cubes(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-cubes]'); for (var i = 0; i < l.length; i++) root.HeluCubes.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluCubes.init(); }); else root.HeluCubes.init();
})(window);
