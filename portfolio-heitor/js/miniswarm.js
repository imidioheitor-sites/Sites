/* MiniSwarm: enxame rápido de cursores (estilo editor de design multiplayer) que "desenha" os elementos de um bloco.
   Usado nas trocas de projeto da seção 04. O efeito completo (página inteira) é o swarm-build.js do kit. */
const COLORS = ['#F24E1E', '#A259FF', '#1ABCFE', '#0ACF83', '#FFC700', '#E8467C', '#0D99FF', '#FF8A00'];
const NAMES = ['Ada', 'Linus', 'Grace', 'Alan', 'Margaret', 'Ken', 'Hedy', 'Tim', 'Joan', 'Radia'];
const ARROW = c => `<svg width="22" height="22" viewBox="0 0 26 26" fill="none"><path d="M1.5 1.2L1.5 17.6L5.9 13.6L8.6 19.6L11.4 18.3L8.7 12.4L14.4 12.0Z" fill="${c}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

function tween(ms, fn) {
  return new Promise(res => { const t0 = performance.now(); (function f(n) { const k = Math.min(1, (n - t0) / ms); fn(k); k < 1 ? requestAnimationFrame(f) : res(); })(t0); });
}

export class MiniSwarm {
  constructor(layer, opts = {}) { this.layer = layer; this.opts = opts; this.busy = 0; }
  _cursor(i) {
    const c = COLORS[i % COLORS.length], name = NAMES[i % NAMES.length];
    const el = document.createElement('div'); el.className = 'mc';
    el.innerHTML = ARROW(c) + `<span style="background:${c}">${name}</span>`;
    this.layer.appendChild(el); return el;
  }
  /* targets: elementos HTML; onHit(el) é chamado quando o cursor "clica" */
  async run(targets, onHit, { sound } = {}) {
    const L = this.layer.getBoundingClientRect(); this.busy++;
    const jobs = targets.map((el, i) => (async () => {
      await wait(i * 70 + rand(0, 90));
      const r = el.getBoundingClientRect();
      const tx = r.left - L.left, ty = r.top - L.top;
      const cur = this._cursor(i);
      const side = Math.random() < .5;
      let x = side ? -30 : L.width + 30, y = rand(0, L.height);
      cur.style.transform = `translate(${x}px,${y}px)`;
      const bend = rand(-90, 90), dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
      await tween(Math.min(620, 220 + d * 0.5), k => {
        const e = ease(k), off = Math.sin(Math.PI * e) * bend;
        cur.style.transform = `translate(${x + dx * e + (-dy / d) * off}px,${y + dy * e + (dx / d) * off}px)`;
      });
      cur.classList.add('press'); sound && sound('bleep', i);
      const box = document.createElement('div'); box.className = 'mbox'; box.innerHTML = '<i></i><i></i><i></i><i></i>';
      Object.assign(box.style, { left: tx + 'px', top: ty + 'px', width: '0px', height: '0px' }); this.layer.appendChild(box);
      const w = Math.min(r.width, L.width - tx), h = Math.min(r.height, L.height - ty);
      await tween(300, k => { const e = easeOut(k); box.style.width = w * e + 'px'; box.style.height = h * e + 'px'; cur.style.transform = `translate(${tx + w * e}px,${ty + h * e}px)`; });
      cur.classList.remove('press'); onHit && onHit(el, i);
      await wait(120); box.remove();
      await tween(380, k => { cur.style.opacity = 1 - k; });
      cur.remove();
    })());
    await Promise.all(jobs); this.busy--;
  }
}
