// Junta tudo o que foi lido, acha os problemas e compara com os incidentes ja abertos.
// Sai um item por decisao: novo, repetido, escalar, resolvido ou estado.
const cfg = $('Config').first().json;
const agora = DateTime.now().setZone('America/Sao_Paulo');
const agoraMs = agora.toMillis();
const lista = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const linhas = (nome) => { try { return $(nome).all().map(i => i.json).filter(r => r && Object.keys(r).length); } catch (e) { return []; } };
const um = (nome) => { try { return $(nome).first().json || {}; } catch (e) { return {}; } };
const ms = (iso) => { const t = Date.parse(iso || ''); return isNaN(t) ? 0 : t; };
const minutosDesde = (iso) => (agoraMs - ms(iso)) / 60000;
const corta = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

const estado = {};
for (const r of linhas('Estado do watchdog')) estado[r.chave] = r.valor;
const ler = (k, padrao) => { try { return JSON.parse(estado[k]); } catch (e) { return padrao; } };
const memWf = ler('workflows', {});
const reativacoes = ler('reativacoes', {});

const criticos = lista(cfg.workflows_criticos);
const podeReexecutar = lista(cfg.retry_permitido);
const podeReativar = lista(cfg.reativar_permitido);
const achados = [];
const achar = (f) => achados.push(Object.assign({ workflow_id: '', workflow_nome: '', execucao_id: '', persistente: true, transitorio: false, acao_regra: 'diagnosticar', detalhes: '' }, f));

// 1. A API do n8n respondeu?
const wfResp = um('Workflows no n8n');
const wfs = Array.isArray(wfResp.data) ? wfResp.data : null;
const fabrica = {};
if (!wfs) {
  achar({ chave: 'api_n8n_fora', tipo: 'api_n8n_fora', severidade: 'alta', acao_regra: 'avisar_heitor',
    mensagem: 'O watchdog nao conseguiu ler a API do n8n (falta a credencial n8n API (HELU) ou a chave venceu): ' + corta(JSON.stringify(wfResp.error || wfResp), 300) });
} else {
  for (const w of wfs) {
    const nome = String(w.name || '');
    if (!nome.startsWith('HELU FACTORY')) continue;
    if (/watchdog|teste|importador/i.test(nome)) continue;
    fabrica[w.id] = w;
  }
}
const nomeDe = (id) => (fabrica[id] && fabrica[id].name) || id;
const ativo = (id) => !!(fabrica[id] && fabrica[id].active);

// 2. Workflow da fabrica que estava ligado e desligou.
const novaMemWf = {};
for (const id of Object.keys(fabrica)) {
  const w = fabrica[id];
  const tags = (w.tags || []).map(t => String(t.name || t).toLowerCase());
  const pausado = tags.includes('pausado') || tags.includes('manutencao');
  const antes = memWf[id] || {};
  const jaFoiVisto = !!antes.visto_ativo;
  novaMemWf[id] = { visto_ativo: w.active ? true : (pausado ? false : jaFoiVisto), nome: w.name };
  if (!w.active && jaFoiVisto && !pausado) {
    const ultimaReativ = ms(reativacoes[id]);
    const podeAgora = podeReativar.includes(id) && (agoraMs - ultimaReativ) > 24 * 3600000;
    achar({ chave: 'inativo:' + id, tipo: 'inativo', workflow_id: id, workflow_nome: w.name,
      severidade: podeReativar.includes(id) ? 'alta' : 'media',
      acao_regra: podeAgora ? 'reativar' : 'diagnosticar',
      mensagem: w.name + ' estava ligado e agora esta desligado. Para o watchdog ignorar, coloque a tag pausado no workflow.' });
    if (podeAgora) reativacoes[id] = agora.toISO();
  }
}

