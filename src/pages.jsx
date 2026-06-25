/* Vcore website — pages: HeroBanner, Home, Shop, Product, SearchOverlay, AdminPage. */
const React = window.React;
const { useState, useEffect } = React;
const { Button, Badge, Card, StatRing, Eyebrow, Tag } = window.VcoreDesignSystem_8ff97c;
const I = window.VcoreIcons;
const D = window.VcoreData;
const ProductImage = window.VcoreProductImage;

const PAGE_CSS = `
/* ---- Banner hero ---- */
.vc-banner { position: relative; overflow: hidden; isolation: isolate; min-height: 540px; }
.vc-slide { position: absolute; inset: 0; min-height: 540px; display: flex; align-items: center;
  opacity: 0; transition: opacity .75s cubic-bezier(.4,0,.2,1); pointer-events: none; }
.vc-slide.active { opacity: 1; pointer-events: auto; }
.vc-slide__bg { position: absolute; inset: 0; }
.vc-slide__vignette { position: absolute; inset: 0; background: var(--vignette); pointer-events: none; }
.vc-slide__inner { position: relative; z-index: 2; width: 100%; }
.vc-slide__content { color: #EAF0EC; max-width: 620px; padding: 88px 0; }
.vc-slide__content h1 { font-family: var(--font-display); font-weight: 800;
  font-size: clamp(38px, 4.8vw, 66px); letter-spacing: -.03em; line-height: .97; margin: 18px 0 0; }
.vc-slide__content h1 em { font-style: italic; font-weight: 600; color: var(--green-400); }
.vc-slide__content p { font-size: 17px; line-height: 1.65; color: rgba(255,255,255,.72);
  margin: 22px 0 32px; max-width: 490px; }
.vc-slide__ctas { display: flex; gap: 12px; flex-wrap: wrap; }
.vc-slide__outline-btn { font-family: var(--font-body); font-weight: 700; font-size: 15px;
  padding: 0 22px; height: 48px; border-radius: var(--radius-pill);
  border: 1.5px solid rgba(255,255,255,.35); background: rgba(255,255,255,.07);
  color: #fff; cursor: pointer; transition: background .15s, border-color .15s; }
.vc-slide__outline-btn:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.5); }
.vc-slide__stats { display: flex; gap: 36px; margin-top: 40px; padding-top: 32px;
  border-top: 1px solid rgba(255,255,255,.14); }
.vc-slide__stat-v { font-family: var(--font-display); font-weight: 800; font-size: 30px;
  color: var(--green-400); line-height: 1; }
.vc-slide__stat-l { font-size: 11.5px; text-transform: uppercase; letter-spacing: .1em;
  color: rgba(255,255,255,.5); margin-top: 4px; }
/* About — origin story */
.vc-about-story { display: grid; grid-template-columns: 1.05fr .95fr; gap: 64px; align-items: center; }
.vc-about-mark { position: relative; aspect-ratio: 1 / 1; border-radius: var(--radius-2xl);
  background: var(--gradient-ink-bloom); overflow: hidden; isolation: isolate;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 24px 60px rgba(8,28,18,.28); }
.vc-about-mark__vignette { position: absolute; inset: 0; background: var(--vignette); pointer-events: none; z-index: 0; }
.vc-about-mark__logo { position: relative; z-index: 1; width: 46%; max-width: 220px; height: auto;
  filter: drop-shadow(0 12px 32px rgba(0,0,0,.35)); }
.vc-about-mark__tag { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 2;
  font-family: var(--font-display); font-weight: 800; font-size: 12px; letter-spacing: .1em;
  text-transform: uppercase; color: rgba(255,255,255,.6); white-space: nowrap; }
@media (max-width: 760px) { .vc-about-story { grid-template-columns: 1fr; gap: 36px; } }

/* two-col slide */
.vc-slide__two { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: center; width: 100%; }
.vc-slide__two .vc-slide__content { padding: 88px 0; max-width: none; }
.vc-slide__stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.vc-slide__stat-card { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.13);
  border-radius: 18px; padding: 24px 20px; }
.vc-slide__stat-card .vc-slide__stat-v { font-family: var(--font-display); font-weight: 800;
  font-size: 36px; color: var(--green-400); line-height: 1; margin-bottom: 8px; }
.vc-slide__stat-card .vc-slide__stat-l { font-size: 12px; text-transform: uppercase; letter-spacing: .1em;
  color: rgba(255,255,255,.55); font-weight: 700; line-height: 1.4; }

.vc-banner__arr { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
  width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.22);
  background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, border-color .15s; }
.vc-banner__arr:hover { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.42); }
.vc-banner__arr--l { left: 22px; }
.vc-banner__arr--r { right: 22px; }
.vc-banner__dots { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  z-index: 10; display: flex; gap: 8px; align-items: center; }
.vc-banner__dot { width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,.3); border: 0; padding: 0; cursor: pointer;
  transition: background .2s, width .2s, border-radius .2s; }
.vc-banner__dot.active { background: var(--green-400); width: 22px; border-radius: 4px; }

/* ---- Layout ---- */
.vc-section { padding: 56px 0; }
.vc-section__head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 30px; }
.vc-section__head h2 { font-family: var(--font-display); font-weight: 800; font-size: 36px;
  letter-spacing: -.025em; margin: 10px 0 0; }

/* ---- Benefits ---- */
.vc-ben { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.vc-ben__icon { position: relative; width: 52px; height: 52px; border-radius: 16px;
  background: var(--gradient-green-bloom); color: #fff;
  display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  overflow: hidden; box-shadow: var(--shadow-sm); }
.vc-ben__icon::after { content: ""; position: absolute; inset: 0; background: var(--vignette-soft); }
.vc-ben__icon svg { position: relative; z-index: 1; }
.vc-ben h3 { font-family: var(--font-display); font-weight: 800; font-size: 20px;
  letter-spacing: -.01em; margin: 0 0 8px; }
.vc-ben p { font-size: 14.5px; color: var(--ink-700); margin: 0; line-height: 1.55; }

/* ---- Volume tiers ---- */
.vc-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
  background: var(--paper-200); border-radius: var(--radius-xl); overflow: hidden; }
.vc-tier { background: var(--surface-card); padding: 26px 22px; position: relative; }
.vc-tier__flag { position: absolute; top: 14px; right: 14px; font-size: 12px; font-weight: 800;
  padding: 3px 10px; border-radius: var(--radius-pill); }
.vc-tier__flag--plain { background: var(--paper-200); color: var(--ink-600); }
.vc-tier__flag--mid { background: var(--green-100); color: var(--green-700); }
.vc-tier__flag--top { background: var(--gradient-green-bloom); color: #fff; }
.vc-tier__eye { font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
  font-weight: 800; color: var(--ink-500); margin: 0 0 6px; }
.vc-tier__name { font-family: var(--font-display); font-weight: 800; font-size: 22px;
  margin: 0 0 4px; letter-spacing: -.01em; }
.vc-tier__from { font-size: 13px; color: var(--ink-500); margin: 0 0 16px; }
.vc-tier__perk { display: flex; align-items: center; gap: 8px; font-size: 14px;
  color: var(--ink-700); margin-bottom: 7px; }
.vc-tier__perk svg { color: var(--green-600); flex: none; }

/* ---- How to buy ---- */
.vc-howto { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.vc-howto__n { font-family: var(--font-display); font-weight: 800; font-size: 52px;
  color: var(--green-200); line-height: 1; margin: 0 0 14px; }
[data-theme="dark"] .vc-howto__n { color: var(--green-800); }
.vc-howto__title { font-family: var(--font-display); font-weight: 800; font-size: 20px;
  letter-spacing: -.01em; margin: 0 0 10px; }
.vc-howto p { font-size: 14.5px; color: var(--ink-600); margin: 0; line-height: 1.55; }
.vc-howto__wa { margin-top: 32px; display: flex; align-items: center; gap: 12px; }

/* ---- Product grid ---- */
.vc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.vc-grid--3 { grid-template-columns: repeat(3, 1fr); }
.vc-grid--2 { grid-template-columns: repeat(2, 1fr); }
.vc-pc__name { font-family: var(--font-display); font-weight: 800; font-size: 18px;
  letter-spacing: -.01em; margin: 14px 0 2px; }
.vc-pc__sub { font-size: 13px; color: var(--ink-500); margin: 0 0 10px; }
.vc-pc__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.vc-pc__price { font-family: var(--font-display); font-weight: 800; font-size: 19px; }
.vc-pc__from { font-family: var(--font-body); font-weight: 600; font-size: 11px;
  color: var(--ink-500); letter-spacing: 0; }
.vc-rating { display: inline-flex; align-items: center; gap: 5px;
  color: var(--ink-600); font-size: 13px; font-weight: 600; }
.vc-rating svg { color: var(--warning-500); }

/* ---- Mission band ---- */
.vc-band { position: relative; background: var(--gradient-ink-bloom); color: #EAF0EC;
  border-radius: var(--radius-2xl); padding: 64px 56px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
  overflow: hidden; isolation: isolate; }
.vc-band::after { content: ""; position: absolute; inset: 0; background: var(--vignette);
  pointer-events: none; z-index: 0; }
.vc-band > * { position: relative; z-index: 1; }
.vc-band h2 { font-family: var(--font-display); font-weight: 800; font-size: 38px;
  letter-spacing: -.025em; line-height: 1.05; margin: 16px 0 0; }
.vc-band h2 em { font-style: italic; font-weight: 600; color: var(--green-400); }
.vc-band p { color: rgba(255,255,255,.7); font-size: 16px; line-height: 1.65; margin: 0; }

/* ---- Shop ---- */
.vc-cats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
.vc-shop-search { position: relative; max-width: 320px; margin-bottom: 20px; }
.vc-shop-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--ink-400); pointer-events: none; }
.vc-shop-search input { width: 100%; height: 42px; padding: 0 14px 0 36px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-pill);
  background: var(--surface-card); font-family: var(--font-body); font-size: 14px;
  color: var(--ink-900); outline: none; box-sizing: border-box; }
.vc-shop-search input:focus { border-color: var(--green-500); }
.vc-empty { text-align: center; padding: 60px 0; color: var(--ink-500); }
.vc-empty svg { display: block; margin: 0 auto 14px; opacity: .4; }

/* ---- PDP ---- */
.vc-pdp { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; padding: 44px 0; align-items: start; }
.vc-pdp__name { font-family: var(--font-display); font-weight: 800; font-size: 52px;
  letter-spacing: -.03em; line-height: .98; margin: 14px 0 6px; }
.vc-pdp__sub { font-size: 20px; color: var(--ink-600); margin: 0 0 18px; font-weight: 500; }
.vc-pdp__price { font-family: var(--font-display); font-weight: 800; font-size: 34px; margin: 0; }
.vc-pdp__blurb { font-size: 16.5px; line-height: 1.65; color: var(--ink-700);
  margin: 18px 0 26px; max-width: 460px; }
.vc-opt { display: flex; gap: 10px; margin-bottom: 22px; }
.vc-opt button { font-family: var(--font-body); font-weight: 700; font-size: 14px;
  padding: 9px 16px; border-radius: var(--radius-pill);
  border: 1.5px solid var(--border-default); background: var(--surface-card);
  color: var(--ink-800); cursor: pointer; }
.vc-opt button.on { border-color: var(--green-500); background: var(--green-050); color: var(--green-800); }
.vc-opt__price { display: block; font-weight: 800; font-size: 12px; color: var(--green-700);
  margin-top: 3px; }
[data-theme="dark"] .vc-opt__price { color: var(--green-400); }
.vc-qty { display: inline-flex; align-items: center;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-pill); overflow: hidden; }
.vc-qty button { width: 40px; height: 44px; border: 0; background: transparent; cursor: pointer;
  color: var(--ink-800); display: flex; align-items: center; justify-content: center; }
.vc-qty span { width: 38px; text-align: center; font-weight: 800; font-family: var(--font-display); }
.vc-rings { display: flex; gap: 16px; margin: 30px 0 0; }
.vc-pdp__stats { display: flex; gap: 18px; flex-wrap: wrap; padding: 22px 0;
  border-top: 1px solid var(--paper-200); margin-top: 26px; }
.vc-pdp__stat { font-size: 14px; color: var(--ink-700); display: flex; align-items: center; gap: 8px; }
.vc-pdp__stat svg { color: var(--green-600); }

/* ---- Search overlay ---- */
.vc-search-ov { position: fixed; inset: 0; background: rgba(10,20,20,.6);
  backdrop-filter: blur(4px); z-index: 50;
  opacity: 0; transition: opacity .2s; pointer-events: none; }
.vc-search-ov.open { opacity: 1; pointer-events: auto; }
.vc-search-box { position: fixed; top: 82px; left: 50%; transform: translateX(-50%);
  width: min(680px, 92vw); background: var(--paper-050); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl); z-index: 51; overflow: hidden; }
.vc-search-box__inp { display: flex; align-items: center; gap: 10px; padding: 18px 20px 14px; }
.vc-search-box__inp svg { color: var(--ink-400); flex: none; }
.vc-search-box__inp input { flex: 1; font-family: var(--font-display); font-size: 20px;
  font-weight: 700; border: 0; outline: 0; background: transparent; color: var(--ink-900); }
.vc-search-sep { border: 0; border-top: 1px solid var(--paper-200); margin: 0; }
.vc-search-results { max-height: 360px; overflow-y: auto; padding: 8px 12px 12px; }
.vc-sres { display: flex; align-items: center; gap: 14px; padding: 10px 8px;
  border-radius: var(--radius-md); cursor: pointer; }
.vc-sres:hover { background: var(--paper-100); }
.vc-sres__img { width: 52px; height: 62px; border-radius: var(--radius-sm); overflow: hidden; flex: none; }
.vc-sres__img .vc-pimg { border-radius: 0; height: 100%; aspect-ratio: auto; }
.vc-sres__name { font-family: var(--font-display); font-weight: 800; font-size: 15px; margin: 0; }
.vc-sres__cat { font-size: 12px; color: var(--ink-500); margin: 2px 0 0; }
.vc-sres__price { font-family: var(--font-display); font-weight: 800; font-size: 14px;
  color: var(--green-700); margin-left: auto; white-space: nowrap; }
[data-theme="dark"] .vc-sres__price { color: var(--green-400); }
.vc-search-empty { padding: 24px 8px; font-size: 14px; color: var(--ink-500); }

/* ---- Admin ---- */
.vc-admin { max-width: 920px; margin: 0 auto; padding: 40px 28px 80px; }
.vc-admin__login { max-width: 360px; margin: 80px auto 0; text-align: center; }
.vc-admin__login-row { display: flex; gap: 10px; }
.vc-admin__login input { flex: 1; height: 44px; padding: 0 14px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); font-family: var(--font-body); font-size: 14px;
  color: var(--ink-900); outline: none; }
.vc-admin__login input:focus { border-color: var(--green-500); }
.vc-admin__hint { font-size: 12px; color: var(--ink-400); margin-top: 10px; }
.vc-admin__hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.vc-admin__title { font-family: var(--font-display); font-weight: 800; font-size: 32px;
  letter-spacing: -.02em; margin: 10px 0 0; }
.vc-admin__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
.vc-admin__stat { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-lg); padding: 20px 22px; }
.vc-admin__stat h4 { font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
  color: var(--ink-500); margin: 0 0 8px; font-weight: 800; }
.vc-admin__stat .v { font-family: var(--font-display); font-weight: 800; font-size: 28px; }
.vc-orders { width: 100%; border-collapse: collapse; font-size: 14px; }
.vc-orders th { text-align: left; padding: 10px 12px; font-size: 11px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-500);
  border-bottom: 1px solid var(--paper-200); font-weight: 800; }
.vc-orders td { padding: 14px 12px; border-bottom: 1px solid var(--paper-100); vertical-align: top; }
.vc-orders__num { font-family: var(--font-display); font-weight: 800; }
.vc-orders__status { display: inline-flex; align-items: center; font-size: 12px; font-weight: 800;
  padding: 3px 9px; border-radius: var(--radius-pill); }
.vc-orders__status--pending { background: #FBEFD6; color: #9A6A12; }
.vc-orders__status--ok { background: var(--green-100); color: var(--green-700); }
.vc-orders__del { background: none; border: none; cursor: pointer; color: var(--ink-400);
  padding: 4px; display: inline-flex; align-items: center; }
.vc-orders__del:hover { color: #8E2E22; }

/* ───────── Mobile ───────── */
@media (max-width: 860px) {
  /* hero */
  .vc-banner, .vc-slide { min-height: 0; }
  .vc-slide { position: relative; }
  .vc-slide:not(.active) { display: none; }
  .vc-slide__content { padding: 56px 0 64px; max-width: none; }
  .vc-slide__content p { font-size: 15.5px; }
  .vc-banner__arr { display: none; }
  .vc-banner__dots { bottom: 16px; }
  /* two-col slide → stack, stats below */
  .vc-slide__two { grid-template-columns: 1fr; gap: 26px; }
  .vc-slide__two .vc-slide__content { padding: 56px 0 8px; }
  .vc-slide__stats-grid { gap: 10px; padding-bottom: 56px; }
  .vc-slide__stat-card { padding: 16px 16px; }
  .vc-slide__stat-card .vc-slide__stat-v { font-size: 28px; }
  .vc-slide__stats { gap: 22px; flex-wrap: wrap; }

  /* sections */
  .vc-section { padding: 40px 0; }
  .vc-section__head { flex-direction: column; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
  .vc-section__head h2 { font-size: 27px; }

  /* grids → 1 col */
  .vc-ben, .vc-howto, .vc-tiers { grid-template-columns: 1fr; }
  .vc-grid, .vc-grid--3, .vc-grid--2 { grid-template-columns: repeat(2, 1fr); gap: 12px; }

  /* mission band */
  .vc-band { grid-template-columns: 1fr; padding: 40px 26px; gap: 18px; border-radius: var(--radius-xl); }
  .vc-band h2 { font-size: 30px; }

  /* PDP */
  .vc-pdp { grid-template-columns: 1fr; gap: 26px; padding: 24px 0; }
  .vc-pdp > div:first-child { position: static !important; }
  .vc-pdp__name { font-size: 38px; }
  .vc-pdp__sub { font-size: 17px; }
  .vc-pdp__price { font-size: 30px; }
  .vc-rings { flex-wrap: wrap; gap: 12px; }
  .vc-pdp__stats { gap: 12px; }

  /* shop heading */
  .vc-cats { gap: 6px; }

  /* product card tighter */
  .vc-pc__name { font-size: 16px; margin-top: 12px; }
  .vc-pc__price { font-size: 17px; }
  .vc-pc__foot { flex-direction: column; align-items: stretch; gap: 10px; }
  .vc-pc__foot > button { width: 100%; }

  /* about */
  .vc-about-mark { max-width: 360px; margin: 0 auto; width: 100%; }
  .vc-about-hero { padding-top: 52px !important; padding-bottom: 56px !important; }
  .vc-about-cta { flex-direction: column; align-items: flex-start !important; gap: 20px !important; padding: 26px 22px !important; }
}
@media (max-width: 360px) {
  .vc-grid, .vc-grid--3, .vc-grid--2 { grid-template-columns: 1fr; }
}
@media (max-width: 420px) {
  .vc-pdp__name { font-size: 32px; }
  .vc-section__head h2 { font-size: 24px; }
  .vc-pc__name { font-size: 15px; }
}
`;

