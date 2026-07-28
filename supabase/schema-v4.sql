-- ============================================================================
-- Vcore — Extensión v4: ficha ampliada de clientes (CRM)
-- Correlo en: Supabase → SQL Editor → New query → Run
-- Idempotente: podés correrlo múltiples veces.
--
-- Si todavía NO corriste schema-v3.sql, corré ese: ya incluye esta columna y no
-- hace falta ejecutar este archivo.
--
-- Los clientes no viven en una tabla propia: se derivan de los pedidos con
-- union-find (ver src/admin-clientes.jsx). Por eso la ficha ampliada se guarda
-- replicada en cada pedido del cliente, dentro de un único jsonb:
--   {
--     razonSocial: text,   condIva: text,     provincia: text,
--     instagram:   text,   cumple:  'YYYY-MM-DD',
--     categoria:   'minorista' | 'mayorista' | 'distribuidor' | 'revendedor' | '',
--     canal:       text,   tags: text[],      activo: boolean,
--     notasLog:    [{ id, ts, texto, autor }]
--   }
-- ============================================================================

alter table public.orders add column if not exists customer_meta jsonb default '{}'::jsonb;

-- Los pedidos existentes quedan con {} y la ficha se completa desde el panel:
-- Clientes → (clic en el cliente) → Editar datos.
update public.orders set customer_meta = '{}'::jsonb where customer_meta is null;
