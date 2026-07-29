/* ============================================================================
   HEITOR — Aniversário & Despedida
   ----------------------------------------------------------------------------
   ⚠️  ÚNICO LUGAR QUE VOCÊ PRECISA EDITAR ESTÁ LOGO ABAIXO (bloco CONFIG).
   Troque a chave Pix, o nome e a cidade — todos os QR Codes passam a funcionar.
   ============================================================================ */

const CONFIG = {
  pix: {
    // 👉 TROQUE AQUI: CPF (só números), telefone (+5511999999999),
    //    e-mail, ou chave aleatória do banco.
    key: 'himidio@nd.edu',
    // Nome do titular da conta (máx. 25 caracteres, sem acento).
    name: 'HEITOR IMIDIO SILVA',
    // Cidade do titular (máx. 15 caracteres, sem acento).
    city: 'SAO PAULO',
  },

  // 👉 OPCIONAL: cole aqui a config do Firebase (Realtime Database) para que
  //    todo mundo veja em tempo real o que já foi comprado.
  //    Sem isso o site continua funcionando, mas só no navegador de cada pessoa.
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
  },

  partyDate: '2026-08-16T19:00:00-03:00',

  // Vídeo do hero. Tenta o arquivo local primeiro; se não existir, cai para a
  // URL remota automaticamente. Baixe o arquivo e salve como assets/hero.mp4
  // para não depender do CDN externo.
  heroVideo: {
    local:  'assets/hero.mp4',
    remote: 'https://d8j0ntlcm91z4.cloudfront.net/user_3Fn9kvwewWSxcmhyI5mG7uDadG8/hf_20260729_021409_114e7a0b-9ea2-4d4e-94cd-2d0e265728ef.mp4',
  },
};

const PIX_PLACEHOLDER = 'SUA-CHAVE-PIX-AQUI';
const pixReady = () => CONFIG.pix.key && CONFIG.pix.key !== PIX_PLACEHOLDER;

/* ============================================================================
   DADOS
   ========================================================================== */

const GIFTS = [
  { id:'starbucks', emoji:'☕', title:'Um café na Starbucks', price:50,
    note:'O primeiro café americano. Provavelmente escrevendo meu nome errado no copo.',
    reward:'Lembrancinha: foto do copo com seu nome nele' },
  { id:'paodequeijo', emoji:'🧀', title:'Um pão de queijo no aeroporto', price:100,
    note:'O último pão de queijo em solo brasileiro. Momento histórico.',
    reward:'Lembrancinha: vídeo da última mordida' },
  { id:'meias', emoji:'🧦', title:'Um par de meias pro frio de Notre Dame', price:80,
    note:'Indiana chega a -20°C. Eu sou de um país tropical. Reze por mim.',
    reward:'Lembrancinha: foto da primeira nevasca' },
  { id:'lenco', emoji:'🤧', title:'Um lenço pras lágrimas da mamãe', price:100,
    note:'Ela disse que não vai chorar. Ninguém acreditou.',
    reward:'Lembrancinha: a foto do choro no portão de embarque' },
  { id:'ingresso', emoji:'🏈', title:'Ingresso do jogo em Notre Dame', price:500,
    note:'Fighting Irish no estádio. Um dos ambientes mais lendários do esporte universitário.',
    reward:'Lembrancinha: seu nome no story direto do estádio' },
  { id:'powerbank', emoji:'🔋', title:'Power bank pras 300 mensagens da mãe', price:300,
    note:'Fuso de 1h. Volume de mensagens: inalterado.',
    reward:'Lembrancinha: print do contador de mensagens' },
  { id:'cobertor', emoji:'🛏️', title:'Um cobertor quentinho pro dormitório', price:200,
    note:'Aquecedor de dormitório é lenda urbana. Cobertor é fato.',
    reward:'Lembrancinha: foto do quarto montado' },
  { id:'pantufas', emoji:'🥿', title:'Um par de pantufas bem "lá ele"', price:200,
    note:'A Julianna apostou que o primão compra esse aqui.',
    reward:'Lembrancinha: foto usando as pantufas (sem vergonha)' },
  { id:'anonovo', emoji:'🎆', title:'Ajudinha pro Ano Novo dos Imidio', price:100,
    note:'Passagem de volta pra não furar o Ano Novo da família. Inegociável.',
    reward:'Lembrancinha: abraço presencial no dia 31' },
  { id:'trem', emoji:'🚆', title:'Passagem de trem pra curtir a vista', price:500,
    note:'Nem só de estudos vive o homem.',
    reward:'Lembrancinha: foto da paisagem pela janela' },
  { id:'capacete', emoji:'⛑️', title:'Capacete de futebol americano', price:200,
    note:'Pra mostrar a potência dos Imidio em solo americano.',
    reward:'Lembrancinha: foto com o capacete' },
  { id:'bike', emoji:'🚲', title:'Uma bike pra andar no campus', price:1000,
    note:'O campus é gigante. Minhas pernas são finitas.',
    reward:'Lembrancinha: primeira volta de bike filmada' },
  { id:'flores', emoji:'💐', title:'Flores todo mês pra namorada no Brasil', price:120,
    note:'Namoro à distância exige logística. E flores.',
    reward:'Lembrancinha: foto do buquê entregue' },
];

