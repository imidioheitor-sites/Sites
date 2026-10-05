import { workflow, node, trigger, sticky, switchCase, ifElse, languageModel, newCredential, expr } from '@n8n/workflow-sdk';

const N8N_CRED = { httpHeaderAuth: newCredential('n8n API (HELU)') };

const aCada30 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.2,
  config: { name: 'A cada 30 minutos', parameters: { rule: { interval: [{ field: 'cronExpression', expression: '*/30 * * * *' }] } } },
  output: [{}]
});
const rodarAgora = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Rodar agora' }, output: [{}] });
const lerConfigCentral = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler a configuracao central', executeOnce: true, alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'm4EZGZ0yH85sDbQx', cachedResultName: 'helu_config' }, returnAll: true } },
  output: [{ chave: 'n8n_base_url', valor: 'https://himidio.app.n8n.cloud' }]
});

const config = node({
  type: 'n8n-nodes-base.set', version: 3.4,
  config: { name: 'Config', executeOnce: true, parameters: { mode: 'manual', includeOtherFields: false, assignments: { assignments: [
    { id: 'c1', name: 'base_url', value: expr('{{ $("Ler a configuracao central").all().map(i => i.json).find(r => r.chave === "n8n_base_url")?.valor || "https://himidio.app.n8n.cloud" }}'), type: 'string' },
    { id: 'c3', name: 'workflows_criticos', value: 'OA98m5taBL6MKCPl,xGshxmTLzcEPFJsz,fUWhoQe6sWmwFCCJ,USGPYgZSVzw0hpvT', type: 'string' },
    { id: 'c4', name: 'retry_permitido', value: 'xGshxmTLzcEPFJsz,OA98m5taBL6MKCPl,FpwZai9wIy2hZeKS,mS6Gl6H4P84JaI9O', type: 'string' },
    { id: 'c5', name: 'reativar_permitido', value: 'OA98m5taBL6MKCPl,pkthakCGcE8MRbO4', type: 'string' },
    { id: 'c6', name: 'disparo_id', value: 'USGPYgZSVzw0hpvT', type: 'string' },
    { id: 'c7', name: 'inbox_id', value: 'OA98m5taBL6MKCPl', type: 'string' },
    { id: 'c8', name: 'fabrica_id', value: 'xGshxmTLzcEPFJsz', type: 'string' },
    { id: 'c9', name: 'ciclos_para_escalar', value: 4, type: 'number' },
    { id: 'c10', name: 'minutos_demo_atrasada', value: 30, type: 'number' },
    { id: 'c11', name: 'minutos_demo_critica', value: 90, type: 'number' }
  ] } } },
  output: [{ base_url: 'https://himidio.app.n8n.cloud' }]
});

const lerWorkflows = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Workflows no n8n', executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2,
    parameters: { url: expr('{{ $("Config").first().json.base_url }}/api/v1/workflows?limit=250'), authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', options: {} },
    credentials: N8N_CRED },
  output: [{ data: [{ id: 'x', name: 'HELU FACTORY | 1', active: true, tags: [] }] }]
});
const lerErrosBarramento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Erros novos no barramento', executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: '0QSQWk4Y5TveoYJJ', cachedResultName: 'helu_eventos' },
      matchType: 'allConditions', filters: { conditions: [
        { keyName: 'tipo', condition: 'eq', keyValue: 'erro_execucao' },
        { keyName: 'status', condition: 'eq', keyValue: 'novo' }
      ] }, returnAll: true } },
  output: [{ id: 1, evento_id: 'E20261005-101010-321', workflow_id: 'x', origem: 'y', severidade: 'alta', titulo: 'Falhou no no Z', detalhe: 'msg | url' }]
});
const lerRodando = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Execucoes rodando', executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
    parameters: { url: expr('{{ $("Config").first().json.base_url }}/api/v1/executions?status=running&limit=50'), authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', options: {} },
    credentials: N8N_CRED },
  output: [{ data: [] }]
});
const lerConversas = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Conversas 48h', executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'FIIe5TtgSbDfgqho', cachedResultName: 'helu_conversas' },
      matchType: 'allConditions', filters: { conditions: [{ keyName: 'createdAt', condition: 'gte', keyValue: expr('{{ $now.minus(48, "hours").toISO() }}') }] }, returnAll: true } },
  output: [{ direcao: 'saida', tipo: 'template', intencao: 'primeiro_contato', criado_em: '2026-10-05T13:00:00Z' }]
});
const lerPedidos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Pedidos com problema', executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'AxZ32WDnnSaU371p', cachedResultName: 'helu_pedidos' },
      matchType: 'anyCondition', filters: { conditions: [
        { keyName: 'status', condition: 'eq', keyValue: 'briefing' },
        { keyName: 'status', condition: 'eq', keyValue: 'publicacao_falhou' },
        { keyName: 'status', condition: 'eq', keyValue: 'envio_falhou' }
      ] }, returnAll: true } },
  output: [{ lead_id: 'L1', empresa: 'X', status: 'briefing', criado_em: '2026-10-05T13:00:00Z' }]
});
const lerAbertos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Incidentes abertos', executeOnce: true, alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'hnQhOtCbd7Dw6MAC', cachedResultName: 'helu_watchdog_incidentes' },
      matchType: 'allConditions', filters: { conditions: [{ keyName: 'status', condition: 'eq', keyValue: 'aberto' }] }, returnAll: true } },
  output: [{ id: 1, chave: 'x', status: 'aberto', ocorrencias: 1 }]
});
const lerEstado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Estado do watchdog', executeOnce: true, alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'ONRMPhHtV6YOh065', cachedResultName: 'helu_watchdog_estado' }, returnAll: true } },
  output: [{ chave: 'ultimo_ciclo', valor: '2026-10-05T13:00:00Z' }]
});

