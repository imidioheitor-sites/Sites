// Cálculos de GPA na escala de Notre Dame. Funções puras, usadas pela interface e pelo bot de regras.
(function (raiz) {
  const PONTOS = { 'A': 4.0, 'A-': 3.667, 'B+': 3.333, 'B': 3.0, 'B-': 2.667, 'C+': 2.333, 'C': 2.0, 'C-': 1.667, 'D': 1.0, 'F': 0 };
  const LETRAS = Object.keys(PONTOS);
  // Cortes percentuais padrão; cada professor pode usar outros (editáveis por matéria em "cortes").
  const CORTES = { 'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80, 'C+': 77, 'C': 73, 'C-': 70, 'D': 60, 'F': 0 };

  const cortesDe = (m) => ({ ...CORTES, ...(m.cortes || {}) });

  // Situação de uma matéria: letra final, ou % atual e letra projetada a partir das avaliações.
  function situacao(m) {
    if (m.nota) return { letra: m.nota, final: true, conta: m.nota in PONTOS };
    const av = (m.avaliacoes || []).filter((a) => a.peso > 0);
    const feitas = av.filter((a) => a.nota !== null && a.nota !== '' && a.nota !== undefined);
    const pesoFeito = feitas.reduce((s, a) => s + +a.peso, 0);
    const pesoTotal = av.reduce((s, a) => s + +a.peso, 0) || 100;
    if (!pesoFeito) return { letra: m.esperada || null, final: false, conta: !!m.esperada, pct: null, pesoFeito: 0, pesoTotal };
    const somado = feitas.reduce((s, a) => s + a.peso * a.nota, 0);
    const pct = somado / pesoFeito;
    const letra = m.esperada || letraDe(pct, m);
    return { letra, final: false, conta: true, pct, somado, pesoFeito, pesoTotal, letraPct: letraDe(pct, m) };
  }

  function letraDe(pct, m = {}) {
    const c = cortesDe(m);
    return LETRAS.find((l) => pct >= c[l]) || 'F';
  }

  // Média necessária no que falta para fechar a matéria com a letra pedida.
  function precisaPara(m, letra) {
    const s = situacao(m);
    const resto = (s.pesoTotal || 100) - (s.pesoFeito || 0);
    if (resto <= 0) return null;
    const alvo = cortesDe(m)[letra] * (s.pesoTotal || 100);
    return (alvo - (s.somado || 0)) / resto;
  }

  function somar(materias, projetar) {
    let pts = 0, cred = 0;
    for (const m of materias) {
      const s = situacao(m);
      if (!s.conta || !s.letra || !(s.letra in PONTOS)) continue;
      if (!s.final && !projetar) continue;
      pts += PONTOS[s.letra] * m.creditos;
      cred += +m.creditos;
    }
    return { pts, cred, gpa: cred ? pts / cred : null };
  }

  function resumo(dados) {
    const sems = dados.semestres || [];
    const atual = sems.find((s) => s.atual) || null;
    const fechadas = sems.flatMap((s) => s.materias.filter((m) => situacao(m).final));
    const acum = somar(fechadas, false);
    const proj = somar(sems.flatMap((s) => s.materias), true);
    const porSemestre = sems.map((s) => ({ nome: s.nome, atual: !!s.atual, ...somar(s.materias, true) }));
    const creditosFeitos = fechadas.reduce((s, m) => s + (+m.creditos || 0), 0);
    return { acum, proj, atual, porSemestre, semAtual: atual ? somar(atual.materias, true) : null, creditosFeitos };
  }

  // Média de GPA necessária nos créditos restantes para chegar à meta acumulada.
  function precisaMeta(base, meta, restantes) {
    if (!restantes || restantes <= 0) return null;
    return (meta * (base.cred + restantes) - base.pts) / restantes;
  }

  const fmt = (g) => (g === null || g === undefined || isNaN(g) ? '—' : g.toFixed(2));

  // Sugestões sem IA: alavancas de cada matéria em andamento, riscos e o caminho até a meta.
  function sugestoes(dados) {
    const r = resumo(dados);
    const out = [];
    const atuais = r.atual ? r.atual.materias.filter((m) => !situacao(m).final) : [];
    const alvos = [];
    for (const m of atuais) {
      const s = situacao(m);
      if (s.pct == null) continue;
      const i = LETRAS.indexOf(s.letraPct);
      const acima = i > 0 ? LETRAS[i - 1] : null;
      const resto = s.pesoTotal - s.pesoFeito;
      if (acima && resto > 0) {
        const p = precisaPara(m, acima);
        if (p !== null && p <= 100) {
          const ganho = (PONTOS[acima] - PONTOS[s.letraPct]) * m.creditos;
          alvos.push({ m, acima, p, ganho, resto });
        }
      }
      const manter = precisaPara(m, s.letraPct);
      const folga = s.pct - cortesDe(m)[s.letraPct];
      if (folga < 1.5 && s.letraPct !== 'F') out.push({ tipo: 'risco', texto: `${m.codigo} está a ${folga.toFixed(1)} ponto(s) de cair de ${s.letraPct}. Para segurar, precisa de ${fmt1(manter)}% de média no que falta (${resto}% da nota).` });
    }
    alvos.sort((a, b) => b.ganho / Math.max(b.p - 70, 5) - a.ganho / Math.max(a.p - 70, 5));
    for (const a of alvos.slice(0, 3)) {
      out.push({ tipo: 'alvo', texto: `${a.m.codigo} (${a.m.creditos} cr): com ${fmt1(Math.max(a.p, 0))}% de média nos ${a.resto}% restantes você sobe para ${a.acima}.` });
    }
    const meta = +dados.metaGPA;
    if (meta) {
      const restantes = Math.max((+dados.creditosParaFormar || 120) - r.creditosFeitos, 0);
      const p = precisaMeta(r.acum, meta, restantes);
      if (p !== null) {
        if (p > 4) out.push({ tipo: 'meta', texto: `A meta de ${meta.toFixed(2)} não é mais alcançável com ${restantes} créditos restantes (precisaria de ${p.toFixed(2)}). Uma meta realista é ${fmt(precisaMetaInversa(r.acum, restantes, 4))} no máximo.` });
        else out.push({ tipo: 'meta', texto: `Para fechar com ${meta.toFixed(2)}, você precisa de ${Math.max(p, 0).toFixed(2)} de média nos ${restantes} créditos restantes (${letraPorPontos(p)} em média).` });
      }
    }
    const sems = r.porSemestre.filter((s) => s.gpa !== null && !s.atual);
    if (sems.length >= 2) {
      const d = sems[sems.length - 1].gpa - sems[sems.length - 2].gpa;
      if (Math.abs(d) >= 0.05) out.push({ tipo: 'tendencia', texto: `Seu último semestre fechado ${d > 0 ? 'subiu' : 'caiu'} ${Math.abs(d).toFixed(2)} em relação ao anterior.` });
    }
    if (!out.length) out.push({ tipo: 'ok', texto: 'Nada urgente. Lance as próximas notas para receber sugestões mais precisas.' });
    return out;
  }

  const fmt1 = (n) => (n == null ? '—' : n.toFixed(1));
  const precisaMetaInversa = (base, restantes, media) => (base.pts + media * restantes) / (base.cred + restantes);
  const letraPorPontos = (p) => {
    const l = LETRAS.find((x) => PONTOS[x] <= p + 1e-9) || 'F';
    return p - PONTOS[l] > 0.02 && l !== 'A' ? `entre ${l} e ${LETRAS[LETRAS.indexOf(l) - 1]}` : l;
  };

  // Texto compacto com os dados, mandado como contexto ao bot com IA.
  function contexto(dados) {
    const r = resumo(dados);
    const linhas = [
      `GPA acumulado (só notas finais): ${fmt(r.acum.gpa)} em ${r.acum.cred} créditos com nota.`,
      `GPA projetado incluindo semestre atual: ${fmt(r.proj.gpa)}.`,
      `Meta: ${dados.metaGPA || 'não definida'}; créditos para formar: ${dados.creditosParaFormar || 120}; concluídos: ${r.creditosFeitos}.`,
      'Por semestre: ' + r.porSemestre.map((s) => `${s.nome}${s.atual ? ' (atual, projetado)' : ''}=${fmt(s.gpa)}`).join('; '),
    ];
    for (const s of dados.semestres || []) {
      linhas.push(`\n${s.nome}${s.atual ? ' [ATUAL]' : ''}:`);
      for (const m of s.materias) {
        const st = situacao(m);
        if (st.final) { linhas.push(`- ${m.codigo} ${m.nome} (${m.creditos}cr): ${m.nota}`); continue; }
        const av = (m.avaliacoes || []).map((a) => `${a.nome} ${a.peso}%: ${a.nota ?? 'pendente'}`).join(', ');
        linhas.push(`- ${m.codigo} ${m.nome} (${m.creditos}cr): ${st.pct != null ? st.pct.toFixed(1) + '% → ' + st.letraPct : 'sem notas'}${m.esperada ? ', esperada ' + m.esperada : ''}. Avaliações: ${av}`);
      }
    }
    linhas.push('\nSugestões calculadas: ' + sugestoes(dados).map((s) => s.texto).join(' | '));
    return linhas.join('\n');
  }

  raiz.GPA = { PONTOS, LETRAS, CORTES, situacao, letraDe, precisaPara, somar, resumo, precisaMeta, sugestoes, contexto, fmt, letraPorPontos };
  if (typeof module !== 'undefined') module.exports = raiz.GPA;
})(typeof window !== 'undefined' ? window : globalThis);
