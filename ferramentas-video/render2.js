const {chromium}=require('playwright');
const fs=require('fs');

// Relógio congelado: rAF só avança quando mandamos. Assim cada quadro é
// montado sem pressa e nenhum se perde — o FPS final é exatamente o pedido.
const FREEZE = `
window.__clk={q:[],t:0};
window.requestAnimationFrame=function(cb){window.__clk.q.push(cb);return ++window.__clk.n||1;};
window.cancelAnimationFrame=function(){};
window.__tick=function(dt){window.__clk.t+=dt;const q=window.__clk.q;window.__clk.q=[];
  for(const cb of q){try{cb(window.__clk.t);}catch(e){}}};
`;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

function sample(keys,t){
  if(t<=keys[0].t) return keys[0];
  const last=keys[keys.length-1];
  if(t>=last.t) return last;
  for(let i=0;i<keys.length-1;i++){
    const a=keys[i],b=keys[i+1];
    if(t>=a.t&&t<=b.t){
      const k=(b.t-a.t)?(t-a.t)/(b.t-a.t):1, e=ease(k);
      return {y:a.y+(b.y-a.y)*e, mx:a.mx+(b.mx-a.mx)*e, my:a.my+(b.my-a.my)*e};
    }
  }
  return last;
}

async function render({name,fps,build,W=1920,H=1080}){
  const dir=`frames/${name}`;
  fs.rmSync(dir,{recursive:true,force:true}); fs.mkdirSync(dir,{recursive:true});
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader',
          '--enable-unsafe-swiftshader','--hide-scrollbars','--force-device-scale-factor=1']});
  const p=await b.newPage({viewport:{width:W,height:H}});
  await p.addInitScript(FREEZE);
  await p.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load'});
  await p.waitForTimeout(6000);
  await p.evaluate(()=>{const l=document.querySelector('#loader');
    if(l)l.classList.add('gone'); document.body.classList.remove('locked');});
  await p.evaluate(async()=>{const H=document.body.scrollHeight;
    for(let y=0;y<H;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}
    window.scrollTo(0,0);
    document.querySelectorAll('video').forEach(v=>{v.pause();v.muted=true;});});
  await p.waitForTimeout(2000);

  // o fluido em WebGL custa ~1s por quadro no rasterizador por software.
  // Fica de fora da renderização; a 15% de opacidade quase não aparecia.
  await p.evaluate(()=>{const f=document.querySelector('#fluid'); if(f)f.remove();});

  const geo=await p.evaluate(()=>{
    const g={}; ['#hero','.trust','#manejo','#revelacao','#perspectiva','#portal','#especime',
      '#antesdepois','#credenciais','.proof','#galeria','#atendemos','#cursos','#orcamento','footer']
      .forEach(s=>{const e=document.querySelector(s); if(e)g[s]=Math.round(e.getBoundingClientRect().top+scrollY);});
    g.vh=innerHeight; g.max=document.body.scrollHeight-innerHeight;
    return g;});
  const keys=build(geo,W,H);
  const dur=keys[keys.length-1].t, total=Math.round(dur*fps);

  const cdp=await p.context().newCDPSession(p);
  for(let i=0;i<40;i++) await p.evaluate(()=>window.__tick(16.7));

  const t0=Date.now();
  for(let f=0;f<total;f++){
    const t=f/fps, s=sample(keys,t);
    await p.evaluate(([y,dt,tt])=>{
      window.scrollTo(0,y); window.dispatchEvent(new Event('scroll'));
      document.querySelectorAll('video').forEach(v=>{
        if(v.duration&&isFinite(v.duration)) v.currentTime=tt%v.duration;});
      window.__tick(dt);
    },[s.y,1000/fps,t]);
    // mouse real via CDP: dispara hover de verdade nos elementos
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:Math.round(s.mx),y:Math.round(s.my)});
    await p.evaluate(dt=>window.__tick(dt),1000/fps);
    const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88});
    fs.writeFileSync(`${dir}/f${String(f).padStart(5,'0')}.jpg`, Buffer.from(shot.data,'base64'));
    if(f%300===0) console.log(`  ${name} ${f}/${total} ${((Date.now()-t0)/1000).toFixed(0)}s`);
  }
  console.log(`${name}: ${total} quadros @${fps}fps em ${((Date.now()-t0)/60000).toFixed(1)}min`);
  await b.close();
}
module.exports={render,sample};
