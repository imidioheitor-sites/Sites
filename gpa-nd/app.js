// Interface do painel: abas, edição das matérias, simulações e o bot.
const { PONTOS, LETRAS, situacao, resumo, precisaPara, precisaMeta, sugestoes, contexto, fmt, letraPorPontos } = GPA;
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETRAS_EXTRA = ['P', 'S', 'U', 'W', 'I'];

let dados = null;
let simulacao = {};
let historico = [];
let temIA = false;
let modoLocal = false; // sem servidor Node (ex.: Vercel): as notas ficam no localStorage do navegador
const CHAVE = 'gpa-nd-notas';

async function carregar() {
  try { const r = await fetch('/api/notas'); if (r.ok) return await r.json(); } catch {}
  modoLocal = true;
  try { const s = localStorage.getItem(CHAVE); if (s) return JSON.parse(s); } catch {}
  return (await fetch('/notas.exemplo.json')).json();
}

async function iniciar() {
  dados = await carregar();
  const st = await fetch('/api/status').then((r) => r.json()).catch(() => ({}));
  temIA = st.ia;
  $('#seloIA').textContent = temIA ? 'IA' : 'regras';
  $('#seloIA').classList.toggle('on', temIA);
  if (modoLocal) $('#ondeSalva').textContent = 'Suas notas ficam salvas só neste navegador. Use Exportar para guardar uma cópia.';
  ligarAbas();
  ligarSimulador();
  ligarBot();
  ligarDados();
  render();
}

async function salvar() {
  if (modoLocal) { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch {} }
  else await fetch('/api/notas', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dados) });
  render();
}

function ligarAbas() {
  document.querySelectorAll('.abas button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.abas button, .aba').forEach((x) => x.classList.remove('ativa'));
    b.classList.add('ativa');
    $('#aba-' + b.dataset.aba).classList.add('ativa');
    window.scrollTo(0, 0);
  }));
}

function render() {
  const r = resumo(dados);
  $('#saudacao').textContent = dados.aluno ? `Olá, ${dados.aluno}` : 'Meu GPA';
  $('#semestreAtual').textContent = r.atual ? r.atual.nome : 'sem semestre atual';
  $('#gpaAcum').textContent = fmt(r.acum.gpa);
  $('#gpaProj').textContent = fmt(r.proj.gpa);
  $('#gpaSem').textContent = fmt(r.semAtual?.gpa);
  $('#creditos').textContent = `${r.creditosFeitos}/${dados.creditosParaFormar || 120}`;

  const meta = +dados.metaGPA || 0;
  $('#barraMeta').style.width = `${((r.acum.gpa || 0) / 4) * 100}%`;
  $('#marcaMeta').style.left = `${(meta / 4) * 100}%`;
  $('#marcaMeta').hidden = !meta;
  if (meta && r.acum.gpa !== null) {
    const d = r.acum.gpa - meta;
    $('#legendaMeta').textContent = d >= 0 ? `${d.toFixed(2)} acima da meta de ${meta.toFixed(2)}` : `${Math.abs(d).toFixed(2)} abaixo da meta de ${meta.toFixed(2)}`;
  } else $('#legendaMeta').textContent = 'Defina uma meta na aba Simular.';

  renderGrafico(r);
  renderAtuais(r);
  $('#sugestoes').innerHTML = sugestoes(dados).map((s) => `<li class="sug ${s.tipo}"><span class="ponto"></span><p>${esc(s.texto)}</p></li>`).join('');
  renderSemestres();
  renderSimulador();
}

