# Site de Aniversário & Despedida — Heitor Imídio · 16/08

Arquivo único de verdade: **`index.html`** (2,8 MB) com as 23 fotos embutidas.
Abre com duplo clique, sem servidor, sem pasta ao lado. Arraste para o Netlify e
está no ar.

Junto vão dois arquivos que ficam de fora dele de propósito: `assets/hero.mp4`
(vídeo grande demais para embutir sem travar a abertura da página) e
`assets/og.jpg` (a miniatura do WhatsApp precisa de um endereço próprio, não
pode ser embutida).

---

## 1. O que você PRECISA editar antes de publicar

**Chave configurada:** `himidio@nd.edu` (titular HEITOR IMIDIO, Goianira).

Para trocar, abra `index.html` e procure por `CONFIGURAÇÃO` (perto do início da tag `<script>`).

### Chave Pix — obrigatório

```js
const PIX = {
  chave : "SUA-CHAVE-PIX-AQUI",   // CPF, telefone (+5562...), e-mail ou chave aleatória
  nome  : "HEITOR IMIDIO",        // até 25 caracteres, SEM acento
  cidade: "GOIANIRA"              // até 15 caracteres, SEM acento
};
```

Enquanto a chave não for trocada, o site funciona normalmente mas mostra um aviso
no lugar do QR Code. Assim que você colar a chave, **todos os QR Codes passam a
funcionar automaticamente**, cada um já com o valor do presente preenchido.

O código Pix é gerado no padrão BR Code / EMV do Banco Central, com CRC16-CCITT.
Foi verificado por teste automatizado: o payload é escrito no QR e lido de volta
da matriz, byte a byte.

> Teste com um valor de R$ 1 no seu próprio banco antes de divulgar o link.

---

## 2. Tempo real entre todos os visitantes (opcional, grátis)

Sem isso o site funciona, mas cada pessoa só enxerga o que ela mesma reservou
(fica salvo no navegador dela). Para todo mundo ver o mesmo estado ao vivo:

1. Crie um projeto em <https://console.firebase.google.com> (plano Spark, gratuito).
2. Ative **Realtime Database** → *Criar banco de dados* → modo de teste.
3. Em *Configurações do projeto → Seus aplicativos → Web*, copie o objeto de config.
4. Cole em `index.html`:

```js
const FIREBASE = {
  apiKey:"…", authDomain:"…",
  databaseURL:"https://SEU-PROJETO-default-rtdb.firebaseio.com",
  projectId:"…", storageBucket:"…", messagingSenderId:"…", appId:"…"
};
```

Feito isso, presentes reservados e recados do mural sincronizam entre todos
instantaneamente.

**Antes de divulgar**, troque as regras do banco (aba *Regras*) para permitir
escrita apenas nos dois caminhos usados:

```json
{
  "rules": {
    "presentes": { ".read": true, ".write": true },
    "recados":   { ".read": true, ".write": true }
  }
}
```

O modo de teste padrão expira em 30 dias e libera o banco inteiro — não deixe assim.

---

## 3. O vídeo da hero

**Já está pronto e dentro do pacote** — `assets/hero.mp4`, 1,8 MB.

O original tinha 20 MB (1920×1080, 10,7 Mbps e ainda com faixa de áudio, sendo
que ele toca mudo). Recomprimi para 720p sem áudio: 1,8 MB, visualmente
indistinguível na tela, já que ele aparece a 34% de opacidade atrás do texto.

A hero também tem **animação própria em canvas** (poeira dourada com
profundidade e paralaxe no mouse), que roda por baixo. O vídeo entra por cima
com um fade quando fica pronto. Se um dia o arquivo sumir, a hero continua viva.

### Por que o vídeo não está embutido no index.html

Em base64 ele cresceria para 2,4 MB e, pior, **base64 no HTML bloqueia a
renderização**: a página só apareceria depois de baixar tudo. Como arquivo
separado, o site abre na hora e o vídeo entra transmitindo por trás.

Se você precisar mesmo de um arquivo avulso, o pacote traz
`index-arquivo-unico.html` (4,0 MB, com vídeo e fotos dentro). Para o site no
ar, prefira o `index.html`.

---

## 3.5 As fotos

As 23 estão **embutidas no `index.html`** em base64. Não precisa da pasta.

Para trocar ou mexer nelas, o fluxo é:

