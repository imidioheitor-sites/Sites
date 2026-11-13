/* Seções novas: foguete (transição), "eu como pessoa" (xadrez, piano, Spotify, frases) e contato com iPhone */
import { Chess } from '../vendor/chess/chess.js';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const CFG = window.SITE_EXTRAS || {};

/* ── foguete na frente: transição Tech → Projetos ── */
const gap = $('#rocketGap');
function rocketLoop() {
  if (!gap) return;
  const r = gap.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight), 0, 1);
  gap.style.setProperty('--rp', p.toFixed(4));
}
addEventListener('scroll', rocketLoop, { passive: true }); rocketLoop();

/* ── Spotify: só aparece com o link da playlist (CFG.spotify) ── */
const sp = $('#spotifyBox');
if (sp && CFG.spotify) sp.innerHTML = `<iframe title="Spotify" style="border:0;border-radius:18px" src="${CFG.spotify}" width="100%" height="352" allow="encrypted-media; clipboard-write" loading="lazy"></iframe>`;

/* ── Piano (Web Audio). Gravação dele: audio/piano.mp3 ── */
(function piano() {
  const box = $('#pianoKeys'); if (!box) return;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'];
  const keysMap = 'awsedftgyhujk'.split('');
  let ctx = null;
  const play = semi => {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume();
    const f = 261.63 * Math.pow(2, semi / 12), t = ctx.currentTime, g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.32, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8); g.connect(ctx.destination);
    [[1, 1], [2, .35], [3, .12]].forEach(([m, a]) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f * m; og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 1.9); });
  };
  let wi = 0; box.innerHTML = names.map((n, s) => { const blk = n.includes('#'); const st = blk ? ` style="left:calc(${wi * 12.5}% - 3.4%)"` : ''; if (!blk) wi++; return `<button class="pk ${blk ? 'blk' : 'wht'}" data-s="${s}" aria-label="${n}"${st}><i>${keysMap[s] || ''}</i></button>`; }).join('');
  const press = b => { b.classList.add('on'); play(+b.dataset.s); setTimeout(() => b.classList.remove('on'), 160); };
  $$('.pk', box).forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); press(b); }));
  addEventListener('keydown', e => { if (e.repeat || e.metaKey || e.ctrlKey || /input|textarea|select/i.test(e.target.tagName)) return; const i = keysMap.indexOf(e.key.toLowerCase()); const ks = $$('.pk', box); if (i >= 0 && ks[i]) press(ks[i]); });
  const rec = $('#pianoRec'), au = new Audio();
  fetch('audio/piano.mp3', { method: 'HEAD' }).then(r => { if (r.ok && /audio/.test(r.headers.get('content-type') || '')) { au.src = 'audio/piano.mp3'; rec.hidden = false; } }).catch(() => {});
  rec.addEventListener('click', () => { if (au.paused) { au.play(); rec.classList.add('on'); } else { au.pause(); rec.classList.remove('on'); } });
  au.addEventListener('ended', () => rec.classList.remove('on'));
})();

/* ── Xadrez: você de brancas contra um motor simples (minimax + poda alfa-beta) ── */
(function chessGame() {
  const host = $('#chessBoard'); if (!host) return;
  const G = new Chess(), U = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }, UW = { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' };
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  let sel = null, last = null, busy = false;
  const status = $('#chessStatus');
  const evalB = () => { let s = 0; for (const row of G.board()) for (const c of row) if (c) { const f = 'abcdefgh'.indexOf(c.square[0]), r = +c.square[1] - 1, mid = 7 - Math.abs(3.5 - f) - Math.abs(3.5 - r); s += (c.color === 'w' ? 1 : -1) * (VAL[c.type] + (c.type === 'k' ? 0 : mid * 4)); } return s; };
  function search(d, a, b, max) {
    if (d === 0 || G.isGameOver()) { if (G.isCheckmate()) return max ? -99999 - d : 99999 + d; return G.isDraw() ? 0 : evalB(); }
    let best = max ? -Infinity : Infinity;
    for (const m of G.moves()) { G.move(m); const v = search(d - 1, a, b, !max); G.undo(); if (max ? v > best : v < best) best = v; if (max) a = Math.max(a, best); else b = Math.min(b, best); if (b <= a) break; }
    return best;
  }
  function engine() {
    let bestV = Infinity, pick = null;
    for (const m of G.moves({ verbose: true })) { G.move(m.san); const v = search(2, -Infinity, Infinity, true) + Math.random() * 14; G.undo(); if (v < bestV) { bestV = v; pick = m; } }
    return pick;
  }
  const over = () => { if (!G.isGameOver()) return false; status.textContent = G.isCheckmate() ? (G.turn() === 'w' ? 'Xeque-mate. O motor venceu.' : 'Xeque-mate. Você venceu!') : 'Empate.'; return true; };
  function draw() {
    const legal = sel ? G.moves({ square: sel, verbose: true }).map(m => m.to) : [];
    host.innerHTML = G.board().map((row, r) => row.map((c, f) => {
      const sq = 'abcdefgh'[f] + (8 - r), dark = (r + f) % 2;
      return `<button class="sq ${dark ? 'd' : 'l'}${sel === sq ? ' sel' : ''}${legal.includes(sq) ? ' mv' : ''}${last && (last.from === sq || last.to === sq) ? ' lm' : ''}" data-sq="${sq}" aria-label="${sq}">${c ? `<span class="${c.color === 'w' ? 'cw' : 'cb'}">${c.color === 'w' ? UW[c.type] : U[c.type]}</span>` : ''}</button>`;
    }).join('')).join('');
    if (!G.isGameOver()) status.textContent = G.inCheck() ? 'Xeque!' : (G.turn() === 'w' ? 'Sua vez (brancas)' : 'O motor está pensando…');
  }
  host.addEventListener('click', async e => {
    const b = e.target.closest('.sq'); if (!b || busy || G.turn() !== 'w' || G.isGameOver()) return;
    const sq = b.dataset.sq, p = G.get(sq);
    if (sel && sel !== sq) {
      let mv = null; try { mv = G.move({ from: sel, to: sq, promotion: 'q' }); } catch (err) { mv = null; }
      if (mv) { last = mv; sel = null; draw(); if (over()) return; busy = true; await new Promise(r => setTimeout(r, 380)); const em = engine(); if (em) last = G.move(em.san); busy = false; draw(); over(); return; }
    }
    sel = p && p.color === 'w' ? sq : null; draw();
  });
  $('#chessNew').addEventListener('click', () => { G.reset(); sel = last = null; busy = false; draw(); });
  draw();
})();

/* ── Frases com efeito "Arrival": camadas vindo em direção à tela (frases do Heitor em CFG.phrases) ── */
(function arrival() {
  const stage = $('#arrival'); if (!stage) return;
  const list = CFG.phrases || []; if (!list.length) { stage.closest('.me-phrases').hidden = true; return; }
  let i = 0;
  const show = () => {
    const el = document.createElement('div'); el.className = 'arr-line'; el.textContent = list[i % list.length]; i++;
    stage.appendChild(el);
    el.animate([{ transform: 'translateZ(-900px) scale(.15)', opacity: 0, filter: 'blur(14px)' }, { opacity: 1, filter: 'blur(0)', offset: .45 }, { transform: 'translateZ(0) scale(1)', opacity: 1, filter: 'blur(0)', offset: .7 }, { transform: 'translateZ(520px) scale(2.4)', opacity: 0, filter: 'blur(10px)' }], { duration: 5200, easing: 'cubic-bezier(.3,.1,.3,1)' }).onfinish = () => el.remove();
  };
  show(); setInterval(show, 3400);
})();
