/* Vcore — Admin: clientes (CRM derivado de los pedidos).
   Los clientes no viven en una tabla: se agrupan a partir de los pedidos. Por eso
   editar un cliente reescribe sus datos en TODOS sus pedidos.

   Registra window.VcoreAdminSections.clientes y publica window.VcoreCustomers,
   que usan la remitera y el control de pagos. */
const React = window.React;
const { useState, useEffect, useMemo } = React;
const K = window.VcoreAdminKit;
const { fmt, searchNormalize, IcoSearch, IcoClose, IcoEdit, IcoUsers, IcoDown, STATUS_COLORS } = K;

/* ── normalización de identidad ── */
const normDni   = (s) => String(s == null ? '' : s).replace(/\D/g, '');
const normEmail = (s) => String(s == null ? '' : s).trim().toLowerCase();
const normName  = (s) => searchNormalize(String(s == null ? '' : s).trim().replace(/\s+/g, ' '));

/* Clave estable de un cliente: DNI si lo tiene, si no email, si no el nombre. */
function customerKeyOf({ dni, email, name }) {
  const d = normDni(dni), e = normEmail(email);
  return d ? ('d:' + d) : e ? ('e:' + e) : ('n:' + normName(name));
}

/* Campos del pedido que describen al cliente (nombre en el pedido → nombre en la ficha). */
const CUSTOMER_FIELDS = {
  name: 'customerName', dni: 'customerDni', email: 'customerEmail',
  contact: 'customerPhone', address: 'customerAddress', city: 'customerCity',
  postalCode: 'customerPostalCode', notasCliente: 'notasCliente',
};

/* Agrupa los pedidos por CLIENTE real con union-find: dos pedidos son del mismo
   cliente si comparten DNI, email o nombre (normalizados). El DNI une siempre; el
   email y el nombre unen salvo que los dos grupos ya tengan DNIs distintos (dos
   personas que comparten nombre o mail pero no son la misma). Así, aunque un
   pedido traiga el DNI con puntos y otro solo el nombre, todos caen en el MISMO
   control de pagos. */
