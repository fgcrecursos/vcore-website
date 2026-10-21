-- Datos de transferencia de Vcore, iguales a los de Somos Setas (21/10/2026).
-- Antes estaban vacíos, así que el remito no imprimía ningún dato de transferencia
-- y el carrito decía "Te los pasamos por WhatsApp".
-- Alternativa sin SQL: panel -> Configuración -> Datos que imprime el remito.
update public.config
set alias   = 'ECOANDINO',
    banco   = 'GALICIA',
    cuit    = '20-32122426-2',
    titular = 'JUAN SANTI'
where id = 1
returning id, alias, banco, cuit, titular;
