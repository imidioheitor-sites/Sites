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

const avisar = f.severidade === 'critica' || acao === 'avisar_heitor' || ia.precisa_do_heitor === true;
const resumo = String(ia.resumo_para_heitor || f.mensagem).slice(0, 400);
const diag = [ia.causa_provavel, ia.diagnostico].filter(Boolean).join(' | ') || 'sem diagnostico da IA';

return { json: Object.assign({}, f, {
  acao,
  avisar_heitor: avisar,
  diagnostico: String(diag).slice(0, 1500),
  proposta: String(ia.proposta || '').slice(0, 3000),
  resumo_para_heitor: resumo,
}) };
