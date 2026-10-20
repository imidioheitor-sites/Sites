-- ============================================================
-- GOODBOX — criação do backend no Supabase
-- ------------------------------------------------------------
-- COMO USAR (uma vez só, leva ~2 minutos):
--   1. Entre em https://supabase.com e crie um projeto (plano grátis).
--   2. No menu lateral, abra "SQL Editor" e clique em "New query".
--   3. Cole TODO este arquivo e clique em "Run".
--   4. Vá em "Authentication > Users > Add user" e crie o SEU usuário
--      (e-mail + senha). É com ele que você entra na Área do lojista.
--   5. Em "Project Settings > API", copie a "Project URL" e a chave
--      "anon public" para o CONFIG do index.html.
-- ============================================================

-- ---------- PRODUTOS (o cardápio) ----------
create table if not exists public.produtos (
  id          text primary key,
  nome        text not null default '',
  descricao   text not null default '',
  categoria   text not null default 'arroz-branco',
  etiqueta    text not null default '',
  imagem      text not null default '',
  tipo        text,                         -- 'orcamento' no item de dieta personalizada
  -- tamanhos: [{"nome":"Light","peso":"250g","preco":29.90}, {...}]
  -- preco null = ainda nao definido (o prato aparece, mas nao entra no carrinho)
  tamanhos    jsonb not null default '[]'::jsonb,
  -- colunas do formato antigo, mantidas para compatibilidade
  peso        text not null default '',
  preco       numeric(10,2),
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  atualizado  timestamptz not null default now()
);

-- se a tabela ja existia no formato antigo, acrescenta o que falta
alter table public.produtos add column if not exists tamanhos jsonb not null default '[]'::jsonb;
alter table public.produtos add column if not exists tipo text;
alter table public.produtos alter column preco drop not null;
do $$ begin
  begin alter table public.produtos drop constraint produtos_categoria_check; exception when others then null; end;
  begin alter table public.produtos drop constraint produtos_preco_check;     exception when others then null; end;
end $$;

create index if not exists produtos_ativo_ordem_idx on public.produtos (ativo, ordem);

-- mantém "atualizado" sempre correto
create or replace function public.toca_atualizado()
returns trigger language plpgsql as $$
begin new.atualizado = now(); return new; end $$;

drop trigger if exists produtos_atualizado on public.produtos;
create trigger produtos_atualizado before update on public.produtos
  for each row execute function public.toca_atualizado();

-- ---------- PEDIDOS (histórico de vendas) ----------
create table if not exists public.pedidos (
  id          bigint generated always as identity primary key,
  criado      timestamptz not null default now(),
  cliente     text,
  endereco    text,
  observacao  text,
  pagamento   text,
  total       numeric(10,2) not null default 0,
  itens       jsonb not null default '[]'::jsonb
);

create index if not exists pedidos_criado_idx on public.pedidos (criado desc);

-- ============================================================
-- SEGURANÇA (RLS) — é isto que protege o seu cardápio.
-- A chave "anon" do site é pública de propósito; estas políticas
-- garantem que, com ela, dá para LER o cardápio e CRIAR um pedido,
-- mas NÃO dá para alterar preços. Alterar exige estar logado.
-- ============================================================
alter table public.produtos enable row level security;
alter table public.pedidos  enable row level security;

-- PRODUTOS: qualquer visitante lê; só usuário logado escreve.
drop policy if exists produtos_leitura_publica on public.produtos;
create policy produtos_leitura_publica
  on public.produtos for select
  to anon, authenticated
  using (true);

drop policy if exists produtos_escrita_logado on public.produtos;
create policy produtos_escrita_logado
  on public.produtos for all
  to authenticated
  using (true) with check (true);

-- PEDIDOS: o site pode criar um pedido; só você (logado) consegue ler.
drop policy if exists pedidos_cria_publico on public.pedidos;
create policy pedidos_cria_publico
  on public.pedidos for insert
  to anon, authenticated
  with check (true);

drop policy if exists pedidos_leitura_logado on public.pedidos;
create policy pedidos_leitura_logado
  on public.pedidos for select
  to authenticated
  using (true);

-- ============================================================
-- CARDÁPIO INICIAL
-- ============================================================
-- O site ja vem com o cardapio completo embutido. Ao entrar na Area do lojista
-- pela primeira vez e salvar, ele sobe inteiro para ca automaticamente.
-- Se preferir semear na mao, use o modelo abaixo como exemplo:
--
-- insert into public.produtos (id, nome, descricao, categoria, etiqueta, tamanhos, ordem) values
--   ('exemplo', 'Nome do prato', 'Descricao', 'arroz-branco', 'Mais pedido',
--    '[{"nome":"Light","peso":"250g","preco":29.90},{"nome":"Balance","peso":"350g","preco":34.90}]'::jsonb, 0)
-- on conflict (id) do nothing;

-- ============================================================
-- PRONTO. Confira com:
--   select id, nome, categoria, tamanhos, ativo from public.produtos order by ordem;
-- ============================================================
