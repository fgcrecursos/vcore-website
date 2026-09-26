-- ============================================================================
-- Vcore — Lista de precios "LISTA MAYORISTA 10.09.26rev1" (26/09/2026)
-- ----------------------------------------------------------------------------
-- Se cruzaron los 30 suplementos de Vcore contra la lista nueva y el único
-- que cambia es el Bicarbonato de Sodio (baja de precio):
--   500 g   9.500 /  6.650  ->   6.000 / 4.200
--   1 kg   18.000 / 12.600  ->  12.000 / 8.400
-- (precio = SUGERIDO/MENOR · priceMayorista = MAYORISTA)
--
-- Solo toca `variants` y `price` de esa fila. Si el producto no está como
-- estaba al generar el script (alguien lo editó desde el panel), se corta
-- sin cambiar nada. Idempotente: si ya tiene los precios nuevos, no hace nada.
-- Correr en el proyecto tojwsfhjvfglutyudspj (el de public/config.js).
-- Mismo cambio que update_precios_2026-09-10.sql de Somos Setas.
-- ============================================================================

begin;

do $$
declare n int;
begin
  update public.products
     set variants = '[{"label": "500 g", "price": 6000, "priceMayorista": 4200}, {"label": "1 kg", "price": 12000, "priceMayorista": 8400}]'::jsonb,
         price = 6000
   where id = 'bicarbonato-sodio'
     and variants::jsonb in (
       '[{"label": "500 g", "price": 9500, "priceMayorista": 6650}, {"label": "1 kg", "price": 18000, "priceMayorista": 12600}]'::jsonb,
       '[{"label": "500 g", "price": 6000, "priceMayorista": 4200}, {"label": "1 kg", "price": 12000, "priceMayorista": 8400}]'::jsonb
     );
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'El Bicarbonato de Sodio cambió desde el 26/09 o no existe: revisarlo antes de correr';
  end if;
end $$;

commit;

-- Verificación:
--   select id, price, variants from public.products where id = 'bicarbonato-sodio';
