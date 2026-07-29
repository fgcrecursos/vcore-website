/* Vcore — Admin: generación de pedidos (remitera) y listado de pedidos.
   Paridad funcional con el panel de Somos Setas, adaptado al modelo de datos de
   Vcore (productos con `variants`, pedidos con `customer*`).

   Registra en window.VcoreAdminSections:
     orders → AdminOrders
   Y publica en window.VcoreRemitos los helpers que reutilizan otras secciones
   (clientes y control de pagos abren el mismo RemitoModal). */
const React = window.React;
const { useState, useEffect, useMemo, useRef } = React;
const K = window.VcoreAdminKit;
const D = window.VcoreData;
const {
  fmt, searchNormalize, paidOf, IcoSearch, IcoClose, IcoPlus, IcoPrint, IcoDown,
  IcoCart, IcoFile, STATUSES, STATUS_COLORS, statusLabel,
} = K;

/* ── Constantes del negocio ─────────────────────────────── */

/* Tipos de entrega y su costo por defecto (mismos valores que la tienda). */
const ENTREGAS = [
  { id: 'sucursal',  label: 'Sucursal Andreani', shippingId: 'andreani' },
  { id: 'domicilio', label: 'A domicilio',       shippingId: 'home' },
  { id: 'local',     label: 'Retiro en local',   shippingId: 'pickup' },
];
const ENTREGA_LABEL = ENTREGAS.reduce((a, e) => { a[e.id] = e.label; return a; }, {});
/* Los retiros no tienen costo de envío. */
const isFreeDelivery = (tipo) => tipo === 'local';
const shippingDefaultFor = (tipo) => {
  if (isFreeDelivery(tipo)) return 0;
  const e = ENTREGAS.find(x => x.id === tipo);
  const opt = D.shipping.find(s => s.id === (e ? e.shippingId : 'andreani'));
  return opt ? opt.base : 0;
};

/* Listas de precios de los remitos manuales. El precio mayorista es opcional por
   presentación: si no está cargado se usa el minorista (el de la tienda). */
const LISTAS_PRECIO = [
  { id: 'minorista', label: 'Precio minorista' },
  { id: 'mayorista', label: 'Precio mayorista' },
];
const variantPriceFor = (v, lista) => {
  if (!v) return 0;
  if (lista === 'mayorista' && Number(v.priceMayorista) > 0) return Number(v.priceMayorista);
  return Number(v.price) || 0;
};

/* Tasa de descuento según el nombre del tramo. Se usa para RECALCULAR el monto
   sobre el subtotal ACTUAL del remito: si el monto quedara congelado del pedido
   original, editar los ítems después mostraría un % errado (ej. un Mayorista 20%
   apareciendo como 31%). */
const tierRateFromName = (name) => {
  const n = searchNormalize(String(name || '').trim());
  const t = D.tiers.find(x => searchNormalize(x.label) === n);
  return t ? (Number(t.discount) || 0) : 0;
};

/* Clasifica el tipo de cliente de un pedido según su subtotal (mismos tramos que
   la tienda), para filtrar el listado y desglosar la facturación. */
