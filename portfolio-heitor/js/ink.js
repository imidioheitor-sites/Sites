/* Ink viewer: renderizador 3D em tinta nanquim (três passes: papel, quinas, contorno Sobel).
   Baseado no ink-model-viewer do kit HEsites (factory/coder/kit-efeitos/ink-viewer), reescrito como classe reutilizável,
   com modo "cor" (gradiente laranja → vermelho → azul-marinho) usado depois da ignição. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/libs/meshopt_decoder.module.js';

const VERT_COMMON = `
  #include <common>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>`;
const VERT_BODY = `
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>`;

/* ---------- modelos procedurais (caça e foguete) ---------- */
function lathe(pts, seg = 48) { return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); }
function extrudeShape(points, depth) {
  const s = new THREE.Shape(); points.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g;
}
function buildJet() {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial();
  // fuselagem: raio (x) por posição (y) — depois deitada sobre o eixo X
  const fus = new THREE.Mesh(lathe([[0, 3.6], [0.05, 3.5], [0.16, 3.1], [0.3, 2.5], [0.42, 1.6], [0.5, 0.4], [0.52, -0.8], [0.46, -1.9], [0.36, -2.6], [0.0, -2.75]]), m);
  fus.rotation.z = -Math.PI / 2; fus.scale.set(1, 1, 0.82); g.add(fus);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), m); canopy.scale.set(2.0, 0.62, 0.7); canopy.position.set(1.45, 0.4, 0); g.add(canopy);
  const wing = extrudeShape([[1.0, 0], [-1.6, 0], [-2.1, 2.7], [-1.15, 2.7]], 0.05); wing.rotateX(Math.PI / 2);
  const wr = new THREE.Mesh(wing, m); wr.position.set(0.15, -0.08, 0); g.add(wr);
  const wl = wr.clone(); wl.scale.z = -1; g.add(wl);
  const tail = extrudeShape([[0, 0], [-1.0, 0], [-1.2, 1.1], [-0.6, 1.1]], 0.05);
  [-1, 1].forEach(s => { const t = new THREE.Mesh(tail, m); t.position.set(-1.8, 0.45, 0.42 * s); t.rotation.x = 0.28 * s; g.add(t); });
  const stab = extrudeShape([[0.4, 0], [-0.7, 0], [-1.0, 1.1], [-0.55, 1.1]], 0.04); stab.rotateX(Math.PI / 2);
  const sr = new THREE.Mesh(stab, m); sr.position.set(-2.1, 0, 0); g.add(sr); const sl = sr.clone(); sl.scale.z = -1; g.add(sl);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.7, 24, 1, true), m); e.rotation.z = Math.PI / 2; e.position.set(-2.8, 0, 0.26 * s); g.add(e); });
  const intake = [-1, 1].map(s => { const i = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.3), m); i.position.set(0.55, -0.15, 0.55 * s); return i; }); intake.forEach(i => g.add(i));
  return g;
}
function buildRocket() {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial();
  const pts = [[0, 4.2], [0.08, 4.05], [0.2, 3.7], [0.34, 3.2], [0.44, 2.6], [0.5, 2.0], [0.52, 1.2], [0.52, -1.9], [0.44, -2.1], [0.4, -2.4], [0.3, -2.7], [0.0, -2.7]];
  g.add(new THREE.Mesh(lathe(pts), m));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.535, 0.535, 0.12, 48, 1, true), m); band.position.y = 1.0; g.add(band);
  const win = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 12, 32), m); win.position.set(0, 1.9, 0.5); g.add(win);
  const fin = extrudeShape([[0, 0], [0.9, -0.5], [0.9, -1.6], [0, -1.7]], 0.05);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(fin, m); f.position.x = 0.5; const pv = new THREE.Group(); pv.add(f); pv.rotation.y = i * Math.PI / 2; pv.position.y = -0.2; g.add(pv); }
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.5, 32, 1, true), m); noz.position.y = -2.95; g.add(noz);
  return g;
}

