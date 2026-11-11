/* VOLT/RX em vidro líquido: configurador, lente, carrinho e rolagem do primeiro quadro */
(function () {
'use strict';
var P = [
  { id: 'capa', cod: 'RX-01', n: 'Capa Armor', c: 'Proteção', p: 79.9, i: 'capa-armor', fx: [.42, .5], d: 'Antichoque, com cantos em ar comprimido e borda elevada que protege a tela na queda.', f: [['Queda', '2,4 m'], ['Material', 'TPU + policarbonato'], ['Acabamento', 'Grafite + laranja'], ['Botões', 'Metálicos']] },
  { id: 'carr', cod: 'RX-02', n: 'Carregador GaN 65W', c: 'Energia', p: 149.9, i: 'carregador-gan65', fx: [.5, .62], d: 'Compacto, com cabo USB-C trançado. Carrega de 0 a 70% em cerca de 30 minutos.', f: [['Potência', '65 W'], ['Portas', 'USB-C + USB-A'], ['Cabo', '1,5 m trançado'], ['Tecnologia', 'GaN']] },
  { id: 'fone', cod: 'RX-03', n: 'Fone Pulse TWS', c: 'Áudio', p: 229.9, i: 'fone-pulse', fx: [.55, .7], d: 'Bluetooth 5.3 com cancelamento de ruído e estojo com LED de status.', f: [['Bateria', '30 h com estojo'], ['Conexão', 'Bluetooth 5.3'], ['Proteção', 'IPX5'], ['Ruído', 'Cancelamento ativo']] },
  { id: 'base', cod: 'RX-04', n: 'Base Magnética', c: 'Energia', p: 119.9, i: 'base-magnetica', fx: [.62, .32], d: 'Carga sem fio de 15 W, ímã que alinha sozinho e ângulo ajustável.', f: [['Potência', '15 W'], ['Fixação', 'Magnética'], ['Ângulo', 'Ajustável'], ['Acabamento', 'Grafite + laranja']] },
  { id: 'pbank', cod: 'RX-05', n: 'Power Bank 20K', c: 'Energia', p: 189.9, i: 'powerbank-20k', fx: [.2, .62], d: 'Slim, com visor digital e três saídas. Pode ir na bagagem de mão.', f: [['Capacidade', '20.000 mAh'], ['Saídas', '3'], ['Visor', 'Digital'], ['Entrada', 'USB-C']] },
  { id: 'pel', cod: 'RX-06', n: 'Película 9H', c: 'Proteção', p: 39.9, i: 'pelicula-9h', fx: [.45, .45], d: 'Vidro temperado com moldura de instalação: alinha de primeira e sem bolha.', f: [['Dureza', '9H'], ['Espessura', '0,33 mm'], ['Instalação', 'Com moldura'], ['Bordas', '2.5D']] }
];
var K = { kit1: ['Kit Proteção', 99.9], kit2: ['Kit Viagem', 319.9], kit3: ['Kit Completo', 519.9] };

var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
var brl = function (v) { return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
var mouseFino = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* galeria: P&B que ganha cor perto do cursor só existe com mouse; no toque as fotos ficam coloridas */
if (mouseFino && !reduz) { var sc = document.createElement('script'); sc.src = 'fx/chroma-grid.js'; document.body.appendChild(sc); }
else { var g = $('#galeria'); if (g) g.removeAttribute('data-chroma-grid'); }

function iniciar() {
  /* ---------- carrinho ---------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('voltrx-glass') || '[]') || []; } catch (e) { cart = []; }
  function salvar() { try { localStorage.setItem('voltrx-glass', JSON.stringify(cart)); } catch (e) {} }
  function nome(id) { var x = P.find(function (q) { return q.id === id; }); return x ? x.n : (K[id] ? K[id][0] : id); }
  function preco(id) { var x = P.find(function (q) { return q.id === id; }); return x ? x.p : (K[id] ? K[id][1] : 0); }
  function msgZap(itens) {
    if (!itens.length) return 'Olá! Vi o site da VOLT/RX e quero tirar uma dúvida.';
    var cont = {}; itens.forEach(function (id) { cont[id] = (cont[id] || 0) + 1; });
    var linhas = Object.keys(cont).map(function (id) { return '• ' + cont[id] + 'x ' + nome(id); });
    var t = itens.reduce(function (a, id) { return a + preco(id); }, 0);
    return 'Olá! Quero fazer este pedido na VOLT/RX:\n' + linhas.join('\n') + '\nTotal: ' + brl(t) + '\nMeu celular é: ';
  }
  function linkZap() { return 'https://wa.me/?text=' + encodeURIComponent(msgZap(cart)); }
  function desenhar() {
    $('#qtd').textContent = cart.length;
    var cont = {}; cart.forEach(function (id) { cont[id] = (cont[id] || 0) + 1; });
    var ids = Object.keys(cont);
    $('#itens').innerHTML = ids.length ? ids.map(function (id) {
      return '<li><span>' + cont[id] + '× ' + nome(id) + '</span><span class="r">' + brl(preco(id) * cont[id]) + ' <button data-rm="' + id + '" aria-label="Remover ' + nome(id) + '">×</button></span></li>';
    }).join('') : '<li class="vazio">Seu carrinho está vazio.</li>';
    $('#total').textContent = brl(cart.reduce(function (a, id) { return a + preco(id); }, 0));
    $$('#zapCarrinho, .zap').forEach(function (a) { a.href = linkZap(); });
  }
  function gaveta(on) {
    $('#gaveta').classList.toggle('on', on); $('#veu').classList.toggle('on', on);
    $('#gaveta').setAttribute('aria-hidden', String(!on));
    if (on) setTimeout(function () { $('#fechar').focus(); }, 300);
  }
  function menu(on) {
    $('#menuMob').classList.toggle('on', on); $('#burger').setAttribute('aria-expanded', String(on));
    $('#menuMob').setAttribute('aria-hidden', String(!on));
  }

  /* ---------- configurador ---------- */
  var sel = 0, qtd = 1, precoAtual = P[0].p;
  function lista() {
    $('#cfLista').innerHTML = P.map(function (x, i) {
      return '<button role="radio" aria-checked="' + (i === sel) + '" data-sel="' + i + '"><i></i><span>' + x.n + '<small>' + x.cod + ' · ' + brl(x.p) + '</small></span></button>';
    }).join('');
  }
  function animarPreco(novo) {
    var velho = $('#cfPreco'), b = document.createElement('b');
    b.id = 'cfPreco';
    b.setAttribute('data-from', precoAtual.toFixed(2)); b.setAttribute('data-to', novo.toFixed(2));
    b.setAttribute('data-decimals', '2'); b.setAttribute('data-separator', '.'); b.setAttribute('data-duration', '0.6');
    velho.parentNode.replaceChild(b, velho);
    if (window.HeluCountUp) HeluCountUp.create(b); else b.textContent = novo.toFixed(2).replace('.', ',');
    precoAtual = novo;
  }
  function conf(trocouFoto) {
    var p = P[sel];
    lista();
    $('#cfCod').textContent = p.cod;
    $('#cfDesc').textContent = p.d;
    $('#cfFicha').innerHTML = p.f.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
    $('#cfQtd').textContent = String(qtd).padStart(2, '0');
    animarPreco(p.p * qtd);
    if (trocouFoto) {
      var im = $('#cfFoto'), zm = $('#cfZoom');
      im.style.opacity = 0;
      setTimeout(function () {
        im.src = 'img/' + p.i + '.jpg'; im.alt = p.n; zm.src = im.src;
        im.style.opacity = 1;
        lente.repousar(true);
      }, 180);
    }
  }

  /* ---------- lente de vidro (GlassSurface canvas sobre uma cópia ampliada da foto) ---------- */
  var lente = (function () {
    var foto = $('#confFoto'), el = $('#lente'), zm = $('#cfZoom'), dica = $('#dica');
    var ZOOM = 1.7, x = 0, y = 0, tx = 0, ty = 0, raf = 0, ativo = false;
    function raio() { return el.offsetWidth / 2; }
    function pintar() {
      var r = raio();
      el.style.transform = 'translate(' + (x - r) + 'px,' + (y - r) + 'px)';
      zm.style.transformOrigin = x + 'px ' + y + 'px';
      zm.style.transform = 'scale(' + ZOOM + ')';
      if (el._glass && el._glass._paint) el._glass._paint();
    }
    function passo() {
      raf = 0;
      var k = reduz ? 1 : 0.22;
      x += (tx - x) * k; y += (ty - y) * k;
      pintar();
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(passo);
    }
    function ir(nx, ny, ja) {
      var r = raio(), w = foto.clientWidth, h = foto.clientHeight;
      tx = Math.max(r * 0.4, Math.min(w - r * 0.4, nx)); ty = Math.max(r * 0.4, Math.min(h - r * 0.4, ny));
      if (ja) { x = tx; y = ty; pintar(); return; }
      if (!raf) raf = requestAnimationFrame(passo);
    }
    function repousar(ja) {
      var p = P[sel];
      ir(foto.clientWidth * p.fx[0], foto.clientHeight * p.fx[1], ja);
    }
    if (mouseFino) {
      dica.textContent = 'passe o mouse sobre a foto';
      foto.addEventListener('pointermove', function (e) {
        var b = foto.getBoundingClientRect(); ativo = true; dica.style.opacity = 0; ir(e.clientX - b.left, e.clientY - b.top);
      });
      foto.addEventListener('pointerleave', function () { ativo = false; repousar(); });
    } else {
      dica.textContent = 'toque para mover a lente';
      foto.addEventListener('click', function (e) {
        var b = foto.getBoundingClientRect(); dica.style.opacity = 0; ir(e.clientX - b.left, e.clientY - b.top);
      });
    }
    zm.addEventListener('load', function () { pintar(); });
    window.addEventListener('resize', function () { if (!ativo) repousar(true); });
    return { repousar: repousar };
  })();

  /* ---------- cliques ---------- */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-sel]');
    if (s) { if (+s.dataset.sel !== sel) { sel = +s.dataset.sel; qtd = 1; conf(true); } return; }
    if (e.target.closest('#mais')) { qtd = Math.min(9, qtd + 1); conf(false); return; }
    if (e.target.closest('#menos')) { qtd = Math.max(1, qtd - 1); conf(false); return; }
    if (e.target.closest('#cfAdd')) {
      for (var i = 0; i < qtd; i++) cart.push(P[sel].id);
      salvar(); desenhar(); setTimeout(function () { gaveta(true); }, 380); return;
    }
    var a = e.target.closest('[data-add]');
    if (a) { cart.push(a.dataset.add); salvar(); desenhar(); gaveta(true); return; }
    var r = e.target.closest('[data-rm]');
    if (r) { var k = cart.indexOf(r.dataset.rm); if (k > -1) cart.splice(k, 1); salvar(); desenhar(); return; }
    if (e.target.closest('#menuMob a')) menu(false);
  });
  $('#burger').addEventListener('click', function () { menu(!$('#menuMob').classList.contains('on')); });
  $('#abrirCarrinho').addEventListener('click', function () { gaveta(true); });
  $('#fechar').addEventListener('click', function () { gaveta(false); });
  $('#veu').addEventListener('click', function () { gaveta(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { gaveta(false); menu(false); } });

  /* ---------- primeiro quadro: o vídeo vira vitrine enquanto a abertura sobe ---------- */
  var stick = $('.s0-stick'), veu = $('#s0Veu'), nav = $('#navWrap'), tick = false, ultimoY = scrollY;
  function rolar() {
    tick = false;
    var vh = innerHeight, y = scrollY;
    var p = Math.max(0, Math.min(1, y / (vh * 0.7)));
    if (!reduz) {
      stick.style.transform = 'scale(' + (1 - 0.1 * p).toFixed(4) + ')';
      stick.style.borderRadius = (28 * p).toFixed(1) + 'px';
    }
    veu.style.opacity = (0.5 * p).toFixed(3);
    nav.classList.toggle('on', y > vh * 0.6);
    if (Math.abs(y - ultimoY) > 80 && $('#menuMob').classList.contains('on')) menu(false);
    if (!$('#menuMob').classList.contains('on')) ultimoY = y;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(rolar); } }, { passive: true });
  addEventListener('resize', rolar);

  lista(); conf(false); desenhar(); rolar(); lente.repousar(true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