const diagnosticar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Diagnosticar', executeOnce: true, parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "// Junta tudo o que foi lido, acha os problemas e compara com os incidentes ja abertos.\n// Sai um item por decisao: novo, repetido, escalar, resolvido ou estado.\nconst cfg = $('Config').first().json;\nconst agora = DateTime.now().setZone('America/Sao_Paulo');\nconst agoraMs = agora.toMillis();\nconst lista = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);\nconst linhas = (nome) => { try { return $(nome).all().map(i => i.json).filter(r => r && Object.keys(r).length); } catch (e) { return []; } };\nconst um = (nome) => { try { return $(nome).first().json || {}; } catch (e) { return {}; } };\nconst ms = (iso) => { const t = Date.parse(iso || ''); return isNaN(t) ? 0 : t; };\nconst minutosDesde = (iso) => (agoraMs - ms(iso)) / 60000;\nconst corta = (s, n) => String(s == null ? '' : s).replace(/\\s+/g, ' ').trim().slice(0, n);\n\nconst estado = {};\nfor (const r of linhas('Estado do watchdog')) estado[r.chave] = r.valor;\nconst ler = (k, padrao) => { try { return JSON.parse(estado[k]); } catch (e) { return padrao; } };\nconst memWf = ler('workflows', {});\nconst reativacoes = ler('reativacoes', {});\n\nconst criticos = lista(cfg.workflows_criticos);\nconst podeReexecutar = lista(cfg.retry_permitido);\nconst podeReativar = lista(cfg.reativar_permitido);\nconst achados = [];\nconst achar = (f) => achados.push(Object.assign({ workflow_id: '', workflow_nome: '', execucao_id: '', persistente: true, transitorio: false, acao_regra: 'diagnosticar', detalhes: '' }, f));\n\n// 1. A API do n8n respondeu?\nconst wfResp = um('Workflows no n8n');\nconst wfs = Array.isArray(wfResp.data) ? wfResp.data : null;\nconst fabrica = {};\nif (!wfs) {\n  achar({ chave: 'api_n8n_fora', tipo: 'api_n8n_fora', severidade: 'alta', acao_regra: 'avisar_heitor',\n    mensagem: 'O watchdog nao conseguiu ler a API do n8n (falta a credencial n8n API (HELU) ou a chave venceu): ' + corta(JSON.stringify(wfResp.error || wfResp), 300) });\n} else {\n  for (const w of wfs) {\n    const nome = String(w.name || '');\n    if (!nome.startsWith('HELU FACTORY')) continue;\n    if (/watchdog|teste|importador/i.test(nome)) continue;\n    fabrica[w.id] = w;\n  }\n}\nconst nomeDe = (id) => (fabrica[id] && fabrica[id].name) || id;\nconst ativo = (id) => !!(fabrica[id] && fabrica[id].active);\n\n// 2. Workflow da fabrica que estava ligado e desligou.\nconst novaMemWf = {};\nfor (const id of Object.keys(fabrica)) {\n  const w = fabrica[id];\n  const tags = (w.tags || []).map(t => String(t.name || t).toLowerCase());\n  const pausado = tags.includes('pausado') || tags.includes('manutencao');\n  const antes = memWf[id] || {};\n  const jaFoiVisto = !!antes.visto_ativo;\n  novaMemWf[id] = { visto_ativo: w.active ? true : (pausado ? false : jaFoiVisto), nome: w.name };\n  if (!w.active && jaFoiVisto && !pausado) {\n    const ultimaReativ = ms(reativacoes[id]);\n    const podeAgora = podeReativar.includes(id) && (agoraMs - ultimaReativ) > 24 * 3600000;\n    achar({ chave: 'inativo:' + id, tipo: 'inativo', workflow_id: id, workflow_nome: w.name,\n      severidade: podeReativar.includes(id) ? 'alta' : 'media',\n      acao_regra: podeAgora ? 'reativar' : 'diagnosticar',\n      mensagem: w.name + ' estava ligado e agora esta desligado. Para o watchdog ignorar, coloque a tag pausado no workflow.' });\n    if (podeAgora) reativacoes[id] = agora.toISO();\n  }\n}\n\n// 3. Falhas que a Caixa de erros gravou em helu_eventos e ninguem tratou ainda.\nconst grupos = {};\nconst consumidos = [];\nfor (const ev of linhas('Erros novos no barramento')) {\n  if (!ev.id) continue;\n  consumidos.push(ev.id);\n  if (ev.severidade === 'baixa') continue;\n  const wf = ev.workflow_id || 'desconhecido';\n  const no = String(ev.titulo || '').replace(/^Falhou no no /, '') || 'desconhecido';\n  const msg = corta(String(ev.detalhe || '').split(' | ')[0] || 'erro sem mensagem', 500);\n  const execId = String(ev.evento_id || '').split('-').pop();\n  const chave = 'erro:' + wf + ':' + no;\n  const g = grupos[chave] || (grupos[chave] = { qtd: 0, execId: '', msg, no, wf, nome: ev.origem || nomeDe(wf) });\n  g.qtd += 1;\n  if (/^\\d+$/.test(execId) && Number(execId) > Number(g.execId || 0)) { g.execId = execId; g.msg = msg; }\n}\nconst transitorio = /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up|\\b429\\b|rate.?limit|overloaded|\\b52[0-9]\\b|\\b50[234]\\b|bad gateway|service unavailable|temporarily/i;\nfor (const chave of Object.keys(grupos)) {\n  const g = grupos[chave];\n  const trans = transitorio.test(g.msg);\n  achar({ chave, tipo: 'erro', workflow_id: g.wf, workflow_nome: g.nome, execucao_id: g.execId,\n    severidade: criticos.includes(g.wf) ? 'alta' : 'media', persistente: false, transitorio: trans,\n    acao_regra: trans && g.execId && wfs && podeReexecutar.includes(g.wf) ? 'reexecutar' : 'diagnosticar',\n    mensagem: g.qtd + ' execucao(oes) de ' + g.nome + ' falharam no no \"' + g.no + '\": ' + g.msg });\n}\n\n// 4. Execucao rodando ha tempo demais.\nconst runResp = um('Execucoes rodando');\nfor (const e of (Array.isArray(runResp.data) ? runResp.data : [])) {\n  if (!fabrica[e.workflowId]) continue;\n  const limite = e.workflowId === cfg.disparo_id ? 75 : 20;\n  const min = minutosDesde(e.startedAt);\n  if (min > limite) {\n    achar({ chave: 'travado:' + e.id, tipo: 'travado', workflow_id: e.workflowId, workflow_nome: nomeDe(e.workflowId), execucao_id: String(e.id),\n      severidade: min > 180 ? 'alta' : 'media',\n      mensagem: nomeDe(e.workflowId) + ' esta rodando ha ' + Math.round(min) + ' min (limite ' + limite + ').' });\n  }\n}\n\n// 5. A fabrica esta produzindo? Olha as tabelas de negocio.\nconst conversas = linhas('Conversas 48h');\nconst hojeIni = agora.startOf('day').toMillis();\nconst saidas = conversas.filter(c => c.direcao === 'saida' && c.tipo === 'template');\nconst primeirosHoje = saidas.filter(c => c.intencao === 'primeiro_contato' && ms(c.criado_em || c.createdAt) >= hojeIni);\nif (ativo(cfg.disparo_id) && agora.weekday <= 6 && agora.hour >= 11 && primeirosHoje.length === 0) {\n  achar({ chave: 'sem_disparo:' + agora.toISODate(), tipo: 'sem_disparo', workflow_id: cfg.disparo_id, workflow_nome: nomeDe(cfg.disparo_id),\n    severidade: 'alta', mensagem: 'Ja passou das ' + agora.hour + 'h e o disparo nao mandou nenhum primeiro contato hoje.' });\n}\nconst ult24 = saidas.filter(c => minutosDesde(c.criado_em || c.createdAt) <= 1440);\nconst falhas24 = ult24.filter(c => c.intencao === 'erro');\nif (ult24.length >= 5 && falhas24.length / ult24.length >= 0.5) {\n  achar({ chave: 'falha_envio_alta', tipo: 'falha_envio_alta', workflow_id: cfg.disparo_id, workflow_nome: nomeDe(cfg.disparo_id),\n    severidade: 'critica', acao_regra: ativo(cfg.disparo_id) ? 'pausar_disparo' : 'diagnosticar',\n    mensagem: falhas24.length + ' de ' + ult24.length + ' envios das ultimas 24h falharam na Meta. Ultimo erro: ' + corta(falhas24[falhas24.length - 1].erro, 300) });\n}\nconst primeiros48 = saidas.filter(c => c.intencao === 'primeiro_contato').length;\nconst entradas48 = conversas.filter(c => c.direcao === 'entrada').length;\nif (ativo(cfg.inbox_id) && primeiros48 >= 30 && entradas48 === 0) {\n  achar({ chave: 'inbox_mudo', tipo: 'inbox_mudo', workflow_id: cfg.inbox_id, workflow_nome: nomeDe(cfg.inbox_id), severidade: 'alta',\n    mensagem: primeiros48 + ' primeiros contatos em 48h e nenhuma resposta chegou no inbox. O webhook do WhatsApp pode ter caido.' });\n}\nfor (const p of linhas('Pedidos com problema')) {\n  if (minutosDesde(p.atualizado_em || p.criado_em) > 3 * 1440) continue;\n  if (p.status === 'briefing') {\n    const min = minutosDesde(p.criado_em);\n    if (min > Number(cfg.minutos_demo_atrasada)) {\n      achar({ chave: 'demo_atrasada:' + p.lead_id, tipo: 'demo_atrasada', workflow_id: cfg.fabrica_id, workflow_nome: nomeDe(cfg.fabrica_id),\n        severidade: min > Number(cfg.minutos_demo_critica) ? 'critica' : 'alta',\n        detalhes: JSON.stringify({ lead_id: p.lead_id, empresa: p.empresa, telefone: p.telefone }),\n        mensagem: 'A demo da ' + p.empresa + ' foi prometida ha ' + Math.round(min) + ' min e ainda nao saiu.' });\n    }\n  } else if (p.status === 'publicacao_falhou' || p.status === 'envio_falhou') {\n    achar({ chave: 'demo_falhou:' + p.lead_id, tipo: 'demo_falhou', workflow_id: cfg.fabrica_id, workflow_nome: nomeDe(cfg.fabrica_id), severidade: 'alta',\n      detalhes: JSON.stringify({ lead_id: p.lead_id, empresa: p.empresa, telefone: p.telefone, status: p.status }),\n      mensagem: 'A demo da ' + p.empresa + ' falhou (' + p.status + ') e o lead esta esperando o link.' });\n  }\n}\n\n// 6. Compara com os incidentes abertos.\nconst abertos = {};\nfor (const r of linhas('Incidentes abertos')) if (r.chave) abertos[r.chave] = r;\nconst saida = [];\nconst vistos = {};\nconst limiteCiclos = Number(cfg.ciclos_para_escalar) || 4;\nfor (const f of achados) {\n  if (vistos[f.chave]) continue;\n  vistos[f.chave] = true;\n  const ab = abertos[f.chave];\n  if (!ab) { saida.push({ json: Object.assign({ op: 'novo' }, f) }); continue; }\n  const ocorrencias = Number(ab.ocorrencias || 1) + 1;\n  const escalar = !ab.avisar_heitor && (f.severidade === 'critica' || (f.severidade === 'alta' && ocorrencias >= limiteCiclos));\n  saida.push({ json: { op: escalar ? 'escalar' : 'repetido', row_id: ab.id, chave: f.chave, ocorrencias, mensagem: f.mensagem,\n    execucao_id: f.execucao_id || ab.execucao_id || '', severidade: f.severidade,\n    resumo_para_heitor: ab.resumo_para_heitor || f.mensagem } });\n}\nfor (const chave of Object.keys(abertos)) {\n  if (vistos[chave]) continue;\n  const ab = abertos[chave];\n  const sumiu = ab.tipo === 'erro' ? minutosDesde(ab.ultima_vez) > 360 : true;\n  if (sumiu) saida.push({ json: { op: 'resolvido', row_id: ab.id, chave } });\n}\n\n// 7. O que o watchdog lembra para a proxima rodada.\nconst ts = agora.toISO();\nsaida.push({ json: { op: 'estado', chave: 'ultimo_ciclo', valor: ts } });\nfor (const id of consumidos) saida.push({ json: { op: 'consumir', ev_id: id } });\nif (wfs) saida.push({ json: { op: 'estado', chave: 'workflows', valor: JSON.stringify(novaMemWf) } });\nsaida.push({ json: { op: 'estado', chave: 'reativacoes', valor: JSON.stringify(reativacoes) } });\nsaida.push({ json: { op: 'estado', chave: 'resumo_ultimo_ciclo', valor: JSON.stringify({ achados: achados.length, abertos: Object.keys(abertos).length, workflows_fabrica: Object.keys(fabrica).length, ativos: Object.keys(fabrica).filter(ativo).length }) } });\nreturn saida;\n" } },
  output: [{ op: 'novo', chave: 'erro:x:y', tipo: 'erro', severidade: 'alta', acao_regra: 'diagnosticar', mensagem: 'm', workflow_id: 'x', workflow_nome: 'y', execucao_id: '1', detalhes: '' }]
});

