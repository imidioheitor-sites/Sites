const {chromium}=require('playwright');
const {scrollTo,toSel,glide,hold}=require('./drive');
const W=1920,H=1080;

async function open(dir){
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader',
          '--enable-unsafe-swiftshader','--hide-scrollbars','--force-device-scale-factor=1']});
  const ctx=await b.newContext({viewport:{width:W,height:H},
    recordVideo:{dir,size:{width:W,height:H}}});
  const p=await ctx.newPage();
  await p.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load'});
  await p.waitForTimeout(6500);                       // deixa o loader sair
  await p.evaluate(async()=>{                          // pré-carrega imagens
    const H=document.body.scrollHeight;
    for(let y=0;y<H;y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,35));}
    window.scrollTo(0,0);
  });
  await p.waitForTimeout(1800);
  return {b,ctx,p};
}

// ─────────────── 1 · PERCURSO — tour calmo, de cima a baixo ───────────────
async function percurso(){
  const {b,ctx,p}=await open('rec/v1');
  await p.mouse.move(W*0.5,H*0.44);
  await glide(p, W*0.5,H*0.44, W*0.34,H*0.40, 1800, 14);   // acorda o TextPressure
  await glide(p, W*0.34,H*0.40, W*0.66,H*0.46, 1800, 14);
  await hold(p,700);
  await toSel(p,'.trust',2200,-160);   await hold(p,2000);
  await toSel(p,'#manejo',2200,-120);  await hold(p,2200);
  await toSel(p,'#revelacao',2200,-120);
  await glide(p, W*0.66,H*0.46, W*0.30,H*0.42, 900, 10);
  await glide(p, W*0.30,H*0.42, W*0.30,H*0.68, 2200, 16);  // percorre a lista
  await hold(p,900);
  await toSel(p,'#perspectiva',1800,-40);
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#perspectiva').offsetTop+2100), 6500);
  await toSel(p,'#portal',1600,-40);
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#portal').offsetTop+2300), 6500);
  await toSel(p,'#especime',2200,-140);   await hold(p,2000);
  await toSel(p,'#antesdepois',2200,-140);await hold(p,2400);
  await toSel(p,'#credenciais',2200,-150);await hold(p,3200);   // medalhas
  await toSel(p,'.proof',1800,-150);      await hold(p,2600);   // certificações
  await toSel(p,'#galeria',2200,-140);    await hold(p,2400);
  await toSel(p,'#cursos',2400,-140);     await hold(p,2800);
  await toSel(p,'#orcamento',2200,-140);  await hold(p,1800);
  await toSel(p,'footer',2000,-280);      await hold(p,2200);
  await ctx.close(); await b.close();
}

// ─────────────── 2 · INTERAÇÕES — foco no que responde ───────────────
async function interacoes(){
  const {b,ctx,p}=await open('rec/v2');
  await p.mouse.move(W*0.24,H*0.42);
  await glide(p, W*0.24,H*0.42, W*0.76,H*0.44, 2200, 16);   // título reage ao cursor
  await glide(p, W*0.76,H*0.44, W*0.38,H*0.40, 1800, 14);
  await hold(p,500);
  // lista de serviços: a foto acompanha o cursor
  await toSel(p,'#revelacao',1800,-150);
  const items=(await p.$$('.rv')).slice(0,4);
  let cx=W*0.38, cy=H*0.4;
  for(const it of items){
    const box=await it.boundingBox(); if(!box) continue;
    const tx=box.x+box.width*0.26, ty=box.y+box.height/2;
    await glide(p,cx,cy,tx,ty,520,10); cx=tx; cy=ty; await hold(p,780);
  }
  // corredor + paralaxe
  await toSel(p,'#perspectiva',1500,-40);
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#perspectiva').offsetTop+900), 3000);
  await glide(p,cx,cy,W*0.74,H*0.6,1600,14); cx=W*0.74; cy=H*0.6;
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#perspectiva').offsetTop+2200), 3800);
  // portal abrindo
  await toSel(p,'#portal',1400,-40);
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#portal').offsetTop+2200), 5600);
  // foto anotada: troca de categoria + pontos
  await toSel(p,'#especime',1800,-150); await hold(p,500);
  for(const c of (await p.$$('#specCtrl .chip')).slice(0,3)){
    const bx=await c.boundingBox(); if(!bx) continue;
    const tx=bx.x+bx.width/2, ty=bx.y+bx.height/2;
    await glide(p,cx,cy,tx,ty,420,9); cx=tx; cy=ty;
    await p.mouse.click(cx,cy); await hold(p,1000);
  }
  for(const h of (await p.$$('.spec-photo .hot')).slice(0,2)){
    const bx=await h.boundingBox(); if(!bx) continue;
    const tx=bx.x+bx.width/2, ty=bx.y+bx.height/2;
    await glide(p,cx,cy,tx,ty,400,9); cx=tx; cy=ty; await hold(p,850);
  }
  // antes e depois
  await toSel(p,'#antesdepois',1700,-150); await hold(p,1800);
  // galeria + lightbox
  await toSel(p,'#galeria',1800,-140); await hold(p,500);
  const figs=await p.$$('#gal figure'); const fb=await figs[2].boundingBox();
  if(fb){ await glide(p,cx,cy,fb.x+fb.width/2,fb.y+fb.height/2,560,11);
    await hold(p,420); await p.mouse.click(fb.x+fb.width/2,fb.y+fb.height/2);
    await hold(p,1900); await p.keyboard.press('Escape'); await hold(p,600);
    cx=fb.x+fb.width/2; cy=fb.y+fb.height/2; }
  // credenciais e curso fecham
  await toSel(p,'#credenciais',1800,-150); await hold(p,1900);
  await toSel(p,'#cursos',1900,-150); await hold(p,1900);
  await ctx.close(); await b.close();
}

// ─────────────── 3 · RITMO — corte rápido de destaques ───────────────
async function ritmo(){
  const {b,ctx,p}=await open('rec/v3');
  await glide(p, W*0.3,H*0.42, W*0.7,H*0.44, 2200);
  await hold(p,600);
  const beats=[
    ['.trust',1500,-170,1300],
    ['#manejo',1400,-130,1500],
    ['#revelacao',1400,-130,1400],
    ['#perspectiva',1300,-30,0],
  ];
  for(const [sel,ms,off,h] of beats){ await toSel(p,sel,ms,off); if(h) await hold(p,h); }
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#perspectiva').offsetTop+1900), 6000);
  await toSel(p,'#portal',1300,-30);
  await scrollTo(p, await p.evaluate(()=>document.querySelector('#portal').offsetTop+2200), 6200);
  for(const [sel,ms,off,h] of [
    ['#especime',1400,-150,1700],
    ['#antesdepois',1400,-150,1900],
    ['#credenciais',1400,-150,2200],
    ['#galeria',1500,-150,1900],
    ['#atendemos',1400,-150,1600],
    ['#cursos',1500,-150,2100],
    ['#orcamento',1400,-150,1500],
    ['footer',1300,-280,1800]]){
    await toSel(p,sel,ms,off); await hold(p,h);
  }
  await ctx.close(); await b.close();
}

(async()=>{
  const which=process.argv[2];
  const t0=Date.now();
  if(which==='1') await percurso();
  if(which==='2') await interacoes();
  if(which==='3') await ritmo();
  console.log('roteiro',which,'levou',((Date.now()-t0)/1000).toFixed(1),'s');
})();
