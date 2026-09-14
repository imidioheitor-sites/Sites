// Linhas do tempo: cada item é [tempo, scrollY, cursorX, cursorY].
// O cursor nunca fica parado por muito tempo — parado ele denuncia gravação.
const T = {
  // 1 · PERCURSO — leitura calma de cima a baixo
  percurso: (g,W,H)=>{
    const k=[]; let t=0;
    const at=(dt,y,mx,my)=>{ t+=dt; k.push({t,y,mx,my}); };
    k.push({t:0,y:0,mx:W*0.30,my:H*0.46});
    at(3.0, 0,            W*0.72, H*0.42);   // varre o título
    at(2.6, 0,            W*0.44, H*0.50);
    at(2.4, g['.trust']-120,   W*0.50, H*0.55);
    at(2.0, g['.trust']-120,   W*0.62, H*0.50);
    at(2.6, g['#manejo']-90,   W*0.40, H*0.45);
    at(2.2, g['#manejo']-90,   W*0.55, H*0.55);
    at(2.6, g['#revelacao']-110, W*0.30, H*0.40);
    at(4.0, g['#revelacao']-110, W*0.30, H*0.72);  // desce a lista
    at(2.4, g['#perspectiva']-20, W*0.50, H*0.50);
    at(9.5, g['#perspectiva']+2400, W*0.66, H*0.58);  // corredor
    at(2.0, g['#portal']-20,   W*0.50, H*0.50);
    at(9.0, g['#portal']+2600, W*0.42, H*0.46);       // portal abrindo
    at(2.4, g['#especime']-130, W*0.34, H*0.52);
    at(2.6, g['#especime']-130, W*0.30, H*0.62);
    at(2.4, g['#antesdepois']-130, W*0.36, H*0.50);
    at(2.6, g['#antesdepois']-130, W*0.52, H*0.56);
    at(2.4, g['#credenciais']-140, W*0.45, H*0.48);
    at(3.4, g['#credenciais']-140, W*0.70, H*0.55);   // medalhas
    at(2.4, g['.proof']-150,   W*0.35, H*0.52);
    at(2.8, g['.proof']-150,   W*0.68, H*0.52);
    at(2.4, g['#galeria']-140, W*0.45, H*0.50);
    at(2.8, g['#galeria']-140, W*0.62, H*0.60);
    at(2.6, g['#cursos']-140,  W*0.40, H*0.50);
    at(3.0, g['#cursos']-140,  W*0.60, H*0.58);
    at(2.4, g['#orcamento']-140, W*0.42, H*0.55);
    at(2.2, g['#orcamento']-140, W*0.55, H*0.50);
    at(2.4, Math.min(g.max, g['footer']-260), W*0.48, H*0.52);
    at(2.4, Math.min(g.max, g['footer']-260), W*0.52, H*0.48);
    return k;
  },

  // 2 · INTERAÇÕES — o cursor é o protagonista
  interacoes: (g,W,H)=>{
    const k=[]; let t=0;
    const at=(dt,y,mx,my)=>{ t+=dt; k.push({t,y,mx,my}); };
    k.push({t:0,y:0,mx:W*0.18,my:H*0.44});
    at(2.8, 0, W*0.82, H*0.42);              // título deforma sob o cursor
    at(2.6, 0, W*0.30, H*0.46);
    at(2.4, 0, W*0.60, H*0.40);
    at(2.2, g['#revelacao']-110, W*0.28, H*0.34);
    // percorre os cinco serviços: a foto acompanha o cursor
    at(1.6, g['#revelacao']-110, W*0.30, H*0.40);
    at(1.6, g['#revelacao']-110, W*0.32, H*0.48);
    at(1.6, g['#revelacao']-110, W*0.30, H*0.56);
    at(1.6, g['#revelacao']-110, W*0.32, H*0.64);
    at(1.6, g['#revelacao']-110, W*0.30, H*0.72);
    at(2.0, g['#perspectiva']-20, W*0.50, H*0.50);
    at(5.0, g['#perspectiva']+1200, W*0.24, H*0.34);   // paralaxe pelo cursor
    at(5.0, g['#perspectiva']+2500, W*0.78, H*0.66);
    at(1.8, g['#portal']-20, W*0.50, H*0.50);
    at(9.0, g['#portal']+2600, W*0.56, H*0.44);
    at(2.2, g['#especime']-130, W*0.22, H*0.42);
    at(2.0, g['#especime']-130, W*0.16, H*0.36);       // pontos numerados
    at(2.0, g['#especime']-130, W*0.24, H*0.52);
    at(2.0, g['#especime']-130, W*0.13, H*0.60);
    at(2.2, g['#antesdepois']-130, W*0.30, H*0.50);
    at(2.6, g['#antesdepois']-130, W*0.46, H*0.56);
    at(2.4, g['#galeria']-140, W*0.30, H*0.44);
    at(2.6, g['#galeria']-140, W*0.55, H*0.58);        // hover na galeria
    at(2.4, g['#galeria']-140, W*0.78, H*0.46);
    at(2.4, g['#credenciais']-140, W*0.40, H*0.50);
    at(3.0, g['#credenciais']-140, W*0.72, H*0.54);
    at(2.6, g['#cursos']-140, W*0.45, H*0.52);
    at(2.8, g['#cursos']-140, W*0.62, H*0.56);
    return k;
  },

  // 3 · RITMO — corte curto, movimento constante
  ritmo: (g,W,H)=>{
    const k=[]; let t=0;
    const at=(dt,y,mx,my)=>{ t+=dt; k.push({t,y,mx,my}); };
    k.push({t:0,y:0,mx:W*0.34,my:H*0.44});
    at(2.4, 0, W*0.68, H*0.44);
    at(1.6, g['.trust']-130, W*0.50, H*0.52);
    at(1.4, g['.trust']-130, W*0.58, H*0.50);
    at(1.6, g['#manejo']-90, W*0.42, H*0.48);
    at(1.4, g['#manejo']-90, W*0.50, H*0.54);
    at(1.6, g['#revelacao']-110, W*0.30, H*0.42);
    at(2.2, g['#revelacao']-110, W*0.31, H*0.66);
    at(1.6, g['#perspectiva']-20, W*0.50, H*0.50);
    at(9.2, g['#perspectiva']+2500, W*0.70, H*0.60);
    at(1.5, g['#portal']-20, W*0.50, H*0.50);
    at(8.6, g['#portal']+2600, W*0.44, H*0.48);
    at(1.6, g['#especime']-130, W*0.30, H*0.50);
    at(1.8, g['#especime']-130, W*0.20, H*0.42);
    at(1.6, g['#antesdepois']-130, W*0.38, H*0.52);
    at(1.8, g['#antesdepois']-130, W*0.50, H*0.50);
    at(1.6, g['#credenciais']-140, W*0.46, H*0.48);
    at(3.0, g['#credenciais']-140, W*0.70, H*0.54);
    at(1.6, g['.proof']-150, W*0.40, H*0.52);
    at(1.8, g['.proof']-150, W*0.66, H*0.52);
    at(1.6, g['#galeria']-140, W*0.44, H*0.50);
    at(1.8, g['#galeria']-140, W*0.60, H*0.58);
    at(1.6, g['#atendemos']-140, W*0.52, H*0.50);
    at(1.6, g['#cursos']-140, W*0.42, H*0.50);
    at(2.8, g['#cursos']-140, W*0.60, H*0.56);
    at(1.6, g['#orcamento']-140, W*0.46, H*0.52);
    at(2.0, Math.min(g.max,g['footer']-260), W*0.50, H*0.50);
    at(1.6, Math.min(g.max,g['footer']-260), W*0.56, H*0.46);
    return k;
  },
};
module.exports=T;
