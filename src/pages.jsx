/* Vcore website — pages: Home, Shop, Product + ProductCard. */
const React = window.React;
const { useState } = React;
const { Button, Badge, Card, StatRing, Eyebrow, Tag } = window.VcoreDesignSystem_8ff97c;
const I = window.VcoreIcons;
const D = window.VcoreData;
const ProductImage = window.VcoreProductImage;

const PAGE_CSS = `
.vc-hero { position: relative; display: grid; grid-template-columns: 1.05fr .95fr; gap: 56px; align-items: center; padding: 64px 0 48px; }
.vc-hero h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(42px, 5vw, 68px);
  line-height: .98; letter-spacing: -.03em; margin: 20px 0 0; }
.vc-hero h1 em { font-style: italic; font-weight: 600; color: var(--green-600); }
.vc-hero p { font-size: 18px; line-height: 1.6; color: var(--ink-700); margin: 22px 0 30px; max-width: 460px; }
.vc-hero__cta { display: flex; gap: 12px; }
.vc-hero__img { position: relative; }
.vc-hero__img::before { content: ""; position: absolute; inset: -8% -6% -8% -6%; z-index: 0;
  background: radial-gradient(60% 55% at 50% 45%, rgba(55,167,105,.28) 0%, rgba(55,167,105,0) 70%); filter: blur(8px); }
.vc-hero__img > * { position: relative; z-index: 1; }
.vc-hero__rings { display: flex; gap: 14px; margin-top: 26px; }

.vc-section { padding: 56px 0; }
.vc-section__head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 30px; }
.vc-section__head h2 { font-family: var(--font-display); font-weight: 800; font-size: 36px; letter-spacing: -.025em; margin: 10px 0 0; }
.vc-ben { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.vc-ben__icon { position: relative; width: 52px; height: 52px; border-radius: 16px; background: var(--gradient-green-bloom);
  color: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; overflow: hidden;
  box-shadow: var(--shadow-sm); }
.vc-ben__icon::after { content: ""; position: absolute; inset: 0; background: var(--vignette-soft); }
.vc-ben__icon svg { position: relative; z-index: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,.18)); }
.vc-ben h3 { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: -.01em; margin: 0 0 8px; }
.vc-ben p { font-size: 14.5px; color: var(--ink-700); margin: 0; line-height: 1.55; }

.vc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.vc-pc__name { font-family: var(--font-display); font-weight: 800; font-size: 18px; letter-spacing: -.01em; margin: 14px 0 2px; }
.vc-pc__sub { font-size: 13px; color: var(--ink-500); margin: 0 0 10px; }
.vc-pc__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.vc-pc__price { font-family: var(--font-display); font-weight: 800; font-size: 19px; }
.vc-rating { display: inline-flex; align-items: center; gap: 5px; color: var(--ink-600); font-size: 13px; font-weight: 600; }
.vc-rating svg { color: var(--warning-500); }

.vc-band { position: relative; background: var(--gradient-ink-bloom); color: #EAF0EC; border-radius: var(--radius-2xl);
  padding: 64px 56px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; overflow: hidden; isolation: isolate; }
.vc-band::after { content: ""; position: absolute; inset: 0; background: var(--vignette); pointer-events: none; z-index: 0; }
.vc-band > * { position: relative; z-index: 1; }
.vc-band h2 { font-family: var(--font-display); font-weight: 800; font-size: 38px; letter-spacing: -.025em; line-height: 1.05; margin: 16px 0 0; }
.vc-band h2 em { font-style: italic; font-weight: 600; color: var(--green-400); }
.vc-band p { color: rgba(255,255,255,.7); font-size: 16px; line-height: 1.65; margin: 0; }

.vc-pdp { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; padding: 44px 0; align-items: start; }
.vc-pdp__name { font-family: var(--font-display); font-weight: 800; font-size: 52px; letter-spacing: -.03em; line-height: .98; margin: 14px 0 6px; }
.vc-pdp__sub { font-size: 20px; color: var(--ink-600); margin: 0 0 18px; font-weight: 500; }
.vc-pdp__price { font-family: var(--font-display); font-weight: 800; font-size: 34px; margin: 0; }
.vc-pdp__blurb { font-size: 16.5px; line-height: 1.65; color: var(--ink-700); margin: 18px 0 26px; max-width: 460px; }
.vc-opt { display: flex; gap: 10px; margin-bottom: 22px; }
.vc-opt button { font-family: var(--font-body); font-weight: 700; font-size: 14px; padding: 9px 16px; border-radius: var(--radius-pill);
  border: 1.5px solid var(--border-default); background: var(--surface-card); color: var(--ink-800); cursor: pointer; }
.vc-opt button.on { border-color: var(--green-500); background: var(--green-050); color: var(--green-800); }
.vc-qty { display: inline-flex; align-items: center; border: 1.5px solid var(--border-default); border-radius: var(--radius-pill); overflow: hidden; }
.vc-qty button { width: 40px; height: 44px; border: 0; background: transparent; cursor: pointer; color: var(--ink-800); display: flex; align-items: center; justify-content: center; }
.vc-qty span { width: 38px; text-align: center; font-weight: 800; font-family: var(--font-display); }
.vc-rings { display: flex; gap: 16px; margin: 30px 0 0; }
.vc-pdp__stats { display: flex; gap: 18px; flex-wrap: wrap; padding: 22px 0; border-top: 1px solid var(--paper-200); margin-top: 26px; }
.vc-pdp__stat { font-size: 14px; color: var(--ink-700); display: flex; align-items: center; gap: 8px; }
.vc-pdp__stat svg { color: var(--green-600); }
`;

