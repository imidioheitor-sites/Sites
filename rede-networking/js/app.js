/* REDE · painel de networking. Dados vêm cifrados (AES-GCM) em data/contatos.enc.json e só abrem com a senha. */
(function () {
'use strict';

/* ===== CONFIGURAÇÃO FÁCIL DE AJUSTAR =====
 * "situacao" é o que separa as salas. O Heitor vai mandar um áudio com as situações finais:
 * basta trocar os textos abaixo (ou editar na aba Plano, que salva no navegador). */
var SALAS = [
  { id: 'organizador', n: 1, nome: 'Organizador', sala: 'Sala 01 · Triagem', situacao: 'Organizar a base', cor: '#D1A584',
    papel: 'Separa cada pessoa por origem, utilidade real, prazo de contato e acessibilidade.',
    habil: ['Classifica por origem (mentoria, pesquisa, estágio, colegas)', 'Define a camada: núcleo 30 d, ativos 90 d, distantes 180 d', 'Descarta ruído administrativo (contas, impressão, secretaria)', 'Mantém a base pronta para 200 pessoas'] },
  { id: 'estrategista', n: 2, nome: 'Estrategista', sala: 'Sala 02 · Mesa de guerra', situacao: 'Achar a utilidade de cada pessoa', cor: '#8DBDB4',
    papel: 'Descobre em que contexto cada conexão é útil e qual pedido faz sentido fazer.',
    habil: ['Cruza contexto (pesquisa, estágio, escrita, carreira) com a pessoa', 'Sugere o pedido certo e o momento', 'Aponta quem tem muito potencial e pouco contato', 'Evita pedir favor para quem ainda é laço frágil'] },
  { id: 'agenda', n: 3, nome: 'Agenda', sala: 'Sala 03 · Calendário', situacao: 'Marcar quando falar com cada um', cor: '#DCC48F',
    papel: 'Extensão do Google Calendar que sugere quando entrar em contato com cada pessoa.',
    habil: ['Propõe horários nos dias úteis, sem acumular', 'Só cria evento depois do seu OK', 'Hoje gera um arquivo .ics por aprovação', 'Próximo passo: ligar direto ao Google Calendar'] },
  { id: 'expansor', n: 4, nome: 'Expansor', sala: 'Sala 04 · Radar', situacao: 'Ampliar a rede', cor: '#A9BACB',
    papel: 'Procura gente nova e adiciona ao catálogo quando a conexão estabiliza.',
    habil: ['Lê quem já apareceu nos seus e-mails mas ainda não entrou no catálogo', 'Mede a estabilidade (duas trocas seguidas)', 'Adiciona ao catálogo quando estabiliza', 'Sugere apresentações via contatos em comum'] },
  { id: 'lembretes', n: 5, nome: 'Lembretes', sala: 'Sala 05 · Correio', situacao: 'Lembrar e escrever a mensagem', cor: '#E59474',
    papel: 'Lista do dia com a mensagem já escrita. Você revisa e envia, nunca é automático.',
    habil: ['Lista o que venceu e o que vence nos próximos dias', 'Escreve um rascunho humano em português ou inglês', 'Marca como enviado e recalcula o prazo', 'Nunca manda nada sozinho'] }
];

/* ===== O HOTEL: um quarto por ramo (edite RAMO_DE para mudar alguém de quarto) ===== */
var RAMOS = [
  { id: 'eng', nome: 'Engenharia e Ciências', cor: '#A9BACB', cena: 'Oficina de protótipos',
    uso: 'Quem abre portas de projeto, laboratório e recomendação técnica. Chegue com algo construído, não com uma pergunta aberta.' },
  { id: 'hum', nome: 'Humanidades e Escrita', cor: '#DCC48F', cena: 'Biblioteca',
    uso: 'Quem lê o que você escreve e assina carta de recomendação humanista. Mande o texto antes de pedir a reunião.' },
  { id: 'pes', nome: 'Pesquisa, Saúde e IA', cor: '#8DBDB4', cena: 'Laboratório',
    uso: 'Onde mora o verão de 2027 e a pesquisa. Pergunta curta, anexo pequeno, resposta fácil de dar.' },
  { id: 'neg', nome: 'Negócios e Produto', cor: '#D1A584', cena: 'Sala de reunião',
    uso: 'Processos seletivos e visão de produto. Peça feedback concreto, que é o favor mais barato de conceder.' },
  { id: 'ori', nome: 'Orientação e Mentoria', cor: '#E59474', cena: 'Sala de conversa',
    uso: 'As pessoas que apresentam você a outras. Mantenha quente mesmo sem precisar de nada.' },
  { id: 'ami', nome: 'Amigos e Comunidade', cor: '#C7B8EA', cena: 'Lounge',
    uso: 'Laço forte, utilidade indireta. Aqui o custo de sumir é alto e o de voltar é baixo.' },
  { id: 'hw', nome: 'Hardware e IoT', cor: '#7FB0D8', cena: 'Sala de máquinas',
    uso: 'Prospecção fria que ainda não respondeu. Um follow-up, depois deixe esfriar.' }
];
var RAMO_DE = { c08: 'eng', c09: 'eng', c10: 'eng', c11: 'eng', c14: 'eng', c19: 'eng', c07: 'hum', c13: 'hum', c15: 'hum', c16: 'hum', c17: 'hum',
  c06: 'pes', c25: 'pes', c28: 'pes', k01: 'pes', k02: 'pes', c26: 'neg', c27: 'neg', k03: 'neg', c01: 'ori', c02: 'ori', c03: 'ori', c04: 'ori', c05: 'ori', c12: 'ori', c29: 'ori',
  c18: 'ami', c20: 'ami', c21: 'ami', c22: 'ami', c23: 'ami', c24: 'ami', k04: 'hw', k05: 'hw' };
var CAMADAS = { 'Núcleo': { dias: 30, cor: '#D1A584' }, 'Ativos': { dias: 90, cor: '#8DBDB4' }, 'Distantes': { dias: 180, cor: '#8C8F94' } };
var PESOS = { laco: 0.40, util: 0.35, acess: 0.25 };
var CORTES = { nucleo: 68, ativos: 45 };

/* ===== util ===== */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function iso(d) { return d.toISOString().slice(0, 10); }
function addDias(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
function difDias(a, b) { return Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 864e5); }
function fmt(s) { var d = new Date(s + 'T12:00:00Z'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace('.', ''); }
var HOJE = iso(new Date());
function get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

var DB = null;
var EST = get('rede-estado') || { enviado: {}, add: {}, sit: {} };
function salvar() { put('rede-estado', EST); }

/* ===== cifra ===== */
function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
async function abrir(senha) {
  var r = await fetch('data/contatos.enc.json', { cache: 'no-store' }); var j = await r.json();
  var km = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  var key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(j.salt), iterations: j.it, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(j.iv) }, key, b64(j.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ===== regras de negócio ===== */
function enriquecer(c) {
  c.score = Math.round(PESOS.laco * c.laco + PESOS.util * c.util + PESOS.acess * c.acess);
  c.camada = c.score >= CORTES.nucleo ? 'Núcleo' : c.score >= CORTES.ativos ? 'Ativos' : 'Distantes';
  c.cad = CAMADAS[c.camada].dias;
  c.ultimoReal = EST.enviado[c.id] || c.ultimo;
  c.prox = addDias(c.ultimoReal, c.cad);
  c.falta = difDias(c.prox, HOJE);           // negativo = atrasado
  c.status = c.falta < 0 ? 'atrasado' : c.falta <= 7 ? 'semana' : 'ok';
  return c;
}
function catalogo() {
  var lista = DB.contatos.concat(DB.candidatos.filter(function (k) { return EST.add[k.id]; }));
  return lista.map(enriquecer);
}
function candidatos() { return DB.candidatos.filter(function (k) { return !EST.add[k.id]; }).map(enriquecer); }
function idioma(c) { return /\.com\.br$|horuss\.ai$|8arm\.io$/.test(c.email) ? 'pt' : 'en'; }
function primeiro(c) { var n = c.nome.replace(/\(.*\)/, '').trim(); return /^[A-Z]\.\s/.test(n) || /^(Contato|ND )/.test(n) ? '' : n.split(' ')[0]; }
function rascunho(c) {
  var f = primeiro(c), pt = idioma(c) === 'pt', ctx = (c.ctx && c.ctx[0] || '').toLowerCase();
  if (pt) {
    var o = f ? 'Oi, ' + f + '! ' : 'Oi, tudo bem? ';
    if (c.origem === 'Estágio 2027') return o + 'Passando para retomar nossa conversa sobre o estágio de verão 2027. Sigo muito interessado na vaga e posso mandar qualquer informação a mais. Faz sentido marcarmos 15 minutos nas próximas semanas?';
    return o + 'Faz um tempo que não falamos e queria saber como andam as coisas por aí. Se tiver 15 minutos nas próximas semanas, adoraria conversar.';
  }
  var oi = f ? 'Hi ' + f + ', ' : 'Hi, ';
  var upd = 'I just applied to the STRAND research project and I am lining up my plans for next summer';
  if (c.origem === 'Colega') return 'Hey' + (f ? ' ' + f : '') + '! It has been a while, how is everything going? Want to grab a coffee or study together before finals?';
  if (c.origem === 'Professor') return 'Hello' + (f ? ' ' + f : '') + ', I hope your week is going well. I wanted to thank you again for your help this semester and share a quick update: ' + upd + '. If you have a few minutes, I would value your advice on what to focus on next.';
  if (c.origem === 'Pesquisa') return oi + 'I wanted to follow up on my STRAND application. I am still very interested in the iris recognition project and happy to send anything else that would help. Thank you for your time!';
  if (c.origem === 'Staff' || c.origem === 'Clube') return oi + 'hope you are doing well! Just checking in and saying thanks again for the help. Let me know if there is anything I can do for you or the group.';
  return oi + 'hope you are doing well! I wanted to check in and share a quick update: ' + upd + '. I would really value hearing how things are on your end. Do you have 15 minutes in the next couple of weeks?';
}
function pedido(c) {
  var x = c.ctx && c.ctx[0] || 'conversa rápida';
  if (c.laco < 40 && c.util >= 70) return 'Ainda é laço frágil: primeiro mostre valor e faça uma pergunta pequena. Pedir só depois da segunda troca.';
  if (c.util >= 80) return 'Alta utilidade: ' + x.toLowerCase() + '. Marque 15 minutos e peça uma coisa concreta.';
  if (c.laco >= 65) return 'Laço forte: pode pedir ajuda direta sobre ' + x.toLowerCase() + ' e oferecer algo em troca.';
  return 'Manter vivo com um contato leve; ' + x.toLowerCase() + ' é o gancho natural.';
}
function slotsAgenda(lista) {
  var devidos = lista.filter(function (c) { return c.falta <= 14; }).sort(function (a, b) { return b.score - a.score; });
  var d = new Date(HOJE + 'T12:00:00Z'), out = [], porDia = {};
  devidos.slice(0, 8).forEach(function (c) {
    do { d.setUTCDate(d.getUTCDate() + (porDia[iso(d)] >= 2 ? 1 : 0)); if ([0, 6].indexOf(d.getUTCDay()) >= 0) d.setUTCDate(d.getUTCDate() + 1); } while ([0, 6].indexOf(d.getUTCDay()) >= 0);
    var k = iso(d); porDia[k] = (porDia[k] || 0) + 1;
    out.push({ c: c, dia: k, hora: porDia[k] === 1 ? '14:00' : '16:30' });
    if (porDia[k] >= 2) d.setUTCDate(d.getUTCDate() + 1);
  });
  return out;
}
function ics(c, dia, hora) {
  var h = hora.split(':'), s = dia.replace(/-/g, '') + 'T' + h[0] + h[1] + '00', e = dia.replace(/-/g, '') + 'T' + h[0] + (parseInt(h[1], 10) + 15) + '00';
  var t = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//REDE//PT', 'BEGIN:VEVENT', 'UID:rede-' + c.id + '-' + dia + '@rede', 'DTSTAMP:' + HOJE.replace(/-/g, '') + 'T120000Z', 'DTSTART;TZID=America/New_York:' + s, 'DTEND;TZID=America/New_York:' + e,
    'SUMMARY:Falar com ' + c.nome, 'DESCRIPTION:' + rascunho(c).replace(/\n/g, ' '), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/calendar' })); a.download = 'rede-' + c.id + '.ics'; document.body.appendChild(a); a.click(); a.remove();
}
function copiar(txt, btn) {
  var ok = function () { var o = btn.textContent; btn.textContent = 'Copiado'; setTimeout(function () { btn.textContent = o; }, 1400); };
  try { navigator.clipboard.writeText(txt).then(ok, ok); } catch (e) { ok(); }
}

/* ===== componentes ===== */
function iniciais(n) { return n.replace(/\(.*\)/, '').trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
function selo(c) { return '<span class="selo" style="--c:' + CAMADAS[c.camada].cor + '">' + c.camada + '</span>'; }
function prazo(c) {
  if (c.falta < 0) return '<span class="prazo atr">' + (-c.falta) + ' d atrasado</span>';
  if (c.falta === 0) return '<span class="prazo hoje">hoje</span>';
  return '<span class="prazo' + (c.falta <= 7 ? ' sem' : '') + '">em ' + c.falta + ' d · ' + fmt(c.prox) + '</span>';
}
function linhaContato(c) {
  return '<button class="linha" data-c="' + c.id + '"><span class="av" style="--c:' + CAMADAS[c.camada].cor + '">' + esc(iniciais(c.nome)) + '</span>' +
    '<span class="lt"><b>' + esc(c.nome) + '</b><small>' + esc(c.org) + '</small></span>' + selo(c) + '<span class="sc">' + c.score + '</span>' + prazo(c) + '</button>';
}
function cartaoLembrete(c) {
  return '<article class="lem" data-id="' + c.id + '"><header><span class="av" style="--c:' + CAMADAS[c.camada].cor + '">' + esc(iniciais(c.nome)) + '</span><div><b>' + esc(c.nome) + '</b><small>' + esc(c.papel) + '</small></div>' + prazo(c) + '</header>' +
    '<p class="msg">' + esc(rascunho(c)) + '</p><footer><button class="b" data-copiar="' + c.id + '">Copiar mensagem</button><button class="b suave" data-enviei="' + c.id + '">Já enviei</button><button class="b suave" data-c="' + c.id + '">Ver perfil</button></footer></article>';
}
function barra(rot, v, cor) { return '<div class="barra"><span>' + rot + '</span><i><u style="width:' + v + '%;background:' + cor + '"></u></i><em>' + v + '</em></div>'; }

/* ===== salas ===== */
var views = {};
function sit(s) { return EST.sit[s.id] || s.situacao; }
function metricaSala(id, L) {
  var dev = L.filter(function (c) { return c.falta <= 7; }).length;
  return ({
    organizador: L.length + ' pessoas organizadas · ' + DB.ignorados.total + ' ruídos descartados',
    estrategista: L.filter(function (c) { return c.util >= 70; }).length + ' conexões de alta utilidade',
    agenda: slotsAgenda(L).length + ' horários sugeridos',
    expansor: candidatos().length + ' candidatos na fila',
    lembretes: dev + ' para falar até 7 dias'
  })[id];
}
function renderSalas() {
  var L = catalogo(), el = $('#salas');
  if (!el.children.length) {
    el.innerHTML = SALAS.map(function (s) {
      return '<article class="sala" data-sala="' + s.id + '" style="--ag:' + s.cor + '" tabindex="0" role="button" aria-label="Abrir perfil do ' + s.nome + '">' +
        '<canvas></canvas><div class="sala-topo"><span class="rot">' + s.sala + '</span><span class="chip" data-sit="' + s.id + '"></span></div>' +
        '<div class="sala-pe"><div><b>' + s.nome + '</b><small data-met="' + s.id + '"></small></div><span class="abrir">Abrir perfil ↗</span></div></article>';
    }).join('');
    $$('.sala', el).forEach(function (a) {
      var id = a.dataset.sala, s = SALAS.filter(function (x) { return x.id === id; })[0];
      views[id] = new REDE3D.RoomView($('canvas', a), id, s.cor);
      a.addEventListener('click', function () { views[id].bot.say('jump', 1); abrirPerfil(id); });
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirPerfil(id); } });
    });
  }
  SALAS.forEach(function (s) { $('[data-sit="' + s.id + '"]').textContent = sit(s); $('[data-met="' + s.id + '"]').textContent = metricaSala(s.id, L); });
}

/* ===== perfil do agente ===== */
var pv = null, agenteAtual = null;
function painelAgente(id, L) {
  var h = '', pessoas, cont;
  if (id === 'organizador') {
    var por = {}, cam = {};
    L.forEach(function (c) { por[c.origem] = (por[c.origem] || 0) + 1; cam[c.camada] = (cam[c.camada] || 0) + 1; });
    h += '<h4>Por camada (define o prazo)</h4>' + Object.keys(CAMADAS).map(function (k) { return barra(k + ' · ' + CAMADAS[k].dias + ' d', Math.round((cam[k] || 0) / L.length * 100), CAMADAS[k].cor); }).join('');
    h += '<h4>Por origem</h4>' + Object.keys(por).sort(function (a, b) { return por[b] - por[a]; }).map(function (k) { return barra(esc(k), Math.round(por[k] / L.length * 100), 'var(--c300)'); }).join('');
    h += '<h4>Descartado como ruído</h4><p class="nota">' + esc(DB.ignorados.administrativo.join(', ')) + '. São contas, impressão, secretaria. Não entram no catálogo.</p>';
    h += '<h4>Fórmula do score (0 a 100)</h4><p class="nota">' + Math.round(PESOS.laco * 100) + '% laço + ' + Math.round(PESOS.util * 100) + '% utilidade + ' + Math.round(PESOS.acess * 100) + '% acessibilidade. Núcleo a partir de ' + CORTES.nucleo + ', ativos a partir de ' + CORTES.ativos + '.</p>';
  } else if (id === 'estrategista') {
    pessoas = L.slice().sort(function (a, b) { return b.util - a.util; }).slice(0, 7);
    h += '<h4>Maiores utilidades agora</h4>' + pessoas.map(function (c) { return '<button class="est" data-c="' + c.id + '"><b>' + esc(c.nome) + '</b><span>' + c.ctx.slice(0, 2).map(function (x) { return '<em>' + esc(x) + '</em>'; }).join('') + '</span><small>' + esc(pedido(c)) + '</small></button>'; }).join('');
    var alto = L.filter(function (c) { return c.util >= 70 && c.laco < 45; });
    if (alto.length) h += '<h4>Muito potencial, pouco laço</h4><p class="nota">' + alto.map(function (c) { return esc(c.nome); }).join(', ') + '. Vale investir em contato leve antes de pedir algo.</p>';
  } else if (id === 'agenda') {
    var sl = slotsAgenda(L);
    h += '<h4>Horários sugeridos (nada é criado sem seu OK)</h4>' + (sl.length ? sl.map(function (s) {
      return '<div class="slot"><div><b>' + fmt(s.dia) + ' · ' + s.hora + '</b><small>15 min · ' + esc(s.c.nome) + '</small></div><button class="b" data-ics="' + s.c.id + '|' + s.dia + '|' + s.hora + '">Aprovar (.ics)</button></div>';
    }).join('') : '<p class="nota">Nada vencendo nas próximas duas semanas.</p>');
    h += '<p class="nota">Aprovar baixa um arquivo .ics que abre direto no Google Calendar. A extensão que escreve no seu calendário só entra depois que você liberar.</p>';
  } else if (id === 'expansor') {
    cont = candidatos();
    h += '<h4>Na fila para entrar no catálogo</h4>' + (cont.length ? cont.map(function (k) {
      var est = Math.min(100, Math.round(k.trocas / 2 * 100)), ok = k.trocas >= 2;
      return '<div class="cand"><div><b>' + esc(k.nome) + '</b><small>' + esc(k.org) + ' · ' + esc(k.papel) + '</small></div>' + barra('estabilidade', est, ok ? 'var(--patina3)' : 'var(--c400)') +
        '<button class="b' + (ok ? '' : ' suave') + '" data-add="' + k.id + '">' + (ok ? 'Adicionar ao catálogo' : 'Adicionar mesmo assim') + '</button></div>';
    }).join('') : '<p class="nota">Fila vazia. Tudo que apareceu já está no catálogo.</p>');
    h += '<p class="nota">Estável = duas trocas de mensagem. Fontes: e-mails enviados e recebidos, cópias de e-mail e apresentações de contatos em comum.</p>';
  } else if (id === 'lembretes') {
    pessoas = L.filter(function (c) { return c.falta <= 7; }).sort(function (a, b) { return a.falta - b.falta || b.score - a.score; }).slice(0, 4);
    h += '<h4>Para hoje e esta semana</h4>' + (pessoas.length ? pessoas.map(cartaoLembrete).join('') : '<p class="nota">Nada vencendo.</p>');
    h += '<p class="nota">A lista completa está na aba Hoje.</p>';
  }
  return h;
}
function abrirPerfil(id) {
  var s = SALAS.filter(function (x) { return x.id === id; })[0], L = catalogo(); agenteAtual = id;
  var el = $('#perfil');
  $('#p-sala', el).textContent = s.sala; $('#p-nome', el).textContent = s.nome; $('#p-papel', el).textContent = s.papel;
  $('#p-sit', el).textContent = sit(s); el.style.setProperty('--ag', s.cor);
  $('#p-habil', el).innerHTML = s.habil.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('');
  $('#p-corpo', el).innerHTML = painelAgente(id, L);
  if (!pv) pv = new REDE3D.ProfileView($('#p-canvas'));
  pv.set(id, s.cor); pv.visible = true;
  el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); $('#veu').classList.add('on'); document.body.classList.add('trava');
}
function fechar() {
  $$('.gaveta').forEach(function (g) { g.classList.remove('on'); g.setAttribute('aria-hidden', 'true'); });
  $('#veu').classList.remove('on'); document.body.classList.remove('trava'); if (pv) pv.visible = false;
}

/* ===== contato ===== */
function abrirContato(id) {
  var c = catalogo().concat(candidatos()).filter(function (x) { return x.id === id; })[0]; if (!c) return;
  c = enriquecer(c); var el = $('#contato');
  el.style.setProperty('--ag', CAMADAS[c.camada].cor);
  $('#c-nome', el).textContent = c.nome; $('#c-org', el).textContent = c.org + ' · ' + c.origem;
  $('#c-corpo', el).innerHTML =
    '<div class="topo-c"><span class="av grande" style="--c:' + CAMADAS[c.camada].cor + '">' + esc(iniciais(c.nome)) + '</span><div><div class="sc grande">' + c.score + '<small>/100</small></div>' + selo(c) + '</div></div>' +
    '<p class="nota">' + esc(c.papel) + (c.nota ? '. ' + esc(c.nota) : '') + '</p>' +
    barra('Laço', c.laco, 'var(--c400)') + barra('Utilidade', c.util, 'var(--patina3)') + barra('Acessibilidade', c.acess, 'var(--aco3)') +
    '<div class="duplo"><div><small>Último contato</small><b>' + fmt(c.ultimoReal) + '</b></div><div><small>Cadência</small><b>' + c.cad + ' dias</b></div><div><small>Próximo</small><b>' + fmt(c.prox) + '</b></div></div>' +
    '<h4>Como usar essa conexão</h4><div class="tags">' + c.ctx.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div><p class="nota">' + esc(pedido(c)) + '</p>' +
    '<h4>Rascunho da mensagem</h4><textarea id="c-msg" rows="6">' + esc(rascunho(c)) + '</textarea>' +
    '<div class="acoes"><button class="b" id="c-copiar">Copiar</button><button class="b suave" data-enviei="' + c.id + '">Já enviei</button><button class="b suave" data-ics="' + c.id + '|' + (c.falta > 0 ? c.prox : addDias(HOJE, 1)) + '|14:00">Gerar .ics</button><a class="b suave" href="mailto:' + esc(c.email) + '">Abrir e-mail</a></div>' +
    '<p class="nota peq">Estimativa a partir do assunto e do volume dos e-mails. Ajuste laço, utilidade e acessibilidade quando quiser.</p>';
  $('#c-copiar').onclick = function () { copiar($('#c-msg').value, this); };
  el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); $('#veu').classList.add('on'); document.body.classList.add('trava');
}