function groupFromOrders(orders) {
  /* Solo pedidos vigentes y con al menos un dato identificatorio. */
  const active = (orders || []).filter(o => {
    if (o.status === 'anulado' || o.paymentStatus === 'anulado') return false;
    return normDni(o.customerDni) || normEmail(o.customerEmail) || normName(o.customerName);
  });
  if (!active.length) return [];

  const parent = active.map((_, i) => i);
  const dsets = new Map();                    // raíz → Set de DNIs presentes en el grupo
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return;
    parent[ra] = rb;
    const sa = dsets.get(ra), sb = dsets.get(rb);
    if (sa) { if (sb) sa.forEach(d => sb.add(d)); else dsets.set(rb, sa); dsets.delete(ra); }
  };
  /* ¿Unir a y b sin fusionar dos personas con DNIs distintos? */
  const noDniConflict = (a, b) => {
    const sa = dsets.get(find(a)), sb = dsets.get(find(b));
    if (!sa || !sb || !sa.size || !sb.size) return true;
    for (const d of sa) if (sb.has(d)) return true;
    return false;
  };

  const info = active.map(o => ({
    dni: normDni(o.customerDni), email: normEmail(o.customerEmail), name: normName(o.customerName),
  }));
  active.forEach((_, i) => { if (info[i].dni) dsets.set(i, new Set([info[i].dni])); });

  const indexBy = (get) => {
    const m = new Map();
    active.forEach((_, i) => { const v = get(i); if (v) { if (!m.has(v)) m.set(v, []); m.get(v).push(i); } });
    return m;
  };
  const byDni   = indexBy(i => info[i].dni);
  const byEmail = indexBy(i => info[i].email);
  const byName  = indexBy(i => info[i].name);

  for (const arr of byDni.values())   for (let k = 1; k < arr.length; k++) union(arr[0], arr[k]);
  for (const arr of byEmail.values()) for (let k = 1; k < arr.length; k++) if (noDniConflict(arr[0], arr[k])) union(arr[0], arr[k]);
  for (const arr of byName.values())  for (let k = 1; k < arr.length; k++) if (noDniConflict(arr[0], arr[k])) union(arr[0], arr[k]);

  const groups = new Map();
  active.forEach((o, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(o);
  });

  const customers = [];
  for (const groupOrders of groups.values()) {
    const sorted = [...groupOrders].sort((a, b) => b.ts - a.ts);   // más reciente primero
    /* Toma el dato más reciente NO vacío de cada campo, aunque el último pedido lo omita. */
    const pick = (orderField) => {
      for (const o of sorted) {
        const v = o[orderField];
        if (v != null && String(v).trim() !== '') return v;
      }
      return '';
    };
    let totalSpent = 0, totalPaid = 0, totalPending = 0, creditEarned = 0, creditSpent = 0;
    let firstOrder = groupOrders[0].ts, lastOrder = groupOrders[0].ts;
    for (const o of groupOrders) {
      const total = Number(o.total) || 0;
      const paid = (o.payments || []).reduce((s, p) => s + (Number(p.monto) || 0), 0);
      totalSpent += total; totalPaid += paid; totalPending += (total - paid);
      creditEarned += (o.creditNotes || []).reduce((s, n) => s + (Number(n.monto) || 0), 0);
      creditSpent  += (o.payments || []).reduce((s, p) => s + (p.esCredito ? (Number(p.monto) || 0) : 0), 0);
      creditSpent  += Number(o.creditApplied) || 0;    // crédito descontado en remitos
      if (o.ts < firstOrder) firstOrder = o.ts;
      if (o.ts > lastOrder)  lastOrder = o.ts;
    }
    const ficha = {};
    Object.keys(CUSTOMER_FIELDS).forEach(k => { ficha[k] = pick(CUSTOMER_FIELDS[k]); });

    customers.push({
      ...ficha,
      key: customerKeyOf(ficha),
      orderCount: groupOrders.length, totalSpent, totalPaid, totalPending,
      creditEarned, creditSpent, creditAvailable: Math.max(creditEarned - creditSpent, 0),
      firstOrder, lastOrder, orders: groupOrders,
    });
  }
  return customers.sort((a, b) => b.lastOrder - a.lastOrder);
}

