-- ============================================================================
-- Vcore — Esquema de base de datos (Supabase / PostgreSQL)
-- Pegá TODO este archivo en: Supabase → SQL Editor → New query → Run
-- Es idempotente: podés correrlo varias veces sin romper nada.
-- ============================================================================

-- ---------- PRODUCTOS --------------------------------------------------------
create table if not exists public.products (
  id          text primary key,                 -- slug, ej: 'creatina'
  name        text not null,
  sub         text default '',
  category    text default 'Bienestar',
  badge       text default '',
  blurb       text default '',
  tone        text default 'green',             -- green | sage | navy | paper
  photo       text default '',                  -- URL (Cloudinary) o vacío
  variants    jsonb default '[]'::jsonb,         -- [{ "label": "300 gr", "price": 14990 }]
  price       numeric default 0,                -- precio "desde" (menor variante)
  rating      numeric default 4.8,
  reviews     integer default 0,
  visible     boolean default true,
  featured    boolean default false,
  sort        integer default 0,                -- orden de aparición
  created_at  timestamptz default now()
);

-- ---------- PEDIDOS ----------------------------------------------------------
create table if not exists public.orders (
  id             text primary key,              -- ej: 'VC...'
  created_at     timestamptz default now(),
  customer_name  text default '',
  customer_phone text default '',
  summary        text default '',
  items          jsonb default '[]'::jsonb,      -- [{ name, sub, size, qty, price }]
  subtotal       numeric default 0,
  tier_name      text default '',
  tier_disc      numeric default 0,
  coupon_code    text default '',
  coupon_disc    numeric default 0,
  shipping_label text default '',
  shipping_cost  numeric default 0,
  total          numeric default 0,
  status         text default 'nuevo'           -- nuevo | confirmado | enviado | entregado
);

-- ---------- CÓDIGOS DE DESCUENTO --------------------------------------------
create table if not exists public.codes (
  id      text primary key,
  code    text unique not null,
  value   numeric default 10,                   -- porcentaje
  active  boolean default true,
  note    text default ''
);

-- ---------- CONFIGURACIÓN (fila única) --------------------------------------
create table if not exists public.config (
  id         integer primary key default 1,
  whatsapp   text default '5491100000000',
  address    text default '',
  instagram  text default '',
  email      text default '',
  constraint config_singleton check (id = 1)
);
insert into public.config (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- SEGURIDAD (Row Level Security)
-- Público: solo LECTURA de productos/códigos activos/config, y puede CREAR pedidos.
-- Admin (usuario autenticado): acceso total.
-- ============================================================================
alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.codes    enable row level security;
alter table public.config   enable row level security;

-- PRODUCTOS: lectura pública, escritura solo autenticado
drop policy if exists products_read   on public.products;
drop policy if exists products_write  on public.products;
create policy products_read  on public.products for select using (true);
create policy products_write on public.products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- CÓDIGOS: el público solo ve los activos; admin ve/edita todo
drop policy if exists codes_read_public on public.codes;
drop policy if exists codes_admin       on public.codes;
create policy codes_read_public on public.codes for select using (active = true);
create policy codes_admin       on public.codes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- CONFIG: lectura pública, edición solo admin
drop policy if exists config_read  on public.config;
drop policy if exists config_write on public.config;
create policy config_read  on public.config for select using (true);
create policy config_write on public.config for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- PEDIDOS: el público SOLO puede crear (no leer); admin ve/edita/borra todo
drop policy if exists orders_insert_public on public.orders;
drop policy if exists orders_admin         on public.orders;
create policy orders_insert_public on public.orders for insert with check (true);
create policy orders_admin         on public.orders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- LISTO. Después de correr esto:
--   1) Authentication → Users → Add user: creá TU usuario admin (email + contraseña).
--   2) (Opcional) Cargá productos desde el panel de admin del sitio.
-- ============================================================================
