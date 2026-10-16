/* HEsites · Estudos — lê os JSON de /dados e monta as páginas.
   Nada de conteúdo fica aqui: tudo vem de dados/materias.json e dados/materias/<slug>.json. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="#060E24" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';

  // texto curto com **negrito**, `código` e $latex$ ("US$ 10" não vira fórmula: o $ colado numa letra é ignorado)
  function md(s) {
    let h = esc(s);
    h = h.replace(/(^|[^\w\\])\$([^$\s][^$]*?)\$/g, (_, a, t) => a + tex(t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), false));
    h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
    return h;
  }
  function tex(t, display) {
    if (window.katex) { try { return katex.renderToString(t, { displayMode: display, throwOnError: false }); } catch (e) {} }
    return '<code>' + esc(t) + '</code>';
  }

  // foto (dados: "imagem"); se o arquivo não existir, o bloco some
  const art = (src, cls) => src ? `<figure class="${cls}"><img src="${esc(src)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.remove()"></figure>` : '';

  // armazenamento local (progresso de cada um, só neste navegador)
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('nd:' + k)) || {}; } catch (e) { return {}; } },
    set(k, v) { try { localStorage.setItem('nd:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  // datas
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const when = p => p.data ? new Date(`${p.data}T${p.hora || '09:00'}:00`) : null;
  const dayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysTo = d => Math.round((dayStart(d) - dayStart(new Date())) / 864e5);
  const fmtDate = d => `${SEM[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()]}`;
  const isDone = p => p.status === 'feita' || (when(p) && when(p) < new Date() && p.status !== 'proxima');
  function rel(d) {
    const n = daysTo(d);
    if (n === 0) return 'hoje';
    if (n === 1) return 'amanhã';
    if (n === -1) return 'ontem';
    return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
  }

  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ' ' + r.status);
    return r.json();
  }
  async function loadAll() {
    const idx = await getJSON('/dados/materias.json');
    const mats = await Promise.all(idx.materias.map(s => getJSON(`/dados/materias/${s}.json`).catch(() => null)));
    return { idx, mats: mats.filter(Boolean) };
  }

  function progress(m, p) {
    const st = store.get(m.slug + ':' + p.id);
    const tops = p.topicos || [];
    const ok = tops.filter(t => st.t && st.t[t.titulo]).length;
    return { ok, total: tops.length, pct: tops.length ? Math.round(ok / tops.length * 100) : 0 };
  }
  const nextExam = m => (m.provas || []).filter(p => !isDone(p) && when(p)).sort((a, b) => when(a) - when(b))[0];

  function tick(el, d) {
    const run = () => {
      let ms = Math.max(0, d - new Date());
      const D = Math.floor(ms / 864e5); ms -= D * 864e5;
      const H = Math.floor(ms / 36e5); ms -= H * 36e5;
      const M = Math.floor(ms / 6e4); ms -= M * 6e4;
      const S = Math.floor(ms / 1e3);
      el.querySelectorAll('[data-u]').forEach(b => {
        const v = { d: D, h: H, m: M, s: S }[b.dataset.u];
        b.textContent = String(v).padStart(2, '0');
      });
    };
    run(); return setInterval(run, 1000);
  }
  const countHTML = (cls = 'count') => `<div class="${cls}">${[['d', 'dias'], ['h', 'horas'], ['m', 'min'], ['s', 'seg']].map(([u, l]) => `<div><b data-u="${u}">00</b><span>${l}</span></div>`).join('')}</div>`;

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    document.querySelectorAll('.rv:not(.in)').forEach(el => io.observe(el));
  }
  function nav(mats, active) {
    $('#nav').innerHTML = mats.map(m => `<a href="/m/${m.slug}" class="${m.slug === active ? 'on' : ''}">${esc(m.codigo)}</a>`).join('');
  }
  function fail(e) {
    console.error(e);
    $('#app').innerHTML = `<div class="wrap sec"><div class="empty">Não consegui ler os dados (${esc(e.message)}). Confira o JSON em <code>dados/</code>.</div></div>`;
  }

  /* ───────── Hub ───────── */
  async function hub() {
    const { idx, mats } = await loadAll();
    nav(mats);
    const all = mats.flatMap(m => (m.provas || []).filter(p => !isDone(p) && when(p)).map(p => ({ m, p, d: when(p) }))).sort((a, b) => a.d - b.d);
    const first = all[0];
    $('#app').innerHTML = `
      <section class="hero wrap">
        <span class="eyebrow">${esc(idx.universidade || 'Notre Dame')} · ${esc(idx.semestre || '')}</span>
        <h1 class="rv">Cada prova, <em>um plano</em>.</h1>
        <p class="lead rv">${esc(idx.subtitulo || 'O que cai, o que já domino e o que falta revisar, matéria por matéria.')}</p>
        <div class="next">
          <div class="panel glow rv">
            ${first ? `
              <div class="label">Próxima prova · ${rel(first.d)}</div>
              ${countHTML()}
              <h2>${esc(first.p.nome)} · ${esc(first.m.nome)}</h2>
              <div class="meta">${fmtDate(first.d)}${first.p.hora ? ' · ' + esc(first.p.hora) : ''}${first.p.local ? ' · ' + esc(first.p.local) : ''}</div>
              <div style="margin-top:18px"><a class="btn" href="/m/${first.m.slug}#${first.p.id}">Estudar agora →</a></div>
            ` : `<div class="label">Nenhuma prova marcada</div><h2 style="margin-top:12px">Agenda livre.</h2>`}
          </div>
          <div class="panel rv">
            <div class="label">Agenda</div>
            <ul class="agenda">${all.slice(0, 6).map(({ m, p, d }) => `
              <li><a href="/m/${m.slug}#${p.id}">
                <span class="d">${d.getDate()}<small>${MES[d.getMonth()]}</small></span>
                <span class="t">${esc(p.nome)}<small>${esc(m.codigo)} · ${esc(m.nome)}</small></span>
                <span class="chip ${daysTo(d) <= 3 ? 'rose' : daysTo(d) <= 7 ? 'amber' : ''}">${rel(d)}</span>
              </a></li>`).join('') || '<li class="label" style="padding:10px 8px">Sem provas futuras.</li>'}
            </ul>
          </div>
        </div>
      </section>
      <section class="sec wrap">
        <div class="sec-h"><div><h2>Matérias</h2><p>${mats.length} neste semestre</p></div></div>
        <div class="grid">${mats.map(m => {
          const p = nextExam(m); const pr = p ? progress(m, p) : null;
          return `<a class="mcard rv ${m.imagem ? 'has-art' : ''}" href="/m/${m.slug}" style="--c:${esc(m.cor || '#7C5CFF')}">
            ${art(m.imagem, 'art')}
            <div><span class="code">${esc(m.codigo)}</span>${m.exemplo ? ' <span class="chip ghost">exemplo</span>' : ''}<h3>${esc(m.nome)}</h3></div>
            ${p ? `<div><div class="row" style="margin-bottom:8px"><small>${esc(p.nome)} · ${fmtDate(when(p))}</small><small>${pr.ok}/${pr.total}</small></div><div class="bar"><i data-w="${pr.pct}"></i></div></div>` : `<small style="color:var(--muted)">Sem prova marcada</small>`}
            <div class="row"><small>${esc(m.professor || '')}</small><span class="chip">${p ? rel(when(p)) : '—'}</span></div>
          </a>`;
        }).join('')}</div>
      </section>`;
    if (first) tick($('.count'), first.d);
    requestAnimationFrame(() => document.querySelectorAll('.bar i').forEach(i => i.style.width = i.dataset.w + '%'));
    reveal();
  }

  /* ───────── Matéria ───────── */
  async function materia() {
    const slug = (location.pathname.match(/\/m\/([^/]+)/) || [])[1] || new URLSearchParams(location.search).get('m');
    const { idx, mats } = await loadAll();
    nav(mats, slug);
    const m = mats.find(x => x.slug === slug);
    if (!m) { $('#app').innerHTML = `<div class="wrap sec"><div class="empty">Matéria não encontrada. <a href="/">Voltar</a></div></div>`; return; }
    document.title = `${m.codigo} · ${m.nome} — HEsites Estudos`;
    document.documentElement.style.setProperty('--accent', m.cor || '#7C5CFF');
    const provas = m.provas || [];
    const pick = provas.find(p => p.id === location.hash.slice(1)) || nextExam(m) || provas[provas.length - 1];

    $('#app').innerHTML = `
      <section class="mhero wrap">
        <a class="back" href="/">← Todas as matérias</a>
        ${art(m.imagem, 'art')}
        <span class="code">${esc(m.codigo)}${m.exemplo ? ' <span class="chip ghost">exemplo</span>' : ''}</span>
        <h1>${esc(m.nome)}</h1>
        ${m.resumo ? `<p>${md(m.resumo)}</p>` : ''}
        <div class="facts">
          ${m.professor ? `<span class="chip ghost">${esc(m.professor)}</span>` : ''}
          ${m.creditos ? `<span class="chip ghost">${esc(m.creditos)} créditos</span>` : ''}
          ${(m.links || []).map(l => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.titulo)} ↗</a>`).join('')}
        </div>
        <div class="tabs" role="tablist">${provas.map(p => `<button data-id="${esc(p.id)}" class="${p === pick ? 'on' : ''}"><span class="dot ${isDone(p) ? 'done' : ''}"></span>${esc(p.nome)}</button>`).join('')}</div>
      </section>
      <section class="wrap" id="exam"></section>`;
    $('.tabs').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
      history.replaceState(null, '', '#' + b.dataset.id);
      exam(m, provas.find(p => p.id === b.dataset.id));
    });
    if (pick) exam(m, pick); else $('#exam').innerHTML = '<div class="empty">Nenhuma prova cadastrada ainda.</div>';
  }

  let timer;
  function exam(m, p) {
    clearInterval(timer);
    const key = m.slug + ':' + p.id;
    const st = Object.assign({ t: {}, p: {}, k: {}, q: null }, store.get(key));
    const save = () => store.set(key, st);
    const d = when(p);
    const done = isDone(p);
    const sections = [];
    let n = 0;
    const H = (t, extra = '') => `<h2><span class="n">${String(++n).padStart(2, '0')}</span>${t}${extra}</h2>`;

    if (p.foco) sections.push(`<div class="block rv">${H('O que cai')}<div class="focus">${md(p.foco)}</div></div>`);
    if ((p.topicos || []).length) sections.push(`<div class="block rv">${H('Tópicos', ' <span class="chip ghost" id="tcount"></span>')}<div class="topics">${p.topicos.map((t, i) => `
      <details class="topic ${st.t[t.titulo] ? 'ok' : ''}" data-i="${i}">
        <summary><button class="chk" aria-label="Marcar como dominado">${CHECK}</button><h3>${md(t.titulo)}</h3>${t.peso ? `<span class="chip ${t.peso === 'alto' ? 'rose' : t.peso === 'medio' ? 'amber' : 'ghost'}">${esc(t.peso)}</span>` : ''}</summary>
        <div class="tb">${t.resumo ? `<p>${md(t.resumo)}</p>` : ''}${(t.pontos || []).length ? `<ul>${t.pontos.map(x => `<li>${md(x)}</li>`).join('')}</ul>` : ''}${t.exemplo ? `<div class="ex">${md(t.exemplo)}</div>` : ''}</div>
      </details>`).join('')}</div></div>`);
    if ((p.formulas || []).length) sections.push(`<div class="block rv">${H('Fórmulas e regras')}<div class="formulas">${p.formulas.map(f => `
      <div class="formula"><h4>${esc(f.nome)}</h4><div class="expr">${f.latex ? tex(f.latex, true) : md(f.expr || '')}</div>${f.quando ? `<p>${md(f.quando)}</p>` : ''}</div>`).join('')}</div></div>`);
    if ((p.flashcards || []).length) sections.push(`<div class="block rv">${H('Flashcards')}<div class="deck" id="deck"></div></div>`);
    if ((p.questoes || []).length) sections.push(`<div class="block rv">${H('Simulado')}<div class="quiz" id="quiz"></div></div>`);
    if ((p.plano || []).length) sections.push(`<div class="block rv">${H('Plano de estudo')}<ul class="plan">${p.plano.map((x, i) => {
      const today = x.dia && daysTo(new Date(x.dia + 'T12:00:00')) === 0;
      return `<li data-i="${i}" class="${st.p[i] ? 'ok' : ''} ${today ? 'today' : ''}"><span class="pt">${CHECK}</span><div><div class="when">${x.dia ? (today ? 'hoje · ' : '') + fmtDate(new Date(x.dia + 'T12:00:00')) : 'livre'}</div><div class="what">${md(x.tarefa)}</div></div></li>`;
    }).join('')}</ul></div>`);
    if ((p.dicas || []).length) sections.push(`<div class="block rv">${H('Dicas')}<ul class="tips">${p.dicas.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>`);

    $('#exam').innerHTML = `<div class="exam">
      <div>${art(p.imagem, 'exam-art')}${sections.join('') || '<div class="empty">Conteúdo desta prova ainda não foi preenchido.</div>'}</div>
      <aside class="side">
        <div class="panel glow">
          <div class="label">${done ? 'Prova feita' : d ? 'Faltam' : 'Sem data'}</div>
          ${!done && d ? `<div class="minicount">${[['d', 'dias'], ['h', 'h'], ['m', 'min'], ['s', 'seg']].map(([u, l]) => `<div><b data-u="${u}">00</b><span>${l}</span></div>`).join('')}</div>` : ''}
          ${done && p.nota != null ? `<div class="score">${esc(p.nota)}</div>` : ''}
          <dl class="kv" style="margin-top:16px">
            ${d ? `<dt>Data</dt><dd>${fmtDate(d)}${p.hora ? ' · ' + esc(p.hora) : ''}</dd>` : ''}
            ${p.local ? `<dt>Local</dt><dd>${esc(p.local)}</dd>` : ''}
            ${p.peso != null ? `<dt>Peso</dt><dd>${esc(p.peso)}% da nota</dd>` : ''}
            ${p.formato ? `<dt>Formato</dt><dd>${md(p.formato)}</dd>` : ''}
            ${p.permitido ? `<dt>Pode levar</dt><dd>${md(p.permitido)}</dd>` : ''}
          </dl>
        </div>
        ${(p.topicos || []).length ? `<div class="panel ring">
          <svg viewBox="0 0 100 100"><defs><linearGradient id="gr"><stop offset="0" stop-color="#7C5CFF"/><stop offset="1" stop-color="#3DDC97"/></linearGradient></defs><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42" stroke-dasharray="263.9" stroke-dashoffset="263.9"/></svg>
          <div><b id="pct">0%</b><span>dos tópicos dominados</span></div>
        </div>` : ''}
      </aside>
    </div>`;
    if (!done && d) timer = tick($('.minicount'), d);

    // tópicos
    const ring = () => {
      const tot = (p.topicos || []).length; if (!tot) return;
      const ok = p.topicos.filter(t => st.t[t.titulo]).length;
      const pct = Math.round(ok / tot * 100);
      $('#pct').textContent = pct + '%';
      $('.ring .fg').style.strokeDashoffset = 263.9 * (1 - pct / 100);
      $('#tcount').textContent = `${ok}/${tot}`;
    };
    document.querySelectorAll('.topic .chk').forEach(b => b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const el = b.closest('.topic'); const t = p.topicos[+el.dataset.i].titulo;
      st.t[t] = !st.t[t]; if (!st.t[t]) delete st.t[t];
      el.classList.toggle('ok', !!st.t[t]); save(); ring();
    }));
    requestAnimationFrame(ring);

    // plano
    document.querySelectorAll('.plan li').forEach(li => li.addEventListener('click', () => {
      const i = li.dataset.i; st.p[i] = !st.p[i]; if (!st.p[i]) delete st.p[i];
      li.classList.toggle('ok', !!st.p[i]); save();
    }));

    if ($('#deck')) deck(p.flashcards, st, save);
    if ($('#quiz')) quiz(p.questoes, st, save);
    reveal();
  }

  function deck(cards, st, save) {
    const el = $('#deck');
    let only = false, order = cards.map((_, i) => i), at = 0;
    const known = () => cards.filter(c => st.k[c.frente] === 1).length;
    const draw = () => {
      const list = only ? order.filter(i => st.k[cards[i].frente] !== 1) : order;
      if (!list.length) { el.innerHTML = `<div class="empty">Você marcou todos como sabidos. <button class="btn ghost" id="rs">Recomeçar</button></div>`; $('#rs').onclick = () => { st.k = {}; save(); only = false; at = 0; draw(); }; return; }
      at = Math.min(at, list.length - 1);
      const c = cards[list[at]];
      el.innerHTML = `
        <div class="flash" tabindex="0"><div class="in">
          <div class="f"><strong>${md(c.frente)}</strong><small>toque para virar</small></div>
          <div class="b"><p>${md(c.verso)}</p><small>resposta</small></div>
        </div></div>
        <div class="ctrl">
          <button class="btn ghost" data-a="prev" ${at === 0 ? 'disabled' : ''}>←</button>
          <span class="counter">${at + 1} / ${list.length}</span>
          <button class="btn ghost" data-a="next" ${at === list.length - 1 ? 'disabled' : ''}>→</button>
          <span class="sp"></span>
          <button class="btn rose" data-a="no">Revisar</button>
          <button class="btn mint" data-a="yes">Sabia</button>
        </div>
        <div class="ctrl"><span class="counter">${known()} de ${cards.length} sabidos</span><span class="sp"></span>
          <button class="btn ghost" data-a="shuf">Embaralhar</button>
          <button class="btn ghost" data-a="only">${only ? 'Mostrar todos' : 'Só os que faltam'}</button></div>`;
      const f = $('.flash', el);
      f.onclick = () => f.classList.toggle('flip');
      f.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); f.classList.toggle('flip'); } if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a, c, list));
    };
    const go = s => { at += s; draw(); $('.flash', el)?.focus({ preventScroll: true }); };
    const act = (a, c, list) => {
      if (a === 'prev') go(-1);
      if (a === 'next') go(1);
      if (a === 'yes' || a === 'no') { st.k[c.frente] = a === 'yes' ? 1 : 0; save(); if (!only || a === 'no') at = Math.min(at + 1, list.length - 1); draw(); }
      if (a === 'shuf') { order.sort(() => Math.random() - .5); at = 0; draw(); }
      if (a === 'only') { only = !only; at = 0; draw(); }
    };
    draw();
  }

  function quiz(qs, st, save) {
    const el = $('#quiz');
    let i = 0, hits = 0;
    const L = 'ABCDEFGH';
    const start = () => { i = 0; hits = 0; q(); };
    const q = () => {
      if (i >= qs.length) {
        const best = Math.max(hits, (st.q && st.q.best) || 0); st.q = { best, last: hits }; save();
        el.innerHTML = `<div class="label">Resultado</div><div class="score">${hits}/${qs.length}</div><p style="color:var(--muted)">Melhor até agora: ${best}/${qs.length}</p><button class="btn" id="again">Fazer de novo</button>`;
        $('#again').onclick = start; return;
      }
      const x = qs[i];
      el.innerHTML = `<div class="ctrl"><span class="label">Questão ${i + 1} de ${qs.length}</span><span class="sp"></span>${st.q ? `<span class="counter">melhor: ${st.q.best}/${qs.length}</span>` : ''}</div>
        <div class="q">${md(x.pergunta)}</div>
        <div class="opts">${x.opcoes.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${L[k]}</span><span>${md(o)}</span></button>`).join('')}</div>
        <div class="why">${md(x.explicacao || '')}</div>
        <div class="ctrl" style="margin-top:14px"><span class="sp"></span><button class="btn" id="nx" disabled>${i === qs.length - 1 ? 'Ver resultado' : 'Próxima →'}</button></div>`;
      el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const k = +b.dataset.k;
        if (k === x.correta) hits++;
        el.querySelectorAll('.opt').forEach(o => { o.disabled = true; if (+o.dataset.k === x.correta) o.classList.add('right'); });
        if (k !== x.correta) b.classList.add('wrong');
        if (x.explicacao) $('.why', el).classList.add('show');
        $('#nx', el).disabled = false;
      });
      $('#nx', el).onclick = () => { i++; q(); };
    };
    start();
  }

  const page = document.body.dataset.page;
  (page === 'materia' ? materia : hub)().catch(fail);
})();