export class Ink {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = Object.assign({ paper: '#ecebe7', ink: '#111111', lineWidth: 1, crease: 30, parallax: 0.03, pixelRatio: 2 }, opts);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.opts.pixelRatio));
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.models = {}; this.cur = null; this.edges = []; this.wires = [];
    this.active = true; this.drag = null; this.spin = 0; this.userAz = 0; this.userEl = 0; this.zoom = 1;
    this.ptr = new THREE.Vector2(); this.ptrS = new THREE.Vector2();
    // pose desejada e suavizada
    this.pose = { az: -35, el: 14, dist: 1.2, sx: 0, sy: 0, field: 0, wire: 0, explode: 0 };
    this.cam = { az: -35, el: 14, dist: 1.2, sx: 0, sy: 0, field: 0, wire: 0, explode: 0 };
    this.U = {
      uPaper: { value: new THREE.Color(this.opts.paper) }, uInk: { value: new THREE.Color(this.opts.ink) },
      uField: { value: 0 }, uWire: { value: 0 }, uTime: { value: 0 },
      uBMin: { value: new THREE.Vector3(-1, -1, -1) }, uBMax: { value: new THREE.Vector3(1, 1, 1) }, uAxis: { value: new THREE.Vector3(0, 1, 0) },
      uFar: { value: 100 }, uC1: { value: new THREE.Color('#0b1b4d') }, uC2: { value: new THREE.Color('#e11d2e') }, uC3: { value: new THREE.Color('#ff7a2b') }
    };
    this._mats();
    this.clock = new THREE.Clock();
    this.rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    this._ink();
    this.resize = this.resize.bind(this);
    if (window.ResizeObserver) { this.ro = new ResizeObserver(this.resize); this.ro.observe(canvas.parentElement || canvas); }
    addEventListener('resize', this.resize);
    addEventListener('pointermove', e => { this.ptr.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); });
    this.resize();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }
  _mats() {
    const U = this.U;
    this.surfaceMat = new THREE.ShaderMaterial({
      uniforms: U, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide,
      vertexShader: `${VERT_COMMON}
        varying vec3 vW; varying vec3 vN;
        void main(){ ${VERT_BODY}
          vec4 wp = vec4(transformed,1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          vW = (modelMatrix * wp).xyz; vN = normalize(transformedNormal); }`,
      fragmentShader: `
        uniform vec3 uPaper; uniform vec3 uInk; uniform float uField; uniform float uTime;
        uniform vec3 uBMin; uniform vec3 uBMax; uniform vec3 uAxis; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
        varying vec3 vW; varying vec3 vN;
        void main(){
          vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
          vec3 p=(vW-uBMin)/max(uBMax-uBMin,vec3(1e-4));
          float t=dot(p,normalize(uAxis))/max(dot(abs(normalize(uAxis)),vec3(1.)),1e-3);
          t += 0.07*sin(p.x*8.+uTime*1.1)*sin(p.y*6.-uTime*.8);
          t = clamp(t,0.,1.);
          vec3 col = mix(uC1,uC2,smoothstep(0.0,0.55,t)); col = mix(col,uC3,smoothstep(0.45,1.0,t));
          float ndl = clamp(dot(n, normalize(vec3(-0.45,0.75,0.6)))*.5+.5, 0., 1.);
          float rim = pow(1.-abs(n.z),2.2);
          vec3 field = col*(0.55+0.55*ndl) + vec3(1.,.82,.6)*rim*0.28;
          // tinta: papel com leve sombra e hachura nas áreas escuras
          float hatch = step(0.5, fract((gl_FragCoord.x - gl_FragCoord.y)*0.22));
          float dark = smoothstep(0.42,0.12,ndl);
          vec3 inkc = uPaper*(0.93+0.07*ndl) - uPaper*0.0;
          inkc = mix(inkc, mix(inkc, uInk, 0.55), hatch*dark);
          gl_FragColor = vec4(mix(inkc, field, uField), 1.0);
        }`
    });
    this.normalMat = new THREE.ShaderMaterial({
      uniforms: U, side: THREE.FrontSide,
      vertexShader: `${VERT_COMMON}
        varying vec3 vN; varying float vZ;
        void main(){ ${VERT_BODY} vN = normalize(transformedNormal); vZ = -mvPosition.z; }`,
      fragmentShader: `uniform float uFar; varying vec3 vN; varying float vZ;
        void main(){ vec3 n=normalize(vN); gl_FragColor=vec4(n*0.5+0.5, vZ/uFar); }`
    });
    this.edgeMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.6 });
    this.wireMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0, depthWrite: false });
  }
  _ink() {
    const U = this.U;
    this.inkQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: { tN: { value: this.rt.texture }, uRes: { value: new THREE.Vector2() }, uW: { value: 1 }, uInk: U.uInk, uField: U.uField },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        uniform sampler2D tN; uniform vec2 uRes; uniform float uW; uniform vec3 uInk; uniform float uField; varying vec2 vUv;
        vec4 S(vec2 o){ return texture2D(tN, vUv + o*uW/uRes); }
        void main(){
          vec4 c=S(vec2(0)); vec4 l=S(vec2(-1,0)), r=S(vec2(1,0)), u=S(vec2(0,1)), d=S(vec2(0,-1));
          vec4 lu=S(vec2(-1,1)), ru=S(vec2(1,1)), ld=S(vec2(-1,-1)), rd=S(vec2(1,-1));
          float z=max(c.a,1e-4);
          float dz = abs(2.*c.a - l.a - r.a) + abs(2.*c.a - u.a - d.a) + 0.5*(abs(2.*c.a - lu.a - rd.a) + abs(2.*c.a - ru.a - ld.a));
          float nz=abs(normalize(c.rgb*2.-1.).z);
          float lo=mix(0.0060,0.0022,smoothstep(0.06,0.40,nz));
          float de=smoothstep(lo,lo*3.4,dz/z);
          vec3 nx=(ru.rgb+2.*r.rgb+rd.rgb)-(lu.rgb+2.*l.rgb+ld.rgb);
          vec3 ny=(lu.rgb+2.*u.rgb+ru.rgb)-(ld.rgb+2.*d.rgb+rd.rgb);
          float ng=sqrt(dot(nx,nx)+dot(ny,ny));
          float ne=smoothstep(0.70,1.25,ng)*0.85 + smoothstep(0.40,0.70,ng)*0.10;
          float a=clamp(max(de,ne),0.,1.); a=min(a,0.92); a*=mix(1.0,0.7,uField);
          gl_FragColor=vec4(uInk,a);
        }`
    }));
    this.inkScene = new THREE.Scene(); this.inkScene.add(this.inkQuad);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  resize() {
    const host = this.canvas.parentElement; const isFixed = getComputedStyle(this.canvas).position === 'fixed';
    const w = isFixed ? innerWidth : Math.max(2, host.clientWidth), h = isFixed ? innerHeight : Math.max(2, host.clientHeight);
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio(); this.rt.setSize(w * pr, h * pr);
    this.inkQuad.material.uniforms.uRes.value.set(w * pr, h * pr);
    this.inkQuad.material.uniforms.uW.value = (this.opts.lineWidth || 1) * Math.max(0.75, pr * 0.55);
  }
  setColors(paper, ink) {
    this.U.uPaper.value.set(paper); this.U.uInk.value.set(ink);
    this.edgeMat.color.set(ink); this.wireMat.color.set(ink);
  }
  _prepare(obj, key) {
    const box = new THREE.Box3().setFromObject(obj); const s = box.getBoundingSphere(new THREE.Sphere());
    const wrap = new THREE.Group(); wrap.add(obj); obj.position.sub(s.center); wrap.scale.setScalar(1 / s.radius); wrap.updateMatrixWorld(true);
    const wb = new THREE.Box3().setFromObject(wrap); const sz = wb.getSize(new THREE.Vector3());
    const meshes = []; wrap.traverse(o => { if (o.isMesh) meshes.push(o); });
    const edges = [], wires = [];
    meshes.forEach(m => {
      m.material = this.surfaceMat; m.frustumCulled = false;
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
      if (!m.isSkinnedMesh && !m.morphTargetInfluences) {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, this.opts.crease), this.edgeMat); e.raycast = () => {}; m.add(e); edges.push(e);
        const tris = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
        if (tris < 90000) { const w = new THREE.LineSegments(new THREE.WireframeGeometry(m.geometry), this.wireMat); w.visible = false; m.add(w); wires.push(w); }
      }
    });
    const axis = sz.x >= sz.y && sz.x >= sz.z ? [1, 0, 0] : sz.y >= sz.z ? [0, 1, 0] : [0, 0, 1];
    return { key, wrap, wb, axis, edges, wires, meshes };
  }
  async load(key, url) {
    if (this.models[key]) return this.models[key];
    let obj;
    if (key === 'jet') obj = buildJet();
    else if (key === 'rocket') obj = buildRocket();
    else {
      const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
      const g = await l.loadAsync(url); obj = g.scene;
    }
    this.models[key] = this._prepare(obj, key);
    return this.models[key];
  }
  async show(key, url) {
    const m = await this.load(key, url);
    if (this.cur) this.root.remove(this.cur.wrap);
    this.cur = m; this.root.add(m.wrap);
    this.U.uBMin.value.copy(m.wb.min); this.U.uBMax.value.copy(m.wb.max); this.U.uAxis.value.set(...m.axis);
    this.edges = m.edges; this.wires = m.wires;
    this.root.rotation.set(0, 0, 0);
    this.ready = true; return m;
  }
  /* arrastar para girar (apenas no elemento dado) */
  enableDrag(el) {
    el.addEventListener('pointerdown', e => { this.drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture && el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!this.drag) return; this.userAz -= (e.clientX - this.drag.x) * 0.45; this.userEl = Math.max(-50, Math.min(50, this.userEl + (e.clientY - this.drag.y) * 0.3)); this.drag = { x: e.clientX, y: e.clientY }; });
    const up = () => { this.drag = null; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return; e.preventDefault(); this.zoom = Math.max(0.55, Math.min(1.8, this.zoom * (1 + e.deltaY * 0.001))); }, { passive: false });
  }
  _loop() {
    requestAnimationFrame(this._loop);
    if (!this.active || !this.cur) return;
    const dt = Math.min(this.clock.getDelta(), 0.1); this.U.uTime.value += dt;
    const P = this.pose, C = this.cam, k = 1 - Math.exp(-dt * 6);
    for (const key of ['az', 'el', 'dist', 'sx', 'sy', 'field', 'wire', 'explode']) C[key] += (P[key] - C[key]) * k;
    if (!this.drag) { this.userAz *= 1 - Math.min(1, dt * 0.25); this.userEl *= 1 - Math.min(1, dt * 0.6); }
    this.spin += dt * (this.opts.spin || 0);
    this.ptrS.lerp(this.ptr, 1 - Math.exp(-dt * 3));
    const az = THREE.MathUtils.degToRad(C.az + this.userAz + this.spin), el = THREE.MathUtils.degToRad(C.el + this.userEl);
    const fov = THREE.MathUtils.degToRad(this.camera.fov); const d = (C.dist * this.zoom) / Math.tan(fov / 2) / Math.max(Math.min(1, this.camera.aspect), 0.6);
    const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    const target = new THREE.Vector3();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();
    const w = 2 * d * Math.tan(fov / 2);
    target.addScaledVector(right, -C.sx * w * this.camera.aspect).addScaledVector(up, -C.sy * w);
    this.camera.position.copy(dir.multiplyScalar(d)).add(target);
    this.camera.position.addScaledVector(right, this.ptrS.x * this.opts.parallax * d).addScaledVector(up, -this.ptrS.y * this.opts.parallax * d * 0.6);
    this.camera.lookAt(target);
    this.camera.near = Math.max(0.005, d * 0.02); this.camera.far = d + 6; this.camera.updateProjectionMatrix(); this.U.uFar.value = this.camera.far;
    this.U.uField.value = C.field; this.wireMat.opacity = C.wire * 0.5; this.wires.forEach(x => x.visible = this.wireMat.opacity > 0.01);
    this.edgeMat.opacity = 0.62 * (1 - C.field * 0.45);
    const R = this.renderer;
    this.edges.forEach(e => e.visible = false); const wv = this.wires.map(x => x.visible); this.wires.forEach(x => x.visible = false);
    this.scene.overrideMaterial = this.normalMat; R.setRenderTarget(this.rt); R.setClearColor(0x808080, 1); R.clear(); R.render(this.scene, this.camera);
    this.scene.overrideMaterial = null; R.setRenderTarget(null); R.setClearColor(0x000000, 0);
    this.edges.forEach(e => e.visible = true); this.wires.forEach((x, i) => x.visible = wv[i]);
    R.autoClear = true; R.render(this.scene, this.camera);
    R.autoClear = false; R.render(this.inkScene, this.ortho); R.autoClear = true;
  }
}
