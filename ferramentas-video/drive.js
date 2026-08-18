// helpers de câmera: rolagem suave com easing e movimento de cursor
const easeInOut = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;

async function scrollTo(p, target, ms){
  await p.evaluate(async ([to,dur])=>{
    const from=window.scrollY, d=to-from, t0=performance.now();
    const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    await new Promise(res=>{
      function step(t){const k=Math.min(1,(t-t0)/dur);
        window.scrollTo(0, from+d*ease(k));
        k<1?requestAnimationFrame(step):res();}
      requestAnimationFrame(step);});
  },[target,ms]);
}
async function toSel(p, sel, ms, off=0){
  const y=await p.evaluate(s=>{const e=document.querySelector(s);
    return e?e.getBoundingClientRect().top+window.scrollY:0;}, sel);
  await scrollTo(p, Math.max(0,y+off), ms);
}
// move o cursor em arco, em vez de teleportar
async function glide(p, x0,y0, x1,y1, ms, steps=40){
  for(let i=0;i<=steps;i++){
    const k=easeInOut(i/steps);
    const bow=Math.sin(Math.PI*(i/steps))*38;
    await p.mouse.move(x0+(x1-x0)*k, y0+(y1-y0)*k - bow);
    await p.waitForTimeout(ms/steps);
  }
}
const hold = (p,ms)=>p.waitForTimeout(ms);
module.exports={scrollTo,toSel,glide,hold};
