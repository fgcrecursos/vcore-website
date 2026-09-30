# Medios de pago y cobro con Mercado Pago

Mismo diseño que Somos Setas y **misma cuenta** de Mercado Pago (cada tienda marca sus cobros
con `vc:` o `ss:` y registra solo los suyos).

En el carrito, el cliente elige el **medio de pago** y toca **Realizar pedido** (también puede
seguir finalizando por WhatsApp):

| Medio | Cómo se cobra | Se confirma |
|---|---|---|
| Tarjeta de crédito o débito | Checkout de Mercado Pago, solo tarjetas | Solo |
| Transferencia bancaria | Banco, alias, CBU y titular de Configuración; el cliente manda el comprobante por WhatsApp | A mano, en Control de pagos |
| Efectivo | Cupón de Mercado Pago para Rapipago o Pago Fácil | Solo, cuando lo paga |
| Mercado Pago | Checkout de Mercado Pago sin restricciones | Solo |
| Cuotas sin Tarjeta de Mercado Pago | Checkout de Mercado Pago con Mercado Crédito | Solo |

Los cuatro medios de Mercado Pago aparecen solo con el interruptor encendido
(Configuración → Cobrar con Mercado Pago). Apagado, queda solo la transferencia.

## Cómo funciona

1. La tienda guarda el pedido (`pago_metodo`, y en `mp.envio` la opción y zona de envío) y
   llama a `mp-crear-pago`.
2. `mp-crear-pago` **recalcula el total** con `src/precios.js` (la misma cuenta que el carrito)
   usando el catálogo, los códigos y los envíos de la base. Si no coincide, no cobra. Si
   coincide, crea el cobro limitado al medio elegido y devuelve la URL de Mercado Pago.
3. `mp-webhook` recibe cada aviso, consulta el pago en Mercado Pago y, si está aprobado,
   agrega el cobro (método "MercadoPago") y pasa el pedido a **confirmado**. Si el monto no
   alcanza, registra el cobro pero no confirma y el panel lo marca "MP: monto distinto".
4. El cliente vuelve a `/?pago=<pedido>` y ve si el pago se aprobó, quedó en proceso o no se
   completó.

## Puesta en marcha (una sola vez)

1. Correr `supabase/mercadopago-2026-09.sql` en el SQL Editor del proyecto
   `tojwsfhjvfglutyudspj` (columnas `pago_metodo`, `mp`, `cbu`, `mercado_pago_activo`).
2. Cargar alias / CBU / titular / banco en Configuración → "Datos que imprime el remito":
   son los que ve el cliente que paga por transferencia.
3. Token (el mismo Access Token de la cuenta que usa Somos Setas) y funciones:

   ```bash
   npx supabase login
   npx supabase secrets set MP_ACCESS_TOKEN=APP_USR-… --project-ref tojwsfhjvfglutyudspj
   npx supabase functions deploy mp-crear-pago --no-verify-jwt --project-ref tojwsfhjvfglutyudspj
   npx supabase functions deploy mp-webhook --no-verify-jwt --project-ref tojwsfhjvfglutyudspj
   ```

4. Encender Configuración → Cobrar con Mercado Pago y probar con un pedido chico.

Opcional: `MP_WEBHOOK_SECRET` (clave secreta de webhooks de la aplicación) para validar la
firma de cada aviso.

## Si se cambian las reglas de precio

`src/precios.js` y `supabase/functions/_shared/precios.js` tienen que ser **el mismo
archivo**. Si se toca uno, copiarlo al otro y volver a deployar `mp-crear-pago`; si no, el
servidor rechaza el pago con "los precios cambiaron" (no cobra de menos).
