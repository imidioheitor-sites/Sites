/*! AcidSquares vanilla (HELU/HEsites) — port direto do AcidSquares do React Bits (WebGL2, mesmos shaders). Superfície de quadrados brilhantes ondulando com duas luzes coloridas, ripples e interação com o cursor. Sem dependências.
 *  Uso:  <div class="fundo" data-acid-squares data-color="#120f17" data-accent-color="#ff4fb8" data-secondary-color="#3b6bff" style="height:600px"></div>   ou   HeluAcid.create(el,{lighting:'split'})
 *  Props (mesmos nomes/padrões): color, accentColor, secondaryColor, tileSize=1, gap=.12, roundness=.25, softness=.5, bulge=.3, rotation=35, gloss=.6, waves=1, waveScale=1, speed=.6, shape='square'|'round', pulse=1, pulseSpeed=.45, pulseSpacing=1, pulseWidth=1,
 *  pulseOrigin='center'|'random', brightness=1, lighting='split'|'backlit'|'overhead', tilt=.7, zoom=1, depth=10, grain=.12, fade=0, opacity=1, intro=true, mouseInteraction=true, hoverEffect='press'|'lift'|'none', mouseStrength=1, mouseRadius=.35,
 *  pulseOnClick=true, detail='low'|'medium'|'high' (padrão: low em telas <700px), lightMode=false, paused=false, dpr (máx. 2).
 *  EXCEÇÃO DE NICHO: campo de ondas visto em perspectiva (tilt). Tech/estúdio/moda/noite, nunca no hero, fora do Agente 2 por padrão. Sem WebGL2: cor sólida + gradiente. prefers-reduced-motion: quadro estático. Pausa fora da tela. O container precisa de altura e position. */
