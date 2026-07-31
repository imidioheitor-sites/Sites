# Site de Aniversário & Despedida — Heitor Imídio · 16/08

Arquivo único: **`index.html`**. Sem build, sem npm, sem dependências de JavaScript
ou CSS externas. Arraste para o Netlify e está no ar.

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

O vídeo (15 s, 1080p, sem áudio, gerado por IA) está sendo carregado direto do
CDN do Higgsfield. **Não consegui baixá-lo para dentro do repositório** porque a
política de rede desta sessão bloqueia aquele domínio.

Recomendo tornar o site independente disso:

1. Baixe: <https://d8j0ntlcm91z4.cloudfront.net/user_3Fn9kvwewWSxcmhyI5mG7uDadG8/hf_20260729_020941_4feb023f-04f8-4951-b19b-64296a2b1cde.mp4>
2. Salve como `assets/hero.mp4` ao lado do `index.html`.

O HTML já tenta o arquivo local primeiro e só cai no CDN se ele não existir —
não precisa mexer em nada além de colocar o arquivo no lugar.

---

## 3.5 As fotos

As 11 fotos já estão em `assets/fotos/` (`01.jpg` … `11.jpg`), recortadas,
otimizadas e distribuídas por conteúdo:

| # | Onde aparece | Foto |
|---|---|---|
| 01–02 | flutuando na hero | aeroporto · a medalha |
| 03 | destaque quadrado da galeria | perfil com o avião ao fundo |
| 04–07 | galeria | dia de sol · criança · Genebra · restaurante |
| 08 | faixa larga da galeria | a bandeira do Brasil no palco |
| 09–11 | tira do rodapé | terno com as bandeiras · mesa · a neve |

A número 11 era um print de WhatsApp: recortei fora a interface do iPhone e
ficou só a foto.

**As legendas são um chute meu** — aparecem quando o mouse passa por cima.
Troque na lista `PHOTOS`, no topo do script; só o campo `cap` de cada uma.
A da foto 10 ("Mesa de sempre") é a que mais pede um nome de verdade.

Havia uma 12ª foto na pasta do Drive que não entrou: o layout tem exatamente
11 vagas. Para usá-la, salve como `12.jpg` e acrescente uma linha em `PHOTOS`.

---

## 4. Trocar presentes, valores e desafios

Tudo fica em listas no topo do script, fáceis de editar:

- `GIFTS` — os 13 presentes (código, título, valor, piada).
- `CHALLENGES` — os 7 micos, de R$600 a R$3.000. O último tem `final:true` e
  ocupa a linha inteira. **Confira se você topa cumprir cada um** antes de
  publicar; são promessas suas.
- `PHOTOS` — as 11 fotos e suas legendas.
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
| Galeria editorial | fotos em duotone azul, cor plena e legenda no hover |

O Three.js e a biblioteca de QR foram **removidos de propósito** e substituídos
por implementações próprias: um renderizador 3D por software em canvas 2D e um
encoder de QR completo. O `index.html` tem ~80 KB e não busca nada de fora além das fontes do Google.
Com as 11 fotos e a imagem de compartilhamento, a pasta toda dá ~1,5 MB.

Acessibilidade e robustez: sem rolagem horizontal em nenhuma largura, foco de
teclado visível, `prefers-reduced-motion` respeitado, e todo texto de visitante é
escapado antes de ir para a tela.