const separar = switchCase({
  version: 3.2,
  config: { name: 'Separar por decisao', parameters: { rules: { values: [
    { outputKey: 'novo', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.op }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'novo' }], combinator: 'and' } }, { outputKey: 'repetido', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.op }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'repetido' }], combinator: 'and' } }, { outputKey: 'escalar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.op }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'escalar' }], combinator: 'and' } }, { outputKey: 'resolvido', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.op }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'resolvido' }], combinator: 'and' } }, { outputKey: 'estado', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.op }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'estado' }], combinator: 'and' } }, { outputKey: 'consumir', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.op }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'consumir' }], combinator: 'and' } }
  ] }, options: {} } }
});

const claude = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', version: 1.3,
  config: { name: 'Claude Sonnet 5 (watchdog)', parameters: { model: { __rl: true, mode: 'list', value: 'claude-sonnet-5', cachedResultName: 'Claude Sonnet 5' }, options: { maxTokensToSample: 900 } } }
});
const diagnosticoIa = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm', version: 1.7,
  config: { name: 'Claude diagnostica', onError: 'continueRegularOutput', parameters: {
    promptType: 'define',
    text: expr('Problema encontrado pelo watchdog:\n{{ JSON.stringify({ tipo: $json.tipo, severidade: $json.severidade, workflow: $json.workflow_nome, execucao: $json.execucao_id, mensagem: $json.mensagem, detalhes: $json.detalhes, acao_ja_decidida_pela_regra: $json.acao_regra }, null, 2) }}'),
    messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "Voce e o watchdog da HELU FACTORY, uma fabrica automatica de sites no n8n que acha pequenos negocios no Brasil, conversa com eles pelo WhatsApp, gera uma demo do site com IA, publica na Vercel e negocia o preco. O dono e o Heitor, que quer ser incomodado o minimo possivel.\n\nOs fluxos da fabrica:\n- 1. Disparo: manda o template de primeiro contato da Meta para 50 leads por dia.\n- 2. Inbox: recebe as respostas no WhatsApp (WhatsApp Trigger), classifica com o Claude e roteia.\n- 3. Fabrica de sites: briefing, escrita do HTML, revisores, publicacao na Vercel e envio da demo no WhatsApp.\n- 4. Negociacao e Pix: negocia dentro de uma faixa fixa e manda a chave Pix.\n- 5, 6, 6b, 7: agente diario de melhoria, aplicador de prompts, desfazer e bancada de provas.\n- Infra | Caixa de erros: grava toda falha em producao no barramento helu_eventos.\n\nVoce recebe UM problema que o codigo do watchdog encontrou. Explique a causa provavel em linguagem simples e diga o que fazer. Voce nao executa nada: o codigo so aceita estas acoes vindas de voce:\n- observar: provavelmente passa sozinho ou ja foi tratado pela regra; so registrar.\n- propor_melhoria: o erro vai voltar enquanto alguem nao mudar o fluxo, um prompt ou uma configuracao; escreva a proposta concreta.\n- avisar_heitor: so o Heitor resolve (credencial vencida ou faltando, saldo ou creditos acabando, conta da Meta ou da Vercel bloqueada, plano do n8n vencido, lead esperando resposta humana, dinheiro envolvido).\n\nPistas comuns:\n- 401, 403, \"unauthorized\", \"invalid token\", \"credentials\" = credencial; quase sempre avisar_heitor.\n- 429, rate limit, overloaded, timeout, 5xx = passageiro; observar (a regra ja reexecuta quando pode).\n- (#131047) = texto livre fora da janela de 24h da Meta; (#131026) = numero sem WhatsApp; (#131031) ou (#368) = conta bloqueada ou restrita, avisar_heitor; (#132001) = template nao aprovado ou nome errado, avisar_heitor.\n- \"Your trial has ended\" ou limite de execucoes = plano do n8n, avisar_heitor.\n- Erro de JSON ou campo vazio depois de um no de IA = prompt ou parser fragil, propor_melhoria.\n- Demo atrasada ou falha na demo = um lead real esta esperando; se passou de 90 min, avisar_heitor.\n\nResponda APENAS com um JSON, sem texto em volta e sem cercas de codigo:\n{\"causa_provavel\":\"uma frase\",\"diagnostico\":\"ate 3 frases com o que aconteceu e por que\",\"acao\":\"observar|propor_melhoria|avisar_heitor\",\"precisa_do_heitor\":false,\"proposta\":\"so quando acao for propor_melhoria: o que mudar, em qual no, passo a passo\",\"resumo_para_heitor\":\"no maximo 2 frases curtas, faladas, em portugues do Brasil, dizendo o que aconteceu e o que ele precisa fazer, como se fosse uma ligacao\"}\n" }] }
  }, subnodes: { model: claude } },
  output: [{ text: '{"acao":"observar"}' }]
});

