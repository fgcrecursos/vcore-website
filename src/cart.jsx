/* Vcore website — CartDrawer. */
const React = window.React;
const { Button } = window.VcoreDesignSystem_8ff97c;
const I = window.VcoreIcons;
const D = window.VcoreData;
const ProductImage = window.VcoreProductImage;

const CART_CSS = `
.vc-cart-ov { position: fixed; inset: 0; background: rgba(20,32,32,.42); z-index: 60; opacity: 0;
  transition: opacity var(--duration-base) var(--ease-standard); }
.vc-cart-ov.open { opacity: 1; }
.vc-cart { position: fixed; top: 0; right: 0; bottom: 0; width: 416px; max-width: 92vw; background: var(--paper-050);
  z-index: 61; transform: translateX(100%); transition: transform var(--duration-slow) var(--ease-out);
  display: flex; flex-direction: column; box-shadow: var(--shadow-xl); }
.vc-cart.open { transform: translateX(0); }
.vc-cart__hd { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; border-bottom: 1px solid var(--paper-200); }
.vc-cart__hd h3 { font-family: var(--font-display); font-weight: 800; font-size: 22px; letter-spacing: -.02em; margin: 0; }
.vc-cart__body { flex: 1; overflow-y: auto; padding: 8px 24px; }
.vc-line { display: flex; gap: 14px; padding: 18px 0; border-bottom: 1px solid var(--paper-200); }
.vc-line__img { width: 72px; height: 84px; border-radius: var(--radius-md); overflow: hidden; flex: none; }
.vc-line__img .vc-pimg { aspect-ratio: auto; height: 100%; border-radius: 0; }
.vc-line__name { font-family: var(--font-display); font-weight: 800; font-size: 16px; margin: 0; }
.vc-line__meta { font-size: 13px; color: var(--ink-500); margin: 2px 0 8px; }
.vc-line__row { display: flex; align-items: center; justify-content: space-between; }
.vc-line__price { font-family: var(--font-display); font-weight: 800; }
.vc-miniqty { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; }
.vc-miniqty button { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--border-default);
  background: var(--surface-card); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink-800); }
.vc-cart__ft { padding: 20px 24px 24px; border-top: 1px solid var(--paper-200); background: var(--paper-000); }
.vc-cart__sub { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.vc-cart__sub .l { font-weight: 600; color: var(--ink-700); }
.vc-cart__sub .v { font-family: var(--font-display); font-weight: 800; font-size: 26px; }
.vc-cart__note { font-size: 12.5px; color: var(--ink-500); margin: 0 0 16px; }
.vc-cart__empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--ink-500); text-align: center; padding: 0 40px; }
`;

function injectCart() {
  if (!document.getElementById('vc-cart-css')) {
    const el = document.createElement('style'); el.id = 'vc-cart-css'; el.textContent = CART_CSS;
    document.head.appendChild(el);
  }
}

function CartDrawer({ open, items, onClose, onQty }) {
  injectCart();
  const subtotal = items.reduce((s, it) => s + it.product.price * it.qty, 0);
  return (
    <React.Fragment>
      <div className={`vc-cart-ov ${open ? 'open' : ''}`} style={{ pointerEvents: open ? 'auto' : 'none' }} onClick={onClose} />
      <aside className={`vc-cart ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="vc-cart__hd">
          <h3>Tu carrito</h3>
          <button className="vc-iconbtn" onClick={onClose} aria-label="Cerrar"><I.X size={20} /></button>
        </div>
        {items.length === 0 ? (
          <div className="vc-cart__empty">
            <I.Bag size={40} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink-900)' }}>Tu carrito está vacío</div>
            <div style={{ fontSize: 14 }}>Sumá algo de energía para tu rutina.</div>
          </div>
        ) : (
          <React.Fragment>
            <div className="vc-cart__body">
              {items.map((it, idx) => (
                <div className="vc-line" key={idx}>
                  <div className="vc-line__img"><ProductImage product={it.product} /></div>
                  <div style={{ flex: 1 }}>
                    <p className="vc-line__name">{it.product.name}</p>
                    <p className="vc-line__meta">{it.product.sub} · {it.size}</p>
                    <div className="vc-line__row">
                      <span className="vc-miniqty">
                        <button onClick={() => onQty(idx, -1)}><I.Minus size={13} /></button>
                        {it.qty}
                        <button onClick={() => onQty(idx, 1)}><I.Plus size={13} /></button>
                      </span>
                      <span className="vc-line__price">{D.fmt(it.product.price * it.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="vc-cart__ft">
              <div className="vc-cart__sub"><span className="l">Subtotal</span><span className="v">{D.fmt(subtotal)}</span></div>
              <p className="vc-cart__note">Envío e impuestos calculados al pagar.</p>
              <Button size="lg" fullWidth iconRight={<I.ArrowRight size={18} />}>Ir a pagar</Button>
            </div>
          </React.Fragment>
        )}
      </aside>
    </React.Fragment>
  );
}

window.VcoreCartDrawer = CartDrawer;
