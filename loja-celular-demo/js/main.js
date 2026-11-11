(function(){
const P=[
{id:'capa',n:'Capa Armor',c:'protecao',d:'Antichoque com borda laranja',p:79.9,i:'capa-armor'},
{id:'carr',n:'Carregador GaN 65W',c:'energia',d:'Compacto, com cabo trançado',p:149.9,i:'carregador-gan65'},
{id:'fone',n:'Fone Pulse TWS',c:'audio',d:'Bluetooth 5.3, 30h de bateria',p:229.9,i:'fone-pulse'},
{id:'base',n:'Base Magnética',c:'energia',d:'Carga sem fio 15W com ímã',p:119.9,i:'base-magnetica'},
{id:'pbank',n:'Power Bank 20K',c:'energia',d:'Slim, visor digital, 3 saídas',p:189.9,i:'powerbank-20k'},
{id:'pel',n:'Película 9H',c:'protecao',d:'Vidro temperado com moldura',p:39.9,i:'pelicula-9h'}];
const K={kit1:['Kit Proteção',139.9],kit2:['Kit Viagem',329.9],kit3:['Kit Completo',649.9]};
const fmt=v=>'R$ '+v.toFixed(2).replace('.',',');
let cart=[];try{cart=JSON.parse(localStorage.getItem('rx-cart')||'[]')}catch(e){}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function save(){try{localStorage.setItem('rx-cart',JSON.stringify(cart))}catch(e){}}
function grade(f){ $('#grade').innerHTML=P.filter(x=>f==='todos'||x.c===f).map(x=>`<article class="card"><img src="img/${x.i}.jpg" alt="${x.n}" loading="lazy"><div class="in"><span class="cat">${x.c}</span><h3>${x.n}</h3><p>${x.d}</p><div class="linha"><span class="preco">${fmt(x.p)}</span><button class="btn" data-add="${x.id}">Adicionar</button></div></div></article>`).join(''); bindMag(); }
function bindMag(){ if(window.HeluMagnet) $$('#grade .btn').forEach(b=>{ if(!b._m){b._m=1;try{HeluMagnet.create(b,{padding:50,strength:4})}catch(e){}} }); }
function nome(id){return P.find(x=>x.id===id)?.n||K[id]?.[0]}
function preco(id){return P.find(x=>x.id===id)?.p??K[id]?.[1]}
function draw(){
  $('#qtd').textContent=cart.length;
  $('#itens').innerHTML=cart.length?cart.map((id,i)=>`<li><span>${nome(id)}</span><span>${fmt(preco(id))} <button data-rm="${i}">remover</button></span></li>`).join(''):'<li>Carrinho vazio.</li>';
  const t=cart.reduce((a,id)=>a+preco(id),0);$('#total').textContent=fmt(t);
  const msg='Olá! Quero pedir (demo): '+cart.map(nome).join(', ')+' — total '+fmt(t);
  $('#zap').href='https://wa.me/?text='+encodeURIComponent(msg);
}
function abrir(o){$('#gaveta').classList.toggle('on',o);$('#veu').classList.toggle('on',o);$('#gaveta').setAttribute('aria-hidden',!o)}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-add]');if(a){cart.push(a.dataset.add);save();draw();abrir(true);return}
  const r=e.target.closest('[data-rm]');if(r){cart.splice(+r.dataset.rm,1);save();draw()}
  const f=e.target.closest('[data-f]');if(f){$$('#filtros button').forEach(b=>b.classList.toggle('on',b===f));grade(f.dataset.f)}
});
$('#abrirCarrinho').onclick=()=>abrir(true);$('#fechar').onclick=$('#veu').onclick=()=>abrir(false);
grade('todos');draw();
// efeitos do kit
const reduz=matchMedia('(prefers-reduced-motion: reduce)').matches;
function init(){
  try{ if(window.HeluCubes && !reduz) HeluCubes.create($('#heroCubes'),{gridSize:12,gap:.18,faceColor:'#141416',edgeColor:'#ff4a1c',edgeWidth:1.2,faceOpacity:1,shading:.4,maxAngle:46,radius:3,perspective:.2,rippleColor:'#ff4a1c',intro:true}) }catch(e){}
  [['HeluNoise','[data-noise]'],['HeluCurvedLoop','[data-curved-loop]'],['HeluCountUp','[data-count-up]'],['HeluScrollFloat','[data-scroll-float]'],['HeluGlare','[data-glare-hover]'],['HeluMagnet','.nav [data-magnet],.hero [data-magnet],.kit [data-magnet]']].forEach(([n,s])=>{ if(window[n]) $$(s).forEach(el=>{try{window[n].create(el,{})}catch(e){}}) });
}
init();
})();
