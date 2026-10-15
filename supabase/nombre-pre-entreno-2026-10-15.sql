-- ============================================================================
-- Vcore — el Pre-Entreno pierde "Remolacha" en el título (15/10/2026)
-- ----------------------------------------------------------------------------
-- "Pre-Entreno Remolacha" -> "Pre-Entreno". El subtítulo ("Pre-entreno a base
-- de remolacha"), el id, los precios y la foto no cambian. Los pedidos ya
-- hechos conservan el nombre con el que se guardaron.
-- Solo toca la fila si todavía tiene el nombre viejo (o ya el nuevo).
-- Correr en el proyecto tojwsfhjvfglutyudspj (el de public/config.js).
-- ============================================================================

begin;

do $$
declare n int;
begin
  update public.products
     set name = 'Pre-Entreno'
   where id = 'pre-entreno-remolacha'
     and name in ('Pre-Entreno Remolacha', 'Pre-Entreno');
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'El Pre-Entreno cambió de nombre desde el 15/10 o no existe: revisarlo antes de correr';
  end if;
end $$;

commit;

-- Verificación:
--   select id, name, sub from public.products where id = 'pre-entreno-remolacha';
