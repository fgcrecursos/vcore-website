-- Alias de transferencia de Vcore: ECOANDINO (21/10/2026).
-- Antes estaba vacío, así que el remito no imprimía ningún dato de transferencia
-- y el carrito decía "Te los pasamos por WhatsApp".
-- Alternativa sin SQL: panel -> Configuración -> Alias de transferencia.
update public.config
set alias = 'ECOANDINO'
where id = 1
returning id, alias;