function renderGrafico(r) {
  const pts = r.porSemestre.filter((s) => s.gpa !== null);
  if (!pts.length) return ($('#grafico').innerHTML = '<p class="legenda">Sem dados ainda.</p>');
  const L = 320, A = 140, m = 24, min = Math.max(0, Math.floor((Math.min(...pts.map((p) => p.gpa)) - 0.3) * 2) / 2), max = 4;
  const x = (i) => (pts.length === 1 ? L / 2 : m + (i * (L - 2 * m)) / (pts.length - 1));
  const y = (g) => A - 22 - ((g - min) / (max - min)) * (A - 40);
  const linhas = [min, (min + max) / 2, max].map((g) => `<line x1="${m}" x2="${L - m}" y1="${y(g)}" y2="${y(g)}" class="grade"/><text x="2" y="${y(g) + 4}" class="eixo">${g.toFixed(1)}</text>`).join('');
  const meta = +dados.metaGPA;
  const linhaMeta = meta && meta >= min ? `<line x1="${m}" x2="${L - m}" y1="${y(meta)}" y2="${y(meta)}" class="meta"/>` : '';
  const caminho = pts.filter((p) => !p.atual).map((p, i) => `${i ? 'L' : 'M'}${x(pts.indexOf(p))},${y(p.gpa)}`).join(' ');
  const ultimoFechado = pts.filter((p) => !p.atual).pop();
  const atual = pts.find((p) => p.atual);
  const tracejado = atual && ultimoFechado ? `<path d="M${x(pts.indexOf(ultimoFechado))},${y(ultimoFechado.gpa)} L${x(pts.indexOf(atual))},${y(atual.gpa)}" class="proj"/>` : '';
  const pontos = pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.gpa)}" r="4.5" class="${p.atual ? 'p-proj' : 'p'}"/><text x="${x(i)}" y="${y(p.gpa) - 10}" class="val">${p.gpa.toFixed(2)}</text><text x="${x(i)}" y="${A - 4}" class="eixo meio">${esc(p.nome.replace(/(Fall|Spring|Summer)\s?/, (s) => s[0] + ' '))}</text>`).join('');
  $('#grafico').innerHTML = `<svg viewBox="0 0 ${L} ${A}" role="img" aria-label="GPA por semestre">${linhas}${linhaMeta}<path d="${caminho}" class="linha-gpa"/>${tracejado}${pontos}</svg>`;
}

function renderAtuais(r) {
  const lista = r.atual ? r.atual.materias.filter((m) => !situacao(m).final) : [];
  $('#listaAtuais').innerHTML = lista.length ? lista.map((m) => {
    const s = situacao(m);
    const pct = s.pct != null ? s.pct : 0;
    return `<li class="item" data-cod="${esc(m.codigo)}">
      <div class="item-topo"><div><strong>${esc(m.codigo)}</strong><span class="sub">${esc(m.nome)} · ${m.creditos} cr</span></div>
      <div class="nota-pill ${classeLetra(s.letraPct)}">${s.pct != null ? s.letraPct : '—'}</div></div>
      <div class="progresso"><div style="width:${Math.min(pct, 100)}%"></div></div>
      <span class="sub">${s.pct != null ? `${s.pct.toFixed(1)}% em ${s.pesoFeito}% da nota avaliada` : 'Nenhuma nota lançada'}</span>
    </li>`;
  }).join('') : '<li class="legenda">Nenhuma matéria em andamento.</li>';
  document.querySelectorAll('#listaAtuais .item').forEach((li) => li.addEventListener('click', () => {
    const sem = dados.semestres.find((s) => s.atual);
    abrirMateria(sem, sem.materias.findIndex((m) => m.codigo === li.dataset.cod));
  }));
}

const classeLetra = (l) => (!l ? '' : l[0] === 'A' ? 'a' : l[0] === 'B' ? 'b' : l[0] === 'C' ? 'c' : 'd');

function renderSemestres() {
  $('#semestres').innerHTML = [...dados.semestres].map((s, si) => ({ s, si })).reverse().map(({ s, si }) => {
    const g = GPA.somar(s.materias, true).gpa;
    return `<div class="cartao">
      <div class="linha"><p class="titulo-cartao">${esc(s.nome)} ${s.atual ? '<span class="tag">atual</span>' : ''}</p><span class="gpa-sem">${fmt(g)}</span></div>
      <ul class="lista">${s.materias.map((m, mi) => {
        const st = situacao(m);
        const txt = st.final ? m.nota : st.pct != null ? `${st.pct.toFixed(0)}%` : '—';
        return `<li class="item compacto" data-s="${si}" data-m="${mi}"><div><strong>${esc(m.codigo)}</strong><span class="sub">${esc(m.nome)} · ${m.creditos} cr</span></div><div class="nota-pill ${st.final ? classeLetra(m.nota) : 'pendente'}">${esc(txt)}</div></li>`;
      }).join('')}</ul>
      <div class="linha botoes"><button class="botao secundario" data-add="${si}">+ Matéria</button><button class="botao fantasma" data-edit-sem="${si}">Editar semestre</button></div>
    </div>`;
  }).join('');
  document.querySelectorAll('#semestres .item').forEach((li) => li.addEventListener('click', () => abrirMateria(dados.semestres[li.dataset.s], +li.dataset.m)));
  document.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => abrirMateria(dados.semestres[b.dataset.add], -1)));
  document.querySelectorAll('[data-edit-sem]').forEach((b) => b.addEventListener('click', () => abrirSemestre(+b.dataset.editSem)));
}

