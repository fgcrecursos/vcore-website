// =====================================================================
// VCORE — Edge Function: iniciar el cobro de un pedido con Mercado Pago
// =====================================================================
// La tienda guarda el pedido (pago_metodo: tarjeta | efectivo | mercadopago |
// cuotas) y llama a esta función con { orderId }. Acá se RECALCULA el total con
// el catálogo, los códigos y los envíos reales de la base: el pedido lo arma el
// navegador y cualquiera podría mandarlo con otro total. Si no coincide, no se
// cobra. Con el total verificado se crea una preferencia de Checkout Pro
// limitada al medio elegido y se devuelve la URL de pago. La acreditación la
// registra mp-webhook. Mismo diseño que Somos Setas (misma cuenta de MP).
//
// Deploy (sin verificación de JWT: la tienda llama con la publishable key, que
// no es un JWT; la función solo actúa sobre pedidos nuevos sin pagar):
//   supabase functions deploy mp-crear-pago --no-verify-jwt
// Secretos:
//   supabase secrets set MP_ACCESS_TOKEN=APP_USR-…
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import "../_shared/precios.js";

// deno-lint-ignore no-explicit-any
const P = (globalThis as any).VcorePrecios;

const SITIOS = ["https://vcore.com.ar", "https://www.vcore.com.ar"];
const SITIO_DEFAULT = SITIOS[0];
// Entrega guardada en el pedido → opción de envío del carrito.
const ENVIO_DE_ENTREGA: Record<string, string> = { sucursal: "andreani", domicilio: "home", local: "pickup" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// A dónde vuelve el cliente después de pagar: el sitio desde el que compró, si
// es uno de los nuestros (localhost o un deploy de Vercel del proyecto, para
// probar); si no, el sitio oficial.
function sitioDe(req: Request) {
  const origen = req.headers.get("Origin") || "";
  if (SITIOS.includes(origen) || /^http:\/\/localhost(:\d+)?$/.test(origen) || /^https:\/\/vcore-website[a-z0-9-]*\.vercel\.app$/.test(origen)) return origen;
  return SITIO_DEFAULT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Usá POST." }, 405);

  const TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
  if (!TOKEN) return json({ error: "Falta configurar Mercado Pago (MP_ACCESS_TOKEN)." }, 500);
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let orderId = "";
  try { orderId = String((await req.json()).orderId || ""); } catch { /* cuerpo inválido */ }
  if (!/^VC[A-Z0-9-]{4,40}$/.test(orderId)) return json({ error: "Pedido inválido." }, 400);

  // --- 1. El pedido, tal como quedó guardado -----------------------------
  const { data: o, error: errPedido } = await db.from("orders")
    .select("id, status, total, items, coupon_code, entrega_tipo, pago_metodo, payments, mp, customer_name, customer_email")
    .eq("id", orderId).maybeSingle();
  if (errPedido) return json({ error: "No se pudo leer el pedido." }, 500);
  if (!o) return json({ error: "No encontramos el pedido." }, 404);
  if (!P.cobraPorMP(o.pago_metodo)) return json({ error: "Este pedido no es para pagar con Mercado Pago." }, 400);
  if (o.status !== "nuevo" || (o.payments || []).length || o.mp?.estado === "approved") {
    return json({ error: "Este pedido ya tiene un pago registrado." }, 409);
  }

  // --- 2. El total, recalculado con los datos reales ---------------------
  const [prods, codes, cfg] = await Promise.all([
    db.from("products").select("id, name, variants, price, visible"),
    db.from("codes").select("code, value, active"),
    db.from("config").select("*").eq("id", 1).single(),
  ]);
  if (prods.error || codes.error || cfg.error) return json({ error: "No se pudo leer el catálogo." }, 500);

  let subtotal = 0;
  const detalle: string[] = [];
  for (const item of o.items || []) {
    const prod = (prods.data || []).find((p: { id: string }) => p.id === item.productId);
    const existe = prod && prod.visible !== false &&
      (!(prod.variants || []).length || prod.variants.some((v: { label: string }) => v.label === item.size));
    if (!existe) return json({ error: `"${item.name || item.productId}" ya no está disponible. Actualizá el carrito.` }, 409);
    const qty = Math.floor(Number(item.qty));
    if (!(qty >= 1 && qty <= 999)) return json({ error: "Cantidad inválida en el pedido." }, 400);
    subtotal += P.priceFor(prod, item.size) * qty;
    detalle.push(`${qty}× ${prod.name} ${item.size || ""}`.trim());
  }
  if (!detalle.length) return json({ error: "El pedido no tiene productos." }, 400);

  const codigos = P.mapaCodigos(codes.data);
  const codigo = o.coupon_code || null;
  if (codigo && codigos[codigo] === undefined) return json({ error: `El código ${codigo} ya no es válido.` }, 409);

  const calc = P.calcularPedido({
    subtotal, codigo, codigos,
    shippingId: o.mp?.envio?.shippingId || ENVIO_DE_ENTREGA[o.entrega_tipo] || "andreani",
    zonaId: o.mp?.envio?.zonaId || "",
    config: cfg.data,
  });
  if (!(calc.total > 0)) return json({ error: "El total del pedido es inválido." }, 400);
  if (Math.abs(calc.total - Number(o.total)) > 1) {
    return json({ error: "Los precios cambiaron desde que armaste el carrito. Recargá la página y volvé a intentar.", total: calc.total }, 409);
  }

  // --- 3. Preferencia de Checkout Pro, limitada al medio elegido ----------
  const TIPOS = ["credit_card", "debit_card", "prepaid_card", "ticket", "atm", "bank_transfer", "account_money", "digital_currency"];
  const soloTipos = (permitidos: string[]) => ({ excluded_payment_types: TIPOS.filter((t) => !permitidos.includes(t)).map((id) => ({ id })) });
  const medios: Record<string, Record<string, unknown>> = {
    tarjeta:     { payment_methods: soloTipos(["credit_card", "debit_card", "prepaid_card"]) },
    efectivo:    { payment_methods: soloTipos(["ticket"]) },          // Rapipago / Pago Fácil
    mercadopago: {},                                                 // saldo y todo lo que ofrezca MP
    cuotas:      { purpose: "onboarding_credits" },                  // Cuotas sin Tarjeta (Mercado Crédito)
  };
  // Un solo renglón por el total: los descuentos y el envío ya están adentro.
  const vuelta = `${sitioDe(req)}/?pago=${encodeURIComponent(orderId)}`;
  const preferencia = {
    items: [{
      id: orderId,
      title: `Vcore — pedido ${orderId}`,
      description: detalle.join(", ").slice(0, 250),
      quantity: 1,
      currency_id: "ARS",
      unit_price: calc.total,
    }],
    payer: { name: o.customer_name || undefined, email: o.customer_email || undefined },
    external_reference: `vc:${orderId}`,
    notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
    back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
    auto_return: "approved",
    statement_descriptor: "VCORE",
    metadata: { tienda: "vcore", order_id: orderId, medio: o.pago_metodo },
    ...medios[o.pago_metodo],
  };
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(preferencia),
  });
  const pref = await r.json().catch(() => ({}));
  if (!r.ok || !pref.init_point) {
    console.error("Mercado Pago rechazó la preferencia", r.status, JSON.stringify(pref));
    return json({ error: "Mercado Pago no respondió. Probá de nuevo en un rato o finalizá por WhatsApp." }, 502);
  }

  const mp = { ...(o.mp || {}), preferenceId: pref.id, estado: "pendiente", total: calc.total, creado: new Date().toISOString() };
  const { error: errGuardar } = await db.from("orders").update({ mp }).eq("id", orderId);
  if (errGuardar) console.error("No se pudo guardar la preferencia en el pedido", errGuardar.message);

  return json({ url: pref.init_point });
});
