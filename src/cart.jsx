/* Vcore website — CartDrawer with volume tiers, discount codes, shipping & WhatsApp checkout. */
const React = window.React;
const { useState } = React;
const { Button } = window.VcoreDesignSystem_8ff97c;
const I = window.VcoreIcons;
const D = window.VcoreData;
const ProductImage = window.VcoreProductImage;

/* Precio unitario de una línea según la presentación elegida. */
const unitOf = (it) => (it.unitPrice != null ? it.unitPrice : D.priceFor(it.product, it.size));

const CART_CSS = `
.vc-cart-ov { position: fixed; inset: 0; background: rgba(8,18,16,.5); z-index: 44;
  opacity: 0; transition: opacity .25s; pointer-events: none; backdrop-filter: blur(2px); }
.vc-cart-ov.open { opacity: 1; pointer-events: auto; }
.vc-cart { position: fixed; top: 0; right: 0; height: 100dvh; width: min(420px, 100vw);
  background: var(--paper-050); z-index: 45; display: flex; flex-direction: column;
  transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
  box-shadow: -8px 0 40px rgba(0,0,0,.18); }
.vc-cart.open { transform: translateX(0); }
.vc-cart__hd { display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 62px; border-bottom: 1px solid var(--paper-200); flex: none; }
.vc-cart__title { font-family: var(--font-display); font-weight: 800; font-size: 20px;
  letter-spacing: -.01em; }
.vc-cart__close { width: 36px; height: 36px; border-radius: 50%; border: 0;
  background: var(--paper-100); color: var(--ink-800); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: background .15s; }
.vc-cart__close:hover { background: var(--paper-200); }

/* tier progress */
.vc-cart__tier { padding: 14px 24px 12px; border-bottom: 1px solid var(--paper-200);
  background: var(--paper-000); flex: none; }
.vc-tier-msg { font-size: 12.5px; color: var(--ink-700); margin-bottom: 9px; line-height: 1.5; }
.vc-tier-msg strong { font-family: var(--font-display); font-weight: 800; color: var(--green-700); }
[data-theme="dark"] .vc-tier-msg strong { color: var(--green-400); }
.vc-tier-bar { height: 5px; background: var(--paper-200); border-radius: 3px; overflow: hidden; }
.vc-tier-bar__fill { height: 100%;
  background: linear-gradient(90deg, var(--green-600), var(--green-400));
  border-radius: 3px; transition: width .5s ease; }
.vc-tier-labels { display: flex; justify-content: space-between; margin-top: 7px;
  font-size: 10.5px; color: var(--ink-400); font-weight: 700; }
.vc-tier-labels span.on { color: var(--green-600); font-weight: 800; }
[data-theme="dark"] .vc-tier-labels span.on { color: var(--green-400); }

/* items */
.vc-cart__body { flex: 1; overflow-y: auto; padding: 0 24px; }
.vc-line { display: flex; gap: 14px; padding: 18px 0; border-bottom: 1px solid var(--paper-200); }
.vc-line:last-child { border-bottom: none; }
.vc-line__img { width: 72px; height: 84px; border-radius: var(--radius-md); overflow: hidden; flex: none; }
.vc-line__img .vc-pimg { border-radius: 0; height: 100%; aspect-ratio: auto; }
.vc-line__name { font-family: var(--font-display); font-weight: 800; font-size: 16px; margin: 0 0 2px; }
.vc-line__meta { font-size: 12.5px; color: var(--ink-500); margin: 0 0 10px; }
.vc-line__row { display: flex; align-items: center; justify-content: space-between; }
.vc-line__price { font-family: var(--font-display); font-weight: 800; font-size: 15px; }
.vc-miniqty { display: inline-flex; align-items: center; gap: 10px;
  font-weight: 800; font-size: 15px; font-family: var(--font-display); }
.vc-miniqty button { width: 28px; height: 28px; border-radius: 50%;
  border: 1.5px solid var(--border-default); background: var(--surface-card);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink-800); transition: border-color .1s, background .1s; }
.vc-miniqty button:hover { border-color: var(--green-500); background: var(--green-050); }

/* empty */
.vc-cart__empty { flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; color: var(--ink-400); text-align: center; padding: 0 40px; }
.vc-cart__empty svg { opacity: .35; }
.vc-cart__empty-title { font-family: var(--font-display); font-weight: 800;
  font-size: 20px; color: var(--ink-700); }

/* footer */
.vc-cart__ft { border-top: 1px solid var(--paper-200); padding: 16px 24px 26px;
  background: var(--paper-000); flex: none; }
.vc-ft-label { font-size: 11px; font-weight: 800; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-500); margin-bottom: 8px; }

/* shipping */
.vc-ship-opts { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
.vc-ship-opt { display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  cursor: pointer; transition: border-color .15s, background .15s; }
.vc-ship-opt.on { border-color: var(--green-500); background: var(--green-050); }
.vc-ship-opt__name { font-weight: 600; font-size: 13.5px; color: var(--ink-800); }
.vc-ship-opt__cost { font-family: var(--font-display); font-weight: 800; font-size: 13px; }
.vc-ship-opt__cost.free { color: var(--green-600); }
[data-theme="dark"] .vc-ship-opt__cost.free { color: var(--green-400); }

/* discount code */
.vc-code-row { display: flex; gap: 8px; margin-bottom: 5px; }
.vc-code-input { flex: 1; height: 40px; padding: 0 12px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); font-family: var(--font-body); font-size: 14px;
  font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-900); outline: none; }
.vc-code-input:focus { border-color: var(--green-500); }
.vc-code-feedback { font-size: 12px; font-weight: 700; margin: 0 0 12px; }
.vc-code-feedback.ok { color: var(--green-700); }
[data-theme="dark"] .vc-code-feedback.ok { color: var(--green-400); }
.vc-code-feedback.err { color: #8E2E22; }

/* breakdown */
.vc-breakdown { margin-bottom: 14px; }
.vc-b-row { display: flex; justify-content: space-between; align-items: baseline;
  font-size: 13.5px; color: var(--ink-600); margin-bottom: 5px; }
.vc-b-row.saving { color: var(--green-700); font-weight: 700; }
[data-theme="dark"] .vc-b-row.saving { color: var(--green-400); }
.vc-b-row.total { font-family: var(--font-display); font-weight: 800; font-size: 24px;
  color: var(--ink-900); margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--paper-200); }
.vc-b-row.total > span:first-child { font-size: 14px; font-family: var(--font-body); }

/* WhatsApp button */
.vc-wa-btn { width: 100%; height: 52px; border-radius: var(--radius-pill); border: none;
  cursor: pointer; font-family: var(--font-display); font-weight: 800; font-size: 16px;
  letter-spacing: -.01em; background: #25D366; color: #fff;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: opacity .15s; }
.vc-wa-btn:hover { opacity: .9; }
`;