function injectPages() {
  if (!document.getElementById('vc-pages-css')) {
    const el = document.createElement('style'); el.id = 'vc-pages-css'; el.textContent = PAGE_CSS;
    document.head.appendChild(el);
  }
}

function Rating({ r, n }) {
  return <span className="vc-rating"><I.Star size={14} />{r} <span style={{ color: 'var(--ink-400)', fontWeight: 500 }}>({n})</span></span>;
}

function ProductCard({ p, onOpen, onAdd }) {
  return (
    <Card variant="surface" padding="none" interactive>
      <div onClick={() => onOpen(p)} style={{ cursor: 'pointer' }}>
        <div style={{ position: 'relative' }}>
          <ProductImage product={p} className="" />
          {p.badge && <div style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone={p.tone === 'navy' ? 'sage' : 'green'} variant="solid">{p.badge}</Badge></div>}
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <div className="vc-pc__name">{p.name}</div>
          <div className="vc-pc__sub">{p.sub}</div>
          <Rating r={p.rating} n={p.reviews} />
          <div className="vc-pc__foot">
            <span className="vc-pc__price">{D.fmt(p.price)}</span>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onAdd(p); }}>Agregar</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Home({ onNav, onAdd, onOpen }) {
  injectPages();
  const creatina = D.products[0];
  const benefits = creatina.benefits;
  return (
    <main>
      <div className="vc-wrap">
        <section className="vc-hero">
          <div>
            <Eyebrow>Nutrition &amp; Performance</Eyebrow>
            <h1>Energía real,<br/><em>sin vueltas.</em></h1>
            <p>Nutrición funcional simplificada para la vida activa. Sin estéticas agresivas, sin fórmulas imposibles. Solo lo que tu cuerpo necesita.</p>
            <div className="vc-hero__cta">
              <Button size="lg" onClick={() => onNav('shop')} iconRight={<I.ArrowRight size={18} />}>Ver productos</Button>
              <Button size="lg" variant="outline" onClick={() => onOpen(creatina)}>Conocer Creatina</Button>
            </div>
            <div className="vc-hero__rings">
              {creatina.stats.map((s, i) => <StatRing key={i} value={s.value} label={s.label} size={86} variant={i === 1 ? 'soft' : 'outline'} />)}
            </div>
          </div>
          <div className="vc-hero__img">
            <ProductImage product={creatina} />
          </div>
        </section>
      </div>

      <div className="vc-wrap">
        <section className="vc-section">
          <div className="vc-section__head">
            <div><Eyebrow tone="ink">Por qué Vcore</Eyebrow><h2>Simple. Puro. Real.</h2></div>
          </div>
          <div className="vc-ben">
            {benefits.map(([icon, title, desc], i) => {
              const Ic = I[icon];
              return (
                <Card key={i} variant="surface" padding="lg">
                  <div className="vc-ben__icon"><Ic size={24} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      <div className="vc-wrap">
        <section className="vc-section" style={{ paddingTop: 0 }}>
          <div className="vc-section__head">
            <div><Eyebrow tone="ink">La tienda</Eyebrow><h2>Lo esencial</h2></div>
            <Button variant="ghost" onClick={() => onNav('shop')} iconRight={<I.ArrowRight size={16} />}>Ver todo</Button>
          </div>
          <div className="vc-grid">
            {D.products.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} onAdd={onAdd} />)}
          </div>
        </section>
      </div>

      <div className="vc-wrap">
        <section className="vc-band">
          <div>
            <Eyebrow tone="onDark">Nuestra misión</Eyebrow>
            <h2>Democratizar el bienestar y el <em>rendimiento.</em></h2>
          </div>
          <p>No diseñamos solo para atletas de élite, sino para quienes corren hacia su trabajo, entrenan por salud o buscan energía para superar su día a día. Somos la respuesta clara, accesible y confiable.</p>
        </section>
      </div>
    </main>
  );
}

function Shop({ onAdd, onOpen }) {
  injectPages();
  const [filter, setFilter] = useState('Todo');
  const filters = ['Todo', 'Energía', 'Recuperación', 'Descanso'];
  return (
    <main className="vc-wrap">
      <section className="vc-section" style={{ paddingBottom: 24 }}>
        <Eyebrow tone="ink">Tienda</Eyebrow>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, letterSpacing: '-.03em', margin: '12px 0 24px' }}>Suplementación simple</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {filters.map((f) => <Tag key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Tag>)}
        </div>
      </section>
      <section style={{ paddingBottom: 20 }}>
        <div className="vc-grid">
          {D.products.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} onAdd={onAdd} />)}
        </div>
      </section>
    </main>
  );
}

