/* Vcore website — Admin panel: login, dashboard, products, orders, codes, config. */
const React = window.React;
const { useState, useEffect, useRef } = React;
const D = window.VcoreData;

/* ─── helpers ─────────────────────────────────────────── */
const fmt = n => '$' + Math.round(n).toLocaleString('es-CL');

function uid() { return 'VC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }

/* Resize + compress an image File into a data URL that fits comfortably in localStorage. */
function fileToDataUrl(file, maxW = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';          // avoid black bg if source has transparency
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  function set(next) {
    const v = typeof next === 'function' ? next(val) : next;
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); }
    catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
        alert('No se pudo guardar: el almacenamiento local está lleno. Probá con imágenes más livianas o menos productos con foto.');
      }
    }
  }
  return [val, set];
}

/* ¿Hay backend (Supabase) configurado? */
function backendOn() { return !!(window.VcoreBackend && window.VcoreBackend.isOn()); }
const BE = () => window.VcoreBackend;
function readLS(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

/* ─── CSS ──────────────────────────────────────────────── */
const ADMIN_CSS = `
/* shell */
.adm-shell { display: flex; min-height: 100vh; color: var(--ink-900); }
.adm-side { width: 230px; flex: none; position: sticky; top: 0; height: 100vh; overflow-y: auto;
  background: var(--gradient-ink-bloom); display: flex; flex-direction: column; isolation: isolate; }
.adm-side::before { content:""; position:absolute; inset:0; background:var(--vignette-soft); pointer-events:none; z-index:0; }
.adm-side > * { position: relative; z-index: 1; }
.adm-side__logo { padding: 22px 22px 18px; border-bottom: 1px solid rgba(255,255,255,.1); }
.adm-side__logo span { font-family: var(--font-display); font-weight: 800; font-size: 11px;
  letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.4); display: block; margin-top: 6px; }
.adm-nav { padding: 14px 12px; flex: 1; }
.adm-nav__item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px;
  border-radius: var(--radius-md); border: 0; background: transparent; color: rgba(255,255,255,.6);
  font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; text-align: left;
  transition: background .15s, color .15s; margin-bottom: 3px; }
.adm-nav__item:hover { background: rgba(255,255,255,.08); color: #fff; }
.adm-nav__item.on { background: rgba(255,255,255,.12); color: #fff; }
.adm-nav__item.on svg { color: var(--green-400); }
.adm-side__out { padding: 14px 12px 22px; border-top: 1px solid rgba(255,255,255,.1); }
.adm-side__out button { width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,.18);
  background: transparent; color: rgba(255,255,255,.55); font-family: var(--font-body); font-size: 13px;
  font-weight: 600; cursor: pointer; transition: background .15s, color .15s; }
.adm-side__out button:hover { background: rgba(255,255,255,.08); color: #fff; }

/* main */
.adm-main { flex: 1; min-width: 0; padding: 36px 40px 80px; background: var(--surface-page); }
.adm-head { margin-bottom: 30px; }
.adm-head h1 { font-family: var(--font-display); font-weight: 800; font-size: 34px;
  letter-spacing: -.025em; margin: 6px 0 0; }
.adm-eye { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
  color: var(--ink-400); }

/* stat grid */
.adm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.adm-stat { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-lg); padding: 20px 22px; }
.adm-stat h4 { font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
  color: var(--ink-500); margin: 0 0 10px; font-weight: 800; }
.adm-stat .sv { font-family: var(--font-display); font-weight: 800; font-size: 30px; margin: 0; line-height: 1.1; }
.adm-stat__den { font-size: 16px; color: var(--ink-400); font-weight: 700; margin-left: 2px; }
.adm-stat__desc { font-size: 12.5px; color: var(--ink-500); margin: 8px 0 0; }

/* panel */
.adm-panel { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 24px; }
.adm-panel__hd { display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid var(--border-default); }
.adm-panel__hd h3 { font-family: var(--font-display); font-weight: 800; font-size: 17px;
  letter-spacing: -.01em; margin: 0; }
.adm-panel__body { padding: 0; }

/* table */
.adm-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.adm-tbl th { text-align: left; padding: 11px 16px; font-size: 11px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-500); border-bottom: 1px solid var(--border-default); font-weight: 800; }
.adm-tbl td { padding: 13px 16px; border-bottom: 1px solid var(--paper-100); vertical-align: middle; }
.adm-tbl tr:last-child td { border-bottom: none; }
.adm-tbl tr:hover td { background: var(--paper-050); }

/* switch */
.adm-sw { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.adm-sw__track { width: 36px; height: 20px; border-radius: 10px; background: var(--paper-300);
  position: relative; transition: background .2s; flex: none; }
.adm-sw.on .adm-sw__track { background: var(--green-500); }
.adm-sw__thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
  border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.adm-sw.on .adm-sw__thumb { transform: translateX(16px); }

/* status chips */
.adm-chip { display: inline-flex; align-items: center; font-size: 11.5px; font-weight: 800;
  padding: 3px 10px; border-radius: var(--radius-pill); }
.adm-chip--nuevo { background: #E8F4FF; color: #1A5FA0; }
.adm-chip--confirmado { background: var(--green-100); color: var(--green-700); }
.adm-chip--enviado { background: #FBF0E0; color: #8A5E1A; }
.adm-chip--entregado { background: #E6F5E9; color: #1A6B35; }

/* action buttons */
.adm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px;
  font-weight: 700; cursor: pointer; border: 0; transition: background .15s; }
.adm-btn--primary { background: var(--green-500); color: #fff; }
.adm-btn--primary:hover { background: var(--green-600); }
.adm-btn--outline { background: transparent; border: 1.5px solid var(--border-default); color: var(--ink-800); }
.adm-btn--outline:hover { border-color: var(--green-500); color: var(--text-brand); }
.adm-btn--ghost { background: transparent; color: var(--ink-600); }
.adm-btn--ghost:hover { background: var(--paper-100); color: var(--ink-900); }
.adm-btn--danger { background: transparent; border: 1.5px solid #D32F2F44; color: #B71C1C; }
.adm-btn--danger:hover { background: #FFEBEE; }
.adm-btn--sm { padding: 5px 10px; font-size: 12px; }

/* search */
.adm-search { position: relative; max-width: 280px; }
.adm-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-400); pointer-events: none; }
.adm-search input { width: 100%; height: 38px; padding: 0 12px 0 32px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); font-size: 13.5px; color: var(--ink-900);
  font-family: var(--font-body); outline: none; box-sizing: border-box; }
.adm-search input:focus { border-color: var(--green-500); }

/* modal */
.adm-modal-ov { position: fixed; inset: 0; background: rgba(10,20,18,.55);
  backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: flex-start;
  justify-content: center; padding: 48px 16px; overflow-y: auto; }
.adm-modal { background: var(--paper-050); border-radius: var(--radius-xl);
  width: min(600px, 100%); box-shadow: var(--shadow-xl); flex: none; }
.adm-modal__hd { display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--border-default); }
.adm-modal__hd h3 { font-family: var(--font-display); font-weight: 800; font-size: 20px;
  letter-spacing: -.01em; margin: 0; }
.adm-modal__body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.adm-modal__ft { padding: 16px 24px; border-top: 1px solid var(--border-default);
  display: flex; justify-content: flex-end; gap: 10px; }
.adm-close { width: 32px; height: 32px; border-radius: 50%; border: 0;
  background: var(--paper-100); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.adm-close:hover { background: var(--paper-200); }

/* form fields */
.adm-field { display: flex; flex-direction: column; gap: 6px; }
.adm-field label { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ink-500); }
.adm-field input, .adm-field textarea, .adm-field select {
  width: 100%; padding: 9px 12px; border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 14px;
  color: var(--ink-900); background: var(--surface-card); outline: none; box-sizing: border-box; }
.adm-field input:focus, .adm-field textarea:focus, .adm-field select:focus { border-color: var(--green-500); }
.adm-field textarea { resize: vertical; min-height: 80px; }
.adm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* image uploader */
.adm-img-edit { display: flex; gap: 16px; align-items: stretch; }
.adm-img-preview { width: 110px; height: 132px; flex: none; border-radius: var(--radius-md);
  overflow: hidden; border: 1.5px solid var(--border-default); background: var(--paper-100);
  display: flex; align-items: center; justify-content: center; }
.adm-img-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.adm-img-ph { font-size: 11px; font-weight: 700; color: var(--ink-400); text-align: center;
  line-height: 1.5; padding: 0 8px; }
.adm-img-ph span { font-weight: 500; font-size: 10.5px; color: var(--ink-300); }
.adm-img-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; justify-content: center; }
.adm-img-hint { font-size: 11px; color: var(--ink-400); }

/* disabled buttons */
.adm-btn:disabled { opacity: .55; cursor: not-allowed; }

/* variant editor */
.adm-var-list { display: flex; flex-direction: column; gap: 8px; }
.adm-var-head { display: grid; grid-template-columns: 1fr 130px 36px; gap: 10px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-400); padding: 0 2px; }
.adm-var-row { display: grid; grid-template-columns: 1fr 130px 36px; gap: 10px; align-items: center; }
.adm-var-row input { width: 100%; padding: 8px 11px; border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13.5px;
  color: var(--ink-900); background: var(--surface-card); outline: none; box-sizing: border-box; }
.adm-var-row input:focus { border-color: var(--green-500); }
.adm-var-del { width: 36px; height: 36px; border-radius: var(--radius-md); border: 1.5px solid var(--border-default);
  background: transparent; color: var(--ink-500); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.adm-var-del:hover:not(:disabled) { border-color: #D32F2F44; color: #B71C1C; background: #FFEBEE; }
.adm-var-del:disabled { opacity: .4; cursor: not-allowed; }
.adm-var-add { margin-top: 10px; align-self: flex-start; }

/* product thumbnail in table */
.adm-thumb { width: 42px; height: 50px; flex: none; border-radius: var(--radius-sm); overflow: hidden;
  background: var(--gradient-sage-bloom); display: flex; align-items: center; justify-content: center; }
.adm-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.adm-thumb__v { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--green-600); }

/* login */
.adm-login { min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--surface-page); color: var(--ink-900); }
.adm-login__box h2 { color: var(--ink-900); }
.adm-login__box { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-xl); padding: 44px 40px; width: min(380px, 90vw); }
.adm-login__box h2 { font-family: var(--font-display); font-weight: 800; font-size: 28px;
  letter-spacing: -.02em; margin: 16px 0 28px; }
.adm-login__row { display: flex; gap: 10px; }
.adm-login__inp { flex: 1; height: 44px; padding: 0 14px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-page); font-family: var(--font-body); font-size: 14px;
  color: var(--ink-900); outline: none; }
.adm-login__inp:focus { border-color: var(--green-500); }
.adm-login__hint { font-size: 12px; color: var(--ink-400); margin-top: 10px; }
.adm-login__err { font-size: 12.5px; color: #B71C1C; margin-top: 10px; font-weight: 700; }

/* order detail */
.adm-order-detail { padding: 0 24px 24px; }
.adm-order-detail h4 { font-family: var(--font-display); font-weight: 800; font-size: 15px;
  margin: 20px 0 10px; color: var(--ink-700); }
.adm-order-summary { font-size: 13.5px; line-height: 1.6; }
.adm-order-items { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
.adm-order-items th { text-align: left; font-size: 11px; letter-spacing:.1em; text-transform:uppercase;
  color: var(--ink-400); padding: 6px 8px; font-weight: 800; border-bottom: 1px solid var(--paper-200); }
.adm-order-items td { padding: 8px 8px; border-bottom: 1px solid var(--paper-100); }
.adm-status-sel { display: flex; gap: 8px; flex-wrap: wrap; }
.adm-status-opt { padding: 6px 14px; border-radius: var(--radius-pill); border: 1.5px solid var(--border-default);
  font-size: 12.5px; font-weight: 700; cursor: pointer; background: var(--surface-card); color: var(--ink-700);
  transition: all .15s; }
.adm-status-opt.on { border-color: var(--green-500); background: var(--green-050); color: var(--green-800); }

/* quick links */
.adm-quick { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
.adm-quick a, .adm-quick button { display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 16px; border-radius: var(--radius-md); font-size: 13.5px; font-weight: 700;
  background: var(--surface-card); border: 1px solid var(--border-default);
  color: var(--ink-800); cursor: pointer; text-decoration: none; transition: border-color .15s, color .15s; }
.adm-quick a:hover, .adm-quick button:hover { border-color: var(--green-500); color: var(--text-brand); }

/* empty state */
.adm-empty { padding: 48px 24px; text-align: center; color: var(--ink-400); }
.adm-empty svg { opacity: .3; margin-bottom: 14px; display: block; margin-inline: auto; }

/* filter bar */
.adm-bar { display: flex; align-items: center; gap: 10px; padding: 14px 20px;
  border-bottom: 1px solid var(--border-default); flex-wrap: wrap; }

/* ───────── Mobile admin ───────── */
@media (max-width: 860px) {
  .adm-shell { flex-direction: column; }
  .adm-side { width: 100%; height: auto; position: sticky; top: 0; z-index: 30;
    flex-direction: row; align-items: center; flex-wrap: nowrap; }
  .adm-side__logo { border-bottom: 0; border-right: 1px solid rgba(255,255,255,.1);
    padding: 12px 14px; flex: none; }
  .adm-side__logo span { display: none; }
  .adm-nav { display: flex; flex-direction: row; gap: 4px; padding: 8px 10px; flex: 1;
    overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .adm-nav__item { white-space: nowrap; margin-bottom: 0; padding: 9px 13px; }
  .adm-side__out { border-top: 0; padding: 8px 10px; flex: none; }
  .adm-side__out button { padding: 9px 12px; white-space: nowrap; }

  .adm-main { padding: 22px 16px 64px; }
  .adm-head h1 { font-size: 26px; }
  .adm-stats { grid-template-columns: 1fr 1fr; gap: 12px; }
  .adm-stat .sv { font-size: 24px; }

  /* tables scroll horizontally inside their panel */
  .adm-panel { overflow-x: auto; }
  .adm-tbl { min-width: 580px; }
  .adm-bar { flex-wrap: nowrap; overflow-x: auto; }

  /* modals near full-screen */
  .adm-modal-ov { padding: 0; align-items: stretch; }
  .adm-modal { width: 100%; min-height: 100vh; border-radius: 0; }
  .adm-field-row { grid-template-columns: 1fr; }
  .adm-var-row, .adm-var-head { grid-template-columns: 1fr 96px 36px; gap: 8px; }
  .adm-img-edit { flex-direction: column; }
  .adm-img-actions { flex-direction: row; flex-wrap: wrap; align-items: center; }

  /* order detail / status */
  .adm-order-items { min-width: 0; }
}
`;

function injectAdmin() {
  if (!document.getElementById('vc-admin-css')) {
    const el = document.createElement('style');
    el.id = 'vc-admin-css';
    el.textContent = ADMIN_CSS;
    document.head.appendChild(el);
  }
}

/* ─── SVG Icons (inline, no dep) ───────────────────────── */
function Ico({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}
const IcoGrid = ({ size }) => <Ico size={size} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} />;
const IcoBox  = ({ size }) => <Ico size={size} d={<><path d="M21 16V8a2 2 0 00-1-1.73L13 2.27a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>} />;
const IcoCart = ({ size }) => <Ico size={size} d={<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></>} />;
const IcoTag  = ({ size }) => <Ico size={size} d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>} />;
const IcoCog  = ({ size }) => <Ico size={size} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>} />;
const IcoSearch = ({ size }) => <Ico size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoPlus   = ({ size }) => <Ico size={size} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoTrash  = ({ size }) => <Ico size={size} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>} />;
const IcoEdit   = ({ size }) => <Ico size={size} d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcoClose  = ({ size }) => <Ico size={size} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoPrint  = ({ size }) => <Ico size={size} d={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>} />;
const IcoDown   = ({ size }) => <Ico size={size} d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />;
const IcoWA     = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ─── Switch ────────────────────────────────────────────── */
function Switch({ on, onChange, label }) {
  return (
    <div className={`adm-sw${on ? ' on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange(!on)}>
      <div className="adm-sw__track"><div className="adm-sw__thumb" /></div>
      {label && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>{label}</span>}
    </div>
  );
}

/* ─── Login ─────────────────────────────────────────────── */
function AdminLogin({ onAuth }) {
  injectAdmin();
  const secure = backendOn();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setErr('');
    if (secure) {
      if (!email.trim() || !pw) { setErr('Completá email y contraseña'); return; }
      setBusy(true);
      try {
        await BE().login(email.trim(), pw);
        onAuth();
      } catch (e) {
        setErr('Email o contraseña incorrectos');
      } finally { setBusy(false); }
    } else {
      if (pw === 'vcore2026') { sessionStorage.setItem('vc-admin', '1'); onAuth(); }
      else setErr('Contraseña incorrecta');
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login__box">
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
          color: 'var(--text-brand)' }}>Panel de administración</div>
        <h2>Ingresar</h2>
        {secure && (
          <input className="adm-login__inp" type="email" placeholder="Email" autoComplete="username"
            value={email} onChange={e => { setEmail(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()} autoFocus
            style={{ width: '100%', marginBottom: 10 }} />
        )}
        <div className="adm-login__row">
          <input className="adm-login__inp" type="password" placeholder="Contraseña" autoComplete="current-password"
            value={pw} onChange={e => { setPw(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()} autoFocus={!secure} />
          <button className="adm-btn adm-btn--primary" onClick={submit} disabled={busy}>
            {busy ? '...' : 'Entrar'}
          </button>
        </div>
        {err && <div className="adm-login__err">{err}</div>}
        {!secure && <div className="adm-login__hint">Modo demo · Contraseña: vcore2026</div>}
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */
function AdminDashboard({ orders, products, onNav }) {
  const total    = orders.reduce((s, o) => s + (o.total || 0), 0);
  const nuevos   = orders.filter(o => o.status === 'nuevo').length;
  const recent   = [...orders].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5);
  const visibles = products.filter(p => p.visible !== false).length;
  const featured = products.filter(p => p.featured && p.visible !== false).length;

  const STATUS_COLORS = { nuevo: 'adm-chip--nuevo', confirmado: 'adm-chip--confirmado',
    enviado: 'adm-chip--enviado', entregado: 'adm-chip--entregado' };

  const cards = [
    { l: 'Productos',       v: visibles,                        d: 'En el catálogo activo' },
    { l: 'Destacados',      v: <>{featured}<span className="adm-stat__den">/{visibles}</span></>, d: 'Visibles en home' },
    { l: 'Pedidos',         v: orders.length,                   d: 'Histórico total' },
    { l: 'Facturación est.',v: fmt(total),                      d: 'Suma de pedidos recibidos' },
  ];

  return (
    <div>
      <div className="adm-head">
        <div className="adm-eye">Panel</div>
        <h1>Dashboard</h1>
      </div>

      <div className="adm-stats">
        {cards.map(s => (
          <div key={s.l} className="adm-stat">
            <h4>{s.l}</h4>
            <p className="sv">{s.v}</p>
            <p className="adm-stat__desc">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="adm-panel">
        <div className="adm-panel__hd">
          <h3>Pedidos recientes</h3>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onNav('orders')}>
            Ver todos
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="adm-empty">
            <IcoCart size={36} />
            <div>Sin pedidos aún. Los pedidos se generan desde el carrito por WhatsApp.</div>
          </div>
        ) : (
          <table className="adm-tbl">
            <thead><tr>
              <th>#</th><th>Fecha</th><th>Resumen</th><th>Total</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {recent.map((o, i) => (
                <tr key={o.id || i}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                    {o.id || `#${orders.length - i}`}
                  </td>
                  <td style={{ color: 'var(--ink-500)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {new Date(o.date).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ink-600)', maxWidth: 240 }}>{o.summary}</td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{fmt(o.total)}</td>
                  <td><span className={`adm-chip ${STATUS_COLORS[o.status] || 'adm-chip--nuevo'}`}>{o.status || 'nuevo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="adm-quick">
        {nuevos > 0 && (
          <button onClick={() => onNav('orders')}>
            <IcoCart size={15} /> {nuevos} pedido{nuevos > 1 ? 's' : ''} nuevo{nuevos > 1 ? 's' : ''}
          </button>
        )}
        <button onClick={() => onNav('products')}><IcoBox size={15} /> Gestionar productos</button>
        <button onClick={() => onNav('codes')}><IcoTag size={15} /> Códigos de descuento</button>
        <button onClick={() => onNav('config')}><IcoCog size={15} /> Configuración</button>
      </div>
    </div>
  );
}

/* ─── Products ──────────────────────────────────────────── */
function emptyProduct() {
  return { id: '', name: '', sub: '', category: D.categories[1] || 'Bienestar',
    badge: '', blurb: '', tone: 'green', photo: '',
    visible: true, featured: false, rating: 4.8, reviews: 0 };
}

/* Deriva las filas de variantes (presentación + precio) desde un producto,
   sea nuevo (variants), legacy (sizes + price) o vacío. */
function productToVariants(p) {
  if (p && Array.isArray(p.variants) && p.variants.length) {
    return p.variants.map(v => ({ label: v.label || '', price: v.price != null ? v.price : 0 }));
  }
  if (p && p.sizes && p.sizes.length) {
    return p.sizes.map(label => ({ label, price: p.price != null ? p.price : 0 }));
  }
  return [{ label: '', price: 0 }];
}

function ProductEditor({ product, onSave, onClose }) {
  const [p, setP] = useState(product ? { ...product } : emptyProduct());
  const [variants, setVariants] = useState(() => productToVariants(product));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  function f(k) { return e => setP(v => ({ ...v, [k]: e.target.value })); }

  function setVariant(i, key, value) {
    setVariants(vs => vs.map((v, idx) => idx === i ? { ...v, [key]: value } : v));
  }
  function addVariant() { setVariants(vs => [...vs, { label: '', price: 0 }]); }
  function removeVariant(i) { setVariants(vs => vs.length > 1 ? vs.filter((_, idx) => idx !== i) : vs); }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      let url;
      if (backendOn() && BE().cloudinaryOn()) {
        url = await BE().uploadImage(file);          // sube a Cloudinary, guarda la URL
      } else {
        url = await fileToDataUrl(file);             // modo demo: data URL local
      }
      setP(v => ({ ...v, photo: url }));
    } catch (err) {
      alert('No se pudo subir la imagen: ' + (err.message || 'probá con otro archivo.'));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  function save() {
    if (!p.name.trim()) { alert('El producto necesita un nombre.'); return; }
    const clean = variants
      .map(v => ({ label: String(v.label).trim(), price: parseFloat(v.price) || 0 }))
      .filter(v => v.label);
    if (!clean.length) { alert('Agregá al menos una presentación con su precio.'); return; }
    const minPrice = Math.min(...clean.map(v => v.price));
    onSave({
      ...p,
      variants: clean,
      sizes: clean.map(v => v.label),
      price: minPrice,
      rating: Math.min(5, Math.max(0, parseFloat(p.rating) || 0)),
      reviews: parseInt(p.reviews, 10) || 0,
      id: p.id || p.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    });
  }

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal__hd">
          <h3>{product ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">

          {/* Imagen */}
          <div className="adm-field">
            <label>Imagen del producto</label>
            <div className="adm-img-edit">
              <div className="adm-img-preview">
                {p.photo
                  ? <img src={p.photo} alt="Vista previa" />
                  : <div className="adm-img-ph">Sin imagen<br/><span>se usa el tile de marca</span></div>}
              </div>
              <div className="adm-img-actions">
                <button type="button" className="adm-btn adm-btn--outline adm-btn--sm"
                  onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
                  <IcoDown size={13} /> {busy ? 'Procesando…' : 'Subir imagen'}
                </button>
                {p.photo && (
                  <button type="button" className="adm-btn adm-btn--danger adm-btn--sm"
                    onClick={() => setP(v => ({ ...v, photo: '' }))}>
                    <IcoTrash size={13} /> Quitar
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                <span className="adm-img-hint">JPG o PNG. Se optimiza automáticamente.</span>
              </div>
            </div>
            <input value={p.photo && p.photo.startsWith('data:') ? '' : (p.photo || '')}
              onChange={f('photo')} placeholder="…o pegá una URL de imagen (https://…)"
              style={{ marginTop: 10 }} />
          </div>

          <div className="adm-field-row">
            <div className="adm-field"><label>Nombre</label>
              <input value={p.name} onChange={f('name')} placeholder="Creatina" />
            </div>
            <div className="adm-field"><label>Subtítulo</label>
              <input value={p.sub} onChange={f('sub')} placeholder="Monohidrato" />
            </div>
          </div>

          <div className="adm-field-row">
            <div className="adm-field"><label>Categoría</label>
              <select value={p.category} onChange={f('category')}>
                {D.categories.filter(c => c !== 'Todo').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="adm-field"><label>Color del tile (sin imagen)</label>
              <select value={p.tone} onChange={f('tone')}>
                {['green', 'sage', 'navy', 'paper'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="adm-field"><label>Badge (ej. "Más vendido")</label>
            <input value={p.badge || ''} onChange={f('badge')} placeholder="Opcional" />
          </div>

          {/* Presentaciones con precio individual */}
          <div className="adm-field">
            <label>Presentaciones y precios</label>
            <div className="adm-var-list">
              <div className="adm-var-head">
                <span>Presentación / peso</span><span>Precio ($)</span><span></span>
              </div>
              {variants.map((v, i) => (
                <div className="adm-var-row" key={i}>
                  <input value={v.label} onChange={e => setVariant(i, 'label', e.target.value)}
                    placeholder="Ej. 300 gr · 120 caps" />
                  <input type="number" min={0} value={v.price}
                    onChange={e => setVariant(i, 'price', e.target.value)} placeholder="0" />
                  <button type="button" className="adm-var-del" onClick={() => removeVariant(i)}
                    disabled={variants.length === 1} aria-label="Quitar presentación">
                    <IcoTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="adm-btn adm-btn--outline adm-btn--sm adm-var-add"
              onClick={addVariant}>
              <IcoPlus size={13} /> Agregar presentación
            </button>
          </div>

          <div className="adm-field"><label>Descripción</label>
            <textarea value={p.blurb || ''} onChange={f('blurb')} rows={3}
              placeholder="Describe el producto, sus beneficios y usos." />
          </div>

          <div className="adm-field-row">
            <div className="adm-field"><label>Valoración (0–5)</label>
              <input type="number" value={p.rating} onChange={f('rating')} min={0} max={5} step={0.1} />
            </div>
            <div className="adm-field"><label>Cantidad de reseñas</label>
              <input type="number" value={p.reviews} onChange={f('reviews')} min={0} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, paddingTop: 4 }}>
            <Switch on={p.visible !== false} onChange={v => setP(x => ({ ...x, visible: v }))} label="Visible en tienda" />
            <Switch on={!!p.featured} onChange={v => setP(x => ({ ...x, featured: v }))} label="Destacado en home" />
          </div>
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState(() => window.VcoreData.allProducts);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  function persistLocal(next) {
    setProducts(next);
    try { localStorage.setItem('vc-products', JSON.stringify(next)); } catch {}
  }
  async function reload() {
    if (backendOn()) { const d = await BE().fetchProducts(); if (d) setProducts(d); }
    else setProducts(readLS('vc-products', D._base));
  }
  useEffect(() => { reload(); }, []);

  const shown = products.filter(p =>
    !q || [p.name, p.sub, p.category].some(t => t && t.toLowerCase().includes(q.toLowerCase()))
  );

  async function save(p) {
    if (backendOn()) {
      try { await BE().saveProduct(p); await window.VcoreData.loadFromBackend(); await reload(); }
      catch (e) { alert('No se pudo guardar: ' + (e.message || e)); return; }
    } else {
      const i = products.findIndex(x => x.id === p.id);
      persistLocal(i >= 0 ? products.map(x => x.id === p.id ? p : x) : [...products, p]);
    }
    setEditing(null); setCreating(false);
  }
  async function del(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    if (backendOn()) {
      try { await BE().deleteProduct(id); await window.VcoreData.loadFromBackend(); await reload(); }
      catch (e) { alert('No se pudo eliminar: ' + (e.message || e)); }
    } else {
      persistLocal(products.filter(p => p.id !== id));
    }
  }
  async function toggle(id, field) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const updated = window.VcoreData._normalize({ ...p, [field]: !p[field] });
    if (backendOn()) {
      setProducts(prev => prev.map(x => x.id === id ? updated : x)); // optimista
      try { await BE().saveProduct(updated); await window.VcoreData.loadFromBackend(); }
      catch (e) { alert('No se pudo actualizar: ' + (e.message || e)); reload(); }
    } else {
      persistLocal(products.map(x => x.id === id ? updated : x));
    }
  }
  async function importBase() {
    if (!backendOn()) { alert('La importación requiere tener el backend configurado.'); return; }
    if (!confirm('Se importarán los productos de ejemplo al catálogo en la nube. ¿Continuar?')) return;
    setBusy(true);
    try {
      await BE().importProducts(D._base.map(p => window.VcoreData._normalize(p)));
      await window.VcoreData.loadFromBackend(); await reload();
      alert('Catálogo de ejemplo importado.');
    } catch (e) { alert('No se pudo importar: ' + (e.message || e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="adm-head">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="adm-eye">Gestión</div>
            <h1>Productos</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {backendOn() && (
              <button className="adm-btn adm-btn--outline" onClick={importBase} disabled={busy}>
                {busy ? 'Importando…' : 'Importar ejemplo'}
              </button>
            )}
            <button className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
              <IcoPlus size={15} /> Nuevo producto
            </button>
          </div>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-bar">
          <div className="adm-search">
            <IcoSearch size={14} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." />
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--ink-400)', marginLeft: 'auto' }}>
            {shown.length} producto{shown.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table className="adm-tbl">
          <thead><tr>
            <th>Producto</th><th>Categoría</th><th>Precio</th><th>Visible</th><th>Destacado</th><th></th>
          </tr></thead>
          <tbody>
            {shown.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="adm-thumb">
                      {p.photo ? <img src={p.photo} alt="" /> : <span className="adm-thumb__v">V</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{p.sub}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--ink-600)' }}>{p.category}</td>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                  {D.hasPriceRange(D._normalize(p)) && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: 'var(--ink-400)' }}>Desde </span>}
                  {fmt(D._normalize(p).price)}
                </td>
                <td><Switch on={p.visible !== false} onChange={() => toggle(p.id, 'visible')} /></td>
                <td><Switch on={!!p.featured} onChange={() => toggle(p.id, 'featured')} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(p)}>
                      <IcoEdit size={13} />
                    </button>
                    <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(p.id)}>
                      <IcoTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ProductEditor
          product={editing}
          onSave={save}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

/* ─── Orders ────────────────────────────────────────────── */
const STATUSES = ['nuevo', 'confirmado', 'enviado', 'entregado'];
const STATUS_COLORS = { nuevo: 'adm-chip--nuevo', confirmado: 'adm-chip--confirmado',
  enviado: 'adm-chip--enviado', entregado: 'adm-chip--entregado' };

function buildRemito(o) {
  const rows = (o.items || []).map(it => `
    <tr>
      <td>${it.name} — ${it.sub || ''}</td>
      <td>${it.size || ''}</td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">$${Math.round(it.price).toLocaleString('es-CL')}</td>
      <td style="text-align:right">$${Math.round(it.price * it.qty).toLocaleString('es-CL')}</td>
    </tr>`).join('');

  const date = new Date(o.date || Date.now()).toLocaleDateString('es-AR');
  const id = o.id || '—';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Remito ${id}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 680px; margin: 40px auto; font-size: 13px; color: #222; }
  h1 { font-size: 22px; margin: 0; }
  .sub { color: #666; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #1B3A2E; color: #fff; padding: 9px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: 800; border-top: 2px solid #1B3A2E; font-size: 15px; }
  .disc-row td { color: #1B6B35; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 28px; }
  @media print { button { display: none; } }
</style>
</head><body>
<h1>Vcore · Remito</h1>
<div class="sub">Nutrición & Performance</div>
<div class="meta">
  <span><strong>Nro:</strong> ${id}</span>
  <span><strong>Fecha:</strong> ${date}</span>
  <span><strong>Envío:</strong> ${o.shippingLabel || 'A coordinar'}</span>
</div>
<table>
  <thead><tr><th>Producto</th><th>Presentación</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio u.</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>
    ${rows}
    <tr><td colspan="4" style="text-align:right;padding-top:10px">Subtotal:</td><td style="text-align:right;padding-top:10px">$${Math.round(o.subtotal||o.total||0).toLocaleString('es-CL')}</td></tr>
    ${(o.tierDiscAmt > 0) ? `<tr class="disc-row"><td colspan="4" style="text-align:right">Desc. ${o.tierName||''}:</td><td style="text-align:right">-$${Math.round(o.tierDiscAmt).toLocaleString('es-CL')}</td></tr>` : ''}
    ${(o.couponDiscAmt > 0) ? `<tr class="disc-row"><td colspan="4" style="text-align:right">Código ${o.couponCode||''}:</td><td style="text-align:right">-$${Math.round(o.couponDiscAmt).toLocaleString('es-CL')}</td></tr>` : ''}
    <tr><td colspan="4" style="text-align:right">Envío:</td><td style="text-align:right">${(o.shippingCost||0) === 0 ? 'Gratis' : `$${Math.round(o.shippingCost||0).toLocaleString('es-CL')}`}</td></tr>
    <tr class="total-row"><td colspan="4" style="text-align:right">TOTAL:</td><td style="text-align:right">$${Math.round(o.total||0).toLocaleString('es-CL')}</td></tr>
  </tbody>
</table>
<p style="margin-top:24px;font-size:11px;color:#999">Vcore Nutrition & Performance · www.vcore.com.ar</p>
</body></html>`;
}

function OrderDetail({ order, onClose, onUpdateStatus, onDelete }) {
  const [sel, setSel] = useState(order.status || 'nuevo');
  function printRemito() {
    const w = window.open('', '_blank');
    w.document.write(buildRemito(order));
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ width: 'min(680px, 98vw)' }}>
        <div className="adm-modal__hd">
          <h3>Pedido {order.id || '—'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-order-detail">
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--ink-600)', padding: '16px 0 0' }}>
            <span><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString('es-AR')}</span>
            <span><strong>Envío:</strong> {order.shippingLabel || '—'}</span>
          </div>
          <h4>Productos</h4>
          {order.items && order.items.length > 0 ? (
            <table className="adm-order-items">
              <thead><tr><th>Producto</th><th>Presentación</th><th>Cant.</th><th style={{ textAlign: 'right' }}>Precio u.</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.name}</td>
                    <td style={{ color: 'var(--ink-500)' }}>{it.size}</td>
                    <td>{it.qty}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(it.price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{order.summary}</div>
          )}
          <div style={{ background: 'var(--paper-100)', borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {(order.tierDiscAmt > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-brand)' }}>
                <span>Desc. {order.tierName}</span><span>-{fmt(order.tierDiscAmt)}</span>
              </div>
            )}
            {(order.couponDiscAmt > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-brand)' }}>
                <span>Código {order.couponCode}</span><span>-{fmt(order.couponDiscAmt)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Envío ({order.shippingLabel})</span>
              <span style={{ color: (order.shippingCost || 0) === 0 ? 'var(--text-brand)' : undefined }}>
                {(order.shippingCost || 0) === 0 ? 'Gratis' : fmt(order.shippingCost)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: 18, borderTop: '1px solid var(--paper-200)', paddingTop: 8, marginTop: 4 }}>
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>
          <h4>Estado del pedido</h4>
          <div className="adm-status-sel">
            {STATUSES.map(s => (
              <button key={s} className={`adm-status-opt${sel === s ? ' on' : ''}`}
                onClick={() => setSel(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="adm-modal__ft" style={{ justifyContent: 'space-between' }}>
          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => { onDelete(order.id); onClose(); }}>
            <IcoTrash size={13} /> Eliminar
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="adm-btn adm-btn--outline adm-btn--sm" onClick={printRemito}>
              <IcoPrint size={13} /> Imprimir remito
            </button>
            <button className="adm-btn adm-btn--primary" onClick={() => { onUpdateStatus(order.id, sel); onClose(); }}>
              Guardar estado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState(() => backendOn() ? [] : readLS('vc-orders', []));
  const [filter, setFilter] = useState('todos');
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');

  function persistLocal(next) {
    setOrders(next);
    try { localStorage.setItem('vc-orders', JSON.stringify(next)); } catch {}
  }
  async function reload() {
    if (backendOn()) setOrders(await BE().listOrders());
    else setOrders(readLS('vc-orders', []));
  }
  useEffect(() => { reload(); }, []);

  const shown = orders.filter(o => {
    const matchFilter = filter === 'todos' || o.status === filter;
    const matchQ = !q || (o.summary || '').toLowerCase().includes(q.toLowerCase()) || (o.id || '').toLowerCase().includes(q.toLowerCase());
    return matchFilter && matchQ;
  }).sort((a, b) => (b.ts || 0) - (a.ts || 0));

  async function updateStatus(id, status) {
    if (backendOn()) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); // optimista
      try { await BE().updateOrderStatus(id, status); } catch (e) { alert('No se pudo actualizar: ' + (e.message || e)); reload(); }
    } else {
      persistLocal(orders.map(o => o.id === id ? { ...o, status } : o));
    }
  }
  async function delOrder(id) {
    if (backendOn()) {
      try { await BE().deleteOrder(id); await reload(); } catch (e) { alert('No se pudo eliminar: ' + (e.message || e)); }
    } else {
      persistLocal(orders.filter(o => o.id !== id));
    }
  }

  return (
    <div>
      <div className="adm-head">
        <div className="adm-eye">Gestión</div>
        <h1>Pedidos</h1>
      </div>

      <div className="adm-panel">
        <div className="adm-bar">
          <div className="adm-search">
            <IcoSearch size={14} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['todos', ...STATUSES].map(s => (
              <button key={s} className={`adm-btn adm-btn--sm ${filter === s ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                onClick={() => setFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="adm-empty">
            <IcoCart size={34} />
            <div>{orders.length === 0 ? 'Sin pedidos aún.' : 'No hay pedidos con ese filtro.'}</div>
          </div>
        ) : (
          <table className="adm-tbl">
            <thead><tr>
              <th>ID</th><th>Fecha</th><th>Resumen</th><th>Total</th><th>Estado</th><th></th>
            </tr></thead>
            <tbody>
              {shown.map((o, i) => (
                <tr key={o.id || i} style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>
                    {o.id || `#${i + 1}`}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                    {new Date(o.date || Date.now()).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ink-600)', maxWidth: 260 }}>{o.summary}</td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{fmt(o.total)}</td>
                  <td>
                    <span className={`adm-chip ${STATUS_COLORS[o.status] || 'adm-chip--nuevo'}`}>
                      {(o.status || 'nuevo').charAt(0).toUpperCase() + (o.status || 'nuevo').slice(1)}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={e => { e.stopPropagation(); setSelected(o); }}>
                      <IcoEdit size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
          onDelete={delOrder}
        />
      )}
    </div>
  );
}

/* ─── Discount Codes ────────────────────────────────────── */
function defaultCodes() {
  return [
    { id: '1', code: 'VCORE10', value: 10, active: true, note: 'Descuento general 10%' },
    { id: '2', code: 'BIENVENIDO', value: 15, active: true, note: 'Nuevo cliente 15%' },
  ];
}

function CodeEditor({ code, onSave, onClose }) {
  const [c, setC] = useState(code || { id: '', code: '', value: 10, active: true, note: '' });
  function f(k) { return e => setC(v => ({ ...v, [k]: e.target.value })); }
  function save() {
    if (!c.code.trim()) return;
    onSave({ ...c, id: c.id || uid(), code: c.code.trim().toUpperCase(), value: parseFloat(c.value) || 10 });
  }
  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 420 }}>
        <div className="adm-modal__hd">
          <h3>{code ? 'Editar código' : 'Nuevo código'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <div className="adm-field-row">
            <div className="adm-field"><label>Código</label>
              <input value={c.code} onChange={f('code')} placeholder="VCORE10"
                style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }} />
            </div>
            <div className="adm-field"><label>Descuento (%)</label>
              <input type="number" value={c.value} onChange={f('value')} min={1} max={100} />
            </div>
          </div>
          <div className="adm-field"><label>Nota interna</label>
            <input value={c.note || ''} onChange={f('note')} placeholder="Ej. campaña verano 2026" />
          </div>
          <Switch on={c.active} onChange={v => setC(x => ({ ...x, active: v }))} label="Activo (aplica en el carrito)" />
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn--primary" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AdminCodes() {
  const [codes, setCodes] = useState(() => backendOn() ? [] : readLS('vc-codes', defaultCodes()));
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  function persistLocal(next) {
    setCodes(next);
    try { localStorage.setItem('vc-codes', JSON.stringify(next)); } catch {}
  }
  async function reload() {
    if (backendOn()) { const d = await BE().fetchCodes(); setCodes(d || []); }
    else setCodes(readLS('vc-codes', defaultCodes()));
  }
  useEffect(() => { reload(); }, []);

  async function save(c) {
    if (backendOn()) {
      try { await BE().saveCode(c); await window.VcoreData.loadFromBackend(); await reload(); }
      catch (e) { alert('No se pudo guardar: ' + (e.message || e)); return; }
    } else {
      const i = codes.findIndex(x => x.id === c.id);
      persistLocal(i >= 0 ? codes.map(x => x.id === c.id ? c : x) : [...codes, c]);
    }
    setEditing(null); setCreating(false);
  }
  async function del(id) {
    if (!confirm('¿Eliminar este código?')) return;
    if (backendOn()) {
      try { await BE().deleteCode(id); await window.VcoreData.loadFromBackend(); await reload(); }
      catch (e) { alert('No se pudo eliminar: ' + (e.message || e)); }
    } else {
      persistLocal(codes.filter(c => c.id !== id));
    }
  }
  async function toggle(id) {
    const c = codes.find(x => x.id === id);
    if (!c) return;
    const updated = { ...c, active: !c.active };
    if (backendOn()) {
      setCodes(prev => prev.map(x => x.id === id ? updated : x));
      try { await BE().saveCode(updated); await window.VcoreData.loadFromBackend(); }
      catch (e) { alert('No se pudo actualizar: ' + (e.message || e)); reload(); }
    } else {
      persistLocal(codes.map(x => x.id === id ? updated : x));
    }
  }

  return (
    <div>
      <div className="adm-head">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><div className="adm-eye">Gestión</div><h1>Códigos de descuento</h1></div>
          <button className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
            <IcoPlus size={15} /> Nuevo código
          </button>
        </div>
      </div>
      <div className="adm-panel">
        {codes.length === 0 ? (
          <div className="adm-empty"><IcoTag size={32} /><div>Sin códigos. Crea el primero.</div></div>
        ) : (
          <table className="adm-tbl">
            <thead><tr><th>Código</th><th>Descuento</th><th>Nota</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '.05em' }}>{c.code}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-brand)' }}>{c.value}%</td>
                  <td style={{ fontSize: 13, color: 'var(--ink-500)' }}>{c.note}</td>
                  <td><Switch on={c.active} onChange={() => toggle(c.id)} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(c)}>
                        <IcoEdit size={13} />
                      </button>
                      <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(c.id)}>
                        <IcoTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {(editing || creating) && (
        <CodeEditor
          code={editing}
          onSave={save}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

/* ─── Config ────────────────────────────────────────────── */
const CONFIG_DEFAULT = {
  whatsapp: '5491100000000',
  address: 'Buenos Aires, Argentina',
  instagram: 'https://instagram.com/vcorenutri',
  email: 'hola@vcore.com.ar',
};

function AdminConfig() {
  const [cfg, setCfg] = useState(() => readLS('vc-config', CONFIG_DEFAULT));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  function f(k) { return e => setCfg(v => ({ ...v, [k]: e.target.value })); }

  useEffect(() => {
    if (backendOn()) BE().fetchConfig().then(d => { if (d) setCfg(d); });
  }, []);

  async function save() {
    setBusy(true);
    try {
      if (backendOn()) await BE().saveConfig(cfg);
      else localStorage.setItem('vc-config', JSON.stringify(cfg));
      await window.VcoreData.loadFromBackend();
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('No se pudo guardar: ' + (e.message || e));
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="adm-head">
        <div className="adm-eye">Ajustes</div>
        <h1>Configuración</h1>
      </div>
      <div className="adm-panel">
        <div className="adm-panel__hd"><h3>Datos del negocio</h3></div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="adm-field"><label>Número de WhatsApp</label>
            <input value={cfg.whatsapp} onChange={f('whatsapp')} placeholder="5491100000000" />
            <span style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4 }}>
              Formato: código de país + número sin espacios ni +. Ej: 5491123456789
            </span>
          </div>
          <div className="adm-field"><label>Dirección</label>
            <input value={cfg.address} onChange={f('address')} placeholder="Buenos Aires, Argentina" />
          </div>
          <div className="adm-field"><label>Instagram</label>
            <input value={cfg.instagram} onChange={f('instagram')} placeholder="https://instagram.com/vcorenutri" />
          </div>
          <div className="adm-field"><label>Email de contacto</label>
            <input value={cfg.email} onChange={f('email')} placeholder="hola@vcore.com.ar" />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar configuración'}
            </button>
            {saved && <span style={{ fontSize: 13, color: 'var(--text-brand)', fontWeight: 700 }}>✓ Guardado</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shell ─────────────────────────────────────────────── */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: IcoGrid },
  { id: 'products',  label: 'Productos',  icon: IcoBox  },
  { id: 'orders',    label: 'Pedidos',    icon: IcoCart },
  { id: 'codes',     label: 'Códigos',    icon: IcoTag  },
  { id: 'config',    label: 'Config',     icon: IcoCog  },
];

function AdminPage({ onExit }) {
  injectAdmin();
  const secure = backendOn();
  const [auth, setAuth] = useState(() => secure ? false : sessionStorage.getItem('vc-admin') === '1');
  const [checking, setChecking] = useState(secure);
  const [section, setSection] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(() => window.VcoreData.allProducts);

  /* sesión real (Supabase) o demo (sessionStorage) */
  useEffect(() => {
    if (!secure) return;
    let unsub = () => {};
    BE().currentUser().then(u => { setAuth(!!u); setChecking(false); });
    unsub = BE().onAuthChange(u => setAuth(!!u));
    return unsub;
  }, []);

  /* datos del dashboard (pedidos + productos) */
  useEffect(() => {
    if (!auth) return;
    if (secure) {
      BE().listOrders().then(setOrders);
      BE().fetchProducts().then(d => { if (d) setProducts(d); });
    } else {
      setOrders(readLS('vc-orders', []));
      setProducts(window.VcoreData.allProducts);
    }
  }, [auth, section]);

  function logout() {
    if (secure) BE().logout(); else sessionStorage.removeItem('vc-admin');
    setAuth(false);
    if (onExit) onExit();
  }

  if (checking) {
    return <div className="adm-login"><div className="adm-login__box" style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--ink-500)', fontSize: 14 }}>Cargando…</div>
    </div></div>;
  }
  if (!auth) return <AdminLogin onAuth={() => setAuth(true)} />;

  const Base = window.VcoreDesignSystem_8ff97c?.Logo;

  return (
    <div className="adm-shell">
      {/* Sidebar */}
      <aside className="adm-side">
        <div className="adm-side__logo">
          {Base && <Base variant="wordmark" tone="paper" height={26} />}
          {!Base && <strong style={{ color: '#fff', fontFamily: 'var(--font-display)' }}>VCORE</strong>}
          <span>Admin Panel</span>
        </div>
        <nav className="adm-nav">
          {NAV.map(({ id, label, icon: Ic }) => (
            <button key={id} className={`adm-nav__item${section === id ? ' on' : ''}`}
              onClick={() => setSection(id)}>
              <Ic size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="adm-side__out">
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-main">
        {section === 'dashboard' && <AdminDashboard orders={orders} products={products} onNav={setSection} />}
        {section === 'products'  && <AdminProducts />}
        {section === 'orders'    && <AdminOrders />}
        {section === 'codes'     && <AdminCodes />}
        {section === 'config'    && <AdminConfig />}
      </div>
    </div>
  );
}

window.VcoreAdminPage = AdminPage;