// 3. Falhas que a Caixa de erros gravou em helu_eventos e ninguem tratou ainda.
const grupos = {};
const consumidos = [];
for (const ev of linhas('Erros novos no barramento')) {
  if (!ev.id) continue;
  consumidos.push(ev.id);
  if (ev.severidade === 'baixa') continue;
  const wf = ev.workflow_id || 'desconhecido';
  const no = String(ev.titulo || '').replace(/^Falhou no no /, '') || 'desconhecido';
  const msg = corta(String(ev.detalhe || '').split(' | ')[0] || 'erro sem mensagem', 500);
  const execId = String(ev.evento_id || '').split('-').pop();
  const chave = 'erro:' + wf + ':' + no;
  const g = grupos[chave] || (grupos[chave] = { qtd: 0, execId: '', msg, no, wf, nome: ev.origem || nomeDe(wf) });
  g.qtd += 1;
  if (/^\d+$/.test(execId) && Number(execId) > Number(g.execId || 0)) { g.execId = execId; g.msg = msg; }
}
const transitorio = /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up|\b429\b|rate.?limit|overloaded|\b52[0-9]\b|\b50[234]\b|bad gateway|service unavailable|temporarily/i;
const semCreditoRe = /payment required|credits have been depleted|\b402\b|insufficient.?(credit|balance|quota)/i;
for (const chave of Object.keys(grupos)) {
  const g = grupos[chave];
  const trans = transitorio.test(g.msg);
  const semCredito = semCreditoRe.test(g.msg);
  achar({ chave: semCredito ? 'sem_credito_ia' : chave, tipo: semCredito ? 'sem_credito_ia' : 'erro', workflow_id: g.wf, workflow_nome: g.nome, execucao_id: g.execId,
    severidade: semCredito ? 'critica' : (criticos.includes(g.wf) ? 'alta' : 'media'), persistente: false, transitorio: trans,
    acao_regra: semCredito ? 'avisar_heitor' : (trans && g.execId && wfs && podeReexecutar.includes(g.wf) ? 'reexecutar' : 'diagnosticar'),
    mensagem: g.qtd + ' execucao(oes) de ' + g.nome + ' falharam no no "' + g.no + '": ' + g.msg });
}

// 4. Execucao rodando ha tempo demais.
const runResp = um('Execucoes rodando');
for (const e of (Array.isArray(runResp.data) ? runResp.data : [])) {
  if (!fabrica[e.workflowId]) continue;
  const limite = e.workflowId === cfg.disparo_id ? 75 : 20;
  const min = minutosDesde(e.startedAt);
  if (min > limite) {
    achar({ chave: 'travado:' + e.id, tipo: 'travado', workflow_id: e.workflowId, workflow_nome: nomeDe(e.workflowId), execucao_id: String(e.id),
      severidade: min > 180 ? 'alta' : 'media',
      mensagem: nomeDe(e.workflowId) + ' esta rodando ha ' + Math.round(min) + ' min (limite ' + limite + ').' });
  }
}