/* ===== catálogo e hoje ===== */
var F = { q: '', origem: '', camada: '', status: '', ord: 'score' };
function renderCatalogo() {
  var L = catalogo(), org = {}; L.forEach(function (c) { org[c.origem] = 1; });
  var sel = $('#f-origem'); if (sel.options.length <= 1) Object.keys(org).sort().forEach(function (o) { sel.add(new Option(o, o)); });
  var lista = L.filter(function (c) {
    var t = (c.nome + ' ' + c.org + ' ' + c.papel + ' ' + c.ctx.join(' ')).toLowerCase();
    return (!F.q || t.indexOf(F.q) >= 0) && (!F.origem || c.origem === F.origem) && (!F.camada || c.camada === F.camada) && (!F.status || c.status === F.status);
  }).sort(function (a, b) { return F.ord === 'prazo' ? a.falta - b.falta : F.ord === 'nome' ? a.nome.localeCompare(b.nome) : b.score - a.score; });
  $('#lista').innerHTML = lista.length ? lista.map(linhaContato).join('') : '<p class="vazio">Ninguém bate com esses filtros.</p>';
  $('#f-cont').textContent = lista.length + ' de ' + L.length + ' pessoas';
}
function renderHoje() {
  var L = catalogo(), dev = L.filter(function (c) { return c.falta <= 7; }).sort(function (a, b) { return a.falta - b.falta || b.score - a.score; });
  $('#hoje-lista').innerHTML = dev.length ? dev.map(cartaoLembrete).join('') : '<p class="vazio">Tudo em dia. Nenhuma conexão vence nos próximos 7 dias.</p>';
  $('#hoje-sub').textContent = dev.length + (dev.length === 1 ? ' pessoa' : ' pessoas') + ' para falar até ' + fmt(addDias(HOJE, 7)) + '. Você revisa e envia, a REDE nunca manda nada sozinha.';
}
function renderPlano() {
  $('#sit-edit').innerHTML = SALAS.map(function (s) { return '<label><span style="--c:' + s.cor + '">' + s.sala + '</span><input data-edit="' + s.id + '" value="' + esc(sit(s)) + '" maxlength="60"></label>'; }).join('');
  $$('#sit-edit input').forEach(function (i) { i.oninput = function () { EST.sit[i.dataset.edit] = i.value; salvar(); renderSalas(); }; });
}
function renderKpis() {
  var L = catalogo(), atr = L.filter(function (c) { return c.falta < 0; }).length, sem = L.filter(function (c) { return c.falta >= 0 && c.falta <= 7; }).length, nuc = L.filter(function (c) { return c.camada === 'Núcleo'; }).length;
  $('#kpis').innerHTML = '<span class="pill"><b>' + L.length + '</b> pessoas</span><span class="pill' + (atr ? ' alerta' : '') + '"><b>' + atr + '</b> atrasadas</span><span class="pill"><b>' + sem + '</b> esta semana</span><span class="pill"><b>' + nuc + '</b> no núcleo</span>';
}

