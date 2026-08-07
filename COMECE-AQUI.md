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
- O plano gratuito do Netlify inclui **100 GB/mês** de tráfego. Como cada visita
  usa por volta de 5 MB, isso dá **aproximadamente 20 mil visitas por mês de graça**.

### Se um dia o tráfego crescer muito
Só nesse caso vale otimizar. A forma mais simples é tirar as fotos de dentro do HTML
e servi-las como arquivos separados (a pasta `midia-original/` já tem todas), o que
derruba o peso da página de ~5 MB para poucos KB, já que as fotos passam a ficar em
cache no navegador do cliente. Me chame que eu faço essa versão.

---

## 🔐 Área do lojista (mudar preços e produtos)

No menu do site, clique em **"Gerenciar"**. A senha é:

```
goodbox2026
```

Lá você **adiciona produtos, troca fotos, edita preços, pesos, descrições e categorias**.

### ⚠️ Muito importante — leia isto

As alterações que você faz ali ficam salvas **apenas no seu navegador** (no seu
computador ou celular). **Os clientes não veem essas mudanças.**

Isso é uma limitação real de um site sem servidor, e é bom saber disso desde já:
não existe um "banco de dados" comum onde salvar. Para que **todos os clientes**
vejam os preços novos, o caminho é:

1. Faça as mudanças na Área do lojista.
2. Clique em **"Exportar código"** e depois em **"Copiar código"**.
3. Abra o `index.html` num editor de texto (o Bloco de Notas serve).
4. Procure a linha que começa com `let MENU = [` e substitua **todo esse bloco**
   (até o `];`) pelo código que você copiou.
5. Publique de novo (no Netlify Drop, é só arrastar a pasta outra vez).

Também vale saber: **a senha não é uma proteção de verdade.** Ela evita o acesso
casual, mas fica visível para quem souber abrir o código-fonte da página. Ela serve
bem para o seu uso do dia a dia, mas não trate como um cofre.

> **Quer que os preços mudem sozinhos para todos os clientes, sem editar arquivo?**
> Isso é totalmente possível, mas exige um pequeno backend (Supabase ou Firebase,
> ambos com plano gratuito). É um passo a mais, e eu posso montar se você quiser.

---

## ✍️ Outros ajustes rápidos (dentro do `index.html`)

Procure o bloco `const CONFIG = {` logo no começo do `<script>`:

| Campo | O que é | Valor atual |
|---|---|---|
| `whatsapp` | Número que recebe os pedidos | `5516997738430` |
| `whatsappLabel` | Como aparece na tela | `(16) 99773-8430` |
| `instagram` | Seu @ sem o arroba | `good.boxsaudavel` |
| `pixKey` | Chave Pix (gera o QR Code) | `29397334000122` |
| `endereco` / `horario` | Aparecem no card de contato | Ribeirão Preto — SP |

⚠️ **Confirme a chave Pix e o Instagram** antes de divulgar o site — vale fazer um
pedido de teste com valor baixo para ver se o Pix cai na conta certa.

O mapa da seção Localização está apontando para "Ribeirão Preto" em geral. Se quiser
o endereço exato, procure por `google.com/maps?q=` no arquivo e troque o endereço.

---

## 📁 O que tem neste zip

```
index.html          ← O SITE (é só isso que precisa ser publicado)
COMECE-AQUI.md      ← este guia
og-image.jpg        ← imagem que aparece ao mandar o link no WhatsApp/Instagram
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
- [ ] Entrar na Área do lojista e conferir os **preços**
- [ ] Verificar se o endereço do mapa está certo
