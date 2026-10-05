// A IA diagnostica; quem decide o que pode ser feito e este codigo.
const f = $('Separar por decisao').item.json;
const bruto = String($json.text || '');
let ia = {};
try { ia = JSON.parse(bruto.replace(/^```(json)?/i, '').replace(/```\s*$/, '').trim()); } catch (e) { ia = {}; }

const regras = ['reexecutar', 'reativar', 'pausar_disparo'];
const daIa = ['observar', 'propor_melhoria', 'avisar_heitor'];
let acao;
if (regras.includes(f.acao_regra)) acao = f.acao_regra;
else if (f.acao_regra === 'avisar_heitor') acao = 'avisar_heitor';
else acao = daIa.includes(ia.acao) ? ia.acao : 'observar';

// Se a propria IA falhou por falta de creditos, isso para a fabrica inteira: vira aviso urgente,
// mas so no primeiro problema da rodada, para nao transformar tudo em urgente.
const erroIa = $json.error ? String($json.error.message || $json.error) : '';
const semCredito = $itemIndex === 0 && /payment required|credits have been depleted|\b402\b|insufficient.?(credit|balance|quota)/i.test(erroIa);
const severidade = semCredito ? 'critica' : f.severidade;
const avisar = semCredito || severidade === 'critica' || acao === 'avisar_heitor' || ia.precisa_do_heitor === true;
let resumo = String(ia.resumo_para_heitor || f.mensagem);
if (semCredito) resumo = 'Os creditos de IA do n8n acabaram, e sem eles a fabrica para de responder e de gerar sites. Precisa recarregar ou ligar uma chave propria da Anthropic. ' + resumo;
resumo = resumo.slice(0, 400);
const diag = [ia.causa_provavel, ia.diagnostico].filter(Boolean).join(' | ') || (erroIa ? 'IA nao respondeu: ' + erroIa : 'sem diagnostico da IA');

return { json: Object.assign({}, f, {
  acao,
  severidade,
  avisar_heitor: avisar,
  diagnostico: String(diag).slice(0, 1500),
  proposta: String(ia.proposta || '').slice(0, 3000),
  resumo_para_heitor: resumo,
}) };