/* ── export a Excel ── */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function exportCustomersAsExcel(customers, filename = 'clientes.xls') {
  const cols = [
    ['Nombre', c => c.name || '—'], ['DNI', c => c.dni], ['Email', c => c.email],
    ['Contacto', c => c.contact], ['Domicilio', c => c.address], ['Localidad', c => c.city],
    ['CP', c => c.postalCode], ['Pedidos', c => c.orderCount],
    ['Total comprado', c => Math.round(c.totalSpent)], ['Pagado', c => Math.round(c.totalPaid)],
    ['Saldo pendiente', c => Math.round(c.totalPending)],
    ['Crédito a favor', c => Math.round(c.creditAvailable)],
    ['Primera compra', c => new Date(c.firstOrder).toLocaleDateString('es-AR')],
    ['Última compra', c => new Date(c.lastOrder).toLocaleDateString('es-AR')],
  ];
  const headers = `<tr style="background:#0D3D25;color:#fff;font-weight:700">${
    cols.map(([h]) => `<th style="border:1px solid #888;padding:6px 10px">${h}</th>`).join('')}</tr>`;
  const rows = customers.map(c => `<tr>${
    cols.map(([, get]) => `<td style="border:1px solid #bbb;padding:5px 10px">${esc(get(c))}</td>`).join('')}</tr>`).join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Clientes</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head><body><table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">
${headers}${rows}</table></body></html>`;

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ═══════════ Editor de la ficha del cliente ═══════════════ */
function ClienteEditor({ customer, store, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const f = {};
    Object.keys(CUSTOMER_FIELDS).forEach(k => { f[k] = customer[k] || ''; });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const cantidad = (customer.orders || []).length;

  function guardar() {
    if (!form.name.trim()) { alert('El nombre del cliente no puede quedar vacío.'); return; }
    setSaving(true);
    const ficha = {};
    Object.keys(CUSTOMER_FIELDS).forEach(k => { ficha[k] = String(form[k] || '').trim(); });
    /* Se escribe en los campos del pedido, que son la fuente real. */
    const patch = {};
    Object.keys(CUSTOMER_FIELDS).forEach(k => { patch[CUSTOMER_FIELDS[k]] = ficha[k]; });
    store.updateCustomerInfo((customer.orders || []).map(o => o.id), patch);
    setSaving(false);
    /* Cambiar el DNI o el email cambia la clave de agrupación: avisamos hacia
       arriba para que la ficha abierta siga siendo la misma. */
    if (onSaved) onSaved(customerKeyOf(ficha));
    onClose();
  }

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal__hd">
          <h3>Editar cliente — {customer.name || 'sin nombre'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <div className="adm-box" style={{ fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.5 }}>
            Los datos del cliente se guardan en sus pedidos. Al confirmar, se actualizan
            en <strong>{cantidad} pedido{cantidad !== 1 ? 's' : ''}</strong> y en sus remitos futuros.
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Nombre y apellido</label>
              <input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="adm-field"><label>DNI / CUIT</label>
              <input value={form.dni} onChange={e => upd('dni', e.target.value)} placeholder="Ej. 30.123.456" />
            </div>
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Email</label>
              <input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div className="adm-field"><label>Teléfono / contacto</label>
              <input value={form.contact} onChange={e => upd('contact', e.target.value)} placeholder="Ej. 11 5555-1234" />
            </div>
          </div>
          <div className="adm-field"><label>Domicilio</label>
            <input value={form.address} onChange={e => upd('address', e.target.value)} placeholder="Calle, número, piso, depto" />
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Localidad</label>
              <input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Ej. Vicente López" />
            </div>
            <div className="adm-field"><label>Código postal</label>
              <input value={form.postalCode} onChange={e => upd('postalCode', e.target.value)} placeholder="1602" />
            </div>
          </div>
          <div className="adm-field"><label>Notas del cliente</label>
            <textarea rows={3} value={form.notasCliente} onChange={e => upd('notasCliente', e.target.value)}
              placeholder="Preferencias, condiciones de pago acordadas, lo que necesites recordar…" />
          </div>
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn--primary" onClick={guardar} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Ficha completa del cliente ═══════════════════ */
function ClienteDetail({ customer, store, onClose, onKeyChange }) {
  const [editing, setEditing] = useState(false);
  const [remitoOrderId, setRemitoOrderId] = useState(null);
  const { CCStat } = K;
  const R = window.VcoreRemitos;

  const puedeEditar = store.can('clientes.editar');
  const puedeVerRemito = store.can('pedidos.ver');
  const puedeEditarRemito = store.can('pedidos.editar');

  const orders = useMemo(() => [...(customer.orders || [])].sort((a, b) => b.ts - a.ts), [customer.orders]);
  const remitoOrder = remitoOrderId ? store.orders.find(o => o.id === remitoOrderId) : null;

  const pagoColor = { pagado: 'var(--text-brand)', parcial: '#B08A1A', pendiente: '#B71C1C',
    'cuenta-corriente': '#1C6CAE', anulado: 'var(--ink-400)' };
  const fechaCorta = (ts) => new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="adm-panel">
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>
              {customer.name || 'Sin nombre'}
            </h3>
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 5, lineHeight: 1.6 }}>
              {customer.dni && <span>DNI {customer.dni} · </span>}
              {customer.email && <span>{customer.email} · </span>}
              {customer.contact && <span>{customer.contact}</span>}
              {(customer.address || customer.city) && (
                <div>📍 {[customer.address, customer.city, customer.postalCode].filter(Boolean).join(', ')}</div>
              )}
              <div>Cliente desde {fechaCorta(customer.firstOrder)} · última compra {fechaCorta(customer.lastOrder)}</div>
            </div>
            {customer.notasCliente && (
              <div className="adm-box" style={{ marginTop: 10, borderLeft: '3px solid var(--green-500)',
                fontSize: 12.5, color: 'var(--ink-600)', maxWidth: 560, whiteSpace: 'pre-wrap' }}>
                {customer.notasCliente}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
            {puedeEditar && (
              <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setEditing(true)}>
                <IcoEdit size={13} /> Editar datos
              </button>
            )}
            <button className="adm-close" onClick={onClose} title="Cerrar ficha"><IcoClose size={15} /></button>
          </div>
        </div>

        <div className="adm-box" style={{ display: 'grid', gap: 12, marginBottom: 18,
          gridTemplateColumns: `repeat(${customer.creditAvailable > 0 ? 5 : 4}, 1fr)` }}>
          <CCStat label="Pedidos" value={String(customer.orderCount)} />
          <CCStat label="Total comprado" value={fmt(customer.totalSpent)} />
          <CCStat label="Total pagado" value={fmt(customer.totalPaid)} color="var(--text-brand)" />
          <CCStat label="Saldo pendiente" value={fmt(customer.totalPending)}
            color={customer.totalPending > 0 ? '#B71C1C' : 'var(--text-brand)'} />
          {customer.creditAvailable > 0 && (
            <CCStat label="Crédito a favor" value={fmt(customer.creditAvailable)} color="#1C6CAE" />
          )}
        </div>

        <div className="adm-ccstat__l" style={{ marginBottom: 8 }}>Historial de compras</div>
        {orders.length === 0 ? (
          <div className="adm-empty">Este cliente no tiene pedidos.</div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl adm-tbl--tight">
              <thead><tr>
                <th>Fecha</th><th>Remito</th><th>Items</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Pagado</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Pedido</th><th>Pago</th><th></th>
              </tr></thead>
              <tbody>
                {orders.map(o => {
                  const total = Number(o.total) || 0;
                  const paid = K.paidOf(o);
                  const saldo = total - paid;
                  const pago = o.paymentStatus || (saldo <= 0 ? 'pagado' : paid > 0 ? 'parcial' : 'pendiente');
                  return (
                    <tr key={o.id}>
                      <td>{fechaCorta(o.ts)}</td>
                      <td className="mono">{(o.remito && o.remito.numero) || o.id}</td>
                      <td>
                        {(o.items || []).length} línea{(o.items || []).length !== 1 ? 's' : ''} / {(o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0)} u.
                      </td>
                      <td className="num" style={{ textAlign: 'right' }}>{fmt(total)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-brand)' }}>{fmt(paid)}</td>
                      <td style={{ textAlign: 'right', fontWeight: saldo > 0 ? 800 : 400,
                        color: saldo > 0 ? '#B71C1C' : 'var(--ink-400)' }}>{fmt(saldo)}</td>
                      <td><span className={`adm-chip ${STATUS_COLORS[o.status] || 'adm-chip--nuevo'}`}>{o.status || 'nuevo'}</span></td>
                      <td><span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                        color: pagoColor[pago] || 'var(--ink-400)' }}>
                        {pago === 'cuenta-corriente' ? 'cta. corriente' : pago}
                      </span></td>
                      <td style={{ textAlign: 'right' }}>
                        {puedeVerRemito && (
                          <button className="adm-btn adm-btn--outline adm-btn--xs" onClick={() => setRemitoOrderId(o.id)}>
                            Ver remito
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <ClienteEditor customer={customer} store={store} onSaved={onKeyChange} onClose={() => setEditing(false)} />}
      {remitoOrder && R && (
        <R.RemitoModal store={store} order={remitoOrder}
          readOnly={remitoOrder.status === 'entregado' || remitoOrder.status === 'anulado' || !puedeEditarRemito}
          onClose={() => setRemitoOrderId(null)} />
      )}
    </div>
  );
}

/* ═══════════════════ Listado de clientes ═════════════════ */
function AdminClientes({ store }) {
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [detailKey, setDetailKey] = useState(null);

  const customers = useMemo(() => groupFromOrders(store.orders), [store.orders]);
  const filtered = useMemo(() => {
    const q = searchNormalize(search.trim());
    if (!q) return customers;
    return customers.filter(c =>
      searchNormalize([c.name, c.dni, c.email, c.contact, c.city].filter(Boolean).join(' ')).includes(q));
  }, [customers, search]);

  /* La ficha se relee de `customers` en cada render para que se actualice sola al
     editar los datos o registrar un pago. */
  const detalle = detailKey ? customers.find(c => c.key === detailKey) : null;

  const toggle = (key) => setSelectedKeys(prev => {
    const n = new Set(prev);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });
  const allVisibleSelected = filtered.length > 0 && filtered.every(c => selectedKeys.has(c.key));
  const toggleAll = () => setSelectedKeys(prev => {
    const n = new Set(prev);
    if (allVisibleSelected) filtered.forEach(c => n.delete(c.key));
    else filtered.forEach(c => n.add(c.key));
    return n;
  });

  const stamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const exportSelected = () => {
    const sel = customers.filter(c => selectedKeys.has(c.key));
    if (sel.length) exportCustomersAsExcel(sel, `clientes_${stamp()}.xls`);
  };
  const exportAll = () => exportCustomersAsExcel(customers, `clientes_todos_${stamp()}.xls`);

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Gestión</div>
            <h1>Clientes</h1>
            <div className="adm-head__sub">{customers.length} clientes únicos derivados de los pedidos.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedKeys.size > 0 && (
              <button className="adm-btn adm-btn--primary" onClick={exportSelected}>
                <IcoDown size={13} /> Exportar {selectedKeys.size}
              </button>
            )}
            <button className="adm-btn adm-btn--outline" onClick={exportAll} disabled={!customers.length}>
              <IcoDown size={13} /> Exportar todos
            </button>
          </div>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-bar">
          <div className="adm-search" style={{ maxWidth: 380 }}>
            <IcoSearch size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI, email, contacto…" />
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-400)' }}>
            {filtered.length} de {customers.length}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="adm-empty">
            <IcoUsers size={32} />
            <div>Sin clientes todavía. Se registran automáticamente al confirmarse un pedido con nombre, DNI o email.</div>
          </div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead><tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                </th>
                <th>Cliente</th><th>DNI</th><th>Email</th><th>Contacto</th>
                <th style={{ textAlign: 'right' }}>Pedidos</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Pagado</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Última compra</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.key} className={detailKey === c.key || selectedKeys.has(c.key) ? 'row--sel' : ''}
                    style={{ cursor: 'pointer' }} title="Ver ficha, historial y estado de cuenta"
                    onClick={() => setDetailKey(detailKey === c.key ? null : c.key)}>
                    {/* El check de exportación no debe abrir la ficha. */}
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedKeys.has(c.key)}
                        onChange={() => toggle(c.key)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name || '—'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{c.city}</div>
                    </td>
                    <td className="mono">{c.dni || '—'}</td>
                    <td style={{ fontSize: 12.5 }}>{c.email || '—'}</td>
                    <td style={{ fontSize: 12.5 }}>{c.contact || '—'}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{c.orderCount}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(c.totalSpent)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-brand)', fontWeight: 700 }}>{fmt(c.totalPaid)}</td>
                    <td style={{ textAlign: 'right', fontWeight: c.totalPending > 0 ? 800 : 400,
                      color: c.totalPending > 0 ? '#B71C1C' : 'var(--ink-400)' }}>{fmt(c.totalPending)}</td>
                    <td style={{ fontSize: 12.5 }}>
                      {new Date(c.lastOrder).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <ClienteDetail customer={detalle} store={store}
          onKeyChange={setDetailKey} onClose={() => setDetailKey(null)} />
      )}
    </div>
  );
}

window.VcoreCustomers = { groupFromOrders, customerKeyOf, exportCustomersAsExcel, CUSTOMER_FIELDS };
window.VcoreAdminSections = window.VcoreAdminSections || {};
window.VcoreAdminSections.clientes = AdminClientes;

export default null;
