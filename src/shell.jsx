/* Vcore website — shell: Header, Footer, ProductImage + shared styles. */
const React = window.React;
const { useState } = React;
const { Logo, Button, Input, Eyebrow } = window.VcoreDesignSystem_8ff97c;
const I = window.VcoreIcons;

const SITE_CSS = `
.vc-site { font-family: var(--font-body); color: var(--ink-900); background: var(--gradient-paper-bloom);
  background-attachment: fixed; min-height: 100%; }
.vc-site[data-theme="dark"] { background: var(--gradient-page-dark); }
.vc-site * { box-sizing: border-box; }
.vc-wrap { max-width: 1180px; margin: 0 auto; padding: 0 28px; }

.vc-hd { position: sticky; top: 0; z-index: 40; background: color-mix(in srgb, var(--paper-050) 86%, transparent);
  backdrop-filter: saturate(1.4) blur(10px); border-bottom: 1px solid var(--paper-200); }
.vc-hd__row { display: flex; align-items: center; gap: 28px; height: 70px; }
.vc-hd__nav { display: flex; gap: 26px; margin-left: 14px; }
.vc-hd__nav button { background: none; border: 0; cursor: pointer; font-family: var(--font-body);
  font-size: 15px; font-weight: 600; color: var(--ink-700); padding: 6px 0; position: relative; }
.vc-hd__nav button:hover { color: var(--ink-900); }
.vc-hd__nav button.is-active { color: var(--green-700); }
.vc-hd__nav button.is-active::after { content:""; position:absolute; left:0; right:0; bottom:-2px; height:2px; background: var(--green-500); border-radius:2px; }
.vc-hd__spacer { flex: 1; }
.vc-hd__act { display: flex; align-items: center; gap: 6px; }
.vc-iconbtn { width: 40px; height: 40px; border-radius: 50%; border: 0; background: transparent; color: var(--ink-800);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer; position: relative;
  transition: background var(--duration-fast) var(--ease-standard); }
.vc-iconbtn:hover { background: var(--paper-100); }
.vc-hd__theme {
  display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px 0 12px;
  margin-right: 4px; border-radius: var(--radius-pill); cursor: pointer;
  border: 1.5px solid var(--border-default); background: transparent;
  font-family: var(--font-display); font-weight: 700; font-size: 13.5px; letter-spacing: -.01em;
  color: var(--ink-800);
  transition: background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.vc-hd__theme:hover { border-color: var(--green-500); color: var(--green-700); background: var(--green-050); }
.vc-hd__theme svg { display: block; }
[data-theme="dark"] .vc-hd__theme { color: var(--ink-800); border-color: var(--paper-300); }
[data-theme="dark"] .vc-hd__theme:hover { color: var(--green-400); border-color: var(--green-400); background: rgba(55,167,105,.12); }
.vc-cart-count { position: absolute; top: 4px; right: 3px; min-width: 17px; height: 17px; padding: 0 4px;
  background: var(--green-500); color: #fff; border-radius: 999px; font-size: 10.5px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; }

.vc-pimg { position: relative; width: 100%; aspect-ratio: 4 / 5; border-radius: var(--radius-lg); overflow: hidden;
  isolation: isolate; }
.vc-pimg > img.vc-pimg__photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.vc-pimg::after { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.vc-pimg--tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
.vc-pimg--tile::after { background: var(--vignette); }
.vc-pimg--paper { background: var(--gradient-sage-bloom); }
.vc-pimg--green { background: var(--gradient-green-bloom); }
.vc-pimg--navy  { background: var(--gradient-navy-bloom); }
.vc-pimg--sage  { background: var(--gradient-sage-bloom); }
[data-theme="dark"] .vc-pimg { box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 18px 50px rgba(0,0,0,.5); }
.vc-pimg__mark { position: relative; z-index: 1; width: 46%; max-width: 150px; height: auto;
  filter: drop-shadow(0 8px 22px rgba(0,0,0,.20)); }
.vc-pimg__name { position: relative; z-index: 1; font-family: var(--font-display); font-weight: 800;
  font-size: 26px; letter-spacing: -.02em; }

[data-theme="dark"] .vc-card { box-shadow: 0 1px 0 rgba(255,255,255,.04), 0 14px 34px rgba(0,0,0,.45); }

.vc-ft { position: relative; background: var(--gradient-ink-bloom); color: #C9D2CD; margin-top: 96px; isolation: isolate; }
.vc-ft::before { content: ""; position: absolute; inset: 0; background: var(--vignette-soft); pointer-events: none; z-index: 0; }
.vc-ft .vc-wrap { position: relative; z-index: 1; }
.vc-ft__grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.4fr; gap: 40px; padding: 64px 0 40px; }
.vc-ft h5 { font-family: var(--font-body); font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
  color: rgba(255,255,255,.5); margin: 0 0 16px; font-weight: 800; }
.vc-ft a { display: block; color: #C9D2CD; font-size: 14.5px; padding: 5px 0; text-decoration: none; }
.vc-ft a:hover { color: #fff; }
.vc-ft__bottom { border-top: 1px solid rgba(255,255,255,.1); padding: 22px 0; display: flex; justify-content: space-between;
  font-size: 12.5px; color: rgba(255,255,255,.5); }
.vc-ft__news { display: flex; gap: 8px; margin-top: 16px; }

/* hamburger + mobile menu (hidden on desktop) */
.vc-hd__burger { display: none; }
.vc-hd__menu { display: none; }
.vc-hd__menu-inner { padding: 8px 0 16px; }
.vc-hd__menu-link { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
  background: none; border: 0; cursor: pointer; font-family: var(--font-body); font-size: 16px;
  font-weight: 600; color: var(--ink-800); padding: 13px 4px; }
.vc-hd__menu-link.is-active { color: var(--green-700); }
.vc-hd__menu-link svg { color: var(--ink-500); }
.vc-hd__menu-sep { height: 1px; background: var(--paper-200); margin: 8px 0; }

/* ───────── Mobile ───────── */
@media (max-width: 860px) {
  .vc-wrap { padding: 0 18px; }
  .vc-hd__row { height: 60px; gap: 12px; }
  .vc-hd__nav--desk, .vc-hd__theme--desk, .vc-hd__admin--desk { display: none; }
  .vc-hd__act { gap: 2px; }
  .vc-hd__burger { display: inline-flex; }
  .vc-hd__menu { display: block; overflow: hidden; max-height: 0; transition: max-height .28s ease;
    background: var(--paper-050); border-bottom: 1px solid var(--paper-200); }
  .vc-hd__menu.open { max-height: 360px; }
  .vc-hd__menu .vc-wrap, .vc-hd__menu-inner { padding-left: 18px; padding-right: 18px; }

  .vc-ft { margin-top: 60px; }
  .vc-ft__grid { grid-template-columns: 1fr 1fr; gap: 28px 24px; padding: 44px 0 28px; }
  .vc-ft__grid > div:first-child { grid-column: 1 / -1; }
  .vc-ft__grid > div:last-child { grid-column: 1 / -1; }
  .vc-ft__bottom { flex-direction: column; gap: 8px; text-align: center; }
}
@media (max-width: 460px) {
  .vc-ft__grid { grid-template-columns: 1fr; }
}
`;