/* ===== hotel ===== */
var hotel = null, hotelDados = null;
function dadosHotel() {
  var L = catalogo();
  return RAMOS.map(function (r) {
    var ps = L.filter(function (c) { return RAMO_DE[c.id] === r.id; }).sort(function (x, y) { return y.score - x.score; });
    return { id: r.id, nome: r.nome, cor: r.cor, cena: r.cena, uso: r.uso, pessoas: ps.map(function (c) {
      return { id: c.id, nome: c.nome, ini: iniciais(c.nome), score: c.score, status: c.status, camada: c.camada, org: c.org,
        cor: CAMADAS[c.camada].cor, prazo: c.falta < 0 ? (-c.falta) + ' d de atraso' : c.falta === 0 ? 'hoje' : 'em ' + c.falta + ' d' };
    }) };
  });
}
function fichaQuarto(i, s) {
  var el = $('#h-foco');
  if (i < 0 || !s) { el.classList.remove('on'); $('#h-dica').classList.remove('off'); return; }
  var r = hotelDados[i];
  $('#h-dica').classList.add('off');
  if (!r) { el.innerHTML = '<button class="h-volta">Ver o prédio inteiro</button><p class="mini">Recepção</p><h3>Entrada do Hotel</h3><p class="nota">O Organizador recebe quem chega. Toda pessoa nova passa por aqui antes de ganhar um quarto.</p>'; }
  else {
    var atr = r.pessoas.filter(function (p) { return p.status === 'atrasado'; }).length;
    el.innerHTML = '<button class="h-volta">Ver o prédio inteiro</button>' +
      '<p class="mini">' + esc(r.cena) + '</p><h3>' + esc(r.nome) + '</h3>' +
      '<p class="nota">' + esc(r.uso) + '</p>' +
      '<p class="h-tot"><b>' + r.pessoas.length + '</b> no quarto' + (atr ? ' · <span class="atr">' + atr + ' em atraso</span>' : ' · tudo em dia') + '</p>' +
      '<div class="h-gente">' + (r.pessoas.length ? r.pessoas.map(function (p) {
        return '<button class="h-chip s-' + p.status + '" data-c="' + p.id + '"><span class="av" style="--c:' + p.cor + '">' + esc(p.ini) + '</span><span><b>' + esc(p.nome) + '</b><small>' + esc(p.org) + ' · ' + p.score + ' · ' + esc(p.prazo) + '</small></span></button>';
      }).join('') : '<p class="nota">Quarto vazio. Quando o Expansor adicionar alguém desse ramo, ele aparece aqui.</p>') + '</div>';
  }
  el.classList.add('on');
  $('.h-volta', el).onclick = function () { hotel.verTudo(); };
}
function renderHotel(forcar) {
  hotelDados = dadosHotel();
  var leg = $('#h-leg');
  if (leg) leg.innerHTML = hotelDados.map(function (s, i) {
    return '<button class="pill" data-quarto="' + i + '"><i style="background:' + s.cor + '"></i>' + esc(s.nome) + ' <b>' + s.pessoas.length + '</b></button>';
  }).join('') + '<button class="pill" data-quarto="-1">Ver tudo</button>';
  if (!$('#tab-hotel').classList.contains('on') && !forcar) { if (hotel) hotel._sujo = true; return; }
  if (!hotel) hotel = new REDE3D.Hotel($('#h-canvas'), $('#h-layer'), abrirContato, fichaQuarto);
  hotel.setData(hotelDados); hotel._sujo = false; fichaQuarto(-1, null);
}
function tudo() { renderHotel(); renderKpis(); renderSalas(); renderCatalogo(); renderHoje(); renderPlano(); }

