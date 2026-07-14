-- ============================================================================
-- Vcore — Extensión v2: banners editables + campos de cliente/pagos en orders
-- Correlo en: Supabase → SQL Editor → New query → Run
-- Idempotente: podés correrlo múltiples veces.
-- ============================================================================

-- ---------- BANNERS DEL HERO ------------------------------------------------
create table if not exists public.banners (
  id         text primary key,
  eyebrow    text default '',
  title      text default '',
  subtitle   text default '',
  cta_label  text default '',
  cta_href   text default '',
  photo      text default '',                    -- URL Cloudinary (opcional)
  bg         text default 'var(--gradient-ink-bloom)',
  active     boolean default true,
  sort       integer default 0,
  created_at timestamptz default now()
);

alter table public.banners enable row level security;
drop policy if exists banners_read_public on public.banners;
drop policy if exists banners_admin       on public.banners;
create policy banners_read_public on public.banners for select using (active = true);
create policy banners_admin       on public.banners for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- CAMPOS EXTRA EN ORDERS ------------------------------------------
-- Cliente (para agrupar en CRM) + pagos (array JSON) + estado de cobro + origen
alter table public.orders add column if not exists customer_email       text default '';
alter table public.orders add column if not exists customer_dni         text default '';
alter table public.orders add column if not exists customer_address     text default '';
alter table public.orders add column if not exists customer_city        text default '';
alter table public.orders add column if not exists customer_postal_code text default '';
alter table public.orders add column if not exists payments             jsonb default '[]'::jsonb;
alter table public.orders add column if not exists payment_status       text default 'pendiente'; -- pendiente | parcial | pagado | anulado
alter table public.orders add column if not exists origen               text default 'web';       -- web | manual
alter table public.orders add column if not exists notes                text default '';

-- ---------- SEED DE BANNERS DE EJEMPLO --------------------------------------
insert into public.banners (id, eyebrow, title, subtitle, cta_label, cta_href, bg, active, sort)
values
  ('b1', 'Nutrición & Rendimiento',
   'Más rendimiento, menos complicaciones.',
   'Suplementación funcional para quienes entienden que el cuerpo merece lo mejor. Sin rellenos, sin vueltas.',
   'Ver productos', '#/tienda',
   'var(--gradient-ink-bloom)', true, 0),
  ('b2', 'Pureza certificada',
   'Formulaciones limpias. Sin rellenos innecesarios.',
   'Seleccionamos insumos de primer nivel y formulamos con precisión. Etiquetas honestas, sin promesas infladas.',
   'Ver catálogo', '#/tienda',
   'linear-gradient(130deg, #0b2d1c 0%, #0d3d25 40%, #156638 72%, #1e8a4e 100%)', true, 1)
on conflict (id) do nothing;

-- ============================================================================
-- LISTO. Los pedidos existentes reciben defaults automáticamente.
-- Las secciones nuevas del panel (Banners, Clientes, Cuenta corriente,
-- Facturación) ya pueden usar estas tablas.
-- ============================================================================
