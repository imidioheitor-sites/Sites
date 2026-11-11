/*! GlassSurface — porte literal do componente do artefato "Quinze Modelos React Bits" (modelo 01, Liquid Glass)
 *  para JS puro, sem React. O CSS, o filtro SVG, os shaders WebGL2 e o pipeline de forma (EDT + mapa de
 *  deslocamento + máscaras de linha e brilho) são os mesmos do artefato, só traduzidos de JSX/hooks para DOM.
 *
 *  Uso:  <div data-glass data-border-radius="999" data-blur="11">conteúdo</div>
 *        GlassSurface.create(el, { borderRadius: 999, shape: 'img/logo.svg', backdrop: '#foto', refraction: true })
 *
 *  Props (mesmos nomes e padrões do artefato): width, height, borderRadius=20, borderWidth=0.07, brightness=50,
 *  opacity=0.93, blur=11, displace=0, backgroundOpacity=0, saturation=1, distortionScale=-180, redOffset=0,
 *  greenOffset=10, blueOffset=20, xChannel='R', yChannel='G', mixBlendMode='difference', refraction=true,
 *  renderer='auto'|'webgl'|'svg'|'fallback', backdrop (seletor/elemento img|video|canvas), shape (URL de imagem).
 */
(function (root) {
'use strict';

var INF = 1e20;

var VERT = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

var FRAG = `#version 300 es
precision highp float;
uniform sampler2D uBackdrop;
uniform sampler2D uMap;
uniform vec2 uCanvas;
uniform vec2 uSize;
uniform vec2 uOrigin;
uniform vec2 uStep;
uniform vec3 uScale;
uniform ivec2 uChannel;
uniform float uSpread;
uniform float uLod;
uniform float uSaturation;
out vec4 outColor;

vec4 bend(vec2 p) {
  vec4 map = texture(uMap, clamp(p / uSize, 0.0, 1.0));
  vec2 shift = vec2(map[uChannel.x], map[uChannel.y]) - 0.5;
  vec2 base = uOrigin + p * uStep;
  vec4 red = textureLod(uBackdrop, base + shift * uScale.r * uStep, uLod);
  vec4 green = textureLod(uBackdrop, base + shift * uScale.g * uStep, uLod);
  vec4 blue = textureLod(uBackdrop, base + shift * uScale.b * uStep, uLod);
  return vec4(red.r, green.g, blue.b, (red.a + green.a + blue.a) / 3.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uCanvas * uSize;
  vec4 color = vec4(0.0);
  if (uSpread < 0.05) {
    color = bend(p);
  } else {
    float total = 0.0;
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        vec2 offset = vec2(float(i), float(j)) * uSpread * 0.8;
        float weight = exp(-dot(offset, offset) / (2.0 * uSpread * uSpread));
        color += bend(p + offset) * weight;
        total += weight;
      }
    }
    color /= total;
  }
  vec3 rgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);
  float s = uSaturation;
  mat3 tone = mat3(
    0.213 + 0.787 * s, 0.213 - 0.213 * s, 0.213 - 0.213 * s,
    0.715 - 0.715 * s, 0.715 + 0.285 * s, 0.715 - 0.715 * s,
    0.072 - 0.072 * s, 0.072 - 0.072 * s, 0.072 + 0.928 * s
  );
  rgb = clamp(tone * rgb, 0.0, 1.0);
  outColor = vec4(rgb * color.a, color.a);
}`;

var CHANNEL = { R: 0, G: 1, B: 2, A: 3 };

var CSS = '.glass-surface{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:opacity .26s ease-out}' +
'.glass-surface__filter{width:100%;height:100%;pointer-events:none;position:absolute;top:0;right:0;bottom:0;left:0;opacity:0;z-index:-1}' +
'.glass-surface__content{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:.5rem;border-radius:inherit;position:relative;z-index:1}' +
'.glass-surface--svg{background:light-dark(hsl(0 0% 100% / var(--glass-frost, 0)),hsl(0 0% 0% / var(--glass-frost, 0)));-webkit-backdrop-filter:var(--filter-id, url(#glass-filter)) saturate(var(--glass-saturation, 1));backdrop-filter:var(--filter-id, url(#glass-filter)) saturate(var(--glass-saturation, 1));box-shadow:0 0 2px 1px light-dark(color-mix(in oklch,black,transparent 85%),color-mix(in oklch,white,transparent 65%)) inset,0 0 10px 4px light-dark(color-mix(in oklch,black,transparent 90%),color-mix(in oklch,white,transparent 85%)) inset,0 4px 16px #11111a0d,0 8px 24px #11111a0d,0 16px 56px #11111a0d,0 4px 16px #11111a0d inset,0 8px 24px #11111a0d inset,0 16px 56px #11111a0d inset}' +
'.glass-surface--webgl{box-shadow:0 4px 16px #11111a0d,0 8px 24px #11111a0d,0 16px 56px #11111a0d}' +
'.glass-surface__canvas,.glass-surface__frame{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;border-radius:inherit;pointer-events:none}' +
'.glass-surface__frame{background:light-dark(hsl(0 0% 100% / var(--glass-frost, 0)),hsl(0 0% 0% / var(--glass-frost, 0)));box-shadow:0 0 2px 1px light-dark(color-mix(in oklch,black,transparent 85%),color-mix(in oklch,white,transparent 65%)) inset,0 0 10px 4px light-dark(color-mix(in oklch,black,transparent 90%),color-mix(in oklch,white,transparent 85%)) inset,0 4px 16px #11111a0d inset,0 8px 24px #11111a0d inset,0 16px 56px #11111a0d inset}' +
'.glass-surface--fallback{background:light-dark(hsl(0 0% 100% / calc(.12 + var(--glass-frost, 0) * .5)),hsl(0 0% 100% / calc(.04 + var(--glass-frost, 0) * .3)));-webkit-backdrop-filter:blur(12px) saturate(calc(var(--glass-saturation, 1) * 1.4)) brightness(1.04);backdrop-filter:blur(12px) saturate(calc(var(--glass-saturation, 1) * 1.4)) brightness(1.04);box-shadow:inset 0 1px 0 0 light-dark(hsl(0 0% 100% / .85),hsl(0 0% 100% / .3)),inset 0 -1px 0 0 light-dark(hsl(0 0% 100% / .35),hsl(0 0% 100% / .08)),0 0 2px 1px light-dark(color-mix(in oklch,black,transparent 88%),color-mix(in oklch,white,transparent 72%)) inset,0 0 12px 3px light-dark(color-mix(in oklch,white,transparent 72%),color-mix(in oklch,white,transparent 90%)) inset,0 4px 16px #11111a0f,0 8px 24px #11111a0f,0 16px 56px #11111a0f}' +
'.glass-surface__sheen,.glass-surface__rim{position:absolute;top:0;right:0;bottom:0;left:0;border-radius:inherit;pointer-events:none}' +
'.glass-surface__sheen{background:linear-gradient(135deg,light-dark(hsl(0 0% 100% / .42),hsl(0 0% 100% / .14)) 0%,transparent 42%,transparent 64%,light-dark(hsl(0 0% 100% / .18),hsl(0 0% 100% / .05)) 100%)}' +
'.glass-surface__rim{padding:3px;background:linear-gradient(150deg,light-dark(hsl(0 0% 100% / .7),hsl(0 0% 100% / .34)),light-dark(hsl(0 0% 100% / .1),hsl(0 0% 100% / .03)) 45%,light-dark(hsl(0 0% 100% / .08),hsl(0 0% 100% / .02)) 60%,light-dark(hsl(0 0% 100% / .42),hsl(0 0% 100% / .18)));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}' +
'.glass-surface__line,.glass-surface__glow{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none;-webkit-mask-size:100% 100%;mask-size:100% 100%}' +
'.glass-surface--svg .glass-surface__line,.glass-surface--webgl .glass-surface__line{background:light-dark(color-mix(in oklch,black,transparent 85%),color-mix(in oklch,white,transparent 65%))}' +
'.glass-surface--svg .glass-surface__glow,.glass-surface--webgl .glass-surface__glow{background:light-dark(color-mix(in oklch,black,transparent 90%),color-mix(in oklch,white,transparent 85%))}' +
'.glass-surface--fallback .glass-surface__line{background:light-dark(color-mix(in oklch,black,transparent 88%),color-mix(in oklch,white,transparent 72%))}' +
'.glass-surface--fallback .glass-surface__glow{background:light-dark(color-mix(in oklch,white,transparent 72%),color-mix(in oklch,white,transparent 90%))}' +
'@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){.glass-surface--fallback{background:light-dark(hsl(0 0% 100% / .72),hsl(0 0% 12% / .72))}}' +
'.glass-surface:focus-visible{outline:2px solid light-dark(#007aff,#0a84ff);outline-offset:2px}';

function injectCss() {
  if (document.getElementById('glass-surface-artifact-css')) return;
  var st = document.createElement('style');
  st.id = 'glass-surface-artifact-css';
  st.textContent = CSS;
  document.head.appendChild(st);
}

/* ---------- WebGL2 ---------- */
function buildProgram(gl) {
  var compile = function (type, src) {
    var sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
    gl.deleteShader(sh); return null;
  };
  var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG), pr = gl.createProgram();
  if (!vs || !fs || !pr) return null;
  gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.bindAttribLocation(pr, 0, 'aPosition');
  gl.linkProgram(pr); gl.deleteShader(vs); gl.deleteShader(fs);
  if (gl.getProgramParameter(pr, gl.LINK_STATUS)) return pr;
  gl.deleteProgram(pr); return null;
}

function resolveNode(n) {
  if (typeof window === 'undefined' || !n) return null;
  var el = typeof n === 'string' ? document.querySelector(n) : n;
  return el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement ? el : null;
}

function naturalSize(n) {
  if (n instanceof HTMLImageElement) return [n.naturalWidth, n.naturalHeight];
  if (n instanceof HTMLVideoElement) return [n.videoWidth, n.videoHeight];
  return [n.width, n.height];
}

function positionPart(v, span) {
  if (!v) return span / 2;
  if (v.endsWith('%')) return parseFloat(v) / 100 * span;
  var n = parseFloat(v);
  return isFinite(n) ? n : span / 2;
}

function objectFitBox(node) {
  var r = node.getBoundingClientRect(), s = naturalSize(node), nw = s[0], nh = s[1];
  var cs = getComputedStyle(node), fit = cs.objectFit || 'fill';
  if (!nw || !nh || fit === 'fill') return { x: r.left, y: r.top, width: r.width, height: r.height };
  var contain = Math.min(r.width / nw, r.height / nh), cover = Math.max(r.width / nw, r.height / nh);
  var k = fit === 'cover' ? cover : fit === 'contain' ? contain : fit === 'none' ? 1 : Math.min(1, contain);
  var w = nw * k, h = nh * k, pos = (cs.objectPosition || '50% 50%').split(' ');
  return { x: r.left + positionPart(pos[0], r.width - w), y: r.top + positionPart(pos[1] == null ? pos[0] : pos[1], r.height - h), width: w, height: h };
}

/* ---------- distância euclidiana exata (Felzenszwalb), para o pipeline de forma ---------- */
function edt1d(f, d, v, z, n) {
  var k = 0;
  v[0] = 0; z[0] = -INF; z[1] = INF;
  for (var q = 1; q < n; q++) {
    var s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (var i = 0; i < n; i++) {
    while (z[k + 1] < i) k++;
    d[i] = (i - v[k]) * (i - v[k]) + f[v[k]];
  }
}

function edt2d(data, w, h) {
  var m = Math.max(w, h), f = new Float64Array(m), d = new Float64Array(m), v = new Int32Array(m), z = new Float64Array(m + 1), x, y;
  for (x = 0; x < w; x++) {
    for (y = 0; y < h; y++) f[y] = data[y * w + x];
    edt1d(f, d, v, z, h);
    for (y = 0; y < h; y++) data[y * w + x] = d[y];
  }
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) f[x] = data[y * w + x];
    edt1d(f, d, v, z, w);
    for (x = 0; x < w; x++) data[y * w + x] = d[x];
  }
}

