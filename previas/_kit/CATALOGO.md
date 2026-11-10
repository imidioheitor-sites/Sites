# Catálogo de efeitos HEsites (kit em JS puro, base React Bits)
Arquivos em `kit-efeitos/`. Uso: incluir o `.js` e colocar os atributos `data-*` (mesmos nomes de props do React Bits, em kebab-case) ou chamar `Helu*.create(el, {...})`. Todos têm alternativa sem WebGL/reduced-motion. Regras gerais em `padrao-sites.md` seção 10.

| Efeito | Arquivo | Atributo / API | Tipo | Como foi feito |
|---|---|---|---|---|
| GlassSurface | glass-surface.js | `data-glass` / `HeluGlass` | superfície de vidro | SVG filter (Chromium), vidro fosco (Safari/Firefox), canvas c/ refração se `backdrop` |
| StarBorder | star-border.js | `data-starborder` / `HeluStar` | botão/CTA | canvas 2D, mesmo algoritmo do original |
| Grainient | grainient.js | `data-grainient` / `HeluGrainient` | fundo | **port direto WebGL2**; sem WebGL2 vira linear-gradient |
| Dither | dither.js | `data-dither` / `HeluDither` | fundo | **port direto WebGL2**; sem WebGL2 vira trama CSS |
| Waves | waves.js | `data-waves` / `HeluWaves2` | fundo | **port direto WebGL2**; sem WebGL2 vira linhas CSS |
| MicroSlats | micro-slats.js | `data-microslats` / `HeluSlats` | fundo | canvas 2D equivalente |
| AeroShards | aero-shards.js | `data-aeroshards` / `HeluShards` | fundo | canvas 2D equivalente (plano + paralaxe) |
| SlicedWaves | sliced-waves.js | `data-slicedwaves` / `HeluWaves` | fundo | canvas 2D equivalente |
| LightRays | light-rays.js | `data-lightrays` / `HeluRays` | fundo | canvas 2D equivalente |
| GridMotion | grid-motion.js | `data-gridmotion` / `HeluGrid` | galeria | DOM + CSS, tilt sempre 0 |
| OptionWheel | option-wheel.js | `data-optionwheel` / `HeluWheel` | menu/lista | DOM + CSS, rolagem/arrasto/setas |
| Crosshair | crosshair.js | `data-crosshair` / `HeluCrosshair` | cursor/mira | canvas 2D equivalente; só desktop (desliga em toque), trava em links/botões |
| AuroraText | aurora-text.js | `data-aurora-text` / `HeluAurora` | texto | CSS (gradiente em background-clip), 1 palavra do título; texto real sr-only |
| RetroGrid | retro-grid.js | `data-retro-grid` / `HeluRetro` | fundo (**exceção de nicho, fora do Agente 2**) | **port direto WebGL1** (shader do original) + fallback CSS rotateX. Plano em perspectiva: só tech/gamer/estúdio/retrô, nunca no hero |
| InteractiveGrid | interactive-grid.js | `data-interactive-grid` / `HeluIGrid` | fundo sutil | SVG pattern + 1 listener; acende o quadrado sob o cursor; desligado em toque |
| CoolMode | cool-mode.js | `data-cool-mode` / `HeluCool` | botão/CTA | port direto (partículas emoji/imagem/círculo ao segurar o clique); desligado com reduced-motion |
| Iphone | iphone.js | `data-iphone` / `HeluIphone` | mockup | SVG 433x882 + imagem/vídeo na tela, claro/escuro |
| VideoText | video-text.js | `data-videotext` / `HeluVideoText` | texto | vídeo dentro das letras via mask-image (canvas, usa a fonte do site); vídeo leve no mobile |
| TextHighlighter | highlighter.js | `data-highlighter` / `HeluMark` | texto | SVG próprio (sem rough-notation): highlight, underline, box, circle, strike-through, crossed-off, bracket |
| DodgeField | dodge-field.js | `data-dodge-field` / `HeluDodge` | lúdico (**fora do Agente 2**) | mola própria no lugar da lib motion; NUNCA em CTA real nem em recusar/fechar, só easter egg; desligado em toque e reduced-motion; CustomEvents dodge/relent/catch |
| Cubes | cubes.js | `data-cubes` / `HeluCubes` | fundo (**exceção de nicho, fora do Agente 2**) | **port direto WebGL2**; cubos giram em 3D de verdade (perspective=0 por padrão); fallback grade CSS |
| AcidSquares | acid-squares.js | `data-acid-squares` / `HeluAcid` | fundo (**exceção de nicho, fora do Agente 2**) | **port direto WebGL2**; campo de ondas em perspectiva; detail=low no mobile; fallback gradiente |
| TechText | tech-text.js | `data-tech-text` / `HeluTech` | texto/marca (**nicho, fora do Agente 2**) | **port direto canvas 2D**; wordmark vira contorno tracejado sob o cursor; letras arrastáveis, intros type/assemble/metrics; usa a fonte do site |
| MaskedHeading | masked-heading.js | `data-masked-heading` / `HeluMasked` | texto | **port direto**, gsap trocado por tween próprio; foto/vídeo dentro das letras (clip-path SVG), entradas rise/scale/blur/wipe/fade, spotlight, outline; vídeo leve no mobile |