const escolher = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Escolher a acao', parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: "// A IA diagnostica; quem decide o que pode ser feito e este codigo.\nconst f = $('Separar por decisao').item.json;\nconst bruto = String($json.text || '');\nlet ia = {};\ntry { ia = JSON.parse(bruto.replace(/^```(json)?/i, '').replace(/```\\s*$/, '').trim()); } catch (e) { ia = {}; }\n\nconst regras = ['reexecutar', 'reativar', 'pausar_disparo'];\nconst daIa = ['observar', 'propor_melhoria', 'avisar_heitor'];\nlet acao;\nif (regras.includes(f.acao_regra)) acao = f.acao_regra;\nelse if (f.acao_regra === 'avisar_heitor') acao = 'avisar_heitor';\nelse acao = daIa.includes(ia.acao) ? ia.acao : 'observar';\n\nconst avisar = f.severidade === 'critica' || acao === 'avisar_heitor' || ia.precisa_do_heitor === true;\nconst resumo = String(ia.resumo_para_heitor || f.mensagem).slice(0, 400);\nconst diag = [ia.causa_provavel, ia.diagnostico].filter(Boolean).join(' | ') || 'sem diagnostico da IA';\n\nreturn { json: Object.assign({}, f, {\n  acao,\n  avisar_heitor: avisar,\n  diagnostico: String(diag).slice(0, 1500),\n  proposta: String(ia.proposta || '').slice(0, 3000),\n  resumo_para_heitor: resumo,\n}) };\n" } },
  output: [{ op: 'novo', chave: 'x', acao: 'observar', avisar_heitor: false, diagnostico: 'd', resumo_para_heitor: 'r', proposta: '' }]
});