function boxBlurLine(src, dst, start, stride, n, r) {
  var k = 1 / (2 * r + 1), sum = src[start] * (r + 1), i;
  for (i = 1; i <= r; i++) sum += src[start + Math.min(i, n - 1) * stride];
  for (i = 0; i < n; i++) {
    dst[start + i * stride] = sum * k;
    sum += src[start + Math.min(i + r + 1, n - 1) * stride] - src[start + Math.max(i - r, 0) * stride];
  }
}

function blur3x(data, w, h, r) {
  var tmp = new Float32Array(w * h), i;
  for (var pass = 0; pass < 3; pass++) {
    for (i = 0; i < h; i++) boxBlurLine(data, tmp, i * w, 1, w, r);
    for (i = 0; i < w; i++) boxBlurLine(tmp, data, i, w, h, r);
  }
}

function sigmoid(x) { return 1 / (1 + Math.exp(-1.702 * x)); }

function canvasDataURL(w, h, fill) {
  var cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  var ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
  fill(img.data);
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL();
}

function maskURL(depth, w, h, fn) {
  return canvasDataURL(w, h, function (px) {
    px.fill(255);
    for (var i = 0; i < w * h; i++) px[i * 4 + 3] = 255 * (1 - fn(depth[i]));
  });
}

/* a partir do alfa da imagem de forma: distância assinada, caixa, máscara de linha e de brilho */
function buildShape(img, elW, elH, ratio) {
  var nw = img.naturalWidth || elW, nh = img.naturalHeight || elH;
  var k = Math.min(elW / nw, elH / nh);
  var box = { x: (elW - nw * k) / 2, y: (elH - nh * k) / 2, width: nw * k, height: nh * k };
  var w = Math.max(2, Math.round(elW * ratio)), h = Math.max(2, Math.round(elH * ratio));
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  var ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, box.x * ratio, box.y * ratio, box.width * ratio, box.height * ratio);
  var px = ctx.getImageData(0, 0, w, h).data;
  var out = new Float32Array(w * h), inn = new Float32Array(w * h), i;
  for (i = 0; i < w * h; i++) {
    var a = 0.5 - px[i * 4 + 3] / 255;
    out[i] = a >= 0.5 ? INF : Math.pow(Math.max(a, 0), 2);
    inn[i] = a <= -0.5 ? INF : Math.pow(Math.min(a, 0), 2);
  }
  edt2d(out, w, h); edt2d(inn, w, h);
  var depth = new Float32Array(w * h);
  for (i = 0; i < w * h; i++) depth[i] = (Math.sqrt(inn[i]) - Math.sqrt(out[i])) / ratio;
  return {
    box: box, depth: depth, w: w, h: h, ratio: ratio,
    line: maskURL(depth, w, h, function (d) { return sigmoid(d - 1); }),
    glow: maskURL(depth, w, h, function (d) { return sigmoid((d - 4) / 5); })
  };
}

