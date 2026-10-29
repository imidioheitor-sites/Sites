// Detalhes de movimento do painel: contagem dos números e entrada dos cartões. Sem dependências; respeita reduced-motion.
(function () {
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduz) return;
  const alvos = ['gpaAcum', 'gpaProj', 'gpaSem', 'creditos', 'simSem', 'simAcum'];
  function contar(el) {
    const txt = el.textContent.trim();
    const m = txt.match(/^(-?\d+(?:[.,]\d+)?)$/);
    if (!m) return;
    const fim = parseFloat(m[1].replace(',', '.'));
    const dec = (m[1].split(/[.,]/)[1] || '').length;
    const sep = m[1].includes(',') ? ',' : '.';
    if (el._escrito === txt) return;
    el._final = txt; el._id = (el._id || 0) + 1; const id = el._id;
    const t0 = performance.now();
    (function passo(t) {
      const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
      if (id !== el._id) return;
      const v = k < 1 ? (fim * e).toFixed(dec).replace('.', sep) : txt;
      el._escrito = v; el.textContent = v;
      if (k < 1) requestAnimationFrame(passo);
    })(t0);
  }
  const obs = new MutationObserver((l) => l.forEach((r) => { const el = r.target.nodeType === 3 ? r.target.parentElement : r.target; if (el && alvos.includes(el.id) && el.textContent !== el._escrito) contar(el); }));
  alvos.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el, { childList: true, characterData: true, subtree: true }); });
})();