const executarAcao = switchCase({
  version: 3.2,
  config: { name: 'Executar a acao', parameters: { rules: { values: [
    { outputKey: 'reexecutar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'reexecutar' }], combinator: 'and' } }, { outputKey: 'reativar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'reativar' }], combinator: 'and' } }, { outputKey: 'pausar_disparo', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'pausar_disparo' }], combinator: 'and' } }, { outputKey: 'propor_melhoria', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'propor_melhoria' }], combinator: 'and' } }
  ] }, options: { fallbackOutput: 'extra', renameFallbackOutput: 'so_registrar' } } }
});

const reexecutar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Reexecutar a execucao', onError: 'continueRegularOutput', parameters: {
    method: 'POST', url: expr('{{ $("Config").first().json.base_url }}/api/v1/executions/{{ $json.execucao_id }}/retry'),
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: '{"loadWorkflow": true}', options: {} },
    credentials: N8N_CRED },
  output: [{ id: '2' }]
});
const reativar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Religar o workflow', onError: 'continueRegularOutput', parameters: {
    method: 'POST', url: expr('{{ $("Config").first().json.base_url }}/api/v1/workflows/{{ $json.workflow_id }}/activate'),
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', options: {} },
    credentials: N8N_CRED },
  output: [{ id: 'x', active: true }]
});
const pausarDisparo = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Pausar o disparo', onError: 'continueRegularOutput', parameters: {
    method: 'POST', url: expr('{{ $("Config").first().json.base_url }}/api/v1/workflows/{{ $("Config").first().json.disparo_id }}/deactivate'),
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', options: {} },
    credentials: N8N_CRED },
  output: [{ id: 'x', active: false }]
});
const proporMelhoria = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Propor melhoria ao dono', onError: 'continueRegularOutput', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: 'vRmv4Hf3GNyOCNea', cachedResultName: 'helu_melhorias' },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      proposta_id: expr('{{ "W" + $now.toFormat("yyyyMMdd") + "-" + $json.chave.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60) }}'),
      criado_em: expr('{{ $now.toISO() }}'),
      alvo_workflow: expr('{{ $json.workflow_id }}'),
      alvo_no: expr('{{ $json.chave }}'),
      campo: 'acao', tipo: 'acao', risco: 'medio', status: 'precisa_voce', fonte: 'watchdog',
      tema: expr('{{ "falha recorrente: " + $json.tipo }}'),
      diagnostico: expr('{{ $json.diagnostico }}'),
      evidencia: expr('{{ $json.mensagem }}'),
      texto_proposto: expr('{{ $json.proposta || $json.diagnostico }}'),
      observacao: 'criado automaticamente pelo watchdog'
    } }, options: {} } },
  output: [{ id: 3 }]
});
const soRegistrar = node({ type: 'n8n-nodes-base.noOp', version: 1, config: { name: 'Nada a executar' }, output: [{}] });