function injectPages() {
  if (!document.getElementById('vc-pages-css')) {
    const el = document.createElement('style');
    el.id = 'vc-pages-css';
    el.textContent = PAGE_CSS;
    document.head.appendChild(el);
  }
}

function Rating({ r, n }) {
  return (
    <span className="vc-rating">
      <I.Star size={14} />
      {r}
      <span style={{ color: 'var(--ink-400)', fontWeight: 500 }}>({n})</span>
    </span>
  );
}

function ProductCard({ p, onOpen, onAdd }) {
  return (
    <Card variant="surface" padding="none" interactive>
      <div onClick={() => onOpen(p)} style={{ cursor: 'pointer' }}>
        <div style={{ position: 'relative' }}>
          <ProductImage product={p} />
          {p.badge && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge tone={p.tone === 'navy' ? 'sage' : 'green'} variant="solid">{p.badge}</Badge>
            </div>
          )}
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <div className="vc-pc__name">{p.name}</div>
          <div className="vc-pc__sub">{p.sub}</div>
          <Rating r={p.rating} n={p.reviews} />
          <div className="vc-pc__foot">
            <span className="vc-pc__price">
              {D.hasPriceRange(p) && <span className="vc-pc__from">Desde </span>}{D.fmt(p.price)}
            </span>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onAdd(p); }}>Agregar</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* --- Hero banner slides --- */
