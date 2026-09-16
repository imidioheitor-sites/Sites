# Vídeos de demonstração

Três cortes da interface, renderizados quadro a quadro a 30 fps.

## Por que não é gravação de tela

Gravar em tempo real perde quadros: o navegador rasteriza por software neste
ambiente, e o que ele não consegue desenhar a tempo simplesmente some do vídeo.
A primeira versão saiu com cerca de 18 fps efetivos e judder visível.

Aqui o relógio da página é congelado — `requestAnimationFrame` só avança quando
o renderizador manda. Cada quadro é montado sem pressa e fotografado via CDP.
Nenhum quadro se perde, independente de quão lento seja o desenho: medido em
99% de quadros únicos, 29,7 fps efetivos.

O canvas de fluido em WebGL fica de fora da renderização: custava cerca de 1,5 s
por quadro no rasterizador por software, contra 0,38 s sem ele. A 15% de
opacidade quase não aparecia no vídeo.

## Reproduzir

```bash
cd ../arbo-sempre-verde && python3 -m http.server 8899 &

node runall.js 1     # percurso    — tour calmo
node runall.js 2     # interações  — o cursor é o protagonista
node runall.js 3     # ritmo       — corte curto

python3 music.py 1 && python3 music.py 2 && python3 music.py 3
```

Depois junte quadros e trilha. O CDP captura 1920x993 neste ambiente, e o H.264
em yuv420p exige dimensões pares, daí o corte de uma linha:

```bash
ffmpeg -framerate 30 -i frames/percurso/f%05d.jpg -i mus1.wav \
  -filter_complex "[0:v]crop=1920:992:0:0,format=yuv420p[v];\
[1:a]atrim=0:85.5,afade=t=in:st=0:d=2,afade=t=out:st=82:d=3.5,volume=0.85[a]" \
  -map "[v]" -map "[a]" -t 85.5 -r 30 -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 160k -movflags +faststart arbo-1-percurso.mp4
```

## Arquivos

- `render2.js` — o renderizador: congela o relógio, avança um passo por quadro,
  move o mouse por CDP (hover de verdade) e fotografa.
- `timelines.js` — as três linhas do tempo, em pares de rolagem e posição do cursor.
  O cursor nunca fica parado muito tempo; parado, denuncia que é gravação.
- `runall.js` — dispara um roteiro. Os três rodam em paralelo sem se atrapalhar.
- `music.py` — sintetizador das trilhas: osciladores, ADSR, filtro passa-baixa e
  uma reverb de Schroeder simplificada. Livres de direitos por construção, mas são
  leitos de apoio; para trilha comercial de verdade, use biblioteca licenciada e
  troque o áudio no passo final.

Renderizar os três leva cerca de uma hora em paralelo. É lento por quadro e
rápido de confiar: o resultado não depende da carga da máquina.