const registrar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar o incidente', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: 'hnQhOtCbd7Dw6MAC', cachedResultName: 'helu_watchdog_incidentes' },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      chave: expr('{{ $("Escolher a acao").item.json.chave }}'),
      tipo: expr('{{ $("Escolher a acao").item.json.tipo }}'),
      severidade: expr('{{ $("Escolher a acao").item.json.severidade }}'),
      status: 'aberto',
      workflow_id: expr('{{ $("Escolher a acao").item.json.workflow_id }}'),
      workflow_nome: expr('{{ $("Escolher a acao").item.json.workflow_nome }}'),
      execucao_id: expr('{{ $("Escolher a acao").item.json.execucao_id }}'),
      mensagem: expr('{{ $("Escolher a acao").item.json.mensagem }}'),
      diagnostico: expr('{{ $("Escolher a acao").item.json.diagnostico }}'),
      acao: expr('{{ $("Escolher a acao").item.json.acao }}'),
      resultado_acao: expr('{{ $json.error ? "falhou: " + String($json.error.message || JSON.stringify($json.error)).slice(0, 300) : ({ reexecutar: "reexecucao pedida ao n8n", reativar: "workflow religado", pausar_disparo: "disparo pausado", propor_melhoria: "proposta criada em helu_melhorias" }[$("Escolher a acao").item.json.acao] || "so registrado") }}'),
      tentativas: expr('{{ ["reexecutar", "reativar", "pausar_disparo"].includes($("Escolher a acao").item.json.acao) ? 1 : 0 }}'),
      ocorrencias: 1,
      avisar_heitor: expr('{{ $("Escolher a acao").item.json.avisar_heitor || (!!$json.error && ["reativar", "pausar_disparo"].includes($("Escolher a acao").item.json.acao)) }}'),
      aviso_status: expr('{{ ($("Escolher a acao").item.json.avisar_heitor || (!!$json.error && ["reativar", "pausar_disparo"].includes($("Escolher a acao").item.json.acao))) ? "pendente" : "nao" }}'),
      resumo_para_heitor: expr('{{ $("Escolher a acao").item.json.resumo_para_heitor }}'),
      primeira_vez: expr('{{ $now.toISO() }}'),
      ultima_vez: expr('{{ $now.toISO() }}'),
      resolvido_em: ''
    } }, options: {} } },
  output: [{ id: 10, chave: 'x', avisar_heitor: true, aviso_status: 'pendente', severidade: 'alta', resumo_para_heitor: 'r', mensagem: 'm', workflow_nome: 'w' }]
});

