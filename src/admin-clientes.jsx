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

/* ── ficha ampliada (CRM) ──────────────────────────────────────────────────
   Estos datos no vienen del checkout: se completan a mano desde el panel. Para
   no sumar una columna por dato viajan todos juntos en orders.customer_meta
   (jsonb, ver supabase/schema-v4.sql), replicados en cada pedido del cliente. */
const META_TEXT_FIELDS = ['razonSocial', 'condIva', 'provincia', 'instagram', 'cumple', 'categoria', 'canal'];

const CONDICIONES_IVA = ['Consumidor final', 'Responsable inscripto', 'Monotributista', 'Exento', 'IVA no alcanzado'];
const CATEGORIAS_CLIENTE = [
  { id: '',             label: 'Sin clasificar' },
  { id: 'minorista',    label: 'Minorista' },
  { id: 'mayorista',    label: 'Mayorista' },
  { id: 'distribuidor', label: 'Distribuidor' },
  { id: 'revendedor',   label: 'Revendedor' },
];
const categoriaLabel = (id) => (CATEGORIAS_CLIENTE.find(c => c.id === id) || CATEGORIAS_CLIENTE[0]).label;
const ETIQUETAS_SUGERIDAS = ['VIP', 'Frecuente', 'Moroso', 'Mayorista', 'Instagram', 'Mercado Libre', 'Recomendado', 'No contactar'];
const CANALES_CLIENTE = ['', 'Instagram', 'WhatsApp', 'Local', 'Recomendado', 'Mercado Libre', 'Web', 'Feria / evento'];

const normTags     = (v) => (Array.isArray(v) ? v.map(t => String(t).trim()).filter(Boolean) : []);
const normNotasLog = (v) => (Array.isArray(v) ? v.filter(n => n && n.texto) : []);

/* Reconstruye el customer_meta completo a partir de la ficha YA agrupada, más los
   campos que se están cambiando. Hay que armarlo entero en cada guardado: el meta
   se reescribe en todos los pedidos del cliente, y varios de ellos pueden tenerlo
   vacío (los que se crearon antes de cargar la ficha). Tomarlo de un pedido suelto
   borraría el resto de los datos. */
function metaFromCustomer(customer, overrides) {
  const meta = {};
  META_TEXT_FIELDS.forEach(k => { meta[k] = String(customer[k] || '').trim(); });
  meta.tags = normTags(customer.tags);
  meta.activo = customer.activo !== false;
  meta.notasLog = normNotasLog(customer.notasLog);
  return { ...meta, ...(overrides || {}) };
}

/* Días transcurridos desde un timestamp (para "hace X días sin comprar"). */
const diasDesde = (ts) => Math.max(0, Math.floor((Date.now() - ts) / 86400000));

/* Teléfono → número para el link de wa.me. Los contactos se cargan de mil formas
   ("11 5555-1234", "+54 9 11…"): dejamos solo dígitos y anteponemos 549 si falta. */
function waNumber(contacto) {
  const d = String(contacto || '').replace(/\D/g, '');
  if (d.length < 8) return '';
  if (d.startsWith('54')) return d;
  return '549' + d.replace(/^0/, '').replace(/^9/, '');
}

