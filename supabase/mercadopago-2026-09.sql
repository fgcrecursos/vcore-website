-- Medios de pago y cobro con Mercado Pago (30/09/2026).
-- Idempotente: no toca datos existentes. Correr en el proyecto tojwsfhjvfglutyudspj.
--   orders.pago_metodo  medio elegido en el checkout: tarjeta | transferencia |
--                       efectivo | mercadopago | cuotas
--   orders.mp           estado del cobro por Mercado Pago (lo escribe mp-webhook)
--   config.cbu          CBU/CVU que se muestra al pagar por transferencia
--   config.mercado_pago_activo  interruptor del panel (Configuración)
alter table public.orders add column if not exists pago_metodo text;
alter table public.orders add column if not exists mp jsonb;
alter table public.config add column if not exists cbu text;
alter table public.config add column if not exists mercado_pago_activo boolean not null default false;

-- Que PostgREST vea las columnas nuevas sin esperar.
notify pgrst, 'reload schema';
