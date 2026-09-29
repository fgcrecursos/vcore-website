-- Sucursal Andreani que eligió la clienta para retirar el pedido.
-- Agrega la columna `sucursal_andreani` (jsonb) a `orders`:
--   { id, codigo, numero, nombre, calle, localidad, provincia, cp }
-- Idempotente: no toca datos existentes. Correr en el proyecto tojwsfhjvfglutyudspj.
-- Mientras no esté, la tienda guarda el pedido igual (sin la columna) y la
-- sucursal queda escrita en shipping_label, así que no se pierde.
alter table public.orders add column if not exists sucursal_andreani jsonb;

-- Que PostgREST vea la columna nueva sin esperar.
notify pgrst, 'reload schema';