// Folha de edição de uma matéria (mi = -1 cria uma nova).
function abrirMateria(sem, mi) {
  const nova = mi < 0;
  const m = nova ? { codigo: '', nome: '', creditos: 3, nota: null, avaliacoes: [] } : JSON.parse(JSON.stringify(sem.materias[mi]));
  const opcoes = ['<option value="">Em andamento</option>', ...[...LETRAS, ...LETRAS_EXTRA].map((l) => `<option ${m.nota === l ? 'selected' : ''}>${l}</option>`)].join('');
  const linhaAv = (a = { nome: '', peso: '', nota: '' }) => `<div class="av"><input placeholder="Avaliação" value="${esc(a.nome)}" class="av-nome"><input placeholder="Peso %" type="number" inputmode="decimal" value="${a.peso ?? ''}" class="av-peso"><input placeholder="Nota %" type="number" inputmode="decimal" value="${a.nota ?? ''}" class="av-nota"><button type="button" class="x" aria-label="Remover">×</button></div>`;
  const f = $('#formFolha');
  f.innerHTML = `
    <div class="folha-topo"><h2>${nova ? 'Nova matéria' : esc(m.codigo)}</h2><button value="cancelar" class="botao fantasma">Fechar</button></div>
    <label>Código<input name="codigo" value="${esc(m.codigo)}" placeholder="ECON 30010" required></label>
    <label>Nome<input name="nome" value="${esc(m.nome)}" placeholder="Intermediate Microeconomics"></label>
    <div class="grade2"><label>Créditos<input name="creditos" type="number" min="0" step="0.5" value="${m.creditos}"></label>
    <label>Nota final<select name="nota">${opcoes}</select></label></div>
    <div id="blocoAv" ${m.nota ? 'hidden' : ''}>
      <p class="rotulo">Avaliações (peso e nota em %)</p>
      <div id="avs">${(m.avaliacoes || []).map(linhaAv).join('')}</div>
      <button type="button" class="botao secundario" id="addAv">+ Avaliação</button>
      <label>Letra esperada (opcional, para projeção)<select name="esperada"><option value="">Calcular pela %</option>${LETRAS.map((l) => `<option ${m.esperada === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="linha botoes">${nova ? '' : '<button type="button" class="botao perigo" id="apagar">Apagar</button>'}<button value="salvar" class="botao">Salvar</button></div>`;
  f.querySelector('[name=nota]').addEventListener('change', (e) => ($('#blocoAv').hidden = !!e.target.value));
  $('#addAv').addEventListener('click', () => $('#avs').insertAdjacentHTML('beforeend', linhaAv()));
  f.addEventListener('click', (e) => { if (e.target.classList.contains('x')) e.target.parentElement.remove(); });
  $('#apagar')?.addEventListener('click', () => { if (confirm('Apagar esta matéria?')) { sem.materias.splice(mi, 1); $('#folha').close(); salvar(); } });
  $('#folha').onclose = () => {
    if ($('#folha').returnValue !== 'salvar') return;
    const fd = new FormData(f);
    const num = (v) => (v === '' || v == null ? null : +v);
    const out = {
      codigo: fd.get('codigo').trim(), nome: fd.get('nome').trim(), creditos: +fd.get('creditos') || 0, nota: fd.get('nota') || null,
      avaliacoes: [...f.querySelectorAll('.av')].map((d) => ({ nome: d.querySelector('.av-nome').value.trim(), peso: num(d.querySelector('.av-peso').value), nota: num(d.querySelector('.av-nota').value) })).filter((a) => a.nome || a.peso),
    };
    if (fd.get('esperada')) out.esperada = fd.get('esperada');
    if (m.cortes) out.cortes = m.cortes;
    if (nova) sem.materias.push(out); else sem.materias[mi] = out;
    salvar();
  };
  $('#folha').returnValue = '';
  $('#folha').showModal();
}

function abrirSemestre(si) {
  const nova = si < 0;
  const s = nova ? { nome: '', atual: false, materias: [] } : dados.semestres[si];
  const f = $('#formFolha');
  f.innerHTML = `
    <div class="folha-topo"><h2>${nova ? 'Novo semestre' : 'Editar semestre'}</h2><button value="cancelar" class="botao fantasma">Fechar</button></div>
    <label>Nome<input name="nome" value="${esc(s.nome)}" placeholder="Spring 2027" required></label>
    <label class="check"><input type="checkbox" name="atual" ${s.atual ? 'checked' : ''}> Semestre em andamento</label>
    <div class="linha botoes">${nova ? '' : '<button type="button" class="botao perigo" id="apagarSem">Apagar</button>'}<button value="salvar" class="botao">Salvar</button></div>`;
  $('#apagarSem')?.addEventListener('click', () => { if (confirm('Apagar o semestre e suas matérias?')) { dados.semestres.splice(si, 1); $('#folha').close(); salvar(); } });
  $('#folha').onclose = () => {
    if ($('#folha').returnValue !== 'salvar') return;
    const fd = new FormData(f);
    const atual = !!fd.get('atual');
    if (atual) dados.semestres.forEach((x) => (x.atual = false));
    Object.assign(s, { nome: fd.get('nome').trim(), atual });
    if (nova) dados.semestres.push(s);
    salvar();
  };
  $('#folha').returnValue = '';
  $('#folha').showModal();
}

function ligarDados() {
  $('#novoSemestre').addEventListener('click', () => abrirSemestre(-1));
  $('#exportar').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
    a.download = 'notas.json';
    a.click();
  });
  $('#importar').addEventListener('change', async (e) => {
    try {
      const novo = JSON.parse(await e.target.files[0].text());
      if (!Array.isArray(novo.semestres)) throw new Error('arquivo sem "semestres"');
      dados = novo;
      salvar();
    } catch (err) { alert('Não consegui importar: ' + err.message); }
  });
}

// ---------- Simular ----------
function ligarSimulador() {
  $('#metaInput').addEventListener('change', (e) => { dados.metaGPA = +e.target.value; salvar(); });
  $('#restInput').addEventListener('input', renderMeta);
  $('#calcMateria').addEventListener('change', renderCalc);
  $('#calcLetra').addEventListener('change', renderCalc);
}

function renderSimulador() {
  const r = resumo(dados);
  $('#metaInput').value = dados.metaGPA || '';
  if (!$('#restInput').dataset.mexido) $('#restInput').value = Math.max((dados.creditosParaFormar || 120) - r.creditosFeitos, 0);
  $('#restInput').oninput = () => { $('#restInput').dataset.mexido = 1; renderMeta(); };
  renderMeta();

  const atuais = r.atual ? r.atual.materias.filter((m) => !situacao(m).final) : [];
  $('#simLista').innerHTML = atuais.map((m) => {
    const padrao = simulacao[m.codigo] || situacao(m).letra || 'B';
    return `<li class="item compacto"><div><strong>${esc(m.codigo)}</strong><span class="sub">${m.creditos} cr</span></div>
      <select data-sim="${esc(m.codigo)}">${LETRAS.map((l) => `<option ${l === padrao ? 'selected' : ''}>${l}</option>`).join('')}</select></li>`;
  }).join('') || '<li class="legenda">Nenhuma matéria em andamento.</li>';
  document.querySelectorAll('[data-sim]').forEach((s) => s.addEventListener('change', () => { simulacao[s.dataset.sim] = s.value; renderSim(); }));
  renderSim();

  $('#calcMateria').innerHTML = atuais.map((m) => `<option>${esc(m.codigo)}</option>`).join('');
  if (!$('#calcLetra').options.length) $('#calcLetra').innerHTML = LETRAS.slice(0, 7).map((l) => `<option>${l}</option>`).join('');
  renderCalc();
}

function renderMeta() {
  const r = resumo(dados);
  const meta = +dados.metaGPA, rest = +$('#restInput').value;
  const p = precisaMeta(r.acum, meta, rest);
  if (!meta || p === null) return ($('#resMeta').textContent = 'Informe a meta e os créditos restantes.');
  $('#resMeta').innerHTML = p > 4 ? `Inalcançável: seria preciso <strong>${p.toFixed(2)}</strong> de média.` : p <= 0 ? 'Meta já garantida, mesmo com notas baixas.' : `Você precisa de <strong>${p.toFixed(2)}</strong> de média nos próximos ${rest} créditos (≈ ${letraPorPontos(p)}).`;
}

function renderSim() {
  const r = resumo(dados);
  if (!r.atual) return;
  const mats = r.atual.materias.map((m) => (situacao(m).final ? m : { ...m, nota: simulacao[m.codigo] || situacao(m).letra || 'B' }));
  const sem = GPA.somar(mats, true);
  const fora = GPA.somar(dados.semestres.filter((x) => !x.atual).flatMap((x) => x.materias), false);
  const total = { pts: fora.pts + sem.pts, cred: fora.cred + sem.cred };
  $('#simSem').textContent = fmt(sem.gpa);
  $('#simAcum').textContent = fmt(total.cred ? total.pts / total.cred : null);
}

function renderCalc() {
  const r = resumo(dados);
  const m = r.atual?.materias.find((x) => x.codigo === $('#calcMateria').value);
  if (!m) return ($('#resCalc').textContent = '—');
  const s = situacao(m);
  const p = precisaPara(m, $('#calcLetra').value);
  const resto = s.pesoTotal - s.pesoFeito;
  if (p === null) return ($('#resCalc').textContent = 'Não há avaliações pendentes nessa matéria.');
  $('#resCalc').innerHTML = p > 100 ? `Não dá mais: precisaria de ${p.toFixed(1)}% nos ${resto}% restantes.` : p <= 0 ? 'Já garantido.' : `Média de <strong>${p.toFixed(1)}%</strong> nos ${resto}% restantes da nota.`;
}

// ---------- Bot ----------
const CHIPS = ['Como melhoro meu GPA?', 'Onde estou em risco?', 'Quanto preciso nas finais?', 'Consigo bater minha meta?'];

function ligarBot() {
  $('#chips').innerHTML = CHIPS.map((c) => `<button type="button" class="chip">${c}</button>`).join('');
  $('#chips').addEventListener('click', (e) => { if (e.target.classList.contains('chip')) perguntar(e.target.textContent); });
  $('#formChat').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#msg').value.trim(); if (t) { $('#msg').value = ''; perguntar(t); } });
  balao('bot', `Oi${dados.aluno ? ', ' + dados.aluno : ''}! Já li suas notas. GPA acumulado ${fmt(resumo(dados).acum.gpa)}, projeção ${fmt(resumo(dados).proj.gpa)}. Pergunte o que quiser ou toque numa sugestão abaixo.`);
}

function balao(quem, texto) {
  const d = document.createElement('div');
  d.className = 'balao ' + quem;
  d.innerHTML = esc(texto).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  $('#chat').appendChild(d);
  d.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return d;
}

async function perguntar(texto) {
  balao('eu', texto);
  historico.push({ role: 'user', content: texto });
  const espera = balao('bot digitando', '…');
  let resposta;
  if (temIA) {
    try {
      const r = await (await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mensagens: historico, contexto: contexto(dados) }) })).json();
      if (r.modo === 'ia') resposta = r.texto;
      else resposta = respostaRegras(texto) + (r.erro ? `\n\n(IA indisponível agora: ${r.erro})` : '');
    } catch { resposta = respostaRegras(texto); }
  } else resposta = respostaRegras(texto);
  espera.remove();
  balao('bot', resposta);
  historico.push({ role: 'assistant', content: resposta });
}

// Respostas sem IA, montadas a partir dos cálculos do painel.
function respostaRegras(texto) {
  const t = texto.toLowerCase();
  const sug = sugestoes(dados);
  const r = resumo(dados);
  const lista = (tipos) => sug.filter((s) => tipos.includes(s.tipo)).map((s) => '• ' + s.texto).join('\n');
  if (/risco|cair|perig/.test(t)) return lista(['risco']) || 'Nenhuma matéria em andamento está perto de cair de letra.';
  if (/meta|alcan|bater/.test(t)) return lista(['meta']) || 'Defina sua meta de GPA na aba Simular.';
  if (/final|prova|preciso|precisa/.test(t)) {
    const atuais = r.atual ? r.atual.materias.filter((m) => !situacao(m).final) : [];
    const linhas = atuais.map((m) => {
      const s = situacao(m);
      if (s.pct == null) return `• ${m.codigo}: sem notas lançadas.`;
      const alvo = ['A', 'A-', 'B+', 'B'].map((l) => { const p = precisaPara(m, l); return p == null ? null : `${l}: ${p > 100 ? 'impossível' : p <= 0 ? 'garantido' : p.toFixed(0) + '%'}`; }).filter(Boolean).join(', ');
      return `• ${m.codigo} (agora ${s.pct.toFixed(1)}%): ${alvo || 'nada pendente'}`;
    });
    return 'Média necessária no que falta de cada matéria:\n' + (linhas.join('\n') || 'Nenhuma matéria em andamento.');
  }
  return 'O que mais rende agora:\n' + sug.map((s) => '• ' + s.texto).join('\n') + '\n\nDica geral: priorize as matérias de mais créditos que estão a poucos pontos da próxima letra, e vá aos office hours antes das provas de maior peso.';
}

iniciar();
