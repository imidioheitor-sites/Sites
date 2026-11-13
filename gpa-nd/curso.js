// Aba "Curso": conteúdo extraído dos documentos de EG 10117 (Engineering Design) e CHEM 10171 (Chemistry).
// Cronograma, aulas, fórmulas, calculadoras, projetos e carreira. Marcações de estudo ficam no localStorage.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CHAVE = 'gpa-nd-curso';
  let S = { sub: 'geral', ok: {}, nota: {}, proj: {} };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch {}
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} };

  /* ───────── dados ───────── */
  const EG = [
    ['Introdução ao curso e ao design de engenharia', 'base'],
    ['Visão geral do projeto em equipe · Excel 1: introdução', 'excel'],
    ['Projetos: sensores (Arduino)', 'proj'],
    ['Excel 2: estatística numérica, ordenar e filtrar, lógica', 'excel'],
    ['Excel 3: estatística visual, gráficos, linha de tendência, histogramas', 'excel'],
    ['Excel 4: XLOOKUP · Excel no projeto em equipe', 'excel'],
    ['Projetos: abstração e síntese', 'proj'],
    ['Onshape 1: esboços, restrições, extrusão', 'cad'],
    ['Onshape 2: revolução, colaboração, estimativa do tempo de impressão', 'cad'],
    ['Projetos: análise (revisão da prova de Excel)', 'proj'],
    ['Prototipagem preliminar', 'proj'],
    ['CEEES Day', 'dept'],
    ['Onshape 3 e redução do tempo de impressão', 'cad'],
    ['Onshape 4: montagens (assemblies)', 'cad'],
    ['CSE Day', 'dept'],
    ['Preparação do Demo Day · revisão por pares do Milestone 2 · tour no EIH', 'proj'],
    ['Demonstration Day 1', 'proj'],
    ['CBE Day', 'dept'],
    ['Redesign Day', 'proj'],
    ['Escrita técnica e Milestone 3', 'proj'],
  ];
  const EG_TAG = { base: 'Base', excel: 'Excel', proj: 'Projeto', cad: 'CAD', dept: 'Departamento' };
  const PESOS = [['ala', 'Active Learning Activities', 10], ['hw', 'Homework', 10], ['xl', 'Prova 1 · Excel', 20], ['cum', 'Prova 2 · Cumulativa', 30], ['team', 'Projeto em equipe', 20], ['ind', 'Projeto individual', 5], ['disc', 'Discernment Paper', 5]];

  const QUIM = [
    ['Introdução, composição do átomo', 1], ['Símbolos, massa atômica, contar átomos (mol)', 1], ['Natureza da luz, dualidade onda-partícula', 1],
    ['Espectros atômicos, modelo de Bohr', 1], ['Rydberg e número quântico principal', 1], ['Formas e orientações dos orbitais, nós', 1],
    ['Átomos multieletrônicos, configurações eletrônicas', 1], ['Configurações e periodicidade', 1], ['Periodicidade e tendências', 1],
    ['Estruturas de Lewis', 2], ['Lewis, carga formal, ordem de ligação, grupos funcionais', 2], ['Carga formal e ressonância', 2],
    ['VSEPR e polaridade molecular', 2], ['Hibridização (teoria da ligação de valência)', 2], ['VBT e ressonância · intro MO', 2],
    ['Teoria dos orbitais moleculares', 2], ['Balanceamento, reagente limitante, rendimento', 2], ['Prever produtos, molaridade, estequiometria em solução', 2],
    ['Gases, pressões parciais, fração molar', 3], ['Constantes de equilíbrio Kp e Kc', 3], ['Quociente Q e tabelas ICE', 3],
    ['Mais equilíbrio · Le Chatelier', 3], ['Ksp, solubilidade molar, íon comum', 3], ['Ácidos e bases definidos', 3],
    ['Estrutura molecular e força ácida', 3], ['Cálculos de pH, pOH, Ka e Kw', 3], ['Ácidos e bases fracos, poliprótico', 3],
    ['Sais, neutralização, intro tampões', 4], ['Henderson–Hasselbalch e preparo de tampões', 4], ['Titulações e curvas', 4],
    ['Cálculos de titulação (AF/BF, poliprótico)', 4], ['1ª Lei, funções de estado, calor, trabalho', 4], ['Calorimetria e entalpia de reação', 4],
    ['Lei de Hess', 4], ['Entalpia de formação e de dissociação', 4], ['2ª Lei, entropia, mudança de estado', 4], ['Entropia, temperatura e vizinhança', 4],
    ['Energia livre de Gibbs', 5], ['Gibbs fora do padrão, Keq e ΔG', 5], ['Forças intermoleculares, Clausius–Clapeyron', 5], ['Curvas de aquecimento e diagramas de fases', 5], ['Revisão', 5],
  ];
  const PROVAS = [
    { k: 1, nome: 'Exame 1', data: '2026-09-15', hora: '8:00–9:15', cobre: 'Aulas 1–9 · átomo, luz, quântica, periodicidade' },
    { k: 2, nome: 'Exame 2', data: '2026-10-06', hora: '8:00–9:15', cobre: 'Aulas 10–18 · ligação, Lewis, VSEPR, MO, estequiometria' },
    { k: 3, nome: 'Exame 3', data: '2026-11-03', hora: '8:00–9:15', cobre: 'Aulas 19–27 · gases, equilíbrio, Ksp, ácidos e bases' },
    { k: 4, nome: 'Exame 4', data: '2026-11-24', hora: '8:00–9:15', cobre: 'Aulas 28–37 · tampões, titulações, termoquímica, entropia' },
    { k: 5, nome: 'Prova final', data: '2026-12-14', hora: '13:45–15:45', cobre: 'Curso inteiro · inclui Gibbs, forças intermoleculares e fases' },
  ];
  const EVENTOS = [
    { d: '2026-09-07', h: '18:00', t: 'First Gen Careers · Welcome back', l: 'LaFortune Student Center', tipo: 'carreira' },
    { d: '2026-09-15', h: '8:00', t: 'CHEM 10171 · Exame 1', l: 'Local avisado pelo professor', tipo: 'prova' },
    { d: '2026-09-18', h: '9:30', t: 'AEC Career Options Day 1', l: 'Duncan Student Center 512', tipo: 'carreira' },
    { d: '2026-09-25', h: '', t: 'AEC Career Options Day 2', l: 'Veja o PDF da programação', tipo: 'carreira' },
    { d: '2026-10-06', h: '8:00', t: 'CHEM 10171 · Exame 2', l: 'Local avisado pelo professor', tipo: 'prova' },
    { d: '2026-10-08', h: '23:59', t: 'EG 10117 · Entrega do projeto individual ao EIH', l: 'Uma única impressão', tipo: 'entrega' },
    { d: '2026-10-09', h: '', t: 'AEC Career Options Day 3', l: 'Veja o PDF da programação', tipo: 'carreira' },
    { d: '2026-10-27', h: '19:00', t: 'SpaceX at Notre Dame', l: 'DeBartolo Hall, sala 101', tipo: 'carreira' },
    { d: '2026-10-29', h: '17:30', t: 'EES · Spooky Season Social', l: '217 Cushing', tipo: 'social' },
    { d: '2026-11-03', h: '8:00', t: 'CHEM 10171 · Exame 3', l: 'Local avisado pelo professor', tipo: 'prova' },
    { d: '2026-11-24', h: '8:00', t: 'CHEM 10171 · Exame 4', l: 'Local avisado pelo professor', tipo: 'prova' },
    { d: '2026-12-14', h: '13:45', t: 'CHEM 10171 · Prova final', l: 'Até 15:45', tipo: 'prova' },
  ];
  const CARDS = [
    ['Rydberg', '1/λ = R·(1/n₁² − 1/n₂²)', 'R = 1,097×10⁷ m⁻¹. Linhas do hidrogênio: n₂ → n₁.'],
    ['Energia do fóton', 'E = hν = hc/λ', 'h = 6,626×10⁻³⁴ J·s · c = 3,00×10⁸ m/s.'],
    ['Bohr (hidrogênio)', 'Eₙ = −2,18×10⁻¹⁸ J / n²', 'ΔE = E_final − E_inicial: negativo emite, positivo absorve.'],
    ['de Broglie', 'λ = h / (m·v)', 'Toda partícula em movimento tem comprimento de onda.'],
    ['Números quânticos', 'n ≥ 1 · l = 0…n−1 · mₗ = −l…+l · mₛ = ±½', 'Nós radiais = n − l − 1 · nós angulares = l.'],
    ['Carga formal', 'CF = e⁻ de valência − e⁻ não ligantes − ligações', 'A melhor estrutura de Lewis tem CF mais próximas de zero.'],
    ['VSEPR', '2 linear · 3 trigonal plana · 4 tetraédrica · 5 bipirâmide · 6 octaédrica', 'Pares isolados distorcem a forma (angular, piramidal, gangorra…).'],
    ['Ordem de ligação (MO)', 'OL = (ligantes − antiligantes) / 2', 'OL maior: ligação mais forte e curta. Paramagnético se há e⁻ desemparelhados.'],
    ['Gás ideal e Dalton', 'PV = nRT · Pᵢ = Xᵢ·P_total', 'R = 0,08206 L·atm/(mol·K). Temperatura sempre em kelvin.'],
    ['Constante de equilíbrio', 'K = [C]ᶜ[D]ᵈ / ([A]ᵃ[B]ᵇ) · Kp = Kc(RT)^Δn', 'Q < K: vai para produtos · Q > K: vai para reagentes.'],
    ['Ksp e solubilidade', 'AB₂ ⇌ A²⁺ + 2B⁻ → Ksp = s·(2s)² = 4s³', 'Íon comum diminui a solubilidade molar (s).'],
    ['pH e pOH', 'pH = −log[H⁺] · pH + pOH = 14 · Kw = 1,0×10⁻¹⁴', 'Ka·Kb = Kw para pares conjugados (25 °C).'],
    ['Henderson–Hasselbalch', 'pH = pKa + log([A⁻]/[HA])', 'Tampão eficaz quando pH ≈ pKa ± 1.'],
    ['Titulação (monoprótico)', 'Mₐ·Vₐ = M_b·V_b no ponto de equivalência', 'AF/BF: pH 7 · AF/BrF: pH < 7 · AFr/BF: pH > 7 no equivalente.'],
    ['Calor e calorimetria', 'q = m·c·ΔT · ΔU = q + w', 'Convenção: calor absorvido é positivo.'],
    ['Entalpia (Hess)', 'ΔH°rxn = ΣΔHf°(produtos) − ΣΔHf°(reagentes)', 'Inverter a reação inverte o sinal; multiplicar escala o valor.'],
    ['Gibbs', 'ΔG = ΔH − T·ΔS · ΔG° = −RT·ln K', 'ΔG < 0: espontâneo. Em equilíbrio, ΔG = 0.'],
  ];
  const XL = [
    ['Estatística', '=AVERAGE · =MEDIAN · =MIN · =MAX · =STDEV.S', 'Coeficiente de variação = desvio padrão ÷ média.'],
    ['Lógica', '=IF(B2>26.6,"Hot","Not Hot")', 'IF aninhado, AND e OR para múltiplas condições.'],
    ['Contagem condicional', '=COUNTIF(E:E,"Hot") · =COUNTIFS(…)', 'Também =AVERAGEIF e =SUMIF para médias e somas por critério.'],
    ['Busca', '=XLOOKUP(valor, coluna_busca, coluna_retorno)', 'Substitui PROCV; funciona em qualquer direção.'],
    ['Referências', 'relativa A2 · absoluta $A$2 · mista A$2', 'Use F4 para alternar. Células amarelas pedem fórmula, não valor digitado.'],
    ['Ordenar e filtrar', 'Ordenar por vários níveis (Z→A, depois maior→menor)', 'Faça cópia da aba antes de filtrar para não perder os dados.'],
    ['Gráficos', 'Dispersão + linha de tendência + equação e R²', 'Eixos com unidades, legenda e séries distinguíveis por cor e marcador.'],
    ['Histograma', 'Dados de resíduo (medido − previsto) em 8 classes', 'Resíduos centrados em zero indicam bom ajuste linear.'],
  ];
  const TIME = [
    ['Marco 1', 'Contrato da equipe', 'Combinados de trabalho e papéis.'],
    ['Marco 2', 'Memorando inicial + planilha Excel', 'Requisitos, análise dos dados do sensor e plano de design.'],
    ['Demonstração 1', 'Primeira iteração impressa', 'Abre e fecha com a luz, encaixa e prende o sensor.'],
    ['Redesign', 'Segunda iteração', 'Mudanças ligadas ao feedback da primeira.'],
    ['Marco 3', 'Rascunho do relatório final', 'Decisões de design documentadas com dados.'],
  ];
  const CHK_EQ = [
    'Duas ou mais peças impressas separadas que formam uma montagem (G-4)',
    'Todas as peças imprimem em menos de 6 h, com suportes normais (G-5)',
    'Seção e equipe gravadas em cada peça, ex.: S3T2 (G-6)',
    'Servo abre e fecha o abrigo conforme a luz; código Arduino adaptado (G-7)',
    'Só o sensor de luz fica visível por fora; furo para o cabo da RedBoard',
    'Cabe em uma mesa Bambu de 9,5 × 9,5 × 8 pol',
    'Somente materiais permitidos: PLA do kit, kit de sensores, parafusos nº 8 (¾ e 1 pol) e porcas',
    'Fixa firme no local externo e prende todos os componentes eletrônicos',
    'Planilha Excel que traduz leituras em orientação de segurança ao ar livre',
    'Mudanças entre a 1ª e a 2ª iteração documentadas e ligadas ao teste',
  ];
  const CHK_IND = [
    'Escolher um dos quatro temas: labirinto, enfeite natalino, organizador de cabeceira ou porta-retrato',
    'Melhorar o desenho base cumprindo forma, encaixe e função (tarefa 1 vale 85%)',
    'Acrescentar pelo menos uma funcionalidade nova além da tabela de requisitos',
    'Iniciais em cada peça (se couber) e dentro do volume de impressão',
    'Enviar uma única impressão ao EIH até 08/10/2026 às 23:59',
    'Nunca imprimir fora do EIH (violação do Honor Code)',
  ];
  const CARREIRA = [
    ['AEC Career Options Day', 'Três dias (18/09, 25/09 e 09/10): apresentações de empresas de engenharia e almoço com os palestrantes, em trilhas por área.', 'Duncan Student Center'],
    ['SpaceX at Notre Dame', 'Sessão de 2 horas com líder sênior ex-aluno: missões, estágios e carreira. Aberta a todos. 27/10, 19h–21h.', 'DeBartolo Hall 101'],
    ['Recrutamento P&G 2026/27', 'Apresentação da equipe de recrutamento de Notre Dame, com áreas como Product Supply Engineering.', 'Business Use'],
    ['First Gen Careers', 'Sessão “Welcome back + ask us anything” sobre estágios, pesquisa e networking. Aberta a todos.', 'LaFortune'],
    ['ASME', 'Material da sociedade de engenharia mecânica para quem pretende Mecânica ou Aeroespacial.', 'PDF do curso'],
    ['EES · Spooky Season Social', 'Evento social da sociedade de estudantes de engenharia: abóboras, artes e lanches. 29/10, 17h30.', '217 Cushing'],
  ];

  /* ───────── utilidades ───────── */
  const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const dt = (iso) => new Date(iso + 'T12:00:00');
  const dias = (iso) => Math.round((dt(iso) - hoje()) / 86400000);
  const fmtData = (iso) => dt(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const quando = (n) => (n === 0 ? 'hoje' : n === 1 ? 'amanhã' : n > 0 ? `em ${n} dias` : `há ${-n} dias`);
  const chaves = (curso) => Object.keys(S.ok).filter((k) => k.startsWith(curso + ':') && S.ok[k]).length;
  function anel(p, cor, txt, sub) {
    const r = 46, c = 2 * Math.PI * r;
    return `<div class="anel"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" class="fundo"/><circle cx="60" cy="60" r="${r}" class="prog" style="stroke:${cor};stroke-dasharray:${c};stroke-dashoffset:${c * (1 - p)}"/></svg><div><b>${txt}</b><small>${sub}</small></div></div>`;
  }
  const ABAS = [['geral', 'Visão geral'], ['eg', 'Engenharia · EG 10117'], ['quim', 'Química · CHEM 10171'], ['proj', 'Projetos'], ['carr', 'Carreira']];

  /* ───────── seções ───────── */
  function geral() {
    const prox = EVENTOS.filter((e) => dias(e.d) >= 0).slice(0, 5);
    const pe = chaves('eg') / EG.length, pq = chaves('q') / QUIM.length;
    const prova = PROVAS.find((p) => dias(p.data) >= 0);
    return `
    <div class="c-hero">
      <div><p class="mono kk">Fall 2026 · Notre Dame</p><h3 class="serif">Tudo do curso, <em>num só lugar</em>.</h3>
      <p class="lead">Cronograma, aulas, fórmulas e calculadoras tiradas dos documentos de Engenharia (EG 10117) e Química (CHEM 10171). Marque o que já estudou e acompanhe o progresso.</p></div>
      <div class="c-aneis">${anel(pe, '#c99700', Math.round(pe * 100) + '%', 'EG 10117')}${anel(pq, '#2f6fd6', Math.round(pq * 100) + '%', 'CHEM 10171')}</div>
    </div>
    ${prova ? `<div class="c-prova cartao"><div><p class="mono kk">Próxima prova</p><h4>${esc(prova.nome)} · CHEM 10171</h4><p class="legenda">${fmtData(prova.data)} · ${prova.hora} · ${esc(prova.cobre)}</p></div><div class="c-dias"><b>${Math.max(dias(prova.data), 0)}</b><small class="mono">dias</small></div></div>` : ''}
    <div class="c-grid2">
      <div class="cartao"><p class="titulo-cartao">Calendário do semestre</p><ul class="lista prazos">${EVENTOS.map((e) => { const n = dias(e.d); return `<li class="ev ${e.tipo} ${n < 0 ? 'passou' : ''}"><span class="data mono">${fmtData(e.d)}</span><div><strong>${esc(e.t)}</strong><span class="sub">${esc(e.l)}${e.h ? ' · ' + e.h : ''}</span></div><span class="quando mono">${quando(n)}</span></li>`; }).join('')}</ul></div>
      <div class="cartao"><p class="titulo-cartao">Como o EG 10117 é avaliado</p>${barraPesos()}<p class="legenda" style="margin-top:10px">Método de recuperação em 5 passos: vídeo e quiz antes da aula, problema em aula, atividade pós-aula, homework semanal e prova como quinta revisão.</p></div>
    </div>`;
  }
  function barraPesos() {
    const cor = ['#c99700', '#e3a33a', '#0c2340', '#2f6fd6', '#3ec486', '#9a6bff', '#e0507a'];
    return `<div class="pesos">${PESOS.map((p, i) => `<i style="flex:${p[2]};background:${cor[i]}" title="${p[1]} ${p[2]}%"></i>`).join('')}</div><ul class="leg-pesos">${PESOS.map((p, i) => `<li><i style="background:${cor[i]}"></i>${p[1]} <b>${p[2]}%</b></li>`).join('')}</ul>`;
  }
  function aulas(lista, pref, grupos) {
    return `<ul class="aulas">${lista.map((a, i) => {
      const id = pref + ':' + (i + 1), on = !!S.ok[id];
      return `<li class="${on ? 'on' : ''}"><label><input type="checkbox" data-ok="${id}" ${on ? 'checked' : ''}><span class="chk"></span><em class="mono">${String(i + 1).padStart(2, '0')}</em><span class="tt">${esc(a[0])}</span><i class="tg mono ${pref === 'eg' ? a[1] : 'e' + a[1]}">${pref === 'eg' ? EG_TAG[a[1]] : 'Exame ' + (a[1] === 5 ? 'final' : a[1])}</i></label></li>`;
    }).join('')}</ul>`;
  }
  function calcEG() {
    return `<div class="cartao calc-eg"><p class="titulo-cartao">Calculadora de nota · EG 10117</p><p class="legenda">Digite a nota de cada componente (0–100). Deixe vazio o que ainda não saiu.</p>
    <div class="eg-in">${PESOS.map((p) => `<label><span>${p[1]} <b>${p[2]}%</b></span><input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-eg="${p[0]}" value="${S.nota[p[0]] ?? ''}"></label>`).join('')}</div>
    <p class="resultado" id="egRes">—</p></div>`;
  }
  function egCalc() {
    let soma = 0, pesoF = 0;
    PESOS.forEach((p) => { const v = parseFloat(S.nota[p[0]]); if (!isNaN(v)) { soma += v * p[2]; pesoF += p[2]; } });
    const el = $('#egRes'); if (!el) return;
    if (!pesoF) return (el.textContent = 'Informe pelo menos uma nota.');
    const pct = soma / pesoF, falta = 100 - pesoF, G = window.GPA;
    let t = `Média nas avaliações lançadas: <strong>${pct.toFixed(1)}%</strong> (${pesoF}% da nota) ≈ <strong>${G.letraDe(pct)}</strong>.`;
    if (falta > 0) {
      t += '<br>' + ['A', 'A-', 'B+', 'B'].map((l) => { const need = (G.CORTES[l] * 100 - soma) / falta; return `${l}: ${need <= 0 ? 'garantido' : need > 100 ? 'inalcançável' : need.toFixed(1) + '% no resto'}`; }).join(' · ');
    }
    el.innerHTML = t;
  }
  function eng() {
    return `<div class="c-grid2">
      <div class="cartao"><div class="linha"><p class="titulo-cartao">Aulas · ${chaves('eg')}/${EG.length}</p><span class="dica">marque ao estudar</span></div>${aulas(EG, 'eg')}</div>
      <div>${calcEG()}
        <div class="cartao"><p class="titulo-cartao">Guia rápido de Excel (o que cai na prova)</p><div class="xl">${XL.map((x) => `<div><b>${x[0]}</b><code>${esc(x[1])}</code><span class="sub">${esc(x[2])}</span></div>`).join('')}</div><p class="legenda" style="margin-top:8px">Funções não vistas em aula descontam pontos na prova de Excel.</p></div>
      </div></div>
      <div class="cartao"><p class="titulo-cartao">Onshape em quatro passos</p><ol class="passos"><li><b>Esboço e restrições</b><span>Sketch, dimensões e restrições até o desenho ficar totalmente definido.</span></li><li><b>Extrusão e revolução</b><span>Extrude (adicionar ou remover) e Revolve para peças de simetria axial.</span></li><li><b>Montagens</b><span>Assemblies com mates entre as peças e teste do movimento.</span></li><li><b>Tempo de impressão</b><span>Estime antes de enviar ao EIH e reduza com orientação e suportes.</span></li></ol></div>`;
  }
  function quim() {
    const cards = CARDS.map((c) => `<div class="fcard" data-flip-card data-trigger="click"><div class="frente"><span class="mono">${esc(c[0])}</span><i>toque para virar</i></div><div class="verso"><b>${esc(c[1])}</b><span>${esc(c[2])}</span></div></div>`).join('');
    const prov = PROVAS.map((p) => { const n = dias(p.data); return `<li class="${n < 0 ? 'passou' : ''}"><span class="data mono">${fmtData(p.data)}</span><div><strong>${esc(p.nome)}</strong><span class="sub">${p.hora} · ${esc(p.cobre)}</span></div><span class="quando mono">${quando(n)}</span></li>`; }).join('');
    return `<div class="c-grid2">
      <div class="cartao"><p class="titulo-cartao">Provas</p><ul class="lista prazos ev">${prov}</ul>
        <p class="legenda" style="margin-top:10px">As provas 1 a 4 são às terças, 8h–9h15. Cronograma em rascunho: confira alterações com o professor.</p></div>
      <div class="cartao"><div class="linha"><p class="titulo-cartao">Aulas · ${chaves('q')}/${QUIM.length}</p><span class="dica">marque ao estudar</span></div>${aulas(QUIM, 'q')}</div></div>
    <div class="cartao"><p class="titulo-cartao">Fórmulas e ideias-chave</p><p class="legenda">Toque num cartão para ver a fórmula.</p><div class="fgrid">${cards}</div></div>
    <div class="cartao calcs"><p class="titulo-cartao">Laboratório rápido</p><div class="c-grid3">
      <form class="mini-calc" data-calc="ph"><h5>pH ↔ concentração</h5><label>[H⁺] em mol/L<input name="h" inputmode="decimal" placeholder="1e-3"></label><label>ou pH<input name="p" inputmode="decimal" placeholder="3"></label><p class="resultado" data-out>—</p></form>
      <form class="mini-calc" data-calc="hh"><h5>Henderson–Hasselbalch</h5><label>pKa<input name="pka" inputmode="decimal" placeholder="4.76"></label><label>[A⁻] / [HA]<input name="r" inputmode="decimal" placeholder="1.5"></label><p class="resultado" data-out>—</p></form>
      <form class="mini-calc" data-calc="ry"><h5>Hidrogênio · n₂ → n₁</h5><label>n inicial (n₂)<input name="n2" inputmode="numeric" placeholder="3"></label><label>n final (n₁)<input name="n1" inputmode="numeric" placeholder="2"></label><p class="resultado" data-out>—</p></form></div></div>`;
  }
  function calc(f) {
    const v = (n) => parseFloat(String(f.elements[n].value).replace(',', '.')), out = $('[data-out]', f);
    const k = f.dataset.calc, fm = (x, d = 3) => (Math.abs(x) < 0.01 || Math.abs(x) >= 1e4 ? x.toExponential(2) : x.toFixed(d));
    if (k === 'ph') {
      const h = v('h'), p = v('p');
      if (h > 0) { const ph = -Math.log10(h); out.innerHTML = `pH = <strong>${ph.toFixed(2)}</strong> · pOH = ${(14 - ph).toFixed(2)} · ${ph < 7 ? 'ácida' : ph > 7 ? 'básica' : 'neutra'}`; }
      else if (!isNaN(p)) { const hh = Math.pow(10, -p); out.innerHTML = `[H⁺] = <strong>${fm(hh)}</strong> mol/L · [OH⁻] = ${fm(1e-14 / hh)} mol/L`; } else out.textContent = '—';
    } else if (k === 'hh') {
      const a = v('pka'), r = v('r');
      out.innerHTML = !isNaN(a) && r > 0 ? `pH = <strong>${(a + Math.log10(r)).toFixed(2)}</strong>` : '—';
    } else {
      const n2 = v('n2'), n1 = v('n1');
      if (n2 > n1 && n1 >= 1) { const inv = 1.097e7 * (1 / n1 ** 2 - 1 / n2 ** 2), l = 1e9 / inv, E = 6.626e-34 * 2.998e8 / (l * 1e-9); out.innerHTML = `λ = <strong>${l.toFixed(1)} nm</strong> · E = ${E.toExponential(2)} J · ${l < 400 ? 'ultravioleta' : l > 700 ? 'infravermelho' : 'visível'} (emissão)`; }
      else out.textContent = n2 && n1 ? 'Use n inicial maior que n final.' : '—';
    }
  }
  function proj() {
    const lista = (arr, pre) => `<ul class="aulas chk">${arr.map((t, i) => { const id = pre + i; const on = !!S.proj[id]; return `<li class="${on ? 'on' : ''}"><label><input type="checkbox" data-pj="${id}" ${on ? 'checked' : ''}><span class="chk"></span><span class="tt">${esc(t)}</span></label></li>`; }).join('')}</ul>`;
    return `<div class="c-hero"><div><p class="mono kk">EG 10117 · 20% + 5% da nota</p><h3 class="serif">Dois projetos, <em>uma impressora</em>.</h3>
      <p class="lead">Equipe: abrigo impresso em 3D para um sistema de sensores de qualidade do ar em South Bend (RedBoard, dois sensores e um servo). Individual: melhorar um produto no Onshape e imprimir no EIH.</p></div></div>
      <div class="linha-tempo">${TIME.map((t, i) => `<div class="mk"><i class="mono">${String(i + 1).padStart(2, '0')}</i><b>${t[0]}</b><strong>${t[1]}</strong><span>${t[2]}</span></div>`).join('')}</div>
      <div class="c-grid2"><div class="cartao"><p class="titulo-cartao">Checklist · projeto em equipe</p>${lista(CHK_EQ, 'e')}</div><div class="cartao"><p class="titulo-cartao">Checklist · projeto individual</p>${lista(CHK_IND, 'i')}<p class="legenda" style="margin-top:10px">Entrega: 08/10/2026, 23:59, uma única impressão no EIH.</p></div></div>`;
  }
  function carr() {
    return `<div class="c-hero"><div><p class="mono kk">Fora da sala de aula</p><h3 class="serif">Para onde <em>isso leva</em>.</h3><p class="lead">Eventos e materiais de carreira que vieram junto com os documentos do curso.</p></div></div>
    <div class="carr">${CARREIRA.map((c) => `<article class="c-card" data-tilted-card data-rotate="9" data-scale="1.03"><span class="mono">${esc(c[2])}</span><h4>${esc(c[0])}</h4><p>${esc(c[1])}</p></article>`).join('')}</div>`;
  }
  const VIEW = { geral, eg: eng, quim, proj, carr };

  /* ───────── montagem ───────── */
  function render() {
    const raiz = $('#cursoRaiz'); if (!raiz) return;
    raiz.innerHTML = `<h2 class="titulo-aba serif">O <em>curso</em>, inteiro</h2>
      <div class="subabas" role="tablist">${ABAS.map((a) => `<button role="tab" data-sub="${a[0]}" class="${S.sub === a[0] ? 'on' : ''}">${a[1]}</button>`).join('')}</div>
      <div class="c-corpo" data-sub-view="${S.sub}">${(VIEW[S.sub] || geral)()}</div>`;
    $$('.subabas button', raiz).forEach((b) => b.addEventListener('click', () => { S.sub = b.dataset.sub; salvar(); render(); }));
    $$('[data-ok]', raiz).forEach((i) => i.addEventListener('change', () => { S.ok[i.dataset.ok] = i.checked; salvar(); i.closest('li').classList.toggle('on', i.checked); const t = i.closest('.cartao')?.querySelector('.titulo-cartao'); if (t) t.textContent = t.textContent.replace(/\d+\/(\d+)/, (m, n) => `${chaves(i.dataset.ok.startsWith('eg') ? 'eg' : 'q')}/${n}`); }));
    $$('[data-pj]', raiz).forEach((i) => i.addEventListener('change', () => { S.proj[i.dataset.pj] = i.checked; salvar(); i.closest('li').classList.toggle('on', i.checked); }));
    $$('[data-eg]', raiz).forEach((i) => i.addEventListener('input', () => { S.nota[i.dataset.eg] = i.value; salvar(); egCalc(); }));
    $$('.mini-calc', raiz).forEach((f) => { f.addEventListener('input', () => calc(f)); f.addEventListener('submit', (e) => e.preventDefault()); });
    egCalc();
    if (window.HeluFlipCard) window.HeluFlipCard.init(raiz);
    if (window.HeluTiltedCard) window.HeluTiltedCard.init(raiz);
  }
  function prazosPainel() {
    const el = $('#proximos'); if (!el) return;
    const prox = EVENTOS.filter((e) => dias(e.d) >= 0).slice(0, 4);
    el.innerHTML = prox.length ? prox.map((e) => `<li class="ev ${e.tipo}"><span class="data mono">${fmtData(e.d)}</span><div><strong>${esc(e.t)}</strong><span class="sub">${esc(e.l)}${e.h ? ' · ' + e.h : ''}</span></div><span class="quando mono">${quando(dias(e.d))}</span></li>`).join('') : '<li class="legenda">Sem prazos futuros no calendário.</li>';
  }
  function irPara(aba) { const b = $(`.abas button[data-aba="${aba}"]`); if (b) b.click(); }
  function iniciar() {
    render(); prazosPainel();
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => irPara(b.dataset.goto)));
    $$('.abas button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.aba === 'curso') setTimeout(() => { if (window.HeluFlipCard) window.HeluFlipCard.init($('#cursoRaiz')); }, 30); }));
  }
  window.CURSO_CONTEXTO = () => `Curso (Fall 2026): EG 10117 Engineering Design com pesos ALA 10%, Homework 10%, Prova Excel 20%, Prova Cumulativa 30%, Projeto em equipe 20%, Projeto individual 5%, Discernment Paper 5%. CHEM 10171 com Exames 1 (15/09), 2 (06/10), 3 (03/11), 4 (24/11) e final (14/12, 13:45). Projeto individual entregue ao EIH até 08/10/2026 23:59.`;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
