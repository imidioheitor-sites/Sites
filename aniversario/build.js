/* Gera dist/index.html — um único arquivo HTML autocontido, pronto pra subir.
   Uso: node build.js                                                         */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html');
const app   = read('app.js');
const scene = read('scene.js');

// Evita que um "</script>" dentro do JS feche a tag antes da hora.
const safe = js => js.replace(/<\/script>/gi, '<\\/script>');

// IMPORTANTE: a substituição precisa ser uma FUNÇÃO, não uma string.
// Numa string de substituição o "$" é especial ($&, $`, $1…), então o helper
// "$$" do app.js virava "$" e colidia com o "$" já declarado.
html = html
  .replace(
    '<script src="app.js" defer></script>',
    () => '<script>\n' + safe(app) + '\n</script>'
  )
  .replace(
    '<script type="module" src="scene.js"></script>',
    () => '<script type="module">\n' + safe(scene) + '\n</script>'
  );

if (html.includes('src="app.js"') || html.includes('src="scene.js"')) {
  console.error('ERRO: não consegui inlinar os scripts — as tags mudaram?');
  process.exit(1);
}

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);

// Leva junto o vídeo, se já tiver sido baixado.
const assets = path.join(root, 'assets');
if (fs.existsSync(assets)) {
  fs.mkdirSync(path.join(root, 'dist', 'assets'), { recursive: true });
  for (const f of fs.readdirSync(assets)) {
    fs.copyFileSync(path.join(assets, f), path.join(root, 'dist', 'assets', f));
  }
}

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`dist/index.html gerado — ${kb} KB, arquivo único.`);