"Equivalente" = mesmas props e mesmo visual geral, mas reescrito (o código-fonte desses não foi enviado). "Port direto" = shaders e lógica do código original.

## Qual usar por tipo de negócio (um fundo por site)
- **Confeitaria, doceria, padaria, buffet:** Grainient em tons de cacau/caramelo atrás da abertura; StarBorder no WhatsApp; CoolMode no botão com emoji temático (🍰); GridMotion para a galeria de doces com as fotos reais; GlassSurface em cartões sobre foto.
- **Festas, eventos, infantil:** SlicedWaves ou AeroShards (cores vivas) no fechamento; GridMotion; StarBorder.
- **Restaurante, bar, café:** LightRays quente ou Grainient escuro; OptionWheel para categorias do cardápio.
- **Barbearia, tatuagem, estúdio, academia:** Dither (personalidade) ou MicroSlats; StarBorder.
- **Advocacia, contabilidade, clínica, consultório:** Waves (linhas finas) com cor discreta; GlassSurface no topo; sem StarBorder chamativo.
- **Salão, estética, spa, bem-estar:** LightRays suave ou Grainient claro (`lightMode`); GlassSurface.
- **Marcenaria, arquitetura, construção, serviços:** MicroSlats; GridMotion com obras; OptionWheel para serviços.
- **Tech, gamer, estúdio criativo, portfólio, agência:** Crosshair (opcional, só computador) junto de Dither/MicroSlats; RetroGrid (exceção de nicho, sem 3D no hero) para gamer/retrô; InteractiveGrid como fundo sutil; Iphone para mostrar app/site; VideoText em título de marca.
- **Nicho (nunca por padrão):** Cubes e AcidSquares (fundo, tech/estúdio/moda/noite), RetroGrid (gamer/retrô), TechText (logotipo/título de marca de estúdio/tech/portfólio), DodgeField (só easter egg lúdico, nunca em CTA real).
- **Qualquer ramo (texto):** MaskedHeading em UM título de seção com foto/vídeo do cliente; AuroraText em UMA palavra do título abaixo do hero; TextHighlighter em 1-3 palavras-chave (preço, diferencial); VideoText só em título de seção com vídeo do Higgsfield do cliente.
- **Loja/e-commerce simples:** nenhum fundo animado; GridMotion no destaque de produtos; StarBorder só no CTA.
Padrão se o briefing não indicar: Grainient na paleta da marca + StarBorder no CTA principal.

---

## 25. MotionReel (`motion-reel.js`) — peça de motion design, não efeito de fundo
Reel de 14,4 s em palco 1920x1080 com sete cenas (retícula pseudo-3D, curl noise, filotaxia, gráfico SVG, superfórmula, metaballs, tipografia) e transições (light leak, flash, disco). Função pura do tempo: `seek(t)`.
- **Quando usar:** quando o negócio precisa de uma peça que *explique* (etapas do serviço, números, promessa) e não só decore. Serviços com processo claro (marcenaria, clínica, agência, buffet com etapas), negócios que querem "cara de marca grande".
- **Quando NÃO usar:** sites muito curtos (menos de 5 seções), negócios cujos números não podem ser divulgados, e nunca no hero.
- **Props principais:** `data-titulo`, `data-subtitulo`, `data-rotulos` (6, separados por `|`), `data-numeros` (3), `data-numeros-rotulos` (3), `data-manchete`, `data-assinatura`, `data-duration`, `data-scroll`, `data-accent`/`data-ink`/`data-paper`/`data-muted`, `data-quality`, `data-debug`.
- **Regras completas:** `padrao-sites.md` seção 11. Conta como a peça de destaque da seção e substitui o efeito de fundo ali.


