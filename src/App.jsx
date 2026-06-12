/* Vcore website — App shell + routing + cart state. */
const React = window.React;
const { useState, useEffect } = React;

export default function App() {
  const [page, setPage] = useState('home');
  const [active, setActive] = useState(window.VcoreData.products[0]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('vcore-theme') || 'light'; } catch (e) { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('vcore-theme', theme); } catch (e) {}
  }, [theme]);
  function toggleTheme() { setTheme((t) => (t === 'dark' ? 'light' : 'dark')); }

  const Header = window.VcoreHeader, Footer = window.VcoreFooter;
  const Home = window.VcoreHome, Shop = window.VcoreShop, Product = window.VcoreProduct;
  const CartDrawer = window.VcoreCartDrawer;

  function addToCart(p, qty = 1) {
    const size = p.sizes[0];
    setCart((c) => {
      const i = c.findIndex((it) => it.product.id === p.id && it.size === size);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
      return [...c, { product: p, qty, size }];
    });
    setCartOpen(true);
  }
  function changeQty(idx, d) {
    setCart((c) => c.map((it, i) => i === idx ? { ...it, qty: it.qty + d } : it).filter((it) => it.qty > 0));
  }
  function openProduct(p) { setActive(p); setPage('product'); window.scrollTo({ top: 0 }); }
  function nav(pg) { setPage(pg); window.scrollTo({ top: 0 }); }

  const count = cart.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="vc-site" data-theme={theme === 'dark' ? 'dark' : undefined}>
      <Header page={page} onNav={nav} cartCount={count} onOpenCart={() => setCartOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
      {page === 'home' && <Home onNav={nav} onAdd={addToCart} onOpen={openProduct} />}
      {page === 'shop' && <Shop onAdd={addToCart} onOpen={openProduct} />}
      {page === 'product' && <Product product={active} onAdd={addToCart} />}
      {page === 'about' && <Product product={window.VcoreData.products[0]} onAdd={addToCart} />}
      <Footer />
      <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onQty={changeQty} />
    </div>
  );
}
