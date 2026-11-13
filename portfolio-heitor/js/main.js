import { Sfx } from './audio.js';
import { Ink } from './ink.js';
import { initMuon } from './muon.js';
import { MiniSwarm } from './miniswarm.js';

const { T, ACH, TECH } = window.SITE;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const qs = new URLSearchParams(location.search);
const FAST = qs.has('fast');                       // ?fast pula portal e cursores (testes)
let LANG = (navigator.language || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt';
try { const s = localStorage.getItem('hi-lang'); if (s === 'en' || s === 'pt') LANG = s; } catch (e) {}
if (qs.get('l') === 'en' || qs.get('l') === 'pt') LANG = qs.get('l');
Object.assign(T, {
  'ach.note1': { pt: 'Nº 08', en: 'No. 08' }, 'ach.note1b': { pt: 'conquistas que mudaram a rota', en: 'achievements that changed the route' },
  'ach.tape': { pt: 'CONQUISTAS', en: 'ACHIEVEMENTS' }, 'ach.big': { pt: 'Conquistas', en: 'Achievements' },
  'ach.guest': { pt: 'CONVIDADO ESPECIAL ✦', en: 'SPECIAL GUEST ✦' },
  'ach.c1': { pt: 'experimentos de física', en: 'physics experiments' }, 'ach.c2': { pt: 'raios cósmicos detectados', en: 'cosmic rays detected' },
  'ach.c3': { pt: 'artigos para o IYPT', en: 'IYPT papers' }, 'ach.c4': { pt: 'US$ em bolsa do CERN', en: 'US$ CERN grant' },
  'tech.chip': { pt: 'PROJETO', en: 'PROJECT' }, 'tech.c1': { pt: 'PROJETOS', en: 'PROJECTS' }, 'tech.c2': { pt: 'DETALHES', en: 'DETAILS' }, 'tech.c3': { pt: 'FICHA TÉCNICA', en: 'SPEC SHEET' },
  'spec.model': { pt: 'Projeto', en: 'Project' }, 'spec.area': { pt: 'Área', en: 'Field' }, 'spec.stack': { pt: 'Tecnologias', en: 'Stack' }, 'spec.no': { pt: 'Nº', en: 'No.' },
});
const t = k => (T[k] || {})[LANG] || '';
const pick = o => o[LANG] || o.pt;

/* ═════════════ i18n ═════════════ */
function applyLang() {
  document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en';
  document.body.classList.remove('lang-pt', 'lang-en'); document.body.classList.add('lang-' + LANG);
  $$('[data-i18n]').forEach(el => { const v = t(el.dataset.i18n); if (v) el.innerHTML = v; });
  $('#heroChips').innerHTML = (T['hero.chips'][LANG]).map(c => `<span>${c}</span>`).join('');
  $('#fMsg').value = t('ct.ph.msg');
  document.title = LANG === 'pt' ? 'Heitor Imídio — Engenharia, física e IA' : 'Heitor Imídio — Engineering, physics & AI';
  $('#gate .gate-title').innerHTML = t('gate.title');
}
const US_STARS = (() => { let s = ''; for (let r = 0; r < 9; r++) { const n = r % 2 ? 5 : 6; for (let i = 0; i < n; i++) { const x = (r % 2 ? 42.7 : 21.3) + i * 42.7, y = 21.4 + r * 24.1; s += `<polygon transform="translate(${x} ${y})" points="0,-8 2.4,-2.5 8,-2.5 3.5,1.2 5,7 0,3.6 -5,7 -3.5,1.2 -8,-2.5 -2.4,-2.5"/>`; } } return s; })();
$('#stars').innerHTML = US_STARS;
applyLang();

/* ═════════ 3D de fundo (ink viewer) ═════════ */
let ink = null, inkReady = false;
try {
  ink = new Ink($('#ink-bg'), { paper: '#ecebe7', ink: '#111', lineWidth: 1.15, parallax: 0.025 });
  ink.show('astro', 'models/astronaut.glb').then(() => { inkReady = true; layout(); }).catch(e => console.warn('ink', e));
  ink.enableDrag(window);
} catch (e) { console.warn('WebGL indisponível', e); }

/* ═════════ Conquistas (carrossel) ═════════ */
const CATS = [['all', t('ach.all')], ['sci', LANG === 'pt' ? 'Ciência' : 'Science'], ['tech', 'Tech'], ['soc', LANG === 'pt' ? 'Impacto' : 'Impact'], ['lead', LANG === 'pt' ? 'Liderança' : 'Leadership'], ['edu', LANG === 'pt' ? 'Educação' : 'Education']];
$('#achFilters').innerHTML = CATS.map(([k, l], i) => `<button data-c="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('');
$('#achNum').dataset.num = ACH.length;
$('#carTrack').innerHTML = ACH.map((a, i) => `
  <article class="card" data-lit data-cat="${a.cat}" data-glare-hover data-color="#ffffff" data-opacity="0.35">
    <div class="c-media ${a.logo ? 'is-logo' : ''}">
      ${a.imgs.map((im, k) => `<img class="${k ? '' : 'on'}" src="img/${im}.jpg" alt="" loading="lazy" draggable="false">`).join('')}
      <span class="c-tag">${pick(a.tag)}</span><span class="c-yr">${a.yr}</span>
      ${a.imgs.length > 1 ? `<div class="c-dots">${a.imgs.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>` : ''}
    </div>
    <div class="c-body">
      <h3>${pick(a.title)}</h3>
      <div class="c-meta mono">${pick(a.meta)}</div>
      <div class="c-tabs"><button class="on" data-tab="did">${t('ach.did')}</button><button data-tab="why">${t('ach.why')}</button></div>
      <p class="c-text" data-did="${pick(a.did).replace(/"/g, '&quot;')}" data-why="${pick(a.why).replace(/"/g, '&quot;')}">${pick(a.did)}</p>
    </div>
    <span class="c-num">${String(i + 1).padStart(2, '0')}</span>
  </article>`).join('');
$$('.card').forEach(card => {
  const imgs = $$('.c-media img', card), dots = $$('.c-dots i', card); let k = 0;
  const go = n => { k = (n + imgs.length) % imgs.length; imgs.forEach((im, j) => im.classList.toggle('on', j === k)); dots.forEach((d, j) => d.classList.toggle('on', j === k)); };
  if (imgs.length > 1) { let timer = setInterval(() => { if (card.getBoundingClientRect().right > 0 && card.getBoundingClientRect().left < innerWidth) go(k + 1); }, 3600 + Math.random() * 1200); card.addEventListener('mouseenter', () => go(k + 1)); }
  $$('.c-tabs button', card).forEach(b => b.addEventListener('click', () => {
    Sfx.play('tick', { vol: .5 }); $$('.c-tabs button', card).forEach(x => x.classList.toggle('on', x === b));
    const p = $('.c-text', card); p.style.opacity = 0; setTimeout(() => { p.textContent = p.dataset[b.dataset.tab]; p.style.opacity = 1; }, 160);
  }));
});
$$('.c-text').forEach(p => p.style.transition = 'opacity .16s');
$$('#achFilters button').forEach(b => b.addEventListener('click', () => {
  Sfx.play('click', { vol: .5 }); $$('#achFilters button').forEach(x => x.classList.toggle('on', x === b));
  $$('.card').forEach(c => c.classList.toggle('hide', b.dataset.c !== 'all' && c.dataset.cat !== b.dataset.c));
  $('#carTrack').scrollTo({ left: 0, behavior: 'smooth' }); updateBar();
}));
const track = $('#carTrack');
function updateBar() { const max = track.scrollWidth - track.clientWidth; const f = max > 0 ? track.scrollLeft / max : 0; const w = clamp(track.clientWidth / track.scrollWidth, .1, 1); $('#carBar').style.width = (w * 100) + '%'; $('#carBar').style.transform = `translateX(${f * (1 / w - 1) * 100}%)`; }
track.addEventListener('scroll', updateBar, { passive: true });
const step = () => ($('.card:not(.hide)') || { offsetWidth: 400 }).offsetWidth + 30;
$('#carPrev').onclick = () => { Sfx.play('swipe', { vol: .5 }); track.scrollBy({ left: -step(), behavior: 'smooth' }); };
$('#carNext').onclick = () => { Sfx.play('swipe', { vol: .5 }); track.scrollBy({ left: step(), behavior: 'smooth' }); };
(() => { // arrastar com o mouse
  const car = $('#car'); let d = null;
  car.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button')) return; d = { x: e.clientX, l: track.scrollLeft, moved: 0 }; });
  addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x; d.moved = Math.abs(dx); if (d.moved > 4) { car.classList.add('drag'); track.scrollLeft = d.l - dx; } });
  addEventListener('pointerup', () => { if (d && d.moved > 4) Sfx.play('swipe', { vol: .35 }); d = null; setTimeout(() => car.classList.remove('drag'), 30); });
  addEventListener('keydown', e => { if (e.key === 'ArrowRight' && inView($('#ach'))) $('#carNext').click(); if (e.key === 'ArrowLeft' && inView($('#ach'))) $('#carPrev').click(); });
})();
const inView = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * .6 && r.bottom > innerHeight * .4; };
updateBar();

/* ═════════ Projetos: mosaico ═════════ */
const MOS = [['projetei-4', LANG === 'pt' ? 'Laboratório de impressão 3D' : '3D printing lab'], ['projetei-6', LANG === 'pt' ? 'Peças impressas' : 'Printed parts'], ['projetei-7', LANG === 'pt' ? 'Robótica FTC' : 'FTC robotics'],
  ['projetei-8', 'B.LAB'], ['projetei-1', LANG === 'pt' ? 'Honra ao Mérito · Câmara de Goiânia' : 'Honor of Merit · Goiânia City Council'], ['projetei-9', LANG === 'pt' ? 'Crianças e brinquedos' : 'Kids and toys'], ['gala-5', LANG === 'pt' ? 'Gala do Prep' : 'Prep Gala']];
$('#mosaic').innerHTML = MOS.map(([im, c]) => `<figure class="tile"><img src="img/${im}.jpg" alt="" loading="lazy"><span>${c}</span></figure>`).join('');

/* ═════════ Galeria de momentos (fotos novas, legendas só com fatos confirmados) ═════════ */
const GAL = [
  ['orion', LANG === 'pt' ? 'Órion Business & Health Complex' : 'Órion Business & Health Complex', 'Heitor de blazer laranja e óculos em frente ao Órion Business & Health Complex', '50% 30%'],
  ['embraer-ita', LANG === 'pt' ? 'Ao lado de fuselagem Embraer · ITA' : 'Next to an Embraer · ITA fuselage', 'Heitor sentado ao lado de uma fuselagem de avião Embraer', '50% 55%'],
  ['sala-apresentacao', LANG === 'pt' ? 'Apresentando a parte experimental' : 'Presenting the experimental part', 'Heitor apresentando em sala diante de um slide sobre a parte experimental', '50% 40%'],
  ['zurique-rio', LANG === 'pt' ? 'Zurique, Suíça' : 'Zurich, Switzerland', 'Heitor de jaqueta vermelha à beira do rio em Zurique', '50% 45%'],
  ['zurique-museu', LANG === 'pt' ? 'Museu Nacional Suíço, Zurique' : 'Swiss National Museum, Zurich', 'Heitor de jaqueta vermelha no pátio do Museu Nacional Suíço, em Zurique', '50% 60%'],
  ['sala-1', LANG === 'pt' ? 'Em sala de aula' : 'In the classroom', 'Heitor de blazer preto em sala de aula', '50% 30%'],
  ['sala-2', LANG === 'pt' ? 'Em sala de aula' : 'In the classroom', 'Heitor de blazer preto em sala de aula, mãos sob o queixo', '50% 40%']];
$('#gallery').innerHTML = GAL.map(([im, c, alt, pos]) => `<figure class="gtile"><img src="img/${im}.jpg" alt="${alt}" loading="lazy" style="object-position:${pos}"><span>${c}</span></figure>`).join('');

/* ═════════ Muon ═════════ */
let muon = null;
try { muon = initMuon($('#chCanvas'), { onHit: n => { $('#chCount').textContent = 'μ⁻ ' + String(n).padStart(2, '0'); } }); } catch (e) {}
$('#btnMuon').onclick = () => { Sfx.play('pop', { vol: .7 }); Sfx.play('sparkle', { vol: .4, delay: .05 }); muon && muon.trigger(); };
$('#chamber').addEventListener('click', () => $('#btnMuon').click());

/* ═════════ Ink viewer do painel ═════════ */
let ink2 = null;
try {
  ink2 = new Ink($('#ink-panel'), { paper: '#e4e2dc', ink: '#111', lineWidth: 1.2, spin: 10, parallax: 0.02 });
  ink2.pose = Object.assign(ink2.pose, { az: -35, el: 14, dist: 1.1 }); Object.assign(ink2.cam, ink2.pose);
  ink2.show('astro', 'models/astronaut.glb'); ink2.enableDrag($('#inkStage')); ink2.active = false;
  new IntersectionObserver(e => { ink2.active = e[0].isIntersecting; }, { rootMargin: '100px' }).observe($('#inkStage'));
} catch (e) { console.warn(e); }
const CAPS = { astro: 'ASTRONAUT · NASA (CC BY)', jet: LANG === 'pt' ? 'CAÇA · MODELO PROCEDURAL' : 'FIGHTER · PROCEDURAL MODEL', rocket: LANG === 'pt' ? 'FOGUETE · MODELO PROCEDURAL' : 'ROCKET · PROCEDURAL MODEL' };
$$('#inkModels button').forEach(b => b.addEventListener('click', async () => {
  if (!ink2) return; Sfx.play('click', { vol: .5 }); $$('#inkModels button').forEach(x => x.classList.toggle('on', x === b));
  await ink2.show(b.dataset.m, 'models/astronaut.glb'); $('#inkCap').textContent = CAPS[b.dataset.m]; Sfx.play('glitch', { vol: .25 });
}));
$$('#inkStyles button').forEach(b => b.addEventListener('click', () => {
  if (!ink2) return; Sfx.play('tick', { vol: .5 }); $$('#inkStyles button').forEach(x => x.classList.toggle('on', x === b));
  const s = b.dataset.s; ink2.pose.field = s === 'color' ? 1 : s === 'wire' ? .45 : 0; ink2.pose.wire = s === 'wire' ? 1 : 0;
}));

/* ═════════ Seção 04: o site inteiro muda ═════════ */
const PAL = [
  { bg: '#ff5a1f', fg: '#0f0f0f', ac: '#0f0f0f', ac2: '#ffd9c7', strip: '#00897b', face: '#ff6f3a', edge: '#ffffff', fo: .55 },
  { bg: '#e8e5de', fg: '#0f0f0f', ac: '#ff5a1f', ac2: '#0b1b4d', strip: '#ff5a1f', face: '#f6f3ec', edge: '#ff5a1f', fo: .9 },
  { bg: '#0f0f10', fg: '#f4f1ea', ac: '#ff5a1f', ac2: '#ffb08f', strip: '#ff5a1f', face: '#1b1b1e', edge: '#ff5a1f', fo: .95 },
  { bg: '#c1121f', fg: '#fff5f3', ac: '#ffd23f', ac2: '#ffffff', strip: '#ffffff', face: '#d4283a', edge: '#ffd23f', fo: .6 },
  { bg: '#ff5a1f', fg: '#0f0f0f', ac: '#0f0f0f', ac2: '#ffd9c7', strip: '#6b3cff', face: '#ff6f3a', edge: '#0f0f0f', fo: .5 },
  { bg: '#e8e5de', fg: '#0f0f0f', ac: '#e11d2e', ac2: '#0b1b4d', strip: '#0b1b4d', face: '#f6f3ec', edge: '#0b1b4d', fo: .9 },
];
TECH.forEach((p, i) => Object.assign(p.theme, PAL[i % PAL.length]));
const N = TECH.length; $('#tech').style.setProperty('--n', N - 1);
const stage = $('#techStage'), swarm = new MiniSwarm($('#tCursors'));
$('#tRail').innerHTML = TECH.map((p, i) => `<button data-i="${i}" aria-label="${pick(p.title)}"><i></i><em class="mono">${String(i + 1).padStart(2, '0')}</em><span>${p.word}</span></button>`).join('');
let cubes = null;
function mkCubes() { const S = window.HeluCubes; if (!S || cubes) return; try { const th = TECH[0].theme; cubes = S.create($('#tCubes'), { gridSize: 9, gap: .16, faceColor: th.face, edgeColor: th.edge, edgeWidth: 1.4, faceOpacity: th.fo, shading: .35, maxAngle: 50, radius: 3.2, perspective: .25, rippleColor: th.ac, intro: true }); } catch (e) { console.warn('cubes', e); } }
function circuitRun() { const c = $('#tCircuit'); c.classList.remove('run'); void c.getBoundingClientRect(); c.classList.add('run'); }
let techIdx = -1, imgTimer = null;
function pipeHTML() {
  const rows = [['SELLER', 'prospecta'], ['CODER', 'gera o site'], ['REACHER', 'avisa o dono'], ['WATCHDOG', 'vigia'], ['VERIFIER', 'melhora']];
  return `<div class="t-pipe">${rows.map(r => `<div>${r[0]}<i>${r[1]}</i></div>`).join('')}</div>`;
}
let globeRAF = 0;
function stopGlobe() { cancelAnimationFrame(globeRAF); globeRAF = 0; }
function startGlobe(cv) {
  const S = 220, dpr = Math.min(devicePixelRatio || 1, 2); cv.width = cv.height = S * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const R = 92, pts = []; for (let i = 0; i < 520; i++) { const y = 1 - 2 * (i + .5) / 520, r = Math.sqrt(1 - y * y), a = i * 2.39996; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  const proj = (x, y, z, rot, tilt) => { const c = Math.cos(rot), s = Math.sin(rot), x1 = x * c + z * s, z1 = -x * s + z * c, ct = Math.cos(tilt), st = Math.sin(tilt); return [x1, y * ct - z1 * st, y * st + z1 * ct]; };
  let t0 = performance.now();
  const draw = now => {
    const rot = (now - t0) / 4200; g.clearRect(0, 0, S, S); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 1;
    g.globalAlpha = .9; g.beginPath(); g.arc(S / 2, S / 2, R, 0, 7); g.stroke();
    g.globalAlpha = .3; for (let la = -60; la <= 60; la += 30) { g.beginPath(); for (let k = 0; k <= 64; k++) { const lo = k / 64 * Math.PI * 2, [x, y, z] = proj(Math.cos(la * Math.PI / 180) * Math.cos(lo), Math.sin(la * Math.PI / 180), Math.cos(la * Math.PI / 180) * Math.sin(lo), rot, .35); if (z > 0) g.lineTo(S / 2 + x * R, S / 2 - y * R); else g.moveTo(S / 2 + x * R, S / 2 - y * R); } g.stroke(); }
    pts.forEach(p => { const [x, y, z] = proj(p[0], p[1], p[2], rot, .35); if (z > 0) { g.globalAlpha = .25 + .6 * z; g.fillRect(S / 2 + x * R - 1, S / 2 - y * R - 1, 2, 2); } });
    globeRAF = requestAnimationFrame(draw);
  };
  globeRAF = requestAnimationFrame(draw);
}
function setStrip(p, i) {
  stopGlobe(); $('#tGlobe')?.remove();
  if (p.globe) { const cv = document.createElement('canvas'); cv.id = 'tGlobe'; cv.className = 't-globe'; cv.setAttribute('aria-label', 'Globo girando'); $('#tStrip').appendChild(cv); if (!RM) startGlobe(cv); else startGlobe(cv); }
  const el = $('#tImg'); el.className = 't-img' + (p.logo ? ' logo' : '') + (p.pipeline ? ' pipe' : ''); el.innerHTML = p.pipeline ? pipeHTML() : '';
  el.style.filter = p.pipeline || p.logo ? 'none' : p.filter || 'none';
  const set = k => { el.style.backgroundImage = p.imgs.length ? `url(img/${p.imgs[k % p.imgs.length]}.jpg)` : 'none'; };
  set(0); clearInterval(imgTimer); if (p.imgs.length > 1) { let k = 0; imgTimer = setInterval(() => { k++; el.style.opacity = 0; setTimeout(() => { set(k); el.style.opacity = 1; }, 450); }, 3600); }
}
function setTheme(p) {
  const th = p.theme; stage.style.setProperty('--bg', th.bg); stage.style.setProperty('--fg', th.fg); stage.style.setProperty('--ac', th.ac); stage.style.setProperty('--ac2', th.ac2); stage.style.setProperty('--strip', th.strip);
  if (cubes) cubes.update({ faceColor: th.face, edgeColor: th.edge, faceOpacity: th.fo, rippleColor: th.ac });
}
function layoutTech() {}
async function setProject(i, animate) {
  if (i === techIdx) return; const first = techIdx < 0; techIdx = i; const p = TECH[i];
  $$('#tRail button').forEach((b, k) => b.classList.toggle('on', k === i));
  $('#tCount').textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  setTheme(p); updateNav();
  const w = $('#tWord'); w.textContent = p.word; w.classList.remove('swap'); void w.offsetWidth; w.classList.add('swap');
  const bs = $$('[data-b]', stage); bs.forEach(b => b.classList.remove('in'));
  layoutTech(i);
  $('#tSpec').innerHTML = [[t('spec.no'), p.num + ' / ' + String(N).padStart(2, '0')], [t('spec.model'), p.word], [t('spec.area'), pick(p.sub)], [t('spec.stack'), p.tags.join(' · ')]].map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
  circuitRun();
  $('#tSub').textContent = pick(p.sub); $('#tTitle').textContent = pick(p.title); $('#tText').textContent = pick(p.text);
  $('#tTags').innerHTML = p.tags.map(x => `<span>${x}</span>`).join(''); $('#tNum').textContent = p.num;
  setStrip(p, i); $('#tImg').style.opacity = 0;
  if (!first) { Sfx.play('stinger', { vol: .5 }); Sfx.play('whoosh', { vol: .3 }); }
  const targets = [$('#tStrip'), ...bs];
  const reveal = el => { if (el.id === 'tStrip') $('#tImg').style.opacity = 1; else el.classList.add('in'); };
  if (!animate || RM) { targets.forEach(reveal); return; }
  const mine = i; await swarm.run(targets, el => reveal(el), { sound: (n, k) => Sfx.play(n, { vol: .25, rate: 1 + k * .08, pan: (k - 3) / 4 }) });
  if (mine !== techIdx) return;
}
$('#tNext').onclick = () => goTech((techIdx + 1) % N);
$$('#tRail button').forEach(b => b.addEventListener('click', () => goTech(+b.dataset.i)));
function techTop() { return $('#tech').offsetTop; }
function techStepPx() { return ($('#tech').offsetHeight - innerHeight) / (N - 1); }
function goTech(i) { Sfx.play('click', { vol: .5 }); scrollTo({ top: techTop() + i * techStepPx() + 2, behavior: 'smooth' }); }
setProject(0, false);

/* ═════════ Contato ═════════ */
$('#copyMail').onclick = async () => {
  try { await navigator.clipboard.writeText('himidio@nd.edu'); } catch (e) {}
  Sfx.play('pop', { vol: .7 }); const h = $('#copyHint'); h.textContent = t('ct.copied'); setTimeout(() => h.textContent = t('ct.copy'), 1800);
};
$('#ctForm').addEventListener('submit', e => {
  e.preventDefault(); Sfx.play('select', { vol: .5 });
  const sub = encodeURIComponent($('#fTopic').value + ' — ' + ($('#fName').value || 'Portfolio')); const body = encodeURIComponent($('#fMsg').value + '\n\n— ' + $('#fName').value);
  location.href = `mailto:himidio@nd.edu?subject=${sub}&body=${body}`;
});

/* ═════════ Contadores ═════════ */
function countUp(el) {
  const to = parseFloat(el.dataset.num), dec = +(el.dataset.dec || 0), sep = el.dataset.sep || '', pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  const pad = +(el.dataset.pad || 0); const fmt = v => { let s = v.toFixed(dec); if (pad) s = s.padStart(pad, '0'); if (LANG === 'pt' && dec) s = s.replace('.', ','); if (sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, sep); return pre + s + suf; };
  const t0 = performance.now(), D = 1600; (function f(n) { const k = clamp((n - t0) / D, 0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(f); })(t0);
}
const counted = new WeakSet();
const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !counted.has(e.target)) { counted.add(e.target); countUp(e.target); } }), { threshold: .6 });
$$('[data-num]').forEach(el => cio.observe(el));

/* ═════════ Ignição de cores ═════════ */
let lit = false, igniting = false;
async function ignite(replay) {
  if (igniting || (lit && !replay)) return; igniting = true;
  if (replay) { document.body.classList.remove('color'); document.body.classList.add('bw'); $$('.lit').forEach(e => e.classList.remove('lit')); await wait(350); }
  Sfx.play('riser', { vol: .6 });
  const els = $$('[data-lit]'); await wait(RM ? 0 : 1000);
  const vis = els.filter(e => { const r = e.getBoundingClientRect(); return r.bottom > -200 && r.top < innerHeight + 600; }), rest = els.filter(e => !vis.includes(e));
  for (let i = 0; i < vis.length; i++) { vis[i].classList.add('lit'); if (i % 2 === 0) Sfx.note(i / 2, { vol: .38 }); await wait(RM ? 0 : 70); }
  const fl = $('#flash'); fl.style.setProperty('--fx', '55%'); fl.style.setProperty('--fy', '30%');
  fl.animate([{ opacity: 0 }, { opacity: .85, offset: .25 }, { opacity: 0 }], { duration: 1100, easing: 'ease-out' });
  Sfx.play('ignite', { vol: .8 }); setTimeout(() => Sfx.play('sparkle', { vol: .5 }), 120);
  document.body.classList.remove('bw'); document.body.classList.add('color'); rest.forEach(e => e.classList.add('lit'));
  lit = true; igniting = false; updateNav(); layout();
}
$('#btnReignite').onclick = () => { Sfx.play('click', { vol: .5 }); ignite(true); };
function maybeRevert() {
  const top = $('#ach').offsetTop;
  if (lit && !igniting && scrollY < top - innerHeight * 1.1) { lit = false; document.body.classList.remove('color'); document.body.classList.add('bw'); $$('.lit').forEach(e => e.classList.remove('lit')); layout(); }
}

/* ═════════ Layout por scroll ═════════ */
const hero = $('#hero'), heroSt = n => { ['st1', 'st2', 'st3'].forEach((c, i) => hero.classList.toggle(c, i + 1 === n)); };
let heroNow = 1, ticking = false, lastY = -1;
const HERO_SIMPLE = true;   // hero só com o vídeo (pedido do Heitor); estágios 2 e 3 ficam guardados no código
if (HERO_SIMPLE) hero.classList.add('simple');
(async () => { // vídeo do hero: coloque em video/hero.mp4 (ele olhando o cursor e depois trabalhando). Sem arquivo, fica a foto.
  try {
    const r = await fetch('video/hero.mp4', { method: 'HEAD' }); if (!r.ok || !/video/.test(r.headers.get('content-type') || '')) return;
    const v = $('#heroVideo'); v.src = 'video/hero.mp4'; v.hidden = false; hero.classList.add('has-video');
    v.play().catch(() => {}); v.addEventListener('error', () => { v.hidden = true; hero.classList.remove('has-video'); });
  } catch (e) {}
})();
function sectionAt() {
  const mid = scrollY + innerHeight * .5;
  for (const id of ['contact', 'tech', 'proj', 'ach', 'hero']) { const el = $('#' + id); if (mid >= el.offsetTop) return id; }
  return 'hero';
}
function updateNav() {
  const sec = sectionAt(); const nav = document.documentElement.style;
  if (sec === 'tech') { const th = TECH[Math.max(techIdx, 0)].theme; nav.setProperty('--nav-fg', th.fg); nav.setProperty('--nav-bg', /^#0/.test(th.fg) ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.4)'); }
  else if (sec === 'contact') { nav.setProperty('--nav-fg', '#f3f1ff'); nav.setProperty('--nav-bg', 'rgba(11,27,77,.5)'); }
  else { nav.setProperty('--nav-fg', '#0c0c0d'); nav.setProperty('--nav-bg', 'rgba(236,235,231,.6)'); }
  $$('.links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + sec));
}
function layout() {
  const y = scrollY, H = innerHeight;
  $('#progress i').style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - H), 0, 1)})`;
  const sec = sectionAt();
  // hero em estágios
  const span = Math.max(1, hero.offsetHeight - H), p = HERO_SIMPLE ? 0 : clamp(y / span, 0, 1);
  const st = HERO_SIMPLE ? 1 : p < .2 ? 1 : p < .5 ? 2 : 3;
  if (st !== heroNow) { heroNow = st; heroSt(st); if (document.body.classList.contains('in')) { Sfx.play(st === 1 ? 'whooshdown' : 'whoosh', { vol: .35 }); } }
  $('#heroStep').textContent = `0${st} / 03`;
  $('#blurwin').style.setProperty('--wx', (-6 + clamp((p - .2) / .3, 0, 1) * 14) + 'vh');
  // 3D de fundo
  if (ink && inkReady) {
    const P = ink.pose; let op = 0;
    if (sec === 'hero' && st === 3) { op = 1; const q = (p - .5) / .5; Object.assign(P, { az: -40 + q * 250, el: 14 - q * 10, dist: 1.38, sx: 0, sy: 0.07, field: 0 }); }
    else if (sec === 'hero' && st === 2) { op = .0; Object.assign(P, { az: -60, el: 20, dist: 1.25, sx: 0, field: 0 }); }
    else if (sec === 'hero') { op = 0; }
    else if (sec === 'ach') { op = 0; }
    else { op = 0; }
    const cs = $('#ink-bg').style; if (+cs.opacity !== op) cs.opacity = op;
    ink.active = op > 0 || +(cs.opacity) > 0.02;
  }
  // 04: projeto atual
  if (sec === 'tech') { const idx = clamp(Math.floor((y - techTop() + innerHeight * .1) / techStepPx() + .0001), 0, N - 1); if (idx !== techIdx) setProject(idx, true); }
  document.body.classList.toggle('past-hero', y > 40);
  updateNav(); maybeRevert();
}
function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; layout(); }); }
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', () => { layoutTech(techIdx); layout(); });
// acender ao chegar na seção 02
new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && document.body.classList.contains('in') && !document.body.classList.contains('building')) ignite(); }), { threshold: .0, rootMargin: '0px 0px -45% 0px' }).observe($('#ach .ach-top'));

