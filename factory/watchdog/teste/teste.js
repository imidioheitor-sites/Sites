const { DateTime } = require('luxon');
const fs = require('fs');
const code = fs.readFileSync(require('path').join(__dirname,'..','diagnosticar.js'),'utf8');
function rodar(dados){
  const $ = (n) => { const v = dados[n]; if (v===undefined) throw new Error('sem '+n); const arr = Array.isArray(v)?v:[v]; return { all:()=>arr.map(j=>({json:j})), first:()=>({json:arr[0]}) }; };
  return new Function('$','DateTime', code)($, DateTime);
}
const now = DateTime.now();
const iso = (m) => now.minus({minutes:m}).toISO();
const cfg = { workflows_criticos:'OA,FAB,DISP', retry_permitido:'FAB,OA', reativar_permitido:'OA', disparo_id:'DISP', inbox_id:'OA', fabrica_id:'FAB', ciclos_para_escalar:4, minutos_demo_atrasada:30, minutos_demo_critica:90, erro_injetado:'' };
// cenario 1: api fora
let out = rodar({ 'Config':cfg, 'Workflows no n8n':{error:{message:'401 unauthorized'}}, 'Execucoes com erro':{}, 'Execucoes rodando':{}, 'Conversas 48h':[{}], 'Pedidos com problema':[{}], 'Incidentes abertos':[{}], 'Estado do watchdog':[{}] });
console.log('C1', out.map(o=>o.json.op+':'+(o.json.chave)).join(' | '));
// cenario 2: tudo rodando com problemas
const wfs = {data:[{id:'OA',name:'HELU FACTORY | 2. Inbox',active:false,tags:[]},{id:'DISP',name:'HELU FACTORY | 1. Disparo',active:true,tags:[]},{id:'FAB',name:'HELU FACTORY | 3. Fabrica',active:false,tags:[]},{id:'T',name:'HELU FACTORY | Teste do x',active:false}]};
const estado = [{chave:'workflows',valor:JSON.stringify({OA:{visto_ativo:true}})},{chave:'ultimo_erro_id',valor:'100'}];
const erros = {data:[{id:'101',workflowId:'FAB',mode:'trigger',data:{resultData:{lastNodeExecuted:'Publicar na Vercel',error:{message:'Request failed with status code 503'}}}},{id:'99',workflowId:'FAB',mode:'trigger'},{id:'102',workflowId:'OA',mode:'manual'}]};
const run = {data:[{id:'200',workflowId:'FAB',startedAt:iso(45)}]};
const conv = []; for(let i=0;i<6;i++) conv.push({direcao:'saida',tipo:'template',intencao: i<4?'erro':'primeiro_contato',erro:'(#131031) Account locked',criado_em:iso(60)});
const ped = [{status:'briefing',lead_id:'L1',empresa:'Marmitas da Josi',criado_em:iso(100),atualizado_em:iso(100)},{status:'envio_falhou',lead_id:'L2',empresa:'Marcenaria JR',criado_em:iso(50),atualizado_em:iso(40)}];
const abertos = [{id:7,chave:'falha_envio_alta',ocorrencias:1,avisar_heitor:false,tipo:'falha_envio_alta'},{id:8,chave:'erro:OA:x',tipo:'erro',ultima_vez:iso(400)},{id:9,chave:'inbox_mudo',tipo:'inbox_mudo'}];
out = rodar({ 'Config':cfg, 'Workflows no n8n':wfs, 'Execucoes com erro':erros, 'Execucoes rodando':run, 'Conversas 48h':conv, 'Pedidos com problema':ped, 'Incidentes abertos':abertos, 'Estado do watchdog':estado });
for (const o of out) console.log(JSON.stringify(o.json).slice(0,260));
// cenario 3: erro injetado pelo 8b
out = rodar({ 'Config':Object.assign({},cfg,{erro_injetado:JSON.stringify({execution:{id:'150',mode:'trigger',lastNodeExecuted:'Classificar',error:{message:'overloaded_error'}},workflow:{id:'OA',name:'HELU FACTORY | 2. Inbox'}})}), 'Workflows no n8n':wfs, 'Execucoes com erro':{data:[]}, 'Execucoes rodando':{}, 'Conversas 48h':[{}], 'Pedidos com problema':[{}], 'Incidentes abertos':[{}], 'Estado do watchdog':estado });
console.log('C3', out.filter(o=>o.json.op!=='estado').map(o=>JSON.stringify(o.json).slice(0,200)).join('\n'));