function tipoClienteDe(o) {
  const sub = Number(o.subtotal) ||
    (o.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const t = D.getTier(sub);
  return t ? t.id : 'retail';
}
const TIPO_CLIENTE_LABEL = D.tiers.reduce((a, t) => { a[t.id] = t.label; return a; }, {});

/* Descripción imprimible de una línea del pedido. */
const itemDesc = (i) =>
  [i.name, i.sub, i.size].filter(Boolean).join(' — ') || i.productName || '—';

/* ═══════════════════════════════════════════════════════════
   REMITO — generador de HTML reutilizable (imprimir / Excel)
   ═══════════════════════════════════════════════════════════ */
const REMITO_INK = '#0D3D25';   // verde oscuro institucional
const REMITO_GREEN = '#37A769';

/* Convierte índice 0..N en letras A, B, C, ..., Z, AA, AB, ... */
function idxToLetter(idx) {
  let n = idx, out = '';
  do { out = String.fromCharCode(65 + (n % 26)) + out; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return out;
}

/* Número de remito con formato NN-DDMMYY:
     NN = secuencia del pedido dentro del día (01, 02, …)
     DDMMYY = fecha del pedido
   allOrders se usa para calcular la secuencia diaria sin colisiones. */
function genRemitoNumero(order, allOrders) {
  /* Si el pedido ya tiene un número asignado se conserva SIEMPRE: evita renumerar
     remitos ya impresos o entregados al reabrirlos. */
  const existing = order && order.remito && order.remito.numero;
  if (existing && /^\d{2}-\d{6}$/.test(existing)) return existing;

  const d = order ? new Date(order.ts) : new Date();
  const fechaStr = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(-2)}`;

  let maxSeq = 0;
  (allOrders || []).forEach(o => {
    const num = o && o.remito && o.remito.numero;
    if (!num || (order && o.id === order.id)) return;
    const m = /^(\d{2})-(\d{6})$/.exec(num);
    if (m && m[2] === fechaStr) {
      const n = parseInt(m[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  });
  return `${String(maxSeq + 1).padStart(2, '0')}-${fechaStr}`;
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');

/* Tabla HTML del remito. Se usa igual para imprimir (A4) y para exportar a Excel. */
function buildRemitoTableHtml(r) {
  const {
    numero, fecha, cliente, dni, items, descuentoMode, descuentoPct, descuentoFijo,
    subtotal, totalCant, logoUrl, loteGlobal, entregaTipo, shippingCost,
    datosDespacho, domicilioEntrega, tierName, couponDiscAmt, couponCode,
    creditAplicado, cfg,
  } = r;
  const conf = cfg || {};

  const rowsHtml = (items || []).map((item, idx) => {
    const loteShow = item.lote || loteGlobal || '';
    return `
    <tr style="background:${idx % 2 === 0 ? '#F4F1EC' : '#fff'}">
      <td width="28" style="width:28px;text-align:center;border:1px solid #999;padding:3px 2px;font-size:11px;font-weight:700;color:#000">${idxToLetter(idx)}</td>
      <td width="150" style="border:1px solid #999;padding:3px 8px;font-size:11px;font-weight:600;color:#000;line-height:1.25">${esc(item.desc || '—')}</td>
      <td width="42" style="text-align:center;border:1px solid #999;padding:3px 4px;font-size:11px;font-weight:700;color:#000">${Number(item.cant) || 0}</td>
      <td width="88" style="text-align:right;border:1px solid #999;padding:3px 8px;font-size:11px;font-weight:600;color:#000">${money(item.unitario)}</td>
      <td width="92" style="text-align:right;border:1px solid #999;padding:3px 8px;font-size:11px;font-weight:700;color:#000">${money((Number(item.cant) || 0) * (Number(item.unitario) || 0))}</td>
      <td width="300" style="border:1px solid #999;padding:3px 6px;font-size:10px;font-weight:600;color:#333">${esc(loteShow)}</td>
    </tr>`;
  }).join('');

  /* Descuento de TRAMO recalculado desde el subtotal actual. */
  const sub = Number(subtotal) || 0;
  const tierAmt = Math.round(sub * tierRateFromName(tierName));
  const tierPctCalc = sub ? Math.round(tierAmt / sub * 100) : 0;

  /* Cada concepto va en su propia línea: tramo, cupón, descuento manual y crédito. */
  const discountLines = [];
  if (tierAmt > 0) {
    const pctStr = tierPctCalc ? ` (${tierPctCalc}%)` : '';
    discountLines.push({ label: `DESCUENTO ${String(tierName || '').toUpperCase()}${pctStr}`.trim(), amount: tierAmt });
  }
  if (Number(couponDiscAmt) > 0) {
    const code = couponCode ? String(couponCode).toUpperCase() : '';
    discountLines.push({ label: code ? `CUPÓN ${code}` : 'CUPÓN', amount: Number(couponDiscAmt) });
  }
  const manualAmt = descuentoMode === 'fijo'
    ? Math.min(Number(descuentoFijo) || 0, sub)
    : Math.round(sub * (Number(descuentoPct) || 0) / 100);
  if (manualAmt > 0) {
    discountLines.push({
      label: descuentoMode === 'fijo' ? 'DESCUENTO' : `DESCUENTO (${descuentoPct}%)`,
      amount: manualAmt,
    });
  }
  const creditAmt = Math.max(Number(creditAplicado) || 0, 0);
  if (creditAmt > 0) discountLines.push({ label: 'NOTA DE CRÉDITO A FAVOR', amount: creditAmt });

  const shipForTotal = isFreeDelivery(entregaTipo) ? 0 : (Number(shippingCost) || 0);
  const totalCalc = sub - tierAmt - (Number(couponDiscAmt) || 0) - manualAmt - creditAmt + shipForTotal;

  const envioLabel = entregaTipo === 'domicilio' ? 'ENVÍO A DOMICILIO'
    : entregaTipo === 'local' ? 'RETIRO EN LOCAL'
    : 'ENVÍO A SUCURSAL';
  const envioMonto = Number(shippingCost) || 0;
  const envioValorTxt = (!isFreeDelivery(entregaTipo) && envioMonto > 0) ? `+ ${money(envioMonto)}` : 'GRATIS';
  const envioColor = (!isFreeDelivery(entregaTipo) && envioMonto > 0) ? '#1C6CAE' : REMITO_GREEN;

  const discountRowsHtml = discountLines.map(d => `
    <tr>
      <td colspan="3" style="border:1px solid #bbb;padding:2px 8px;font-size:10px;text-align:right;color:#B71C1C">${esc(d.label)}</td>
      <td colspan="2" style="border:1px solid #bbb;padding:2px 8px;text-align:right;font-size:11px;color:#B71C1C">− ${money(d.amount)}</td>
      <td style="border:1px solid #bbb"></td>
    </tr>`).join('');

  const summaryRows = `
    <tr>
      <td colspan="3" style="border:1px solid #bbb;padding:2px 8px;font-size:10px;text-align:right;color:#555">SUBTOTAL</td>
      <td colspan="2" style="border:1px solid #bbb;padding:2px 8px;text-align:right;font-size:11px">${money(sub)}</td>
      <td style="border:1px solid #bbb"></td>
    </tr>
    ${discountRowsHtml}
    <tr>
      <td colspan="3" style="border:1px solid #bbb;padding:2px 8px;font-size:10px;text-align:right;color:${envioColor}">${envioLabel}</td>
      <td colspan="2" style="border:1px solid #bbb;padding:2px 8px;text-align:right;font-size:11px;color:${envioColor}">${envioValorTxt}</td>
      <td style="border:1px solid #bbb"></td>
    </tr>`;

  const despachoBlock = (datosDespacho || domicilioEntrega) ? `
<table style="width:100%;border-collapse:collapse;border:2px solid ${REMITO_INK};margin-top:6px;table-layout:fixed">
  <colgroup>
    <col style="width:28px"/><col style="width:38%"/><col style="width:8%"/>
    <col style="width:16%"/><col style="width:17%"/><col style="width:20%"/>
  </colgroup>
  <tr style="background:#E8E5DF">
    <td colspan="3" style="border:1px solid #bbb;padding:3px 8px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">DATOS DE DESPACHO</td>
    <td colspan="3" style="border:1px solid #bbb;padding:3px 8px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">DOMICILIO DE ENTREGA</td>
  </tr>
  <tr>
    <td colspan="3" style="border:1px solid #bbb;padding:5px 8px;font-size:11px;vertical-align:top;white-space:pre-wrap;line-height:1.25">${esc(datosDespacho || '')}</td>
    <td colspan="3" style="border:1px solid #bbb;padding:5px 8px;font-size:11px;vertical-align:top;white-space:pre-wrap;line-height:1.25">${esc(domicilioEntrega || '')}</td>
  </tr>
</table>` : '';

  /* Datos de transferencia: salen de la configuración, no del código. */
  const bankLines = [
    conf.alias   ? `ALIAS: ${esc(conf.alias)}` : '',
    conf.banco   ? `BANCO: ${esc(conf.banco)}` : '',
    conf.cuit || conf.titular ? `${esc(conf.cuit || '')}${conf.cuit && conf.titular ? ' · ' : ''}${esc(conf.titular || '')}` : '',
  ].filter(Boolean).map(l => `<div style="font-size:8px">${l}</div>`).join('');

  return `<table style="width:100%;border-collapse:collapse;border:2px solid ${REMITO_INK};table-layout:fixed">
  <colgroup>
    <col width="26" style="width:28px"/><col width="150" style="width:24%"/><col width="42" style="width:7%"/>
    <col width="88" style="width:13%"/><col width="92" style="width:14%"/><col width="300" style="width:42%"/>
  </colgroup>
  <tr>
    <td colspan="2" rowspan="2" style="border:1px solid #bbb;padding:6px 10px;vertical-align:top">
      <div style="font-weight:700;font-size:13px;text-transform:uppercase;line-height:1.2">${esc(cliente || 'CLIENTE')}${dni ? ` <span style="font-size:10px;font-weight:600;color:#555;text-transform:none">— DNI ${esc(dni)}</span>` : ''}</div>
      <div style="font-size:10px;color:#555;margin-top:3px">${esc(fecha)}</div>
    </td>
    <td colspan="2" style="border:1px solid #bbb;padding:5px 8px;font-family:monospace;font-size:11px;text-align:center">${esc(numero)}</td>
    <td style="border:1px solid #bbb;padding:5px 8px;text-align:center;font-weight:700;font-size:10px;letter-spacing:2px">DESPACHO</td>
    <td rowspan="2" style="border:1px solid #bbb;padding:4px;text-align:center;vertical-align:middle">
      <img src="${logoUrl}" alt="Vcore" style="max-height:44px;max-width:100%;display:block;margin:0 auto" onerror="this.style.display='none'"/>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="border:1px solid #bbb;padding:3px"></td>
    <td style="border:1px solid #bbb;padding:3px;text-align:center;font-weight:700;font-size:10px;letter-spacing:2px">CONTROL</td>
  </tr>
  <tr style="background:#E8E5DF">
    <td width="28" style="width:28px;border:1px solid #bbb;padding:4px 2px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">ÍTEM</td>
    <td width="150" style="border:1px solid #bbb;padding:4px 8px;font-weight:700;font-size:10px;letter-spacing:1px">DESCRIPCIÓN</td>
    <td width="42" style="border:1px solid #bbb;padding:4px 4px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">CANT</td>
    <td width="88" style="border:1px solid #bbb;padding:4px 8px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">UNITARIO</td>
    <td width="92" style="border:1px solid #bbb;padding:4px 8px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">TOTAL</td>
    <td width="300" style="border:1px solid #bbb;padding:4px 6px;font-weight:700;font-size:10px;letter-spacing:1px;text-align:center">LOTE</td>
  </tr>
  ${rowsHtml}${summaryRows}
  <tr style="background:#E8E5DF;color:#000">
    <td colspan="2" style="border:1px solid #bbb;padding:6px 10px;vertical-align:middle">
      ${conf.remito_leyenda ? `<div style="font-size:9px;font-style:italic;line-height:1.3;color:#333">${esc(conf.remito_leyenda)}</div>` : ''}
      ${loteGlobal ? `<div style="margin-top:3px;font-size:9px;font-weight:700;letter-spacing:1px">LOTE GENERAL: ${esc(loteGlobal)}</div>` : ''}
    </td>
    <td style="border:1px solid #bbb;padding:6px 4px;text-align:center;font-weight:700;font-size:15px;color:#000">${totalCant}</td>
    <td colspan="2" style="border:1px solid #bbb;padding:6px 8px;text-align:right;font-weight:700;font-size:14px;color:#000">${money(totalCalc)}</td>
    <td style="border:1px solid #bbb;padding:4px 6px;color:#333;line-height:1.25">
      ${bankLines ? `<div style="font-size:8px;font-weight:700;margin-bottom:1px">TRANSFERENCIAS:</div>${bankLines}` : ''}
    </td>
  </tr>
</table>
${despachoBlock}`;
}

/* Datos de remito a partir de un pedido. Si ya hay uno guardado se respeta, pero
   se garantizan los campos nuevos (número con formato actual, despacho, etc.).
   Para pedidos sin remito, los valores se derivan del pedido para que coincida
   exactamente con lo que pagó el cliente. */
function buildRemitoFromOrder(order, allOrders, cfg) {
  const conf = cfg || {};
  const fecha = new Date(order.ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const numero = genRemitoNumero(order, allOrders);
  const domicilioEntregaAuto = [order.customerAddress, order.customerCity, order.customerPostalCode]
    .filter(Boolean).join(', ');

  const items = (order.items || []).map((i, idx) => ({
    id: String(idx + 1),
    desc: itemDesc(i),
    cant: Number(i.qty) || 0,
    unitario: Number(i.price) || 0,
    lote: '',
  }));

  const subtotal = order.subtotal != null
    ? Number(order.subtotal)
    : items.reduce((s, i) => s + i.cant * i.unitario, 0);

  const tierDiscAmt   = Number(order.tierDiscAmt) || 0;
  const couponDiscAmt = Number(order.couponDiscAmt) || 0;
  const entregaTipo   = order.entregaTipo || 'sucursal';
  const shippingCost  = Number(order.shippingCost) || 0;
  const shippingAmt   = isFreeDelivery(entregaTipo) ? 0 : shippingCost;
  const total = order.total != null
    ? Number(order.total)
    : subtotal - tierDiscAmt - couponDiscAmt + shippingAmt;

  const base = {
    numero, fecha,
    cliente: order.customerName || '', dni: order.customerDni || '',
    email: order.customerEmail || '', contacto: order.customerPhone || '',
    ciudad: order.customerCity || '', cp: order.customerPostalCode || '',
    items,
    descuentoMode: 'pct', descuentoPct: 0, descuentoFijo: 0,
    tierDiscAmt, tierName: order.tierName || '',
    couponDiscAmt, couponCode: order.couponCode || '',
    subtotal, total,
    loteGlobal: '',
    entregaTipo, shippingCost,
    datosDespacho: conf.remito_despacho || 'DESPACHO PRODUCTO FINAL',
    domicilioEntrega: domicilioEntregaAuto,
    creditAplicado: Number(order.creditApplied) || 0,
  };

  if (order.remito) {
    return { ...base, ...order.remito, numero, dni: order.remito.dni || order.customerDni || '' };
  }
  return base;
}

/* Cada remito lleva los datos calculados que la tabla necesita. */
function decorate(r, cfg) {
  const totalCant = (r.items || []).reduce((s, i) => s + (Number(i.cant) || 0), 0);
  const logoUrl = window.location.origin + '/assets/vcore-wordmark-ink.png';
  return { ...r, totalCant, logoUrl, cfg };
}

function downloadRemitosAsExcel(remitos, filename = 'remitos.xls', cfg) {
  const blocks = remitos.map(r => `${buildRemitoTableHtml(decorate(r, cfg))}<br/><br/>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"/>
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Remitos</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;font-weight:600}</style>
</head><body>${blocks}</body></html>`;

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function printRemitos(remitos, cfg) {
  const blocks = remitos.map((r, idx) => {
    const breakStyle = idx < remitos.length - 1 ? 'page-break-after:always;margin-bottom:12px' : '';
    return `<div style="${breakStyle}">${buildRemitoTableHtml(decorate(r, cfg))}</div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Remitos (${remitos.length})</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4; margin: 8mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size:11px; color:#000; font-weight:600;
    padding:14px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @media print { body { padding:0; } }
</style></head><body>${blocks}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=720');
  if (win) { win.document.write(html); win.document.close(); }
}