/* ═════════ Nav ═════════ */
$$('.links a, .logo').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (!id || id[0] !== '#') return; e.preventDefault(); Sfx.play('whoosh', { vol: .3 });
  const el = $(id); const y = id === '#hero' ? 0 : el.offsetTop; scrollTo({ top: y, behavior: 'smooth' });
}));
$$('.pill,.glassbtn,.neu-btn,.flag,.lang').forEach(b => b.addEventListener('pointerenter', () => Sfx.play('hover', { vol: .25 })));
const sBtn = $('#btnSound');
function syncSound() { sBtn.setAttribute('aria-pressed', Sfx.on); $('#soundState').textContent = Sfx.on ? 'ON' : 'OFF'; }
sBtn.onclick = () => { Sfx.setOn(!Sfx.on); if (Sfx.on) Sfx.play('click'); syncSound(); }; syncSound();
$('#btnLang').onclick = () => { try { localStorage.setItem('hi-lang', LANG === 'pt' ? 'en' : 'pt'); } catch (e) {} location.search = '?l=' + (LANG === 'pt' ? 'en' : 'pt'); };
addEventListener('pointerdown', () => Sfx.unlock(), { once: true });

/* ═════════ Portal de idioma → malha → cursores constroem o site ═════════ */
function meshTransition() {
  return new Promise(res => {
    const cols = innerWidth < 700 ? 8 : 16, size = Math.ceil(innerWidth / cols), rows = Math.ceil(innerHeight / size);
    const m = document.createElement('div'); m.style.cssText = `position:fixed;inset:0;z-index:250;display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},${size}px);pointer-events:none`;
    for (let i = 0; i < cols * rows; i++) {
      const c = document.createElement('i'), x = i % cols, y = (i / cols) | 0;
      c.style.cssText = `background:#0c0c0d;transform:scale(0);transition:transform .38s cubic-bezier(.2,.8,.2,1);transition-delay:${(x + y) * 24 + Math.random() * 90}ms;outline:1px solid rgba(255,255,255,.08)`; m.appendChild(c);
    }
    document.body.appendChild(m); requestAnimationFrame(() => requestAnimationFrame(() => $$('i', m).forEach(c => c.style.transform = 'scale(1)')));
    const total = (cols + rows) * 24 + 560;
    setTimeout(() => { // cobertura total: troca de cena
      $('#gate').remove(); document.body.classList.remove('locked'); document.body.classList.add('in'); window.scrollTo(0, 0);
      $$('i', m).forEach(c => { c.style.transitionDelay = (Math.random() * 380 + ((cols - 1 - (Array.prototype.indexOf.call(m.children, c) % cols)) * 20)) + 'ms'; c.style.transform = 'scale(0)'; });
      Sfx.play('glitch', { vol: .35 }); setTimeout(() => { m.remove(); res(); }, 1000);
    }, total);
  });
}
function grayscaleSwarm() {
  const S = window.SwarmBuild; if (!S) return;
  S.COLORS.splice(0, S.COLORS.length, '#111111', '#2b2b2b', '#444444', '#5d5d5d', '#777777', '#1c1c1c', '#383838', '#505050');
  const host = document.querySelector('body ~ [data-swarm-ignore], html > [data-swarm-ignore]') || document.querySelector('[data-swarm-ignore]');
  if (host) host.style.filter = 'grayscale(1) contrast(1.08)';
}
async function buildWithCursors(opts = {}) {
  const S = window.SwarmBuild; if (!S || RM) { document.body.classList.remove('building'); return; }
  document.body.classList.add('building', 'locked'); scrollTo(0, 0);
  S.start({ sound: Sfx.on, speed: opts.speed || 1.6, agents: opts.agents || 14, tour: false });
  grayscaleSwarm();
  // fecha sozinho quando termina (botão "Go live" aparece)
  const host = document.querySelector('[data-swarm-ignore]'); const sr = host && host.shadowRoot;
  let tries = 0;
  await new Promise(res => {
    const iv = setInterval(() => {
      tries++; const live = sr && sr.querySelector('[data-a="live"]'); const gone = !document.querySelector('[data-swarm-ignore]');
      if (gone || (live && !live.hidden) || tries > 180) { clearInterval(iv); res(); }
    }, 400);
  });
  await wait(500); S.stop(); document.body.classList.remove('building', 'locked'); layout();
}
function loadFx(list) {
  return Promise.all(list.map(n => new Promise(res => { const s = document.createElement('script'); s.src = `fx/${n}.js`; s.onload = s.onerror = res; document.body.appendChild(s); })));
}
async function boot() {
  $$('#ach, #proj').forEach(s => { s.dataset.clickSpark = ''; s.dataset.color = '#ff4a1c'; });
  $$('.glassbtn,.t-btn').forEach(b => b.dataset.magnet = '');
  await loadFx(['circular-text', 'glare-hover', 'magnet', 'click-spark', 'noise', 'curved-loop', 'cubes', 'swarm-build']);
  mkCubes(); if (cubes) cubes.update({ faceColor: TECH[Math.max(techIdx, 0)].theme.face, edgeColor: TECH[Math.max(techIdx, 0)].theme.edge, faceOpacity: TECH[Math.max(techIdx, 0)].theme.fo });
  layout();
}
const start = async lang => {
  LANG = lang; try { localStorage.setItem('hi-lang', lang); } catch (e) {}
  await Sfx.unlock(); Sfx.play('select', { vol: .7 }); Sfx.play('whoosh', { vol: .4, delay: .15 });
  applyLang(); await meshTransition(); layout();
  Sfx.ambient(true);
  await wait(250); await buildWithCursors();
  heroNow = 0; layout();
};
if (FAST || qs.get('l')) {
  $('#gate').remove(); document.body.classList.remove('locked'); document.body.classList.add('in'); heroNow = 0; boot().then(() => layout());
} else {
  boot();
  $$('#gate .flag').forEach(f => f.addEventListener('click', () => start(f.dataset.lang)));
}
const bs=$('#btnSwarm'); bs&&bs.addEventListener('click',async()=>{ if(document.body.classList.contains('building'))return; Sfx.play('click'); await buildWithCursors(); layout(); });
window.__hi = { ignite, setProject, ink, ink2, layout };