/* mapa de deslocamento a partir da forma (normais da distância suavizada) */
function shapeMapURL(shape, border, blur, opacity, level) {
  var depth = shape.depth, w = shape.w, h = shape.h, ratio = shape.ratio;
  var far = border + blur * 2, field = new Float32Array(w * h), i;
  for (i = 0; i < w * h; i++) field[i] = Math.min(Math.max(depth[i], -6), far);
  blur3x(field, w, h, Math.max(1, Math.round(Math.max(1.5, blur * 0.35) * ratio)));
  return canvasDataURL(w, h, function (px) {
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i2 = y * w + x;
      var gx = field[i2 + (x < w - 1 ? 1 : 0)] - field[i2 - (x > 0 ? 1 : 0)];
      var gy = field[i2 + (y < h - 1 ? w : 0)] - field[i2 - (y > 0 ? w : 0)];
      var inside = opacity * sigmoid((depth[i2] - border) / blur);
      var amp = (1 - inside) * ratio * 0.25;
      var lift = inside * (level - 0.5);
      px[i2 * 4] = 255 * (0.5 + gx * amp + lift);
      px[i2 * 4 + 1] = 255 * (0.5 + gy * amp + lift);
      px[i2 * 4 + 2] = 255 * (0.5 + lift);
      px[i2 * 4 + 3] = 255;
    }
  });
}

