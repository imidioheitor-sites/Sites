# Backend do GOODBOX — preços iguais para todos os clientes

Sem backend, o site funciona perfeitamente, mas as edições da Área do lojista
ficam **só no seu navegador**. Com o backend ligado, você muda o preço uma vez
e **todos os clientes veem na hora**.

O backend usa o **Supabase** (banco Postgres com API pronta). O plano gratuito
sobra para o seu caso. O site continua sendo um arquivo estático — o Netlify
Drop continua funcionando igual.

---

## Passo a passo (uma vez só, ~10 minutos)

### 1. Criar o projeto
1. Entre em **https://supabase.com** → *Start your project* → crie a conta.
2. *New project* → escolha um nome (ex.: `goodbox`) e uma senha de banco
   (guarde-a; você não vai precisar dela no dia a dia).
3. Região: escolha **South America (São Paulo)** — o site fica mais rápido.
4. Espere ~2 minutos enquanto ele cria.

### 2. Criar as tabelas
1. No menu lateral, abra **SQL Editor** → *New query*.
2. Abra o arquivo **`supabase-setup.sql`** (vem no zip), copie **tudo** e cole.
3. Clique em **Run**. Deve aparecer *Success*.

Isso cria as tabelas `produtos` e `pedidos`, as regras de segurança e já
carrega os 5 pratos iniciais.

### 3. Criar o seu login
1. Menu lateral → **Authentication** → *Users* → **Add user** → *Create new user*.
2. Coloque o **seu e-mail** e uma **senha forte**. Marque *Auto Confirm User*.
3. É com esse e-mail e senha que você entra na Área do lojista do site.

> Use uma senha de verdade, diferente das suas outras. É ela que protege os
> seus preços.

### 4. Ligar o site no backend
1. Menu lateral → **Project Settings** → **API**.
2. Copie a **Project URL** e a chave **`anon` `public`**.
3. Abra o `index.html`, procure `supabaseUrl` e preencha:

```js
supabaseUrl: "https://xxxxxxxxxxx.supabase.co",
supabaseAnonKey: "eyJhbGciOiJI...",   // a chave anon public, bem longa
```

4. Publique de novo (arraste a pasta no Netlify).

**Pronto.** Agora a Área do lojista pede e-mail + senha, e tudo que você salvar
vale para todos os clientes.

---

## Como saber se está funcionando

Ao entrar na Área do lojista, aparece uma faixa no topo do painel:

| Faixa | O que significa |
|---|---|
| 🟢 *"Conectado como você@… — o que você salvar vale para todos os clientes"* | Backend ligado, tudo certo |
| 🟡 *"Modo local: as alterações ficam só neste navegador"* | Backend não configurado |
| 🔴 *"Não consegui salvar no servidor…"* | Ligou, mas deu erro (a mensagem explica) |

Teste real: mude um preço, abra o site em uma **janela anônima** e veja se o
preço novo aparece. Se aparecer, está funcionando.

---

## Sobre a chave `anon` ser pública

Ela fica visível no código do site — **isso é normal e esperado**, é assim que
o Supabase foi feito para funcionar. Quem protege os seus dados são as regras
de segurança (RLS) que o `supabase-setup.sql` criou:

- **Qualquer visitante pode:** ler o cardápio e criar um pedido.
- **Só você (logado) pode:** mudar preços, adicionar/remover produtos e ver os pedidos.

Ou seja: mesmo alguém pegando a chave `anon`, não consegue mexer nos preços.

> Isso é bem diferente da senha `goodbox2026` do modo sem backend, que é só um
> cadeado visual. Com o backend, a proteção é real.

---

## Ver os pedidos que chegaram

Todo pedido finalizado no site é gravado na tabela `pedidos` (além de ir para o
seu WhatsApp). Para consultar: **Table Editor → pedidos**, ou no SQL Editor:

```sql
select criado, cliente, total, pagamento, itens
from pedidos
order by criado desc
limit 50;
```

Se não quiser esse histórico, mude `salvarPedidos: true` para `false` no CONFIG.

---

## Perguntas comuns

**O site sai do ar se o Supabase cair?**
Não. Se o servidor não responder, o site usa o cardápio embutido no próprio
arquivo e continua vendendo normalmente pelo WhatsApp.

**As fotos também ficam no backend?**
Sim, quando você troca uma foto pela Área do lojista ela vai para o banco. As
fotos originais continuam embutidas no site como reserva. Prefira fotos abaixo
de 1,5 MB — o site avisa se passar disso.

**Preciso pagar?**
O plano gratuito do Supabase cobre bem um cardápio e o histórico de pedidos.
Projetos gratuitos são pausados após ~1 semana sem nenhum acesso; como o site
consulta o cardápio a cada visita, isso não deve acontecer com o site no ar.

**Posso continuar sem backend?**
Pode. Deixe `supabaseUrl` e `supabaseAnonKey` vazios e tudo funciona como antes,
com a senha `goodbox2026` e o botão "Exportar código".