function injectCart() {
  if (!document.getElementById('vc-cart-css')) {
    const el = document.createElement('style');
    el.id = 'vc-cart-css';
    el.textContent = CART_CSS;
    document.head.appendChild(el);
  }
}

function TierProgress({ subtotal }) {
  const tier = D.getTier(subtotal);
  const next = D.getNextTier(subtotal);
  const pct = next ? Math.min(100, (subtotal / next.min) * 100) : 100;

  return (
    <div className="vc-cart__tier">
      <div className="vc-tier-msg">
        {tier.discount > 0 && !next ? (
          <>Máximo descuento activo: <strong>{tier.label} ({tier.badge})</strong> 🎉</>
        ) : tier.discount > 0 && next ? (
          <>Descuento <strong>{tier.label} ({tier.badge})</strong> activo. {' '}
            Agregá <strong>{D.fmt(next.min - subtotal)}</strong> más para {next.badge}</>
        ) : next ? (
          <>Agregá <strong>{D.fmt(next.min - subtotal)}</strong> más y obtenés {next.badge} ({next.label})</>
        ) : null}
      </div>
      <div className="vc-tier-bar">
        <div className="vc-tier-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="vc-tier-labels">
        {D.tiers.map(t => (
          <span key={t.id} className={subtotal >= t.min ? 'on' : ''}>
            {t.label}{t.discount > 0 ? ` ${t.badge}` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function buildWAMsg({ items, tier, codeApplied, codeDiscount, subtotal, tierSaving, codeSaving, shippingOpt, shippingCost, total }) {
  const lines = items.map(it =>
    `• ${it.product.name} (${it.size}) ×${it.qty} — ${D.fmt(unitOf(it) * it.qty)}`
  ).join('\n');

  let msg = `Hola Vcore! Quiero hacer un pedido:\n\n${lines}\n\nSubtotal: ${D.fmt(subtotal)}\n`;
  if (tierSaving > 0) msg += `Desc. ${tier.label} (${tier.badge}): -${D.fmt(tierSaving)}\n`;
  if (codeSaving > 0) msg += `Código ${codeApplied}: -${D.fmt(codeSaving)}\n`;
  msg += `Envío (${shippingOpt.label}): ${shippingCost === 0 ? 'Gratis' : D.fmt(shippingCost)}\n`;
  msg += `\n*TOTAL: ${D.fmt(total)}*\n\nForma de pago: a coordinar 🙏`;
  return encodeURIComponent(msg);
}

function saveOrder({ items, total, tier, tierSaving, codeApplied, codeSaving, subtotal, shippingOpt, shippingCost }) {
  const summary = items.map(it => `${it.product.name} ×${it.qty}`).join(', ');
  const order = {
    id: 'VC' + Date.now().toString(36).toUpperCase(),
    date: new Date().toISOString(),
    ts: Date.now(),
    summary,
    items: items.map(it => ({ name: it.product.name, sub: it.product.sub, size: it.size, qty: it.qty, price: unitOf(it) })),
    subtotal,
    tierName: tier.label,
    tierDiscAmt: tierSaving,
    couponCode: codeApplied || '',
    couponDiscAmt: codeSaving,
    shippingLabel: shippingOpt.label,
    shippingCost,
    total,
    status: 'nuevo',
  };
  /* Backend (Supabase) → pedido centralizado, visible desde cualquier dispositivo.
     Demo (sin backend) → guardado local. */
  if (window.VcoreBackend && window.VcoreBackend.isOn()) {
    window.VcoreBackend.createOrder(order); // fire-and-forget; no bloquea el WhatsApp
  } else {
    try {
      const orders = JSON.parse(localStorage.getItem('vc-orders') || '[]');
      orders.push(order);
      localStorage.setItem('vc-orders', JSON.stringify(orders));
    } catch {}
  }
}

function CartDrawer({ open, items, onClose, onQty }) {
  injectCart();

  const [ship, setShip] = useState('andreani');
  const [code, setCode] = useState('');
  const [codeApplied, setCodeApplied] = useState(null);
  const [codeErr, setCodeErr] = useState(false);

  const subtotal = items.reduce((s, it) => s + unitOf(it) * it.qty, 0);
  const tier = D.getTier(subtotal);
  const tierSaving = Math.round(subtotal * tier.discount);
  const afterTier = subtotal - tierSaving;

  const codeDiscount = codeApplied ? (D.codes[codeApplied] || 0) : 0;
  const codeSaving = Math.round(afterTier * codeDiscount);
  const afterCode = afterTier - codeSaving;

  const shippingOpt = D.shipping.find(s => s.id === ship) || D.shipping[0];
  const shippingCost = D.getShippingCost(ship, afterCode);
  const total = afterCode + shippingCost;

  function applyCode() {
    const c = code.trim().toUpperCase();
    if (D.codes[c] !== undefined) {
      setCodeApplied(c);
      setCodeErr(false);
    } else {
      setCodeErr(true);
      setCodeApplied(null);
    }
  }

  function checkout() {
    const msg = buildWAMsg({
      items, tier, codeApplied, codeDiscount,
      subtotal, tierSaving, codeSaving,
      shippingOpt, shippingCost, total,
    });
    saveOrder({ items, total, tier, tierSaving, codeApplied, codeSaving, subtotal, shippingOpt, shippingCost });
    const phone = (D.config && D.config.whatsapp) || '5491100000000';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  const hasItems = items.length > 0;
  const count = items.reduce((s, it) => s + it.qty, 0);

  return (
    <>
      <div className={`vc-cart-ov${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`vc-cart${open ? ' open' : ''}`} aria-label="Carrito de compras">
        <div className="vc-cart__hd">
          <span className="vc-cart__title">
            Tu carrito{hasItems && <span style={{ color: 'var(--ink-400)', fontSize: 15, fontWeight: 600 }}> ({count})</span>}
          </span>
          <button className="vc-cart__close" onClick={onClose} aria-label="Cerrar carrito">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {hasItems && <TierProgress subtotal={subtotal} />}

        {!hasItems ? (
          <div className="vc-cart__empty">
            <I.Bag size={48} />
            <div className="vc-cart__empty-title">Tu carrito está vacío</div>
            <div style={{ fontSize: 14 }}>Agregá suplementos para armar tu pedido.</div>
            <Button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('vc:nav', { detail: 'shop' })); }}>
              Ver productos
            </Button>
          </div>
        ) : (
          <>
            <div className="vc-cart__body">
              {items.map((it, i) => (
                <div key={`${it.product.id}-${it.size}`} className="vc-line">
                  <div className="vc-line__img">
                    <ProductImage product={it.product} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="vc-line__name">{it.product.name}</div>
                    <div className="vc-line__meta">{it.size}</div>
                    <div className="vc-line__row">
                      <div className="vc-miniqty">
                        <button onClick={() => onQty(i, -1)} aria-label="Quitar uno">
                          <I.Minus size={12} />
                        </button>
                        <span>{it.qty}</span>
                        <button onClick={() => onQty(i, 1)} aria-label="Agregar uno">
                          <I.Plus size={12} />
                        </button>
                      </div>
                      <span className="vc-line__price">{D.fmt(unitOf(it) * it.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="vc-cart__ft">
              {/* Shipping selector */}
              <div style={{ marginBottom: 14 }}>
                <div className="vc-ft-label">Envío</div>
                <div className="vc-ship-opts">
                  {D.shipping.map(opt => {
                    const cost = D.getShippingCost(opt.id, afterCode);
                    const isFree = opt.freeFrom === 0 || cost === 0;
                    return (
                      <div
                        key={opt.id}
                        className={`vc-ship-opt${ship === opt.id ? ' on' : ''}`}
                        onClick={() => setShip(opt.id)}
                      >
                        <span className="vc-ship-opt__name">{opt.label}</span>
                        <span className={`vc-ship-opt__cost${isFree ? ' free' : ''}`}>
                          {isFree ? 'Gratis' : D.fmt(opt.base)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount code */}
              <div style={{ marginBottom: 14 }}>
                <div className="vc-ft-label">Código de descuento</div>
                <div className="vc-code-row">
                  <input
                    className="vc-code-input"
                    placeholder="VCORE10"
                    value={code}
                    onChange={e => { setCode(e.target.value); setCodeErr(false); }}
                    onKeyDown={e => e.key === 'Enter' && applyCode()}
                  />
                  <Button size="sm" variant="outline" onClick={applyCode}>Aplicar</Button>
                </div>
                {codeApplied && (
                  <div className="vc-code-feedback ok">
                    ✓ {codeApplied} aplicado — {(codeDiscount * 100).toFixed(0)}% off
                  </div>
                )}
                {codeErr && (
                  <div className="vc-code-feedback err">Código no válido</div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="vc-breakdown">
                <div className="vc-b-row"><span>Subtotal</span><span>{D.fmt(subtotal)}</span></div>
                {tierSaving > 0 && (
                  <div className="vc-b-row saving">
                    <span>Desc. {tier.label} ({tier.badge})</span>
                    <span>-{D.fmt(tierSaving)}</span>
                  </div>
                )}
                {codeSaving > 0 && (
                  <div className="vc-b-row saving">
                    <span>Código {codeApplied}</span>
                    <span>-{D.fmt(codeSaving)}</span>
                  </div>
                )}
                <div className="vc-b-row">
                  <span>Envío</span>
                  <span style={shippingCost === 0 ? { color: 'var(--green-600)', fontWeight: 700 } : {}}>
                    {shippingCost === 0 ? 'Gratis' : D.fmt(shippingCost)}
                  </span>
                </div>
                <div className="vc-b-row total">
                  <span>Total</span>
                  <span>{D.fmt(total)}</span>
                </div>
              </div>

              {/* WhatsApp checkout */}
              <button className="vc-wa-btn" onClick={checkout}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Finalizar por WhatsApp
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

window.VcoreCartDrawer = CartDrawer;