function supportsSvgFilter(id) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  var safari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  var firefox = /Firefox/.test(navigator.userAgent);
  if (safari || firefox) return false;
  var d = document.createElement('div');
  d.style.backdropFilter = 'url(#' + id + ')';
  return d.style.backdropFilter !== '';
}

var DEF = {
  width: 'auto', height: 'auto', borderRadius: 20, borderWidth: 0.07, brightness: 50, opacity: 0.93, blur: 11,
  displace: 0, backgroundOpacity: 0, saturation: 1, distortionScale: -180, redOffset: 0, greenOffset: 10,
  blueOffset: 20, xChannel: 'R', yChannel: 'G', mixBlendMode: 'difference', refraction: true, renderer: 'auto',
  backdrop: '', shape: ''
};

var SVG_NS = 'http://www.w3.org/2000/svg';
var uid = 0;

function Glass(el, opts) {
  injectCss();
  var o = {}, k;
  for (k in DEF) o[k] = DEF[k];
  for (k in (opts || {})) if (opts[k] !== undefined && opts[k] !== '') o[k] = opts[k];
  this.el = el; this.o = o;
  this.id = 'glass-' + (++uid) + '-' + Math.random().toString(36).slice(2, 7);
  this.rid = 'red-grad-' + this.id; this.bid = 'blue-grad-' + this.id; this.sid = 'soft-' + this.id;
  this.shapeData = null; this.mapURL = '';
  this._mount();
}

