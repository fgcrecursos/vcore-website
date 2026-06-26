/* Vcore website — App shell + hash routing + cart state. */
const React = window.React;
const { useState, useEffect } = React;

/* ── Hash routing ───────────────────────────────────────── */
function pageToHash(pg, prod) {
  if (pg === 'shop')     return '#/tienda';
  if (pg === 'nosotros') return '#/nosotros';
  if (pg === 'admin')    return '#/admin';
  if (pg === 'product')  return '#/producto/' + (prod ? prod.id : '');
  return '#/';
}
function parseHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (!parts.length) return { page: 'home' };
  if (parts[0] === 'tienda')   return { page: 'shop' };
  if (parts[0] === 'nosotros') return { page: 'nosotros' };
  if (parts[0] === 'admin')    return { page: 'admin' };
  if (parts[0] === 'producto') return { page: 'product', id: parts[1] || '' };
  return { page: 'home' };
}

export default function App() {
  const initial = parseHash();
  const [page, setPage] = useState(initial.page);
  const [active, setActive] = useState(() => {
    if (initial.page === 'product' && initial.id) {
      return window.VcoreData.products.find(p => p.id === initial.id) || window.VcoreData.products[0];
    }
    return window.VcoreData.products[0];
  });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setDataVersion] = useState(0);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('vcore-theme') || 'light'; } catch (e) { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('vcore-theme', theme); } catch (e) {}
  }, [theme]);

  /* la URL (hash) es la fuente de verdad de la navegación */
  useEffect(() => {
    function applyRoute() {
      const r = parseHash();
      setPage(r.page);
      if (r.page === 'product' && r.id) {
        const prod = window.VcoreData.products.find(p => p.id === r.id);
        if (prod) setActive(prod);
      }
      window.scrollTo({ top: 0 });
    }
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, []);

  useEffect(() => {
    function handler(e) { nav(e.detail); }
    window.addEventListener('vc:nav', handler);
    return () => window.removeEventListener('vc:nav', handler);
  }, []);

  /* re-render cuando el catálogo llega/cambia desde el backend */
  useEffect(() => {
    function onData() {
      setDataVersion(v => v + 1);
      const r = parseHash();
      if (r.page === 'product' && r.id) {
        const prod = window.VcoreData.products.find(p => p.id === r.id);
        if (prod) setActive(prod);
      } else {
        setActive(a => (a && window.VcoreData.products.find(p => p.id === a.id)) || window.VcoreData.products[0]);
      }
    }
    window.addEventListener('vc:data-loaded', onData);
    return () => window.removeEventListener('vc:data-loaded', onData);
  }, []);

  function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark'); }

  const Header = window.VcoreHeader;
  const Footer = window.VcoreFooter;
  const Home = window.VcoreHome;
  const Shop = window.VcoreShop;
  const Product = window.VcoreProduct;
  const CartDrawer = window.VcoreCartDrawer;
  const SearchOverlay = window.VcoreSearchOverlay;
  const AboutPage = window.VcoreAboutPage;
  const AdminPage = window.VcoreAdminPage;

  function addToCart(p, qty = 1, size) {
    const sz = size || p.sizes[0];
    const unitPrice = window.VcoreData.priceFor(p, sz);
    setCart(c => {
      const i = c.findIndex(it => it.product.id === p.id && it.size === sz);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
      return [...c, { product: p, qty, size: sz, unitPrice }];
    });
    setCartOpen(true);
  }

  function changeQty(idx, d) {
    setCart(c => c.map((it, i) => i === idx ? { ...it, qty: it.qty + d } : it).filter(it => it.qty > 0));
  }

  function openProduct(p) {
    setActive(p);                          // respuesta inmediata
    window.location.hash = pageToHash('product', p);
  }

  function nav(pg) {
    if (pg === 'howto') {
      const scroll = () => document.getElementById('como-comprar')?.scrollIntoView({ behavior: 'smooth' });
      if (page !== 'home') { window.location.hash = '#/'; setTimeout(scroll, 140); }
      else scroll();
      return;
    }
    if (pg.startsWith('product-')) {
      const id = pg.replace('product-', '');
      const prod = window.VcoreData.products.find(p => p.id === id);
      if (prod) setActive(prod);
      window.location.hash = '#/producto/' + id;
      return;
    }
    const target = pageToHash(pg);
    if (window.location.hash === target || (target === '#/' && !window.location.hash)) {
      // mismo destino: forzar aplicar ruta igual (ej. volver al home ya estando)
      setPage(pg); window.scrollTo({ top: 0 });
    } else {
      window.location.hash = target;
    }
  }

  const count = cart.reduce((s, it) => s + it.qty, 0);

  if (page === 'admin') {
    return (
      <div data-theme={theme === 'dark' ? 'dark' : undefined}>
        <AdminPage onExit={() => nav('home')} />
      </div>
    );
  }

  return (
    <div className="vc-site" data-theme={theme === 'dark' ? 'dark' : undefined}>
      <Header
        page={page}
        onNav={nav}
        cartCount={count}
        onOpenCart={() => setCartOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSearch={() => setSearchOpen(true)}
      />

      {page === 'home'     && <Home onNav={nav} onAdd={addToCart} onOpen={openProduct} />}
      {page === 'shop'     && <Shop onAdd={addToCart} onOpen={openProduct} />}
      {page === 'product'  && <Product product={active} onAdd={addToCart} onOpen={openProduct} />}
      {page === 'nosotros' && <AboutPage />}

      <Footer />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpen={openProduct}
      />
    </div>
  );
}
