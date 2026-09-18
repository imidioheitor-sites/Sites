# GOODBOX — site pronto para publicar 💚

O site inteiro é **um arquivo só: `index.html`**. Fotos, logo e estilos já estão
dentro dele. Não precisa instalar nada, não precisa de "build", não precisa de banco de dados.

---

## ⚡ Publicar em 2 minutos (recomendado: Netlify — de graça)

1. Acesse **https://app.netlify.com/drop**
2. **Arraste a pasta inteira** deste zip para a página.
3. Pronto. Ele te dá um endereço tipo `https://goodbox-abc123.netlify.app`.
4. Para usar seu domínio (ex.: `goodboxrp.com.br`): *Site settings → Domain management → Add domain*.

> O HTTPS (cadeado) é ativado sozinho e é **grátis**. Isso é obrigatório: o WhatsApp,
> o Pix e o vídeo só funcionam bem em HTTPS.

### Outras opções (todas gratuitas e igualmente boas)

| Serviço | Como publicar |
|---|---|
| **Vercel** | https://vercel.com → *Add New → Project* → arraste a pasta |
| **Cloudflare Pages** | https://pages.cloudflare.com → *Upload assets* |
| **GitHub Pages** | Suba o `index.html` no repositório → *Settings → Pages* |
| **Hostinger / cPanel** | Envie `index.html` + `.htaccess` para a pasta `public_html` |

Já deixei os arquivos de configuração prontos: `netlify.toml`, `vercel.json` e `.htaccess`.
Você não precisa mexer neles — cada serviço lê o seu automaticamente e ignora os outros.

---

## 👥 Aguenta vários clientes ao mesmo tempo?

**Sim, e com folga.** Vale explicar o porquê, porque isso é o ponto forte dessa escolha:

O site é **estático** — o servidor só entrega um arquivo pronto, não fica "processando"
nada para cada visitante. Todos os serviços da tabela acima entregam esse arquivo por
uma **CDN** (uma rede de servidores espalhados pelo mundo). Na prática:

- **Não existe limite prático de visitantes simultâneos.** 10 ou 10.000 pessoas ao
  mesmo tempo é indiferente — não tem servidor para "cair" nem banco para travar.
- Cada visitante tem **seu próprio carrinho**, guardado no navegador dele. Um cliente
  nunca vê o carrinho do outro.
- Os pedidos chegam por **WhatsApp**, então não há fila nem processamento no site.
- Com o **backend ligado** (veja o `BACKEND.md`), o cardápio ainda vem do Supabase,
  que também aguenta esse volume tranquilamente — e se ele ficar fora do ar, o site
  usa o cardápio embutido e continua vendendo.
- O plano gratuito do Netlify inclui **100 GB/mês** de tráfego. Como cada visita
  usa por volta de 5 MB, isso dá **aproximadamente 20 mil visitas por mês de graça**.

### Se um dia o tráfego crescer muito
Só nesse caso vale otimizar. A forma mais simples é tirar as fotos de dentro do HTML
e servi-las como arquivos separados (a pasta `midia-original/` já tem todas), o que
derruba o peso da página de ~5 MB para poucos KB, já que as fotos passam a ficar em
cache no navegador do cliente. Me chame que eu faço essa versão.

---

## 🍱 O cardápio

São **39 pratos** em 8 categorias, mais o item de **Dieta personalizada** (que
não vai para o carrinho — abre o WhatsApp para você passar o orçamento):

| Categoria | Pratos | Tamanhos |
|---|---|---|
| Arroz branco | 8 | Light 250g · Balance 350g |
| Arroz integral | 8 | Light 250g · Balance 350g |
| Linha da Roça FIT | 5 | Light 250g · Balance 350g |
| Sem arroz | 4 | Light 250g · Balance 350g |
| Massas FIT | 4 | tamanho único |
| Tortas & Quibes | 4 | tamanho único |
| Caldos | 5 | tamanho único |

No carrinho, Light e Balance entram como itens separados, e o tamanho aparece
no pedido que chega no seu WhatsApp.