const DARES = [
  { id:'piscina', emoji:'🏊', title:'Eu me jogo na piscina', price:100, note:'De roupa. Na hora. Sem aviso prévio.' },
  { id:'karaoke', emoji:'🎤', title:'Eu canto no karaokê', price:150, note:'Você escolhe a música. Eu não posso recusar.' },
  { id:'discurso', emoji:'🎙️', title:'Discurso de agradecimento', price:200, note:'Improvisado, no microfone, para todo mundo.' },
  { id:'danca', emoji:'🕺', title:'Eu danço o que você mandar', price:120, note:'Coreografia definida por quem pagou. Filmado.' },
];

const STORY = [
  { n:'01', t:'A carta chegou', d:'Engenharia Mecânica, University of Notre Dame. O e-mail que virou o ano de cabeça pra baixo.' },
  { n:'02', t:'A mala de 23kg', d:'Dezoito anos de vida contra um limite de peso da companhia aérea.' },
  { n:'03', t:'A festa do dia 16', d:'Aniversário e despedida na mesma noite. Bolo, bingo e muita gente chorando.' },
  { n:'04', t:'A vida nova', d:'Neve, campus gigante e saudade de pão de queijo. Nessa ordem.' },
];

/* ============================================================================
   UTILIDADES
   ========================================================================== */

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const brl = n => n.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
));

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}

// Remove acentos e força maiúsculas — exigência do padrão BR Code.
const clean = (s, max) => String(s)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Za-z0-9 ]/g, '')
  .toUpperCase().trim().slice(0, max);

/* ============================================================================
   PIX — BR Code (EMV) + CRC16-CCITT-FALSE
   Especificação: Manual do BR Code, Banco Central do Brasil.
   ========================================================================== */

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Campo TLV: ID (2) + tamanho (2) + valor
const tlv = (id, value) => id + String(value.length).padStart(2, '0') + value;

function buildPixPayload({ key, name, city, amount, txid }) {
  const merchant =
    tlv('00', 'BR.GOV.BCB.PIX') +
    tlv('01', key);

  let payload =
    tlv('00', '01') +                       // Payload Format Indicator
    tlv('26', merchant) +                   // Merchant Account Information — Pix
    tlv('52', '0000') +                     // Merchant Category Code
    tlv('53', '986') +                      // Moeda: BRL
    (amount ? tlv('54', amount.toFixed(2)) : '') +
    tlv('58', 'BR') +                       // País
    tlv('59', clean(name, 25) || 'RECEBEDOR') +
    tlv('60', clean(city, 15) || 'BRASIL') +
    tlv('62', tlv('05', clean(txid, 25) || '***'));

  payload += '6304';                        // CRC placeholder
  return payload + crc16(payload);
}

/* ============================================================================
   STORE — Firebase em tempo real, com fallback local
   ========================================================================== */