const SLIDES = [
  {
    eyebrow: 'Nutrición & Rendimiento',
    title: <>Más rendimiento,<br /><em>menos complicaciones.</em></>,
    body: 'Suplementación funcional para quienes entienden que el cuerpo merece lo mejor. Sin rellenos, sin vueltas.',
    bg: 'var(--gradient-ink-bloom)',
    ctas: [
      { label: 'Ver productos', nav: 'shop', primary: true },
      { label: 'Cómo comprar', nav: 'howto', primary: false },
    ],
  },
  {
    eyebrow: 'Pureza certificada',
    title: <>Formulaciones limpias.<br /><em>Sin rellenos innecesarios.</em></>,
    body: 'Seleccionamos insumos de primer nivel y formulamos con precisión. Etiquetas honestas, sin promesas infladas.',
    bg: 'linear-gradient(130deg, #0b2d1c 0%, #0d3d25 40%, #156638 72%, #1e8a4e 100%)',
    twoCol: true,
    stats: [
      { v: '26+',  l: 'productos en catálogo'    },
      { v: '0%',   l: 'rellenos en la fórmula'   },
      { v: '100%', l: 'etiquetas transparentes'   },
      { v: '0g',   l: 'azúcar agregada'           },
    ],
    ctas: [
      { label: 'Ver catálogo', nav: 'shop', primary: true },
    ],
  },
];