Glass.prototype._mount = function () {
  var self = this, o = this.o, el = this.el;

  var kids = document.createDocumentFragment();
  while (el.firstChild) kids.appendChild(el.firstChild);
  this.content = document.createElement('div');
  this.content.className = 'glass-surface__content';
  this.content.appendChild(kids);

  this.webgl = o.refraction && !!o.backdrop && !this.failed && (o.renderer === 'webgl' || (o.renderer === 'auto' && !supportsSvgFilter(this.id)));
  this.svgMode = !this.webgl && o.refraction && (o.renderer === 'svg' || (o.renderer === 'auto' && supportsSvgFilter(this.id)));
  if (o.renderer === 'fallback') { this.webgl = false; this.svgMode = false; }
  this.fallback = !this.webgl && !this.svgMode;

  el.classList.add('glass-surface');
  el.classList.add(this.webgl ? 'glass-surface--webgl' : this.svgMode ? 'glass-surface--svg' : 'glass-surface--fallback');

  // filtro SVG (igual ao do artefato)
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'glass-surface__filter');
  svg.innerHTML =
    '<defs><filter id="' + this.id + '" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">' +
    '<feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"></feImage>' +
    '<feDisplacementMap in="SourceGraphic" in2="map" id="redchannel" result="dispRed"></feDisplacementMap>' +
    '<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red"></feColorMatrix>' +
    '<feDisplacementMap in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen"></feDisplacementMap>' +
    '<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green"></feColorMatrix>' +
    '<feDisplacementMap in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue"></feDisplacementMap>' +
    '<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue"></feColorMatrix>' +
    '<feBlend in="red" in2="green" mode="screen" result="rg"></feBlend>' +
    '<feBlend in="rg" in2="blue" mode="screen" result="output"></feBlend>' +
    '<feGaussianBlur in="output" stdDeviation="0.7"></feGaussianBlur></filter></defs>';
  el.appendChild(svg);
  this.svg = svg;
  this.feImage = svg.querySelector('feImage');
  this.maps = svg.querySelectorAll('feDisplacementMap');
  this.feBlur = svg.querySelector('filter > feGaussianBlur');

  if (this.webgl) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'glass-surface__canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(this.canvas);
    this.frame = document.createElement('span');
    this.frame.className = 'glass-surface__frame';
    this.frame.setAttribute('aria-hidden', 'true');
    el.appendChild(this.frame);
  }
  if (this.fallback) {
    this.sheen = document.createElement('span');
    this.sheen.className = 'glass-surface__sheen';
    this.sheen.setAttribute('aria-hidden', 'true');
    el.appendChild(this.sheen);
    this.rim = document.createElement('span');
    this.rim.className = 'glass-surface__rim';
    this.rim.setAttribute('aria-hidden', 'true');
    el.appendChild(this.rim);
  }
  this.glow = document.createElement('span');
  this.glow.className = 'glass-surface__glow'; this.glow.setAttribute('aria-hidden', 'true');
  this.glow.style.display = 'none'; el.appendChild(this.glow);
  this.line = document.createElement('span');
  this.line.className = 'glass-surface__line'; this.line.setAttribute('aria-hidden', 'true');
  this.line.style.display = 'none'; el.appendChild(this.line);

  el.appendChild(this.content);

  var st = el.style;
  if (o.width !== 'auto') st.width = typeof o.width === 'number' ? o.width + 'px' : o.width;
  if (o.height !== 'auto') st.height = typeof o.height === 'number' ? o.height + 'px' : o.height;
  st.borderRadius = o.borderRadius + 'px';
  st.setProperty('--glass-frost', o.backgroundOpacity);
  st.setProperty('--glass-saturation', o.saturation);
  st.setProperty('--filter-id', 'url(#' + this.id + ')');

  this._applyScales();

  if ('ResizeObserver' in root) {
    this.ro = new ResizeObserver(function () { self._resize(); });
    this.ro.observe(el);
  }

  if (o.shape) {
    var img = new Image();
    img.crossOrigin = 'anonymous'; img.decoding = 'async';
    img.onload = function () { self.shapeImg = img; self._buildShape(); };
    img.src = o.shape;
    el.style.opacity = '0';
    el.style.transition = 'none';
  }

  this._updateMap();
  if (this.webgl) this._startWebgl();
};