const Store = {
  mode: 'local',
  db: null,
  claims: {},       // { giftId: { name, msg, at } }
  listeners: [],

  init() {
    const cfg = CONFIG.firebase;
    if (cfg && cfg.databaseURL && window.firebase) {
      try {
        firebase.initializeApp(cfg);
        this.db = firebase.database().ref('presentes');
        this.mode = 'firebase';
        this.db.on('value', snap => {
          this.claims = snap.val() || {};
          this.emit();
        }, () => this.fallback());
        return;
      } catch (e) {
        console.warn('[Firebase] falhou, usando modo local:', e.message);
      }
    }
    this.fallback();
  },

  fallback() {
    this.mode = 'local';
    try { this.claims = JSON.parse(localStorage.getItem('presentes') || '{}'); }
    catch { this.claims = {}; }
    this.emit();
  },

  claim(id, data) {
    this.claims[id] = data;
    if (this.mode === 'firebase') {
      this.db.child(id).set(data).catch(() => toast('Sem conexão — salvo só neste aparelho.'));
    } else {
      try { localStorage.setItem('presentes', JSON.stringify(this.claims)); } catch {}
    }
    this.emit();
  },

  onChange(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(fn => fn(this.claims)); },
};

/* ============================================================================
   RENDER — presentes, desafios, mural, progresso
   ========================================================================== */

const ALL = [...GIFTS, ...DARES];
const findItem = id => ALL.find(g => g.id === id);

function renderGifts() {
  $('#giftGrid').innerHTML = GIFTS.map(g => `
    <article class="gift" data-id="${g.id}">
      <div class="gift-emoji">${g.emoji}</div>
      <h3>${esc(g.title)}</h3>
      <p class="gift-note">${esc(g.note)}</p>
      <div class="gift-foot">
        <div class="gift-price"><small>R$</small>${brl(g.price)}</div>
        <button class="gift-btn" data-open="${g.id}">Presentear</button>
      </div>
      <div class="gift-reveal"><span>🎁 ${esc(g.reward)}</span></div>
    </article>`).join('');
}

function renderDares() {
  $('#dareGrid').innerHTML = DARES.map(d => `
    <article class="dare" data-id="${d.id}">
      <div class="dare-emoji">${d.emoji}</div>
      <h4>${esc(d.title)}</h4>
      <p>${esc(d.note)}</p>
      <div class="gift-price"><small>R$</small>${brl(d.price)}</div>
      <button class="gift-btn" data-open="${d.id}">Pagar pra ver</button>
    </article>`).join('');
}

function renderStory() {
  $('#swapStage').innerHTML = STORY.map((s, i) => `
    <div class="swap-card" data-i="${i}">
      <div class="n">Capítulo ${s.n}</div>
      <h4>${esc(s.t)}</h4>
      <p>${esc(s.d)}</p>
    </div>`).join('');
}

function paintClaims(claims) {
  // Cartões
  $$('.gift, .dare').forEach(el => {
    const id = el.dataset.id;
    const taken = !!claims[id];
    el.classList.toggle('taken', taken);
    const btn = el.querySelector('[data-open]');
    if (btn) {
      btn.textContent = taken ? 'Já presenteado' : (el.classList.contains('dare') ? 'Pagar pra ver' : 'Presentear');
      btn.disabled = taken;
    }
    let flag = el.querySelector('.taken-flag');
    if (taken && !flag) {
      flag = document.createElement('div');
      flag.className = 'taken-flag';
      flag.textContent = '✓ Presenteado';
      el.appendChild(flag);
    } else if (!taken && flag) {
      flag.remove();
    }
  });

  // Progresso
  const total = GIFTS.length;
  const done  = GIFTS.filter(g => claims[g.id]).length;
  const raised = ALL.filter(g => claims[g.id]).reduce((s, g) => s + g.price, 0);
  $('#progFill').style.width = (done / total * 100) + '%';
  $('#progTxt').textContent = `${done} de ${total} presentes · R$ ${brl(raised)} arrecadados`;
  $('#specCount').textContent = total - done;

  renderWall(claims);
}

function renderWall(claims) {
  const msgs = Object.entries(claims)
    .filter(([, c]) => c && c.msg)
    .sort((a, b) => (b[1].at || 0) - (a[1].at || 0));

  if (!msgs.length) {
    $('#wall').innerHTML = `
      <div class="wall-empty">
        <b>Ainda não tem nenhuma mensagem por aqui.</b>
        Seja a primeira pessoa a deixar um recado — escolha um presente lá em cima.
      </div>`;
    return;
  }

  $('#wall').innerHTML = msgs.map(([id, c]) => {
    const item = findItem(id);
    return `
      <article class="msg">
        <p class="msg-text">“${esc(c.msg)}”</p>
        <div class="msg-from">${esc(c.name || 'Anônimo')}</div>
        <div class="msg-gift">${item ? item.emoji + ' ' + esc(item.title) : ''}</div>
      </article>`;
  }).join('');
}