function HeroBanner({ onNav }) {
  injectPages();
  const n = SLIDES.length;
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSlide(s => (s + 1) % n), 6000);
    return () => clearTimeout(t);
  }, [slide]);

  function go(dir) { setSlide(s => (s + dir + n) % n); }

  return (
    <div className="vc-banner">
      {SLIDES.map((s, i) => (
        <div key={i} className={`vc-slide${i === slide ? ' active' : ''}`}>
          <div className="vc-slide__bg" style={{ background: s.bg }} />
          <div className="vc-slide__vignette" />
          <div className="vc-wrap vc-slide__inner">
            {s.twoCol ? (
              <div className="vc-slide__two">
                <div className="vc-slide__content">
                  <Eyebrow tone="onDark">{s.eyebrow}</Eyebrow>
                  <h1>{s.title}</h1>
                  <p>{s.body}</p>
                  <div className="vc-slide__ctas">
                    {s.ctas.map((c, j) =>
                      c.primary
                        ? <Button key={j} size="lg" onClick={() => onNav(c.nav)} iconRight={<I.ArrowRight size={18} />}>{c.label}</Button>
                        : <button key={j} className="vc-slide__outline-btn" onClick={() => onNav(c.nav)}>{c.label}</button>
                    )}
                  </div>
                </div>
                {s.stats && (
                  <div className="vc-slide__stats-grid">
                    {s.stats.map((st, j) => (
                      <div key={j} className="vc-slide__stat-card">
                        <div className="vc-slide__stat-v">{st.v}</div>
                        <div className="vc-slide__stat-l">{st.l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="vc-slide__content">
                <Eyebrow tone="onDark">{s.eyebrow}</Eyebrow>
                <h1>{s.title}</h1>
                <p>{s.body}</p>
                <div className="vc-slide__ctas">
                  {s.ctas.map((c, j) =>
                    c.primary
                      ? <Button key={j} size="lg" onClick={() => onNav(c.nav)} iconRight={<I.ArrowRight size={18} />}>{c.label}</Button>
                      : <button key={j} className="vc-slide__outline-btn" onClick={() => onNav(c.nav)}>{c.label}</button>
                  )}
                </div>
                {s.stats && (
                  <div className="vc-slide__stats">
                    {s.stats.map((st, j) => (
                      <div key={j}>
                        <div className="vc-slide__stat-v">{st.v}</div>
                        <div className="vc-slide__stat-l">{st.l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <button className="vc-banner__arr vc-banner__arr--l" onClick={() => go(-1)} aria-label="Anterior">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button className="vc-banner__arr vc-banner__arr--r" onClick={() => go(1)} aria-label="Siguiente">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div className="vc-banner__dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={`vc-banner__dot${i === slide ? ' active' : ''}`}
            onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function VolumeTiers() {
  return (
    <div className="vc-wrap">
      <section className="vc-section">
        <div className="vc-section__head">
          <div>
            <Eyebrow tone="ink">Comprá más, pagá menos</Eyebrow>
            <h2>Descuentos por volumen</h2>
          </div>
          <Button variant="ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('vc:nav', { detail: 'shop' }))}
            iconRight={<I.ArrowRight size={16} />}>
            Armar pedido
          </Button>
        </div>
        <div className="vc-tiers">
          {D.tiers.map((t, i) => (
            <div key={t.id} className="vc-tier">
              <div className={`vc-tier__flag vc-tier__flag--${i === 0 ? 'plain' : i === 1 ? 'mid' : 'top'}`}>
                {i === 0 ? 'Precio base' : t.badge}
              </div>
              <div className="vc-tier__eye">{i === 0 ? 'Lista' : `Desde ${D.fmt(t.min)}`}</div>
              <div className="vc-tier__name">{t.label}</div>
              <div className="vc-tier__from">
                {t.discount === 0 ? 'Sin descuento' : `${t.discount * 100}% off en todo el pedido`}
              </div>
              {t.discount > 0 && (
                <div className="vc-tier__perk"><I.Check size={14} />{t.discount * 100}% de descuento</div>
              )}
              <div className="vc-tier__perk">
                <I.Truck size={14} />
                {t.min >= 50000 ? 'Envío gratis a sucursal' : 'Envío desde $5.000'}
              </div>
              {i === D.tiers.length - 1 && (
                <div className="vc-tier__perk"><I.Star size={14} />Precio preferencial sostenido</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HowToBuy() {
  const steps = [
    {
      n: '01', title: 'Elegí tus productos',
      body: 'Navegá el catálogo, leé los beneficios y agregá al carrito todo lo que necesités.',
    },
    {
      n: '02', title: 'Coordiná por WhatsApp',
      body: 'Tu pedido se convierte en un mensaje listo. Lo enviás a nuestro WhatsApp y coordinamos pago y envío.',
    },
    {
      n: '03', title: 'Recibí en todo el país',
      body: 'Despachamos por Andreani a todo el país. También podés retirar en local sin costo.',
    },
  ];
  return (
    <div className="vc-wrap">
      <section className="vc-section" id="como-comprar">
        <div className="vc-section__head">
          <div>
            <Eyebrow tone="ink">Compra simple</Eyebrow>
            <h2>¿Cómo comprar?</h2>
          </div>
        </div>
        <div className="vc-howto">
          {steps.map(s => (
            <Card key={s.n} variant="surface" padding="lg">
              <div className="vc-howto__n">{s.n}</div>
              <div className="vc-howto__title">{s.title}</div>
              <p>{s.body}</p>
            </Card>
          ))}
        </div>
        <div className="vc-howto__wa">
          <Button size="lg"
            onClick={() => window.open('https://wa.me/5491100000000?text=Hola!%20Quiero%20hacer%20un%20pedido', '_blank')}
            iconRight={<I.ArrowRight size={18} />}>
            Hablar por WhatsApp
          </Button>
          <span style={{ fontSize: 14, color: 'var(--ink-500)' }}>Respondemos en minutos</span>
        </div>
      </section>
    </div>
  );
}

const BRAND_BENEFITS = [
  ['Zap',      'Más rendimiento',      'Formulaciones pensadas para potenciar tu energía, foco y recuperación en cada rutina.'],
  ['Leaf',     'Ingredientes limpios', 'Sin excipientes, colorantes ni rellenos. Solo lo que figura en la etiqueta y nada más.'],
  ['Shield',   'Pureza verificada',    'Insumos de primer nivel con análisis de calidad en cada lote. Cero compromisos.'],
];

function Home({ onNav, onAdd, onOpen }) {
  injectPages();
  const benefits = BRAND_BENEFITS;
  const featured = D.products.filter(p => p.featured).slice(0, 4);
  return (
    <main>
      <HeroBanner onNav={onNav} />

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
            <div><Eyebrow tone="ink">Destacados</Eyebrow><h2>Lo esencial</h2></div>
            <Button variant="ghost" onClick={() => onNav('shop')} iconRight={<I.ArrowRight size={16} />}>
              Ver todo
            </Button>
          </div>
          <div className="vc-grid">
            {featured.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen} onAdd={onAdd} />)}
          </div>
        </section>
      </div>

      {false && <VolumeTiers />}

      <div className="vc-wrap" style={{ marginBottom: 0 }}>
        <div className="vc-band">
          <div>
            <Eyebrow tone="onDark">Nuestra misión</Eyebrow>
            <h2>Democratizar el bienestar y el <em>rendimiento.</em></h2>
          </div>
          <p>No diseñamos solo para atletas de élite. Vcore es para quienes corren hacia su trabajo, entrenan por salud o buscan energía para superar su día a día.</p>
        </div>
      </div>

      <HowToBuy />
    </main>
  );
}

function Shop({ onAdd, onOpen }) {
  injectPages();
  const [cat, setCat] = useState('Todo');
  const [q, setQ] = useState('');

  const filtered = D.products.filter(p => {
    const matchCat = cat === 'Todo' || p.category === cat;
    const matchQ = !q || [p.name, p.sub, p.category || ''].some(t =>
      t.toLowerCase().includes(q.toLowerCase())
    );
    return matchCat && matchQ;
  });

  const cols = filtered.length <= 2 ? 'vc-grid--2' : filtered.length <= 3 ? 'vc-grid--3' : '';

  return (
    <main className="vc-wrap">
      <section className="vc-section" style={{ paddingBottom: 24 }}>
        <Eyebrow tone="ink">Tienda</Eyebrow>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44,
          letterSpacing: '-.03em', margin: '12px 0 22px' }}>
          Suplementación simple
        </h2>
        <div className="vc-shop-search">
          <I.Search size={16} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar producto..."
            aria-label="Buscar"
          />
        </div>
        <div className="vc-cats">
          {D.categories.map(c => (
            <Tag key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Tag>
          ))}
        </div>
      </section>
      <section style={{ paddingBottom: 56 }}>
        {filtered.length === 0 ? (
          <div className="vc-empty">
            <I.Search size={40} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>
              Sin resultados
            </div>
            <div style={{ fontSize: 14 }}>Probá con otra búsqueda o categoría.</div>
          </div>
        ) : (
          <div className={`vc-grid ${cols}`}>
            {filtered.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen} onAdd={onAdd} />)}
          </div>
        )}
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

  useEffect(() => { setSize(p.sizes[0]); setQty(1); }, [p.id]);

  return (
    <main className="vc-wrap">
      <section className="vc-pdp">
        <div style={{ position: 'sticky', top: 90 }}>
          <ProductImage product={p} />
        </div>
        <div>
          <Eyebrow>{p.category || 'Suplemento'}</Eyebrow>
          <div className="vc-pdp__name">{p.name}</div>
          <div className="vc-pdp__sub">{p.sub}</div>
          <Rating r={p.rating} n={p.reviews} />
          <p className="vc-pdp__blurb">{p.blurb}</p>
          <p className="vc-pdp__price">{D.fmt(D.priceFor(p, size))}</p>

          <div style={{ marginTop: 22, marginBottom: 6, fontWeight: 700, fontSize: 13.5, color: 'var(--ink-700)' }}>
            Presentación
          </div>
          <div className="vc-opt">
            {p.sizes.map(s => (
              <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>
                {s}
                {D.hasPriceRange(p) && <span className="vc-opt__price">{D.fmt(D.priceFor(p, s))}</span>}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="vc-qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><I.Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}><I.Plus size={16} /></button>
            </div>
            <Button size="lg" onClick={() => onAdd(p, qty, size)} iconRight={<I.Bag size={18} />}>
              Agregar al carrito
            </Button>
          </div>

          {stats && (
            <div className="vc-rings">
              {stats.map((s, i) => (
                <StatRing key={i} value={s.value} label={s.label} size={92}
                  variant={i === 1 ? 'soft' : i === 2 ? 'filled' : 'outline'} />
              ))}
            </div>
          )}

          <div className="vc-pdp__stats">
            <span className="vc-pdp__stat"><I.Truck size={18} /> Envío gratis desde $50.000</span>
            <span className="vc-pdp__stat"><I.Shield size={18} /> Pureza certificada</span>
            <span className="vc-pdp__stat"><I.Leaf size={18} /> Sin aditivos</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function SearchOverlay({ open, onClose, onOpen }) {
  injectPages();
  const [q, setQ] = useState('');

  useEffect(() => { if (!open) setQ(''); }, [open]);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const results = q.length > 1
    ? D.products.filter(p =>
        [p.name, p.sub, p.category || ''].some(t =>
          t.toLowerCase().includes(q.toLowerCase())
        )
      )
    : [];

  return (
    <>
      <div className={`vc-search-ov${open ? ' open' : ''}`} onClick={onClose} />
      {open && (
        <div className="vc-search-box">
          <div className="vc-search-box__inp">
            <I.Search size={20} />
            <input
              autoFocus
              placeholder="Buscar suplementos…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <hr className="vc-search-sep" />
          <div className="vc-search-results">
            {results.length === 0 && q.length > 1 && (
              <div className="vc-search-empty">Sin resultados para "{q}".</div>
            )}
            {results.length === 0 && q.length <= 1 && (
              <div className="vc-search-empty">Escribí para buscar en el catálogo.</div>
            )}
            {results.map(p => (
              <div key={p.id} className="vc-sres" onClick={() => { onOpen(p); onClose(); }}>
                <div className="vc-sres__img"><ProductImage product={p} /></div>
                <div>
                  <div className="vc-sres__name">{p.name}</div>
                  <div className="vc-sres__cat">{p.category} · {p.sub}</div>
                </div>
                <span className="vc-sres__price">{D.fmt(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AboutPage() {
  injectPages();
  const values = [
    { icon: 'Shield', title: 'Pureza sin concesiones',
      desc: 'Usamos solo materias primas de primer nivel. Cada lote es analizado antes de llegar a tu casa. Sin rellenos, sin aditivos, sin mentiras en la etiqueta.' },
    { icon: 'Leaf', title: 'Formulaciones limpias',
      desc: 'Nada que no necesites. Cada producto tiene un objetivo claro y los ingredientes exactos para lograrlo. Ni más ni menos.' },
    { icon: 'Zap', title: 'Accesible de verdad',
      desc: 'Creemos que la suplementación de calidad no debería ser un privilegio. Por eso trabajamos directo con distribuidores y eliminamos intermediarios.' },
  ];
  return (
    <main>
      {/* Hero */}
      <div style={{ background: 'var(--gradient-ink-bloom)', position: 'relative', isolation: 'isolate', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--vignette)', pointerEvents: 'none' }} />
        <div className="vc-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="vc-about-hero" style={{ paddingTop: 80, paddingBottom: 88, maxWidth: 640, color: '#EAF0EC' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>Quiénes somos</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(40px,5vw,70px)',
              letterSpacing: '-.03em', lineHeight: .97, margin: '0 0 26px' }}>
              Nutrición funcional<br />
              <em style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--green-400)' }}>para la vida real.</em>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,.7)', margin: 0, maxWidth: 520 }}>
              Vcore nació de una pregunta simple: ¿por qué es tan difícil encontrar suplementos de calidad,
              sin letra chica y a un precio honesto? Decidimos hacer algo al respecto.
            </p>
          </div>
        </div>
      </div>

      {/* Origin story */}
      <div className="vc-wrap">
        <section className="vc-section">
          <div className="vc-about-story">
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
                color: 'var(--ink-400)', marginBottom: 16 }}>Nuestra historia</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38,
                letterSpacing: '-.025em', lineHeight: 1.05, margin: '0 0 22px' }}>
                Empezamos como <em style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--green-700)' }}>clientes frustrados</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: '0 0 20px' }}>
                Entrenamos, leemos etiquetas y nos cansamos de pagar por productos llenos de excipientes,
                colorantes y promesas infladas. Así que armamos Vcore desde cero: primero para nosotros,
                después para todos.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-700)', margin: 0 }}>
                Trabajamos con laboratorios que priorizan la biodisponibilidad real sobre el marketing.
                Publicamos los análisis. No te contamos un cuento.
              </p>
            </div>
            <div className="vc-about-mark">
              <div className="vc-about-mark__vignette" />
              <img className="vc-about-mark__logo"
                src={(window.__VCORE_ASSET_BASE__ || '/assets/') + 'vcore-isotipo-grad-mint.png'} alt="Vcore" />
              <div className="vc-about-mark__tag">Desde 2026 · Argentina</div>
            </div>
          </div>
        </section>
      </div>

      {/* Values */}
      <div style={{ background: 'var(--paper-100)' }}>
        <div className="vc-wrap">
          <section className="vc-section">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
                color: 'var(--ink-400)', marginBottom: 14 }}>Lo que nos mueve</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38,
                letterSpacing: '-.025em', margin: '0 auto', maxWidth: 520, lineHeight: 1.1 }}>
                Tres principios que no negociamos
              </h2>
            </div>
            <div className="vc-ben">
              {values.map(v => {
                const Ic = I[v.icon];
                return (
                  <div key={v.title} style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)',
                    padding: '28px 26px', border: '1px solid var(--paper-200)' }}>
                    <div className="vc-ben__icon"><Ic size={22} /></div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21,
                      letterSpacing: '-.01em', margin: '0 0 10px' }}>{v.title}</h3>
                    <p style={{ fontSize: 14.5, color: 'var(--ink-700)', margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Mission band */}
      <div className="vc-wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div className="vc-band">
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.45)', marginBottom: 14 }}>Nuestra misión</div>
            <h2>Democratizar el bienestar<br />y el <em>rendimiento.</em></h2>
          </div>
          <div>
            <p style={{ marginBottom: 20 }}>
              No diseñamos solo para atletas de élite. Vcore es para quienes corren hacia su trabajo,
              entrenan por salud o buscan energía para superar su día a día.
            </p>
            <p>
              Si cubrís los básicos de tu nutrición con productos honestos y bien formulados,
              el resto lo pone tu constancia. Ahí es donde entramos nosotros.
            </p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="vc-wrap" style={{ paddingBottom: 80 }}>
        <div className="vc-about-cta" style={{ display: 'flex', alignItems: 'center', gap: 32, background: 'var(--surface-card)',
          border: '1px solid var(--paper-200)', borderRadius: 'var(--radius-xl)', padding: '32px 40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              color: 'var(--ink-400)', marginBottom: 10 }}>Contacto</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
              letterSpacing: '-.02em', margin: '0 0 10px' }}>¿Tenés preguntas?</h3>
            <p style={{ fontSize: 15, color: 'var(--ink-600)', margin: 0 }}>
              Escribinos por WhatsApp — respondemos en minutos.
            </p>
          </div>
          <Button size="lg"
            onClick={() => window.open('https://wa.me/5491100000000?text=Hola!%20Tengo%20una%20consulta', '_blank')}
            iconRight={<I.ArrowRight size={18} />}>
            Escribinos
          </Button>
        </div>
      </div>
    </main>
  );
}

function AdminPage() {
  injectPages();
  const [pw, setPw] = useState('');
  const [auth, setAuth] = useState(() => sessionStorage.getItem('vc-admin') === '1');
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('vc-orders') || '[]'));

  function login() {
    if (pw === 'vcore2026') {
      sessionStorage.setItem('vc-admin', '1');
      setAuth(true);
    }
  }
  function logout() { sessionStorage.removeItem('vc-admin'); setAuth(false); }
  function deleteOrder(i) {
    const next = orders.filter((_, idx) => idx !== i);
    setOrders(next);
    localStorage.setItem('vc-orders', JSON.stringify(next));
  }

  if (!auth) {
    return (
      <div className="vc-admin">
        <div className="vc-admin__login">
          <Eyebrow tone="ink">Panel de administración</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
            letterSpacing: '-.02em', margin: '16px 0 24px' }}>
            Ingresar
          </h2>
          <div className="vc-admin__login-row">
            <input
              type="password"
              placeholder="Contraseña"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            <Button onClick={login}>Entrar</Button>
          </div>
          <div className="vc-admin__hint">Demo: contraseña vcore2026</div>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="vc-admin">
      <div className="vc-admin__hd">
        <div>
          <Eyebrow tone="ink">Panel</Eyebrow>
          <div className="vc-admin__title">Administración</div>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>Cerrar sesión</Button>
      </div>

      <div className="vc-admin__stats">
        <div className="vc-admin__stat">
          <h4>Pedidos</h4>
          <div className="v">{orders.length}</div>
        </div>
        <div className="vc-admin__stat">
          <h4>Ingresos totales</h4>
          <div className="v">{D.fmt(totalRevenue)}</div>
        </div>
        <div className="vc-admin__stat">
          <h4>Ticket promedio</h4>
          <div className="v">{orders.length ? D.fmt(Math.round(totalRevenue / orders.length)) : '—'}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="vc-empty" style={{ borderTop: '1px solid var(--paper-200)', paddingTop: 48 }}>
          <I.Bag size={38} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>
            Sin pedidos aún
          </div>
          <div style={{ fontSize: 14 }}>
            Los pedidos aparecen aquí cuando se finalizan por WhatsApp.
          </div>
        </div>
      ) : (
        <table className="vc-orders">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Resumen</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...orders].reverse().map((o, i) => {
              const realIdx = orders.length - 1 - i;
              return (
                <tr key={i}>
                  <td><span className="vc-orders__num">#{orders.length - i}</span></td>
                  <td style={{ color: 'var(--ink-500)', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(o.date).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ maxWidth: 320, fontSize: 13, color: 'var(--ink-600)' }}>{o.summary}</td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {D.fmt(o.total)}
                  </td>
                  <td>
                    <span className="vc-orders__status vc-orders__status--pending">Pendiente</span>
                  </td>
                  <td>
                    <button className="vc-orders__del" onClick={() => deleteOrder(realIdx)}
                      aria-label="Eliminar pedido">
                      <I.Minus size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

Object.assign(window, {
  VcoreHome: Home,
  VcoreShop: Shop,
  VcoreProduct: Product,
  VcoreProductCard: ProductCard,
  VcoreSearchOverlay: SearchOverlay,
  VcoreAboutPage: AboutPage,
  /* VcoreAdminPage is set by admin.jsx which loads after */
});