function Product({ product, onAdd }) {
  injectPages();
  const p = product || D.products[0];
  const [size, setSize] = useState(p.sizes[0]);
  const [qty, setQty] = useState(1);
  const stats = p.stats || D.products[0].stats;
  return (
    <main className="vc-wrap">
      <section className="vc-pdp">
        <div style={{ position: 'sticky', top: 90 }}>
          <ProductImage product={p} />
        </div>
        <div>
          <Eyebrow>Suplemento</Eyebrow>
          <div className="vc-pdp__name">{p.name}</div>
          <div className="vc-pdp__sub">{p.sub}</div>
          <Rating r={p.rating} n={p.reviews} />
          <p className="vc-pdp__blurb">{p.blurb}</p>
          <p className="vc-pdp__price">{D.fmt(p.price)}</p>

          <div style={{ marginTop: 22, marginBottom: 6, fontWeight: 700, fontSize: 13.5, color: 'var(--ink-700)' }}>Tamaño</div>
          <div className="vc-opt">
            {p.sizes.map((s) => <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>{s}</button>)}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="vc-qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><I.Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}><I.Plus size={16} /></button>
            </div>
            <Button size="lg" onClick={() => onAdd(p, qty)} iconRight={<I.Bag size={18} />}>Agregar al carrito</Button>
          </div>

          <div className="vc-rings">
            {stats.map((s, i) => <StatRing key={i} value={s.value} label={s.label} size={92} variant={i === 1 ? 'soft' : i === 2 ? 'filled' : 'outline'} />)}
          </div>

          <div className="vc-pdp__stats">
            <span className="vc-pdp__stat"><I.Truck size={18} /> Envío gratis sobre $20.000</span>
            <span className="vc-pdp__stat"><I.Shield size={18} /> Pureza certificada</span>
            <span className="vc-pdp__stat"><I.Leaf size={18} /> Sin aditivos</span>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { VcoreHome: Home, VcoreShop: Shop, VcoreProduct: Product, VcoreProductCard: ProductCard });