// 5. A fabrica esta produzindo? Olha as tabelas de negocio.
const conversas = linhas('Conversas 48h');
const hojeIni = agora.startOf('day').toMillis();
const saidas = conversas.filter(c => c.direcao === 'saida' && c.tipo === 'template');
const primeirosHoje = saidas.filter(c => c.intencao === 'primeiro_contato' && ms(c.criado_em || c.createdAt) >= hojeIni);
if (ativo(cfg.disparo_id) && agora.weekday <= 6 && agora.hour >= 11 && primeirosHoje.length === 0) {
  achar({ chave: 'sem_disparo:' + agora.toISODate(), tipo: 'sem_disparo', workflow_id: cfg.disparo_id, workflow_nome: nomeDe(cfg.disparo_id),
    severidade: 'alta', mensagem: 'Ja passou das ' + agora.hour + 'h e o disparo nao mandou nenhum primeiro contato hoje.' });
}
const ult24 = saidas.filter(c => minutosDesde(c.criado_em || c.createdAt) <= 1440);
const falhas24 = ult24.filter(c => c.intencao === 'erro');
if (ult24.length >= 5 && falhas24.length / ult24.length >= 0.5) {
  achar({ chave: 'falha_envio_alta', tipo: 'falha_envio_alta', workflow_id: cfg.disparo_id, workflow_nome: nomeDe(cfg.disparo_id),
    severidade: 'critica', acao_regra: ativo(cfg.disparo_id) ? 'pausar_disparo' : 'diagnosticar',
    mensagem: falhas24.length + ' de ' + ult24.length + ' envios das ultimas 24h falharam na Meta. Ultimo erro: ' + corta(falhas24[falhas24.length - 1].erro, 300) });
}
const primeiros48 = saidas.filter(c => c.intencao === 'primeiro_contato').length;
const entradas48 = conversas.filter(c => c.direcao === 'entrada').length;
if (ativo(cfg.inbox_id) && primeiros48 >= 30 && entradas48 === 0) {
  achar({ chave: 'inbox_mudo', tipo: 'inbox_mudo', workflow_id: cfg.inbox_id, workflow_nome: nomeDe(cfg.inbox_id), severidade: 'alta',
    mensagem: primeiros48 + ' primeiros contatos em 48h e nenhuma resposta chegou no inbox. O webhook do WhatsApp pode ter caido.' });
}
for (const p of linhas('Pedidos com problema')) {
  if (minutosDesde(p.atualizado_em || p.criado_em) > 3 * 1440) continue;
  if (p.status === 'briefing') {
    const min = minutosDesde(p.criado_em);
    if (min > Number(cfg.minutos_demo_atrasada)) {
      achar({ chave: 'demo_atrasada:' + p.lead_id, tipo: 'demo_atrasada', workflow_id: cfg.fabrica_id, workflow_nome: nomeDe(cfg.fabrica_id),
        severidade: min > Number(cfg.minutos_demo_critica) ? 'critica' : 'alta',
        detalhes: JSON.stringify({ lead_id: p.lead_id, empresa: p.empresa, telefone: p.telefone }),
        mensagem: 'A demo da ' + p.empresa + ' foi prometida ha ' + Math.round(min) + ' min e ainda nao saiu.' });
    }
  } else if (p.status === 'publicacao_falhou' || p.status === 'envio_falhou') {
    achar({ chave: 'demo_falhou:' + p.lead_id, tipo: 'demo_falhou', workflow_id: cfg.fabrica_id, workflow_nome: nomeDe(cfg.fabrica_id), severidade: 'alta',
      detalhes: JSON.stringify({ lead_id: p.lead_id, empresa: p.empresa, telefone: p.telefone, status: p.status }),
      mensagem: 'A demo da ' + p.empresa + ' falhou (' + p.status + ') e o lead esta esperando o link.' });
  }
}

// 6. Compara com os incidentes abertos.
const abertos = {};
for (const r of linhas('Incidentes abertos')) if (r.chave) abertos[r.chave] = r;
const saida = [];
const vistos = {};
const limiteCiclos = Number(cfg.ciclos_para_escalar) || 4;
for (const f of achados) {
  if (vistos[f.chave]) continue;
  vistos[f.chave] = true;
  const ab = abertos[f.chave];
  if (!ab) { saida.push({ json: Object.assign({ op: 'novo' }, f) }); continue; }
  const ocorrencias = Number(ab.ocorrencias || 1) + 1;
  const escalar = !ab.avisar_heitor && (f.severidade === 'critica' || (f.severidade === 'alta' && ocorrencias >= limiteCiclos));
  saida.push({ json: { op: escalar ? 'escalar' : 'repetido', row_id: ab.id, chave: f.chave, ocorrencias, mensagem: f.mensagem,
    execucao_id: f.execucao_id || ab.execucao_id || '', severidade: f.severidade,
    resumo_para_heitor: ab.resumo_para_heitor || f.mensagem } });
}
for (const chave of Object.keys(abertos)) {
  if (vistos[chave]) continue;
  const ab = abertos[chave];
  const sumiu = (ab.tipo === 'erro' || ab.tipo === 'sem_credito_ia') ? minutosDesde(ab.ultima_vez) > 360 : true;
  if (sumiu) saida.push({ json: { op: 'resolvido', row_id: ab.id, chave } });
}

// 7. O que o watchdog lembra para a proxima rodada.
const ts = agora.toISO();
saida.push({ json: { op: 'estado', chave: 'ultimo_ciclo', valor: ts } });
for (const id of consumidos) saida.push({ json: { op: 'consumir', ev_id: id } });
if (wfs) saida.push({ json: { op: 'estado', chave: 'workflows', valor: JSON.stringify(novaMemWf) } });
saida.push({ json: { op: 'estado', chave: 'reativacoes', valor: JSON.stringify(reativacoes) } });
saida.push({ json: { op: 'estado', chave: 'resumo_ultimo_ciclo', valor: JSON.stringify({ achados: achados.length, abertos: Object.keys(abertos).length, workflows_fabrica: Object.keys(fabrica).length, ativos: Object.keys(fabrica).filter(ativo).length }) } });
return saida;
