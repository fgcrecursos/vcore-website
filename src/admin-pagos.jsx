/* Vcore — Admin: control de pagos (cuenta corriente), notas de crédito y facturación.
   Registra window.VcoreAdminSections.cuenta y .facturacion. */
const React = window.React;
const { useState, useEffect, useMemo } = React;
const K = window.VcoreAdminKit;
const D = window.VcoreData;
const { fmt, searchNormalize, paidOf, CCStat, IcoSearch, IcoClose, IcoChart, IcoDown, IcoPrint } = K;

const METODOS = ['Transferencia', 'Efectivo', 'MercadoPago', 'Tarjeta', 'Otro'];
const PAGO_COLOR = {
  pagado: 'var(--text-brand)', parcial: '#B08A1A', pendiente: '#B71C1C',
  'cuenta-corriente': '#1C6CAE', anulado: 'var(--ink-400)',
};
const PAGO_LABEL = { 'cuenta-corriente': 'cta. corriente' };

const hoyAR = () => new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const money = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR');
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const logoUrl = () => window.location.origin + '/assets/vcore-wordmark-ink.png';

/* Etiqueta del remito de un pedido (o su id si todavía no tiene remito). */
const remitoNumOf = (o) => (o.remito && o.remito.numero) || o.id;

/* ═══════════════════════════════════════════════════════════
   COMPROBANTE DE PAGO imprimible / PDF
   El <title> define el nombre de archivo sugerido al guardar como PDF.
   ═══════════════════════════════════════════════════════════ */