(function (root) {
  'use strict';
  var MAX_RIPPLES = 8, MESH = { low: 150, medium: 210, high: 280 }, AREA = [-42, -76, 84, 94], MAX_RENDER_DIM = 2400, INTRO_SECONDS = 3, REVEAL_SECONDS = 2.6, REVEAL_REACH = 19, ORIGIN = [0, -3], HOVER_EFFECTS = { press: 1, lift: -1, none: 0 };
  var LIGHTING = { split: [[7, 4.2, -4, 4, 4], [-8, 3.6, 3, 4, 4]], backlit: [[6, 1.6, -15, 5, 3], [-7, 1.4, -13, 5, 3]], overhead: [[3, 7.5, -4, 3, 3], [-3, 7, -1, 3, 3]] };
  var DEG = Math.PI / 180;
  var FIELD = `
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform vec4 uWave;
uniform float uSquare;
uniform float uClock;
uniform vec4 uSwell;
uniform vec4 uHover;
uniform vec4 uIntro;

float reachOf(vec2 delta, out vec2 grad) {
  vec2 a = abs(delta);
  vec2 dir = vec2(delta.x < 0.0 ? -1.0 : 1.0, delta.y < 0.0 ? -1.0 : 1.0);
  float round_ = length(delta);
  vec2 roundGrad = delta / max(round_, 1e-4);
  float m = max(max(a.x, a.y), 1e-4);
  vec2 k = a / m;
  vec2 k3 = k * k * k;
  float sum = dot(k3, k);
  float root = sqrt(sqrt(sum));
  float square = m * root;
  vec2 squareGrad = dir * k3 / (root * root * root);
  float d = mix(round_, square, uSquare);
  vec2 g = mix(roundGrad, squareGrad, uSquare);
  float soft = sqrt(d * d + 0.36);
  grad = g * d / soft;
  return soft - 0.6;
}

vec3 field(vec2 p) {
  float t = uSwell.w;
  float f = uSwell.y;
  vec2 k1 = vec2(0.19, 0.11) * f;
  vec2 k2 = vec2(-0.09, 0.23) * f;
  vec2 k3 = vec2(0.29, -0.17) * f;
  float a1 = dot(p, k1) + t * 0.55;
  float a2 = dot(p, k2) - t * 0.42 + 1.3;
  float a3 = dot(p, k3) + t * 0.74 + 2.1;
  float h = 0.55 * sin(a1) + 0.4 * sin(a2) + 0.22 * sin(a3);
  vec2 g = 0.55 * cos(a1) * k1 + 0.4 * cos(a2) * k2 + 0.22 * cos(a3) * k3;
  h *= uSwell.x;
  g *= uSwell.x;
  vec2 dg;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float age = uClock - r.z;
    if (age <= 0.0) continue;
    float d = reachOf(p - r.xy, dg);
    float radius = age * uWave.y;
    float x = (d - radius) / uWave.z;
    float life = clamp(1.0 - radius / uWave.w, 0.0, 1.0);
    float strength = r.w * uWave.x * life * life * smoothstep(0.0, 1.5, radius);
    float bump = exp(-x * x);
    h += bump * strength;
    g += -2.0 * x * bump * strength / uWave.z * dg;
  }
  if (uIntro.w > 0.0) {
    float d = reachOf(p - uIntro.xy, dg);
    float x = (d - uIntro.z) / 2.2;
    float bump = exp(-x * x) * uIntro.w;
    h += bump;
    g += -2.0 * x * bump / 2.2 * dg;
  }
  vec2 hd = p - uHover.xy;
  float hr = max(uHover.z, 1e-3);
  float hover = exp(-dot(hd, hd) / (hr * hr)) * uHover.w;
  h -= hover;
  g += 2.0 * hd / (hr * hr) * hover;
  return vec3(h, g);
}
`;
  var VERTEX = `#version 300 es
precision highp float;
${FIELD}
layout(location = 0) in vec2 aGrid;
uniform mat4 uViewProj;
uniform vec4 uArea;
out vec2 vGround;
out vec3 vWorld;
void main() {
  vec2 ground = uArea.xy + aGrid * uArea.zw;
  vec3 f = field(ground);
  vWorld = vec3(ground.x, f.x, ground.y);
  vGround = ground;
  gl_Position = uViewProj * vec4(vWorld, 1.0);
}`;
  var FRAGMENT = `#version 300 es
precision highp float;
${FIELD}
uniform vec3 uEye;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uSecond;
uniform vec3 uLightA;
uniform vec3 uLightB;
uniform float uTile;
uniform float uAngle;
uniform float uGap;
uniform float uRound;
uniform float uSoftness;
uniform float uBulge;
uniform float uGloss;
uniform vec2 uRange;
uniform float uBrightness;
uniform float uGrain;
uniform float uGrainScale;
uniform float uLightMode;
uniform float uOpacity;
uniform vec4 uReveal;
uniform vec2 uView;
uniform float uFade;
uniform float uFrame;
in vec2 vGround;
in vec3 vWorld;
out vec4 outColor;

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 f = field(vGround);
  vec3 n0 = normalize(vec3(-f.y, 1.0, -f.z));
  vec3 tx = normalize(vec3(1.0, f.y, 0.0));
  vec3 tz = normalize(cross(tx, n0));
  tx = normalize(cross(n0, tz));

  float c = cos(uAngle);
  float s = sin(uAngle);
  mat2 toTile = mat2(c, -s, s, c);
  vec2 q = toTile * vGround / uTile;
  vec2 cell = floor(q);
  vec2 local = q - cell - 0.5;
  float footprint = max(length(fwidth(q)), 1e-5);

  float on = 1.0;
  if (uReveal.w < 1.0) {
    vec2 centre = transpose(toTile) * (cell + 0.5) * uTile;
    vec2 dg;
    float d = reachOf(centre - uReveal.xy, dg);
    float delay = hash(vec3(cell, 7.0)) * 1.1;
    on = max(smoother((uReveal.z - d - delay) / 1.6), uReveal.w);
  }

  float half_ = (0.5 - uGap * 0.5) * mix(0.62, 1.0, on);
  float radius = min(uRound * half_, half_);
  vec2 dd = abs(local) - (half_ - radius);
  float d = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0) - radius;
  vec2 outward = dd.x > 0.0 || dd.y > 0.0 ? normalize(max(dd, 0.0) * sign(local)) : (dd.x > dd.y ? vec2(sign(local.x), 0.0) : vec2(0.0, sign(local.y)));

  float bevelWidth = max(mix(0.04, 0.42, uSoftness) * half_, footprint * 1.5);
  float edge = clamp((d + bevelWidth) / bevelWidth, 0.0, 1.0);
  float dome = uBulge * 0.5 * length(local) / max(half_, 1e-3);
  float theta = edge * edge * mix(0.7, 1.35, uSoftness) + dome;
  vec2 outwardGround = transpose(toTile) * outward;
  vec2 domeGround = transpose(toTile) * (local / max(length(local), 1e-4));
  vec3 bend = normalize(tx * mix(domeGround.x, outwardGround.x, edge) + tz * mix(domeGround.y, outwardGround.y, edge));
  float crowd = smoothstep(0.08, 0.3, footprint);
  theta *= 1.0 - crowd;
  vec3 n = normalize(n0 * cos(theta) + bend * sin(theta));

  float inside = 1.0 - smoothstep(-footprint * 0.75, footprint * 0.75, d);
  float area = (2.0 * half_) * (2.0 * half_) - (4.0 - 3.14159) * radius * radius;
  inside = mix(inside, area, crowd) * on;

  vec3 toEye = uEye - vWorld;
  float dist = length(toEye);
  vec3 v = toEye / dist;
  vec3 la = uLightA - vWorld;
  vec3 lb = uLightB - vWorld;
  float da = length(la);
  float db = length(lb);
  la /= da;
  lb /= db;
  float fa = 1.0 / (1.0 + da * da * 0.02);
  float fb = 1.0 / (1.0 + db * db * 0.02);

  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  vec3 ha = normalize(la + v);
  vec3 hb = normalize(lb + v);
  float shine = mix(10.0, 90.0, uGloss);
  float norm = (shine + 8.0) / 60.0;
  float specA = pow(max(dot(n, ha), 0.0), shine) * norm;
  float specB = pow(max(dot(n, hb), 0.0), shine) * norm;
  float sheenA = pow(max(dot(n, ha), 0.0), 8.0);
  float sheenB = pow(max(dot(n, hb), 0.0), 8.0);
  float diffA = max(dot(n, la), 0.0);
  float diffB = max(dot(n, lb), 0.0);
  vec3 r = reflect(-v, n);
  float rim = exp((dot(r, normalize(vec3(0.15, 0.55, -1.0))) - 1.0) * 6.0);
  float occlusion = mix(1.0, 0.35, edge * edge);
  float edgeLight = edge * edge;

  vec3 color;
  float alpha;
  if (uLightMode > 0.5) {
    float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
    vec3 body = mix(vec3(luma), uColor, 0.5) * 0.96;
    vec3 keyDir = normalize(vec3(-0.35, 0.85, 0.45));
    float shade = clamp(dot(n, keyDir) * 0.6 + 0.5, 0.0, 1.0);
    float wa = clamp(diffA * fa * 9.0, 0.0, 1.0);
    float wb = clamp(diffB * fb * 9.0, 0.0, 1.0);
    vec3 hue = (uAccent * wa + uSecond * wb) / max(wa + wb, 1e-3);
    vec3 lit = body * mix(vec3(1.0), hue, clamp(wa + wb, 0.0, 1.0) * 0.42) * mix(0.7, 1.05, shade);
    lit += vec3(1.0) * (specA * fa + specB * fb) * 2.4 * uGloss;
    lit *= mix(1.0, 0.8, edgeLight * (1.0 - crowd));
    color = lit;
    alpha = inside;
  } else {
    float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
    vec3 body = mix(vec3(luma), uColor, 0.35) + vec3(0.02);
    vec3 lit = body * 0.25;
    lit += body * (uAccent * diffA * fa + uSecond * diffB * fb) * 14.0;
    lit += uAccent * (specA * (0.55 + 1.6 * edgeLight) + sheenA * 0.3) * fa * 9.0 * uGloss;
    lit += uSecond * (specB * (0.55 + 1.6 * edgeLight) + sheenB * 0.3) * fb * 9.0 * uGloss;
    lit += mix(uSecond, vec3(1.0), 0.4) * rim * fresnel * 0.35 * uGloss;
    lit *= occlusion;
    color = lit * inside;
    alpha = inside;
  }

  float fade = 1.0 - smoother((dist - uRange.x) / max(uRange.y - uRange.x, 1e-3));
  alpha *= fade * uOpacity;
  color *= uBrightness;
  if (uLightMode < 0.5) color = 1.0 - exp(-color * 1.1);

  vec2 grainCell = floor(gl_FragCoord.xy / uGrainScale);
  float grain = hash(vec3(grainCell, uFrame)) + hash(vec3(grainCell + 17.0, uFrame + 3.0)) - 1.0;
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color += grain * uGrain * (uLightMode > 0.5 ? 0.6 : 0.25 + 0.75 * sqrt(clamp(lum, 0.0, 1.0)));
  color = clamp(color, 0.0, 1.0);

  vec2 uv = gl_FragCoord.xy / uView;
  float edgeFade = max(uFade * 0.5, 1e-4);
  float mask = uFade > 0.0 ? smoother(uv.x / edgeFade) * smoother((1.0 - uv.x) / edgeFade) * smoother(uv.y / edgeFade) * smoother((1.0 - uv.y) / edgeFade) : 1.0;
  alpha *= mask;
  outColor = vec4(color * alpha, alpha);
}`;
  var UNIFORMS = ['uRipples', 'uWave', 'uSquare', 'uClock', 'uSwell', 'uHover', 'uIntro', 'uViewProj', 'uArea', 'uEye', 'uColor', 'uAccent', 'uSecond', 'uLightA', 'uLightB', 'uTile', 'uAngle', 'uGap', 'uRound', 'uSoftness', 'uBulge', 'uGloss', 'uRange', 'uBrightness', 'uGrain', 'uGrainScale', 'uLightMode', 'uOpacity', 'uReveal', 'uView', 'uFade', 'uFrame'];
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ease(x) { var t = clamp(x, 0, 1); return 1 - (1 - t) * (1 - t) * (1 - t); }
  function glide(x) { var t = clamp(x, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function compile(gl, type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s; gl.deleteShader(s); return null; }
  function link(gl) {
    var v = compile(gl, gl.VERTEX_SHADER, VERTEX), f = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT), p = gl.createProgram(); if (!v || !f || !p) return null;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null; }
    var u = {}; for (var i = 0; i < UNIFORMS.length; i++) u[UNIFORMS[i]] = gl.getUniformLocation(p, UNIFORMS[i]); return { program: p, uniforms: u };
  }
  function perspective(fov, aspect, near, far) { var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]; }
  function lookAt(eye, target) {
    var zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2], len = Math.hypot(zx, zy, zz) || 1; zx /= len; zy /= len; zz /= len;
    var xx = zz, xz = -zx; len = Math.hypot(xx, xz) || 1; xx /= len; xz /= len;
    var yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
    return [xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0, -(xx * eye[0] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1];
  }
  function multiply(a, b) { var out = new Array(16); for (var col = 0; col < 4; col++) for (var row = 0; row < 4; row++) out[col * 4 + row] = a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3]; return out; }
  function invert(a) {
    var b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
    var b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06, k = det ? 1 / det : 0;
    return [(a[5] * b11 - a[6] * b10 + a[7] * b09) * k, (a[2] * b10 - a[1] * b11 - a[3] * b09) * k, (a[13] * b05 - a[14] * b04 + a[15] * b03) * k, (a[10] * b04 - a[9] * b05 - a[11] * b03) * k,
      (a[6] * b08 - a[4] * b11 - a[7] * b07) * k, (a[0] * b11 - a[2] * b08 + a[3] * b07) * k, (a[14] * b02 - a[12] * b05 - a[15] * b01) * k, (a[8] * b05 - a[10] * b02 + a[11] * b01) * k,
      (a[4] * b10 - a[5] * b08 + a[7] * b06) * k, (a[1] * b08 - a[0] * b10 - a[3] * b06) * k, (a[12] * b04 - a[13] * b02 + a[15] * b00) * k, (a[9] * b02 - a[8] * b04 - a[11] * b00) * k,
      (a[5] * b07 - a[4] * b09 - a[6] * b06) * k, (a[0] * b09 - a[1] * b07 + a[2] * b06) * k, (a[13] * b01 - a[12] * b03 - a[14] * b00) * k, (a[8] * b03 - a[9] * b01 + a[10] * b00) * k];
  }
  var DEF = { color: '#120f17', accentColor: '#ff4fb8', secondaryColor: '#3b6bff', tileSize: 1, gap: .12, roundness: .25, softness: .5, bulge: .3, rotation: 35, gloss: .6, waves: 1, waveScale: 1, speed: .6, shape: 'square', pulse: 1, pulseSpeed: .45, pulseSpacing: 1, pulseWidth: 1, pulseOrigin: 'center', brightness: 1, lighting: 'split', tilt: .7, zoom: 1, depth: 10, grain: .12, fade: 0, opacity: 1, intro: true, mouseInteraction: true, hoverEffect: 'press', mouseStrength: 1, mouseRadius: .35, pulseOnClick: true, detail: '', lightMode: false, paused: false, dpr: 0 };
  var STR = { color: 1, accentColor: 1, secondaryColor: 1, shape: 1, pulseOrigin: 1, lighting: 1, hoverEffect: 1, detail: 1 }, BOOL = { intro: 1, mouseInteraction: 1, pulseOnClick: 1, lightMode: 1, paused: 1 };
  function css() {
    if (document.getElementById('acid-css')) return;
    var s = document.createElement('style'); s.id = 'acid-css'; s.textContent = '.acid-squares-container{position:relative;overflow:hidden}.acid-squares-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}'; document.head.appendChild(s);
  }
  function Acid(el, opts) {
    css(); var k, self = this; this.el = el; var A = {};
    for (k in DEF) A[k] = DEF[k];
    for (k in DEF) { var v = el.dataset[k]; if (v != null) A[k] = STR[k] ? v : BOOL[k] ? (v === '' || v === 'true') : parseFloat(v); }
    if (opts) for (k in opts) if (opts[k] !== undefined) A[k] = opts[k];
    if (!A.detail) A.detail = root.innerWidth < 700 ? 'low' : 'medium';
    this.A = A; el.classList.add('acid-squares-container');
    var canvas = document.createElement('canvas'); canvas.className = 'acid-squares-canvas'; canvas.setAttribute('aria-hidden', 'true'); el.appendChild(canvas); this.canvas = canvas;
    var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, stencil: false }), surface = gl && link(gl);
    if (!gl || !surface) { canvas.remove(); el.style.background = 'radial-gradient(ellipse at 30% 20%,' + A.accentColor + '33,transparent 55%),radial-gradient(ellipse at 75% 70%,' + A.secondaryColor + '33,transparent 55%),' + A.color; return; }
    this.gl = gl; this.surface = surface; this.vao = gl.createVertexArray(); this.gridBuffer = gl.createBuffer(); this.indexBuffer = gl.createBuffer(); this.meshSize = 0; this.indexCount = 0;
    this.probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    this.reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.st = { clock: 0, swell: 0, lights: 0, frame: 0, nextRipple: 1.2, ripples: [], intro: A.intro && !this.reduce ? 0 : INTRO_SECONDS, width: 1, height: 1, colorKey: '', color: [.07, .06, .09], accent: [1, .31, .72], second: [.23, .42, 1], pointer: { x: 0, y: 0, inside: false }, hover: { x: 0, z: 0, vx: 0, vz: 0, presence: 0, placed: false }, look: { x: 0, y: 0, vx: 0, vy: 0 }, seed: 1, camera: null };
    this.raf = 0; this.last = 0; this.visible = true; this.alive = true; this.rd = new Float32Array(MAX_RIPPLES * 4);
    this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(el);
    this.io = new IntersectionObserver(function (e) { self.visible = e.some(function (x) { return x.isIntersecting; }); if (self.visible) { self.last = 0; self.wake(); } }); this.io.observe(el);
    this.onMove = function (e) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, p = self.st.pointer; p.x = x; p.y = y; p.inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height; self.wake(); };
    this.onDown = function (e) {
      var a = self.A; if (!a.mouseInteraction || !a.pulseOnClick || e.button !== 0 || self.reduce) return;
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, label, [role="button"]')) return;
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      var sp = self.ground(x, y); if (sp) self.spawn(sp.x, sp.z, 1.15); self.wake();
    };
    this.onLeave = function () { self.st.pointer.inside = false; self.wake(); }; this.onVis = function () { self.last = 0; self.wake(); };
    root.addEventListener('pointermove', this.onMove, { passive: true }); root.addEventListener('pointerdown', this.onDown); document.documentElement.addEventListener('pointerleave', this.onLeave); document.addEventListener('visibilitychange', this.onVis);
    this.resize(); this.wake();
  }
  Acid.prototype.opt = function () {
    var A = this.A; return { tileSize: clamp(A.tileSize, .2, 5), gap: clamp(A.gap, 0, .6), roundness: clamp(A.roundness, 0, 1), softness: clamp(A.softness, 0, 1), bulge: clamp(A.bulge, 0, 1.5), rotation: A.rotation * DEG, gloss: clamp(A.gloss, 0, 1), waves: Math.max(0, A.waves), waveScale: clamp(A.waveScale, .1, 5), speed: Math.max(0, A.speed), square: A.shape === 'round' ? 0 : 1,
      pulse: Math.max(0, A.pulse), pulseSpeed: Math.max(0, A.pulseSpeed), pulseSpacing: clamp(A.pulseSpacing, .2, 6), pulseWidth: clamp(A.pulseWidth, .1, 5), randomOrigin: A.pulseOrigin === 'random', brightness: Math.max(0, A.brightness), lights: LIGHTING[A.lighting] || LIGHTING.split, tilt: clamp(A.tilt, 0, 1), zoom: clamp(A.zoom, .3, 4), depth: clamp(A.depth, 2, 40),
      grain: Math.max(0, A.grain), fade: clamp(A.fade, 0, 1), opacity: clamp(A.opacity, 0, 1), hover: HOVER_EFFECTS[A.hoverEffect] != null ? HOVER_EFFECTS[A.hoverEffect] : 1, mouseStrength: Math.max(0, A.mouseStrength), mouseRadius: clamp(A.mouseRadius, .02, 2), mesh: MESH[A.detail] || MESH.medium, lightMode: A.lightMode };
  };
  Acid.prototype.buildMesh = function (size) {
    if (size === this.meshSize) return; var gl = this.gl; this.meshSize = size; var pts = new Float32Array((size + 1) * (size + 1) * 2), o = 0, i, j;
    for (j = 0; j <= size; j++) for (i = 0; i <= size; i++) { pts[o] = i / size; pts[o + 1] = j / size; o += 2; }
    var idx = new Uint32Array(size * size * 6); o = 0;
    for (j = 0; j < size; j++) for (i = 0; i < size; i++) { var a = j * (size + 1) + i, b = a + 1, c = a + size + 1, d = c + 1; idx[o] = a; idx[o + 1] = c; idx[o + 2] = b; idx[o + 3] = b; idx[o + 4] = c; idx[o + 5] = d; o += 6; }
    this.indexCount = idx.length; gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer); gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); gl.bindVertexArray(null);
  };
  Acid.prototype.toRgb = function (value, fb) {
    var p = this.probe; if (!p || !value) return fb; var c = /^[0-9a-f]{3,8}$/i.test(value) ? '#' + value : value; p.clearRect(0, 0, 1, 1); p.fillStyle = '#000000'; p.fillStyle = c; p.fillRect(0, 0, 1, 1); var d = p.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255];
  };
  Acid.prototype.cameraFor = function (s) {
    var st = this.st, aspect = st.width / Math.max(st.height, 1), distance = 8 / s.zoom, yaw = st.look.x * .16, pitch = 1.5 - s.tilt * 1.26 + st.look.y * .05, target = [ORIGIN[0], 0, ORIGIN[1]];
    var eye = [target[0] + Math.sin(yaw) * Math.cos(pitch) * distance, target[1] + Math.sin(pitch) * distance, target[2] + Math.cos(yaw) * Math.cos(pitch) * distance];
    var vp = multiply(perspective(.8, aspect, .1, 400), lookAt(eye, target)); return { eye: eye, target: target, viewProj: vp, inverse: invert(vp), distance: distance };
  };
  Acid.prototype.render = function () {
    var gl = this.gl, canvas = this.canvas, st = this.st, s = this.opt(), A = this.A; this.buildMesh(s.mesh);
    var key = A.color + '|' + A.accentColor + '|' + A.secondaryColor; if (key !== st.colorKey) { st.colorKey = key; st.color = this.toRgb(A.color, [.07, .06, .09]); st.accent = this.toRgb(A.accentColor, [1, .31, .72]); st.second = this.toRgb(A.secondaryColor, [.23, .42, 1]); }
    var camera = this.cameraFor(s); st.camera = camera;
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.useProgram(this.surface.program);
    var u = this.surface.uniforms, rd = this.rd; rd.fill(0); st.ripples.forEach(function (r, i) { rd[i * 4] = r.x; rd[i * 4 + 1] = r.z; rd[i * 4 + 2] = r.start; rd[i * 4 + 3] = r.strength; });
    var age = st.intro, revealing = age < INTRO_SECONDS, rr = glide(age / REVEAL_SECONDS) * REVEAL_REACH, settle = ease(age / INTRO_SECONDS);
    gl.uniform4fv(u.uRipples, rd); gl.uniform4f(u.uWave, .55 * s.pulse, 3 * Math.max(s.pulseSpeed, .05) + 1.2, 1.6 * s.pulseWidth, 46); gl.uniform1f(u.uSquare, s.square); gl.uniform1f(u.uClock, st.clock);
    gl.uniform4f(u.uSwell, 1.3 * s.waves * (.25 + .75 * settle), 1.9 / s.waveScale, 0, st.swell);
    gl.uniform4f(u.uHover, st.hover.x, st.hover.z, 3 * s.mouseRadius / .35, .7 * st.hover.presence * s.mouseStrength * s.hover);
    gl.uniform4f(u.uIntro, ORIGIN[0], ORIGIN[1], rr, revealing ? .9 * (1 - smoothstep(.55, 1, age / INTRO_SECONDS)) : 0);
    gl.uniformMatrix4fv(u.uViewProj, false, camera.viewProj); gl.uniform4f(u.uArea, AREA[0] + ORIGIN[0], AREA[1] + ORIGIN[1], AREA[2], AREA[3]); gl.uniform3f(u.uEye, camera.eye[0], camera.eye[1], camera.eye[2]);
    gl.uniform3f(u.uColor, st.color[0], st.color[1], st.color[2]); gl.uniform3f(u.uAccent, st.accent[0], st.accent[1], st.accent[2]); gl.uniform3f(u.uSecond, st.second[0], st.second[1], st.second[2]);
    var orbit = st.lights, reach = camera.distance / 8, ll = .35 + .65 * settle, f1 = s.lights[0], f2 = s.lights[1];
    gl.uniform3f(u.uLightA, camera.target[0] + (f1[0] + Math.sin(orbit * .7) * f1[3]) * reach, f1[1] * reach * ll + .6, camera.target[2] + (f1[2] + Math.cos(orbit * .5) * f1[4]) * reach);
    gl.uniform3f(u.uLightB, camera.target[0] + (f2[0] + Math.cos(orbit * .6) * f2[3]) * reach, f2[1] * reach * ll + .6, camera.target[2] + (f2[2] + Math.sin(orbit * .45) * f2[4]) * reach);
    gl.uniform1f(u.uTile, 1.2 * s.tileSize); gl.uniform1f(u.uAngle, s.rotation); gl.uniform1f(u.uGap, s.gap); gl.uniform1f(u.uRound, s.roundness); gl.uniform1f(u.uSoftness, s.softness); gl.uniform1f(u.uBulge, s.bulge); gl.uniform1f(u.uGloss, s.gloss);
    var far = Math.min(s.depth * 3.2 * reach, AREA[3] * .62); gl.uniform2f(u.uRange, far * .5, far); gl.uniform1f(u.uBrightness, s.brightness);
    var pr = canvas.height / Math.max(st.height, 1); gl.uniform1f(u.uGrain, s.grain); gl.uniform1f(u.uGrainScale, Math.max(1, pr)); gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0); gl.uniform1f(u.uOpacity, s.opacity);
    gl.uniform4f(u.uReveal, ORIGIN[0], ORIGIN[1], rr, revealing ? 0 : 1); gl.uniform2f(u.uView, canvas.width, canvas.height); gl.uniform1f(u.uFade, s.fade); gl.uniform1f(u.uFrame, st.frame % 977);
    gl.bindVertexArray(this.vao); gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0); gl.bindVertexArray(null); gl.disable(gl.DEPTH_TEST);
  };
  Acid.prototype.resize = function () {
    var A = this.A, el = this.el, c = this.canvas, st = this.st, w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight), base = Math.min(A.dpr || root.devicePixelRatio || 1, 2), longest = Math.max(w, h) * base, ratio = longest > MAX_RENDER_DIM ? base * MAX_RENDER_DIM / longest : base;
    var pw = Math.max(1, Math.round(w * ratio)), ph = Math.max(1, Math.round(h * ratio)); if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; } st.width = w; st.height = h; this.render();
  };
  Acid.prototype.ground = function (px, py) {
    var st = this.st, cam = st.camera; if (!cam) return null; var nx = px / st.width * 2 - 1, ny = 1 - py / st.height * 2, m = cam.inverse;
    var fx = m[0] * nx + m[4] * ny + m[8] + m[12], fy = m[1] * nx + m[5] * ny + m[9] + m[13], fz = m[2] * nx + m[6] * ny + m[10] + m[14], fw = m[3] * nx + m[7] * ny + m[11] + m[15];
    var dx = fx / fw - cam.eye[0], dy = fy / fw - cam.eye[1], dz = fz / fw - cam.eye[2]; if (dy >= -1e-4) return null; var t = -cam.eye[1] / dy; return { x: cam.eye[0] + dx * t, z: cam.eye[2] + dz * t };
  };
  Acid.prototype.spawn = function (x, z, strength) { var st = this.st; st.ripples.push({ x: x, z: z, start: st.clock, strength: strength }); while (st.ripples.length > MAX_RIPPLES) st.ripples.shift(); };
  Acid.prototype.random = function () { var st = this.st; st.seed = st.seed * 16807 % 2147483647; return (st.seed - 1) / 2147483646; };
  Acid.prototype.frame = function (now) {
    var self = this, st = this.st, A = this.A, s = this.opt(), reduce = this.reduce; this.raf = 0; if (!this.alive || !this.visible || document.hidden) return;
    var dt = this.last ? Math.min(.05, (now - this.last) / 1000) : 1 / 60; this.last = now; var moving = !A.paused && !reduce;
    if (moving) {
      st.frame++; st.clock += dt; st.intro += dt; st.swell += dt * s.speed; st.lights += dt * s.speed * .6;
      var travel = 3 * Math.max(s.pulseSpeed, .05) + 1.2, interval = 10 * s.pulseSpacing / travel;
      if (s.pulse > 0 && st.clock >= st.nextRipple) {
        if (s.randomOrigin) { var sp = this.ground((.15 + this.random() * .7) * st.width, (.25 + this.random() * .6) * st.height); if (sp) this.spawn(sp.x, sp.z, 1); } else this.spawn(ORIGIN[0], ORIGIN[1], 1);
        st.nextRipple = st.clock + interval * (s.randomOrigin ? .6 : 1);
      }
      var life = 46 / travel + 1; st.ripples = st.ripples.filter(function (r) { return st.clock - r.start < life; });
    } else if (st.intro < INTRO_SECONDS) st.intro = INTRO_SECONDS;
    var ptr = st.pointer, hv = st.hover, look = st.look, active = A.mouseInteraction && ptr.inside && !reduce, spot = active && s.hover !== 0 ? this.ground(ptr.x, ptr.y) : null;
    if (spot) { if (!hv.placed) { hv.x = spot.x; hv.z = spot.z; hv.vx = 0; hv.vz = 0; hv.placed = true; } hv.vx += (90 * (spot.x - hv.x) - 19 * hv.vx) * dt; hv.vz += (90 * (spot.z - hv.z) - 19 * hv.vz) * dt; hv.x += hv.vx * dt; hv.z += hv.vz * dt; }
    var goal = spot ? 1 : 0; hv.presence += (goal - hv.presence) * (1 - Math.exp(-dt / (goal > hv.presence ? .35 : .6))); if (!spot && hv.presence < .001) hv.placed = false;
    var lx = active ? (ptr.x / st.width - .5) * .5 : 0, ly = active ? (.5 - ptr.y / st.height) * .5 : 0;
    look.vx += (30 * (lx - look.x) - 11 * look.vx) * dt; look.vy += (30 * (ly - look.y) - 11 * look.vy) * dt; look.x += look.vx * dt; look.y += look.vy * dt;
    this.render();
    var settling = Math.abs(goal - hv.presence) > .002 || Math.hypot(hv.vx, hv.vz) > .01 || Math.abs(lx - look.x) > .0002 || Math.abs(ly - look.y) > .0002;
    if (moving || settling) this.raf = requestAnimationFrame(function (t) { self.frame(t); }); else this.last = 0;
  };
  Acid.prototype.wake = function () { var self = this; if (!this.raf && this.alive && this.visible && !document.hidden && this.gl) this.raf = requestAnimationFrame(function (t) { self.frame(t); }); };
  Acid.prototype.update = function (n) { for (var k in n) this.A[k] = n[k]; if (this.gl) { this.resize(); this.wake(); } };
  Acid.prototype.destroy = function () {
    this.alive = false; cancelAnimationFrame(this.raf); if (this.ro) { this.ro.disconnect(); this.io.disconnect(); root.removeEventListener('pointermove', this.onMove); root.removeEventListener('pointerdown', this.onDown); document.documentElement.removeEventListener('pointerleave', this.onLeave); document.removeEventListener('visibilitychange', this.onVis); }
    this.canvas.remove(); this.el._acid = null;
  };
  root.HeluAcid = { create: function (el, o) { return el._acid || (el._acid = new Acid(el, o)); }, init: function (s) { var l = (s || document).querySelectorAll('[data-acid-squares]'); for (var i = 0; i < l.length; i++) root.HeluAcid.create(l[i]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { root.HeluAcid.init(); }); else root.HeluAcid.init();
})(window);