const escalar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Marcar para avisar', parameters: {
    resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: 'hnQhOtCbd7Dw6MAC', cachedResultName: 'helu_watchdog_incidentes' },
    matchType: 'allConditions', filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.row_id }}') }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      ocorrencias: expr('{{ $json.ocorrencias }}'), ultima_vez: expr('{{ $now.toISO() }}'), mensagem: expr('{{ $json.mensagem }}'),
      severidade: expr('{{ $json.severidade }}'), avisar_heitor: true, aviso_status: 'pendente'
    } }, options: {} } },
  output: [{ id: 10, chave: 'x', avisar_heitor: true, aviso_status: 'pendente', severidade: 'alta', resumo_para_heitor: 'r', mensagem: 'm', workflow_nome: 'w' }]
});

const publicar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Publicar no barramento', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: '0QSQWk4Y5TveoYJJ', cachedResultName: 'helu_eventos' },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      evento_id: expr('{{ "E" + $now.toFormat("yyyyLLdd-HHmmss") + "-W" + $json.id }}'),
      criado_em: expr('{{ $now.toISO() }}'),
      origem: 'HELU FACTORY | Watchdog',
      workflow_id: expr('{{ $json.workflow_id }}'),
      tipo: 'watchdog_reparo',
      severidade: expr('{{ $json.status === "resolvido" ? "baixa" : ($json.severidade === "critica" ? "urgente" : $json.severidade) }}'),
      lead_id: expr('{{ /^demo_/.test($json.chave || "") ? String($json.chave).split(":")[1] : "" }}'),
      titulo: expr('{{ (($json.status === "resolvido" ? "Resolvido: " : (Number($json.ocorrencias) > 1 ? "Continua (" + $json.ocorrencias + " ciclos): " : "")) + $json.tipo + " em " + ($json.workflow_nome || "fabrica")).slice(0, 200) }}'),
      detalhe: expr('{{ [$json.resumo_para_heitor, $json.mensagem, $json.diagnostico ? "Diagnostico: " + $json.diagnostico : "", $json.acao ? "Acao: " + $json.acao + " (" + ($json.resultado_acao || "") + ")" : "", "Incidente " + $json.id + " em helu_watchdog_incidentes"].filter(Boolean).join(" | ").slice(0, 1500) }}'),
      precisa_heitor: expr('{{ $json.status !== "resolvido" && $json.avisar_heitor === true }}'),
      status: 'novo', tratado_por: '', tratado_em: ''
    } }, options: {} } },
  output: [{ id: 1 }]
});
const consumir = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Marcar o erro como em tratamento', parameters: {
    resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: '0QSQWk4Y5TveoYJJ', cachedResultName: 'helu_eventos' },
    matchType: 'allConditions', filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.ev_id }}') }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: { status: 'em_tratamento', tratado_por: 'watchdog', tratado_em: expr('{{ $now.toISO() }}') } }, options: {} } },
  output: [{ id: 1 }]
});
const contarRepeticao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Contar a repeticao', parameters: {
    resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: 'hnQhOtCbd7Dw6MAC', cachedResultName: 'helu_watchdog_incidentes' },
    matchType: 'allConditions', filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.row_id }}') }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      ocorrencias: expr('{{ $json.ocorrencias }}'), ultima_vez: expr('{{ $now.toISO() }}'), mensagem: expr('{{ $json.mensagem }}'), execucao_id: expr('{{ $json.execucao_id }}')
    } }, options: {} } },
  output: [{ id: 10 }]
});
const fecharResolvido = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Fechar o que se resolveu', parameters: {
    resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: 'hnQhOtCbd7Dw6MAC', cachedResultName: 'helu_watchdog_incidentes' },
    matchType: 'allConditions', filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.row_id }}') }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: { status: 'resolvido', resolvido_em: expr('{{ $now.toISO() }}') } }, options: {} } },
  output: [{ id: 10 }]
});
const guardarEstado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Guardar o estado', parameters: {
    resource: 'row', operation: 'upsert', dataTableId: { __rl: true, mode: 'id', value: 'ONRMPhHtV6YOh065', cachedResultName: 'helu_watchdog_estado' },
    matchType: 'allConditions', filters: { conditions: [{ keyName: 'chave', condition: 'eq', keyValue: expr('{{ $json.chave }}') }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: { chave: expr('{{ $json.chave }}'), valor: expr('{{ $json.valor }}'), atualizado_em: expr('{{ $now.toISO() }}') } }, options: {} } },
  output: [{ id: 1 }]
});

