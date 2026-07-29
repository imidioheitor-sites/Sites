# Aniversário & Despedida — Heitor

Site de aniversário (16 de agosto) que também é despedida rumo à Engenharia
Mecânica em Notre Dame. As pessoas escolhem um **presente simbólico**, pagam
por **Pix** (QR Code ou copia e cola) e deixam uma mensagem no mural.

---

## ⚠️ Antes de publicar: 1 coisa obrigatória

Abra **`app.js`** e edite o bloco `CONFIG` no topo do arquivo:

```js
pix: {
  key:  'SUA-CHAVE-PIX-AQUI',   // 👈 TROQUE ISTO
  name: 'HEITOR IMIDIO SILVA',  // titular da conta, sem acento, máx 25 chars
  city: 'SAO PAULO',            // cidade do titular, sem acento, máx 15 chars
}
```

A chave pode ser CPF (só números), telefone (`+5511999999999`), e-mail ou
chave aleatória do banco.

Enquanto a chave não for trocada, o site funciona normalmente mas mostra um
**aviso amarelo** dentro do modal avisando que o QR Code é só exemplo e não
recebe pagamento. Assim ninguém paga errado por engano.

> Os QR Codes são gerados no padrão **BR Code do Banco Central** (EMV + CRC16).
> O gerador é testado contra o vetor oficial do CRC-16/CCITT-FALSE.

---

## Tempo real (opcional, mas recomendado)

Sem configurar nada, o site já funciona — mas o "já presenteado" fica salvo
só no navegador de cada pessoa. Para que **todo mundo veja o mesmo estado**:

1. Crie um projeto em <https://console.firebase.google.com>
2. Ative **Realtime Database** (modo teste já serve para uma festa)
3. Copie a config do projeto para `CONFIG.firebase` em `app.js`:

```js
firebase: {
  apiKey:      '...',
  authDomain:  '...',
  databaseURL: 'https://SEU-PROJETO.firebaseio.com',  // este é o essencial
  projectId:   '...',
}
```

Pronto: presentes e mensagens passam a sincronizar entre todos os aparelhos.
Se o Firebase cair, o site volta sozinho para o modo local em vez de quebrar.

---

## O vídeo do hero

O vídeo foi gerado com Higgsfield (15s, 1080p, sem áudio, elementos 3D e sem
texto). Ele está apontado por URL remota em `CONFIG.heroVideo.remote`.

**Recomendado:** baixe o arquivo e salve como `assets/hero.mp4` para não
depender de um CDN externo:

```bash
curl -L -o assets/hero.mp4 "<URL em CONFIG.heroVideo.remote>"
```

O site tenta `assets/hero.mp4` primeiro e cai para a URL remota
automaticamente. Se os dois falharem, o gradiente do hero assume — nunca fica
uma área preta vazia. Em conexões 2G ou com economia de dados o vídeo nem é
baixado.

---

## Publicar

```bash
node build.js        # gera dist/index.html — arquivo único autocontido
```

Depois arraste a pasta `dist/` para <https://app.netlify.com/drop>. Só isso.

Ou, se preferir, publique a pasta do projeto direto — `index.html`, `app.js`
e `scene.js` funcionam sem build.

---

## Editar a lista de presentes

Tudo fica em `app.js`, nos arrays `GIFTS` (presentes) e `DARES` (desafios):

```js
{ id:'bike', emoji:'🚲', title:'Uma bike pra andar no campus', price:1000,
  note:'O campus é gigante. Minhas pernas são finitas.',
  reward:'Lembrancinha: primeira volta de bike filmada' },
```

`reward` é a lembrancinha que aparece deslizando quando o cursor passa por
cima do cartão. `id` precisa ser único (é a chave usada no banco).

Data da festa: `CONFIG.partyDate`.

---

## O que tem no site

| Seção | Efeito |
|---|---|
| Hero | Vídeo 1080p + **TextPressure** (letras reagem ao cursor via fonte variável) |
| Portal | **Animação de portal dirigida por scroll** — túnel de partículas, 4 capítulos |
| O Presente | **Animação 3D de produto** em Three.js — arraste, aproxime, a tampa abre |
| Presentes | Grade com **revelação no hover** + brilho de borda que segue o cursor |
| História | Pilha de cartões que se revezam (CardSwap) |
| Mural | Mensagens em tempo real |
| Global | Cursor fluido dourado + anel magnético |

Tudo degrada com elegância: sem WebGL aparece um cubo 3D em CSS puro; sem
Firebase salva local; sem a lib de QR o copia-e-cola continua funcionando.
`prefers-reduced-motion` desliga as animações pesadas.

---

## Testes

```bash
python3 -m http.server 8899        # em um terminal
node smoke.js                      # em outro (precisa de playwright)
```

Cobre: renderização das 13 seções, fluxo completo de presente, validade do
payload Pix, overflow horizontal no mobile, sobreposição de texto no hero,
comportamento do sticky do portal e do crossfade.