/* ===== eventos ===== */
function ligar() {
  $$('.aba').forEach(function (b) { b.onclick = function () { $$('.aba').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tab').forEach(function (t) { t.classList.toggle('on', t.id === 'tab-' + b.dataset.tab); }); window.scrollTo(0, 0); if (b.dataset.tab === 'hotel') { if (!hotel || hotel._sujo) renderHotel(true); } }; });
  $('#f-q').oninput = function () { F.q = this.value.toLowerCase(); renderCatalogo(); };
  $('#f-origem').onchange = function () { F.origem = this.value; renderCatalogo(); };
  $('#f-ord').onchange = function () { F.ord = this.value; renderCatalogo(); };
  $$('[data-fc]').forEach(function (b) { b.onclick = function () { var k = b.dataset.fc, v = b.dataset.v; F[k] = F[k] === v ? '' : v; $$('[data-fc="' + k + '"]').forEach(function (x) { x.classList.toggle('on', x.dataset.v === F[k]); }); renderCatalogo(); }; });
  document.addEventListener('click', function (e) { var q = e.target.closest('[data-quarto]'); if (q && hotel) hotel.focar(parseInt(q.dataset.quarto, 10)); });
  $('#veu').onclick = fechar; $$('.x').forEach(function (b) { b.onclick = fechar; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
  $$('[data-gesto]').forEach(function (b) { b.onclick = function () { if (pv) pv.say(b.dataset.gesto, b.dataset.gesto === 'jump' ? 1 : 3.2); }; });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-c],[data-copiar],[data-enviei],[data-ics],[data-add]'); if (!t) return;
    if (t.dataset.c) { if (t.closest('#perfil')) { $('#perfil').classList.remove('on'); if (pv) pv.visible = false; } abrirContato(t.dataset.c); }
    else if (t.dataset.copiar) { var c = catalogo().filter(function (x) { return x.id === t.dataset.copiar; })[0]; copiar(rascunho(c), t); }
    else if (t.dataset.enviei) { EST.enviado[t.dataset.enviei] = HOJE; salvar(); tudo(); if (agenteAtual && $('#perfil').classList.contains('on')) abrirPerfil(agenteAtual); if ($('#contato').classList.contains('on')) abrirContato(t.dataset.enviei); }
    else if (t.dataset.ics) { var p = t.dataset.ics.split('|'), cc = catalogo().concat(candidatos()).filter(function (x) { return x.id === p[0]; })[0]; ics(cc, p[1], p[2]); t.textContent = 'Baixado'; }
    else if (t.dataset.add) { EST.add[t.dataset.add] = 1; salvar(); tudo(); abrirPerfil('expansor'); }
  });
}

/* ===== entrada ===== */
async function entrar(senha, lembrar) {
  var msg = $('#g-msg'); msg.textContent = 'Abrindo…';
  try { DB = await abrir(senha); } catch (e) { msg.textContent = 'Senha incorreta.'; $('#gate .cx').classList.remove('tremer'); void $('#gate .cx').offsetWidth; $('#gate .cx').classList.add('tremer'); try { sessionStorage.removeItem('rede-s'); } catch (x) {} return; }
  if (lembrar) { try { sessionStorage.setItem('rede-s', senha); } catch (x) {} }
  $('#gate').classList.add('some'); setTimeout(function () { $('#gate').hidden = true; }, 500);
  $('#app').hidden = false; ligar(); tudo();
  $$('#app [data-glass-later]').forEach(function (n) { n.setAttribute('data-glass', ''); });
  if (window.GlassSurface) { try { GlassSurface.init($('#app')); } catch (e) {} }
}
document.addEventListener('DOMContentLoaded', function () {
  $('#g-form').onsubmit = function (e) { e.preventDefault(); entrar($('#g-senha').value, true); };
  var s = null; try { s = sessionStorage.getItem('rede-s'); } catch (e) {}
  if (s) entrar(s, true);
});
})();