> **Massas FIT, Tortas & Quibes e Caldos** são **tamanho único** — confirmado
> por você. Se um dia algum deles passar a ter Light e Balance, é um clique: na
> Área do lojista, no prato, clique em **"usar 2 tamanhos"**.

### 💰 Preços

Os preços que a cliente enviou já estão aplicados. Nas marmitas com escolha de
tamanho, o valor depende da proteína:

| | Light 250g | Balance 350g |
|---|---|---|
| **Frango** | R$ 25,00 | R$ 32,00 |
| **Carne** | R$ 27,00 | R$ 36,00 |

Vale para **Arroz branco, Arroz integral, Linha da Roça FIT e Sem arroz**.

**Tamanho único:**

| Item | Preço |
|---|---|
| Tortinha FIT de Frango · de Ricota com Alho Poró · Vegetariana de Legumes | R$ 18,00 |
| Quibe Low Carb de Patinho com Quinoa | R$ 20,00 |
| Os 5 caldos (inclusive o Creme de Legumes) | R$ 26,00 |
| Massas com frango (Panqueca de Frango · Fusilli com Frango e Brócolis) | R$ 32,00 |
| Massas com patinho (Panqueca de Patinho · Penne à Bolonhesa) | R$ 36,00 |

✅ **Os 39 pratos estão com preço.** Nenhum item aparece como "a definir" e todos
podem ser adicionados ao carrinho.

O selo **"A partir de R$ 25,00 · a marmita"** no topo do site é calculado
sozinho: ele pega o **menor preço entre as marmitas** (Arroz branco, Arroz
integral, Linha da Roça FIT e Sem arroz). Caldos, tortinhas e massas ficam de
fora da conta, porque o cartão do topo mostra uma marmita.

Ou seja: se você mudar o preço do frango Light, o selo se atualiza sozinho — não
precisa mexer em nada. Para incluir ou tirar uma categoria dessa conta, edite a
lista `CATS_MARMITA` no `index.html`.

#### Mudar preços depois

Na **Área do lojista** (menu "Gerenciar", senha `goodbox2026`), cada prato tem
suas próprias linhas de tamanho, com **nome, peso e preço** editáveis. É ali que
você acerta o que fugir do padrão — por exemplo, um prato que custe mais caro que
os outros da mesma categoria.

Se um prato de tamanho único passar a ter as duas opções (ou o contrário), use
o botão **"usar 2 tamanhos"** / **"usar tamanho único"** ao lado do título
*Tamanhos e preços*.

Ao **adicionar um prato novo**, ele nasce sem preço e aparece uma **caixa
amarela** no topo do painel: preencha **Light**, **Balance** ou **Tamanho
único** e clique em **"Aplicar aos sem preço"**. Ela só mexe nos pratos sem
preço — nunca sobrescreve um valor já definido — e some sozinha quando todos
estiverem preenchidos.

#### Não esqueça de publicar

No **modo local** (como vem por padrão), os preços ficam salvos só no seu
navegador. Para os clientes verem, use **"Exportar código"** e republique — ou
ligue o **modo servidor** (veja o `BACKEND.md`), em que salvar já vale para
todo mundo.

---

## 🔐 Área do lojista (mudar preços e produtos)

No menu do site, clique em **"Gerenciar"**. A senha é:

```
goodbox2026
```

Lá você **adiciona produtos, troca fotos, edita preços, pesos, descrições e categorias**.

### Dois modos de funcionamento

**Modo local (como vem por padrão).** As alterações ficam salvas **apenas no seu
navegador** — os clientes não as veem. Para publicá-las: clique em **Exportar
código**, copie, abra o `index.html` num editor de texto, substitua o bloco que
começa com `let MENU = [` (até o `];`) e publique de novo.

**Modo servidor (recomendado).** Você muda o preço uma vez e **todos os clientes
veem na hora**, sem editar arquivo nenhum. A Área do lojista passa a pedir um
login de verdade (e-mail + senha), bem mais seguro que a senha padrão.

👉 Para ligar o modo servidor, siga o **`BACKEND.md`** — leva ~10 minutos, é
gratuito, e o site continua sendo publicado do mesmo jeito (arrastar no Netlify).