/* ============================================================================
   MODAL PIX
   ========================================================================== */

let currentItem = null;

function openModal(id) {
  const item = findItem(id);
  if (!item || Store.claims[id]) return;
  currentItem = item;

  $('#mTitle').textContent = item.title;
  $('#mPrice').textContent = 'R$ ' + brl(item.price);
  $('#mName').value = '';
  $('#mMsg').value  = '';

  const warn = $('#pixWarn');
  if (!pixReady()) {
    warn.hidden = false;
    warn.innerHTML = '⚠️ <b>Chave Pix ainda não configurada.</b> Edite <code>CONFIG.pix.key</code> no arquivo <code>app.js</code> — o QR Code abaixo é só um exemplo e não recebe pagamento.';
  } else {
    warn.hidden = true;
  }

  const payload = buildPixPayload({
    key: pixReady() ? CONFIG.pix.key : '00000000000',
    name: CONFIG.pix.name,
    city: CONFIG.pix.city,
    amount: item.price,
    txid: item.id,
  });

  $('#pixCode').textContent = payload;
  drawQR(payload);

  $('#modalBack').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function drawQR(payload) {
  const box = $('#qrBox');
  box.innerHTML = '';
  if (!window.QRCode) {
    box.innerHTML = '<div class="qr-fallback">Não foi possível carregar o gerador de QR Code.<br>Use o <b>Pix Copia e Cola</b> abaixo.</div>';
    return;
  }
  const canvas = document.createElement('canvas');
  box.appendChild(canvas);
  QRCode.toCanvas(canvas, payload, { width:184, margin:1, color:{ dark:'#050D1F', light:'#FFFFFF' } }, err => {
    if (err) box.innerHTML = '<div class="qr-fallback">QR indisponível.<br>Use o <b>Pix Copia e Cola</b> abaixo.</div>';
  });
}

function closeModal() {
  $('#modalBack').classList.remove('open');
  document.body.style.overflow = '';
  currentItem = null;
}

function wireModal() {
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener && !opener.disabled) openModal(opener.dataset.open);
  });

  $('#modalX').addEventListener('click', closeModal);
  $('#modalBack').addEventListener('click', e => { if (e.target === $('#modalBack')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  $('#copyBtn').addEventListener('click', async () => {
    const code = $('#pixCode').textContent;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    const btn = $('#copyBtn');
    btn.textContent = 'Copiado!'; btn.classList.add('done');
    setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('done'); }, 2200);
  });

  $('#mConfirm').addEventListener('click', () => {
    if (!currentItem) return;
    const name = $('#mName').value.trim();
    const msg  = $('#mMsg').value.trim();
    if (!name) { toast('Escreve seu nome pra aparecer no mural 🙂'); $('#mName').focus(); return; }
    Store.claim(currentItem.id, { name: name.slice(0,40), msg: msg.slice(0,280), at: Date.now() });
    toast('Presente registrado! Obrigado 💛');
    closeModal();
    setTimeout(() => $('#mural').scrollIntoView({ behavior:'smooth' }), 400);
  });
}

/* ============================================================================
   CONTAGEM REGRESSIVA
   ========================================================================== */

function countdown() {
  const el = $('#countdown');
  const target = new Date(CONFIG.partyDate).getTime();
  const units = [['Dias',864e5], ['Horas',36e5], ['Min',6e4], ['Seg',1e3]];

  const tick = () => {
    let diff = target - Date.now();
    if (diff <= 0) {
      el.innerHTML = `<div class="cd-cell" style="min-width:auto;padding:20px 34px">
        <div class="cd-num">É hoje!</div><div class="cd-lab">16 de agosto</div></div>`;
      return clearInterval(timer);
    }
    el.innerHTML = units.map(([label, ms]) => {
      const v = Math.floor(diff / ms); diff -= v * ms;
      return `<div class="cd-cell"><div class="cd-num">${String(v).padStart(2,'0')}</div><div class="cd-lab">${label}</div></div>`;
    }).join('');
  };
  tick();
  const timer = setInterval(tick, 1000);
}

/* ============================================================================
   MARQUEE
   ========================================================================== */

