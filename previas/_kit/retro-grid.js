/*! RetroGrid vanilla (HELU/HEsites) — port direto do Retro Grid do Magic UI (shader WebGL1 + OES_standard_derivatives, mesmo fragment shader e LOD de linhas). Sem dependências.
 *  Uso:  <div class="fundo" data-retro-grid data-angle="65" data-cell-size="60" data-opacity="0.5" data-light-line-color="gray" data-dark-line-color="gray"></div>   ou   HeluRetro.create(el,{angle:65})
 *  Props (mesmos nomes/padrões): angle=65 (1-89), cellSize=60, opacity=0.5, lightLineColor='gray', darkLineColor='gray'. Extra: data-fade (cor do degradê da base; padrão branco no claro / preto no escuro; 'none' desliga).
 *  EXCEÇÃO DE NICHO: é um plano rotacionado em perspectiva (aparência 3D). Só tech/gamer/estúdio/retrô, nunca no hero, e o Agente 2 não escolhe por padrão.
 *  Fallback sem WebGL: grade CSS (rotateX + keyframes). Pausa fora da tela (IntersectionObserver), prefers-reduced-motion para no frame 0, recupera context lost.
 *  Escuro: classe .dark / [data-theme=dark] no <html> ou prefers-color-scheme. O container precisa de altura e position (ex.: absolute; inset:0). */