Glass.prototype._applyScales = function () {
  var o = this.o, offs = [o.redOffset, o.greenOffset, o.blueOffset];
  for (var i = 0; i < this.maps.length; i++) {
    this.maps[i].setAttribute('scale', String(o.distortionScale + offs[i]));
    this.maps[i].setAttribute('xChannelSelector', o.xChannel);
    this.maps[i].setAttribute('yChannelSelector', o.yChannel);
  }
  if (this.feBlur) this.feBlur.setAttribute('stdDeviation', String(o.displace));
};

Glass.prototype._size = function () {
  return { w: this.el.offsetWidth || 400, h: this.el.offsetHeight || 200 };
};

/* mapa retangular padrão do artefato (quando não há forma) */
Glass.prototype._rectMap = function () {
  var o = this.o, s = this._size(), w = s.w, h = s.h;
  var edge = Math.min(w, h) * (o.borderWidth * 0.5);
  var svg =
    '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="' + this.rid + '" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
    '<linearGradient id="' + this.bid + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>' +
    '<filter id="' + this.sid + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="' + o.blur + '" /></filter>' +
    '</defs>' +
    '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="black"></rect>' +
    '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + o.borderRadius + '" fill="url(#' + this.rid + ')" />' +
    '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + o.borderRadius + '" fill="url(#' + this.bid + ')" style="mix-blend-mode: ' + o.mixBlendMode + '" />' +
    '<rect x="' + edge + '" y="' + edge + '" width="' + (w - edge * 2) + '" height="' + (h - edge * 2) + '" rx="' + o.borderRadius + '" fill="hsl(0 0% ' + o.brightness + '% / ' + o.opacity + ')" filter="url(#' + this.sid + ')" />' +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

Glass.prototype._updateMap = function () {
  this.feImage.setAttribute('href', this.mapURL || this._rectMap());
};

Glass.prototype._buildShape = function () {
  var o = this.o, s = this._size(), img = this.shapeImg;
  if (!img || !s.w || !s.h) return;
  var ratio = Math.min(2, root.devicePixelRatio || 1, Math.sqrt(4e5 / (s.w * s.h)));
  try {
    if (!this.shapeData || this.shapeData.width !== s.w || this.shapeData.height !== s.h || this.shapeData.ratio !== ratio) {
      var data = buildShape(img, s.w, s.h, ratio);
      data.width = s.w; data.height = s.h;
      this.shapeData = data;
    }
    this.mapURL = shapeMapURL(this.shapeData, Math.min(s.w, s.h) * o.borderWidth * 0.5, Math.max(o.blur, 0.5), o.opacity, o.brightness / 100);
  } catch (e) { this.shapeData = null; this.mapURL = ''; }
  this._updateMap();
  var el = this.el;
  if (this.shapeData) {
    var d = this.shapeData, url = 'url("' + o.shape.replace(/"/g, '%22') + '")';
    var pos = d.box.x + 'px ' + d.box.y + 'px / ' + d.box.width + 'px ' + d.box.height + 'px no-repeat';
    el.style.borderRadius = '0'; el.style.boxShadow = 'none';
    el.style.webkitMask = url + ' ' + pos; el.style.mask = url + ' ' + pos;
    if (this.frame) this.frame.style.boxShadow = 'none';
    if (this.rim) this.rim.style.display = 'none';
    this.glow.style.display = ''; this.line.style.display = '';
    this.glow.style.webkitMaskImage = 'url(' + d.glow + ')'; this.glow.style.maskImage = 'url(' + d.glow + ')';
    this.line.style.webkitMaskImage = 'url(' + d.line + ')'; this.line.style.maskImage = 'url(' + d.line + ')';
  }
  el.style.transition = 'opacity .26s ease-out';
  el.style.opacity = '1';
};

Glass.prototype._resize = function () {
  if (this.o.shape) this._buildShape(); else this._updateMap();
};

/* ---------- renderer WebGL2 (shader do artefato) ---------- */
Glass.prototype._startWebgl = function () {
  var self = this, el = this.el, cv = this.canvas;
  var gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  var prog = gl ? buildProgram(gl) : null;
  if (!gl || !prog) { this.failed = true; return; }
  var U = {};
  ['uBackdrop', 'uMap', 'uCanvas', 'uSize', 'uOrigin', 'uStep', 'uScale', 'uChannel', 'uSpread', 'uLod', 'uSaturation']
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  var vao = gl.createVertexArray(), buf = gl.createBuffer();
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  var mk = function () {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  };
  var texBack = mk(), texMap = mk();
  var buffer = document.createElement('canvas'), bctx = buffer.getContext('2d');
  var back = { node: null, key: '', width: 0, height: 0, mipmapped: false, ready: false };
  var map = { url: '', ready: false };
  var raf = 0, visible = true, last = '';

  function loadMap(url) {
    map.url = url;
    var img = new Image();
    img.onload = function () {
      if (map.url !== url || !bctx) return;
      var dpr = Math.min(2, root.devicePixelRatio || 1);
      buffer.width = Math.max(1, Math.round(el.offsetWidth * dpr));
      buffer.height = Math.max(1, Math.round(el.offsetHeight * dpr));
      bctx.clearRect(0, 0, buffer.width, buffer.height);
      bctx.drawImage(img, 0, 0, buffer.width, buffer.height);
      gl.bindTexture(gl.TEXTURE_2D, texMap);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
      map.ready = true; last = '';
    };
    img.src = url;
  }
  function upload(node) {
    var isImg = node instanceof HTMLImageElement, s;
    gl.bindTexture(gl.TEXTURE_2D, texBack);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, node);
    if (isImg) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, isImg ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    s = naturalSize(node); back.width = s[0]; back.height = s[1];
    back.mipmapped = isImg; back.ready = true;
  }
  function frame() {
    raf = 0;
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    var o = self.o;
    var currentMap = self.feImage.getAttribute('href') || '';
    if (currentMap && currentMap !== map.url) loadMap(currentMap);
    var node = resolveNode(o.backdrop);
    if (!node) return;
    var key = '';
    if (node instanceof HTMLImageElement) key = node.complete && node.naturalWidth ? (node.currentSrc || node.src) : '';
    else if (node instanceof HTMLVideoElement) key = node.readyState >= 2 ? node.currentSrc + '|' + node.currentTime : '';
    else key = node.width + 'x' + node.height + '|' + performance.now();
    if (key && (node !== back.node || key !== back.key)) {
      try { upload(node); } catch (e) { self.failed = true; return; }
      back.node = node; back.key = key; last = '';
    }
    if (!back.ready || !map.ready) return;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var r = el.getBoundingClientRect(), box = objectFitBox(node);
    if (!box.width || !box.height) return;
    var dpr = Math.min(2, root.devicePixelRatio || 1);
    var cw = Math.max(1, Math.round(w * dpr)), ch = Math.max(1, Math.round(h * dpr));
    var sig = [r.left, r.top, r.width, r.height, box.x, box.y, box.width, box.height, cw, ch, back.key, map.url,
      o.displace, o.saturation, o.distortionScale, o.redOffset, o.greenOffset, o.blueOffset, o.xChannel, o.yChannel].join('|');
    if (sig === last) return;
    last = sig;
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    var sx = r.width / w, sy = r.height / h;
    var texel = back.width / box.width * (sx / dpr);
    var spread = back.width / box.width * sx * Math.max(0, o.displace);
    var lod = back.mipmapped ? Math.max(0, Math.log2(Math.max(texel, spread * 0.5, 1e-6))) : 0;
    gl.viewport(0, 0, cw, ch); gl.useProgram(prog); gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texBack); gl.uniform1i(U.uBackdrop, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texMap); gl.uniform1i(U.uMap, 1);
    gl.uniform2f(U.uCanvas, cw, ch);
    gl.uniform2f(U.uSize, w, h);
    gl.uniform2f(U.uOrigin, (r.left - box.x) / box.width, (r.top - box.y) / box.height);
    gl.uniform2f(U.uStep, sx / box.width, sy / box.height);
    gl.uniform3f(U.uScale, o.distortionScale + o.redOffset, o.distortionScale + o.greenOffset, o.distortionScale + o.blueOffset);
    gl.uniform2i(U.uChannel, CHANNEL[o.xChannel] == null ? 0 : CHANNEL[o.xChannel], CHANNEL[o.yChannel] == null ? 1 : CHANNEL[o.yChannel]);
    gl.uniform1f(U.uSpread, Math.max(0, o.displace));
    gl.uniform1f(U.uLod, lod);
    gl.uniform1f(U.uSaturation, o.saturation);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
  var io = new IntersectionObserver(function (es) { visible = es.some(function (e) { return e.isIntersecting; }); wake(); });
  io.observe(el);
  document.addEventListener('visibilitychange', wake);
  cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); self.failed = true; });
  wake();
  this._stopGl = function () {
    cancelAnimationFrame(raf); io.disconnect();
    document.removeEventListener('visibilitychange', wake);
    gl.deleteTexture(texBack); gl.deleteTexture(texMap); gl.deleteBuffer(buf);
    gl.deleteVertexArray(vao); gl.deleteProgram(prog);
  };
};

