(function(){
const P=[
{id:'capa',cod:'RX-01',n:'Capa Armor',c:'Proteção',d:'Antichoque com borda laranja. Cantos em ar comprimido, borda elevada para a tela.',p:79.9,i:'capa-armor',f:[['Modelo','RX-01'],['Acabamento','Preto + laranja'],['Queda','2,4 m'],['Material','TPU + policarbonato']]},
{id:'carr',cod:'RX-02',n:'Carregador GaN 65W',c:'Energia',d:'Compacto, com cabo USB-C trançado. Carrega 0 a 70% em cerca de 30 minutos.',p:149.9,i:'carregador-gan65',f:[['Modelo','RX-02'],['Potência','65 W'],['Portas','USB-C + USB-A'],['Cabo','1,5 m trançado']]},
{id:'fone',cod:'RX-03',n:'Fone Pulse TWS',c:'Áudio',d:'Bluetooth 5.3 com cancelamento de ruído e estojo com LED de status.',p:229.9,i:'fone-pulse',f:[['Modelo','RX-03'],['Bateria','30 h com estojo'],['Conexão','Bluetooth 5.3'],['Proteção','IPX5']]},
{id:'base',cod:'RX-04',n:'Base Magnética',c:'Energia',d:'Carga sem fio de 15 W com ímã alinhado e ângulo ajustável.',p:119.9,i:'base-magnetica',f:[['Modelo','RX-04'],['Potência','15 W'],['Fixação','Magnética'],['Acabamento','Grafite + laranja']]},
{id:'pbank',cod:'RX-05',n:'Power Bank 20K',c:'Energia',d:'Slim, visor digital e três saídas. Aprovado para viagem de avião.',p:189.9,i:'powerbank-20k',f:[['Modelo','RX-05'],['Capacidade','20.000 mAh'],['Saídas','3'],['Visor','Digital']]},
{id:'pel',cod:'RX-06',n:'Película 9H',c:'Proteção',d:'Vidro temperado com moldura de instalação: alinha de primeira, sem bolha.',p:39.9,i:'pelicula-9h',f:[['Modelo','RX-06'],['Dureza','9H'],['Espessura','0,33 mm'],['Instalação','Com moldura']]}];
const K={kit1:['Kit Proteção',139.9],kit2:['Kit Viagem',329.9],kit3:['Kit Completo',649.9]};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fmt=v=>'R$ '+v.toFixed(2).replace('.',',');
let cart=[];try{cart=JSON.parse(localStorage.getItem('rx-cart2')||'[]')}catch(e){}
let sel=0,qtd=1;
const nome=id=>P.find(x=>x.id===id)?.n||K[id]?.[0], preco=id=>P.find(x=>x.id===id)?.p??K[id]?.[1];
function save(){try{localStorage.setItem('rx-cart2',JSON.stringify(cart))}catch(e){}}
function conf(){
  const p=P[sel];
  $('#cfLista').innerHTML=P.map((x,i)=>`<button data-sel="${i}" class="${i===sel?'on':''}"><i></i>${x.cod} · ${x.n}</button>`).join('');
  const im=$('#cfFoto');im.style.opacity=0;setTimeout(()=>{im.src='img/'+p.i+'.jpg';im.alt=p.n;im.style.opacity=1},160);
  $('#cfCod').textContent=p.cod;$('#cfDesc').textContent=p.d;
  $('#cfFicha').innerHTML=p.f.map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
  $('#cfQtd').textContent=String(qtd).padStart(2,'0');
  $('#cfPreco').textContent=(p.p*qtd).toFixed(2).replace('.',',');
}
function draw(){
  $('#qtd').textContent=cart.length;
  $('#itens').innerHTML=cart.length?cart.map((id,i)=>`<li><span>${nome(id)}</span><span>${fmt(preco(id))} <button data-rm="${i}">remover</button></span></li>`).join(''):'<li>Carrinho vazio.</li>';
  const t=cart.reduce((a,id)=>a+preco(id),0);$('#total').textContent=fmt(t);
  $('#zap').href='https://wa.me/?text='+encodeURIComponent('Olá! Quero pedir (demo): '+cart.map(nome).join(', ')+' — total '+fmt(t));
}
function gaveta(o){$('#gaveta').classList.toggle('on',o);$('#veu').classList.toggle('on',o);$('#gaveta').setAttribute('aria-hidden',!o)}
function menu(o){$('#menu').classList.toggle('on',o);$('#burger').setAttribute('aria-expanded',o);$('#menu').setAttribute('aria-hidden',!o)}
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-sel]');if(s){sel=+s.dataset.sel;qtd=1;conf();return}
  if(e.target.closest('#mais')){qtd=Math.min(9,qtd+1);conf();return}
  if(e.target.closest('#menos')){qtd=Math.max(1,qtd-1);conf();return}
  if(e.target.closest('#cfAdd')){for(let i=0;i<qtd;i++)cart.push(P[sel].id);save();draw();gaveta(true);return}
  const a=e.target.closest('[data-add]');if(a){cart.push(a.dataset.add);save();draw();gaveta(true);return}
  const r=e.target.closest('[data-rm]');if(r){cart.splice(+r.dataset.rm,1);save();draw();return}
  if(e.target.closest('#menu a')){menu(false)}
});
$('#burger').onclick=()=>menu(!$('#menu').classList.contains('on'));
$('#abrirCarrinho').onclick=()=>gaveta(true);$('#fechar').onclick=$('#veu').onclick=()=>gaveta(false);
conf();draw();
const reduz=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{ if(window.HeluCubes&&!reduz) HeluCubes.create($('#heroCubes'),{gridSize:8,gap:.16,faceColor:'#f4f2ee',edgeColor:'#ff5a1f',edgeWidth:1.4,faceOpacity:.92,shading:.35,maxAngle:50,radius:3.2,perspective:.25,rippleColor:'#ff5a1f',intro:true}) }catch(e){}
[['HeluNoise','[data-noise]'],['HeluCurvedLoop','[data-curved-loop]'],['HeluCountUp','[data-count-up]'],['HeluScrollFloat','[data-scroll-float]'],['HeluGlare','[data-glare-hover]'],['HeluMagnet','[data-magnet]']].forEach(([n,s])=>{ if(window[n]) $$(s).forEach(el=>{try{window[n].create(el,{})}catch(e){}}) });
})();