---

## 26. Expansão para 100+ efeitos (10/11/2026)
Total no kit: **25 originais + 82 novos + swarm-build + ink-viewer = 109**. Os 82 novos ficam em `kit-efeitos/` (mesmo padrão: um arquivo, zero dependências, atributo `data-*` ou `Helu*.create(el, opts)`, desliga com `prefers-reduced-motion`). São versões **equivalentes** dos componentes do React Bits (mesmas props principais e visual geral, código reescrito em JS puro: Canvas 2D, CSS/DOM e WebGL1 com fallback). Os 6 efeitos "Pro" pedidos (pixel-sculpt, dappled-light, globe, rising-ink, wave-lettering, magic-transform) são **criações próprias** feitas a partir das descrições, não o código licenciado do React Bits Pro. Demo de todos: `catalogo-demo-100.html`.

Regras de uso (valem as da seção 10 do padrao-sites.md): um fundo animado por site; efeitos de cursor só em desktop (já desligam em toque); WebGL (aurora, plasma, iridescence, dark-veil, liquid-chrome, silk, dappled-light, lightning, orb, topography, ripple-grid, gradient-blinds, line-waves, grid-scan, evil-eye, light-pillar, meta-balls) é o mais pesado, nunca mais de um por tela.

**Extras fora da tabela:** `swarm-build.js` (enxame de cursores que reconstrói a página ao vivo; `SwarmBuild.toggle()`, atalho Alt+Shift+S, só para demonstração/vídeo, nunca em site de cliente) e `ink-viewer/ink-model-viewer.html` (visualizador 3D preto e branco estilo ficha técnica, usa three.js e KaTeX da pasta `vendor/`; edite o bloco `viewer-config` com o `.glb` do cliente, o modelo de exemplo não veio no arquivo).