function marquee() {
  const words = ['16 de Agosto','Notre Dame','Aniversário','Engenharia Mecânica','Despedida','Fighting Irish','Até o Ano Novo'];
  const set = words.map(w => `<span>${w}</span>`).join('');
  $('#mqTrack').innerHTML = set + set;
}

/* ============================================================================
   TEXT PRESSURE — efeito obrigatório
   Cada letra reage à distância do cursor via eixos da fonte variável.
   ========================================================================== */

function textPressure() {
  const wrap  = $('#pressure-wrap');
  const title = $('#pressure-title');
  if (!wrap || !title) return;

  const text  = title.textContent.trim();
  const chars = text.split('');
  title.innerHTML = chars.map(c => `<span>${c}</span>`).join('');
  const spans = $$('span', title);

  const mouse  = { x: innerWidth/2, y: innerHeight/2 };
  const cursor = { x: innerWidth/2, y: innerHeight/2 };

  addEventListener('mousemove', e => { cursor.x = e.clientX; cursor.y = e.clientY; }, { passive:true });
  addEventListener('touchmove', e => {
    const t = e.touches[0]; if (t) { cursor.x = t.clientX; cursor.y = t.clientY; }
  }, { passive:true });

  const size = () => {
    const r = wrap.getBoundingClientRect();
    const w = r.width, h = r.height;
    if (!w || !h) return;

    // Duas restrições, e vence a menor:
    //  - altura: line-height é 0.9, então a fonte não pode passar de h/0.9
    //    (sem isso o título transborda e atropela o subtítulo);
    //  - largura: ~0.62em é a largura média de uma maiúscula nesta fonte.
    const byHeight = h / 0.92;
    const byWidth  = w / (chars.length * 0.62);
    let fs = Math.max(24, Math.min(byHeight, byWidth));
    title.style.fontSize = fs + 'px';

    // Rede de segurança: com space-between as letras se espalham, mas se a
    // soma dos glifos ainda exceder o container o flex não encolhe — então
    // medimos e reduzimos de fato.
    const actual = title.scrollWidth;
    if (actual > w) {
      fs = Math.max(20, fs * (w / actual) * 0.97);
      title.style.fontSize = fs + 'px';
    }
  };
  size();
  addEventListener('resize', size);
  // Fontes web chegam depois do primeiro cálculo e mudam as métricas.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);

  const attr = (dist, max, min, maxV) =>
    Math.max(min, maxV - Math.abs((maxV * dist) / max) + min);

  (function frame() {
    mouse.x += (cursor.x - mouse.x) / 14;
    mouse.y += (cursor.y - mouse.y) / 14;

    const box = title.getBoundingClientRect();
    const maxD = box.width / 2 || 1;

    spans.forEach(s => {
      const r  = s.getBoundingClientRect();
      const dx = mouse.x - (r.x + r.width/2);
      const dy = mouse.y - (r.y + r.height/2);
      const d  = Math.hypot(dx, dy);

      const wght = Math.floor(attr(d, maxD, 100, 900));
      const wdth = Math.floor(attr(d, maxD, 40, 151));
      const ital = attr(d, maxD, 0, 1).toFixed(2);
      s.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${ital}`;
    });

    requestAnimationFrame(frame);
  })();
}

/* ============================================================================
   PORTAL — animação dirigida pelo scroll (efeito obrigatório)
   ========================================================================== */

function portal() {
  const section = $('#portal');
  const canvas  = $('#portal-canvas');
  const stages  = $$('.portal-stage');
  const rings   = $$('.portal-ring');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  let progress = 0;

  // Túnel de partículas — profundidade em z, projetadas em perspectiva.
  const N = window.innerWidth < 768 ? 180 : 420;
  const stars = Array.from({ length:N }, () => ({
    x:(Math.random()-.5)*2, y:(Math.random()-.5)*2, z:Math.random(),
    s:Math.random()*1.6+.4,
  }));

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  addEventListener('resize', resize);

  function onScroll() {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    progress = Math.min(1, Math.max(0, -r.top / (total || 1)));

    const idx = Math.min(stages.length-1, Math.floor(progress * stages.length * 0.999));
    stages.forEach((s,i) => s.classList.toggle('on', i === idx));

    rings.forEach((ring,i) => {
      const scale = 1 + progress * (1.4 + i*0.5);
      ring.style.transform = `translate(-50%,-50%) scale(${scale}) rotate(${progress*90*(i%2?-1:1)}deg)`;
    });
  }
  addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  (function draw() {
    ctx.clearRect(0,0,W,H);
    const cx = W/2, cy = H/2;
    const speed = 0.0016 + progress * 0.012;

    stars.forEach(p => {
      p.z -= speed;
      if (p.z <= 0.01) { p.z = 1; p.x = (Math.random()-.5)*2; p.y = (Math.random()-.5)*2; }

      const k  = 0.55 / p.z;
      const px = cx + p.x * k * W * 0.62;
      const py = cy + p.y * k * H * 0.62;
      if (px < -60 || px > W+60 || py < -60 || py > H+60) return;

      const alpha = Math.min(1, (1 - p.z) * 1.5) * (0.28 + progress*0.62);
      const rad   = Math.max(0.35, p.s * (1 - p.z) * 2.6);

      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI*2);
      ctx.fillStyle = p.z > 0.55
        ? `rgba(185,176,160,${alpha*0.55})`
        : `rgba(232,199,102,${alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  })();
}

/* ============================================================================
   CARD SWAP — pilha de cartões que se revezam
   ========================================================================== */

function cardSwap() {
  const cards = $$('.swap-card');
  if (!cards.length) return;

  let order = cards.map((_, i) => i);

  // Em telas estreitas o leque precisa ser mais fechado, senão a pilha
  // vaza para fora da viewport.
  let DX, DY, mid = (cards.length - 1) / 2;
  const metrics = () => {
    const small = innerWidth < 700;
    DX = small ? 16 : 42;
    DY = small ? 20 : 38;
  };
  metrics();

  const place = () => order.forEach((cardIdx, slot) => {
    const el = cards[cardIdx];
    // Deslocamento medido a partir do centro do leque, para a pilha ficar
    // centralizada no palco em vez de crescer só para a direita.
    const ox = (slot - mid) * DX;
    const oy = -(slot - mid) * DY;
    el.style.transform =
      `translate(-50%,-50%) translate3d(${ox}px, ${oy}px, ${-slot*70}px)`;
    el.style.zIndex = String(cards.length - slot);
    el.style.opacity = slot > 3 ? '0' : '1';
    el.style.transition = 'transform .85s cubic-bezier(.52,.01,0,1), opacity .5s';
  });
  place();
  addEventListener('resize', () => { metrics(); place(); });

  let paused = false;
  $('#swapStage').addEventListener('mouseenter', () => paused = true);
  $('#swapStage').addEventListener('mouseleave', () => paused = false);

  setInterval(() => {
    if (paused || document.hidden) return;
    const front = order.shift();
    const el = cards[front];
    el.style.transform = `translate(-50%,-50%) translate3d(0, 340px, 120px)`;
    setTimeout(() => { order.push(front); place(); }, 420);
  }, 3600);
}

/* ============================================================================
   BENTO GLOW — brilho de borda que segue o cursor
   ========================================================================== */

function bentoGlow() {
  const cards = () => $$('.gift');
  addEventListener('mousemove', e => {
    cards().forEach(c => {
      const r = c.getBoundingClientRect();
      const near = e.clientX > r.left-220 && e.clientX < r.right+220 &&
                   e.clientY > r.top-220  && e.clientY < r.bottom+220;
      if (!near) { c.style.setProperty('--gi','0'); return; }
      c.style.setProperty('--gx', ((e.clientX - r.left)/r.width*100)+'%');
      c.style.setProperty('--gy', ((e.clientY - r.top)/r.height*100)+'%');
      c.style.setProperty('--gi','1');
    });
  }, { passive:true });
}

/* ============================================================================
   CURSOR + REVEAL + HEADER
   ========================================================================== */

function cursorRing() {
  const ring = $('#cursor-ring');
  if (!ring || matchMedia('(hover:none)').matches) return;
  let x = innerWidth/2, y = innerHeight/2, tx = x, ty = y;

  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive:true });
  document.addEventListener('mouseover', e => {
    ring.classList.toggle('grow', !!e.target.closest('a,button,.gift,.dare,.swap-card'));
  });

  (function loop() {
    x += (tx-x)*0.18; y += (ty-y)*0.18;
    ring.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
}

function reveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));
}

function header() {
  const hdr = $('#hdr'), burger = $('#burger'), nav = $('#nav');
  addEventListener('scroll', () => hdr.classList.toggle('solid', scrollY > 60), { passive:true });
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open'); nav.classList.remove('open'); document.body.style.overflow = '';
  }));
}

