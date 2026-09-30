// =====================================================================
// VCORE — Edge Function: aviso de Mercado Pago (webhook)
// =====================================================================
// Mercado Pago avisa acá cada vez que cambia un pago. El aviso no se cree tal
// cual: con el id se consulta el pago en la API de Mercado Pago (con nuestro
// token), que es la única fuente confiable del estado y del monto.
//
// Pago aprobado → se agrega como cobro al pedido (metodo "MercadoPago", el
// mismo nombre que usa el panel), el pedido pasa de "nuevo" a "confirmado" y
// queda listo para despachar. Si el monto no alcanza el total, se registra
// igual pero el pedido NO se confirma y el panel lo marca para revisar.
//
// Una misma cuenta de Mercado Pago cobra Vcore y Somos Setas: cada tienda crea
// sus preferencias con su propio webhook y external_reference ("vc:" acá).
//
// Deploy (Mercado Pago no manda JWT de Supabase):
//   supabase functions deploy mp-webhook --no-verify-jwt
// Secretos:
//   supabase secrets set MP_ACCESS_TOKEN=APP_USR-…
//   supabase secrets set MP_WEBHOOK_SECRET=…   (opcional: valida la firma)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ok = (texto = "ok") => new Response(texto, { status: 200 });

// Firma de Mercado Pago: header x-signature "ts=…,v1=…", HMAC-SHA256 de
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con la clave secreta.
async function firmaValida(req: Request, dataId: string, secreto: string) {
  const firma = req.headers.get("x-signature") || "";
  const partes = Object.fromEntries(firma.split(",").map((p) => p.trim().split("=")));
  if (!partes.ts || !partes.v1) return false;
  const requestId = req.headers.get("x-request-id") || "";
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifiesto = `id:${id};request-id:${requestId};ts:${partes.ts};`;
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(manifiesto)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return hex === partes.v1;
}

// dd/mm/aaaa en hora de Argentina, como los cobros que se cargan a mano.
const fechaAR = (d: Date) =>
  d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

Deno.serve(async (req) => {
  if (req.method !== "POST") return ok();
  const TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
  if (!TOKEN) return new Response("Falta MP_ACCESS_TOKEN", { status: 500 });

  const url = new URL(req.url);
  // deno-lint-ignore no-explicit-any
  let cuerpo: any = {};
  try { cuerpo = await req.json(); } catch { /* algunos avisos vienen solo por query */ }
  const tipo = cuerpo.type || cuerpo.topic || url.searchParams.get("type") || url.searchParams.get("topic");
  const pagoId = String(url.searchParams.get("data.id") || cuerpo?.data?.id || url.searchParams.get("id") || "");
  if (tipo !== "payment" || !/^\d+$/.test(pagoId)) return ok("ignorado");

  const SECRETO = Deno.env.get("MP_WEBHOOK_SECRET");
  if (SECRETO && !(await firmaValida(req, pagoId, SECRETO))) return new Response("firma inválida", { status: 401 });

  // --- 1. El pago, consultado en Mercado Pago -----------------------------
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) {
    console.error("No se pudo consultar el pago", pagoId, r.status);
    return new Response("reintentar", { status: 502 }); // Mercado Pago reintenta
  }
  const pago = await r.json();
  const ref = String(pago.external_reference || "");
  if (!ref.startsWith("vc:")) return ok("de otra tienda");
  const orderId = ref.slice(3);

  // --- 2. El pedido ------------------------------------------------------
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: o, error } = await db.from("orders").select("id, status, total, payments, payment_status, mp").eq("id", orderId).maybeSingle();
  if (error) return new Response("reintentar", { status: 500 });
  if (!o) { console.error("Pago de un pedido que no existe", orderId, pagoId); return ok("sin pedido"); }

  const payments = Array.isArray(o.payments) ? o.payments : [];
  const yaRegistrado = payments.some((p: { mpPaymentId?: string }) => p.mpPaymentId === String(pago.id));
  const total = Number(o.total) || 0;
  const monto = Number(pago.transaction_amount) || 0;

  const mp = {
    ...(o.mp || {}),
    paymentId: String(pago.id),
    estado: pago.status,                // approved | pending | in_process | rejected | cancelled | refunded | charged_back
    detalle: pago.status_detail || "",
    medio: pago.payment_method_id || "",
    monto,
    montoOk: pago.currency_id === "ARS" && monto >= total - 1,
    actualizado: new Date().toISOString(),
  };

  const cambios: Record<string, unknown> = { mp };

  if (pago.status === "approved" && !yaRegistrado) {
    const aprobado = new Date(pago.date_approved || Date.now());
    const cobro = {
      ts: aprobado.getTime(),
      fecha: fechaAR(aprobado),
      monto,
      metodo: "MercadoPago",
      comprobante: `MP ${pago.id}`,
      mpPaymentId: String(pago.id),
      notas: `Cobro automático de Mercado Pago${mp.medio ? ` (${mp.medio})` : ""}`,
      registradoPor: "Mercado Pago (automático)",
      registradoTs: Date.now(),
    };
    const nuevos = [...payments, cobro];
    const pagado = nuevos.reduce((s: number, p: { monto?: number }) => s + (Number(p.monto) || 0), 0);
    cambios.payments = nuevos;
    if (o.payment_status !== "anulado") cambios.payment_status = pagado >= total ? "pagado" : "parcial";
    // Solo un pago completo confirma el pedido; si no, queda para revisar.
    if (o.status === "nuevo" && mp.montoOk) cambios.status = "confirmado";
  }

  // Mercado Pago avisa varias veces por el mismo pago: la condición del update
  // evita que dos avisos simultáneos registren el mismo cobro dos veces.
  let q = db.from("orders").update(cambios).eq("id", orderId);
  if (pago.status === "approved" && !yaRegistrado) {
    q = Array.isArray(o.payments)
      ? q.not("payments", "cs", JSON.stringify([{ mpPaymentId: String(pago.id) }]))
      : q.is("payments", null);
  }
  const { error: errUpd } = await q;
  if (errUpd) { console.error("No se pudo actualizar el pedido", orderId, errUpd.message); return new Response("reintentar", { status: 500 }); }
  return ok();
});
