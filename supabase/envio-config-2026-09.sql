-- Montos de envío editables desde el panel (Descuentos → Envíos).
-- Agrega la columna `envio` (jsonb) a la tabla `config`. Idempotente: no toca
-- datos existentes. Mientras esté vacía, la tienda usa los valores de fábrica
-- de src/data.jsx (ENVIO_DEFAULT): sucursal gratis desde $180.000, domicilio
-- gratis desde $280.000, sucursal $7.500 y los costos por zona.
alter table public.config add column if not exists envio jsonb;

-- Que PostgREST vea la columna nueva sin esperar.
notify pgrst, 'reload schema';
