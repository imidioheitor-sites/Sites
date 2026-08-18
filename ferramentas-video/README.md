# Como os vídeos de demonstração foram feitos

Três cortes da interface, gravados direto do site rodando.

## Reproduzir

```bash
# 1. sirva o site
cd ../arbo-sempre-verde && python3 -m http.server 8899 &

# 2. grave os três roteiros (Playwright + Chromium)
node record.js 1     # percurso — tour calmo
node record.js 2     # interações — foco no que responde ao cursor
node record.js 3     # ritmo — corte rápido

# 3. componha as trilhas
python3 music.py 1 && python3 music.py 2 && python3 music.py 3

# 4. junte imagem e som (ver o comando `mk` no histórico do commit)
```

## Notas

- `drive.js` traz os movimentos de câmera: rolagem com easing e cursor em arco.
  Movimento em arco em vez de linha reta porque o cursor precisa parecer humano.
- `music.py` é um sintetizador pequeno — osciladores, ADSR, filtro passa-baixa e
  uma reverb de Schroeder simplificada. As trilhas são livres de direitos por
  construção. São leitos de apoio, não faixa de estúdio: para trilha comercial
  de verdade, use uma biblioteca licenciada e troque o áudio no passo 4.
- A gravação do Playwright precisa do ffmpeg na revisão que ele espera. Se
  reclamar de `ffmpeg-1010`, aponte para a que existir:
  `ln -sf /opt/pw-browsers/ffmpeg-1011/ffmpeg-linux /opt/pw-browsers/ffmpeg-1010/ffmpeg-linux`