function printComprobantePago({ titulo, cliente, remito, dni, fecha, total, totalPaid, saldo, paymentStatus, payments, adminNotes }) {
  const statusLabels = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado',
    anulado: 'Anulado', 'cuenta-corriente': 'Cuenta corriente' };
  const estadoLbl = statusLabels[paymentStatus] || paymentStatus || '—';
  const estadoCol = PAGO_COLOR[paymentStatus] === 'var(--text-brand)' ? '#2C8C58' : (
    paymentStatus === 'pendiente' ? '#B71C1C' : paymentStatus === 'parcial' ? '#B08A1A'
      : paymentStatus === 'cuenta-corriente' ? '#1C6CAE' : '#333');

  const pagosRows = (payments || []).length
    ? payments.map(p => `
      <tr>
        <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px">${esc(p.fecha)}</td>
        <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:right;font-family:monospace">${money(p.monto)}</td>
        <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px">${esc(p.metodo)}</td>
        <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px;color:#555">${esc(p.notas)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="border:1px solid #ddd;padding:12px;text-align:center;color:#888;font-size:12px">Sin pagos registrados</td></tr>';

  const card = (label, value, color) => `
    <div style="flex:1;border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;background:#FAF8F5">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#888;font-weight:700">${label}</div>
      <div style="font-size:18px;font-weight:700;font-family:monospace;color:${color || '#202020'};margin-top:3px">${value}</div>
    </div>`;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${esc(titulo)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color:#202020; padding:24px;
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0D3D25;padding-bottom:14px;margin-bottom:18px">
    <div>
      <div style="font-size:22px;font-weight:800;letter-spacing:0.02em">RECIBO DE PAGO</div>
      <div style="font-size:14px;font-weight:700;margin-top:8px">${esc(cliente)}${dni ? ` <span style="font-size:12px;font-weight:600;color:#666">— DNI ${esc(dni)}</span>` : ''}</div>
      <div style="font-size:12px;color:#666;margin-top:2px">Remito ${esc(remito)} · ${esc(fecha)}</div>
    </div>
    <img src="${logoUrl()}" alt="Vcore" style="max-height:48px" onerror="this.style.display='none'"/>
  </div>

  <div style="display:flex;gap:12px;margin-bottom:18px">
    ${card('Monto total', money(total))}
    ${card('Pagado', money(totalPaid), '#2C8C58')}
    ${card('Saldo', money(saldo), saldo > 0 ? '#B71C1C' : '#2C8C58')}
  </div>

  <div style="margin-bottom:16px;font-size:13px">
    <span style="color:#888;text-transform:uppercase;letter-spacing:0.06em;font-size:11px;font-weight:700">Estado del pago:</span>
    <span style="font-weight:700;color:${estadoCol};margin-left:8px;text-transform:uppercase">${estadoLbl}</span>
  </div>

  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;font-weight:700;margin-bottom:6px">Pagos registrados</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
    <tr style="background:#EEE">
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:left">Fecha</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:right">Monto</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:left">Método</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:left">Notas</th>
    </tr>
    ${pagosRows}
  </table>

  ${adminNotes ? `<div style="border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;background:#FAF8F5;font-size:12px"><strong>Notas:</strong> ${esc(adminNotes)}</div>` : ''}

  <div style="margin-top:26px;font-size:10px;color:#999;text-align:center">Generado desde el panel de Vcore · ${new Date().toLocaleString('es-AR')}</div>
  <script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=720');
  if (win) { win.document.write(html); win.document.close(); }
}

/* ═══════════════════════════════════════════════════════════
   NOTA DE CRÉDITO
   ═══════════════════════════════════════════════════════════ */
/* Normaliza una nota (nueva o vieja) a la forma con `lineas[]`. */
function creditNoteLines(n) {
  if (Array.isArray(n.lineas) && n.lineas.length) return n.lineas;
  const qty = Number(n.qty) || 1;
  const monto = Number(n.monto) || 0;
  return [{ name: n.name || 'Crédito', qty, unit: qty ? monto / qty : monto, monto }];
}

/* Remito de nota de crédito imprimible: detalle ítem por ítem de lo que se
   descuenta, el total, y el saldo del pedido antes y después de aplicarla. */
function printNotaCredito({ nota, cliente, dni, remito, totalPedido }) {
  const numero = nota.numero || nota.id;
  const lineas = creditNoteLines(nota);
  const total = Number(nota.monto) || lineas.reduce((s, l) => s + (Number(l.monto) || 0), 0);
  const aplicado = nota.aplicado != null ? Number(nota.aplicado) : total;
  const remanente = Number(nota.remanente) || 0;
  const tieneSaldos = nota.saldoAnterior != null;

  const filas = lineas.map((l, i) => `
    <tr>
      <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px">${esc(l.name)}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:center;font-family:monospace">${Number(l.qty) || 0}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:right;font-family:monospace">${money(l.unit)}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:right;font-family:monospace">− ${money(l.monto)}</td>
    </tr>`).join('');

  const card = (label, value, color) => `
    <div style="flex:1;border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;background:#FAF8F5">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#888;font-weight:700">${label}</div>
      <div style="font-size:18px;font-weight:700;font-family:monospace;color:${color || '#202020'};margin-top:3px">${value}</div>
    </div>`;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Nota de credito ${esc(numero)} - ${esc(cliente)} - ${esc(remito)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color:#202020; padding:24px;
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0D3D25;padding-bottom:14px;margin-bottom:18px">
    <div>
      <div style="font-size:22px;font-weight:800;letter-spacing:0.02em">NOTA DE CRÉDITO</div>
      <div style="font-size:13px;font-weight:700;font-family:monospace;color:#1C6CAE;margin-top:3px">${esc(numero)}</div>
      <div style="font-size:14px;font-weight:700;margin-top:8px">${esc(cliente)}${dni ? ` <span style="font-size:12px;font-weight:600;color:#666">— DNI ${esc(dni)}</span>` : ''}</div>
      <div style="font-size:12px;color:#666;margin-top:2px">Remito ${esc(remito)} · ${esc(nota.fecha)}</div>
    </div>
    <img src="${logoUrl()}" alt="Vcore" style="max-height:48px" onerror="this.style.display='none'"/>
  </div>

  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;font-weight:700;margin-bottom:6px">Detalle de lo acreditado</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
    <tr style="background:#EEE">
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;width:34px">#</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:left">Producto / concepto</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;width:60px">Cant.</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:right;width:110px">Unitario</th>
      <th style="border:1px solid #ddd;padding:7px 10px;font-size:11px;text-align:right;width:120px">Importe</th>
    </tr>
    ${filas}
    <tr>
      <td colspan="4" style="border:1px solid #ddd;padding:9px 10px;font-size:13px;text-align:right;font-weight:700;background:#FAF8F5">TOTAL NOTA DE CRÉDITO</td>
      <td style="border:1px solid #ddd;padding:9px 10px;font-size:15px;text-align:right;font-weight:800;font-family:monospace;background:#FAF8F5;color:#1C6CAE">− ${money(total)}</td>
    </tr>
  </table>

  ${tieneSaldos ? `
  <div style="display:flex;gap:12px;margin-bottom:14px">
    ${card('Saldo anterior', money(nota.saldoAnterior), Number(nota.saldoAnterior) > 0 ? '#B71C1C' : '#2C8C58')}
    ${card('Nota de crédito aplicada', '− ' + money(aplicado), '#1C6CAE')}
    ${card('Nuevo saldo pendiente', money(nota.saldoPosterior), Number(nota.saldoPosterior) > 0 ? '#B71C1C' : '#2C8C58')}
  </div>
  <div style="font-size:12px;color:#555;margin-bottom:14px">
    Monto total del pedido: <strong style="font-family:monospace">${money(totalPedido)}</strong>.
    Esta nota de crédito se descuenta del saldo pendiente del remito ${esc(remito)}.
    ${remanente > 0 ? `<br/>Excedente a favor del cliente: <strong style="font-family:monospace;color:#1C6CAE">${money(remanente)}</strong>, aplicable a otro pedido.` : ''}
  </div>` : ''}

  ${nota.motivo ? `<div style="border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;background:#FAF8F5;font-size:12px"><strong>Motivo:</strong> ${esc(nota.motivo)}</div>` : ''}

  <div style="margin-top:26px;font-size:10px;color:#999;text-align:center">Generado desde el panel de Vcore · ${new Date().toLocaleString('es-AR')}</div>
  <script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=720');
  if (win) { win.document.write(html); win.document.close(); }
}

/* ═══════════ Modal de pagos de UN pedido ═════════════════ */
function PaymentModal({ order, store, onClose }) {
  const [payments, setPayments] = useState(order.payments || []);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'pendiente');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [saved, setSaved] = useState(false);

  const total = Number(order.total) || 0;
  const totalPaid = payments.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const saldo = total - totalPaid;

  const clienteName = order.customerName || (order.remito && order.remito.cliente) || 'Cliente';
  const remitoNum = remitoNumOf(order);

  const addPayment = () => setPayments(prev => [...prev, {
    ts: Date.now(), fecha: hoyAR(), monto: saldo > 0 ? saldo : 0, metodo: 'Transferencia', notas: '',
  }]);
  const updatePay = (idx, field, val) => setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  const removePay = (idx) => setPayments(prev => prev.filter((_, i) => i !== idx));

  /* Auto-derivar el estado según el saldo. No se pisan los estados manuales
     "anulado" ni "cuenta-corriente" (pago diferido, definido a mano). */
  useEffect(() => {
    if (paymentStatus === 'anulado' || paymentStatus === 'cuenta-corriente') return;
    if (saldo <= 0 && totalPaid > 0) setPaymentStatus('pagado');
    else if (totalPaid > 0) setPaymentStatus('parcial');
    else setPaymentStatus('pendiente');
  }, [totalPaid, saldo]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    store.updateOrderPayments(order.id, {
      payments: payments.map(p => ({ ...p, monto: Number(p.monto) || 0 })),
      paymentStatus, adminNotes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const descargarPDF = () => printComprobantePago({
    titulo: `Recibo de pago - ${clienteName} - ${remitoNum}`,
    cliente: clienteName, remito: remitoNum,
    dni: order.customerDni || (order.remito && order.remito.dni) || '',
    fecha: (order.remito && order.remito.fecha) || new Date(order.ts).toLocaleDateString('es-AR'),
    total, totalPaid, saldo, paymentStatus,
    payments: payments.map(p => ({ ...p, monto: Number(p.monto) || 0 })),
    adminNotes,
  });

  const puedeCobrar = store.can('pagos.registrar');

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal--md">
        <div className="adm-modal__hd">
          <h3>Recibo de pago · {clienteName} · {remitoNum}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <div className="adm-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CCStat label="Monto total" value={fmt(total)} />
            <CCStat label="Pagado" value={fmt(totalPaid)} color="var(--text-brand)" />
            <CCStat label="Saldo" value={fmt(saldo)} color={saldo > 0 ? '#B71C1C' : 'var(--text-brand)'} />
          </div>

          <fieldset className="adm-fs" disabled={!puedeCobrar}>
            <div className="adm-field"><label>Estado del pago</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Pago parcial</option>
                <option value="pagado">Pagado</option>
                <option value="cuenta-corriente">Cuenta corriente</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 13.5 }}>Pagos registrados</strong>
                <button type="button" className="adm-btn adm-btn--outline adm-btn--sm" onClick={addPayment}>
                  + Agregar pago
                </button>
              </div>
              {payments.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>No hay pagos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {payments.map((p, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1.5fr 28px',
                      gap: 6, alignItems: 'center', padding: 8, border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)' }}>
                      <input type="text" value={p.fecha || ''} placeholder="dd/mm/aaaa"
                        onChange={e => updatePay(i, 'fecha', e.target.value)} style={{ fontSize: 12.5 }} />
                      <input type="number" value={p.monto} placeholder="Monto" style={{ fontSize: 12.5, textAlign: 'right' }}
                        onChange={e => updatePay(i, 'monto', e.target.value)} />
                      <select value={p.metodo || 'Transferencia'} style={{ fontSize: 12.5 }}
                        onChange={e => updatePay(i, 'metodo', e.target.value)}>
                        {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                        {p.esCredito && <option value="Nota de crédito">Nota de crédito</option>}
                      </select>
                      <input type="text" value={p.notas || ''} placeholder="Notas" style={{ fontSize: 12.5 }}
                        onChange={e => updatePay(i, 'notas', e.target.value)} />
                      <button type="button" className="adm-rem-row__del" onClick={() => removePay(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-field"><label>Notas administrativas</label>
              <textarea rows={2} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                placeholder="Observaciones internas…" />
            </div>
          </fieldset>
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--ghost" onClick={onClose}>Cerrar</button>
          <button className="adm-btn adm-btn--outline" onClick={descargarPDF}>
            <IcoPrint size={13} /> Descargar PDF
          </button>
          {puedeCobrar && (
            <button className="adm-btn adm-btn--primary" onClick={save}>
              {saved ? '✓ Guardado' : 'Guardar pagos'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Pago de VARIOS pedidos a la vez ══════════════ */
function BulkPaymentModal({ orders, store, onClose, onDone }) {
  const [fecha, setFecha] = useState(hoyAR());
  const [metodo, setMetodo] = useState('Transferencia');
  const [notas, setNotas] = useState('');

  const conSaldo = (orders || []).map(o => {
    const total = Number(o.total) || 0;
    const paid = paidOf(o);
    return { o, total, paid, saldo: total - paid };
  }).filter(x => x.saldo > 0);

  const totalARegistrar = conSaldo.reduce((s, x) => s + x.saldo, 0);

  function confirmar() {
    conSaldo.forEach(({ o, saldo }) => {
      const nuevos = [...(o.payments || []), { ts: Date.now(), fecha, monto: saldo, metodo, notas: notas || 'Pago múltiple' }]
        .map(p => ({ ...p, monto: Number(p.monto) || 0 }));
      store.updateOrderPayments(o.id, { payments: nuevos, paymentStatus: 'pagado', adminNotes: o.adminNotes || '' });
    });
    if (onDone) onDone();
  }

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 560 }}>
        <div className="adm-modal__hd">
          <h3>Registrar pago múltiple</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>
            Se registrará un pago por el saldo pendiente de cada pedido seleccionado y quedarán marcados como <strong>pagados</strong>.
          </p>
          <div className="adm-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <CCStat label="Pedidos con saldo" value={String(conSaldo.length)} />
            <CCStat label="Total a registrar" value={fmt(totalARegistrar)} color="var(--text-brand)" />
          </div>
          {conSaldo.length === 0 ? (
            <div className="adm-box" style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-500)' }}>
              Los pedidos seleccionados ya están saldados. No hay nada para registrar.
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 170, overflowY: 'auto', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)' }}>
                <table className="adm-tbl adm-tbl--tight">
                  <thead><tr><th>Remito</th><th style={{ textAlign: 'right' }}>Saldo</th></tr></thead>
                  <tbody>
                    {conSaldo.map(({ o, saldo }) => (
                      <tr key={o.id}>
                        <td className="mono">{remitoNumOf(o)}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{fmt(saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adm-field-row">
                <div className="adm-field"><label>Fecha</label>
                  <input type="text" value={fecha} onChange={e => setFecha(e.target.value)} placeholder="dd/mm/aaaa" />
                </div>
                <div className="adm-field"><label>Método</label>
                  <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                    {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-field"><label>Notas (opcional)</label>
                <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej. pagó todo junto" />
              </div>
            </>
          )}
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn--primary" onClick={confirmar} disabled={!conSaldo.length}>
            Registrar {fmt(totalARegistrar)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Pago general del cliente ═════════════════════
   Registra UN pago y lo reparte entre TODOS sus pedidos con saldo, del más
   antiguo al más nuevo, hasta agotar el monto. Cada pedido recibe
   min(saldo, restante): el cálculo es exacto y no sobre-paga ninguno. */
function GeneralPaymentModal({ customer, orders, store, onClose, onDone }) {
  const pendientes = (orders || [])
    .filter(o => o.status !== 'anulado' && o.paymentStatus !== 'anulado')
    .map(o => {
      const total = Number(o.total) || 0;
      const paid = paidOf(o);
      return { o, total, paid, saldo: total - paid };
    })
    .filter(x => x.saldo > 0)
    .sort((a, b) => a.o.ts - b.o.ts);

  const deudaTotal = pendientes.reduce((s, x) => s + x.saldo, 0);

  const [monto, setMonto] = useState(deudaTotal);
  const [metodo, setMetodo] = useState('Transferencia');
  const [fecha, setFecha] = useState(hoyAR());
  const [notas, setNotas] = useState('');
  const [done, setDone] = useState(false);

  /* Reparto previsualizado del monto ingresado. */
  const montoNum = Math.max(0, Number(monto) || 0);
  const reparto = [];
  let restante = montoNum;
  for (const x of pendientes) {
    const aplicar = Math.min(restante, x.saldo);
    if (aplicar > 0) reparto.push({ ...x, aplicar });
    restante -= aplicar;
    if (restante <= 0) break;
  }
  const sobrante = Math.max(restante, 0);
  const aplicado = montoNum - sobrante;

  function confirmar() {
    if (montoNum <= 0) { alert('Ingresá un monto mayor a 0.'); return; }
    reparto.forEach(({ o, total, paid, aplicar }) => {
      const nuevos = [...(o.payments || []), { ts: Date.now(), fecha, monto: aplicar, metodo, notas: notas || 'Pago general' }]
        .map(p => ({ ...p, monto: Number(p.monto) || 0 }));
      const status = (paid + aplicar) >= total ? 'pagado' : 'parcial';
      store.updateOrderPayments(o.id, { payments: nuevos, paymentStatus: status, adminNotes: o.adminNotes || '' });
    });
    setDone(true);
    setTimeout(() => { if (onDone) onDone(); }, 600);
  }

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal--md">
        <div className="adm-modal__hd">
          <h3>Registrar pago general · {customer.name || 'Cliente'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>
            El pago se reparte automáticamente entre todos los pedidos con saldo, del más antiguo al más nuevo, hasta agotarlo.
          </p>
          <div className="adm-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CCStat label="Pedidos con saldo" value={String(pendientes.length)} />
            <CCStat label="Deuda total" value={fmt(deudaTotal)} color="#B71C1C" />
            <CCStat label="Se aplicará" value={fmt(aplicado)} color="var(--text-brand)" />
          </div>

          {pendientes.length === 0 ? (
            <div className="adm-box" style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-500)' }}>
              Este cliente no tiene pedidos con saldo pendiente.
            </div>
          ) : (
            <>
              <div className="adm-field-row adm-field-row--3">
                <div className="adm-field"><label>Monto a pagar</label>
                  <input type="number" min={0} value={monto} style={{ textAlign: 'right' }}
                    onChange={e => setMonto(e.target.value)} />
                </div>
                <div className="adm-field"><label>Fecha</label>
                  <input type="text" value={fecha} onChange={e => setFecha(e.target.value)} placeholder="dd/mm/aaaa" />
                </div>
                <div className="adm-field"><label>Método</label>
                  <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                    {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-field"><label>Notas (opcional)</label>
                <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej. pagó todo junto" />
              </div>

              <div>
                <div className="adm-ccstat__l" style={{ marginBottom: 6 }}>Cómo se reparte</div>
                <div style={{ maxHeight: 210, overflowY: 'auto', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)' }}>
                  <table className="adm-tbl adm-tbl--tight">
                    <thead><tr>
                      <th>Fecha</th><th>Remito</th>
                      <th style={{ textAlign: 'right' }}>Saldo</th>
                      <th style={{ textAlign: 'right' }}>Se aplica</th>
                      <th style={{ textAlign: 'right' }}>Queda</th>
                    </tr></thead>
                    <tbody>
                      {pendientes.map(x => {
                        const r = reparto.find(rr => rr.o.id === x.o.id);
                        const aplicar = r ? r.aplicar : 0;
                        return (
                          <tr key={x.o.id}>
                            <td>{new Date(x.o.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                            <td className="mono">{remitoNumOf(x.o)}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(x.saldo)}</td>
                            <td style={{ textAlign: 'right', color: aplicar > 0 ? 'var(--text-brand)' : 'var(--ink-400)' }}>{fmt(aplicar)}</td>
                            <td style={{ textAlign: 'right', color: (x.saldo - aplicar) > 0 ? '#B71C1C' : 'var(--ink-400)' }}>
                              {fmt(x.saldo - aplicar)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {sobrante > 0 && (
                <div className="adm-box adm-box--warn" style={{ fontSize: 12.5, color: '#8A5A2B' }}>
                  El monto supera la deuda total. Sobran <strong>{fmt(sobrante)}</strong> que no se aplicarán.
                  Se registrarán {fmt(aplicado)}.
                </div>
              )}
            </>
          )}
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn--primary" onClick={confirmar} disabled={!pendientes.length || aplicado <= 0}>
            {done ? '✓ Registrado' : `Registrar ${fmt(aplicado)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Nota de crédito ══════════════════════════════
   Funciona como un remito a la inversa: detalla ítem por ítem qué se descuenta,
   a cuánto y el total, y ese total se DESCUENTA del saldo pendiente del pedido
   (se registra como un pago con metodo "Nota de crédito", esCredito:true). Si la
   nota supera el saldo, el excedente queda como crédito disponible del cliente
   para aplicarlo a otro pedido. */
function CreditNoteModal({ order, store, onClose }) {
  const items = order.items || [];
  const R = window.VcoreRemitos;
  const describe = (it) => (R ? R.itemDesc(it) : (it.name || 'Crédito'));

  const nuevaLinea = () => {
    const it = items[0];
    return {
      key: Math.random().toString(36).slice(2),
      itemIdx: items.length ? '0' : 'otro',
      freeText: '', qty: 1,
      unit: it ? (Number(it.price) || 0) : 0,
    };
  };
  const [lineas, setLineas] = useState(() => [nuevaLinea()]);
  const [motivo, setMotivo] = useState('');
  const [saved, setSaved] = useState(false);

  const notas = order.creditNotes || [];
  const clienteName = order.customerName || (order.remito && order.remito.cliente) || 'Cliente';
  const remitoNum = remitoNumOf(order);
  const dni = order.customerDni || (order.remito && order.remito.dni) || '';

  const totalPedido = Number(order.total) || 0;
  const pagado = paidOf(order);
  const saldoActual = totalPedido - pagado;

  const lineTotal = (l) => Math.max(0, (Number(l.qty) || 0) * (Number(l.unit) || 0));
  const totalNC = lineas.reduce((s, l) => s + lineTotal(l), 0);
  const aplicado = Math.min(totalNC, Math.max(saldoActual, 0));
  const remanente = totalNC - aplicado;
  const nuevoSaldo = saldoActual - aplicado;

  const setLinea = (key, patch) => setLineas(prev => prev.map(l => l.key === key ? { ...l, ...patch } : l));
  const addLinea = () => setLineas(prev => [...prev, nuevaLinea()]);
  const removeLinea = (key) => setLineas(prev => prev.length > 1 ? prev.filter(l => l.key !== key) : prev);

  /* Al elegir un ítem del pedido se precarga su precio unitario; en "otro" queda libre. */
  const selectItem = (key, val) => {
    const it = val === 'otro' ? null : items[Number(val)];
    setLinea(key, { itemIdx: val, unit: it ? (Number(it.price) || 0) : 0 });
  };
  const describeLinea = (l) => {
    if (l.itemIdx === 'otro') return { name: l.freeText.trim() || 'Crédito' };
    const it = items[Number(l.itemIdx)];
    return { name: it ? describe(it) : 'Crédito' };
  };

  function emitir() {
    const validas = lineas.filter(l => lineTotal(l) > 0);
    if (!validas.length) { alert('Cargá al menos un ítem con cantidad y precio mayores a 0.'); return; }
    const total = validas.reduce((s, l) => s + lineTotal(l), 0);
    const aplica = Math.min(total, Math.max(saldoActual, 0));
    const sobra = total - aplica;
    const fecha = hoyAR();

    /* Numeración correlativa sobre todas las notas emitidas (todos los pedidos). */
    const emitidas = (store.orders || []).reduce((s, o) => s + (o.creditNotes || []).length, 0);
    const numero = 'NC-' + String(emitidas + 1).padStart(4, '0');

    const nueva = {
      id: 'NC-' + Date.now().toString(36).toUpperCase(),
      numero, ts: Date.now(), fecha,
      lineas: validas.map(l => ({
        ...describeLinea(l),
        qty: Number(l.qty) || 0, unit: Number(l.unit) || 0, monto: lineTotal(l),
      })),
      monto: total, aplicado: aplica, remanente: sobra,
      saldoAnterior: saldoActual, saldoPosterior: saldoActual - aplica,
      motivo: motivo.trim(),
    };

    /* El descuento del saldo se materializa como un pago esCredito:true, que es
       como el resto del panel contabiliza el crédito ya consumido. El remanente
       queda a favor porque el crédito ganado suma el total de la nota. */
    let payments = order.payments || [];
    let paymentStatus = order.paymentStatus;
    if (aplica > 0) {
      payments = [...payments, {
        ts: Date.now(), fecha, monto: aplica, metodo: 'Nota de crédito',
        esCredito: true, ncId: nueva.id, notas: `Nota de crédito ${numero}`,
      }].map(p => ({ ...p, monto: Number(p.monto) || 0 }));
      const nuevoPagado = payments.reduce((s, p) => s + p.monto, 0);
      /* "anulado" es un estado manual: no se pisa al descontar la nota. */
      if (paymentStatus !== 'anulado') {
        paymentStatus = nuevoPagado >= totalPedido ? 'pagado' : nuevoPagado > 0 ? 'parcial' : 'pendiente';
      }
    }

    store.updateOrderCreditNotes(order.id, [...notas, nueva], aplica > 0 ? { payments, paymentStatus } : undefined);
    printNotaCredito({ nota: nueva, cliente: clienteName, dni, remito: remitoNum, totalPedido });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  const reimprimir = (n) => printNotaCredito({ nota: n, cliente: clienteName, dni, remito: remitoNum, totalPedido });
  const totalEmitido = notas.reduce((s, n) => s + (Number(n.monto) || 0), 0);

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal--md">
        <div className="adm-modal__hd">
          <h3>Nota de crédito · {clienteName} · {remitoNum}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>
            Detallá los productos fallados o devueltos. Al emitirla se genera un <strong>remito de nota de crédito</strong>
            {' '}imprimible con el detalle ítem por ítem y su total, y ese total se <strong>descuenta del saldo pendiente de este pedido</strong>.
            Si supera el saldo, el excedente queda como crédito disponible del cliente.
          </p>

          <div className="adm-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CCStat label="Saldo pendiente" value={fmt(saldoActual)} color={saldoActual > 0 ? '#B71C1C' : 'var(--text-brand)'} />
            <CCStat label="Total nota de crédito" value={fmt(totalNC)} color="#1C6CAE" />
            <CCStat label="Nuevo saldo" value={fmt(nuevoSaldo)} color={nuevoSaldo > 0 ? '#B71C1C' : 'var(--text-brand)'} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13.5 }}>Detalle a descontar</strong>
              <button type="button" className="adm-btn adm-btn--outline adm-btn--sm" onClick={addLinea}>+ Agregar ítem</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lineas.map(l => (
                <div key={l.key} style={{ border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', padding: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 110px 28px', gap: 6, alignItems: 'center' }}>
                    <select value={l.itemIdx} onChange={e => selectItem(l.key, e.target.value)} style={{ fontSize: 12.5 }}>
                      {items.map((it, i) => (
                        <option key={i} value={String(i)}>{describe(it)} ({fmt(it.price)})</option>
                      ))}
                      <option value="otro">Otro / texto libre…</option>
                    </select>
                    <input type="number" min={1} value={l.qty} title="Cantidad" style={{ fontSize: 12.5, textAlign: 'center' }}
                      onChange={e => setLinea(l.key, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
                    <input type="number" min={0} value={l.unit} title="Precio unitario" style={{ fontSize: 12.5, textAlign: 'right' }}
                      onChange={e => setLinea(l.key, { unit: e.target.value })} />
                    <div className="num" style={{ textAlign: 'right' }}>{fmt(lineTotal(l))}</div>
                    <button type="button" className="adm-rem-row__del" onClick={() => removeLinea(l.key)}
                      disabled={lineas.length === 1} style={{ opacity: lineas.length === 1 ? .3 : 1 }}>×</button>
                  </div>
                  {l.itemIdx === 'otro' && (
                    <input type="text" value={l.freeText} style={{ fontSize: 12.5, marginTop: 6, width: '100%',
                      padding: '8px 10px', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-card)', color: 'var(--ink-900)', boxSizing: 'border-box' }}
                      onChange={e => setLinea(l.key, { freeText: e.target.value })}
                      placeholder="Descripción (ej. crédito por demora, producto fuera de catálogo…)" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'baseline' }}>
            <span className="adm-ccstat__l">Total a descontar</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#1C6CAE' }}>
              {fmt(totalNC)}
            </span>
          </div>

          {remanente > 0 && (
            <div className="adm-box adm-box--info" style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>
              La nota supera el saldo del pedido: se descuentan <strong>{fmt(aplicado)}</strong> y quedan{' '}
              <strong>{fmt(remanente)}</strong> como crédito disponible del cliente para aplicar a otro pedido.
            </div>
          )}

          <div className="adm-field"><label>Motivo (opcional)</label>
            <textarea rows={2} value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Ej. envase dañado, producto en mal estado…" />
          </div>

          {notas.length > 0 && (
            <div>
              <div className="adm-ccstat__l" style={{ marginBottom: 6 }}>
                Notas de crédito de este pedido · Total {fmt(totalEmitido)}
              </div>
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table className="adm-tbl adm-tbl--tight">
                  <thead><tr><th>Fecha</th><th>N°</th><th>Detalle</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr></thead>
                  <tbody>
                    {notas.map(n => (
                      <tr key={n.id}>
                        <td>{n.fecha}</td>
                        <td className="mono">{n.numero || n.id}</td>
                        <td>
                          {creditNoteLines(n).map((l, i) => (
                            <div key={i}>{l.name}{l.qty > 1 ? ` ×${l.qty}` : ''}</div>
                          ))}
                        </td>
                        <td className="num" style={{ textAlign: 'right' }}>{fmt(n.monto)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="adm-btn adm-btn--outline adm-btn--xs" onClick={() => reimprimir(n)}>Imprimir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--ghost" onClick={onClose}>Cerrar</button>
          {store.can('pagos.credito') && (
            <button className="adm-btn adm-btn--primary" onClick={emitir} disabled={totalNC <= 0}>
              {saved ? '✓ Emitida' : `Emitir y descontar ${fmt(totalNC)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Estado de cuenta de un cliente ══════════════ */
function CustomerAccountDetail({ customer, monthFilter, store, onClose }) {
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [creditNoteOrderId, setCreditNoteOrderId] = useState(null);
  const [generalOpen, setGeneralOpen] = useState(false);

  const puedeCobrar = store.can('pagos.registrar');
  const puedeCredito = store.can('pagos.credito');
  const creditAvail = customer.creditAvailable || 0;

  const orders = useMemo(() => {
    let list = [...customer.orders].sort((a, b) => b.ts - a.ts);
    if (monthFilter !== 'todos') list = list.filter(o => K.periods.monthKey(o.ts) === monthFilter);
    return list;
  }, [customer.orders, monthFilter]);

  const paymentOrder = paymentOrderId ? store.orders.find(o => o.id === paymentOrderId) : null;
  const creditNoteOrder = creditNoteOrderId ? store.orders.find(o => o.id === creditNoteOrderId) : null;
  const selectedOrders = orders.filter(o => selectedIds.has(o.id));

  /* Aplica el crédito disponible del cliente al pedido indicado, como un pago con
     metodo "Nota de crédito". Descuenta lo que alcance del saldo. */
  function applyCreditToOrder(target) {
    const available = customer.creditAvailable || 0;
    if (available <= 0) return;
    const total = Number(target.total) || 0;
    const saldo = total - paidOf(target);
    if (saldo <= 0) return;
    const applied = Math.min(available, saldo);
    if (!confirm(`¿Aplicar ${fmt(applied)} de crédito disponible al remito ${remitoNumOf(target)}?`)) return;
    const nuevos = [...(target.payments || []), {
      ts: Date.now(), fecha: hoyAR(), monto: applied, metodo: 'Nota de crédito',
      esCredito: true, notas: 'Crédito por devolución aplicado',
    }].map(p => ({ ...p, monto: Number(p.monto) || 0 }));
    const nuevoPaid = nuevos.reduce((s, p) => s + p.monto, 0);
    store.updateOrderPayments(target.id, {
      payments: nuevos,
      paymentStatus: nuevoPaid >= total ? 'pagado' : 'parcial',
      adminNotes: target.adminNotes || '',
    });
  }

  const toggleSel = (id) => setSelectedIds(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(orders.map(o => o.id)));

  return (
    <div className="adm-split__detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: 0 }}>
            {customer.name || 'Sin nombre'}
          </h3>
          <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 4 }}>
            {customer.dni && <span>DNI {customer.dni} · </span>}
            {customer.email && <span>{customer.email} · </span>}
            {customer.contact && <span>{customer.contact}</span>}
          </div>
          {(customer.address || customer.city) && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
              📍 {[customer.address, customer.city, customer.postalCode].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
          {puedeCobrar && (
            <button className="adm-btn adm-btn--primary adm-btn--sm"
              onClick={() => setGeneralOpen(true)} disabled={customer.totalPending <= 0}
              title="Registrar un pago que se reparte entre todos los pedidos con saldo del cliente">
              Registrar pago general
            </button>
          )}
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
      </div>

      <div className="adm-box" style={{ display: 'grid', gap: 12, marginBottom: 16,
        gridTemplateColumns: `repeat(${creditAvail > 0 ? 4 : 3}, 1fr)` }}>
        <CCStat label="Total comprado" value={fmt(customer.totalSpent)} />
        <CCStat label="Total pagado" value={fmt(customer.totalPaid)} color="var(--text-brand)" />
        <CCStat label="Saldo pendiente" value={fmt(customer.totalPending)}
          color={customer.totalPending > 0 ? '#B71C1C' : 'var(--text-brand)'} />
        {creditAvail > 0 && <CCStat label="Crédito disponible" value={fmt(creditAvail)} color="#1C6CAE" />}
      </div>

      {puedeCobrar && selectedIds.size > 0 && (
        <div className="adm-box adm-box--brand" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-brand)' }}>
            {selectedIds.size} pedido{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setBulkOpen(true)}>
            Registrar pago a {selectedIds.size} pedido{selectedIds.size !== 1 ? 's' : ''}
          </button>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setSelectedIds(new Set())}>Limpiar</button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="adm-empty">Sin pedidos en el período seleccionado.</div>
      ) : (
        <div className="adm-tblwrap">
          <table className="adm-tbl adm-tbl--tight">
            <thead><tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  title="Seleccionar todos" style={{ cursor: 'pointer' }} />
              </th>
              <th>Fecha</th><th>Remito</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th style={{ textAlign: 'right' }}>Pagado</th>
              <th style={{ textAlign: 'right' }}>Saldo</th>
              <th>Estado</th><th></th>
            </tr></thead>
            <tbody>
              {orders.map(o => {
                const total = Number(o.total) || 0;
                const paid = paidOf(o);
                const saldo = total - paid;
                const status = o.paymentStatus || (saldo <= 0 ? 'pagado' : paid > 0 ? 'parcial' : 'pendiente');
                return (
                  <tr key={o.id} className={selectedIds.has(o.id) ? 'row--sel' : ''}>
                    <td>
                      <input type="checkbox" checked={selectedIds.has(o.id)}
                        onChange={() => toggleSel(o.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>{new Date(o.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                    <td className="mono">{remitoNumOf(o)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(total)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-brand)' }}>{fmt(paid)}</td>
                    <td style={{ textAlign: 'right', fontWeight: saldo > 0 ? 800 : 400,
                      color: saldo > 0 ? '#B71C1C' : 'var(--ink-400)' }}>{fmt(saldo)}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                        color: PAGO_COLOR[status] || 'var(--ink-400)' }}>
                        {PAGO_LABEL[status] || status}
                      </span>
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button className={`adm-btn adm-btn--xs ${status === 'pagado' ? 'adm-btn--outline' : 'adm-btn--primary'}`}
                          onClick={() => setPaymentOrderId(o.id)}>
                          {status === 'pagado' || !puedeCobrar ? 'Ver pagos' : 'Registrar pago'}
                        </button>
                        {puedeCredito && creditAvail > 0 && saldo > 0 && status !== 'anulado' && (
                          <button className="adm-btn adm-btn--info adm-btn--xs" onClick={() => applyCreditToOrder(o)}
                            title="Descontar el crédito disponible del cliente de este pedido">
                            Aplicar crédito
                          </button>
                        )}
                        {puedeCredito && (
                          <button className="adm-btn adm-btn--outline adm-btn--xs" onClick={() => setCreditNoteOrderId(o.id)}
                            title="Emitir una nota de crédito por productos fallados o devueltos">
                            Nota de crédito
                          </button>
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

      {paymentOrder && <PaymentModal order={paymentOrder} store={store} onClose={() => setPaymentOrderId(null)} />}
      {bulkOpen && (
        <BulkPaymentModal orders={selectedOrders} store={store}
          onClose={() => setBulkOpen(false)}
          onDone={() => { setBulkOpen(false); setSelectedIds(new Set()); }} />
      )}
      {creditNoteOrder && <CreditNoteModal order={creditNoteOrder} store={store} onClose={() => setCreditNoteOrderId(null)} />}
      {generalOpen && (
        <GeneralPaymentModal customer={customer} orders={customer.orders} store={store}
          onClose={() => setGeneralOpen(false)} onDone={() => setGeneralOpen(false)} />
      )}
    </div>
  );
}

/* ═══════════════ Control de pagos ════════════════════════ */
function AdminCuentaCorriente({ store }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [monthFilter, setMonthFilter] = useState('todos');
  const [filterSaldo, setFilterSaldo] = useState('todos');
  const [search, setSearch] = useState('');

  const customers = useMemo(() => window.VcoreCustomers.groupFromOrders(store.orders), [store.orders]);

  const months = useMemo(() => {
    const set = new Set();
    store.orders.forEach(o => set.add(K.periods.monthKey(o.ts)));
    return Array.from(set).sort().reverse();
  }, [store.orders]);

  const filteredCustomers = useMemo(() => {
    let list = customers;
    /* Al filtrar por mes recalculamos los totales SOLO con pedidos de ese mes y
       excluimos a los clientes sin pedidos en el período. */
    if (monthFilter !== 'todos') {
      const recalc = [];
      customers.forEach(c => {
        const inMonth = c.orders.filter(o => K.periods.monthKey(o.ts) === monthFilter);
        if (!inMonth.length) return;
        let totalSpent = 0, totalPaid = 0, totalPending = 0;
        inMonth.forEach(o => {
          if (o.status === 'anulado' || o.paymentStatus === 'anulado') return;
          const total = Number(o.total) || 0;
          const paid = paidOf(o);
          totalSpent += total; totalPaid += paid; totalPending += (total - paid);
        });
        recalc.push({ ...c, orderCount: inMonth.length, totalSpent, totalPaid, totalPending });
      });
      list = recalc;
    }
    const q = searchNormalize(search.trim());
    return list.filter(c => {
      if (filterSaldo === 'con-saldo' && c.totalPending <= 0) return false;
      if (filterSaldo === 'sin-saldo' && c.totalPending > 0) return false;
      /* "Cuenta corriente": clientes con al menos un pedido marcado así. */
      if (filterSaldo === 'cuenta-corriente' && !(c.orders || []).some(o => o.paymentStatus === 'cuenta-corriente')) return false;
      if (q) {
        const hay = searchNormalize([c.name, c.dni, c.email, ...(c.orders || []).map(o => o.remito && o.remito.numero)]
          .filter(Boolean).join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customers, filterSaldo, monthFilter, search]);

  const selectedCustomer = customers.find(c => c.key === selectedKey);

  /* Totales del mes seleccionado, desglosados por método de cobro. */
  const monthTotals = useMemo(() => {
    if (monthFilter === 'todos') return null;
    const monthOrders = store.orders.filter(o => K.periods.monthKey(o.ts) === monthFilter);
    let ventas = 0, cobrado = 0, pendiente = 0, efectivo = 0, transferencia = 0, anulado = 0;
    monthOrders.forEach(o => {
      if (o.status === 'anulado' || o.paymentStatus === 'anulado') { anulado++; return; }
      const total = Number(o.total) || 0;
      const paid = paidOf(o);
      ventas += total; cobrado += paid; pendiente += (total - paid);
      (o.payments || []).forEach(p => {
        if (p.metodo === 'Efectivo') efectivo += Number(p.monto) || 0;
        else if (p.metodo === 'Transferencia') transferencia += Number(p.monto) || 0;
      });
    });
    return { ventas, cobrado, pendiente, efectivo, transferencia, anulado, count: monthOrders.length };
  }, [store.orders, monthFilter]);

  return (
    <div>
      <div className="adm-head">
        <div className="adm-eye">Cobranzas</div>
        <h1>Control de pagos</h1>
        <div className="adm-head__sub">Saldos pendientes por cliente — ventas y pagos por mes.</div>
      </div>

      <div className="adm-panel">
        <div className="adm-bar adm-bar--stack">
          <div className="adm-chiprow">
            <span className="adm-chiprow__lbl">Mes:</span>
            <button className={`adm-fchip${monthFilter === 'todos' ? ' on' : ''}`} onClick={() => setMonthFilter('todos')}>Todos</button>
            {months.slice(0, 6).map(ym => (
              <button key={ym} className={`adm-fchip${monthFilter === ym ? ' on' : ''}`} onClick={() => setMonthFilter(ym)}>
                {K.periods.monthLabelShort(ym)}
              </button>
            ))}
            <span className="adm-chiprow__lbl" style={{ marginLeft: 12 }}>Saldo:</span>
            <button className={`adm-fchip${filterSaldo === 'todos' ? ' on' : ''}`} onClick={() => setFilterSaldo('todos')}>Todos</button>
            <button className={`adm-fchip${filterSaldo === 'con-saldo' ? ' on' : ''}`} onClick={() => setFilterSaldo('con-saldo')}>Con deuda</button>
            <button className={`adm-fchip${filterSaldo === 'sin-saldo' ? ' on' : ''}`} onClick={() => setFilterSaldo('sin-saldo')}>Saldadas</button>
            <button className={`adm-fchip${filterSaldo === 'cuenta-corriente' ? ' on' : ''}`} onClick={() => setFilterSaldo('cuenta-corriente')}>Cuenta corriente</button>
          </div>
          <div className="adm-search adm-search--wide">
            <IcoSearch size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI o N° de remito…" />
          </div>
        </div>

        {monthTotals && (
          <div className="adm-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12,
            padding: '16px 22px', borderRadius: 0, borderBottom: '1px solid var(--border-default)' }}>
            <CCStat label="Ventas mes" value={fmt(monthTotals.ventas)} />
            <CCStat label="Cobrado" value={fmt(monthTotals.cobrado)} color="var(--text-brand)" />
            <CCStat label="Pendiente" value={fmt(monthTotals.pendiente)} color="#B71C1C" />
            <CCStat label="Efectivo" value={fmt(monthTotals.efectivo)} />
            <CCStat label="Transfer." value={fmt(monthTotals.transferencia)} />
            <CCStat label="Anulados" value={String(monthTotals.anulado)} />
          </div>
        )}

        <div className={`adm-split${selectedCustomer ? '' : ' adm-split--solo'}`}>
          <div className="adm-split__list">
            {filteredCustomers.length === 0 ? (
              <div className="adm-empty">Sin clientes para mostrar.</div>
            ) : filteredCustomers.map(c => (
              <button key={c.key} className={`adm-split__item${selectedKey === c.key ? ' on' : ''}`}
                onClick={() => setSelectedKey(c.key)}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name || '—'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>
                  {c.dni && `DNI ${c.dni} · `}{c.orderCount} pedido{c.orderCount !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>Saldo</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800,
                    color: c.totalPending > 0 ? '#B71C1C' : 'var(--text-brand)' }}>
                    {fmt(c.totalPending)}
                  </span>
                </div>
                {c.creditAvailable > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 11.5, color: '#1C6CAE' }}>Crédito a favor</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1C6CAE' }}>{fmt(c.creditAvailable)}</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedCustomer && (
            <CustomerAccountDetail customer={selectedCustomer} monthFilter={monthFilter}
              store={store} onClose={() => setSelectedKey(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Facturación ═════════════════════════ */
function AdminFacturacion({ store }) {
  const [periodo, setPeriodo] = useState('mes-actual');
  const R = window.VcoreRemitos;

  const months = useMemo(() => {
    const set = new Set();
    (store.orders || []).forEach(o => set.add(K.periods.monthKey(o.ts)));
    return Array.from(set).sort().reverse();
  }, [store.orders]);

  const bounds = useMemo(() => K.periods.periodBounds(periodo), [periodo]);

  const data = useMemo(() => {
    const inPeriod = (store.orders || []).filter(o => {
      if (!bounds) return true;
      const t = Number(o.ts) || 0;
      return t >= bounds.from && t <= bounds.to;
    });
    const vigentes = inPeriod.filter(o => o.status !== 'anulado');
    const anulados = inPeriod.filter(o => o.status === 'anulado');

    let facturado = 0, cobrado = 0;
    const metodos = {};
    const tipos = {};
    D.tiers.forEach(t => { tipos[t.id] = 0; });
    let sinCobrarCount = 0, pagadosCount = 0, parcialCount = 0;
    const productAgg = new Map();

    vigentes.forEach(o => {
      const total = Number(o.total) || 0;
      const paid = Math.min(paidOf(o), total);
      facturado += total; cobrado += paid;
      const tipo = R ? R.tipoClienteDe(o) : 'retail';
      tipos[tipo] = (tipos[tipo] || 0) + total;
      (o.payments || []).forEach(p => {
        const met = p.metodo || 'Otro';
        metodos[met] = (metodos[met] || 0) + (Number(p.monto) || 0);
      });
      const saldo = total - paid;
      if (saldo <= 0 && paid > 0) pagadosCount++;
      else if (paid > 0) parcialCount++;
      else sinCobrarCount++;

      (o.items || []).forEach(it => {
        const k = R ? R.itemDesc(it) : (it.name || '—');
        const cur = productAgg.get(k) || { name: k, qty: 0, revenue: 0 };
        cur.qty += Number(it.qty) || 0;
        cur.revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
        productAgg.set(k, cur);
      });
    });

    return {
      facturado, cobrado, porCobrar: Math.max(facturado - cobrado, 0),
      anuladoMonto: anulados.reduce((s, o) => s + (Number(o.total) || 0), 0),
      anuladosCount: anulados.length, vigentesCount: vigentes.length,
      metodos, tipos, sinCobrarCount, pagadosCount, parcialCount,
      ticket: vigentes.length ? facturado / vigentes.length : 0,
      topProducts: [...productAgg.values()].sort((a, b) => b.qty - a.qty).slice(0, 10),
      rows: vigentes,
    };
  }, [store.orders, bounds, R]);

  const lbl = K.periods.periodoLabel(periodo);
  const metodoRows = Object.entries(data.metodos).sort((a, b) => b[1] - a[1]);

  function exportCSV() {
    const header = ['ID', 'Remito', 'Fecha', 'Cliente', 'DNI', 'Teléfono', 'Total', 'Pagado', 'Saldo', 'Estado', 'Origen'];
    const rows = data.rows.map(o => {
      const paid = paidOf(o);
      return [
        o.id, remitoNumOf(o), new Date(o.ts).toLocaleDateString('es-AR'),
        o.customerName || '', o.customerDni || '', o.customerPhone || '',
        Math.round(Number(o.total) || 0), Math.round(paid), Math.round((Number(o.total) || 0) - paid),
        o.status || 'nuevo', o.origen || 'web',
      ];
    });
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `facturacion_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Reportes</div>
            <h1>Facturación</h1>
            <div className="adm-head__sub">Cobrado, pendiente y anulado por período.</div>
          </div>
          <button className="adm-btn adm-btn--outline" onClick={exportCSV} disabled={!data.rows.length}>
            <IcoDown size={13} /> Exportar CSV
          </button>
        </div>
      </div>

      <K.periods.PeriodFilter periodo={periodo} onChange={setPeriodo} months={months} />

      <div className="adm-stats">
        <div className="adm-stat">
          <h4>Facturado</h4><p className="sv">{fmt(data.facturado)}</p>
          <p className="adm-stat__desc">{data.vigentesCount} pedidos · {lbl}</p>
        </div>
        <div className="adm-stat">
          <h4>Cobrado</h4><p className="sv" style={{ color: 'var(--text-brand)' }}>{fmt(data.cobrado)}</p>
          <p className="adm-stat__desc">{data.pagadosCount} pagados · {data.parcialCount} parciales</p>
        </div>
        <div className="adm-stat">
          <h4>Por cobrar</h4>
          <p className="sv" style={{ color: data.porCobrar > 0 ? '#B71C1C' : 'var(--text-brand)' }}>{fmt(data.porCobrar)}</p>
          <p className="adm-stat__desc">{data.sinCobrarCount} sin cobrar</p>
        </div>
        <div className="adm-stat">
          <h4>Anulado</h4><p className="sv" style={{ color: 'var(--ink-400)' }}>{fmt(data.anuladoMonto)}</p>
          <p className="adm-stat__desc">{data.anuladosCount} pedidos anulados</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="adm-panel">
          <div className="adm-panel__hd"><h3>Cobrado por método de pago</h3></div>
          {metodoRows.length === 0 ? (
            <div className="adm-empty">Sin pagos registrados en el período.</div>
          ) : (
            <table className="adm-tbl">
              <thead><tr><th>Método</th><th style={{ textAlign: 'right' }}>Monto</th></tr></thead>
              <tbody>
                {metodoRows.map(([met, monto]) => (
                  <tr key={met}>
                    <td>{met}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-panel">
          <div className="adm-panel__hd"><h3>Facturado por tipo de cliente</h3></div>
          <table className="adm-tbl">
            <thead><tr><th>Tipo</th><th style={{ textAlign: 'right' }}>Facturado</th></tr></thead>
            <tbody>
              {D.tiers.map(t => (
                <tr key={t.id}>
                  <td>{t.label}{t.badge ? ` (${t.badge})` : ''}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{fmt(data.tipos[t.id] || 0)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ fontWeight: 800 }}>Ticket promedio</td>
                <td className="num" style={{ textAlign: 'right' }}>{data.vigentesCount ? fmt(data.ticket) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel__hd"><h3>Top productos del período</h3></div>
        {data.topProducts.length === 0 ? (
          <div className="adm-empty"><IcoChart size={30} /><div>Sin ventas en el período.</div></div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead><tr>
                <th>#</th><th>Producto</th>
                <th style={{ textAlign: 'right' }}>Unidades</th>
                <th style={{ textAlign: 'right' }}>Facturación</th>
              </tr></thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td className="num" style={{ color: 'var(--ink-400)' }}>{i + 1}</td>
                    <td style={{ fontSize: 13 }}>{p.name}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{p.qty}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

window.VcorePagos = { PaymentModal, CreditNoteModal, printComprobantePago, printNotaCredito, creditNoteLines };
window.VcoreAdminSections = window.VcoreAdminSections || {};
window.VcoreAdminSections.cuenta = AdminCuentaCorriente;
window.VcoreAdminSections.facturacion = AdminFacturacion;

export default null;