/* ============================================================================
   VÍDEO DO HERO — só carrega se o arquivo existir
   ========================================================================== */

function heroVideo() {
  const v = $('#heroVideo');
  if (!v) return;

  // Em conexões lentas ou com economia de dados, nem tenta o vídeo:
  // o gradiente do hero já é um plano de fundo completo.
  const net = navigator.connection;
  if (net && (net.saveData || /2g/.test(net.effectiveType || ''))) {
    v.remove();
    return;
  }

  const queue = [CONFIG.heroVideo.local, CONFIG.heroVideo.remote].filter(Boolean);
  let i = 0;

  function tryNext() {
    if (i >= queue.length) { v.style.display = 'none'; return; }
    v.src = queue[i++];
    v.load();
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  // 'error' no <video> dispara quando a fonte falha — passa para a próxima.
  v.addEventListener('error', tryNext);
  v.addEventListener('loadeddata', () => { v.dataset.ok = '1'; }, { once:true });
  tryNext();
}

/* ============================================================================
   SPLASH CURSOR — rastro fluido dourado que segue o cursor
   Simulação leve em canvas 2D com blending aditivo: o visual de fluido do
   SplashCursor sem o custo de uma simulação Navier-Stokes em WebGL, o que
   mantém o efeito viável no celular.
   ========================================================================== */

function splashCursor() {
  const canvas = $('#fluid-cursor');
  if (!canvas || matchMedia('(hover:none)').matches) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const drops = [];
  const MAX = 260;
  let px = null, py = null;

  // Paleta: dourado quente com variação sutil de matiz.
  const hueFor = speed => 42 + Math.min(18, speed * 0.22);

  addEventListener('mousemove', e => {
    const x = e.clientX, y = e.clientY;
    if (px !== null) {
      const dx = x - px, dy = y - py;
      const speed = Math.hypot(dx, dy);
      // Quanto mais rápido o cursor, mais gotas — dá a sensação de respingo.
      const n = Math.min(5, 1 + Math.floor(speed / 14));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        drops.push({
          x: px + dx * t + (Math.random() - 0.5) * 7,
          y: py + dy * t + (Math.random() - 0.5) * 7,
          vx: dx * 0.11 + (Math.random() - 0.5) * 1.5,
          vy: dy * 0.11 + (Math.random() - 0.5) * 1.5,
          r: 12 + Math.random() * 26 + speed * 0.4,
          life: 1,
          decay: 0.014 + Math.random() * 0.014,
          hue: hueFor(speed),
        });
      }
      while (drops.length > MAX) drops.shift();
    }
    px = x; py = y;
  }, { passive: true });

  addEventListener('mouseout', () => { px = py = null; });

  (function loop() {
    requestAnimationFrame(loop);

    // Rastro: escurece o quadro anterior em vez de limpar, criando persistência.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.x += d.vx; d.y += d.vy;
      d.vx *= 0.93; d.vy *= 0.93;
      d.vy += 0.05;                 // leve gravidade, dá peso ao líquido
      d.life -= d.decay;
      if (d.life <= 0) { drops.splice(i, 1); continue; }

      const r = d.r * d.life;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r);
      g.addColorStop(0,   `hsla(${d.hue},78%,66%,${0.30 * d.life})`);
      g.addColorStop(0.4, `hsla(${d.hue},72%,52%,${0.14 * d.life})`);
      g.addColorStop(1,   `hsla(${d.hue},70%,45%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  })();
}

/* ============================================================================
   BOOT
   ========================================================================== */

function boot() {
  renderGifts();
  renderDares();
  renderStory();
  marquee();
  countdown();
  wireModal();
  heroVideo();

  Store.onChange(paintClaims);
  Store.init();

  header();
  reveal();
  cardSwap();

  const light = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!light) {
    textPressure();
    portal();
    cursorRing();
    if (!matchMedia('(hover:none)').matches) { bentoGlow(); splashCursor(); }
  } else {
    $$('.portal-stage')[0]?.classList.add('on');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
