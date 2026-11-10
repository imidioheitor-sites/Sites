/* Simulação de câmara de nuvem: trilhas de condensação de múons (retas e longas), partículas alfa (curtas e grossas)
   e elétrons (curvas). Fica por cima do quadro real do vídeo do 1º múon. */
export function initMuon(canvas, { onHit } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1, tracks = [], count = 0, vis = true, last = performance.now(), nextAuto = last + 1200;
  function rs() { const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = Math.max(2, r.width); H = Math.max(2, r.height); canvas.width = W * dpr; canvas.height = H * dpr; }
  rs(); if (window.ResizeObserver) new ResizeObserver(rs).observe(canvas); else addEventListener('resize', rs);
  if ('IntersectionObserver' in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(canvas);
  const rnd = (a, b) => a + Math.random() * (b - a);

  function spawn(kind, hero) {
    const t = { kind, born: performance.now(), pts: [], drops: [], hero: !!hero };
    if (kind === 'muon') {
      const x0 = rnd(0.05, 0.95) * W, y0 = rnd(-0.05, 0.25) * H;
      const ang = Math.PI / 2 + rnd(-0.75, 0.75), len = rnd(0.7, 1.25) * Math.hypot(W, H) * 0.7;
      const N = 60;
      for (let i = 0; i <= N; i++) { const s = i / N; t.pts.push([x0 + Math.cos(ang) * len * s + rnd(-0.6, 0.6), y0 + Math.sin(ang) * len * s + rnd(-0.6, 0.6)]); }
      t.speed = 0.0012; t.life = 2600; t.w = hero ? 2.4 : 1.4;
    } else if (kind === 'alpha') {
      const x0 = rnd(0.1, 0.9) * W, y0 = rnd(0.1, 0.9) * H, ang = rnd(0, Math.PI * 2), len = rnd(0.06, 0.13) * W;
      for (let i = 0; i <= 14; i++) { const s = i / 14; t.pts.push([x0 + Math.cos(ang) * len * s + rnd(-1, 1), y0 + Math.sin(ang) * len * s + rnd(-1, 1)]); }
      t.speed = 0.0028; t.life = 1500; t.w = 3.6;
    } else {
      let x = rnd(0.1, 0.9) * W, y = rnd(0.1, 0.9) * H, a = rnd(0, 6.28), v = rnd(2.4, 3.4);
      for (let i = 0; i < 60; i++) { t.pts.push([x, y]); a += 0.09 + i * 0.004; v *= 0.985; x += Math.cos(a) * v; y += Math.sin(a) * v; }
      t.speed = 0.0018; t.life = 1700; t.w = 1.1;
    }
    for (let i = 0; i < t.pts.length; i++) for (let k = 0; k < 2; k++) t.drops.push([i, rnd(-5, 5), rnd(-5, 5), rnd(0.4, 1.6)]);
    tracks.push(t);
    if (kind === 'muon' && hero) { count++; onHit && onHit(count); }
    return t;
  }
  function trigger() { spawn('muon', true); setTimeout(() => spawn('alpha'), 150); }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis) { last = now; return; }
    if (now > nextAuto) { const r = Math.random(); spawn(r < 0.5 ? 'muon' : r < 0.75 ? 'alpha' : 'beta'); nextAuto = now + rnd(900, 2600); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    tracks = tracks.filter(t => now - t.born < t.life);
    for (const t of tracks) {
      const age = now - t.born, prog = Math.min(1, age * t.speed), fade = Math.max(0, 1 - Math.max(0, age - t.life * 0.35) / (t.life * 0.65));
      const n = Math.floor(prog * (t.pts.length - 1)); if (n < 1) continue;
      const spread = 1 + age / t.life * 3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // halo de vapor
      ctx.strokeStyle = `rgba(160,255,240,${0.16 * fade})`; ctx.lineWidth = t.w * (3 + spread * 2); ctx.beginPath(); ctx.moveTo(t.pts[0][0], t.pts[0][1]);
      for (let i = 1; i <= n; i++) ctx.lineTo(t.pts[i][0], t.pts[i][1]); ctx.stroke();
      ctx.strokeStyle = `rgba(235,255,252,${(t.hero ? 0.95 : 0.7) * fade})`; ctx.lineWidth = t.w * spread * 0.7; ctx.beginPath(); ctx.moveTo(t.pts[0][0], t.pts[0][1]);
      for (let i = 1; i <= n; i++) ctx.lineTo(t.pts[i][0], t.pts[i][1]); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.7 * fade})`;
      for (const d of t.drops) { if (d[0] > n) continue; const p = t.pts[d[0]]; ctx.beginPath(); ctx.arc(p[0] + d[1] * spread, p[1] + d[2] * spread, d[3], 0, 6.283); ctx.fill(); }
      if (t.hero && age < 700) { const p = t.pts[Math.min(n, t.pts.length - 1)]; ctx.strokeStyle = `rgba(20,224,196,${1 - age / 700})`; ctx.lineWidth = 1.5; ctx.strokeRect(p[0] - 24, p[1] - 24, 48, 48); }
    }
  }
  requestAnimationFrame(frame);
  return { trigger, get count() { return count; } };
}