/* Cumpleaños 'YYYY-MM-DD' → etiqueta legible + si cae dentro de los próximos 30 días. */
function cumpleInfo(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  if (isNaN(fecha)) return null;
  const hoy = new Date();
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let prox = new Date(hoy.getFullYear(), m - 1, d);
  if (prox < hoy0) prox = new Date(hoy.getFullYear() + 1, m - 1, d);
  const faltan = Math.round((prox - hoy0) / 86400000);
  return {
    label: fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }),
    faltan, esHoy: faltan === 0, proximo: faltan <= 30, edad: hoy.getFullYear() - y,
  };
}

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

    /* La ficha ampliada vive dentro de customer_meta: mismo criterio que pick()
       (el valor más reciente que no esté vacío). */
    const pickMeta = (k) => {
      for (const o of sorted) {
        const v = (o.customerMeta || {})[k];
        if (v != null && String(v).trim() !== '') return v;
      }
      return '';
    };
    const meta = {};
    META_TEXT_FIELDS.forEach(k => { meta[k] = pickMeta(k); });

    customers.push({
      ...ficha, ...meta,
      key: customerKeyOf(ficha),
      tags: normTags(pickMeta('tags')),
      notasLog: normNotasLog(pickMeta('notasLog')),
      /* Un cliente sin el campo cargado se considera activo (retrocompatibilidad). */
      activo: pickMeta('activo') !== false,
      orderCount: groupOrders.length, totalSpent, totalPaid, totalPending,
      ticketPromedio: groupOrders.length ? totalSpent / groupOrders.length : 0,
      diasSinComprar: diasDesde(lastOrder),
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
  const fecha = (ts) => new Date(ts).toLocaleDateString('es-AR');
  /* Toda la ficha viaja al Excel: así el listado sirve para etiquetas de envío,
     campañas de WhatsApp y control de cuenta corriente. */
  const cols = [
    ['Nombre', c => c.name || '—'], ['DNI / CUIT', c => c.dni],
    ['Razón social', c => c.razonSocial], ['Cond. IVA', c => c.condIva],
    ['Categoría', c => (c.categoria ? categoriaLabel(c.categoria) : '')],
    ['Etiquetas', c => (c.tags || []).join(', ')],
    ['Estado', c => (c.activo ? 'Activo' : 'Inactivo')],
    ['Email', c => c.email], ['Contacto', c => c.contact],
    ['Instagram', c => c.instagram], ['Cómo nos conoció', c => c.canal],
    ['Cumpleaños', c => { const k = cumpleInfo(c.cumple); return k ? k.label : ''; }],
    ['Domicilio', c => c.address], ['Localidad', c => c.city],
    ['Provincia', c => c.provincia], ['CP', c => c.postalCode],
    ['Pedidos', c => c.orderCount],
    ['Total comprado', c => Math.round(c.totalSpent)],
    ['Ticket promedio', c => Math.round(c.ticketPromedio)],
    ['Pagado', c => Math.round(c.totalPaid)],
    ['Saldo pendiente', c => Math.round(c.totalPending)],
    ['Crédito a favor', c => Math.round(c.creditAvailable)],
    ['Primera compra', c => fecha(c.firstOrder)],
    ['Última compra', c => fecha(c.lastOrder)],
    ['Días sin comprar', c => c.diasSinComprar],
    ['Observaciones', c => c.notasCliente],
    ['Últimas notas', c => [...(c.notasLog || [])].sort((a, b) => b.ts - a.ts).slice(0, 5)
      .map(n => `[${fecha(n.ts)}] ${n.texto}`).join(' · ')],
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

/* Separador de secciones dentro del editor, para que el formulario largo se lea. */
function Sep({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 14px',
      fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-400)' }}>
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
    </div>
  );
}

/* ═══════════ Editor de la ficha del cliente ═══════════════ */
function ClienteEditor({ customer, store, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const f = {};
    Object.keys(CUSTOMER_FIELDS).forEach(k => { f[k] = customer[k] || ''; });
    META_TEXT_FIELDS.forEach(k => { f[k] = customer[k] || ''; });
    f.activo = customer.activo !== false;
    return f;
  });
  const [tags, setTags] = useState(() => normTags(customer.tags));
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = (raw) => {
    const t = String(raw || '').trim().replace(/,+$/, '');
    if (!t) return;
    setTags(prev => (prev.some(x => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t]));
    setTagInput('');
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

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
    /* La ficha ampliada va entera en customer_meta, conservando la bitácora de
       notas (que se edita aparte, desde la ficha). */
    const cambios = { tags, activo: !!form.activo };
    META_TEXT_FIELDS.forEach(k => { cambios[k] = String(form[k] || '').trim(); });
    cambios.instagram = cambios.instagram.replace(/^@+/, '');   // sin arroba, para armar el link
    patch.customerMeta = metaFromCustomer(customer, cambios);
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
            <div className="adm-field"><label>Provincia</label>
              <input value={form.provincia} onChange={e => upd('provincia', e.target.value)} placeholder="Ej. Buenos Aires" />
            </div>
            <div className="adm-field"><label>Código postal</label>
              <input value={form.postalCode} onChange={e => upd('postalCode', e.target.value)} placeholder="1602" />
            </div>
          </div>

          <Sep>Facturación</Sep>
          <div className="adm-field-row">
            <div className="adm-field"><label>Razón social</label>
              <input value={form.razonSocial} onChange={e => upd('razonSocial', e.target.value)}
                placeholder="Si factura a nombre de una empresa" />
            </div>
            <div className="adm-field"><label>Condición frente al IVA</label>
              <select value={form.condIva} onChange={e => upd('condIva', e.target.value)}>
                <option value="">Sin especificar</option>
                {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <Sep>Clasificación y seguimiento</Sep>
          <div className="adm-field-row">
            <div className="adm-field"><label>Categoría</label>
              <select value={form.categoria} onChange={e => upd('categoria', e.target.value)}>
                {CATEGORIAS_CLIENTE.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="adm-field"><label>Cómo nos conoció</label>
              <select value={form.canal} onChange={e => upd('canal', e.target.value)}>
                {CANALES_CLIENTE.map(c => <option key={c} value={c}>{c || 'Sin especificar'}</option>)}
              </select>
            </div>
            <div className="adm-field"><label>Cumpleaños</label>
              <input type="date" value={form.cumple} onChange={e => upd('cumple', e.target.value)} />
            </div>
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Instagram</label>
              <input value={form.instagram} onChange={e => upd('instagram', e.target.value)} placeholder="@usuario" />
            </div>
            <div className="adm-field"><label>Estado del cliente</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer',
                padding: '10px 0', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                <input type="checkbox" checked={form.activo} onChange={e => upd('activo', e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }} />
                Activo (destildar para archivarlo sin borrar su historial)
              </label>
            </div>
          </div>

          <div className="adm-field"><label>Etiquetas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: 24 }}>
              {!tags.length && <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>Sin etiquetas.</span>}
              {tags.map(t => (
                <span key={t} className="adm-tag">
                  {t}
                  <button type="button" className="adm-tag__x" onClick={() => removeTag(t)} title="Quitar etiqueta">×</button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
              onBlur={() => addTag(tagInput)}
              placeholder="Escribí una etiqueta y presioná Enter" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {ETIQUETAS_SUGERIDAS.filter(s => !tags.some(t => t.toLowerCase() === s.toLowerCase())).map(s => (
                <button key={s} type="button" className="adm-btn adm-btn--outline adm-btn--xs" onClick={() => addTag(s)}>+ {s}</button>
              ))}
            </div>
          </div>

          <div className="adm-field"><label>Observaciones fijas</label>
            <textarea rows={3} value={form.notasCliente} onChange={e => upd('notasCliente', e.target.value)}
              placeholder="Preferencias, condiciones de pago acordadas, lo que necesites recordar…" />
            <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>
              Se muestran siempre arriba de la ficha. Para el seguimiento del día a día usá la bitácora de notas.
            </div>
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

/* ═══════════ Bitácora de notas ════════════════════════════
   Cada nota queda fechada y firmada por quien la escribió. Se guarda al instante
   (sin pasar por el editor) porque es lo que más se usa en el día a día:
   "avisar cuando entre stock", "paga los viernes", "reclamó por el envío". */
function ClienteNotas({ customer, store }) {
  const [texto, setTexto] = useState('');
  const puedeEditar = store.can('clientes.editar');

  const notas = useMemo(
    () => [...(customer.notasLog || [])].sort((a, b) => b.ts - a.ts),
    [customer.notasLog]);

  /* La bitácora vive dentro de customer_meta: reescribimos el meta completo para
     no pisar el resto de la ficha. */
  const persistir = (lista) => {
    store.updateCustomerInfo((customer.orders || []).map(o => o.id),
      { customerMeta: metaFromCustomer(customer, { notasLog: lista }) });
  };
  const agregar = () => {
    const t = texto.trim();
    if (!t) return;
    persistir([...(customer.notasLog || []), {
      id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6),
      ts: Date.now(), texto: t, autor: store.userEmail || 'admin',
    }]);
    setTexto('');
  };
  const borrar = (id) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    persistir((customer.notasLog || []).filter(n => n.id !== id));
  };

  const fechaHora = (ts) => new Date(ts).toLocaleString('es-AR',
    { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ marginBottom: 22 }}>
      <div className="adm-ccstat__l" style={{ marginBottom: 8 }}>
        Bitácora de notas {notas.length > 0 && <span style={{ color: 'var(--text-brand)' }}>({notas.length})</span>}
      </div>

      {puedeEditar && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
          <textarea rows={2} value={texto} onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); agregar(); } }}
            placeholder="Agregar una nota: acuerdos, reclamos, preferencias, seguimiento…"
            style={{ flex: 1, resize: 'vertical', padding: '9px 12px', fontSize: 13,
              fontFamily: 'var(--font-body)', border: '1.5px solid var(--border-default)',
              borderRadius: 8, background: 'var(--surface-card)', color: 'var(--ink-700)' }} />
          <button className="adm-btn adm-btn--primary" onClick={agregar} disabled={!texto.trim()}
            style={{ flex: 'none' }}>Agregar nota</button>
        </div>
      )}

      {notas.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-400)', padding: '6px 0' }}>
          Todavía no hay notas para este cliente.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notas.map(n => (
            <div key={n.id} className="adm-box" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', margin: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-700)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.texto}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>
                  {fechaHora(n.ts)}{n.autor ? ' · ' + n.autor : ''}
                </div>
              </div>
              {puedeEditar && (
                <button className="adm-tag__x" onClick={() => borrar(n.id)} title="Eliminar nota"
                  style={{ color: 'var(--ink-400)', fontSize: 16, flex: 'none' }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
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

  /* Qué compra este cliente: top 5 productos por unidades sobre todos sus pedidos. */
  const topProductos = useMemo(() => {
    const acc = new Map();
    (customer.orders || []).forEach(o => (o.items || []).forEach(i => {
      const nombre = [i.name || i.productName || i.title, i.variant || i.presLabel].filter(Boolean).join(' · ') || 'Sin nombre';
      const prev = acc.get(nombre) || { nombre, qty: 0, monto: 0 };
      prev.qty += Number(i.qty) || 0;
      prev.monto += (Number(i.price) || 0) * (Number(i.qty) || 0);
      acc.set(nombre, prev);
    }));
    return [...acc.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [customer.orders]);

  const cumple = cumpleInfo(customer.cumple);
  const wa = waNumber(customer.contact);
  const pagoColor = { pagado: 'var(--text-brand)', parcial: '#B08A1A', pendiente: '#B71C1C',
    'cuenta-corriente': '#1C6CAE', anulado: 'var(--ink-400)' };
  const fechaCorta = (ts) => new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="adm-panel">
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>
                {customer.name || 'Sin nombre'}
              </h3>
              {customer.categoria && <span className="adm-tag">{categoriaLabel(customer.categoria)}</span>}
              {!customer.activo && <span className="adm-tag adm-tag--muted">Inactivo</span>}
              {customer.totalPending > 0 && <span className="adm-tag adm-tag--danger">Debe {fmt(customer.totalPending)}</span>}
            </div>
            {customer.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {customer.tags.map(t => <span key={t} className="adm-tag adm-tag--muted">{t}</span>)}
              </div>
            )}
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 8, lineHeight: 1.6 }}>
              {customer.dni && <span>DNI {customer.dni} · </span>}
              {customer.email && <span>{customer.email} · </span>}
              {customer.contact && <span>{customer.contact}</span>}
              {customer.instagram && (
                <span> · <a href={`https://instagram.com/${customer.instagram}`} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--text-brand)' }}>@{customer.instagram}</a></span>
              )}
              {(customer.razonSocial || customer.condIva) && (
                <div>🧾 {[customer.razonSocial, customer.condIva].filter(Boolean).join(' · ')}</div>
              )}
              {(customer.address || customer.city || customer.provincia) && (
                <div>📍 {[customer.address, customer.city, customer.provincia, customer.postalCode].filter(Boolean).join(', ')}</div>
              )}
              {cumple && (
                <div>
                  🎂 {cumple.label} ({cumple.edad} años)
                  {cumple.esHoy
                    ? <strong style={{ color: 'var(--text-brand)' }}> — ¡es hoy!</strong>
                    : cumple.proximo ? <span style={{ color: 'var(--text-brand)' }}> — en {cumple.faltan} días</span> : null}
                </div>
              )}
              <div>
                Cliente desde {fechaCorta(customer.firstOrder)} · última compra {fechaCorta(customer.lastOrder)}
                {' '}({customer.diasSinComprar === 0 ? 'hoy' : `hace ${customer.diasSinComprar} días`})
                {customer.canal && <span> · llegó por {customer.canal}</span>}
              </div>
            </div>
            {customer.notasCliente && (
              <div className="adm-box" style={{ marginTop: 10, borderLeft: '3px solid var(--green-500)',
                fontSize: 12.5, color: 'var(--ink-600)', maxWidth: 560, whiteSpace: 'pre-wrap' }}>
                {customer.notasCliente}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
            {wa && (
              <a className="adm-btn adm-btn--outline adm-btn--sm" title="Escribirle por WhatsApp"
                href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>
            )}
            {customer.email && (
              <a className="adm-btn adm-btn--outline adm-btn--sm" title="Enviarle un mail"
                href={`mailto:${customer.email}`}>Email</a>
            )}
            {puedeEditar && (
              <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setEditing(true)}>
                <IcoEdit size={13} /> Editar datos
              </button>
            )}
            <button className="adm-close" onClick={onClose} title="Cerrar ficha"><IcoClose size={15} /></button>
          </div>
        </div>

        <div className="adm-box" style={{ display: 'grid', gap: 12, marginBottom: 18,
          gridTemplateColumns: `repeat(${customer.creditAvailable > 0 ? 6 : 5}, minmax(0, 1fr))` }}>
          <CCStat label="Pedidos" value={String(customer.orderCount)} />
          <CCStat label="Total comprado" value={fmt(customer.totalSpent)} />
          <CCStat label="Ticket promedio" value={fmt(customer.ticketPromedio)} />
          <CCStat label="Total pagado" value={fmt(customer.totalPaid)} color="var(--text-brand)" />
          <CCStat label="Saldo pendiente" value={fmt(customer.totalPending)}
            color={customer.totalPending > 0 ? '#B71C1C' : 'var(--text-brand)'} />
          {customer.creditAvailable > 0 && (
            <CCStat label="Crédito a favor" value={fmt(customer.creditAvailable)} color="#1C6CAE" />
          )}
        </div>

        <ClienteNotas customer={customer} store={store} />

        {topProductos.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div className="adm-ccstat__l" style={{ marginBottom: 8 }}>Lo que más compra</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topProductos.map(p => (
                <div key={p.nombre} className="adm-box" style={{ margin: 0, padding: '7px 12px', fontSize: 12.5 }}>
                  <strong>{p.nombre}</strong>
                  <span style={{ color: 'var(--ink-400)' }}> · {p.qty} u. · {fmt(p.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

  const [fCategoria, setFCategoria] = useState('todas');
  const [fTag, setFTag] = useState('todas');
  const [fSaldo, setFSaldo] = useState('todos');     // todos | con-saldo | sin-saldo | con-credito
  const [fEstado, setFEstado] = useState('activos'); // activos | inactivos | todos
  const [orden, setOrden] = useState({ campo: 'lastOrder', dir: 'desc' });

  const customers = useMemo(() => groupFromOrders(store.orders), [store.orders]);

  /* Todas las etiquetas en uso, para el desplegable de filtro. */
  const tagsEnUso = useMemo(() => {
    const set = new Set();
    customers.forEach(c => c.tags.forEach(t => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [customers]);

  const filtered = useMemo(() => {
    const q = searchNormalize(search.trim());
    const list = customers.filter(c => {
      if (fEstado === 'activos'   && !c.activo) return false;
      if (fEstado === 'inactivos' &&  c.activo) return false;
      if (fCategoria !== 'todas' && (c.categoria || '') !== fCategoria) return false;
      if (fTag !== 'todas' && !c.tags.includes(fTag)) return false;
      if (fSaldo === 'con-saldo'   && !(c.totalPending > 0)) return false;
      if (fSaldo === 'sin-saldo'   && c.totalPending > 0) return false;
      if (fSaldo === 'con-credito' && !(c.creditAvailable > 0)) return false;
      if (!q) return true;
      /* La búsqueda alcanza también a las etiquetas y a las notas: así se encuentra
         "el que reclamó por el envío" sin acordarse del nombre. */
      return searchNormalize([
        c.name, c.dni, c.email, c.contact, c.city, c.provincia, c.razonSocial,
        c.instagram, c.notasCliente, c.tags.join(' '),
        (c.notasLog || []).map(n => n.texto).join(' '),
      ].filter(Boolean).join(' ')).includes(q);
    });
    const dir = orden.dir === 'asc' ? 1 : -1;
    const val = (c) => {
      const v = c[orden.campo];
      return typeof v === 'string' ? v.toLowerCase() : (Number(v) || 0);
    };
    return list.sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return 0;
    });
  }, [customers, search, fCategoria, fTag, fSaldo, fEstado, orden]);

  /* Clic en un encabezado: ordena por esa columna, alternando dirección si repite. */
  const ordenarPor = (campo) => setOrden(o =>
    o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' }
                      : { campo, dir: campo === 'name' ? 'asc' : 'desc' });
  const ThOrden = ({ campo, children, align }) => (
    <th onClick={() => ordenarPor(campo)} title="Ordenar por esta columna"
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: align || 'left' }}>
      {children}{orden.campo === campo ? (orden.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );

  const conSaldo = useMemo(() => customers.filter(c => c.totalPending > 0).length, [customers]);
  const inactivos = useMemo(() => customers.filter(c => !c.activo).length, [customers]);

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
  /* "Exportar todos" respeta los filtros: si filtraste por etiqueta o por saldo,
     es eso lo que se baja (para la campaña o la lista de cobranza del día). */
  const exportAll = () => exportCustomersAsExcel(filtered, `clientes_todos_${stamp()}.xls`);

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Gestión</div>
            <h1>Clientes</h1>
            <div className="adm-head__sub">
              {customers.length} clientes únicos derivados de los pedidos
              {conSaldo > 0 && <> · <strong style={{ color: '#B71C1C' }}>{conSaldo} con saldo pendiente</strong></>}
              {inactivos > 0 && <> · {inactivos} inactivos</>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedKeys.size > 0 && (
              <button className="adm-btn adm-btn--primary" onClick={exportSelected}>
                <IcoDown size={13} /> Exportar {selectedKeys.size}
              </button>
            )}
            <button className="adm-btn adm-btn--outline" onClick={exportAll} disabled={!filtered.length}>
              <IcoDown size={13} /> Exportar {filtered.length === customers.length ? 'todos' : 'los filtrados'}
            </button>
          </div>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="adm-search" style={{ maxWidth: 320 }}>
            <IcoSearch size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI, email, etiqueta o nota…" />
          </div>
          <select className="adm-fsel" value={fCategoria} onChange={e => setFCategoria(e.target.value)} title="Filtrar por categoría">
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS_CLIENTE.filter(c => c.id).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            <option value="">Sin clasificar</option>
          </select>
          {tagsEnUso.length > 0 && (
            <select className="adm-fsel" value={fTag} onChange={e => setFTag(e.target.value)} title="Filtrar por etiqueta">
              <option value="todas">Todas las etiquetas</option>
              {tagsEnUso.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <select className="adm-fsel" value={fSaldo} onChange={e => setFSaldo(e.target.value)} title="Filtrar por estado de cuenta">
            <option value="todos">Cualquier saldo</option>
            <option value="con-saldo">Con saldo pendiente</option>
            <option value="sin-saldo">Sin deuda</option>
            <option value="con-credito">Con crédito a favor</option>
          </select>
          <select className="adm-fsel" value={fEstado} onChange={e => setFEstado(e.target.value)} title="Activos o archivados">
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Activos e inactivos</option>
          </select>
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
                <ThOrden campo="name">Cliente</ThOrden>
                <th>DNI</th><th>Contacto</th><th>Etiquetas</th>
                <ThOrden campo="orderCount" align="right">Pedidos</ThOrden>
                <ThOrden campo="totalSpent" align="right">Total</ThOrden>
                <ThOrden campo="ticketPromedio" align="right">Ticket prom.</ThOrden>
                <ThOrden campo="totalPending" align="right">Saldo</ThOrden>
                <ThOrden campo="lastOrder">Última compra</ThOrden>
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
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.name || '—'}
                        {!c.activo && <span style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 400 }}>(inactivo)</span>}
                        {c.notasLog.length > 0 && (
                          <span title={`${c.notasLog.length} nota${c.notasLog.length !== 1 ? 's' : ''} en la bitácora`}
                            style={{ fontSize: 10, color: 'var(--text-brand)' }}>📝 {c.notasLog.length}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                        {[c.categoria ? categoriaLabel(c.categoria) : '', c.city].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="mono">{c.dni || '—'}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <div>{c.contact || '—'}</div>
                      {c.email && <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{c.email}</div>}
                    </td>
                    <td>
                      {!c.tags.length ? <span style={{ color: 'var(--ink-400)' }}>—</span> : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {c.tags.slice(0, 3).map(t => <span key={t} className="adm-tag adm-tag--muted">{t}</span>)}
                          {c.tags.length > 3 && <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>+{c.tags.length - 3}</span>}
                        </div>
                      )}
                    </td>
                    <td className="num" style={{ textAlign: 'right' }}>{c.orderCount}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(c.totalSpent)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(c.ticketPromedio)}</td>
                    <td style={{ textAlign: 'right', fontWeight: c.totalPending > 0 ? 800 : 400,
                      color: c.totalPending > 0 ? '#B71C1C' : 'var(--ink-400)' }}>{fmt(c.totalPending)}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <div>{new Date(c.lastOrder).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                        {c.diasSinComprar === 0 ? 'hoy' : `hace ${c.diasSinComprar} d.`}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={10} className="adm-empty" style={{ textAlign: 'center' }}>
                    Ningún cliente coincide con la búsqueda y los filtros aplicados.
                  </td></tr>
                )}
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

window.VcoreCustomers = {
  groupFromOrders, customerKeyOf, exportCustomersAsExcel,
  CUSTOMER_FIELDS, META_TEXT_FIELDS, CATEGORIAS_CLIENTE, categoriaLabel, waNumber,
};
window.VcoreAdminSections = window.VcoreAdminSections || {};
window.VcoreAdminSections.clientes = AdminClientes;

export default null;
