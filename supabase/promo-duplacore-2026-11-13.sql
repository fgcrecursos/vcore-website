-- ============================================================================
-- Vcore — Promo de DuplaCore hasta el 13/11/2026
-- ----------------------------------------------------------------------------
-- Minorista 38.000 -> 34.000 hasta el 13/11 inclusive (hora de Argentina). Desde
-- el 14/11 la tienda y el cobro vuelven solos a 38.000. El mayorista (26.600) no
-- cambia. La promo también se puede editar o quitar desde el panel:
-- Productos -> DuplaCore -> Promoción.
--
-- CORRERLO RECIÉN AL PUBLICAR la versión que entiende promos (commit 6bfc88e):
-- con la tienda vieja publicada, la página mostraría 38.000 y el cobro con
-- Mercado Pago calcularía 34.000, y frenaría el pago por "los precios cambiaron".
--
-- Solo toca DuplaCore, y solo si su presentación sigue como el 15/10.
-- Correr en el proyecto tojwsfhjvfglutyudspj (el de public/config.js).
-- ============================================================================

begin;

do $$
declare n int;
begin
  update public.products
     set variants = '[{"label": "Creatina 150 g + Pre-Entreno 200 g", "pesoG": 430, "price": 38000, "priceMayorista": 26600, "pricePromo": 34000, "promoHasta": "2026-11-13"}]'::jsonb,
         price = 38000
   where id = 'duplacore'
     and variants::jsonb in (
       '[{"label": "Creatina 150 g + Pre-Entreno 200 g", "pesoG": 430, "price": 38000, "priceMayorista": 26600}]'::jsonb,
       '[{"label": "Creatina 150 g + Pre-Entreno 200 g", "pesoG": 430, "price": 38000, "priceMayorista": 26600, "pricePromo": 34000, "promoHasta": "2026-11-13"}]'::jsonb
     );
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'DuplaCore cambió desde el 15/10 o no existe: revisarlo antes de correr';
  end if;
end $$;

commit;

-- Verificación:
--   select id, price, variants from public.products where id = 'duplacore';
