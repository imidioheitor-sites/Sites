/* ============================================================================
   scene.js — Animação 3D de produto (Three.js)
   ----------------------------------------------------------------------------
   Caixa de presente interativa: arraste para girar, roda do mouse para
   aproximar, e a tampa se abre revelando o conteúdo quando o cursor entra
   (Object Reveal on Hover + 3D Product Animation).
   ============================================================================ */

import * as THREE from 'three';

const stage = document.getElementById('three-stage');
if (stage) {
  try {
    init(stage);
    // Deu certo: some com o fallback em CSS.
    document.getElementById('threeFallback')?.classList.add('gone');
  } catch (err) {
    // Sem WebGL (ou GPU bloqueada): mantém o cubo em CSS, nada fica vazio.
    console.warn('[3D] WebGL indisponível, usando fallback CSS:', err.message);
  }
}

function init(host) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 768px)').matches;

  /* ---------- renderer / cena / câmera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.1, 6.2);

  /* ---------- materiais ---------- */
  const NAVY = 0x0A1F44, GOLD = 0xC9A227, GOLD_HI = 0xE8C766;

  const matBox = new THREE.MeshStandardMaterial({
    color: NAVY, roughness: 0.42, metalness: 0.28,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: GOLD, roughness: 0.22, metalness: 0.95,
  });
  const matGlow = new THREE.MeshStandardMaterial({
    color: GOLD_HI, emissive: GOLD_HI, emissiveIntensity: 1.5, roughness: 0.3,
  });

  /* ---------- montagem da caixa ---------- */
  const root = new THREE.Group();
  scene.add(root);

  const W = 2.2, H = 1.5, D = 2.2, RIB = 0.19;

  // Corpo
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matBox);
  body.position.y = -0.15;
  root.add(body);

  // Fitas do corpo (cruzadas)
  const ribA = new THREE.Mesh(new THREE.BoxGeometry(RIB, H + 0.02, D + 0.02), matGold);
  ribA.position.y = body.position.y;
  root.add(ribA);
  const ribB = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, H + 0.02, RIB), matGold);
  ribB.position.y = body.position.y;
  root.add(ribB);

  // Tampa (grupo próprio — é ela que abre)
  const lid = new THREE.Group();
  lid.position.y = H / 2 - 0.15;
  root.add(lid);

  const lidBox = new THREE.Mesh(new THREE.BoxGeometry(W + 0.16, 0.3, D + 0.16), matBox);
  lidBox.position.y = 0.15;
  lid.add(lidBox);

  const lidRibA = new THREE.Mesh(new THREE.BoxGeometry(RIB, 0.32, D + 0.18), matGold);
  lidRibA.position.y = 0.15; lid.add(lidRibA);
  const lidRibB = new THREE.Mesh(new THREE.BoxGeometry(W + 0.18, 0.32, RIB), matGold);
  lidRibB.position.y = 0.15; lid.add(lidRibB);

  // Laço: toros inclinados + nó central
  const bow = new THREE.Group();
  bow.position.y = 0.34;
  lid.add(bow);
  const loopGeo = new THREE.TorusGeometry(0.32, 0.075, 12, 40);
  [-1, 1].forEach(dir => {
    const loop = new THREE.Mesh(loopGeo, matGold);
    loop.position.set(dir * 0.3, 0.06, 0);
    loop.rotation.set(Math.PI / 2, 0, dir * 0.62);
    loop.scale.set(1, 0.68, 1);
    bow.add(loop);
  });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 20), matGold);
  bow.add(knot);

  // Conteúdo escondido — só aparece quando a tampa levanta
  const treasure = new THREE.Group();
  treasure.position.y = -0.1;
  treasure.visible = false;
  root.add(treasure);

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), matGlow);
  treasure.add(orb);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.018, 8, 60),
    new THREE.MeshBasicMaterial({ color: GOLD_HI, transparent: true, opacity: 0.75 })
  );
  halo.rotation.x = Math.PI / 2.3;
  treasure.add(halo);

  // Faíscas orbitando o conteúdo
  const sparkGeo = new THREE.BufferGeometry();
  const SPARKS = 90, pos = new Float32Array(SPARKS * 3);
  for (let i = 0; i < SPARKS; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 1.1;
    pos[i*3]   = Math.cos(a) * r;
    pos[i*3+1] = (Math.random() - 0.3) * 1.5;
    pos[i*3+2] = Math.sin(a) * r;
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    color: GOLD_HI, size: 0.045, transparent: true, opacity: 0.9, depthWrite: false,
  }));
  treasure.add(sparks);

  /* ---------- luzes ---------- */
  scene.add(new THREE.AmbientLight(0x3A5A9A, 1.1));
  const key = new THREE.DirectionalLight(0xFFF0C4, 2.4); key.position.set(4, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(GOLD_HI, 1.6);  rim.position.set(-5, 2, -4); scene.add(rim);
  const fill = new THREE.PointLight(0x4C7BD1, 1.5, 18);  fill.position.set(-3, -2, 3); scene.add(fill);

  /* ---------- interação ---------- */
  let targetRotY = 0.5, targetRotX = 0.12;
  let curRotY = 0.5,    curRotX = 0.12;
  let dragging = false, lastX = 0, lastY = 0, velY = 0;
  let zoom = 6.2, targetZoom = 6.2;
  let hovering = false, lidOpen = 0;
  let idle = 0;
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

  const el = renderer.domElement;

  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;   // no toque, deixa a página rolar
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    el.setPointerCapture(e.pointerId); idle = 0;
  });
  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    targetRotY += dx * 0.008;
    targetRotX = Math.max(-0.7, Math.min(0.7, targetRotX + dy * 0.005));
    velY = dx * 0.008; idle = 0;
  });
  const stop = () => { dragging = false; };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);

  el.addEventListener('wheel', e => {
    e.preventDefault();
    targetZoom = Math.max(4.2, Math.min(9, targetZoom + Math.sign(e.deltaY) * 0.45));
  }, { passive: false });

  host.addEventListener('pointerenter', () => { hovering = true; });
  host.addEventListener('pointerleave', () => { hovering = false; dragging = false; });

  // No celular: abre quando a seção entra na tela
  if (isMobile) {
    new IntersectionObserver(en => {
      en.forEach(e => { hovering = e.isIntersecting; });
    }, { threshold: 0.45 }).observe(host);
  }

  addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    parallax.tx = ((e.clientX - r.left) / r.width  - 0.5) * 0.22;
    parallax.ty = ((e.clientY - r.top)  / r.height - 0.5) * 0.16;
  }, { passive: true });

  /* ---------- resize ---------- */
  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  /* ---------- pausa quando fora da tela ---------- */
  let visible = true;
  new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(host);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    // Inércia + rotação automática quando parado
    if (!dragging) {
      idle += dt;
      targetRotY += velY;
      velY *= 0.94;
      if (idle > 1.6 && !reduced) targetRotY += dt * 0.22;
    }

    curRotY += (targetRotY - curRotY) * 0.09;
    curRotX += (targetRotX - curRotX) * 0.09;
    parallax.x += (parallax.tx - parallax.x) * 0.07;
    parallax.y += (parallax.ty - parallax.y) * 0.07;

    root.rotation.y = curRotY + parallax.x;
    root.rotation.x = curRotX + parallax.y;
    root.position.y = Math.sin(t * 0.9) * 0.07;

    // Revelação: tampa sobe e gira
    const wantOpen = hovering ? 1 : 0;
    lidOpen += (wantOpen - lidOpen) * (reduced ? 1 : 0.08);
    lid.position.y = (H / 2 - 0.15) + lidOpen * 1.25;
    lid.rotation.z = lidOpen * 0.32;
    lid.rotation.x = lidOpen * 0.14;

    treasure.visible = lidOpen > 0.02;
    treasure.scale.setScalar(0.3 + lidOpen * 0.7);
    orb.rotation.y += dt * 0.8;
    orb.rotation.x += dt * 0.35;
    halo.rotation.z += dt * 0.5;
    sparks.rotation.y -= dt * 0.4;
    matGlow.emissiveIntensity = 0.9 + Math.sin(t * 2.4) * 0.35 + lidOpen * 0.6;

    zoom += (targetZoom - zoom) * 0.08;
    camera.position.z = zoom;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  frame();
}