function injectSite() {
  if (typeof document !== 'undefined' && !document.getElementById('vc-site-css')) {
    const el = document.createElement('style'); el.id = 'vc-site-css'; el.textContent = SITE_CSS;
    document.head.appendChild(el);
  }
}

function Header({ page, onNav, cartCount, onOpenCart, theme, onToggleTheme, onSearch }) {
  injectSite();
  const dark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [['home', 'Inicio'], ['shop', 'Tienda'], ['nosotros', 'Nosotros']];
  function go(k) { setMenuOpen(false); onNav(k); }
  return (
    <header className="vc-hd">
      <div className="vc-wrap vc-hd__row">
        <button className="vc-hd__logo" onClick={() => go('home')} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
          <Logo variant="wordmark" tone={dark ? 'white' : 'ink'} height={30} />
        </button>
        <nav className="vc-hd__nav vc-hd__nav--desk">
          {nav.map(([k, label]) => (
            <button key={k} className={page === k ? 'is-active' : ''} onClick={() => onNav(k)}>{label}</button>
          ))}
        </nav>
        <div className="vc-hd__spacer" />
        <div className="vc-hd__act">
          <button className="vc-hd__theme vc-hd__theme--desk" aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} title={dark ? 'Modo claro' : 'Modo oscuro'} onClick={onToggleTheme}>
            {dark ? <I.Sun size={17} /> : <I.Moon size={17} />}
            <span>{dark ? 'Claro' : 'Oscuro'}</span>
          </button>
          <button className="vc-iconbtn" aria-label="Buscar" onClick={onSearch}><I.Search size={20} /></button>
          <button className="vc-iconbtn vc-hd__admin--desk" aria-label="Admin" onClick={() => onNav('admin')}><I.User size={20} /></button>
          <button className="vc-iconbtn" aria-label="Carrito" onClick={onOpenCart}>
            <I.Bag size={20} />
            {cartCount > 0 && <span className="vc-cart-count">{cartCount}</span>}
          </button>
          <button className="vc-iconbtn vc-hd__burger" aria-label="Menú"
            aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      <div className={`vc-hd__menu${menuOpen ? ' open' : ''}`}>
        <div className="vc-hd__menu-inner">
          {nav.map(([k, label]) => (
            <button key={k} className={`vc-hd__menu-link${page === k ? ' is-active' : ''}`} onClick={() => go(k)}>
              {label}
            </button>
          ))}
          <div className="vc-hd__menu-sep" />
          <button className="vc-hd__menu-link" onClick={() => go('admin')}>
            <I.User size={18} /> Panel de administración
          </button>
          <button className="vc-hd__menu-link" onClick={() => { onToggleTheme(); }}>
            {dark ? <I.Sun size={18} /> : <I.Moon size={18} />} {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </div>
    </header>
  );
}

