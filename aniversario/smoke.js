const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'screenshots');
require('fs').mkdirSync(OUT, { recursive: true });
const PAGE_URL = 'http://127.0.0.1:8899/index.html';

let pass=0, fail=0;
const t=(l,g,w)=>{const ok=(w===undefined? !!g : g===w); ok?pass++:fail++;
  console.log((ok?'PASS ':'FAIL ')+l+'  got='+JSON.stringify(g)+(ok?'':'  want='+JSON.stringify(w)));};

(async () => {
  const browser = await chromium.launch();

  /* ---------------- DESKTOP ---------------- */
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
  const page = await ctx.newPage();
  const errors=[], failedReq=[];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type()==='error') errors.push('console: '+m.text()); });
  page.on('requestfailed', r => failedReq.push(new URL(r.url()).host));

  await page.goto(PAGE_URL, { waitUntil:'networkidle', timeout:45000 });
  await page.waitForTimeout(1200);

  console.log('\n=== hosts externos bloqueados (esperado neste sandbox) ===');
  console.log([...new Set(failedReq)].join(', ') || '(nenhum)');

  console.log('\n=== ERROS DE PÁGINA ===');
  const real = errors.filter(e => !/Failed to load resource|net::ERR|ERR_/i.test(e));
  console.log(real.length ? real.join('\n') : '(nenhum erro de script)');
  t('sem erros de script', real.length, 0);

  /* estrutura */
  t('13 presentes renderizados', await page.locator('.gift').count(), 13);
  t('4 desafios renderizados',   await page.locator('.dare').count(), 4);
  t('4 cartoes de historia',     await page.locator('.swap-card').count(), 4);
  t('contador com 4 celulas',    await page.locator('.cd-cell').count(), 4);
  t('marquee preenchido',        (await page.locator('#mqTrack span').count()) > 0);
  t('mural mostra estado vazio', await page.locator('.wall-empty').count(), 1);
  t('fallback CSS 3D visivel',   await page.locator('#threeFallback').isVisible());

  /* nenhuma seção vazia */
  const emptySections = await page.$$eval('section', els =>
    els.filter(s => s.innerText.trim().length < 12).map(s => s.id || s.className));
  t('nenhuma secao vazia', emptySections.length, 0);
  if (emptySections.length) console.log('   vazias:', emptySections);

  /* overflow horizontal */
  const ovf = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  t('sem overflow horizontal (desktop)', ovf <= 0);

  /* contador está andando */
  const c1 = await page.locator('.cd-cell').last().innerText();
  await page.waitForTimeout(1600);
  const c2 = await page.locator('.cd-cell').last().innerText();
  t('contador regressivo anda', c1 !== c2);



  /* sobreposicao: o titulo nao pode invadir o subtitulo nem a descricao */
  const overlap = await page.evaluate(() => {
    const rect = s => { const e=document.querySelector(s); return e && e.getBoundingClientRect(); };
    const hit = (a,b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const title = rect('#pressure-title'), sub = rect('.hero-sub'), lead = rect('.hero-lead');
    return {
      tituloVsSub:  hit(title, sub),
      tituloVsLead: hit(title, lead),
      subVsLead:    hit(sub, lead),
      titleBottom: Math.round(title.bottom), subTop: Math.round(sub.top),
    };
  });
  t('titulo nao sobrepoe o subtitulo', overlap.tituloVsSub, false);
  t('titulo nao sobrepoe a descricao', overlap.tituloVsLead, false);
  t('subtitulo nao sobrepoe a descricao', overlap.subVsLead, false);

  /* o hero cabe na viewport sem cortar o CTA */
  const ctaVisible = await page.evaluate(() => {
    const b = document.querySelector('.hero-cta').getBoundingClientRect();
    return b.bottom <= window.innerHeight + 1;
  });
  t('botoes do hero visiveis sem rolar', ctaVisible, true);

  /* portal com scroll: o sticky precisa realmente grudar */
  await page.addStyleTag({ content:'html{scroll-behavior:auto !important}' });
  await page.evaluate(() => window.scrollTo(0, document.getElementById('portal').offsetTop));
  await page.waitForTimeout(500);
  const stickyTop = await page.evaluate(() =>
    Math.round(document.querySelector('.portal-sticky').getBoundingClientRect().top));
  t('portal sticky gruda no topo', Math.abs(stickyTop) <= 2);

  await page.evaluate(() => { const p=document.getElementById('portal');
    window.scrollTo(0, p.offsetTop + p.offsetHeight*0.55); });
  await page.waitForTimeout(600);
  const activeStage = await page.locator('.portal-stage.on').count();
  t('portal ativa um capitulo conforme rola', activeStage, 1);
  const stickyTop2 = await page.evaluate(() =>
    Math.round(document.querySelector('.portal-sticky').getBoundingClientRect().top));
  t('portal continua grudado no meio da secao', Math.abs(stickyTop2) <= 2);
  await page.screenshot({ path: OUT+'/desktop-portal.png' });
  await page.evaluate(() => window.scrollTo(0,0));
  await page.waitForTimeout(400);


  /* o texto do portal precisa ter largura de verdade e so um capitulo visivel */
  const pw = await page.evaluate(() => {
    const c = document.querySelector('.portal-copy').getBoundingClientRect();
    const h2 = document.querySelector('.portal-stage.on h2').getBoundingClientRect();
    const vis = [...document.querySelectorAll('.portal-stage')]
      .filter(e => +getComputedStyle(e).opacity > 0.5).length;
    return { copyW: Math.round(c.width), h2W: Math.round(h2.width), vis };
  });
  t('portal-copy tem largura real (>400px)', pw.copyW > 400);
  t('titulo do capitulo nao esta espremido (>300px)', pw.h2W > 300);
  t('apenas um capitulo visivel por vez', pw.vis, 1);

  // depois da transicao assentar, os outros capitulos precisam estar em 0
  await page.waitForTimeout(1400);
  const settled = await page.evaluate(() => [...document.querySelectorAll('.portal-stage')]
    .map(e => +getComputedStyle(e).opacity).filter(o => o > 0.01).length);
  t('crossfade assenta: so um capitulo com opacidade', settled, 1);
  await page.screenshot({ path: OUT+'/desktop-portal.png' });

  /* fluxo do presente */
  await page.locator('.gift [data-open]').first().click();
  await page.waitForTimeout(600);
  t('modal abriu', await page.locator('#modalBack.open').count(), 1);
  const payload = await page.locator('#pixCode').innerText();
  t('payload Pix comeca com 000201', payload.slice(0,6), '000201');
  t('payload tem GUI do Pix', payload.includes('BR.GOV.BCB.PIX'));
  t('aviso de chave nao configurada aparece', await page.locator('#pixWarn').isVisible());
  t('preco no modal', (await page.locator('#mPrice').innerText()).includes('50,00'));

  await page.fill('#mName', 'Julianna');
  await page.fill('#mMsg', 'Voa alto, meu amor!');
  await page.click('#mConfirm');
  await page.waitForTimeout(900);
  t('modal fechou apos confirmar', await page.locator('#modalBack.open').count(), 0);
  t('presente marcado como dado', await page.locator('.gift.taken').count(), 1);
  t('mensagem apareceu no mural', (await page.locator('.msg-text').first().innerText()).includes('Voa alto'));
  t('progresso atualizou', (await page.locator('#progTxt').innerText()).includes('1 de 13'));

  await page.screenshot({ path: OUT+'/desktop-full.png', fullPage:true });
  await page.locator('#hero').screenshot({ path: OUT+'/desktop-hero.png' });

  /* ---------------- MOBILE ---------------- */
  const mctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const mp = await mctx.newPage();
  await mp.goto(PAGE_URL, { waitUntil:'networkidle', timeout:45000 });
  await mp.waitForTimeout(1200);

  const movf = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  t('sem overflow horizontal (mobile 390px)', movf <= 0);

  /* qualquer elemento estourando a viewport? */
  const wide = await mp.$$eval('body *', els => els.filter(e => {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
      // ignora elementos dentro de containers que fazem o próprio clipping (marquee, drawer)
      if (e.closest('.marquee, nav.links')) return false;
      return e.getBoundingClientRect().right > window.innerWidth + 2;
    }).slice(0,8).map(e => e.tagName+'.'+(e.className||'').toString().split(' ')[0]));
  t('nenhum elemento VISIVEL estoura a largura', wide.length, 0);
  if (wide.length) console.log('   estourando:', wide);

  /* menu mobile */
  await mp.click('#burger');
  await mp.waitForTimeout(500);
  t('menu mobile abre', await mp.locator('#nav.open').count(), 1);
  await mp.click('#burger');
  await mp.waitForTimeout(400);

  await mp.screenshot({ path: OUT+'/mobile-full.png', fullPage:true });

  console.log('\n' + pass + ' passaram, ' + fail + ' falharam');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