Glass.prototype.destroy = function () {
  if (this.ro) this.ro.disconnect();
  if (this._stopGl) this._stopGl();
};

/* ---------- API ---------- */
function camel(s) { return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }); }
function readAttrs(el) {
  var o = {}, i, a, n, v;
  for (i = 0; i < el.attributes.length; i++) {
    a = el.attributes[i];
    if (a.name.indexOf('data-') !== 0 || a.name === 'data-glass') continue;
    n = camel(a.name.slice(5));
    if (!(n in DEF)) continue;
    v = a.value;
    if (v === 'true' || v === 'false') o[n] = v === 'true';
    else if (v !== '' && !isNaN(parseFloat(v)) && isFinite(v)) o[n] = parseFloat(v);
    else o[n] = v;
  }
  return o;
}

var GlassSurface = {
  create: function (el, opts) {
    if (!el) return null;
    if (el._glass) return el._glass;
    var o = readAttrs(el), k;
    for (k in (opts || {})) o[k] = opts[k];
    el._glass = new Glass(el, o);
    return el._glass;
  },
  init: function (scope) {
    var list = (scope || document).querySelectorAll('[data-glass]');
    for (var i = 0; i < list.length; i++) GlassSurface.create(list[i]);
  }
};
root.GlassSurface = GlassSurface;
root.HeluGlass = GlassSurface; // mesma API usada antes no site
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { GlassSurface.init(); });
else GlassSurface.init();
})(window);