const notaGeral = sticky('## Vigia da fabrica\n\nA cada 30 min ele le o n8n, os erros que a Caixa de erros gravou em helu_eventos e as tabelas da fabrica, e procura:\n\n- workflow da fabrica que estava ligado e desligou\n- execucao com erro (agrupada por workflow e no)\n- execucao travada\n- disparo que nao saiu, envio falhando na Meta, inbox mudo\n- demo prometida ao lead que nao saiu ou falhou\n\nCada problema vira UMA linha em **helu_watchdog_incidentes**, sem repetir. Se some, ele fecha sozinho.\n\nPara o watchdog ignorar um workflow desligado de proposito, coloque a tag **pausado** nele.', [lerWorkflows, lerEstado], { color: 4, width: 560, height: 420 });
const notaRegras = sticky('## Quem decide o que\n\nA IA so diagnostica e sugere. O codigo decide o que pode ser feito, sempre dentro desta lista:\n\n1. **Reexecutar**: so erro passageiro (timeout, 429, 5xx, overloaded) nos workflows de retry_permitido. Uma vez.\n2. **Religar**: so os de reativar_permitido (hoje, o Inbox e a Caixa de erros), no maximo uma vez a cada 24h.\n3. **Pausar o disparo**: se metade ou mais dos envios de 24h falharam na Meta, para proteger o numero.\n4. **Propor melhoria**: vai para helu_melhorias como precisa_voce.\n\nO watchdog nunca manda mensagem para lead nem mexe em preco.', [escolher, executarAcao], { color: 5, width: 520, height: 420 });
const notaAviso = sticky('## Falar com o Heitor e coisa do Reacher\n\nO watchdog nunca liga. Todo incidente novo, toda escalada e toda resolucao vira uma linha tipo watchdog_reparo em **helu_eventos**, que o Reacher le.\n\n- severidade **urgente** (critica aqui): demo prometida ha mais de 90 min, envio falhando na Meta, falha ao religar o Inbox ou a Caixa de erros.\n- **precisa_heitor = true**: quando a IA ve que so ele resolve (credencial, saldo, conta bloqueada, plano do n8n).\n- severidade alta so vira precisa_heitor se continuar por 4 ciclos (2 h).\n\nOs erros lidos do barramento ficam como em_tratamento, tratado_por watchdog.', [publicar, consumir], { color: 6, width: 520, height: 400 });

export default workflow('helu-watchdog', 'HELU FACTORY | Watchdog | Vigia da fabrica')
  .add(aCada30).to(lerConfigCentral)
  .add(rodarAgora).to(lerConfigCentral)
  .add(lerConfigCentral).to(config).to(lerWorkflows).to(lerErrosBarramento).to(lerRodando).to(lerConversas).to(lerPedidos).to(lerAbertos).to(lerEstado).to(diagnosticar)
  .to(separar
    .onCase(0, diagnosticoIa.to(escolher).to(executarAcao
      .onCase(0, reexecutar.to(registrar))
      .onCase(1, reativar.to(registrar))
      .onCase(2, pausarDisparo.to(registrar))
      .onCase(3, proporMelhoria.to(registrar))
      .onCase(4, soRegistrar.to(registrar))))
    .onCase(1, contarRepeticao)
    .onCase(2, escalar.to(publicar))
    .onCase(3, fecharResolvido.to(publicar))
    .onCase(4, guardarEstado)
    .onCase(5, consumir))
  .add(registrar).to(publicar)
  .add(notaGeral).add(notaRegras).add(notaAviso)
  .group('Leitura', [lerWorkflows, lerErrosBarramento, lerRodando, lerConversas, lerPedidos, lerAbertos, lerEstado], { description: 'Le workflows e execucoes travadas pela API, erros novos do barramento, conversas de 48h, pedidos abertos e a memoria' })
  .group('Diagnostico com IA', [diagnosticoIa, escolher], { description: 'O Claude explica a causa e sugere; o codigo escolhe a acao dentro da lista permitida' });
