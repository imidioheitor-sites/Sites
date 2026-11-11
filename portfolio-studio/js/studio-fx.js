/* studio-fx.js — efeitos novos desta versão (autorais, JS puro):
   1. key light: luz de estúdio de cobre que segue o mouse no hero + paralaxe de profundidade (fundo x recorte)
   2. iris: cada seção abre como a íris de uma lente quando entra na tela
   3. copper trail: rastro de cobre que desvanece atrás do cursor
   4. barra de progresso de cobre + grão de filme
   5. orquestra o Enxame de Cursores (swarm-build.js): prepara a página e constrói tudo ao vivo na primeira visita */
(function(){
  'use strict';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,r){return (r||document).querySelector(s)};
  function when(sel,cb,n){var el=$(sel);if(el)return cb(el);if((n=n||0)>200)return;setTimeout(function(){when(sel,cb,n+1)},100)}

  /* 4. progresso + grão */
  var bar=document.createElement('div');bar.className='fx-progress';bar.setAttribute('data-swarm-ignore','');document.body.appendChild(bar);
  if(!reduce){var g=document.createElement('div');g.className='fx-grain';g.setAttribute('data-swarm-ignore','');document.body.appendChild(g)}
  function prog(){var h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')'}
  addEventListener('scroll',prog,{passive:true});prog();

  /* 1. key light + paralaxe */
  when('.e-hero',function(hero){
    var kl=document.createElement('div');kl.className='fx-keylight';kl.setAttribute('data-swarm-ignore','');hero.appendChild(kl);
    var bg=$('.e-bgphoto',hero),cut=$('.e-cut',hero),giant=$('.e-giant',hero);
    var tx=0,ty=0,cx=0,cy=0,raf=0;
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect();
      var px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
      kl.style.setProperty('--lx',(px*100)+'%');kl.style.setProperty('--ly',(py*100)+'%');
      tx=(px-.5);ty=(py-.5);if(!raf&&!reduce)raf=requestAnimationFrame(step);
    });
    hero.addEventListener('pointerleave',function(){tx=0;ty=0;if(!raf&&!reduce)raf=requestAnimationFrame(step)});
    function step(){
      cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      if(bg)bg.style.transform='translate(calc(-50% + '+(-cx*26)+'px),'+(-cy*14)+'px) scale(1.03)';
      if(cut)cut.style.transform='translate(calc(-50% + '+(cx*18)+'px),'+(cy*10)+'px)';
      if(giant)giant.style.transform='translate('+(cx*-34)+'px,'+(cy*-12)+'px)';
      raf=(Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001)?requestAnimationFrame(step):0;
    }
  });

  /* 2. íris nas seções */
  when('.e-blur',function(){
    var secs=[].slice.call(document.querySelectorAll('.e-blur,.e-luna,.e-ice'));
    if(reduce||!('IntersectionObserver' in window))return;
    secs.forEach(function(s){s.classList.add('fx-iris')});
    var mx=innerWidth/2,my=innerHeight/2;
    addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY},{passive:true});
    function check(){var h=innerHeight;secs.forEach(function(s){
      if(s.classList.contains('in'))return;var r=s.getBoundingClientRect();
      if(r.top<h*.82&&r.bottom>h*.18){
        var ix=Math.max(0,Math.min(100,(mx-r.left)/r.width*100)),iy=Math.max(0,Math.min(100,(my-r.top)/r.height*100));
        s.style.setProperty('--ix',ix+'%');s.style.setProperty('--iy',iy+'%');s.classList.add('in')}})}
    addEventListener('scroll',check,{passive:true});check();
  });

  /* 3. rastro de cobre */
  if(!reduce&&matchMedia('(pointer:fine)').matches){
    var cv=document.createElement('canvas');cv.className='fx-trail';cv.setAttribute('data-swarm-ignore','');document.body.appendChild(cv);
    var ctx=cv.getContext('2d'),pts=[],W,H,dpr=Math.min(2,devicePixelRatio||1);
    function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
    size();addEventListener('resize',size);
    addEventListener('pointermove',function(e){pts.push({x:e.clientX,y:e.clientY,t:performance.now()});if(pts.length>60)pts.shift()},{passive:true});
    (function loop(now){
      ctx.clearRect(0,0,W,H);
      for(var i=pts.length-1;i>=0;i--){var a=1-(now-pts[i].t)/700;if(a<=0){pts.splice(0,i+1);break}}
      for(var j=0;j<pts.length;j++){var p=pts[j],al=Math.max(0,1-(now-p.t)/700);
        ctx.beginPath();ctx.fillStyle='rgba(209,165,132,'+(al*.55)+')';ctx.arc(p.x,p.y,1.5+al*4.5,0,6.283);ctx.fill()}
      requestAnimationFrame(loop)})(performance.now());
  }

  /* 5. enxame: prepara (força as animações "ao entrar na tela" a rodarem) e constrói */
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var busy=false;
  async function prime(){
    [].forEach.call(document.querySelectorAll('.noise,.swarm-btn,.fx-keylight'),function(n){n.setAttribute('data-swarm-ignore','')});
    var cover=document.createElement('div');cover.className='fx-prime';cover.setAttribute('data-swarm-ignore','');document.body.appendChild(cover);
    cover.offsetWidth;cover.classList.add('on');await sleep(380);
    var secs=[].slice.call(document.querySelectorAll('.e-hero,.e-blur,.e-luna,.e-ice,.e-foot'));
    for(var i=0;i<secs.length;i++){scrollTo(0,secs[i].getBoundingClientRect().top+scrollY);await sleep(i===1?2600:800)}
    scrollTo(0,0);await sleep(1400);
    return cover;
  }
  async function build(){
    if(busy||!window.SwarmBuild)return;busy=true;
    try{
      var cover=await prime();
      SwarmBuild.start({sound:false,speed:1.15,tour:true,root:document.querySelector('.e-page')});
      await sleep(500);cover.classList.remove('on');setTimeout(function(){cover.remove()},500);
    }finally{busy=false}
  }
  /* o botão passa pelo preparo antes de ligar; desligar é direto */
  var running=false;
  if(window.SwarmBuild){
    var oStart=SwarmBuild.start,oStop=SwarmBuild.stop;
    SwarmBuild.start=function(o){running=true;return oStart(o)};
    SwarmBuild.stop=function(){running=false;return oStop()};
    SwarmBuild.toggle=function(){ if(running){SwarmBuild.stop()}else{build()} };
  }
  addEventListener('load',function(){
    if(reduce)return;var seen=false;try{seen=sessionStorage.getItem('studio-swarm')}catch(e){}
    if(seen)return;try{sessionStorage.setItem('studio-swarm','1')}catch(e){}
    setTimeout(build,2500);
  });
})();