(function (root) {
  'use strict';
  var DUR = 15;
  var VS = 'attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}';
  var FS = [
    '#extension GL_OES_standard_derivatives : enable', 'precision highp float;',
    'uniform vec2 u_container_size;uniform vec2 u_viewport_size;uniform vec4 u_line_color;uniform float u_angle;uniform float u_cell_size;uniform float u_device_pixel_ratio;uniform float u_time;',
    'const float animationDurationSeconds = 15.0;const float gridHeightRatio = 3.0;const float gridStartOffsetRatio = -0.5;const float gridWidthRatio = 6.0;const float gridXOffsetRatio = -2.0;',
    'const float gridLineAlignmentOffsetPx = 0.5;const float gridLineAntialiasMultiplier = 0.9;',
    'const float horizontalLodLevelOneEndPx = 5.6;const float horizontalLodLevelOneStartPx = 2.8;const float horizontalLodLevelTwoEndPx = 3.0;const float horizontalLodLevelTwoStartPx = 1.4;',
    'const float horizontalCompressionEndPx = 2.8;const float horizontalCompressionStartPx = 1.2;const float lineWidthPx = 0.92;const float perspectivePx = 200.0;const float gridTravelRatio = 0.5;',
    'const float verticalCompressionEndPx = 2.6;const float verticalCompressionStartPx = 1.0;const float verticalEdgeCompressionEnd = 0.95;const float verticalEdgeCompressionStart = 0.45;',
    'const float verticalLodLevelEnd = 0.64;const float verticalLodLevelStart = 0.22;const float verticalTopCompressionEndCells = 6.0;const float verticalTopCompressionStartCells = 2.0;',
    'float renderGridLine(float wrappedCoord,float antiAliasWidth,float softnessBoost){return 1.0 - smoothstep(lineWidthPx,lineWidthPx + (antiAliasWidth * (1.5 + softnessBoost)),wrappedCoord);}',
    'void main(){',
    ' float angle = radians(clamp(u_angle, 1.0, 89.0));float sinAngle = sin(angle);float cosAngle = cos(angle);',
    ' vec2 screen = vec2((gl_FragCoord.x / u_device_pixel_ratio) - (u_container_size.x * 0.5),(u_container_size.y * 0.5) - (gl_FragCoord.y / u_device_pixel_ratio));',
    ' vec3 rayOrigin = vec3(0.0, 0.0, perspectivePx);vec3 rayDirection = normalize(vec3(screen, -perspectivePx));',
    ' vec3 planeXAxis = vec3(1.0, 0.0, 0.0);vec3 planeYAxis = vec3(0.0, cosAngle, sinAngle);vec3 planeNormal = normalize(cross(planeXAxis, planeYAxis));',
    ' float denominator = dot(rayDirection, planeNormal);',
    ' if (abs(denominator) < 0.0001) { discard; }',
    ' float distanceToPlane = dot(-rayOrigin, planeNormal) / denominator;',
    ' if (distanceToPlane <= 0.0) { discard; }',
    ' vec3 hitPoint = rayOrigin + (rayDirection * distanceToPlane);float localX = hitPoint.x;float localY = dot(hitPoint, planeYAxis);',
    ' float gridWidth = u_viewport_size.x * gridWidthRatio;float gridHeight = u_viewport_size.y * gridHeightRatio;',
    ' float gridScrollSpeed = (gridHeight * gridTravelRatio) / animationDurationSeconds;float patternOffsetY = u_time * gridScrollSpeed;',
    ' float gridLeft = (-0.5 * u_container_size.x) + (gridXOffsetRatio * u_container_size.x);float gridTop = (-0.5 * u_container_size.y) + (gridStartOffsetRatio * gridHeight);',
    ' vec2 planePosition = vec2(localX - gridLeft, localY - gridTop);',
    ' if (planePosition.x < 0.0 || planePosition.y < 0.0 || planePosition.x > gridWidth || planePosition.y > gridHeight) { discard; }',
    ' vec2 patternPosition = vec2(planePosition.x, planePosition.y - patternOffsetY);',
    ' vec2 wrapped = mod(patternPosition + vec2(gridLineAlignmentOffsetPx), u_cell_size);',
    ' vec2 patternDerivative = max(fwidth(patternPosition), vec2(0.0001));vec2 antiAliasWidth = patternDerivative * gridLineAntialiasMultiplier;',
    ' float horizontalCellSpanPx = u_cell_size / patternDerivative.y;',
    ' float horizontalCompression = 1.0 - smoothstep(horizontalCompressionStartPx,horizontalCompressionEndPx,horizontalCellSpanPx);',
    ' float verticalCellSpanPx = u_cell_size / patternDerivative.x;',
    ' float sideDistance = abs((planePosition.x / gridWidth) * 2.0 - 1.0);',
    ' float verticalEdgeCompression = smoothstep(verticalEdgeCompressionStart,verticalEdgeCompressionEnd,sideDistance);',
    ' float verticalTopCompression = 1.0 - smoothstep(u_cell_size * verticalTopCompressionStartCells,u_cell_size * verticalTopCompressionEndCells,planePosition.y);',
    ' float verticalCompression = (1.0 - smoothstep(verticalCompressionStartPx,verticalCompressionEndPx,verticalCellSpanPx)) * verticalEdgeCompression * verticalTopCompression;',
    ' float horizontalSoftnessBoost = 1.0 + (horizontalCompression * 3.0);float verticalSoftnessBoost = 1.0 + (verticalCompression * 3.5);',
    ' float verticalLod = smoothstep(verticalLodLevelStart,verticalLodLevelEnd,verticalCompression);',
    ' float verticalLineFine = renderGridLine(wrapped.x,antiAliasWidth.x,verticalSoftnessBoost);',
    ' float verticalWrappedLod = mod(patternPosition.x + gridLineAlignmentOffsetPx,u_cell_size * 2.0);',
    ' float verticalLineCoarse = renderGridLine(verticalWrappedLod,antiAliasWidth.x,verticalSoftnessBoost + verticalLod);',
    ' float verticalLine = max(verticalLineFine * (1.0 - verticalLod),verticalLineCoarse * verticalLod);',
    ' float horizontalLodLevelOne = 1.0 - smoothstep(horizontalLodLevelOneStartPx,horizontalLodLevelOneEndPx,horizontalCellSpanPx);',
    ' float horizontalLodLevelTwo = 1.0 - smoothstep(horizontalLodLevelTwoStartPx,horizontalLodLevelTwoEndPx,horizontalCellSpanPx);',
    ' float horizontalLineFine = renderGridLine(wrapped.y,antiAliasWidth.y,horizontalSoftnessBoost);',
    ' float horizontalWrappedLodOne = mod(patternPosition.y + gridLineAlignmentOffsetPx,u_cell_size * 2.0);',
    ' float horizontalWrappedLodTwo = mod(patternPosition.y + gridLineAlignmentOffsetPx,u_cell_size * 4.0);',
    ' float horizontalLineCoarse = renderGridLine(horizontalWrappedLodOne,antiAliasWidth.y,horizontalSoftnessBoost + horizontalLodLevelOne);',
    ' float horizontalLineExtraCoarse = renderGridLine(horizontalWrappedLodTwo,antiAliasWidth.y,horizontalSoftnessBoost + horizontalLodLevelOne + horizontalLodLevelTwo);',
    ' float horizontalLineReduced = max(horizontalLineFine * (1.0 - horizontalLodLevelOne),horizontalLineCoarse * horizontalLodLevelOne);',
    ' float horizontalLine = max(horizontalLineReduced * (1.0 - horizontalLodLevelTwo),horizontalLineExtraCoarse * horizontalLodLevelTwo);',
    ' float line = max(verticalLine, horizontalLine);',
    ' if (line <= 0.001) { discard; }',
    ' float alpha = u_line_color.a * line;gl_FragColor = vec4(u_line_color.rgb * alpha, alpha);', '}'
  ].join('\n');
  var DEF = { angle: 65, cellSize: 60, opacity: 0.5, lightLineColor: 'gray', darkLineColor: 'gray', fade: '' };
  var NUM = { angle: 1, cellSize: 1, opacity: 1 };
  var cctx;
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function dark(mq) {
    var h = document.documentElement;
    if (h.classList.contains('dark') || h.getAttribute('data-theme') === 'dark') return true;
    if (h.classList.contains('light') || h.getAttribute('data-theme') === 'light') return false;
    return mq.matches;
  }
  function resolveColor(color, el) {
    var s = document.createElement('span'); s.style.cssText = 'color:' + color + ';opacity:0;pointer-events:none;position:absolute'; el.appendChild(s);
    var c = getComputedStyle(s).color; s.remove();
    if (!cctx) { var cv = document.createElement('canvas'); cv.width = cv.height = 1; cctx = cv.getContext('2d', { willReadFrequently: true }); }
    if (!cctx) return new Float32Array([.5, .5, .5, 1]);
    cctx.clearRect(0, 0, 1, 1); cctx.fillStyle = c; cctx.fillRect(0, 0, 1, 1);
    var p = cctx.getImageData(0, 0, 1, 1).data; return new Float32Array([p[0] / 255, p[1] / 255, p[2] / 255, p[3] / 255]);
  }
  function css() {
    if (document.getElementById('retro-grid-css')) return;
    var s = document.createElement('style'); s.id = 'retro-grid-css';
    s.textContent = '.retro-grid{pointer-events:none;overflow:hidden}.retro-grid canvas,.retro-grid .rg-fb,.retro-grid .rg-fade{position:absolute;inset:0;width:100%;height:100%}' +
      '.retro-grid .rg-fb{perspective:200px}.retro-grid .rg-fb>div{position:absolute;inset:0}.retro-grid .rg-scroll{position:absolute;top:0;left:-200%;height:300vh;width:600vw;transform-origin:100% 0 0;background-repeat:repeat;animation:retro-grid-scroll 15s linear infinite}' +
      '@keyframes retro-grid-scroll{from{transform:translateY(-50%)}to{transform:translateY(0)}}@media (prefers-reduced-motion:reduce){.retro-grid .rg-scroll{animation:none;transform:translateY(-50%)}}';
    document.head.appendChild(s);
  }
  function Grid(el, opts) {
    var self = this, k; css(); this.el = el; this.o = {};
    for (k in DEF) this.o[k] = DEF[k];
    for (k in DEF) { var dk = 'retroGrid' + k.charAt(0).toUpperCase() + k.slice(1); var v = el.dataset[k] != null ? el.dataset[k] : el.dataset[dk]; if (v != null && v !== '') this.o[k] = NUM[k] ? parseFloat(v) : v; }
    if (opts) for (k in opts) if (opts[k] !== undefined) this.o[k] = opts[k];
    el.classList.add('retro-grid'); el.style.opacity = this.o.opacity; if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    this.mq = root.matchMedia('(prefers-color-scheme: dark)'); this.rm = root.matchMedia('(prefers-reduced-motion: reduce)');
    this.canvas = document.createElement('canvas'); this.canvas.style.opacity = '0'; this.canvas.setAttribute('aria-hidden', 'true');
    this.fb = document.createElement('div'); this.fb.className = 'rg-fb'; this.fb.setAttribute('aria-hidden', 'true');
    this.fb.innerHTML = '<div style="transform:rotateX(' + clamp(this.o.angle, 1, 89) + 'deg)"><div class="rg-scroll"></div></div>';
    this.fade = document.createElement('div'); this.fade.className = 'rg-fade';
    el.appendChild(this.fb); el.appendChild(this.canvas); el.appendChild(this.fade);
    this.vis = true; this.lost = false; this.raf = 0; this.gl = null; this.ready = false; this.w = this.h = 0; this.dpr = 1; this.t0 = performance.now();
    this.colors(); this.fallbackStyle();
    this.ro = new ResizeObserver(function () { self.sync(); }); this.ro.observe(el);
    this.io = new IntersectionObserver(function (e) { self.vis = e[0] ? e[0].isIntersecting : false; if (self.vis) self.sync(); else self.stop(); }); this.io.observe(el);
    this.mo = new MutationObserver(function () { self.colors(); self.fallbackStyle(); self.sync(); }); this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    this.onchg = function () { self.colors(); self.fallbackStyle(); self.sync(); };
    this.rm.addEventListener && this.rm.addEventListener('change', this.onchg); this.mq.addEventListener && this.mq.addEventListener('change', this.onchg);
    this.canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); self.lost = true; self.stop(); self.prog = null; self.show(false); });
    this.canvas.addEventListener('webglcontextrestored', function () { self.lost = false; self.sync(); });
    this.sync();
  }
  Grid.prototype.colors = function () {
    var c = dark(this.mq) ? this.o.darkLineColor : this.o.lightLineColor; this.color = resolveColor(c, this.el); this.cssColor = c;
    var f = this.o.fade || (dark(this.mq) ? '#000' : '#fff'); this.fade.style.background = f === 'none' ? 'none' : 'linear-gradient(to top,' + f + ',transparent 90%)';
  };
  Grid.prototype.fallbackStyle = function () {
    var s = this.fb.firstChild.firstChild, c = this.cssColor, n = Math.max(this.o.cellSize, 1);
    s.style.backgroundImage = 'linear-gradient(to right,' + c + ' 1px,transparent 0),linear-gradient(to bottom,' + c + ' 1px,transparent 0)'; s.style.backgroundSize = n + 'px ' + n + 'px';
    this.fb.firstChild.style.transform = 'rotateX(' + clamp(this.o.angle, 1, 89) + 'deg)';
  };
  Grid.prototype.show = function (on) { this.canvas.style.opacity = on ? '1' : '0'; this.fb.style.display = on ? 'none' : ''; this.ready = on; };
  Grid.prototype.init = function () {
    var gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return false;
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s; gl.deleteShader(s); return null; }
    var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS); if (!v || !f) return false;
    var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    var u = {}, names = ['angle', 'cell_size', 'container_size', 'device_pixel_ratio', 'line_color', 'time', 'viewport_size'];
    for (var i = 0; i < names.length; i++) { u[names[i]] = gl.getUniformLocation(p, 'u_' + names[i]); if (!u[names[i]]) return false; }
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.gl = gl; this.prog = p; this.u = u; this.buf = b; this.attr = gl.getAttribLocation(p, 'a_position'); return true;
  };
  Grid.prototype.draw = function (ts) {
    var gl = this.gl, u = this.u; if (!gl || !this.prog || this.lost || !this.w || !this.h) return;
    gl.useProgram(this.prog); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.enableVertexAttribArray(this.attr); gl.vertexAttribPointer(this.attr, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.angle, clamp(this.o.angle, 1, 89)); gl.uniform1f(u.cell_size, Math.max(this.o.cellSize, 1)); gl.uniform2f(u.container_size, this.w, this.h);
    gl.uniform1f(u.device_pixel_ratio, this.dpr); gl.uniform4fv(u.line_color, this.color); gl.uniform1f(u.time, this.rm.matches ? 0 : ts / 1000);
    gl.uniform2f(u.viewport_size, root.innerWidth, root.innerHeight); gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  Grid.prototype.stop = function () { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } };
  Grid.prototype.sync = function () {
    var self = this; if (this.lost) { this.stop(); this.show(false); return; }
    if (!this.prog && !this.init()) { this.stop(); this.show(false); return; }
    this.w = Math.floor(this.el.clientWidth); this.h = Math.floor(this.el.clientHeight); if (!this.w || !this.h) { this.stop(); return; }
    this.dpr = Math.min(root.devicePixelRatio || 1, 2); this.canvas.width = Math.floor(this.w * this.dpr); this.canvas.height = Math.floor(this.h * this.dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    var now = performance.now() - this.t0; this.draw(now); this.show(true);
    if (this.rm.matches || !this.vis) { this.stop(); return; }
    if (!this.raf) { var f = function (t) { self.draw(t - self.t0); self.raf = (!self.rm.matches && self.vis) ? requestAnimationFrame(f) : 0; }; this.raf = requestAnimationFrame(f); }
  };
  Grid.prototype.update = function (n) { for (var k in n) this.o[k] = n[k]; this.el.style.opacity = this.o.opacity; this.colors(); this.fallbackStyle(); this.sync(); };
  Grid.prototype.destroy = function () { this.stop(); this.ro.disconnect(); this.io.disconnect(); this.mo.disconnect(); this.canvas.remove(); this.fb.remove(); this.fade.remove(); this.el._retro = null; };
  root.HeluRetro = { create: function (el, o) { return el._retro || (el._retro = new Grid(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-retro-grid]'); for (var i = 0; i < l.length; i++) root.HeluRetro.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluRetro.init(); }); else root.HeluRetro.init();
})(window);
