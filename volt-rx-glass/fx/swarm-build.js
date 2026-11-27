
/*!
 * swarm-build.js — um enxame de cursores de agentes redesenha a sua página ao vivo.
 * Réplica do efeito "Swarm Rebuild" (extensão do Chrome de Dhvanil Patel, por sua vez
 * uma homenagem ao "Swarm" de Joel Califa). Implementação própria, sem dependências.
 *
 * Uso:
 *   <script src="swarm-build.js"><\/script>
 *   SwarmBuild.toggle()            // liga/desliga
 *   SwarmBuild.start({ sound:true, speed:1, tour:false, root:document.body })
 *
 * Atalhos: Alt+Shift+S liga/desliga · Esc sai · M muda o som
 */
(function () {
  "use strict";
  var KEY = "__swarmBuild";
  if (window[KEY]) { window[KEY]._loaded = true; return; }

  /* ───────────────────────────── constantes ───────────────────────────── */

  // Paleta de cursores (mesma família de cores do efeito original: cores de
  // multiplayer de ferramenta de design).
  var COLORS = [
    "#F24E1E", "#A259FF", "#1ABCFE", "#0ACF83", "#FF7262", "#FFC700",
    "#9747FF", "#E8467C", "#14AE5C", "#0D99FF", "#FF8A00", "#00B5CE"
  ];
  var NAMES = [
    "Ada", "Linus", "Grace", "Alan", "Margaret", "Ken", "Barbara", "Dennis",
    "Radia", "Guido", "Frances", "Bjarne", "Hedy", "Tim", "Katherine", "Edsger",
    "Joan", "Donald", "Sophie", "Niklaus", "Anita", "Brian", "Mary", "Rob",
    "Ida", "Yukihiro", "Shafi", "Leslie", "Jean", "Vint", "Lynn", "Bram"
  ];

  var BLUE = "#0D99FF";       // seleção, alças, badge de medida
  var RED = "#F24822";        // guias e medidas de espaçamento
  var PH = "#D9D9D9";         // cinza do placeholder
  var MIN_AGENTS = 6, MAX_AGENTS = 24, INTRO_AGENTS = 14, FLOCK_AGENTS = 36;
  var MAX_ITEMS = 4000, MAX_WORLD_H = 40000;
  var RULER = 20;

  /* ───────────────────────────── utilidades ───────────────────────────── */

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[(Math.random() * a.length) | 0]; };
  var f1 = function (n) { return Math.round(n * 10) / 10; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  function alpha(c) {
    if (!c) return 0;
    var m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return c === "transparent" ? 0 : 1;
    var p = m[1].split(",");
    return p.length > 3 ? parseFloat(p[3]) : 1;
  }

  /* ──────────────────────────── cursores SVG ──────────────────────────── */

  // Ponta de seta clássica, com contorno branco (como num editor de design).
  var ARROW_D = "M1.5 1.2 L1.5 17.6 L5.9 13.6 L8.6 19.6 L11.4 18.3 L8.7 12.4 L14.4 12.0 Z";
  var K = 22 / 26; // o SVG é desenhado em 26 e exibido em 22
  var HOT = {
    arrow: [1.5 * K, 1.2 * K], dup: [1.5 * K, 1.2 * K], pen: [3 * K, 3 * K], "pen-add": [3 * K, 3 * K],
    cross: [12 * K, 12 * K], ibeam: [12 * K, 12 * K], ew: [12 * K, 12 * K], ns: [12 * K, 12 * K]
  };

  function cursorSVG(shape, c) {
    var head = '<svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">';
    var arrow = '<path d="' + ARROW_D + '" fill="' + c + '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>';
    if (shape === "arrow") return head + arrow + "</svg>";
    if (shape === "dup")
      return head +
        '<g transform="translate(5 4.5)" opacity=".9"><path d="' + ARROW_D + '" fill="#fff" stroke="' + c + '" stroke-width="1.3" stroke-linejoin="round"/></g>' +
        arrow + "</svg>";
    if (shape === "pen" || shape === "pen-add")
      return head +
        '<path d="M2.2 2.2 L10.6 5.4 L5.4 10.6 Z" fill="' + c + '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M5.4 10.6 L2.2 2.2" stroke="#fff" stroke-width="1.5"/>' +
        (shape === "pen-add"
          ? '<g><path d="M14 9 v7 M10.5 12.5 h7" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>' +
            '<path d="M14 9 v7 M10.5 12.5 h7" stroke="#1E1E1E" stroke-width="1.3" stroke-linecap="round"/></g>'
          : "") + "</svg>";
    if (shape === "cross")
      return head +
        '<g><path d="M12 4 v16 M4 12 h16" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M12 4 v16 M4 12 h16" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round"/></g></svg>';
    if (shape === "ibeam")
      return head +
        '<g><path d="M12 4 v16 M8.5 4 h7 M8.5 20 h7" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M12 4 v16 M8.5 4 h7 M8.5 20 h7" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round"/></g></svg>';
    var g = shape === "ns" ? ' transform="rotate(90 12 12)"' : "";
    return head + "<g" + g + '><path d="M4 12 h16 M7 9 l-3 3 3 3 M17 9 l3 3 -3 3" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M4 12 h16 M7 9 l-3 3 3 3 M17 9 l3 3 -3 3" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
  }

  var IMG_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>';

  /* ──────────────────────────────── CSS ───────────────────────────────── */

  var STYLE = [
    ':host{all:initial}',
    '*{box-sizing:border-box}',
    '.root{position:fixed;inset:0;z-index:2147483646;overflow:hidden;pointer-events:none;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;opacity:0;transition:opacity .4s ease}',
    '.root.on{opacity:1;pointer-events:auto}',
    '.bg{position:absolute;inset:0;background:#fff}',
    '.port{position:absolute;inset:0;overflow:hidden}',
    '.world{position:absolute;left:0;top:0;width:100%;height:100%;will-change:transform}',
    // itens
    '.it{position:absolute;opacity:0}',
    '.it.vis{opacity:1}',
    '.r{background:var(--ph,' + PH + ')}',
    '.r>.f{position:absolute;inset:0;opacity:0;transition:opacity .22s ease}',
    '.r.st{background-color:transparent}',
    '.r.st>.f{opacity:1}',
    '.m{background:var(--ph,' + PH + ');overflow:hidden}',
    '.m>.ph{position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;opacity:.7;transition:opacity .2s}',
    '.m>.ph svg{width:100%;height:100%;display:block}',
    '.m>.md{position:absolute;inset:0;width:100%;height:100%;opacity:0;clip-path:inset(0 0 100% 0);transition:opacity .35s ease,clip-path .6s cubic-bezier(.2,.75,.2,1)}',
    '.m.st{background-color:transparent;transition:background-color .3s ease .3s}',
    '.m.st>.ph{opacity:0}',
    '.m.st>.md{opacity:1;clip-path:inset(0 0 0 0)}',
    '.t{white-space:pre-wrap;overflow:hidden}',
    '.l{transition:none}',
    '.caret{display:inline-block;width:1.5px;height:1.05em;margin-left:1px;margin-right:-2.5px;vertical-align:text-bottom;background:currentColor;animation:blink 1s steps(1) infinite}',
    '@keyframes blink{50%{opacity:0}}',
    // overlays
    '.ov{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.badges,.cursors{position:absolute;inset:0;pointer-events:none;overflow:hidden}',
    '.badge{position:absolute;transform:translate(-50%);padding:1px 4px;border-radius:2px;color:#fff;font:600 11px/16px Inter,system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;font-variant-numeric:tabular-nums}',
    '.cursor{position:absolute;left:0;top:0;will-change:transform}',
    '.cursor svg{position:absolute;overflow:visible;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.28))}',
    '.cursor .tag{position:absolute;left:14px;top:18px;padding:2px 6px;border-radius:6px;color:#fff;font:600 10px/13px Inter,system-ui,sans-serif;white-space:nowrap;opacity:0;transition:opacity .2s}',
    '.cursor.show .tag{opacity:1}',
    // réguas
    '.rulers{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s ease}',
    '.rulers.on{opacity:1}',
    '.ruler-top{position:absolute;top:0;left:0;right:0;height:20px;background:#2c2c2c;border-bottom:1px solid #3a3a3a}',
    '.ruler-left{position:absolute;top:0;left:0;bottom:0;width:20px;background:#2c2c2c;border-right:1px solid #3a3a3a}',
    '.ruler-corner{position:absolute;top:0;left:0;width:20px;height:20px;background:#2c2c2c;z-index:2}',
    '.rulers svg{display:block;overflow:visible}',
    '.rtext{font:500 9px Inter,system-ui,-apple-system,sans-serif;fill:#8c8c8c}',
    '.rsel{fill:#0d99ff}',
    // intro (favicon)
    '.intro{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.92);opacity:0;transition:opacity .35s ease,transform .45s cubic-bezier(.2,.8,.2,1);pointer-events:none}',
    '.intro.on{opacity:1;transform:translate(-50%,-50%)}',
    '.intro.gone{opacity:0;transform:translate(-50%,-50%) scale(.9)}',
    '.intro img{display:block;width:60px;height:60px;object-fit:contain;filter:grayscale(1);opacity:.42;border-radius:14px}',
    '.intro .mono{width:60px;height:60px;border-radius:16px;background:#D7DADE;color:#fff;font:700 30px/60px Inter,system-ui,sans-serif;text-align:center}',
    // HUD
    '.hud{position:absolute;left:50%;bottom:20px;transform:translate(-50%,18px);opacity:0;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 10px;background:rgba(30,30,30,.94);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,255,255,.07);font:500 12px/1 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:auto;transition:opacity .45s ease,transform .45s cubic-bezier(.2,.8,.2,1);white-space:nowrap;user-select:none;z-index:5}',
    '.hud.on{opacity:1;transform:translate(-50%,0)}',
    '.hud .dots{display:flex;padding-left:5px}',
    '.hud .dots i{display:block;width:18px;height:18px;margin-left:-5px;border-radius:50%;border:2px solid #1e1e1e;font:700 9px/14px Inter,system-ui,sans-serif;font-style:normal;text-align:center;color:#fff;transition:background .3s}',
    '.hud .txt,.hud .status{display:flex;align-items:center;gap:7px;color:#cfcfcf;font-variant-numeric:tabular-nums}',
    '.hud .txt b{color:#fff;font-weight:600}',
    '.hud .sep{width:1px;height:12px;background:#444}',
    '.hud .bar{width:64px;height:3px;border-radius:2px;background:#3a3a3a;overflow:hidden}',
    '.hud .bar i{display:block;height:100%;width:0;background:' + BLUE + ';transition:width .35s ease}',
    '.hud button{all:unset;cursor:pointer;padding:7px 10px;border-radius:8px;background:transparent;color:#fff;font:500 12px/1 Inter,system-ui,-apple-system,sans-serif;transition:background .15s}',
    '.hud button:hover{background:#3a3a3a}',
    '.hud button.pri{background:' + BLUE + '}',
    '.hud button.pri:hover{background:#2aa6ff}',
    '.hud button.on{background:rgba(13,153,255,.22);color:#8fd0ff}',
    '.hud button[hidden]{display:none}',
    '.hud .x{padding:7px 9px;color:#aaa}',
    '.hud button.snd{display:flex;align-items:center;gap:6px;padding:6px 8px}',
    '.hud button.snd.off{color:#8a8a8a}',
    '.hud button.snd svg{display:block;width:15px;height:15px}'
  ].join("\n");

  var SND_ON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M19 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  var SND_OFF = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';

  /* ────────────────────────────── snapshot ────────────────────────────── */

  function snapshot(root) {
    var items = [], seq = 0;
    var docH = Math.min(document.documentElement.scrollHeight, MAX_WORLD_H);
    var SX = window.scrollX, SY = window.scrollY;

    function box(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + SX, y: r.top + SY, w: r.width, h: r.height };
    }

    function add(it) {
      if (items.length >= MAX_ITEMS) return null;
      it.id = seq++;
      it.done = false; it.vis = false; it.styled = false; it.claimed = false;
      items.push(it);
      return it;
    }

    // Junta os nos de texto do proprio elemento e mede com Range, para a caixa
    // cercar so o texto (e nao o elemento inteiro).
    var RANGE = document.createRange();
    function textRuns(el) {
      var txt = "", r = null;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType !== 3 || !n.nodeValue || !n.nodeValue.trim()) continue;
        txt += n.nodeValue;
        try {
          RANGE.selectNodeContents(n);
          var b = RANGE.getBoundingClientRect();
          if (b.width < 0.5 || b.height < 0.5) continue;
          r = r ? {
            l: Math.min(r.l, b.left), t: Math.min(r.t, b.top),
            r: Math.max(r.r, b.right), b: Math.max(r.b, b.bottom)
          } : { l: b.left, t: b.top, r: b.right, b: b.bottom };
        } catch (e) {}
      }
      txt = txt.replace(/\s+/g, " ").trim();
      if (!txt || !r) return null;
      return { text: txt, box: { x: r.l + SX, y: r.t + SY, w: Math.max(4, r.r - r.l), h: Math.max(4, r.b - r.t) } };
    }

    var TEXT_PROPS = ["fontStyle", "fontVariant", "fontWeight", "fontSize", "fontFamily", "lineHeight",
      "color", "letterSpacing", "wordSpacing", "textAlign", "textTransform", "textIndent",
      "textDecorationLine", "textDecorationColor", "textShadow", "whiteSpace", "wordBreak",
      "overflowWrap", "direction", "fontFeatureSettings", "textOverflow",
      "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];

    function styleSnap(cs) {
      var o = { px: parseFloat(cs.fontSize) || 14, lh: parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.3) };
      for (var i = 0; i < TEXT_PROPS.length; i++) o[TEXT_PROPS[i]] = cs[TEXT_PROPS[i]];
      return o;
    }

    // Menor retângulo de recorte imposto por um ancestral com overflow != visible.
    function clipOf(el) {
      var n = el.parentElement, c = null, guard = 0;
      while (n && n !== document.documentElement && guard++ < 24) {
        var s2;
        try { s2 = getComputedStyle(n); } catch (e) { break; }
        if (s2.overflow !== "visible" || s2.overflowX !== "visible" || s2.overflowY !== "visible") {
          var r = n.getBoundingClientRect();
          var b2 = { l: r.left + SX, t: r.top + SY, r: r.right + SX, b: r.bottom + SY };
          c = c ? { l: Math.max(c.l, b2.l), t: Math.max(c.t, b2.t), r: Math.min(c.r, b2.r), b: Math.min(c.b, b2.b) } : b2;
        }
        n = n.parentElement;
      }
      return c;
    }

    function walk(el, parent, depth) {
      if (!el || el.nodeType !== 1 || depth > 24) return;
      var tag = el.tagName;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|LINK|META|HEAD|BR)$/.test(tag)) return;
      if (el.hasAttribute && el.hasAttribute("data-swarm-ignore")) return;
      var cs;
      try { cs = getComputedStyle(el); } catch (e) { return; }
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return;
      var b = box(el);
      if (b.w < 1 || b.h < 1) return;
      if (b.y > docH || b.x > window.innerWidth + 2000 || b.x + b.w < -400) return;

      var sticky = cs.position === "fixed" || cs.position === "sticky";
      var me = parent;

      // mídia
      if (/^(IMG|SVG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(tag)) {
        var node = null;
        try {
          if (tag === "CANVAS") { node = new Image(); node.src = el.toDataURL(); }
          else if (tag === "VIDEO") {
            node = document.createElement("div");
            node.style.cssText = "width:100%;height:100%;background:#111";
            if (el.poster) node.style.background = "#111 url(" + el.poster + ") center/cover";
          } else if (tag === "IFRAME") {
            node = document.createElement("div");
            node.style.cssText = "width:100%;height:100%;background:#F1F2F4;color:#8A8F98;font:500 12px/1.2 system-ui,sans-serif;display:flex;align-items:center;justify-content:center";
            node.textContent = "embed";
          } else { node = el.cloneNode(true); }
          if (node.style) { node.style.width = "100%"; node.style.height = "100%"; }
        } catch (e) { node = null; }
        me = add({
          kind: "media", x: b.x, y: b.y, w: b.w, h: b.h, parent: parent, sticky: sticky,
          radius: cs.borderRadius, node: node, clip: clipOf(el), order: b.y * 10000 + b.x
        });
        return;
      }

      // caixa (fundo / borda / sombra)
      var hasBg = alpha(cs.backgroundColor) > 0.01 ||
        (cs.backgroundImage !== "none" && cs.backgroundImage !== "initial");
      var SIDES = ["Top", "Right", "Bottom", "Left"];
      var drawn = [];
      for (var bi = 0; bi < 4; bi++) {
        var sd = SIDES[bi];
        var wpx = parseFloat(cs["border" + sd + "Width"]) || 0;
        var stl = cs["border" + sd + "Style"];
        if (wpx > 0 && stl !== "none" && stl !== "hidden" && alpha(cs["border" + sd + "Color"]) > 0.02) drawn.push(sd);
      }
      var hasShadow = cs.boxShadow && cs.boxShadow !== "none";

      // Uma borda de um lado só não é uma caixa: é um traço. Arrastar um
      // retângulo inteiro por causa dela faz o cursor "desenhar no vazio".
      if (!hasBg && !hasShadow && drawn.length === 1 && b.w > 1 && b.h > 1) {
        var sd1 = drawn[0];
        var lw = Math.max(1, Math.min(3, parseFloat(cs["border" + sd1 + "Width"]) || 1));
        var horiz = sd1 === "Top" || sd1 === "Bottom";
        var ly = sd1 === "Bottom" ? b.y + b.h - lw : b.y;
        var lx = sd1 === "Right" ? b.x + b.w - lw : b.x;
        add({
          kind: "line", parent: parent, sticky: sticky,
          x: lx, y: ly, w: horiz ? b.w : lw, h: horiz ? lw : b.h,
          horiz: horiz, color: cs["border" + sd1 + "Color"], style: cs["border" + sd1 + "Style"],
          lw: lw, clip: clipOf(el), order: ly * 10000 + lx
        });
        // o elemento continua sendo pai dos filhos, mas o "pai visual" é o
        // mesmo de antes (uma linha não contém nada)
      } else if (hasBg || drawn.length || hasShadow) {
        var fill = document.createElement("div");
        fill.style.cssText =
          "background:" + cs.background + ";border-radius:" + cs.borderRadius +
          ";box-shadow:" + (hasShadow ? cs.boxShadow : "none") +
          ";border-top:" + cs.borderTopWidth + " " + cs.borderTopStyle + " " + cs.borderTopColor +
          ";border-right:" + cs.borderRightWidth + " " + cs.borderRightStyle + " " + cs.borderRightColor +
          ";border-bottom:" + cs.borderBottomWidth + " " + cs.borderBottomStyle + " " + cs.borderBottomColor +
          ";border-left:" + cs.borderLeftWidth + " " + cs.borderLeftStyle + " " + cs.borderLeftColor;
        me = add({
          kind: "rect", x: b.x, y: b.y, w: b.w, h: b.h, parent: parent, sticky: sticky,
          radius: cs.borderRadius, fill: fill, big: b.w * b.h > innerWidth * innerHeight * 0.4,
          clip: clipOf(el), order: b.y * 10000 + b.x
        }) || parent;
      }

      // texto próprio: a caixa do elemento define a quebra de linha, e o
      // retângulo justo do texto define a seleção e o badge.
      var run = textRuns(el);
      if (run) {
        var rr2 = el.getBoundingClientRect();
        var bl = parseFloat(cs.borderLeftWidth) || 0, bt2 = parseFloat(cs.borderTopWidth) || 0;
        var cw = el.clientWidth || rr2.width, chh = el.clientHeight || rr2.height;
        var ix = rr2.left + SX + bl, iy = rr2.top + SY + bt2;
        var st2 = styleSnap(cs);
        // se o texto começa depois do início da caixa (ícone, marcador ou
        // irmão inline antes dele), empurra com padding para cair no lugar
        var padL = parseFloat(cs.paddingLeft) || 0;
        var offL = run.box.x - (ix + padL);
        if (offL > 0.5 && cs.textAlign !== "center" && cs.textAlign !== "right") st2.paddingLeft = (padL + offL) + "px";
        var padT = parseFloat(cs.paddingTop) || 0;
        var offT = run.box.y - (iy + padT);
        if (offT > 1 && chh - run.box.h > 1) st2.paddingTop = (padT + offT) + "px";
        add({
          kind: "text", parent: me, sticky: sticky,
          x: ix, y: iy, w: cw, h: chh,
          tight: run.box, text: run.text, st: st2, tag: el.tagName,
          clip: clipOf(el), order: run.box.y * 10000 + run.box.x
        });
      }

      var kids = el.children, prev = null, prevFirst = -1, dupRun = 0;
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i], before = items.length;
        walk(k, me, depth + 1);
        var mine = items.length > before ? items[before] : null;
        // irmão igual em tag, classe e tamanho vira duplicata do primeiro da série
        if (prev && mine && prevFirst >= 0 && k.tagName === prev.tagName && k.className === prev.className) {
          var ra = k.getBoundingClientRect(), rb2 = prev.getBoundingClientRect();
          var src = items[prevFirst];
          if (Math.abs(ra.width - rb2.width) < 2 && Math.abs(ra.height - rb2.height) < 2 &&
              src && src.kind === mine.kind && (src.kind === "rect" || src.kind === "media") &&
              src.w >= 40 && src.h >= 16 &&
              Math.abs(src.w - mine.w) < 2 && Math.abs(src.h - mine.h) < 2) {
            dupRun++;
            if (dupRun <= 10) mine.master = src;
          } else dupRun = 0;
        } else dupRun = 0;
        if (mine) prevFirst = before;
        prev = k;
      }
    }

    walk(root || document.body, null, 0);
    items.sort(function (a, b) { return a.order - b.order || a.id - b.id; });
    // reindexa dependências de pai
    items.forEach(function (it, i) { it.ix = i; });
    return { items: items, docH: docH, bg: pageBackground() };
  }

  function pageBackground() {
    var b = getComputedStyle(document.body).backgroundColor;
    if (alpha(b) > 0.05) return b;
    var h = getComputedStyle(document.documentElement).backgroundColor;
    return alpha(h) > 0.05 ? h : "#ffffff";
  }

  /* ─────────────────────────────── áudio ──────────────────────────────── */

  function Sfx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.ok = false; return; }
    this.ok = true;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.on = true;
    // escala pentatônica de Mi maior
    this.scale = [164.81, 185.00, 207.65, 246.94, 277.18, 329.63, 369.99, 415.30, 493.88, 554.37, 659.25];
  }
  Sfx.prototype.pan = function (x, w) {
    var p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (p) p.pan.value = clamp((x / Math.max(1, w)) * 2 - 1, -1, 1) * 0.7;
    return p;
  };
  Sfx.prototype.out = function (node, x, w) {
    var p = this.pan(x, w);
    if (p) { node.connect(p); p.connect(this.master); } else node.connect(this.master);
  };
  Sfx.prototype.key = function (x, w, space) {
    if (!this.on || !this.ok) return;
    var c = this.ctx, t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = "square"; o.frequency.value = space ? rand(900, 1200) : rand(1700, 2400);
    f.type = "bandpass"; f.frequency.value = o.frequency.value; f.Q.value = 2;
    g.gain.setValueAtTime(space ? 0.035 : 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.028);
    o.connect(f); f.connect(g); this.out(g, x, w);
    o.start(t); o.stop(t + 0.04);
    // "thock" grave
    var o2 = c.createOscillator(), g2 = c.createGain();
    o2.type = "sine"; o2.frequency.value = space ? 110 : rand(150, 200);
    g2.gain.setValueAtTime(0.055, t); g2.gain.exponentialRampToValueAtTime(0.0008, t + 0.05);
    o2.connect(g2); this.out(g2, x, w); o2.start(t); o2.stop(t + 0.06);
  };
  Sfx.prototype.press = function (x, w) {
    if (!this.on || !this.ok) return;
    var c = this.ctx, t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.02);
    g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.03);
    o.connect(g); this.out(g, x, w); o.start(t); o.stop(t + 0.04);
  };
  Sfx.prototype.note = function (x, w, big) {
    if (!this.on || !this.ok) return;
    var c = this.ctx, t = c.currentTime;
    var ix = clamp(Math.round((x / Math.max(1, w)) * (this.scale.length - 1)), 0, this.scale.length - 1);
    if (big) ix = Math.max(0, ix - 4);
    var f = this.scale[ix] * (big ? 0.5 : 1);
    var o = c.createOscillator(), g = c.createGain(), o2 = c.createOscillator(), g2 = c.createGain();
    o.type = "sine"; o.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2.01;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(big ? 0.09 : 0.055, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 1.6 : 0.9));
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.018, t + 0.006);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); o2.connect(g2); this.out(g, x, w); this.out(g2, x, w);
    o.start(t); o.stop(t + 1.8); o2.start(t); o2.stop(t + 0.4);
  };
  Sfx.prototype.chord = function () {
    if (!this.on || !this.ok) return;
    var self = this, base = [164.81, 207.65, 246.94, 329.63];
    base.forEach(function (f, i) {
      var c = self.ctx, t = c.currentTime + i * 0.06;
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g); g.connect(self.master); o.start(t); o.stop(t + 2.6);
    });
  };
  Sfx.prototype.swell = function (down) {
    if (!this.on || !this.ok) return;
    var c = this.ctx, t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(down ? 600 : 120, t);
    o.frequency.exponentialRampToValueAtTime(down ? 90 : 700, t + 0.7);
    f.type = "lowpass"; f.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(f); f.connect(g); g.connect(this.master); o.start(t); o.stop(t + 1);
  };
  Sfx.prototype.arp = function () {
    if (!this.on || !this.ok) return;
    var self = this;
    [329.63, 415.30, 493.88, 659.25].forEach(function (f, i) {
      var c = self.ctx, t = c.currentTime + i * 0.055;
      var o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(self.master); o.start(t); o.stop(t + 0.6);
    });
  };

  /* ─────────────────────────────── a view ─────────────────────────────── */

  function View() {
    var host = document.createElement("div");
    host.setAttribute("data-swarm-ignore", "");
    host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483646";
    var sr = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    sr.innerHTML =
      "<style>" + STYLE + "</style>" +
      '<div class="root">' +
      '<div class="bg"></div>' +
      '<div class="port"><div class="world"></div></div>' +
      '<svg class="ov"></svg>' +
      '<div class="badges"></div>' +
      '<div class="rulers"><div class="ruler-top"><svg width="100%" height="20"></svg></div>' +
      '<div class="ruler-left"><svg width="20" height="100%"></svg></div><div class="ruler-corner"></div></div>' +
      '<div class="cursors"></div>' +
      '<div class="intro"></div>' +
      '<div class="hud">' +
      '<div class="dots"></div>' +
      '<div class="txt"><span class="status">Lendo a página…</span></div>' +
      '<div class="bar"><i></i></div>' +
      '<button data-a="tour" title="Rolar sozinho enquanto o enxame constrói">Tour</button>' +
      '<button data-a="speed" title="Velocidade">1×</button>' +
      '<button data-a="sound" class="snd" title="Som (M)">' + SND_ON + "</button>" +
      '<button data-a="live" class="pri" hidden title="Voltar à página real">Go live</button>' +
      '<button data-a="replay" hidden title="Construir de novo">Replay</button>' +
      '<button data-a="close" class="x" title="Sair (Esc)">✕</button>' +
      "</div></div>";
    document.documentElement.appendChild(host);
    var $ = function (s) { return sr.querySelector(s); };
    this.host = host; this.sr = sr;
    this.root = $(".root"); this.bg = $(".bg"); this.world = $(".world");
    this.ov = $(".ov"); this.badges = $(".badges"); this.cursors = $(".cursors");
    this.hud = $(".hud"); this.dots = $(".dots"); this.status = $(".status");
    this.bar = $(".bar i"); this.intro = $(".intro"); this.rulers = $(".rulers");
    this.rTop = $(".ruler-top svg"); this.rLeft = $(".ruler-left svg");
    this._ovS = ""; this._ovB = ""; this._rt = "";
  }

  View.prototype.destroy = function () { this.host.remove(); };

  View.prototype.build = function (items) {
    var frag = document.createDocumentFragment();
    items.forEach(function (it) {
      var el = document.createElement("div");
      el.className = "it " + (it.kind === "rect" ? "r" : it.kind === "media" ? "m" : it.kind === "line" ? "l" : "t");
      el.style.left = it.x + "px"; el.style.top = it.y + "px";
      el.style.width = it.w + "px"; el.style.height = it.h + "px";
      if (it.kind === "line") {
        el.style.background = (it.style === "dashed" || it.style === "dotted") ? "none" : it.color;
        if (it.style === "dashed" || it.style === "dotted") {
          el.style["border" + (it.horiz ? "Top" : "Left")] = it.lw + "px " + it.style + " " + it.color;
        }
        el.style.width = (it.horiz ? 0 : it.w) + "px";
        el.style.height = (it.horiz ? it.h : 0) + "px";
      } else if (it.kind === "rect") {
        el.style.borderRadius = it.radius;
        it.fill.className = "f";
        it.fill.style.borderRadius = it.radius;
        el.appendChild(it.fill);
      } else if (it.kind === "media") {
        el.style.borderRadius = it.radius;
        var ph = document.createElement("div");
        ph.className = "ph"; ph.innerHTML = IMG_ICON;
        el.appendChild(ph);
        if (it.node) {
          if (it.node.classList) it.node.classList.add("md"); else it.node.setAttribute("class", "md");
          el.appendChild(it.node);
        }
      } else {
        for (var k in it.st) {
          if (k === "px" || k === "lh" || it.st[k] == null || it.st[k] === "") continue;
          try { el.style[k] = it.st[k]; } catch (e) {}
        }
      }
      if (it.clip) {
        var c2 = it.clip;
        var ct = Math.max(0, c2.t - it.y), cl = Math.max(0, c2.l - it.x);
        var cr = Math.max(0, it.x + it.w - c2.r), cb = Math.max(0, it.y + it.h - c2.b);
        if (ct + cl + cr + cb > 0.5)
          el.style.clipPath = "inset(" + ct + "px " + cr + "px " + cb + "px " + cl + "px)";
      }
      it.el = el;
      frag.appendChild(el);
    });
    this.world.appendChild(frag);
  };

  View.prototype.scrollTo = function (sx, sy) {
    this.world.style.transform = "translate3d(" + -sx + "px," + -sy + "px,0)";
    this._sx = sx; this._sy = sy;
  };

  /* ────────────────────────────── a engine ────────────────────────────── */

  function Engine(opts) {
    this.opts = opts || {};
    this.speed = this.opts.speed || 1;
    this.tour = !!this.opts.tour;
    this.running = false;
    this.cursors = [];
    this.done = 0;
    this.t0 = 0;
  }

  Engine.prototype.init = function () {
    var snap = snapshot(this.opts.root || document.body);
    this.items = snap.items;
    this.docH = snap.docH;
    this.view = new View();
    this.view.bg.style.background = snap.bg;
    this.view.build(this.items);
    this.sfx = new Sfx();
    this.sfx.on = this.opts.sound !== false;
    this.total = this.items.length;
    this.pool = this.items.slice();
    this.px = 0;
    this.vw = innerWidth; this.vh = innerHeight;
    this.view.scrollTo(scrollX, scrollY);
    return this;
  };

  Engine.prototype.makeCursor = function (i) {
    var el = document.createElement("div");
    el.className = "cursor";
    var color = COLORS[i % COLORS.length];
    var name = NAMES[i % NAMES.length];
    el.innerHTML = cursorSVG("arrow", color) + '<div class="tag" style="background:' + color + '">' + name + "</div>";
    this.view.cursors.appendChild(el);
    var c = {
      el: el, svg: el.querySelector("svg"), color: color, name: name, shape: "arrow",
      x: rand(0, this.vw), y: rand(0, this.vh), press: 0, task: null, it: null,
      speed: rand(300, 900), ov: null, sticky: false, idle: 0, vx: 0, vy: 0
    };
    this.cursors.push(c);
    return c;
  };

  Engine.prototype.setShape = function (c, s) {
    if (c.shape === s) return;
    c.shape = s;
    c.el.firstChild.outerHTML = cursorSVG(s, c.color);
    c.svg = c.el.querySelector("svg");
  };

  Engine.prototype.scr = function (c) {
    return c.sticky ? { x: c.x, y: c.y } : { x: c.x - this.sx, y: c.y - this.sy };
  };

  /* -------- geradores de tarefa -------- */

  Engine.prototype.wait = function* (s) { var t = 0; while (t < s) t += (yield) * this.tempo; };

  Engine.prototype.moveTo = function* (c, target, o) {
    o = o || {};
    var get = typeof target === "function" ? target : function () { return target; };
    var x0 = c.x, y0 = c.y, p0 = get();
    var dist = Math.hypot(p0.x - x0, p0.y - y0);
    if (dist < 0.5) { c.x = p0.x; c.y = p0.y; if (o.onStep) o.onStep(); return; }
    var dur = clamp(0.12 + Math.sqrt(dist) * 0.021, 0.14, 0.9) / (o.speed || 1);
    var bend = (o.bend != null ? o.bend : (Math.random() < 0.5 ? -1 : 1) * rand(0.04, 0.14)) * Math.min(dist, 600);
    var t = 0;
    while (t < dur) {
      t += (yield) * this.tempo;
      var k = Math.min(1, t / dur);
      var e = (o.drag || k < 0.15) ? easeInOut(k) : easeOut(k);
      var p = get(), dx = p.x - x0, dy = p.y - y0, L = Math.hypot(dx, dy) || 1;
      var off = Math.sin(Math.PI * e) * bend;
      c.x = x0 + dx * e + (-dy / L) * off;
      c.y = y0 + dy * e + (dx / L) * off;
      if (o.onStep) o.onStep();
    }
    var pf = get(); c.x = pf.x; c.y = pf.y;
    if (o.onStep) o.onStep();
  };

  Engine.prototype.click = function* (c) {
    c.press = 1;
    var s = this.scr(c); this.sfx.press(s.x, this.vw);
    yield* this.wait(0.07);
    c.press = 0;
  };

  Engine.prototype.dragEnd = function (c, it) {
    var right = (c.sticky ? 0 : this.sx) + this.vw, bot = (c.sticky ? 0 : this.sy) + this.vh;
    var x = it.x + it.w > right - 16 ? Math.max(it.x + Math.min(it.w, 40), right - 30) : it.x + it.w;
    var y = it.y + it.h > bot - 16 ? Math.max(it.y + Math.min(it.h, 40), bot - 40) : it.y + it.h;
    return { x: Math.min(x, it.x + it.w), y: Math.min(y, it.y + it.h) };
  };

  Engine.prototype.drawBox = function* (c, it) {
    var self = this;
    this.setShape(c, "cross");
    yield* this.moveTo(c, { x: it.x, y: it.y });
    c.press = 1;
    it.vis = true; it.el.classList.add("vis");
    it.draw = { w: 0, h: 0 };
    this.paintBox(it);
    c.ov = function () { return [self.selection(it)]; };
    var end = this.dragEnd(c, it);
    yield* this.moveTo(c, end, {
      speed: 0.75, drag: true, bend: 0,
      onStep: function () {
        it.draw = { w: Math.max(0, c.x - it.x), h: Math.max(0, c.y - it.y) };
        self.paintBox(it);
      }
    });
    // se a caixa é maior que a tela, o resto "cresce" sozinho
    if (end.x < it.x + it.w - 0.5 || end.y < it.y + it.h - 0.5) {
      var w0 = it.draw.w, h0 = it.draw.h, k = 0;
      while (k < 1) {
        k = Math.min(1, k + ((yield) * this.tempo) / 0.5);
        var e = easeOut(k);
        it.draw = { w: w0 + (it.w - w0) * e, h: h0 + (it.h - h0) * e };
        this.paintBox(it);
      }
    }
    it.draw = { w: it.w, h: it.h };
    this.paintBox(it);
    c.press = 0;
  };

  Engine.prototype.paintBox = function (it) {
    var d = it.draw || { w: it.w, h: it.h };
    it.el.style.width = d.w + "px";
    it.el.style.height = d.h + "px";
  };

  Engine.prototype.selection = function (it, extra) {
    var base = it.tight || it;
    var b = it.draw
      ? { x: base.x, y: base.y, w: it.draw.w, h: it.draw.h }
      : { x: base.x, y: base.y, w: base.w, h: base.h };
    var o = {
      t: "box", b: b, handles: true,
      badge: Math.round(b.w) + " × " + Math.round(b.h), rulerLines: true
    };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  };

  Engine.prototype.taskRect = function* (c, it) {
    yield* this.drawBox(c, it);
    it.el.classList.add("st");
    it.styled = true;
    var s = this.scr(c); this.sfx.note(s.x, this.vw, it.big);
    this.setShape(c, "arrow");
    yield* this.wait(rand(0.05, 0.16));
    c.ov = null;
  };

  Engine.prototype.taskMedia = function* (c, it) {
    yield* this.drawBox(c, it);
    yield* this.wait(0.1);
    it.el.classList.add("st");
    it.styled = true;
    var s = this.scr(c); this.sfx.note(s.x, this.vw, it.w * it.h > 90000);
    this.setShape(c, "arrow");
    yield* this.wait(rand(0.06, 0.2));
    c.ov = null;
  };

  Engine.prototype.taskText = function* (c, it) {
    var self = this;
    // 1. arrasta a caixa de texto (no retângulo justo do texto)
    var T = it.tight || it;
    this.setShape(c, "cross");
    yield* this.moveTo(c, { x: T.x, y: T.y });
    c.press = 1;
    it.vis = true; it.el.classList.add("vis");
    it.draw = { w: 0, h: 0 };
    c.ov = function () { return [self.selection(it)]; };
    var end = this.dragEnd(c, T);
    yield* this.moveTo(c, end, {
      speed: 0.9, drag: true, bend: 0,
      onStep: function () { it.draw = { w: Math.max(0, c.x - T.x), h: Math.max(0, c.y - T.y) }; }
    });
    it.draw = { w: T.w, h: T.h };
    c.press = 0;
    // 2. digita
    this.setShape(c, "ibeam");
    var grow = it.st.px > 26;
    if (grow) it.el.style.fontSize = "18px";
    var txt = it.text, n = txt.length, i = 0;
    // custo por caractere: textos curtos saem letra a letra, textos longos
    // saem em rajada, de modo que cada bloco leve mais ou menos o mesmo tempo
    var k0 = clamp(70 / Math.max(1, n), 0.06, 1);
    var caret = document.createElement("span");
    caret.className = "caret";
    var tnode = document.createTextNode("");
    it.el.innerHTML = "";
    it.el.appendChild(tnode);
    it.el.appendChild(caret);
    yield* this.moveTo(c, { x: T.x + Math.min(T.w * 0.5, 50), y: T.y + Math.min(it.st.lh, T.h) * 0.55 });
    var budget = 0;
    while (i < n) {
      budget += (yield) * this.tempo;
      var from = i, space = false;
      while (i < n && budget > 0) {
        var ch = txt[i];
        var d = rand(0.012, 0.04);
        if (ch === " ") { d += rand(0, 0.03); space = true; }
        if (Math.random() < 0.025) d += rand(0.08, 0.2);
        budget -= d * k0;
        i++;
      }
      if (i > from) {
        tnode.nodeValue = txt.slice(0, i);
        var sc = this.scr(c);
        this.sfx.key(sc.x, this.vw, space);
        var r = caret.getBoundingClientRect();
        if (r.width || r.height) {
          c.x = r.left + 1 + (it.sticky ? 0 : this.sx);
          c.y = r.top + r.height * 0.55 + (it.sticky ? 0 : this.sy);
        }
      }
      if (grow) it.el.style.fontSize = (18 + (it.st.px - 18) * easeOut(Math.min(1, i / n))) + "px";
    }
    it.el.innerHTML = "";
    it.el.appendChild(document.createTextNode(txt));
    it.el.style.fontSize = it.st.fontSize;
    it.styled = true;
    it.el.classList.add("st");
    this.setShape(c, "arrow");
    yield* this.wait(rand(0.05, 0.18));
    c.ov = null;
  };

  // Traço: caneta, uma âncora em cada ponta, elástico até o cursor.
  Engine.prototype.taskLine = function* (c, it) {
    var self = this;
    var a = { x: it.x, y: it.y };
    var z = it.horiz ? { x: it.x + it.w, y: it.y } : { x: it.x, y: it.y + it.h };
    // fica dentro da tela se a linha for enorme
    var right = (c.sticky ? 0 : this.sx) + this.vw, bot = (c.sticky ? 0 : this.sy) + this.vh;
    z = { x: Math.min(z.x, right - 24), y: Math.min(z.y, bot - 36) };
    if (z.x < a.x) z.x = a.x; if (z.y < a.y) z.y = a.y;

    this.setShape(c, "pen");
    yield* this.moveTo(c, a);
    var pts = [a];
    c.ov = function () { return [{ t: "pen", pts: pts, to: { x: c.x, y: c.y } }]; };
    this.setShape(c, "pen-add");
    yield* this.click(c);
    yield* this.moveTo(c, z, { bend: 0, speed: 0.85 });
    pts = [a, z];
    yield* this.click(c);
    it.vis = true;
    it.el.classList.add("vis");
    // o traço cresce da primeira âncora até o fim
    var k = 0;
    while (k < 1) {
      k = Math.min(1, k + ((yield) * this.tempo) / 0.28);
      var e = easeOut(k);
      if (it.horiz) it.el.style.width = (it.w * e) + "px";
      else it.el.style.height = (it.h * e) + "px";
    }
    it.el.style.width = it.w + "px";
    it.el.style.height = it.h + "px";
    it.styled = true;
    var sp = this.scr(c);
    this.sfx.press(sp.x, this.vw);
    this.setShape(c, "arrow");
    yield* this.wait(rand(0.08, 0.22));
    c.ov = null;
  };

  Engine.prototype.taskDup = function* (c, it) {
    var self = this;
    var src = it.master;
    this.setShape(c, "arrow");
    // seleciona o original
    yield* this.moveTo(c, { x: src.x + src.w * 0.5, y: src.y + src.h * 0.5 });
    c.ov = function () { return [{ t: "box", b: { x: src.x, y: src.y, w: src.w, h: src.h }, handles: true, badge: Math.round(src.w) + " × " + Math.round(src.h) }]; };
    yield* this.click(c);
    // ⌥-arrasta a cópia
    this.setShape(c, "dup");
    var dx = it.x - src.x, dy = it.y - src.y;
    var ghost = { x: src.x, y: src.y, w: src.w, h: src.h };
    it.vis = true; it.el.classList.add("vis");
    it.el.style.left = ghost.x + "px"; it.el.style.top = ghost.y + "px";
    it.draw = { w: it.w, h: it.h };
    // a medida vermelha só faz sentido quando a cópia fica ao lado ou logo
    // abaixo do original; se a série quebra linha, não mostra medida nenhuma
    var sameRow = Math.abs(it.y - src.y) < 2 && it.x > src.x;
    var sameCol = Math.abs(it.x - src.x) < 2 && it.y > src.y;
    var gapH = it.x - (src.x + src.w), gapV = it.y - (src.y + src.h);
    var showGap = (sameRow && gapH >= 0 && gapH < 200) || (sameCol && gapV >= 0 && gapV < 200);
    c.ov = function () {
      var o = [{ t: "box", b: { x: ghost.x, y: ghost.y, w: ghost.w, h: ghost.h }, handles: true, badge: Math.round(ghost.w) + " × " + Math.round(ghost.h) }];
      if (showGap) {
        o.push(sameRow
          ? { t: "measure", a: { x: src.x + src.w, y: src.y + src.h / 2 }, b: { x: Math.max(src.x + src.w, ghost.x), y: src.y + src.h / 2 }, label: String(Math.round(gapH)) }
          : { t: "measure", a: { x: src.x + src.w / 2, y: src.y + src.h }, b: { x: src.x + src.w / 2, y: Math.max(src.y + src.h, ghost.y) }, label: String(Math.round(gapV)) });
      }
      return o;
    };
    var x0 = c.x, y0 = c.y;
    yield* this.moveTo(c, { x: x0 + dx, y: y0 + dy }, {
      speed: 0.6, drag: true,
      onStep: function () {
        ghost.x = src.x + (c.x - x0); ghost.y = src.y + (c.y - y0);
        it.el.style.left = ghost.x + "px"; it.el.style.top = ghost.y + "px";
      }
    });
    it.el.style.left = it.x + "px"; it.el.style.top = it.y + "px";
    if (it.kind === "text") {
      // a cópia é reescrita com o texto dela
      it.el.textContent = it.text;
      it.el.animate && it.el.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "none" }], { duration: 260, easing: "ease-out" });
    }
    it.el.classList.add("st");
    it.styled = true;
    var s = this.scr(c); this.sfx.note(s.x, this.vw, false);
    this.setShape(c, "arrow");
    yield* this.wait(rand(0.05, 0.14));
    c.ov = null;
  };

  /* -------- seleção de tarefa -------- */

  Engine.prototype.available = function () {
    var bot = this.sy + this.vh + 240;
    var out = [];
    for (var i = this.px; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.claimed || it.done) continue;
      if (!it.sticky && it.y > bot && !it.force) break;
      if (it.parent && !it.parent.done) continue;
      if (it.master && !it.master.done) continue;
      out.push(it);
      if (out.length > 60) break;
    }
    while (this.px < this.items.length && (this.items[this.px].done || this.items[this.px].claimed)) this.px++;
    return out;
  };

  Engine.prototype.assign = function (c) {
    var avail = this.available();
    if (!avail.length) return false;
    // o agente pega a tarefa mais próxima entre as primeiras
    var best = null, bd = Infinity;
    for (var i = 0; i < Math.min(avail.length, 18); i++) {
      var it = avail[i];
      var d = Math.hypot(it.x - c.x, it.y - c.y) + i * 40;
      // evita que meia dúzia de agentes caia em cima do mesmo cantinho
      for (var j = 0; j < this.cursors.length; j++) {
        var o = this.cursors[j].it;
        if (!o || o === it) continue;
        var dd = Math.hypot(o.x - it.x, o.y - it.y);
        if (dd < 90) d += (90 - dd) * 3;
      }
      if (d < bd) { bd = d; best = it; }
    }
    if (!best) return false;
    best.claimed = true;
    c.it = best;
    c.sticky = !!best.sticky;
    var gen = best.master ? this.taskDup(c, best)
      : best.kind === "line" ? this.taskLine(c, best)
        : best.kind === "text" ? this.taskText(c, best)
          : best.kind === "media" ? this.taskMedia(c, best)
            : this.taskRect(c, best);
    c.task = gen;
    gen.next();
    return true;
  };

  /* -------- laço principal -------- */

  Engine.prototype.start = function () {
    var self = this;
    this.running = true;
    this.sx = scrollX; this.sy = scrollY;
    document.documentElement.classList.add("swarm-hide");
    this.view.root.classList.add("on");

    // intro: favicon + órbita
    var ic = document.querySelector('link[rel~="icon"]');
    if (ic && ic.href) this.view.intro.innerHTML = '<img src="' + ic.href + '" alt="">';
    else this.view.intro.innerHTML = '<div class="mono">' + (location.hostname[0] || "·").toUpperCase() + "</div>";
    this.view.intro.classList.add("on");
    this.sfx.swell(false);

    var intro = Math.min(INTRO_AGENTS, this.opts.agents || MAX_AGENTS);
    for (var i = 0; i < intro; i++) this.makeCursor(i);
    this.phase = "intro";
    this.phaseT = 0;
    this.last = performance.now();
    this.t0 = this.last;
    this.view.hud.classList.add("on");
    if (this.opts.rulers) this.view.rulers.classList.add("on");
    this.updateHud();
    this.raf = requestAnimationFrame(function (t) { self.frame(t); });

    this.onScroll = function () { self.sx = scrollX; self.sy = scrollY; };
    addEventListener("scroll", this.onScroll, { passive: true });
    this.onMouse = function (e) { self.mx = e.clientX; self.my = e.clientY; };
    addEventListener("mousemove", this.onMouse, { passive: true });
  };

  Engine.prototype.frame = function (now) {
    if (!this.running) return;
    var self = this;
    var dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.vw = innerWidth; this.vh = innerHeight;
    this.view.scrollTo(this.sx, this.sy);

    // tempo do enxame: mais rápido quando há fila
    var avail = this.items.length - this.done;
    this.tempo = clamp(0.62 + (avail / Math.max(1, this.cursors.length)) * 0.12, 0.62, 1.18) * this.speed;

    if (this.phase === "intro") {
      this.phaseT += dt;
      var cx = this.vw / 2, cy = this.vh / 2;
      for (var i = 0; i < this.cursors.length; i++) {
        var c = this.cursors[i];
        var a = (i / this.cursors.length) * Math.PI * 2 + this.phaseT * 1.5;
        var r = 46 + Math.sin(this.phaseT * 2 + i) * 7;
        var tx = cx + Math.cos(a) * r, ty = cy + Math.sin(a) * r;
        c.x = c.x + (tx - c.x) * Math.min(1, dt * 7);
        c.y = c.y + (ty - c.y) * Math.min(1, dt * 7);
      }
      if (this.phaseT > 1.15) {
        this.phase = "build";
        this.view.intro.classList.add("gone");
        this.sfx.arp();
        this.t0 = now;
      }
    } else if (this.phase === "build") {
      // ajusta o número de agentes à fila, entrando aos poucos
      var top = this.opts.agents || MAX_AGENTS;
      var want = clamp(Math.round(MIN_AGENTS + Math.min(1, avail / 150) * (top - MIN_AGENTS)), MIN_AGENTS, top);
      this.hire = (this.hire || 0) + dt;
      while (this.cursors.length < want && this.hire > 0.1) {
        this.hire -= 0.1;
        this.makeCursor(this.cursors.length);
      }
      for (var j = 0; j < this.cursors.length; j++) {
        var cu = this.cursors[j];
        if (!cu.task) {
          if (!this.assign(cu)) {
            // sem tarefa: a seta vagueia devagar, como no enxame original
            cu.idle += dt;
            this.setShape(cu, "arrow");
            cu.ov = null;
            var ph = j * 1.7;
            cu.x += (Math.sin(now / 1500 + ph) * 26 + Math.sin(now / 430 + ph * 2) * 6) * dt;
            cu.y += (Math.cos(now / 1700 + ph) * 26 + Math.cos(now / 510 + ph * 3) * 6) * dt;
            continue;
          }
          cu.idle = 0;
        }
        var res = cu.task.next(dt);
        if (res.done) {
          if (cu.it) {
            cu.it.done = true;
            this.done++;
            if (this.cursors.length > want) { /* mantém: reduzir causa salto visual */ }
          }
          cu.task = null; cu.it = null; cu.ov = null;
        }
      }
      if (this.tour) this.doTour(dt);
      // cão de guarda: se ninguém tem tarefa, destrava o item mais antigo
      var busy = false;
      for (var w = 0; w < this.cursors.length; w++) if (this.cursors[w].task) { busy = true; break; }
      this.stall = busy ? 0 : (this.stall || 0) + dt;
      if (this.stall > 1.2) {
        this.stall = 0;
        for (var q = 0; q < this.items.length; q++) {
          var itq = this.items[q];
          if (!itq.done && !itq.claimed) { itq.parent = null; itq.master = null; itq.force = true; break; }
        }
      }
      if (this.done >= this.total) this.finish(now);
    } else if (this.phase === "done") {
      // flocking em volta do mouse
      var mx = this.mx == null ? this.vw / 2 : this.mx, my = this.my == null ? this.vh / 2 : this.my;
      for (var k = 0; k < this.cursors.length; k++) {
        var cc = this.cursors[k];
        var ang = (k / this.cursors.length) * Math.PI * 2 + now / 2600;
        var rr = 70 + (k % 5) * 16;
        var txx = mx + Math.cos(ang) * rr, tyy = my + Math.sin(ang) * rr;
        cc.x += (txx - cc.x) * Math.min(1, dt * 2.4);
        cc.y += (tyy - cc.y) * Math.min(1, dt * 2.4);
        cc.sticky = true;
      }
    }

    this.render();
    this.updateHud();
    this.raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  Engine.prototype.doTour = function (dt) {
    // rola enquanto tudo o que está acima da dobra já ficou pronto
    var bot = this.sy + this.vh;
    var pending = 0;
    for (var i = this.px; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.y > bot - 80) break;
      if (!it.done) pending++;
    }
    var maxY = Math.max(0, this.docH - this.vh);
    if (pending < 4 && this.sy < maxY) {
      scrollTo(0, Math.min(maxY, this.sy + 220 * dt * this.speed));
      this.sx = scrollX; this.sy = scrollY;
    }
  };

  Engine.prototype.finish = function (now) {
    this.phase = "done";
    this.secs = Math.max(1, Math.round((now - this.t0) / 1000));
    this.sfx.chord();
    this.view.rulers.classList.remove("on");
    var q = this.view.hud.querySelector.bind(this.view.hud);
    q('[data-a="live"]').hidden = false;
    q('[data-a="replay"]').hidden = false;
    q('[data-a="tour"]').hidden = true;
    q('[data-a="speed"]').hidden = true;
    this.view.ov.innerHTML = ""; this.view.badges.innerHTML = "";
    this.view._ovS = ""; this.view._ovB = "";
  };

  /* -------- render -------- */

  Engine.prototype.render = function () {
    var v = this.view, s = "", b = "";
    var X = function (x, st) { return f1(st ? x : x - this.sx); }.bind(this);
    var Y = function (y, st) { return f1(st ? y : y - this.sy); }.bind(this);
    var rOn = v.rulers.classList.contains("on");

    for (var i = 0; i < this.cursors.length; i++) {
      var c = this.cursors[i];
      // cursor
      var hs = HOT[c.shape] || [0, 0];
      var sp = this.scr(c);
      c.el.style.transform = "translate3d(" + f1(sp.x - hs[0]) + "px," + f1(sp.y - hs[1]) + "px,0)" + (c.press ? " scale(.92)" : "");
      if (!c.ov) continue;
      var list = c.ov();
      for (var j = 0; j < list.length; j++) {
        var o = list[j], st = c.sticky;
        if (o.t === "box") {
          var x = X(o.b.x, st), y = Y(o.b.y, st), w = f1(o.b.w), h = f1(o.b.h);
          var col = o.color === "red" ? RED : BLUE;
          s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + col + '" stroke-width="1"/>';
          if (o.rulerLines && rOn)
            s += '<g stroke="' + BLUE + '" stroke-width="1" stroke-dasharray="2 2" opacity=".9"><line x1="' + RULER + '" x2="' + x + '" y1="' + f1(y + h / 2) + '" y2="' + f1(y + h / 2) + '"/><line x1="' + f1(x + w / 2) + '" x2="' + f1(x + w / 2) + '" y1="' + RULER + '" y2="' + y + '"/></g>';
          if (o.handles) {
            var pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
            for (var p = 0; p < 4; p++)
              s += '<rect x="' + f1(pts[p][0] - 3.5) + '" y="' + f1(pts[p][1] - 3.5) + '" width="7" height="7" fill="#fff" stroke="' + col + '" stroke-width="1"/>';
          }
          if (o.badge && w > 6 && h > 3)
            b += '<div class="badge" style="left:' + f1(x + w / 2) + "px;top:" + f1(y + h + 8) + "px;background:" + col + '">' + o.badge + "</div>";
        } else if (o.t === "pen") {
          var all = o.pts.map(function (q) { return X(q.x, st) + "," + Y(q.y, st); });
          if (o.to) all.push(X(o.to.x, st) + "," + Y(o.to.y, st));
          s += '<polyline points="' + all.join(" ") + '" fill="none" stroke="' + BLUE + '" stroke-width="1.5"/>';
          for (var pp = 0; pp < o.pts.length; pp++)
            s += '<circle cx="' + X(o.pts[pp].x, st) + '" cy="' + Y(o.pts[pp].y, st) + '" r="3.6" fill="#fff" stroke="' + BLUE + '" stroke-width="1.5"/>';
        } else if (o.t === "measure") {
          var a1 = { x: X(o.a.x, st), y: Y(o.a.y, st) }, a2 = { x: X(o.b.x, st), y: Y(o.b.y, st) };
          s += '<line x1="' + a1.x + '" y1="' + a1.y + '" x2="' + a2.x + '" y2="' + a2.y + '" stroke="' + RED + '" stroke-width="1"/>';
          var hz = Math.abs(a1.y - a2.y) < 0.6;
          b += '<div class="badge" style="left:' + f1(hz ? (a1.x + a2.x) / 2 : a1.x + 18) +
            "px;top:" + f1(hz ? a1.y + 8 : (a1.y + a2.y) / 2 - 9) + "px;background:" + RED + '">' + o.label + "</div>";
        }
      }
    }
    if (s !== v._ovS) { v.ov.innerHTML = s; v._ovS = s; }
    if (b !== v._ovB) { v.badges.innerHTML = b; v._ovB = b; }
    if (rOn) this.renderRulers();
  };

  Engine.prototype.renderRulers = function () {
    var step = 100, u = "", a = "", v = this.view;
    var x0 = Math.floor(this.sx / step) * step;
    for (var cx = x0; cx - this.sx < this.vw; cx += step / 2) {
      var x = f1(cx - this.sx), major = cx % step === 0;
      u += '<line x1="' + x + '" x2="' + x + '" y1="' + (major ? 13 : 16) + '" y2="' + RULER + '" stroke="#5E5E5E"/>';
      if (major) u += '<text x="' + f1(x + 3) + '" y="11" class="rtext">' + cx + "</text>";
    }
    var y0 = Math.floor(this.sy / step) * step;
    for (var cy = y0; cy - this.sy < this.vh; cy += step / 2) {
      var y = f1(cy - this.sy), maj = cy % step === 0;
      a += '<line y1="' + y + '" y2="' + y + '" x1="' + (maj ? 13 : 16) + '" x2="' + RULER + '" stroke="#5E5E5E"/>';
      if (maj) a += '<text x="11" y="' + f1(y - 3) + '" class="rtext" transform="rotate(-90 11 ' + f1(y - 3) + ')">' + cy + "</text>";
    }
    for (var i = 0; i < this.cursors.length; i++) {
      var c = this.cursors[i];
      if (!c.ov || c.sticky) continue;
      var list = c.ov();
      for (var j = 0; j < list.length; j++) {
        var o = list[j];
        if (o.t !== "box" || !o.handles) continue;
        var l = f1(o.b.x - this.sx), r = f1(o.b.x + o.b.w - this.sx);
        var tp = f1(o.b.y - this.sy), bt = f1(o.b.y + o.b.h - this.sy);
        u = '<rect x="' + l + '" y="0" width="' + f1(r - l) + '" height="' + RULER + '" fill="rgba(13,153,255,0.22)"/>' + u +
          '<text x="' + f1(l + 3) + '" y="11" class="rtext rsel">' + Math.round(o.b.x) + "</text>";
        a = '<rect y="' + tp + '" x="0" height="' + f1(bt - tp) + '" width="' + RULER + '" fill="rgba(13,153,255,0.22)"/>' + a;
      }
    }
    if (u !== v._rt) { v.rTop.innerHTML = u; v.rLeft.innerHTML = a; v._rt = u; }
  };

  /* -------- HUD -------- */

  Engine.prototype.updateHud = function () {
    var now = performance.now();
    if (this._hudT && now - this._hudT < 160) return;
    this._hudT = now;
    var v = this.view;
    var workers = this.cursors.length;

    // avatares
    var want = Math.min(5, this.cursors.length);
    if (v.dots.children.length !== want) {
      v.dots.innerHTML = "";
      for (var i = 0; i < want; i++) v.dots.appendChild(document.createElement("i"));
    }
    for (var k = 0; k < want; k++) {
      var c = this.cursors[(k * 7) % this.cursors.length];
      var el = v.dots.children[k];
      if (el._c !== c.color) { el._c = c.color; el.style.background = c.color; el.textContent = c.name[0]; }
    }

    if (this.phase === "done") {
      v.status.innerHTML = "Reconstruído por <b>" + this.cursors.length + "</b> agentes em <b>" + this.secs + "s</b>";
      v.bar.style.width = "100%";
      return;
    }
    if (this.phase === "intro") {
      v.status.innerHTML = "<b>" + this.cursors.length + "</b> agentes prontos<span class='sep'></span>" + this.total.toLocaleString() + " layers";
      return;
    }
    v.status.innerHTML = "<b>" + workers + "</b> agents<span class=\"sep\"></span><b>" +
      this.done.toLocaleString() + "</b> / " + this.total.toLocaleString() + " layers";
    v.bar.style.width = (100 * this.done / Math.max(1, this.total)) + "%";
  };

  Engine.prototype.stop = function () {
    this.running = false;
    cancelAnimationFrame(this.raf);
    removeEventListener("scroll", this.onScroll);
    removeEventListener("mousemove", this.onMouse);
    document.documentElement.classList.remove("swarm-hide");
    this.view.root.classList.remove("on");
    var v = this.view;
    setTimeout(function () { v.destroy(); }, 450);
  };

  /* ─────────────────────────────── público ────────────────────────────── */

  var hideCSS = document.createElement("style");
  hideCSS.textContent = "html.swarm-hide body>*:not([data-swarm-ignore]){visibility:hidden!important}html.swarm-hide{overflow-y:auto}";
  var current = null;

  function start(opts) {
    if (current) return current;
    document.head.appendChild(hideCSS);
    current = new Engine(opts || {}).init();
    current.start();
    bindHud(current);
    return current;
  }
  function stop() {
    if (!current) return;
    current.stop();
    current = null;
    if (hideCSS.parentNode) hideCSS.remove();
  }
  function toggle(opts) { current ? stop() : start(opts); }

  function resumeAudio(E) {
    var f = function () {
      if (E.sfx && E.sfx.ctx && E.sfx.ctx.state === "suspended") E.sfx.ctx.resume();
      removeEventListener("pointerdown", f);
      removeEventListener("keydown", f);
    };
    addEventListener("pointerdown", f);
    addEventListener("keydown", f);
  }

  function bindHud(E) {
    resumeAudio(E);
    var speeds = [1, 1.5, 2, 3], ix = 0;
    E.view.hud.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (!btn) return;
      var a = btn.getAttribute("data-a");
      if (a === "close") stop();
      else if (a === "live") { stop(); }
      else if (a === "replay") { stop(); setTimeout(function () { start(E.opts); }, 500); }
      else if (a === "tour") { E.tour = !E.tour; btn.classList.toggle("on", E.tour); btn.textContent = E.tour ? "Touring" : "Tour"; }
      else if (a === "speed") { ix = (ix + 1) % speeds.length; E.speed = speeds[ix]; btn.textContent = String(speeds[ix]).replace(".", ",") + "×"; }
      else if (a === "sound") {
        E.sfx.on = !E.sfx.on;
        btn.classList.toggle("off", !E.sfx.on);
        btn.innerHTML = E.sfx.on ? SND_ON : SND_OFF;
        if (E.sfx.on && E.sfx.ctx && E.sfx.ctx.state === "suspended") E.sfx.ctx.resume();
      }
    });
  }

  addEventListener("keydown", function (e) {
    if (e.altKey && e.shiftKey && (e.key === "S" || e.key === "s")) { e.preventDefault(); toggle(); }
    else if (e.key === "Escape" && current) stop();
    else if ((e.key === "m" || e.key === "M") && current && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) {
      var b = current.view.hud.querySelector('[data-a="sound"]');
      if (b) b.click();
    }
  });

  window[KEY] = window.SwarmBuild = { start: start, stop: stop, toggle: toggle, COLORS: COLORS, NAMES: NAMES };
})();