Ao entrar na Área do lojista, uma faixa no topo do painel diz em qual modo você
está: **verde** = servidor ligado, **amarelo** = modo local.

### ⚠️ Sobre a senha padrão

No modo local, a senha `goodbox2026` **não é uma proteção de verdade**: ela evita
o acesso casual, mas fica visível para quem abrir o código-fonte da página. Serve
para o seu uso do dia a dia, mas não trate como um cofre.

No **modo servidor** isso deixa de ser um problema: o login passa a ser real e as
regras de segurança do banco impedem que outra pessoa altere os seus preços.

---

## ✍️ Outros ajustes rápidos (dentro do `index.html`)

Procure o bloco `const CONFIG = {` logo no começo do `<script>`:

| Campo | O que é | Valor atual |
|---|---|---|
| `whatsapp` | Número que recebe os pedidos | `5516997738430` |
| `whatsappLabel` | Como aparece na tela | `(16) 99773-8430` |
| `instagram` | Seu @ sem o arroba | `good.boxsaudavel` |
| `pixKey` | Chave Pix — CNPJ, gera o QR Code | `29397334000122` |
| `pixNome` | Titular que aparece no app do banco | `GOOD BOX COMIDA SAUDAVEL` |
| `endereco` / `horario` | Aparecem no card de contato | Ribeirão Preto — SP |

✅ **Já conferidos com a cliente:** o Instagram `good.boxsaudavel`, a chave Pix
(CNPJ 29.397.334/0001-22, titular GOOD BOX COMIDA SAUDAVEL LTDA) e o endereço.
Mesmo assim, vale fazer **um pedido de teste com valor baixo** para ver o Pix
cair na conta certa antes de divulgar.

O mapa da seção Localização aponta **só para "Ribeirão Preto — SP"**, sem rua nem
número, porque a operação é de produção e delivery e não tem ponto físico para
receber cliente. Não há endereço de rua em nenhum lugar do site.

---

## 📁 O que tem neste zip

```
index.html          ← O SITE (é só isso que precisa ser publicado)
COMECE-AQUI.md      ← este guia
og-image.jpg        ← imagem que aparece ao mandar o link no WhatsApp/Instagram
BACKEND.md          ← como ligar o backend (preços iguais para todos os clientes)
supabase-setup.sql  ← script que cria o banco (usado no BACKEND.md)
netlify.toml        ← configuração do Netlify (cache/segurança)
vercel.json         ← configuração da Vercel
_headers            ← configuração do Cloudflare Pages
.htaccess           ← configuração de hospedagem Apache/cPanel/Hostinger
robots.txt          ← libera o site para o Google
midia-original/     ← suas fotos, o vídeo e a logo em alta qualidade
```

Envie **a pasta inteira** — assim o `og-image.jpg` vai junto.

### 🔗 Deixar o link bonito no WhatsApp

Quando alguém compartilha o link, aparece um cartão com imagem — é o `og-image.jpg`.
Para ele funcionar 100%, depois de publicar faça **um ajuste de uma linha**: abra o
`index.html`, procure por `og:image` (linha ~14) e troque

```html
<meta property="og:image" content="og-image.jpg" />
```

pelo endereço completo do seu site, por exemplo:

```html
<meta property="og:image" content="https://goodboxrp.com.br/og-image.jpg" />
```

Alguns aplicativos aceitam o caminho curto, mas o WhatsApp e o Facebook preferem o
endereço completo — por isso vale fazer essa troca assim que você tiver o domínio.

A pasta `midia-original/` **não é usada pelo site** (está tudo embutido no HTML).
Ela é o seu backup, para reaproveitar as imagens em posts, cardápios ou etiquetas.

---

## ✅ Antes de divulgar, teste

- [ ] Abrir o site no **celular** e no computador
- [ ] Adicionar itens ao carrinho e finalizar — **o WhatsApp abre com o pedido certo?**
- [ ] Conferir o **QR Code do Pix** com o app do banco (valor e destinatário)
- [ ] Entrar na Área do lojista e conferir os **preços** (os 39 já estão preenchidos)
- [ ] Verificar se o endereço do mapa está certo