function ProductImage({ product, className = '' }) {
  injectSite();
  if (product.photo) {
    return <div className={`vc-pimg ${className}`}><img className="vc-pimg__photo" src={product.photo} alt={product.name} /></div>;
  }
  const base = (window.__VCORE_ASSET_BASE__ || '/assets/');
  const markByTone = {
    green: 'vcore-isotipo-grad-mint.png',
    navy:  'vcore-isotipo-grad-blue.png',
    sage:  'vcore-isotipo-green.png',
    paper: 'vcore-isotipo-green.png',
  };
  const mark = markByTone[product.tone] || markByTone.green;
  return (
    <div className={`vc-pimg vc-pimg--tile vc-pimg--${product.tone} ${className}`}>
      <img className="vc-pimg__mark" src={base + mark} alt={product.name} />
    </div>
  );
}

function Footer() {
  injectSite();
  const nav = (pg) => window.dispatchEvent(new CustomEvent('vc:nav', { detail: pg }));
  return (
    <footer className="vc-ft">
      <div className="vc-wrap">
        <div className="vc-ft__grid">
          <div>
            <Logo variant="wordmark" tone="paper" height={30} />
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.62)', marginTop: 16, maxWidth: 280, lineHeight: 1.6 }}>
              Nutrición funcional, simple y confiable. Para quienes entienden que una vida activa merece una suplementación limpia.
            </p>
          </div>
          <div>
            <h5>Productos</h5>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('shop')}>Ver catálogo</a>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('product-creatina')}>Creatina</a>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('shop')}>Proteína</a>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('shop')}>Suplementos</a>
          </div>
          <div>
            <h5>Ayuda</h5>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('howto')}>Cómo comprar</a>
            <a href={`https://wa.me/${(window.VcoreData && window.VcoreData.config && window.VcoreData.config.whatsapp) || '5491100000000'}`} target="_blank" rel="noopener">WhatsApp</a>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('admin')}>Panel admin</a>
            <a style={{ cursor: 'pointer' }} onClick={() => nav('nosotros')}>Nosotros</a>
          </div>
          <div>
            <h5>Sumate</h5>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.62)', margin: 0 }}>Novedades y promos, sin spam.</p>
            <div className="vc-ft__news">
              <Input placeholder="Tu email" size="sm" style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.15)', color: '#fff' }} />
              <Button size="sm">OK</Button>
            </div>
          </div>
        </div>
        <div className="vc-ft__bottom">
          <span>© 2026 Vcore · Nutrición &amp; Rendimiento</span>
          <span>Términos · Privacidad</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { VcoreHeader: Header, VcoreFooter: Footer, VcoreProductImage: ProductImage });
