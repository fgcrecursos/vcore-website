-- ============================================================================
-- Vcore — Extensión v3: remitos, notas de crédito, cuenta corriente y usuarios
-- Correlo en: Supabase → SQL Editor → New query → Run
-- Idempotente: podés correrlo múltiples veces.
--
-- Deja el panel de Vcore con las mismas capacidades que el de Somos Setas:
--   · Remitos guardados dentro del pedido (numeración NN-DDMMYY, ítems, lotes,
--     descuentos, datos de despacho, crédito aplicado).
--   · Pedidos manuales generados desde el panel (origen = 'manual').
--   · Notas de crédito con detalle ítem por ítem.
--   · Roles y permisos por usuario del panel.
-- ============================================================================

-- ---------- CAMPOS EXTRA EN ORDERS ------------------------------------------
alter table public.orders add column if not exists remito         jsonb   default null;
alter table public.orders add column if not exists credit_notes   jsonb   default '[]'::jsonb;
alter table public.orders add column if not exists credit_applied numeric default 0;
alter table public.orders add column if not exists admin_notes    text    default '';
alter table public.orders add column if not exists entrega_tipo   text    default 'sucursal'; -- sucursal | domicilio | local
alter table public.orders add column if not exists notas_cliente  text    default '';

-- Ficha ampliada del cliente (CRM). Los clientes no viven en una tabla propia: se
-- derivan de los pedidos, así que la ficha se replica en cada pedido del cliente.
-- Va en un solo jsonb para no sumar una columna por dato: { razonSocial, condIva,
-- provincia, instagram, cumple, categoria, canal, tags[], activo, notasLog[] }.
alter table public.orders add column if not exists customer_meta  jsonb   default '{}'::jsonb;

-- Los pedidos manuales se crean desde el panel con una fecha propia: sin esto,
-- created_at siempre sería "ahora" y el pedido caería en el mes equivocado.
alter table public.orders alter column created_at set default now();

-- ---------- DATOS QUE IMPRIME EL REMITO -------------------------------------
-- El pie del remito lleva los datos de transferencia y la leyenda de la marca.
-- Se guardan en config para no hardcodear datos bancarios en el código.
alter table public.config add column if not exists banco           text default '';
alter table public.config add column if not exists alias           text default '';
alter table public.config add column if not exists cuit            text default '';
alter table public.config add column if not exists titular         text default '';
alter table public.config add column if not exists remito_leyenda  text default '';
alter table public.config add column if not exists remito_despacho text default 'DESPACHO PRODUCTO FINAL';
alter table public.config add column if not exists retiro          text default '';

-- ---------- USUARIOS DEL PANEL ----------------------------------------------
-- Una fila por persona con acceso. El rol define los permisos base y `permisos`
-- suma permisos sueltos encima (ver src/permissions.jsx).
create table if not exists public.vc_users (
  email      text primary key,
  nombre     text    default '',
  rol        text    default 'lectura',   -- superadmin | admin | ventas | catalogo | cobranzas | deposito | lectura | custom
  permisos   jsonb   default '[]'::jsonb,
  activo     boolean default true,
  notas      text    default '',
  created_at timestamptz default now()
);

alter table public.vc_users enable row level security;

-- Cualquier usuario autenticado puede LEER la tabla: necesita conocer sus propios
-- permisos para dibujar el panel. La escritura queda restringida a quien tenga el
-- permiso 'usuarios.gestionar' (rol superadmin, o permiso suelto).
drop policy if exists vc_users_read  on public.vc_users;
drop policy if exists vc_users_write on public.vc_users;

create policy vc_users_read on public.vc_users for select
  using (auth.role() = 'authenticated');

create policy vc_users_write on public.vc_users for all
  using (
    exists (
      select 1 from public.vc_users u
      where u.email = lower(auth.jwt() ->> 'email')
        and u.activo
        and (u.rol = 'superadmin' or u.permisos ? 'usuarios.gestionar')
    )
  )
  with check (
    exists (
      select 1 from public.vc_users u
      where u.email = lower(auth.jwt() ->> 'email')
        and u.activo
        and (u.rol = 'superadmin' or u.permisos ? 'usuarios.gestionar')
    )
  );

-- ---------- SEMILLA: primer acceso total ------------------------------------
-- Cambiá el email por el tuyo antes de correrlo si usás otra cuenta. Sin al menos
-- un superadmin cargado, el panel cae al fallback de src/permissions.jsx.
insert into public.vc_users (email, nombre, rol, activo)
values ('fngc279@gmail.com', 'Administrador', 'superadmin', true)
on conflict (email) do nothing;

-- ============================================================================
-- LISTO. Los pedidos existentes reciben defaults automáticamente:
-- remito = null (se genera al abrir la remitera), credit_notes = [], etc.
-- ============================================================================
