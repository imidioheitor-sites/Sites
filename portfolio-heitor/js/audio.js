/* Biblioteca de áudio do site (24 sons em audio/*.mp3, sintetizados para este projeto).
   Uso: Sfx.play('click'), Sfx.note(i), Sfx.ambient(true). Sons carregam depois do 1º clique (política do navegador).
   Catálogo em audio/LIBRARY.md. Para adicionar suas falas: coloque um .mp3 em audio/ e chame Sfx.play('nome-do-arquivo'). */
export const Sfx = (() => {
  const NAMES = ['click','hover','tick','pop','whoosh','swipe','riser','ignite','sparkle','glitch','bleep','build','select','whooshdown','stinger','ambient',
                 'note1','note2','note3','note4','note5','note6','note7','note8'];
  let ctx = null, master = null, on = true, ready = false, ambSrc = null, ambGain = null;
  const buffers = {};
  try { on = localStorage.getItem('hi-sound') !== 'off'; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
    return ctx;
  }
  async function load(name) {
    if (buffers[name] || !ctx) return buffers[name];
    try {
      const r = await fetch('audio/' + name + '.mp3');
      const ab = await r.arrayBuffer();
      buffers[name] = await ctx.decodeAudioData(ab);
    } catch (e) { buffers[name] = null; }
    return buffers[name];
  }
  async function unlock() {
    ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) {} }
    if (!ready) { ready = true; await Promise.all(NAMES.filter(n => n !== 'ambient').map(load)); }
  }
  function play(name, o = {}) {
    if (!ctx || !on) return;
    const b = buffers[name];
    if (!b) { if (!(name in buffers)) load(name).then(() => play(name, o)); return; }
    const s = ctx.createBufferSource(); s.buffer = b;
    if (o.rate) s.playbackRate.value = o.rate;
    const g = ctx.createGain(); g.gain.value = o.vol == null ? 0.6 : o.vol;
    let node = g;
    if (o.pan != null && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); node = p; }
    s.connect(g); node.connect(master); s.start(ctx.currentTime + (o.delay || 0));
  }
  function note(i, o = {}) { play('note' + (1 + ((i % 8) + 8) % 8), Object.assign({ vol: 0.5 }, o)); }
  async function ambient(start) {
    if (!ctx) return;
    if (start) {
      if (ambSrc) return;
      const b = await load('ambient'); if (!b) return;
      ambSrc = ctx.createBufferSource(); ambSrc.buffer = b; ambSrc.loop = true;
      ambGain = ctx.createGain(); ambGain.gain.value = 0; ambGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 3);
      ambSrc.connect(ambGain); ambGain.connect(master); ambSrc.start();
    } else if (ambSrc) {
      ambGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); const s = ambSrc; ambSrc = null; setTimeout(() => { try { s.stop(); } catch (e) {} }, 1200);
    }
  }
  function setOn(v) {
    on = !!v;
    try { localStorage.setItem('hi-sound', on ? 'on' : 'off'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05);
  }
  return { unlock, play, note, ambient, setOn, get on() { return on; }, names: NAMES };
})();
window.Sfx = Sfx;
