/* Vcore website — App shell + routing + cart state. */
const React = window.React;
const { useState, useEffect } = React;

export default function App() {
  const [page, setPage] = useState('home');
  const [active, setActive] = useState(window.VcoreData.products[0]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('vcore-theme') || 'light'; } catch (e) { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('vcore-theme', theme); } catch (e) {}
  }, [theme]);

  useEffect(() => {
    function handler(e) { nav(e.detail); }
    window.addEventListener('vc:nav', handler);
    return () => window.removeEventListener('vc:nav', handler);
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
    setActive(p);
    setPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nav(pg) {
    if (pg === 'howto') {
      if (page !== 'home') {
        setPage('home');
        setTimeout(() => {
          document.getElementById('como-comprar')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        document.getElementById('como-comprar')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (pg.startsWith('product-')) {
      const id = pg.replace('product-', '');
      const prod = window.VcoreData.products.find(p => p.id === id);
      if (prod) openProduct(prod);
      return;
    }
    setPage(pg);
    window.scrollTo({ top: 0 });
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
      {page === 'product'  && <Product product={active} onAdd={addToCart} />}
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