/* ═══════════════════════════════════════════════════════════
   COMBOBOX flotante (productos y clientes)
   Controlado: el texto visible es el valor real, escribir lo actualiza en vivo.
   El dropdown es solo una ayuda: elegir una opción completa los datos.
   ═══════════════════════════════════════════════════════════ */
function useComboPosition(open, query, inputRef) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!open) return;
    const measure = () => { if (inputRef.current) setRect(inputRef.current.getBoundingClientRect()); };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, query, inputRef]);

  /* position: fixed para escapar del overflow del modal. */
  const width = rect ? Math.max(rect.width, 420) : 420;
  return rect ? {
    position: 'fixed', top: rect.bottom + 2,
    left: Math.min(rect.left, window.innerWidth - width - 12),
    width, zIndex: 9999,
  } : { display: 'none' };
}

function ProductSearchSelect({ products, value, onChangeText, onSelect, lista = 'minorista' }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const query = value || '';
  const popStyle = useComboPosition(open, query, inputRef);

  const options = useMemo(() => {
    const q = searchNormalize(query.trim());
    if (!q) return [];
    const all = (products || []).filter(p => p.visible !== false).flatMap(p =>
      (p.variants || []).map(v => ({
        productId: p.id, size: v.label,
        label: itemDesc({ name: p.name, sub: p.sub, size: v.label }),
        price: variantPriceFor(v, lista),
        searchText: searchNormalize(`${p.name} ${p.sub || ''} ${v.label}`),
      }))
    );
    return all.filter(o => o.searchText.includes(q)).slice(0, 30);
  }, [products, query, lista]);

  useEffect(() => { setHighlight(0); }, [query]);

  const choose = (o) => { onSelect(o.productId, o.size); setOpen(false); };

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight(h => Math.min(h + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { if (open && options[highlight]) { e.preventDefault(); choose(options[highlight]); } }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="adm-combo">
      <input ref={inputRef} type="text" value={query}
        onChange={e => { onChangeText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
        placeholder="Buscar o escribir un producto…" />
      {open && options.length > 0 && (
        <div className="adm-combo__pop" style={{ ...popStyle, maxHeight: 380 }}>
          {options.map((o, i) => (
            <div key={o.productId + '::' + o.size}
              className={`adm-combo__opt${i === highlight ? ' on' : ''}`}
              onMouseDown={e => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setHighlight(i)}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              <span className="adm-combo__opt-price">{fmt(o.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Buscador de CLIENTES: lista los que ya compraron (derivados de los pedidos) y
   permite escribir uno nuevo. Elegir uno completa toda su ficha. */
function ClienteSearchSelect({ customers, value, onChangeText, onSelect }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const query = value || '';
  const popStyle = useComboPosition(open, query, inputRef);

  const options = useMemo(() => {
    const q = searchNormalize(query.trim());
    const all = customers || [];
    if (!q) return all.slice(0, 30);   // sin texto: los últimos clientes
    return all.filter(c =>
      searchNormalize([c.name, c.dni, c.email, c.contact, c.city].filter(Boolean).join(' ')).includes(q)
    ).slice(0, 30);
  }, [customers, query]);

  useEffect(() => { setHighlight(0); }, [query]);

  const choose = (c) => { onSelect(c); setOpen(false); };

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight(h => Math.min(h + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { if (open && options[highlight]) { e.preventDefault(); choose(options[highlight]); } }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="adm-combo">
      <input ref={inputRef} type="text" value={query}
        onChange={e => { onChangeText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
        placeholder="Buscar un cliente habitual o escribir uno nuevo…" />
      {open && options.length > 0 && (
        <div className="adm-combo__pop" style={{ ...popStyle, maxHeight: 360 }}>
          <div className="adm-combo__hd">Clientes que ya compraron</div>
          {options.map((c, i) => (
            <div key={c.key} className={`adm-combo__opt${i === highlight ? ' on' : ''}`}
              onMouseDown={e => { e.preventDefault(); choose(c); }}
              onMouseEnter={() => setHighlight(i)}>
              <span style={{ overflow: 'hidden' }}>
                <span style={{ fontWeight: 700 }}>{c.name || '—'}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-500)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[c.dni && `DNI ${c.dni}`, c.city, c.contact].filter(Boolean).join(' · ') || c.email}
                </span>
              </span>
              <span style={{ flex: 'none', textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-500)' }}>
                  {c.orderCount} pedido{c.orderCount !== 1 ? 's' : ''}
                </span>
                {c.totalPending > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#B71C1C' }}>Debe {fmt(c.totalPending)}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REMITO MODAL — la generación de pedidos
   ═══════════════════════════════════════════════════════════ */
function RemitoModal({ store, onClose, order, readOnly = false }) {
  const cfg = store.config || {};
  const dateStr = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const R = order && order.remito;

  const initItems = () => {
    if (R && R.items) return R.items.map(i => ({ ...i, id: i.id || Math.random().toString(36).slice(2) }));
    if (order && order.items) {
      return order.items.map((i, idx) => ({
        id: String(idx + 1), desc: itemDesc(i),
        cant: Number(i.qty) || 0, unitario: Number(i.price) || 0, lote: '',
        productId: i.productId || '', size: i.size || '',
      }));
    }
    return [{ id: '1', desc: '', cant: 1, unitario: 0, lote: '' }];
  };

  /* ── ficha del cliente ── */
  const [cliente, setCliente]   = useState((R && R.cliente) || (order && order.customerName) || '');
  const [dni, setDni]           = useState((R && R.dni) || (order && order.customerDni) || '');
  const [email, setEmail]       = useState((R && R.email) || (order && order.customerEmail) || '');
  const [contacto, setContacto] = useState((R && R.contacto) || (order && order.customerPhone) || '');
  const [ciudad, setCiudad]     = useState((R && R.ciudad) || (order && order.customerCity) || '');
  const [cp, setCp]             = useState((R && R.cp) || (order && order.customerPostalCode) || '');
  /* Domicilio "de ficha" (solo la calle). Se guarda en el pedido y es distinto del
     bloque libre "Domicilio de entrega", que puede llevar un punto de retiro. */
  const [domicilio, setDomicilio] = useState((R && R.domicilio) || (order && order.customerAddress) || '');
  /* Clave del cliente habitual elegido (null = cliente nuevo escrito a mano). */
  const [clienteKey, setClienteKey] = useState(null);

  const [numero, setNumero] = useState(() => genRemitoNumero(order || null, store.orders));
  const [fecha, setFecha]   = useState((R && R.fecha) || dateStr);

  /* Descuento manual: valores que escribe el usuario ("pendientes") y los ya
     APLICADOS al total. Solo cambian al hacer click en "Aplicar descuento", así
     tipear un número no altera el total hasta confirmarlo. */
  const [descuentoMode, setDescuentoMode] = useState((R && R.descuentoMode) || 'pct');
  const [descuentoPct, setDescuentoPct]   = useState((R && R.descuentoPct) ?? 0);
  const [descuentoFijo, setDescuentoFijo] = useState((R && R.descuentoFijo) ?? 0);
  const [appliedMode, setAppliedMode] = useState((R && R.descuentoMode) || 'pct');
  const [appliedPct, setAppliedPct]   = useState((R && R.descuentoPct) ?? 0);
  const [appliedFijo, setAppliedFijo] = useState((R && R.descuentoFijo) ?? 0);

  /* Tramo y cupón vienen del pedido y se muestran en líneas separadas: no se
     editan acá. El monto del tramo se recalcula sobre el subtotal actual. */
  const couponDiscAmt = (R && R.couponDiscAmt) ?? (order && order.couponDiscAmt) ?? 0;
  const couponCode    = (R && R.couponCode) ?? (order && order.couponCode) ?? '';
  const tierName      = (R && R.tierName) ?? (order && order.tierName) ?? '';

  const [loteGlobal, setLoteGlobal]     = useState((R && R.loteGlobal) || '');
  const [entregaTipo, setEntregaTipo]   = useState((R && R.entregaTipo) || (order && order.entregaTipo) || 'sucursal');
  /* En un remito manual nuevo arrancamos con el costo por defecto del tipo de
     entrega; en uno que viene de un pedido, con el costo que ya se cobró. */
  const [shippingCost, setShippingCost] = useState(
    (R && R.shippingCost) ?? (order && order.shippingCost) ??
    shippingDefaultFor((R && R.entregaTipo) || (order && order.entregaTipo) || 'sucursal'));
  const [datosDespacho, setDatosDespacho] = useState(
    (R && R.datosDespacho) || cfg.remito_despacho || 'DESPACHO PRODUCTO FINAL');
  const [domicilioEntrega, setDomicilioEntrega] = useState(
    (R && R.domicilioEntrega) ||
    [order && order.customerAddress, order && order.customerCity, order && order.customerPostalCode]
      .filter(Boolean).join(', ') || '');

  const [items, setItems] = useState(initItems);
  const [lista, setLista] = useState((R && R.lista) || 'minorista');
  const [saved, setSaved] = useState(false);

  /* Para remitos manuales guardamos el id del pedido creado en un ref (síncrono),
     así clics rápidos de Guardar/Imprimir no crean pedidos duplicados. */
  const manualOrderIdRef = useRef(null);

  /* Bloquear el scroll del panel de fondo: solo scrollea el remito. */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Al cambiar el tipo de entrega se aplica el costo por defecto de ese tipo. Se
     saltea la primera ejecución para NO pisar el costo ya guardado del pedido. */
  const shippingFirstRun = useRef(true);
  useEffect(() => {
    if (shippingFirstRun.current) { shippingFirstRun.current = false; return; }
    setShippingCost(shippingDefaultFor(entregaTipo));
    if (entregaTipo === 'local' && cfg.retiro) setDomicilioEntrega(cfg.retiro);
  }, [entregaTipo]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Clientes ya existentes, para el buscador y para el crédito a favor. */
  const customers = useMemo(
    () => window.VcoreCustomers.groupFromOrders(store.orders), [store.orders]);

  const pickCliente = (c) => {
    setClienteKey(c.key);
    setCliente(c.name || ''); setDni(c.dni || ''); setEmail(c.email || '');
    setContacto(c.contact || ''); setCiudad(c.city || ''); setCp(c.postalCode || '');
    setDomicilio(c.address || '');
    /* El domicilio de entrega solo se pisa si el cliente tiene uno cargado. */
    const dom = [c.address, c.city, c.postalCode].filter(Boolean).join(', ');
    if (dom) setDomicilioEntrega(dom);
  };

  /* Crédito a favor del cliente (notas emitidas − ya gastado). Al reabrir un
     remito guardado se respeta lo ya aplicado; en uno nuevo se propone todo. */
  const creditPool = useMemo(() => {
    if (order) {
      const cust = customers.find(c => (c.orders || []).some(oo => oo.id === order.id));
      if (!cust) return 0;
      return (cust.creditAvailable || 0) + (Number(order.creditApplied) || 0);
    }
    if (clienteKey) {
      const c = customers.find(x => x.key === clienteKey);
      return c ? (c.creditAvailable || 0) : 0;
    }
    return 0;
  }, [order, customers, clienteKey]);

  const [creditAplicado, setCreditAplicado] = useState(() =>
    R ? (Number(R.creditAplicado) || 0) : 0);

  /* ── cálculo de totales ── */
  const subtotal = items.reduce((s, i) => s + (Number(i.cant) || 0) * (Number(i.unitario) || 0), 0);
  const tierDiscAmt = Math.round(subtotal * tierRateFromName(tierName));
  const manualDiscAmt = appliedMode === 'fijo'
    ? Math.min(Number(appliedFijo) || 0, subtotal)
    : Math.round(subtotal * (Number(appliedPct) || 0) / 100);
  const isDescuentoPending =
    descuentoMode !== appliedMode ||
    Number(descuentoPct) !== Number(appliedPct) ||
    Number(descuentoFijo) !== Number(appliedFijo);

  const discAmt = tierDiscAmt + Number(couponDiscAmt) + manualDiscAmt;
  const shippingAmt = isFreeDelivery(entregaTipo) ? 0 : (Number(shippingCost) || 0);
  const totalBeforeCredit = subtotal - discAmt + shippingAmt;
  const creditMax  = Math.min(Number(creditPool) || 0, Math.max(totalBeforeCredit, 0));
  const creditUsed = Math.min(Math.max(Number(creditAplicado) || 0, 0), creditMax);
  const total = totalBeforeCredit - creditUsed;
  const totalCant = items.reduce((s, i) => s + (Number(i.cant) || 0), 0);
  const tierPct = (tierDiscAmt && subtotal) ? Math.round(tierDiscAmt / subtotal * 100) : 0;

  /* ── ítems ── */
  const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), desc: '', cant: 1, unitario: 0, lote: '' }]);
  const removeItem = (id) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  /* Escribir la descripción a mano desvincula la línea del catálogo: así un
     cambio de lista de precios no pisa el precio que cargó el usuario. */
  const updateItem = (id, field, val) => setItems(prev => prev.map(i => i.id === id
    ? (field === 'desc' ? { ...i, desc: val, productId: '', size: '' } : { ...i, [field]: val })
    : i));

  const quickFill = (itemId, productId, size) => {
    const prod = store.products.find(p => p.id === productId);
    if (!prod) return;
    const v = (prod.variants || []).find(x => x.label === size) || (prod.variants || [])[0];
    setItems(prev => prev.map(i => i.id === itemId
      ? { ...i, productId, size: v ? v.label : '',
          desc: itemDesc({ name: prod.name, sub: prod.sub, size: v ? v.label : '' }),
          unitario: variantPriceFor(v, lista) }
      : i));
  };

  /* Al cambiar de lista se re-precian las líneas cargadas desde el catálogo. */
  const cambiarLista = (nueva) => {
    setLista(nueva);
    setItems(prev => prev.map(i => {
      const prod = i.productId && store.products.find(p => p.id === i.productId);
      if (!prod) return i;
      const v = (prod.variants || []).find(x => x.label === i.size);
      if (!v) return i;
      return { ...i, unitario: variantPriceFor(v, nueva) };
    }));
  };

  /* Descartamos filas vacías para no persistir basura. */
  const cleanItems = () => items.filter(i => String(i.desc || '').trim() !== '');
  const cleanSubtotal = () => cleanItems().reduce((s, i) => s + (Number(i.cant) || 0) * (Number(i.unitario) || 0), 0);

  const remitoData = () => ({
    numero, fecha, cliente, dni, email, contacto, domicilio, ciudad, cp,
    items: cleanItems(), lista,
    /* Persistimos los valores APLICADOS (lo que afecta al total impreso). */
    descuentoMode: appliedMode,
    descuentoPct: Number(appliedPct) || 0,
    descuentoFijo: Number(appliedFijo) || 0,
    tierDiscAmt, tierName, tierPct,
    couponDiscAmt: Number(couponDiscAmt) || 0, couponCode,
    loteGlobal, entregaTipo, shippingCost: Number(shippingCost) || 0,
    datosDespacho, domicilioEntrega,
    subtotal, discAmt, shippingAmt, total,
    creditAplicado: creditUsed,
  });

  /* Ítems del remito en el formato que usa el resto del panel. */
  const orderItemsFromRemito = () => cleanItems().map(i => ({
    name: i.desc || '—', sub: '', size: i.size || '',
    productId: i.productId || '',
    price: Number(i.unitario) || 0, qty: Number(i.cant) || 0,
  }));

  const shippingLabel = () => {
    if (isFreeDelivery(entregaTipo)) return ENTREGA_LABEL[entregaTipo];
    return ENTREGA_LABEL[entregaTipo] || 'A coordinar';
  };

  function handleSave() {
    const rd = remitoData();
    const overrides = {
      customerName: cliente, customerDni: dni, customerEmail: email,
      customerPhone: contacto, customerAddress: domicilio,
      customerCity: ciudad, customerPostalCode: cp,
      total, creditApplied: creditUsed,
      entregaTipo, shippingCost: Number(shippingCost) || 0, shippingLabel: shippingLabel(),
      /* Sincronizamos SIEMPRE ítems y subtotal con lo que muestra el remito, así
         el listado y las estadísticas reflejan cualquier edición. */
      items: orderItemsFromRemito(),
      subtotal: cleanSubtotal(),
      summary: cleanItems().map(i => `${i.desc} ×${i.cant}`).join(', '),
    };

    if (order && order.id) {
      store.updateOrderRemito(order.id, rd, overrides);
    } else if (manualOrderIdRef.current) {
      store.updateOrderRemito(manualOrderIdRef.current, rd, overrides);
    } else {
      /* Remito manual nuevo → crea el pedido para que aparezca en la lista.
         Sufijo aleatorio para que dos remitos en el mismo milisegundo no
         colisionen en la clave primaria. */
      const newId = 'VC' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      manualOrderIdRef.current = newId;
      store.addOrder({
        id: newId, ts: Date.now(), date: new Date().toISOString(),
        ...overrides,
        tierDiscAmt, tierName,
        couponCode: couponCode || '', couponDiscAmt: Number(couponDiscAmt) || 0,
        payments: [], paymentStatus: 'pendiente', creditNotes: [],
        status: 'nuevo',
        origen: 'manual',     // este pedido nació de un remito manual
        remito: rd,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  /* En solo lectura no se guarda: imprimir o descargar no debe reescribir un
     pedido entregado o anulado. */
  function handlePrint() {
    if (!readOnly) handleSave();
    printRemitos([remitoData()], cfg);
  }
  function handleExcel() {
    if (!readOnly) handleSave();
    const safeName = (cliente || 'remito').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadRemitosAsExcel([remitoData()], `remito_${safeName}_${numero}.xls`, cfg);
  }

  const readOnlyMsg = !readOnly ? '' :
    (order && order.status === 'entregado')
      ? '🔒 Este pedido ya fue entregado: el remito no se puede modificar. Podés verlo completo, imprimirlo o descargarlo.'
      : (order && order.status === 'anulado')
        ? '🔒 Este pedido está anulado: el remito no se puede modificar. Para volver a editarlo hay que quitarle la anulación desde la lista de pedidos.'
        : '🔒 Tu usuario no tiene permiso para editar remitos. Podés verlo completo, imprimirlo o descargarlo.';

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal--wide">
        <div className="adm-modal__hd">
          <h3>{order ? `Remito — Pedido ${order.id}` : 'Remito manual'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>

        {readOnly && <div className="adm-modal__note">{readOnlyMsg}</div>}

        <div className="adm-modal__body">
          {/* En solo lectura el <fieldset disabled> deshabilita los campos PERO
              deja hacer scroll (a diferencia de pointer-events:none). */}
          <fieldset className="adm-fs" disabled={readOnly} style={{ opacity: readOnly ? .9 : 1 }}>

            {/* Lista de precios (solo remitos manuales: en los que vienen de la
                tienda, el precio es el que el cliente ya pagó). */}
            {!order && (
              <div className="adm-box adm-box--brand" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '.06em', color: 'var(--text-brand)' }}>Lista de precios</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {LISTAS_PRECIO.map(l => (
                    <button key={l.id} type="button" className={`adm-fchip${lista === l.id ? ' on' : ''}`}
                      onClick={() => cambiarLista(l.id)}>{l.label}</button>
                  ))}
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
                  Se aplica a los productos que elijas del catálogo. Podés editar cualquier precio a mano.
                </span>
              </div>
            )}

            {/* Encabezado del remito */}
            <div className="adm-field-row adm-field-row--4">
              <div className="adm-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Cliente</span>
                  {clienteKey && <span className="adm-badge adm-badge--habitual">HABITUAL</span>}
                </label>
                <ClienteSearchSelect customers={customers} value={cliente}
                  onChangeText={t => { setCliente(t); setClienteKey(null); }}
                  onSelect={pickCliente} />
              </div>
              <div className="adm-field"><label>DNI / CUIT</label>
                <input type="text" value={dni} onChange={e => setDni(e.target.value)} placeholder="Ej. 30.123.456" />
              </div>
              <div className="adm-field"><label>N° Remito</label>
                <input type="text" value={numero} onChange={e => setNumero(e.target.value)} />
              </div>
            </div>

            <div className="adm-field-row adm-field-row--4">
              <div className="adm-field"><label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" />
              </div>
              <div className="adm-field"><label>Teléfono / contacto</label>
                <input type="text" value={contacto} onChange={e => setContacto(e.target.value)} placeholder="Ej. 11 5555-1234" />
              </div>
              <div className="adm-field"><label>Localidad</label>
                <input type="text" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej. Vicente López" />
              </div>
              <div className="adm-field"><label>Fecha</label>
                <input type="text" value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
            </div>

            <div className="adm-field-row adm-field-row--4">
              <div className="adm-field" style={{ gridColumn: 'span 3' }}><label>Domicilio</label>
                <input type="text" value={domicilio} onChange={e => setDomicilio(e.target.value)}
                  placeholder="Calle, número, piso, depto" />
              </div>
              <div className="adm-field"><label>Código postal</label>
                <input type="text" value={cp} onChange={e => setCp(e.target.value)} placeholder="1602" />
              </div>
            </div>

            {/* Descuento manual */}
            <div className="adm-field-row adm-field-row--3" style={{ alignItems: 'flex-end' }}>
              <div className="adm-field"><label>Tipo de descuento</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className={`adm-fchip${descuentoMode === 'pct' ? ' on' : ''}`}
                    style={{ flex: 1 }} onClick={() => setDescuentoMode('pct')}>Porcentaje</button>
                  <button type="button" className={`adm-fchip${descuentoMode === 'fijo' ? ' on' : ''}`}
                    style={{ flex: 1 }} onClick={() => setDescuentoMode('fijo')}>Monto fijo</button>
                </div>
              </div>
              {descuentoMode === 'pct' ? (
                <div className="adm-field"><label>Descuento %</label>
                  <input type="number" min={0} max={100} step={1} value={descuentoPct}
                    onChange={e => setDescuentoPct(e.target.value)} />
                </div>
              ) : (
                <div className="adm-field"><label>Descuento ($)</label>
                  <input type="number" min={0} step={100} value={descuentoFijo}
                    onChange={e => setDescuentoFijo(e.target.value)} placeholder="Ej. 5000" />
                </div>
              )}
              <div className="adm-field">
                <label>&nbsp;</label>
                <button type="button"
                  className={`adm-btn ${isDescuentoPending ? 'adm-btn--primary' : 'adm-btn--outline'}`}
                  disabled={!isDescuentoPending}
                  onClick={() => {
                    setAppliedMode(descuentoMode);
                    setAppliedPct(Number(descuentoPct) || 0);
                    setAppliedFijo(Number(descuentoFijo) || 0);
                  }}
                  title={isDescuentoPending ? 'Aplicar al total' : 'El descuento ya está aplicado'}>
                  {isDescuentoPending ? 'Aplicar descuento' : '✓ Aplicado'}
                </button>
              </div>
            </div>

            {/* Ítems */}
            <div>
              <div className="adm-rem-head">
                <span>Producto</span>
                <span style={{ textAlign: 'center' }}>Cant.</span>
                <span style={{ textAlign: 'right' }}>Precio unit.</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span></span>
              </div>
              {items.map(item => (
                <div key={item.id} className="adm-rem-row">
                  <ProductSearchSelect products={store.products} value={item.desc} lista={lista}
                    onChangeText={t => updateItem(item.id, 'desc', t)}
                    onSelect={(pid, size) => quickFill(item.id, pid, size)} />
                  <input type="number" min={1} value={item.cant} style={{ textAlign: 'center' }}
                    onChange={e => updateItem(item.id, 'cant', e.target.value)} />
                  <input type="number" min={0} value={item.unitario} style={{ textAlign: 'right' }}
                    onChange={e => updateItem(item.id, 'unitario', e.target.value)} />
                  <span className="adm-rem-row__total">
                    {fmt((Number(item.cant) || 0) * (Number(item.unitario) || 0))}
                  </span>
                  <button type="button" className="adm-rem-row__del" onClick={() => removeItem(item.id)}
                    aria-label="Quitar ítem">×</button>
                </div>
              ))}
              <button type="button" className="adm-btn adm-btn--outline adm-btn--sm" onClick={addItem}>
                <IcoPlus size={13} /> Agregar ítem
              </button>
            </div>

            {/* Entrega, envío y lote */}
            <div className="adm-field-row adm-field-row--3" style={{ alignItems: 'flex-end' }}>
              <div className="adm-field"><label>Tipo de entrega</label>
                <select value={entregaTipo} onChange={e => setEntregaTipo(e.target.value)}>
                  {ENTREGAS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </div>
              {!isFreeDelivery(entregaTipo) ? (
                <div className="adm-field"><label>Costo de envío ($)</label>
                  <input type="number" min={0} step={100} value={shippingCost}
                    onChange={e => setShippingCost(e.target.value)} />
                </div>
              ) : (
                <div className="adm-field"><label>Costo de envío</label>
                  <div style={{ padding: '9px 0', fontWeight: 800, color: 'var(--text-brand)' }}>Sin cargo</div>
                </div>
              )}
              <div className="adm-field"><label>Lote general (opcional)</label>
                <input type="text" value={loteGlobal} onChange={e => setLoteGlobal(e.target.value)}
                  placeholder="Se imprime en las líneas sin lote propio" />
              </div>
            </div>

            <div className="adm-field-row">
              <div className="adm-field"><label>Datos de despacho</label>
                <textarea rows={3} value={datosDespacho} onChange={e => setDatosDespacho(e.target.value)}
                  placeholder="Transportista, número de seguimiento, fecha estimada, observaciones…" />
              </div>
              <div className="adm-field"><label>Domicilio de entrega</label>
                <textarea rows={3} value={domicilioEntrega} onChange={e => setDomicilioEntrega(e.target.value)}
                  placeholder="Calle, número, piso, depto, localidad, CP…" />
              </div>
            </div>

            {/* Crédito a favor del cliente */}
            {(creditPool > 0 || creditUsed > 0) && (
              <div className="adm-box adm-box--info adm-field-row adm-field-row--4" style={{ alignItems: 'flex-end' }}>
                <div className="adm-field"><label>Crédito a favor</label>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1C6CAE', padding: '8px 0' }}>
                    {fmt(creditPool)} disponible
                  </div>
                </div>
                <div className="adm-field"><label>Aplicar al remito ($)</label>
                  <input type="number" min={0} step={100} value={creditAplicado}
                    onChange={e => setCreditAplicado(e.target.value)} />
                </div>
                <div className="adm-field"><label>&nbsp;</label>
                  <button type="button" className="adm-btn adm-btn--info" onClick={() => setCreditAplicado(creditMax)}>
                    Usar todo
                  </button>
                </div>
                <div className="adm-field"><label>&nbsp;</label>
                  <button type="button" className="adm-btn adm-btn--outline" onClick={() => setCreditAplicado(0)}>
                    Sin crédito
                  </button>
                </div>
              </div>
            )}

            {/* Preview de totales */}
            <div className="adm-rem-totals">
              <div className="adm-rem-totals__lines">
                <div>Subtotal: {fmt(subtotal)}</div>
                {tierDiscAmt > 0 && (
                  <div style={{ color: '#B71C1C' }}>
                    Descuento {tierName}{tierPct ? ` (${tierPct}%)` : ''}: − {fmt(tierDiscAmt)}
                  </div>
                )}
                {Number(couponDiscAmt) > 0 && (
                  <div style={{ color: '#B71C1C' }}>Cupón {couponCode}: − {fmt(couponDiscAmt)}</div>
                )}
                {manualDiscAmt > 0 && (
                  <div style={{ color: '#B71C1C' }}>
                    Descuento {appliedMode === 'pct' ? `(${appliedPct}%)` : '(monto fijo)'}: − {fmt(manualDiscAmt)}
                  </div>
                )}
                {shippingAmt > 0 && (
                  <div style={{ color: '#1C6CAE' }}>{ENTREGA_LABEL[entregaTipo]}: + {fmt(shippingAmt)}</div>
                )}
                {isFreeDelivery(entregaTipo) && (
                  <div style={{ color: 'var(--text-brand)' }}>{ENTREGA_LABEL[entregaTipo]}: gratis</div>
                )}
                {creditUsed > 0 && (
                  <div style={{ color: '#1C6CAE' }}>Nota de crédito a favor: − {fmt(creditUsed)}</div>
                )}
                <div style={{ color: 'var(--ink-400)', fontSize: 12 }}>{totalCant} unidades</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="adm-ccstat__l">Total</div>
                <div className="adm-rem-totals__grand">{fmt(total)}</div>
              </div>
            </div>
          </fieldset>
        </div>

        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--ghost" onClick={onClose}>Cerrar</button>
          {!readOnly && (
            <button className="adm-btn adm-btn--outline" onClick={handleSave} style={{ minWidth: 100 }}>
              {saved ? '✓ Guardado' : 'Guardar'}
            </button>
          )}
          <button className="adm-btn adm-btn--outline" onClick={handleExcel}>
            <IcoDown size={13} /> Excel
          </button>
          <button className="adm-btn adm-btn--primary" onClick={handlePrint}>
            <IcoPrint size={13} /> Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PEDIDOS
   ═══════════════════════════════════════════════════════════ */
function AdminOrders({ store }) {
  const [filter, setFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');       // todos | semana | mes | mes-especifico
  const [selectedMonth, setSelectedMonth] = useState('');
  const [tipoCliente, setTipoCliente] = useState('todos');
  const [search, setSearch] = useState('');
  const [remitoOrderId, setRemitoOrderId] = useState(null);
  const [remitoManual, setRemitoManual] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const canEstado    = store.can('pedidos.estado');
  const canEditar    = store.can('pedidos.editar');
  const canAnular    = store.can('pedidos.anular');
  const canDesanular = store.can('pedidos.desanular');
  const canDelete    = store.can('pedidos.eliminar');
  const canManual    = store.can('remitos.crear');

  const availableMonths = useMemo(() => {
    const set = new Set();
    store.orders.forEach(o => set.add(K.periods.monthKey(o.ts)));
    return Array.from(set).sort().reverse();
  }, [store.orders]);

  const now = Date.now();
  const WEEK_MS = 7 * 24 * 3600 * 1000;
  const MONTH_MS = 30 * 24 * 3600 * 1000;

  const nuevosCount = store.orders.filter(o => (o.status || 'nuevo') === 'nuevo').length;

  const searchNorm = searchNormalize(search.trim());
  const filtered = store.orders.filter(o => {
    if (filter !== 'todos' && o.status !== filter) return false;
    if (tipoCliente !== 'todos' && tipoClienteDe(o) !== tipoCliente) return false;
    if (dateFilter === 'semana' && (now - o.ts) > WEEK_MS) return false;
    if (dateFilter === 'mes' && (now - o.ts) > MONTH_MS) return false;
    if (dateFilter === 'mes-especifico' && selectedMonth && K.periods.monthKey(o.ts) !== selectedMonth) return false;
    if (searchNorm) {
      const hay = searchNormalize([
        o.customerName, o.customerDni, o.customerEmail, o.customerPhone,
        o.customerCity, o.customerAddress, o.remito && o.remito.numero, o.id, o.summary,
      ].filter(Boolean).join(' '));
      if (!hay.includes(searchNorm)) return false;
    }
    return true;
  });

  /* Anular = marca el pedido como anulado (soft): no se borra, no cuenta en facturación. */
  const anularOrder = (id) => {
    if (confirm('¿Anular este pedido? No se eliminará, pero dejará de contar en la facturación.'))
      store.updateOrderStatus(id, 'anulado');
  };
  /* Quitar la anulación devuelve el pedido a "confirmado" para que su remito se
     pueda volver a editar. */
  const reactivarOrder = (id) => {
    if (confirm('¿Quitar la anulación de este pedido? Volverá a contar en la facturación y su remito se podrá editar.'))
      store.updateOrderStatus(id, 'confirmado');
  };
  const removeOrder = (id) => {
    if (confirm('¿ELIMINAR este pedido de forma definitiva? Esta acción no se puede deshacer.'))
      store.deleteOrder(id);
  };

  const remitoOrder = remitoOrderId ? store.orders.find(o => o.id === remitoOrderId) : null;

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allVisibleSelected = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id));
  const toggleSelectAll = () => setSelectedIds(prev => {
    const next = new Set(prev);
    if (allVisibleSelected) filtered.forEach(o => next.delete(o.id));
    else filtered.forEach(o => next.add(o.id));
    return next;
  });

  const selectedRemitos = () => {
    const orders = store.orders.filter(o => selectedIds.has(o.id)).sort((a, b) => a.ts - b.ts);
    return orders.map(o => buildRemitoFromOrder(o, store.orders, store.config));
  };
  const downloadSelected = () => {
    const remitos = selectedRemitos();
    if (!remitos.length) return;
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    downloadRemitosAsExcel(remitos, `remitos_${stamp}.xls`, store.config);
  };
  const printSelected = () => {
    const remitos = selectedRemitos();
    if (remitos.length) printRemitos(remitos, store.config);
  };

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Gestión</div>
            <h1>Pedidos</h1>
            <div className="adm-head__sub">{store.orders.length} pedidos generados.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedIds.size > 0 && (
              <>
                <button className="adm-btn adm-btn--outline" onClick={printSelected}>
                  <IcoPrint size={13} /> Imprimir {selectedIds.size}
                </button>
                <button className="adm-btn adm-btn--outline" onClick={downloadSelected}>
                  <IcoDown size={13} /> Excel ({selectedIds.size} {selectedIds.size === 1 ? 'remito' : 'remitos'})
                </button>
              </>
            )}
            {canManual && (
              <button className="adm-btn adm-btn--primary" onClick={() => setRemitoManual(true)}>
                <IcoFile size={14} /> Remito manual
              </button>
            )}
          </div>
        </div>
      </div>

      {nuevosCount > 0 && (
        <div className="adm-alert" onClick={() => setFilter('nuevo')}>
          <span className="adm-alert__n">{nuevosCount}</span>
          <div style={{ flex: 1 }}>
            <div className="adm-alert__t">
              {nuevosCount === 1 ? 'Tenés 1 pedido sin gestionar' : `Tenés ${nuevosCount} pedidos sin gestionar`}
            </div>
            <div className="adm-alert__s">
              Hacé clic para verlos. Cambiá su estado a “confirmado” a medida que los proceses.
            </div>
          </div>
          <span className="adm-alert__go">Ver →</span>
        </div>
      )}

      <div className="adm-panel">
        <div className="adm-bar adm-bar--stack">
          <div className="adm-chiprow">
            {['todos', ...STATUSES, 'anulado'].map(s => (
              <button key={s} className={`adm-fchip${filter === s ? ' on' : ''}`} onClick={() => setFilter(s)}>
                {(l => l.charAt(0).toUpperCase() + l.slice(1))(statusLabel(s))}
                {s === 'nuevo' && nuevosCount > 0 ? ` (${nuevosCount})` : ''}
              </button>
            ))}
          </div>
          <div className="adm-chiprow">
            <span className="adm-chiprow__lbl">Fecha:</span>
            <button className={`adm-fchip${dateFilter === 'todos' ? ' on' : ''}`}
              onClick={() => { setDateFilter('todos'); setSelectedMonth(''); }}>Todas</button>
            <button className={`adm-fchip${dateFilter === 'semana' ? ' on' : ''}`}
              onClick={() => { setDateFilter('semana'); setSelectedMonth(''); }}>Última semana</button>
            <button className={`adm-fchip${dateFilter === 'mes' ? ' on' : ''}`}
              onClick={() => { setDateFilter('mes'); setSelectedMonth(''); }}>Último mes</button>
            <select className="adm-fsel"
              value={dateFilter === 'mes-especifico' ? selectedMonth : ''}
              onChange={e => {
                if (e.target.value) { setDateFilter('mes-especifico'); setSelectedMonth(e.target.value); }
                else { setDateFilter('todos'); setSelectedMonth(''); }
              }}>
              <option value="">— Mes específico —</option>
              {availableMonths.map(ym => <option key={ym} value={ym}>{K.periods.monthLabelShort(ym)}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-400)' }}>
              {filtered.length} de {store.orders.length}
            </span>
          </div>
          <div className="adm-chiprow">
            <span className="adm-chiprow__lbl">Cliente:</span>
            {['todos', ...D.tiers.map(t => t.id)].map(t => (
              <button key={t} className={`adm-fchip${tipoCliente === t ? ' on' : ''}`} onClick={() => setTipoCliente(t)}>
                {t === 'todos' ? 'Todos' : TIPO_CLIENTE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="adm-search adm-search--wide">
            <IcoSearch size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI, email, teléfono, ciudad o N° de remito…" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="adm-empty">
            <IcoCart size={34} />
            <div>{store.orders.length === 0
              ? 'Sin pedidos todavía. Los pedidos de la tienda aparecen acá automáticamente.'
              : 'No hay pedidos con esos filtros.'}</div>
          </div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll}
                      title={allVisibleSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'}
                      style={{ cursor: 'pointer' }} />
                  </th>
                  <th>N° Remito</th><th>Fecha</th><th>Cliente</th><th>Items</th>
                  <th>Total</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const esNuevo = (o.status || 'nuevo') === 'nuevo';
                  const esAnulado = o.status === 'anulado';
                  const esEntregado = o.status === 'entregado';
                  const esConfirmado = o.status === 'confirmado';
                  /* Edición del remito: entregado o anulado nunca; el resto según permiso. */
                  const remitoBloqueado = esEntregado || esAnulado || !canEditar;
                  const rowClass = selectedIds.has(o.id) ? 'row--sel'
                    : esAnulado ? 'row--anulado'
                    : esConfirmado ? 'row--confirmado'
                    : esNuevo ? 'row--nuevo' : '';
                  return (
                    <tr key={o.id} className={rowClass}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(o.id)}
                          onChange={() => toggleSelect(o.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td className="mono">
                        {esAnulado && <span className="adm-badge adm-badge--anulado">ANULADO</span>}
                        {esNuevo && <span className="adm-badge adm-badge--nuevo">NUEVO</span>}
                        {o.origen === 'manual' && <span className="adm-badge adm-badge--manual">MANUAL</span>}
                        <strong>{(o.remito && o.remito.numero) || '—'}</strong>
                        <div style={{ fontSize: 9.5, color: 'var(--ink-400)' }}>{o.id}</div>
                      </td>
                      <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        {new Date(o.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.customerName || '—'}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                          {o.customerCity}{o.customerDni ? ` · DNI ${o.customerDni}` : ''}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>
                        {(o.items || []).length} línea{(o.items || []).length !== 1 ? 's' : ''} / {(o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0)} u.
                      </td>
                      <td className="num">{fmt(o.total)}</td>
                      <td>
                        {esAnulado ? (
                          <span className="adm-chip adm-chip--anulado">Anulado</span>
                        ) : !canEstado ? (
                          <span className={`adm-chip ${STATUS_COLORS[o.status] || 'adm-chip--nuevo'}`}>
                            {statusLabel(o.status)}
                          </span>
                        ) : (
                          <select className={`adm-statussel${esConfirmado ? ' on' : ''}`} value={o.status || 'nuevo'}
                            onChange={e => store.updateOrderStatus(o.id, e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                          </select>
                        )}
                      </td>
                      <td>
                        <div className="adm-actions">
                          <button className={`adm-btn adm-btn--xs ${o.remito ? 'adm-btn--primary' : 'adm-btn--outline'}`}
                            onClick={() => setRemitoOrderId(o.id)}
                            title={remitoBloqueado
                              ? 'Ver / imprimir remito (no editable)'
                              : (o.remito ? 'Ver / editar remito' : 'Generar remito')}>
                            {remitoBloqueado ? 'Ver remito' : (o.remito ? 'Remito' : 'Generar')}
                          </button>
                          {esAnulado ? (
                            canDesanular && (
                              <button className="adm-btn adm-btn--outline adm-btn--xs" onClick={() => reactivarOrder(o.id)}
                                title="Quitar la anulación y volver a habilitar la edición del remito">
                                Quitar anulado
                              </button>
                            )
                          ) : (
                            canAnular && (
                              <button className="adm-btn adm-btn--danger adm-btn--xs" onClick={() => anularOrder(o.id)}
                                title="Anular pedido (no se borra)">Anular</button>
                            )
                          )}
                          {canDelete && (
                            <button className="adm-btn adm-btn--danger adm-btn--xs" onClick={() => removeOrder(o.id)}
                              title="Eliminar definitivamente" style={{ opacity: .75 }}>Eliminar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remito de un pedido. Entregado o anulado → solo lectura. */}
      {remitoOrder && (
        <RemitoModal store={store} order={remitoOrder}
          readOnly={remitoOrder.status === 'entregado' || remitoOrder.status === 'anulado' || !canEditar}
          onClose={() => setRemitoOrderId(null)} />
      )}
      {remitoManual && (
        <RemitoModal store={store} order={null} onClose={() => setRemitoManual(false)} />
      )}
    </div>
  );
}

/* ── registro ── */
window.VcoreRemitos = {
  RemitoModal, buildRemitoFromOrder, buildRemitoTableHtml, printRemitos,
  downloadRemitosAsExcel, genRemitoNumero, tipoClienteDe, TIPO_CLIENTE_LABEL,
  itemDesc, isFreeDelivery, ENTREGA_LABEL,
};
window.VcoreAdminSections = window.VcoreAdminSections || {};
window.VcoreAdminSections.orders = AdminOrders;

export default null;