1. Edite **`fonte/index.html`** — é a versão legível, que referencia
   `assets/fotos/NN.jpg`. Nunca edite o `index.html` direto: ele tem 2,8 MB de
   base64 e é gerado.
2. Rode `python3 embutir.py` (precisa de `pip install Pillow`).
3. O `index.html` é regerado com tudo dentro.

O script reduz cada foto para a largura em que ela realmente aparece na tela
antes de converter. Embutir os arquivos originais dobraria o peso da página sem
nenhum ganho visível.

| # | Onde aparece | Foto |
|---|---|---|
| 01–02 | flutuando na hero | aeroporto · a medalha |
| 03–20 | galeria de memórias | ONU, MIT, Google, sala de controle, foguetes, palcos, Genebra, Boston — misturada com as pessoais |
| 21–23 | tira do rodapé | bandeiras · mesa · a neve |

A galeria repete um padrão a cada 6: um **destaque** grande (posições 3, 9, 15),
quatro retratos e uma **faixa larga** que atravessa a página (8, 14, 20). As
faixas largas precisam ser fotos deitadas, senão ficam muito cortadas.

**As legendas são um chute meu** — aparecem no hover. Troque em `PHOTOS`, campo
`cap`, dentro de `fonte/index.html`. As que mais pedem um nome de verdade são a
22 ("Mesa de sempre") e a 19 ("Entre um evento e outro").

Sobraram 6 fotos do Drive, parecidas demais com as escolhidas. Para usar alguma,
salve em `assets/fotos/` com o número seguinte e acrescente uma linha em `PHOTOS`.

---

## 4. Trocar presentes, valores e desafios

Tudo fica em listas no topo do script de **`fonte/index.html`** (depois rode
`python3 embutir.py`):

- `GIFTS` — os 13 presentes (código, título, valor, piada).
- `CHALLENGES` — os 7 micos, de R$600 a R$3.000. O último tem `final:true` e
  ocupa a linha inteira. **Confira se você topa cumprir cada um** antes de
  publicar; são promessas suas.
- `PHOTOS` — as 23 fotos e suas legendas (em `fonte/index.html`).
- `lembrancinha(v)` — a faixa de lembrancinha por valor doado.
- `DATA_EMBARQUE` — alimenta a contagem regressiva.

O cartão de **valor livre** aparece sozinho no fim da grade; quem quiser mandar
qualquer outra quantia usa ele.

---

## 5. Publicar

**Prévia no WhatsApp:** `assets/og.jpg` é a imagem que aparece quando alguém
manda o link. Depois de publicar, troque as duas tags para a URL completa,
senão alguns aplicativos não acham a imagem:

```html
<meta property="og:image" content="https://SEU-SITE.netlify.app/assets/og.jpg">
<meta name="twitter:image" content="https://SEU-SITE.netlify.app/assets/og.jpg">
```

Netlify → *Add new site* → *Deploy manually* → arraste a pasta.
Ou conecte este repositório e mande publicar a raiz do projeto.

---

## Como o site foi construído

Efeitos, todos escritos à mão, sem biblioteca:

| Efeito | Onde |
|---|---|
| Object Reveal on Hover | mala 3D de couro que substitui o cursor sobre os presentes |
| Portal Animation (scroll) | o lado de lá cresce em círculo por cima do lado de cá |
| 3D Product Animation | Golden Dome interativo: arraste para girar, role para aproximar |
| TextPressure | título "HEITOR" reage à proximidade do cursor |
| Cursor interativo | anel + poeira dourada que se afasta do ponteiro |
| Hero animada | canvas próprio com poeira em profundidade e paralaxe |
| Galeria editorial | fotos em duotone azul, cor plena e legenda no hover |

O Three.js e a biblioteca de QR foram **removidos de propósito** e substituídos
por implementações próprias: um renderizador 3D por software em canvas 2D e um
encoder de QR completo. Com as 23 fotos embutidas o `index.html` dá 2,8 MB e não busca nada de fora
além das fontes do Google e do vídeo. Verificado abrindo o arquivo por `file://`,
sem servidor: fotos, cúpula 3D e QR Code funcionam todos.

Acessibilidade e robustez: sem rolagem horizontal em nenhuma largura, foco de
teclado visível, `prefers-reduced-motion` respeitado, e todo texto de visitante é
escapado antes de ir para a tela.
