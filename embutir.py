#!/usr/bin/env python3
"""Gera o index.html unico, com as 23 fotos embutidas em base64.

    python3 embutir.py            -> index.html (fotos embutidas, video como arquivo)
    python3 embutir.py --video    -> index-arquivo-unico.html (video dentro tambem)

Edite sempre fonte/index.html (que referencia assets/fotos/NN.jpg) e rode este
script para regerar o index.html que vai para o ar. Cada foto e reduzida para a
largura em que realmente aparece na tela antes de virar base64 -- embutir os
arquivos grandes dobraria o peso da pagina sem ganho nenhum de qualidade.
"""
import base64, io, re, sys
from PIL import Image

# largura de exibicao (coluna da galeria = 323px; x2 para telas retina)
LARG = {1: 440, 2: 440, 21: 760, 22: 760, 23: 760}
for i in range(3, 21):
    LARG[i] = 660
for i in (3, 9, 15):
    LARG[i] = 1000      # destaques
for i in (8, 14, 20):
    LARG[i] = 1400      # faixas largas

def embutir(n: int) -> str:
    im = Image.open('assets/fotos/%02d.jpg' % n)
    w = LARG[n]
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=70, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

COM_VIDEO = '--video' in sys.argv
SAIDA = 'index-arquivo-unico.html' if COM_VIDEO else 'index.html'

html = io.open('fonte/index.html', encoding='utf-8').read()
if 'assets/fotos/' not in html:
    sys.exit('fonte/index.html nao referencia assets/fotos/ -- nada a embutir')

vistas = []
def troca(m):
    n = int(m.group(1)); vistas.append(n)
    return 'src:"%s"' % embutir(n)

html = re.sub(r'src:"assets/fotos/(\d+)\.jpg"', troca, html)
html = html.replace('<img alt="${esc(ph.cap)}" loading="${i<2?"eager":"lazy"}" data-src="${esc(ph.src)}">',
                    '<img alt="${esc(ph.cap)}" data-src="${esc(ph.src)}">')
if COM_VIDEO:
    # versao leve: o video e fundo a 34% de opacidade, nao precisa de 720p
    dados = open('assets/hero-leve.mp4', 'rb').read()
    uri = 'data:video/mp4;base64,' + base64.b64encode(dados).decode()
    html = html.replace('<source src="assets/hero.mp4" type="video/mp4">',
                        '<source src="%s" type="video/mp4">' % uri)

io.open(SAIDA, 'w', encoding='utf-8').write(html)
print('%d fotos%s embutidas -> %s (%.2f MB)'
      % (len(vistas), ' + video' if COM_VIDEO else '', SAIDA, len(html) / 1e6))
