# GOODBOX — site (index.html)

Site de página única: **Início (hero com vídeo 3D) · Cardápio + carrinho · Localização · Pedido (checkout via WhatsApp)**.
Tema verde claro fresco, otimizado para celular, com efeitos interativos (cursor, MagicBento, produto 3D,
Portal no scroll, revelação no hover, TextPressure).

## ✍️ O que você precisa preencher
Abra o `index.html` e procure o bloco **`const CONFIG = { ... }`** (no início do `<script>`):

| Campo | O que colocar |
|---|---|
| `whatsapp` | Seu número no formato **55 + DDD + número** (só dígitos). Ex.: `5516999998888` |
| `whatsappLabel` | Como o número aparece na tela. Ex.: `(16) 99999-8888` |
| `instagram` | Handle do Instagram sem `@` (pré-preenchido `good.boxsaudavel` — **confirme se é o seu**) |
| `endereco` | Endereço/cidade que aparece no card de localização |
| `horario` | Horário de atendimento |

E o bloco **`const MENU = [ ... ]`**: ajuste **preços**, nomes, gramaturas e descrições dos 5 pratos.
O mapa da seção Localização usa "Ribeirão Preto"; troque o endereço no `<iframe ... src="...q=SEU+ENDEREÇO...">` se quiser precisão.

## 🎬 Vídeo do hero
Gerado no Higgsfield (15s, 1080p, sem texto) e referenciado pela URL em `const VIDEO_URL`.
Se quiser hospedar você mesmo, baixe o arquivo e troque a URL (pode ser um caminho local, ex.: `assets/hero.mp4`).

## 🖼️ Imagens
As fotos dos pratos estão em `assets/` (fotos reais suas). Para trocar, substitua os arquivos mantendo os nomes.

## 🚀 Publicar
É um site estático. Basta subir `index.html` + a pasta `assets/` em qualquer hospedagem
(Netlify, Vercel, GitHub Pages, Hostinger etc.). Não precisa de build.