| Efeito | Arquivo | Atributo / API | Tipo | Uso |
|---|---|---|---|---|
| PixelSculpt | pixel-sculpt.js | `data-pixel-sculpt` / `HeluPixelSculpt` | imagem | <div data-pixel-sculpt data-src="foto.jpg" data-tile="18" style="height:420px"></div> (props: src ou <img> filho, tile=18 px, strength=1, radius=160, color-lift=0.35) |
| Dappled | dappled-light.js | `data-dappled-light` / `HeluDappled` | fundo | <section data-dappled-light data-colors='["#e9dcc3","#fff4c9"]' style="height:480px">…conteúdo…</section> (props: colors=[parede, luz], speed=1, scale=1, softness=0.12) |
| Globe | globe.js | `data-globe` / `HeluGlobe` | 3D | <div data-globe style="width:480px;height:480px"></div> (props: color=#7dd3fc, arc-color=#fbbf24, dots=1400, arcs=6, speed=1, drag=true) |
| RisingInk | rising-ink.js | `data-rising-ink` / `HeluRisingInk` | texto | <h1 data-rising-ink data-lift="60" data-radius="140">Texto que levanta</h1> (props: lift=60 px, radius=140, tilt=35 graus, shadow=true) |
| WaveLettering | wave-lettering.js | `data-wave-lettering` / `HeluWaveLettering` | texto | <div data-wave-lettering data-text="Feito à mão" data-lines="9" style="font-size:42px"></div> (props: text, lines=9, amplitude=22 px, blur=6 px, speed=1) |
| MagicTransform | magic-transform.js | `data-magic-transform` / `HeluMagicTransform` | animação | <div data-magic-transform data-colors='["#a78bfa","#34d399","#fbbf24","#f472b6"]' data-label="IA" style="height:260px"></div> (props: colors, label=✦, rate=1.2 docs/s, speed=1) |
| BlurText | blur-text.js | `data-blur-text` / `HeluBlurText` | texto | <h2 data-blur-text data-by="words" data-delay="120">Texto que entra desfocado</h2> (props: by=words/chars, delay=120 ms, direction=top/bottom, duration=700 ms) |
| GradientText | gradient-text.js | `data-gradient-text` / `HeluGradientText` | texto | <h1 data-gradient-text data-colors='["#40ffaa","#4079ff","#40ffaa"]'>Título</h1> (props: colors, speed=6 s, direction=horizontal/vertical/diagonal, pingpong=true) |
| ShinyText | shiny-text.js | `data-shiny-text` / `HeluShinyText` | texto | <span data-shiny-text data-color="#b5b5b5" data-shine="#ffffff" data-speed="3">Carregando</span> (props: color, shine, speed=3 s, spread=120 graus, pause-on-hover) |
| SplitText | split-text.js | `data-split-text` / `HeluSplitText` | texto | <h1 data-split-text data-by="chars" data-delay="40">Olá mundo</h1> (props: by=chars/words, delay=40 ms, from-y=40 px, duration=900 ms, rotate=0) |
| Decrypted | decrypted-text.js | `data-decrypted-text` / `HeluDecrypted` | texto | <p data-decrypted-text data-trigger="view" data-speed="40">Mensagem secreta</p> (props: speed=40 ms, trigger=view/hover/load, characters, sequential=true, loops) |
| Scrambled | scrambled-text.js | `data-scrambled-text` / `HeluScrambled` | texto | <p data-scrambled-text data-radius="100">Passe o mouse nas letras</p> (props: radius=100 px, duration=1.2 s, speed=0.5, chars) |
| TextType | text-type.js | `data-text-type` / `HeluTextType` | texto | <span data-text-type data-texts='["Sites rápidos","Sites bonitos"]' data-speed="60"></span> (props: texts, speed=60 ms, delete-speed=35, pause=1600 ms, loop=true, cursor=/) |
| CountUp | count-up.js | `data-count-up` / `HeluCountUp` | número | <span data-count-up data-to="1500" data-duration="2" data-separator=".">0</span> (props: from=0, to, duration=2 s, separator, decimals=0, prefix, suffix) |
| RotatingText | rotating-text.js | `data-rotating-text` / `HeluRotatingText` | texto | <span data-rotating-text data-texts='["bonito","rápido","seu"]' data-interval="2200"></span> (props: texts, interval=2200 ms, duration=500 ms) |
| GlitchText | glitch-text.js | `data-glitch-text` / `HeluGlitchText` | texto | <h1 data-glitch-text data-speed="0.5">GLITCH</h1> (props: speed=0.5, shadows=true, colors=#ff00c8/#00fff9, on-hover=false) |
| TrueFocus | true-focus.js | `data-true-focus` / `HeluTrueFocus` | texto | <h2 data-true-focus data-interval="1500" data-blur="5" data-border="#00ff88">True Focus Effect</h2> (props: interval=1500 ms, blur=5 px, border=#00ff88, hover=false) |
| ScrollReveal | scroll-reveal.js | `data-scroll-reveal` / `HeluScrollReveal` | texto | <p data-scroll-reveal data-blur="4" data-base-opacity="0.1">Parágrafo que se revela palavra a palavra ao rolar</p> (props: base-opacity=0.1, blur=4 px, rotation=3 graus) |
| ScrollFloat | scroll-float.js | `data-scroll-float` / `HeluScrollFloat` | texto | <h2 data-scroll-float>Letras que flutuam</h2> (props: stagger=0.03, scale-y=2.3, distance=120 %) |
| ScrollVelocity | scroll-velocity.js | `data-scroll-velocity` / `HeluScrollVelocity` | texto | <div data-scroll-velocity data-text="HEsites • " data-velocity="60" style="font-size:64px"></div> (props: text, velocity=60 px/s, copies=6; acelera ao rolar, inverte ao rolar para cima) |
| Shuffle | shuffle.js | `data-shuffle` / `HeluShuffle` | texto | <h2 data-shuffle data-duration="0.35" data-shuffle-times="1">Shuffle</h2> (props: duration=0.35 s, shuffle-times=1, stagger=0.03, trigger=view/hover) |
| SplitFlap | split-flap-text.js | `data-split-flap` / `HeluSplitFlap` | texto | <div data-split-flap data-text="HEsites" data-interval="70"></div> (props: text, interval=70 ms, charset=ABC…0-9, delay=0, color=#111, bg=#f5f5f5) |
| StrokeText | stroke-text.js | `data-stroke-text` / `HeluStrokeText` | texto | <h1 data-stroke-text data-stroke="#fff" data-width="2" data-fill="#fff">CONTORNO</h1> (props: stroke=currentColor, width=2 px, fill=#fff, mode=hover/scroll/none) |
| TextPressure | text-pressure.js | `data-text-pressure` / `HeluTextPressure` | texto | <h1 data-text-pressure data-min-weight="200" data-max-weight="900" style="font-family:'Roboto Flex',sans-serif">Pressão</h1> (props: min-weight=200, max-weight=900, width=true, italic=false; usa fonte variável se houver, senão font-weight) |
| VarProx | variable-proximity.js | `data-variable-proximity` / `HeluVarProx` | texto | <p data-variable-proximity data-from="400" data-to="900" data-radius="110">Proximidade variável</p> (props: from=400, to=900, radius=110 px, falloff=linear/exponential/gaussian) |
| CircularText | circular-text.js | `data-circular-text` / `HeluCircularText` | texto | <div data-circular-text data-text="HEsites * CRIAÇÃO DE SITES * " data-spin="12" style="width:180px;height:180px;font-size:16px"></div> (props: text, spin=12 s, on-hover=pause/speedup/slowdown/goBonkers) |
| CurvedLoop | curved-loop.js | `data-curved-loop` / `HeluCurvedLoop` | texto | <div data-curved-loop data-text="HEsites ✦ " data-curve="120" data-speed="2" style="font-size:48px"></div> (props: text, speed=2, curve=120 px, direction=left/right, interactive=true) |
| EchoText | echo-text.js | `data-echo-text` / `HeluEchoText` | texto | <h1 data-echo-text data-layers="6" data-offset="8">ECO</h1> (props: layers=6, offset=8 px, color=currentColor, mode=hover/loop) |
| Aurora2 | aurora.js | `data-aurora` / `HeluAurora2` | fundo | <section data-aurora data-colors='["#5227FF","#7cff67","#5227FF"]' style="height:480px">…</section> (props: colors=3 cores, amplitude=1, blend=0.5, speed=1) |
| Plasma | plasma.js | `data-plasma` / `HeluPlasma` | fundo | <section data-plasma data-color="#ff6b35" style="height:480px"></section> (props: color=#ff6b35, speed=1, scale=1, opacity=0.8, mouse-interactive=true) |
| Iridescence | iridescence.js | `data-iridescence` / `HeluIridescence` | fundo | <section data-iridescence data-color="#7fb6ff" style="height:480px"></section> (props: color, speed=1, amplitude=0.1, mouse-react=true) |
| DarkVeil | dark-veil.js | `data-dark-veil` / `HeluDarkVeil` | fundo | <section data-dark-veil data-hue="220" style="height:480px"></section> (props: hue=220 graus, noise=0.04, scan=0.15, speed=1, warp=0.6) |
| LiquidChrome | liquid-chrome.js | `data-liquid-chrome` / `HeluLiquidChrome` | fundo | <section data-liquid-chrome data-base-color="#202228" style="height:480px"></section> (props: base-color, speed=0.2, amplitude=0.5, frequency=3, interactive=true) |
| Silk | silk.js | `data-silk` / `HeluSilk` | fundo | <section data-silk data-color="#7B7481" style="height:480px"></section> (props: color=#7B7481, speed=5, scale=1, noise=1.5, rotation=0) |
| Galaxy | galaxy.js | `data-galaxy` / `HeluGalaxy` | fundo | <section data-galaxy data-density="1" style="height:480px"></section> (props: density=1, speed=1, star-speed=0.5, twinkle=0.7, hue=240, mouse-repulsion=true) |
| Particles | particles.js | `data-particles` / `HeluParticles` | fundo | <section data-particles data-colors='["#ffffff"]' data-count="120" style="height:480px"></section> (props: count=120, colors, size=3, speed=0.3, hover=true, link=0) |
| LetterGlitch | letter-glitch.js | `data-letter-glitch` / `HeluLetterGlitch` | fundo | <section data-letter-glitch data-colors='["#2b4539","#61dca3","#61b3dc"]' style="height:480px"></section> (props: colors, speed=50 ms, smooth=true, characters, size=16) |
| DotGrid | dot-grid.js | `data-dot-grid` / `HeluDotGrid` | fundo | <section data-dot-grid data-base="#5227FF" data-active="#c9b8ff" style="height:480px"></section> (props: dot-size=5, gap=24, base=#5227FF, active=#ffffff, proximity=130, shock=true) |
| Lightning | lightning.js | `data-lightning` / `HeluLightning` | fundo | <section data-lightning data-hue="230" style="height:480px"></section> (props: hue=230, x-offset=0, speed=1, intensity=1, size=1) |
| Orb | orb.js | `data-orb` / `HeluOrb` | fundo | <div data-orb data-hue="260" style="width:420px;height:420px"></div> (props: hue=260, hover-intensity=0.4, rotate-on-hover=true, force-hover=false) |
| Hyperspeed | hyperspeed.js | `data-hyperspeed` / `HeluHyperspeed` | fundo | <section data-hyperspeed data-colors='["#03b3c3","#d856bf","#e5e5e5"]' style="height:480px"></section> (props: colors, count=220, speed=1; segurar o clique acelera) |
| Radar | radar.js | `data-radar` / `HeluRadar` | fundo | <div data-radar data-color="#9f29ff" style="width:420px;height:420px"></div> (props: color=#9f29ff, rings=5, speed=1, dots=8) |
| Threads | threads.js | `data-threads` / `HeluThreads` | fundo | <section data-threads data-color="#ffffff" data-lines="18" style="height:480px"></section> (props: color, lines=18, amplitude=1, distance=0, mouse=true) |
| Topography | topography.js | `data-topography` / `HeluTopography` | fundo | <section data-topography data-color="#7dd3a8" style="height:480px"></section> (props: color, lines=14, scale=1.4, speed=1) |
| PixelSnow | pixel-snow.js | `data-pixel-snow` / `HeluPixelSnow` | fundo | <section data-pixel-snow data-color="#ffffff" style="height:480px"></section> (props: color, flakes=140, size=3, speed=1, direction=125 graus) |
| RippleGrid | ripple-grid.js | `data-ripple-grid` / `HeluRippleGrid` | fundo | <section data-ripple-grid data-color="#5227FF" style="height:480px"></section> (props: color, grid-size=10, ripple-intensity=0.05, speed=1, mouse-interaction=true) |
| ShapeGrid | shape-grid.js | `data-shape-grid` / `HeluShapeGrid` | fundo | <section data-shape-grid data-shape="square" data-size="40" data-border="#333" data-hover="#222" style="height:480px"></section> (props: shape=square/hexagon/circle/triangle, size=40, border=#333, hover=#222, speed=0.5) |
| GradientBlinds | gradient-blinds.js | `data-gradient-blinds` / `HeluGradientBlinds` | fundo | <section data-gradient-blinds data-colors='["#FF9FFC","#5227FF"]' data-blinds="16" style="height:480px"></section> (props: colors, blinds=16, angle=0, spotlight=true, noise=0.3) |
| FloatingLines | floating-lines.js | `data-floating-lines` / `HeluFloatingLines` | fundo | <section data-floating-lines data-colors='["#e945ff","#2f4ba2"]' data-lines="6" style="height:480px"></section> (props: colors, lines=6, amplitude=1, parallax=true, speed=1) |
| LineWaves | line-waves.js | `data-line-waves` / `HeluLineWaves` | fundo | <section data-line-waves data-color="#ffffff" data-lines="30" style="height:480px"></section> (props: color, lines=30, warp=0.6, speed=1, mouse-influence=true) |
| GridScan | grid-scan.js | `data-grid-scan` / `HeluGridScan` | fundo | <section data-grid-scan data-color="#7c5cff" style="height:480px"></section> (props: color, grid=24, speed=1, line=2) |
| MagicRings | magic-rings.js | `data-magic-rings` / `HeluMagicRings` | fundo | <div data-magic-rings data-colors='["#fc42ff","#42fcff"]' style="width:420px;height:420px"></div> (props: colors, rings=6, speed=1, thickness=2) |
| EvilEye | evil-eye.js | `data-evil-eye` / `HeluEvilEye` | fundo | <div data-evil-eye data-color="#ff6f37" style="width:420px;height:420px"></div> (props: color=#ff6f37, iris=#12071f, pupil=0.25; a íris segue o cursor) |
| Beams | beams.js | `data-beams` / `HeluBeams` | fundo | <section data-beams data-color="#ffffff" data-count="12" style="height:480px"></section> (props: color, count=12, angle=25, speed=1, blur=true) |
| LightPillar | light-pillar.js | `data-light-pillar` / `HeluLightPillar` | fundo | <section data-light-pillar data-top="#5227FF" data-bottom="#FF9FFC" style="height:480px"></section> (props: top, bottom, intensity=1, width=1, speed=1) |
| Noise | noise.js | `data-noise` / `HeluNoise` | overlay | <div data-noise data-alpha="14" data-fps="10" style="position:absolute;inset:0"></div> (props: alpha=14 (0-255), size=160, fps=10; ruído de filme sobre qualquer bloco) |
| Animated | animated-content.js | `data-animated-content` / `HeluAnimated` | entrada | <div data-animated-content data-direction="vertical" data-distance="80" data-duration="0.9">…</div> (props: direction=vertical/horizontal, reverse=false, distance=80 px, duration=0.9 s, delay=0, scale=1, blur=false, threshold=0.15) |
| Fade | fade-content.js | `data-fade-content` / `HeluFade` | entrada | <div data-fade-content data-blur="true" data-duration="1">…</div> (props: blur=false, duration=1 s, delay=0, threshold=0.1, initial-opacity=0) |
| ClickSpark | click-spark.js | `data-click-spark` / `HeluClickSpark` | interação | <section data-click-spark data-color="#fff" data-count="8">…</section> (props: color=#fff, count=8, size=10 px, radius=15 px, duration=400 ms, extra-scale=1) |
| Glare | glare-hover.js | `data-glare-hover` / `HeluGlare` | card | <div data-glare-hover data-color="#fff" data-opacity="0.35" style="border-radius:16px">…</div> (props: color=#fff, opacity=0.3, angle=-45, size=250 %, duration=800 ms) |
| Magnet | magnet.js | `data-magnet` / `HeluMagnet` | interação | <button data-magnet data-padding="80" data-strength="3">Botão</button> (props: padding=80 px, strength=3 (maior = menos movimento), active-transition=0.3s; só desktop) |
| PixelTrail | pixel-trail.js | `data-pixel-trail` / `HeluPixelTrail` | cursor | <section data-pixel-trail data-color="#5227FF" data-size="28" style="height:420px"></section> (props: color=#fff, size=28 px, fade=600 ms, gooey=false) |
| ImageTrail | image-trail.js | `data-image-trail` / `HeluImageTrail` | cursor | <section data-image-trail data-images='["a.jpg","b.jpg","c.jpg"]' style="height:420px"></section> (props: images (lista), size=120 px, distance=90 px, life=900 ms) |
| Electric | electric-border.js | `data-electric-border` / `HeluElectric` | borda | <div data-electric-border data-color="#7df9ff" data-chaos="0.12" style="border-radius:20px">…</div> (props: color=#7df9ff, speed=1, chaos=0.12, thickness=2, radius=20) |
| TargetCursor | target-cursor.js | `data-target-cursor` / `HeluTargetCursor` | cursor | <section data-target-cursor data-target-selector=".cta, a, button" style="cursor:none">…</section> (props: target-selector=a,button, color=#fff, size=22 px, hide-default=true; só desktop) |
| BlobCursor | blob-cursor.js | `data-blob-cursor` / `HeluBlobCursor` | cursor | <section data-blob-cursor data-color="#5227FF" data-count="3" style="cursor:none">…</section> (props: color=#5227FF, count=3, size=60 px; só desktop) |
| GradualBlur | gradual-blur.js | `data-gradual-blur` / `HeluGradualBlur` | overlay | <section data-gradual-blur data-position="bottom" data-height="7rem" data-strength="2">…</section> (props: position=bottom/top/left/right, height=6rem, strength=2, layers=8) |
| LogoLoop | logo-loop.js | `data-logo-loop` / `HeluLogoLoop` | marquee | <div data-logo-loop data-speed="80" data-gap="48"><img src="a.svg"><img src="b.svg"></div> (props: speed=80 px/s, gap=48 px, direction=left/right, pause-on-hover=true, fade=true) |
| MetaBalls | meta-balls.js | `data-meta-balls` / `HeluMetaBalls` | fundo | <div data-meta-balls data-color="#ffffff" data-count="8" style="height:420px"></div> (props: color=#fff, count=8, speed=1, size=1, cursor-ball=true) |
| SpotlightCard | spotlight-card.js | `data-spotlight-card` / `HeluSpotlightCard` | card | <div data-spotlight-card data-color="rgba(255,255,255,.25)" style="border-radius:16px;padding:24px;background:#111">…</div> (props: color=rgba(255,255,255,.25), size=300 px) |
| TiltedCard | tilted-card.js | `data-tilted-card` / `HeluTiltedCard` | card | <div data-tilted-card data-rotate="14" data-scale="1.06"><img src="foto.jpg"></div> (props: rotate=14 graus, scale=1.06, caption) |
| Dock | dock.js | `data-dock` / `HeluDock` | menu | <div data-dock data-base="48" data-max="80"><button>A</button><button>B</button></div> (props: base=48 px, max=80 px, distance=140 px; filhos viram itens que crescem perto do cursor) |
| PixelCard | pixel-card.js | `data-pixel-card` / `HeluPixelCard` | card | <div data-pixel-card data-colors='["#f8fafc","#f1f5f9","#cbd5e1"]' style="height:260px;border-radius:16px">…</div> (props: colors, gap=6 px, speed=35) |
| BorderGlow | border-glow.js | `data-border-glow` / `HeluBorderGlow` | card | <div data-border-glow data-color="#a78bfa" style="border-radius:20px;padding:24px;background:#111">…</div> (props: color=#a78bfa, width=2 px, size=260 px) |
| HoloCard | holo-card.js | `data-holo-card` / `HeluHoloCard` | card | <div data-holo-card style="width:260px;height:360px;border-radius:18px;background:#111">…</div> (props: tilt=14 graus, intensity=0.55, glare=true) |
| ElasticSlider | elastic-slider.js | `data-elastic-slider` / `HeluElasticSlider` | controle | <div data-elastic-slider data-min="0" data-max="100" data-value="50" style="width:300px"></div> (props: min=0, max=100, value=50, step=1; dispara o evento "helu-slide" com detail.value; a barra estica ao passar dos limites) |
| ChromaGrid | chroma-grid.js | `data-chroma-grid` / `HeluChromaGrid` | galeria | <div data-chroma-grid data-radius="260" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"><div>…</div>…</div> (props: radius=260 px, damping=0.45; as fotos ficam em P&B e ganham cor perto do cursor) |
| Stack | stack.js | `data-stack` / `HeluStack` | cartas | <div data-stack style="width:260px;height:340px"><img src="a.jpg"><img src="b.jpg"><img src="c.jpg"></div> (props: rotation=6 graus, sensitivity=120 px, auto=0 ms; arraste a carta de cima para mandá-la ao fundo) |
| FlipCard | flip-card.js | `data-flip-card` / `HeluFlipCard` | card | <div data-flip-card style="width:240px;height:320px"><div>frente</div><div>verso</div></div> (props: trigger=hover/click, axis=y/x, duration=700 ms; 1º filho = frente, 2º = verso) |
| HoldButton | hold-button.js | `data-hold-button` / `HeluHoldButton` | botão | <button data-hold-button data-duration="1200">Segure para confirmar</button> (props: duration=1200 ms, color=rgba(255,255,255,.3); dispara "helu-hold" ao completar) |
| SquishSwitch | squish-switch.js | `data-squish-switch` / `HeluSquishSwitch` | controle | <div data-squish-switch data-on="false" data-color="#34c759"></div> (props: on=false, color=#34c759, width=64 px; dispara "helu-toggle" com detail.on) |
| SpringCheck | spring-check.js | `data-spring-check` / `HeluSpringCheck` | controle | <div data-spring-check data-checked="false" data-color="#7c5cff"></div> (props: checked=false, color=#7c5cff, size=32 px; dispara "helu-check" com detail.checked) |
