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
  peso        text not null default '',
  preco       numeric(10,2) not null default 0 check (preco >= 0),
  categoria   text not null default 'fit' check (categoria in ('fit','sopa')),
  etiqueta    text not null default '',
  imagem      text not null default '',
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  atualizado  timestamptz not null default now()
);

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
-- As fotos ficam vazias aqui: o site usa as imagens já embutidas nele.
-- Depois, pela Área do lojista, você pode trocar cada foto.
-- ============================================================
insert into public.produtos (id, nome, descricao, peso, preco, categoria, etiqueta, ordem) values
  ('frango-quiabo',   'Frango com Quiabo',      'Sobrecoxa grelhada, quiabo salteado no azeite, arroz branco e feijão.', '250g', 26.90, 'fit',  'Mais pedido',      0),
  ('patinho-legumes', 'Patinho com Legumes',    'Patinho moído refogado, mix de legumes no vapor, arroz integral.',      '250g', 28.90, 'fit',  'Rico em proteína', 1),
  ('quibe-quinoa',    'Quibe de Quinoa',        'Quibe assado de quinoa com temperos frescos e salada.',                 '250g', 27.90, 'fit',  'Vegetariano',      2),
  ('canja',           'Canja de Galinha',       'Canja caseira com frango desfiado, arroz e legumes.',                   '400g', 22.90, 'sopa', 'Conforto',         3),
  ('creme-abobora',   'Creme de Abóbora',       'Creme aveludado de abóbora com toque de gengibre.',                     '400g', 21.90, 'sopa', 'Leve',             4)
on conflict (id) do nothing;

-- ============================================================
-- PRONTO. Confira com:
--   select id, nome, preco, ativo from public.produtos order by ordem;
-- ============================================================
