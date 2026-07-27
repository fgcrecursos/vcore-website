/* Vcore website — Admin panel: núcleo (store, login, shell, dashboard, catálogo).
   Las secciones pesadas viven en módulos aparte y se registran en
   window.VcoreAdminSections (ver admin-remitos / admin-clientes / admin-pagos /
   admin-usuarios). El kit de UI compartido se publica en window.VcoreAdminKit. */
const React = window.React;
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const D = window.VcoreData;

/* ─── helpers ─────────────────────────────────────────── */
const fmt = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');

function uid() { return 'VC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }

/* Normaliza texto para buscar: minúsculas y sin tildes ("capsulas" == "Cápsulas").
   El rango ̀-ͯ son las marcas diacríticas que deja NFD al descomponer. */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
function searchNormalize(s) {
  return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(DIACRITICS, '');
}

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

/* ¿Hay backend (Supabase) configurado? */
function backendOn() { return !!(window.VcoreBackend && window.VcoreBackend.isOn()); }
const BE = () => window.VcoreBackend;
function readLS(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
      alert('No se pudo guardar: el almacenamiento local está lleno.');
    }
  }
}

/* Pagado de un pedido = suma de sus pagos registrados. */
function paidOf(o) { return (o.payments || []).reduce((s, p) => s + (Number(p.monto) || 0), 0); }

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
.adm-nav__badge { margin-left: auto; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px;
  background: var(--green-500); color: #fff; font-size: 11px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center; }
.adm-side__out { padding: 14px 12px 22px; border-top: 1px solid rgba(255,255,255,.1); }
.adm-side__who { font-size: 11px; color: rgba(255,255,255,.45); margin-bottom: 8px; line-height: 1.45;
  word-break: break-all; }
.adm-side__who strong { display: block; color: rgba(255,255,255,.75); font-weight: 700; }
.adm-side__out button { width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,.18);
  background: transparent; color: rgba(255,255,255,.55); font-family: var(--font-body); font-size: 13px;
  font-weight: 600; cursor: pointer; transition: background .15s, color .15s; }
.adm-side__out button:hover { background: rgba(255,255,255,.08); color: #fff; }

/* main */
.adm-main { flex: 1; min-width: 0; padding: 36px 40px 80px; background: var(--surface-page); }
.adm-head { margin-bottom: 30px; }
.adm-head h1 { font-family: var(--font-display); font-weight: 800; font-size: 34px;
  letter-spacing: -.025em; margin: 6px 0 0; }
.adm-head__sub { font-size: 13.5px; color: var(--ink-500); margin-top: 6px; }
.adm-head__row { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
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

/* mini stat (fichas de cuenta corriente / modales) */
.adm-ccstat__l { font-size: 10px; color: var(--ink-500); text-transform: uppercase;
  letter-spacing: .08em; font-weight: 800; }
.adm-ccstat__v { font-family: var(--font-display); font-size: 17px; font-weight: 800; margin-top: 3px; }

/* panel */
.adm-panel { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 24px; }
.adm-panel__hd { display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid var(--border-default); }
.adm-panel__hd h3 { font-family: var(--font-display); font-weight: 800; font-size: 17px;
  letter-spacing: -.01em; margin: 0; }
.adm-panel__body { padding: 0; }

/* table */
.adm-tblwrap { width: 100%; overflow-x: auto; }
.adm-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.adm-tbl th { text-align: left; padding: 11px 16px; font-size: 11px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-500); border-bottom: 1px solid var(--border-default); font-weight: 800; }
.adm-tbl td { padding: 13px 16px; border-bottom: 1px solid var(--paper-100); vertical-align: middle; }
.adm-tbl tr:last-child td { border-bottom: none; }
.adm-tbl tbody tr:hover td { background: var(--paper-050); }
.adm-tbl .num { font-family: var(--font-display); font-weight: 800; }
.adm-tbl .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
.adm-tbl--tight td { padding: 9px 12px; font-size: 13px; }
.adm-tbl--tight th { padding: 8px 12px; }

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
.adm-chip--anulado { background: var(--paper-200); color: var(--ink-500); }

/* filter chips */
.adm-chiprow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.adm-chiprow__lbl { font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .08em; color: var(--ink-500); margin-right: 2px; }
.adm-fchip { padding: 5px 12px; border-radius: var(--radius-pill); border: 1.5px solid var(--border-default);
  background: var(--surface-card); color: var(--ink-600); font-family: var(--font-body);
  font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all .15s; white-space: nowrap; }
.adm-fchip:hover { border-color: var(--green-500); color: var(--text-brand); }
.adm-fchip.on { background: var(--green-500); border-color: var(--green-500); color: #fff; }
.adm-fsel { padding: 5px 10px; border-radius: var(--radius-pill); border: 1.5px solid var(--border-default);
  background: var(--surface-card); color: var(--ink-700); font-family: var(--font-body);
  font-size: 12.5px; font-weight: 700; cursor: pointer; }

/* badges de fila */
.adm-badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9.5px;
  font-weight: 800; letter-spacing: .04em; vertical-align: middle; margin-right: 6px; color: #fff; }
.adm-badge--nuevo { background: var(--green-600); }
.adm-badge--manual { background: #5B6B7A; }
.adm-badge--anulado { background: #B71C1C; }
.adm-badge--habitual { background: var(--green-100); color: var(--green-700); }

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
.adm-btn--info { background: transparent; border: 1.5px solid #1C6CAE55; color: #1C6CAE; }
.adm-btn--info:hover { background: #EAF3FB; }
.adm-btn--sm { padding: 5px 10px; font-size: 12px; }
.adm-btn--xs { padding: 4px 9px; font-size: 11px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase; }
.adm-btn:disabled { opacity: .55; cursor: not-allowed; }
.adm-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

/* search */
.adm-search { position: relative; max-width: 280px; }
.adm-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-400); pointer-events: none; }
.adm-search input { width: 100%; height: 38px; padding: 0 12px 0 32px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); font-size: 13.5px; color: var(--ink-900);
  font-family: var(--font-body); outline: none; box-sizing: border-box; }
.adm-search input:focus { border-color: var(--green-500); }
.adm-search--wide { max-width: none; }

/* modal */
.adm-modal-ov { position: fixed; inset: 0; background: rgba(10,20,18,.55);
  backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: flex-start;
  justify-content: center; padding: 48px 16px; overflow-y: auto; }
.adm-modal { background: var(--paper-050); border-radius: var(--radius-xl);
  width: min(600px, 100%); box-shadow: var(--shadow-xl); flex: none; }
.adm-modal--wide { width: min(1080px, 100%); }
.adm-modal--md { width: min(760px, 100%); }
.adm-modal__hd { display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--border-default); position: sticky; top: 0;
  background: var(--paper-050); border-radius: var(--radius-xl) var(--radius-xl) 0 0; z-index: 2; }
.adm-modal__hd h3 { font-family: var(--font-display); font-weight: 800; font-size: 20px;
  letter-spacing: -.01em; margin: 0; }
.adm-modal__body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.adm-modal__ft { padding: 16px 24px; border-top: 1px solid var(--border-default);
  display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
.adm-modal__note { padding: 10px 24px; background: #FFF4E6; border-bottom: 1px solid #F2D0A8;
  color: #8A5A2B; font-size: 12.5px; font-weight: 600; }
.adm-close { width: 32px; height: 32px; border-radius: 50%; border: 0;
  background: var(--paper-100); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.adm-close:hover { background: var(--paper-200); }

/* form fields */
.adm-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.adm-field label { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ink-500); }
.adm-field input, .adm-field textarea, .adm-field select {
  width: 100%; padding: 9px 12px; border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 14px;
  color: var(--ink-900); background: var(--surface-card); outline: none; box-sizing: border-box; }
.adm-field input:focus, .adm-field textarea:focus, .adm-field select:focus { border-color: var(--green-500); }
.adm-field textarea { resize: vertical; min-height: 80px; }
.adm-field__hint { font-size: 11.5px; color: var(--ink-400); }
.adm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.adm-field-row--3 { grid-template-columns: repeat(3, 1fr); }
.adm-field-row--4 { grid-template-columns: repeat(4, 1fr); }
fieldset.adm-fs { border: 0; margin: 0; padding: 0; min-width: 0; display: flex;
  flex-direction: column; gap: 16px; }

/* bloque destacado dentro de un modal */
.adm-box { background: var(--paper-100); border-radius: var(--radius-md); padding: 12px 14px; }
.adm-box--info { background: #EAF3FB; }
.adm-box--warn { background: #FFF4E6; }
.adm-box--brand { background: var(--green-050); }

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

/* variant editor */
.adm-var-list { display: flex; flex-direction: column; gap: 8px; }
.adm-var-head { display: grid; grid-template-columns: 1fr 120px 120px 36px; gap: 10px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-400); padding: 0 2px; }
.adm-var-row { display: grid; grid-template-columns: 1fr 120px 120px 36px; gap: 10px; align-items: center; }
.adm-var-row input { width: 100%; padding: 8px 11px; border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13.5px;
  color: var(--ink-900); background: var(--surface-card); outline: none; box-sizing: border-box; }
.adm-var-row input:focus { border-color: var(--green-500); }
.adm-var-del { width: 36px; height: 36px; border-radius: var(--radius-md); border: 1.5px solid var(--border-default);
  background: transparent; color: var(--ink-500); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.adm-var-del:hover:not(:disabled) { border-color: #D32F2F44; color: #B71C1C; background: #FFEBEE; }
.adm-var-del:disabled { opacity: .4; cursor: not-allowed; }
.adm-var-add { margin-top: 10px; align-self: flex-start; }

/* remitera: filas de ítems */
.adm-rem-head, .adm-rem-row { display: grid; grid-template-columns: 3fr 72px 130px 130px 30px;
  gap: 8px; align-items: center; }
.adm-rem-head { font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-400); padding: 0 2px 6px; }
.adm-rem-row { margin-bottom: 8px; }
.adm-rem-row input { width: 100%; padding: 8px 10px; border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px;
  color: var(--ink-900); background: var(--surface-card); outline: none; box-sizing: border-box; }
.adm-rem-row input:focus { border-color: var(--green-500); }
.adm-rem-row__total { font-family: var(--font-display); font-weight: 800; font-size: 14px; text-align: right; }
.adm-rem-row__del { background: none; border: 0; color: var(--ink-400); font-size: 20px;
  line-height: 1; cursor: pointer; padding: 0; }
.adm-rem-row__del:hover { color: #B71C1C; }
.adm-rem-totals { display: flex; justify-content: flex-end; gap: 26px; align-items: flex-end; }
.adm-rem-totals__lines { text-align: right; font-size: 13px; color: var(--ink-600); line-height: 1.7; }
.adm-rem-totals__grand { font-family: var(--font-display); font-weight: 800; font-size: 26px; }

/* combobox flotante */
.adm-combo { position: relative; }
.adm-combo input { width: 100%; padding: 8px 10px; border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px;
  color: var(--ink-900); background: var(--surface-card); outline: none; box-sizing: border-box; }
.adm-combo input:focus { border-color: var(--green-500); }
.adm-combo__pop { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md); box-shadow: var(--shadow-xl); overflow-y: auto; }
.adm-combo__opt { padding: 9px 14px; cursor: pointer; font-size: 13px;
  border-bottom: 1px solid var(--paper-100); display: flex; justify-content: space-between;
  align-items: center; gap: 12px; color: var(--ink-800); }
.adm-combo__opt.on { background: var(--green-050); color: var(--text-brand); }
.adm-combo__opt-price { font-size: 12px; color: var(--ink-500); font-weight: 700; flex: none; }
.adm-combo__hd { padding: 7px 14px; font-size: 10px; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase; color: var(--ink-500); background: var(--paper-100);
  border-bottom: 1px solid var(--paper-200); }

/* aviso de pedidos nuevos */
.adm-alert { display: flex; align-items: center; gap: 12px; background: var(--green-050);
  border: 1.5px solid var(--green-500); border-radius: var(--radius-lg);
  padding: 14px 18px; margin-bottom: 18px; cursor: pointer; }
.adm-alert__n { width: 28px; height: 28px; border-radius: 50%; background: var(--green-600);
  color: #fff; font-weight: 800; font-size: 14px; flex: none;
  display: inline-flex; align-items: center; justify-content: center; }
.adm-alert__t { font-weight: 800; font-size: 14px; color: var(--green-800); }
.adm-alert__s { font-size: 12.5px; color: var(--ink-600); }
.adm-alert__go { margin-left: auto; font-size: 12px; font-weight: 800; text-transform: uppercase;
  color: var(--text-brand); white-space: nowrap; }

/* filas de pedido resaltadas por estado */
.adm-tbl tr.row--nuevo td { background: var(--green-050); box-shadow: inset 3px 0 0 var(--green-500); }
.adm-tbl tr.row--confirmado td { background: var(--paper-050); box-shadow: inset 3px 0 0 var(--green-700); }
.adm-tbl tr.row--anulado td { opacity: .55; }
.adm-tbl tr.row--sel td { background: var(--green-100) !important; }

/* selector de estado inline */
.adm-statussel { padding: 4px 8px; font-size: 11.5px; border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-default); background: var(--surface-card);
  color: var(--ink-800); font-family: var(--font-body); font-weight: 700; cursor: pointer; }
.adm-statussel.on { border-color: var(--green-500); background: var(--green-050); color: var(--green-800); }

/* split cuenta corriente */
.adm-split { display: grid; grid-template-columns: 320px 1fr; min-height: 420px; }
.adm-split--solo { grid-template-columns: 1fr; }
.adm-split__list { border-right: 1px solid var(--border-default); overflow-y: auto; max-height: 620px; }
.adm-split__item { display: block; width: 100%; text-align: left; padding: 12px 16px; border: 0;
  border-bottom: 1px solid var(--paper-100); background: var(--surface-card); cursor: pointer;
  font-family: var(--font-body); color: var(--ink-800); }
.adm-split__item:hover { background: var(--paper-050); }
.adm-split__item.on { background: var(--green-050); box-shadow: inset 3px 0 0 var(--green-500); }
.adm-split__detail { padding: 24px; min-width: 0; }

/* login */
.adm-login { min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--surface-page); color: var(--ink-900); padding: 24px; }
.adm-login__box { background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-xl); padding: 44px 40px; width: min(400px, 100%); }
.adm-login__box h2 { font-family: var(--font-display); font-weight: 800; font-size: 28px;
  letter-spacing: -.02em; margin: 16px 0 28px; color: var(--ink-900); }
.adm-login__row { display: flex; gap: 10px; }
.adm-login__inp { flex: 1; height: 44px; padding: 0 14px;
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-page); font-family: var(--font-body); font-size: 14px;
  color: var(--ink-900); outline: none; box-sizing: border-box; }
.adm-login__inp:focus { border-color: var(--green-500); }
.adm-login__hint { font-size: 12px; color: var(--ink-400); margin-top: 10px; }
.adm-login__err { font-size: 12.5px; color: #B71C1C; margin-top: 10px; font-weight: 700; }

/* order detail */
.adm-order-detail { padding: 0 24px 24px; }
.adm-order-detail h4 { font-family: var(--font-display); font-weight: 800; font-size: 15px;
  margin: 20px 0 10px; color: var(--ink-700); }
.adm-order-items { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
.adm-order-items th { text-align: left; font-size: 11px; letter-spacing:.1em; text-transform:uppercase;
  color: var(--ink-400); padding: 6px 8px; font-weight: 800; border-bottom: 1px solid var(--paper-200); }
.adm-order-items td { padding: 8px 8px; border-bottom: 1px solid var(--paper-100); }

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
.adm-bar--stack { flex-direction: column; align-items: stretch; gap: 10px; }

/* permisos */
.adm-perm { display: flex; gap: 8px; align-items: flex-start; padding: 7px 10px;
  border-radius: var(--radius-sm); background: var(--paper-050); cursor: pointer; }
.adm-perm.on { background: var(--green-050); }
.adm-perm.locked { opacity: .75; cursor: default; }
.adm-perm__l { font-size: 12.5px; font-weight: 700; color: var(--ink-800); }
.adm-perm__d { font-size: 11.5px; color: var(--ink-500); line-height: 1.4; }

/* product thumbnail in table */
.adm-thumb { width: 42px; height: 50px; flex: none; border-radius: var(--radius-sm); overflow: hidden;
  background: var(--gradient-sage-bloom); display: flex; align-items: center; justify-content: center; }
.adm-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.adm-thumb__v { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--green-600); }

/* ───────── Mobile admin ───────── */
@media (max-width: 980px) {
  .adm-split { grid-template-columns: 1fr; }
  .adm-split__list { border-right: 0; border-bottom: 1px solid var(--border-default); max-height: 300px; }
}
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
  .adm-side__who { display: none; }
  .adm-side__out button { padding: 9px 12px; white-space: nowrap; }

  .adm-main { padding: 22px 16px 64px; }
  .adm-head h1 { font-size: 26px; }
  .adm-stats { grid-template-columns: 1fr 1fr; gap: 12px; }
  .adm-stat .sv { font-size: 24px; }

  .adm-tbl { min-width: 700px; }
  .adm-bar { flex-wrap: nowrap; overflow-x: auto; }
  .adm-bar--stack { flex-wrap: wrap; overflow-x: visible; }

  .adm-modal-ov { padding: 0; align-items: stretch; }
  .adm-modal { width: 100%; min-height: 100vh; border-radius: 0; }
  .adm-modal__hd { border-radius: 0; }
  .adm-field-row, .adm-field-row--3, .adm-field-row--4 { grid-template-columns: 1fr; }
  .adm-var-row, .adm-var-head { grid-template-columns: 1fr 90px 90px 36px; gap: 8px; }
  .adm-rem-head { display: none; }
  .adm-rem-row { grid-template-columns: 1fr 60px 100px 30px; }
  .adm-rem-row__total { display: none; }
  .adm-img-edit { flex-direction: column; }
  .adm-img-actions { flex-direction: row; flex-wrap: wrap; align-items: center; }
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
const IcoImage  = ({ size }) => <Ico size={size} d={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />;
const IcoUsers  = ({ size }) => <Ico size={size} d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>} />;
const IcoWallet = ({ size }) => <Ico size={size} d={<><path d="M20 12V8H6a2 2 0 010-4h12v4"/><path d="M4 6v12a2 2 0 002 2h14v-4"/><path d="M18 12a2 2 0 000 4h4v-4z"/></>} />;
const IcoChart  = ({ size }) => <Ico size={size} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>} />;
const IcoCheck  = ({ size }) => <Ico size={size} d={<polyline points="20 6 9 17 4 12"/>} />;
const IcoShield = ({ size }) => <Ico size={size} d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>} />;
const IcoFile   = ({ size }) => <Ico size={size} d={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} />;

function Switch({ on, onChange, label }) {
  return (
    <div className={`adm-sw${on ? ' on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange(!on)}>
      <div className="adm-sw__track"><div className="adm-sw__thumb" /></div>
      {label && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>{label}</span>}
    </div>
  );
}

/* Ficha compacta de importe (cuenta corriente, modales de pago). */
function CCStat({ label, value, color }) {
  return (
    <div>
      <div className="adm-ccstat__l">{label}</div>
      <div className="adm-ccstat__v" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

/* ─── Kit compartido con los módulos de secciones ───────── */
window.VcoreAdminKit = {
  fmt, uid, searchNormalize, backendOn, BE, readLS, writeLS, paidOf, injectAdmin,
  Ico, IcoGrid, IcoBox, IcoCart, IcoTag, IcoCog, IcoSearch, IcoPlus, IcoTrash, IcoEdit,
  IcoClose, IcoPrint, IcoDown, IcoImage, IcoUsers, IcoWallet, IcoChart, IcoCheck,
  IcoShield, IcoFile, Switch, CCStat,
};
/* Secciones registradas por los módulos que se cargan después de este archivo. */
window.VcoreAdminSections = window.VcoreAdminSections || {};

/* ═══════════════════════════════════════════════════════════
   STORE DEL PANEL
   Fuente única de pedidos, catálogo, banners, códigos, config
   y del usuario logueado (rol + permisos). Funciona con backend
   (Supabase) y en modo demo (localStorage).
   ═══════════════════════════════════════════════════════════ */
const STATUSES = ['nuevo', 'confirmado', 'enviado', 'entregado'];
const STATUS_COLORS = {
  nuevo: 'adm-chip--nuevo', confirmado: 'adm-chip--confirmado',
  enviado: 'adm-chip--enviado', entregado: 'adm-chip--entregado',
  anulado: 'adm-chip--anulado',
};

const CONFIG_DEFAULT = {
  whatsapp: '5491100000000',
  address: 'Buenos Aires, Argentina',
  instagram: 'https://instagram.com/vcorenutri',
  email: 'hola@vcore.com.ar',
  banco: '', alias: '', cuit: '', titular: '',
  remito_leyenda: '', remito_despacho: 'DESPACHO PRODUCTO FINAL', retiro: '',
};

function defaultCodes() {
  return [
    { id: '1', code: 'VCORE10', value: 10, active: true, note: 'Descuento general 10%' },
    { id: '2', code: 'BIENVENIDO', value: 15, active: true, note: 'Nuevo cliente 15%' },
  ];
}

function useAdminStore({ auth, userEmail }) {
  const secure = backendOn();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(() => D.allProducts);
  const [banners, setBanners] = useState([]);
  const [codes, setCodes] = useState(() => secure ? [] : readLS('vc-codes', defaultCodes()));
  const [config, setConfig] = useState(() => ({ ...CONFIG_DEFAULT, ...readLS('vc-config', {}) }));
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(false);
  const [users, setUsers] = useState([]);

  /* Espejo síncrono de los pedidos: las mutaciones encadenadas (guardar remito y
     acto seguido imprimir, pagos múltiples) necesitan leer el estado ya aplicado
     sin esperar al re-render. */
  const ordersRef = useRef([]);
  const commitOrders = useCallback((next) => {
    ordersRef.current = next;
    setOrders(next);
    if (!backendOn()) writeLS('vc-orders', next);
  }, []);

  /* ── carga ── */
  const reloadOrders = useCallback(async () => {
    if (!auth) { commitOrders([]); return []; }
    const list = backendOn() ? await BE().listOrders() : readLS('vc-orders', []);
    const norm = list.map(o => ({ ...o, ts: o.ts || new Date(o.date || Date.now()).getTime() }))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    commitOrders(norm);
    return norm;
  }, [auth, commitOrders]);

  const reloadCatalog = useCallback(async () => {
    if (backendOn()) {
      const [p, b, c, cfg] = await Promise.all([
        BE().fetchProducts(), BE().fetchBanners(), BE().fetchCodes(), BE().fetchConfig(),
      ]);
      if (p) setProducts(p.map(x => D._normalize(x)));
      if (b) setBanners(b.map(r => BE()._mapBanner(r)));
      if (c) setCodes(c);
      if (cfg) setConfig({ ...CONFIG_DEFAULT, ...cfg });
    } else {
      setProducts((readLS('vc-products', D._base) || D._base).map(x => D._normalize(x)));
      setBanners(readLS('vc-banners', []));
      setCodes(readLS('vc-codes', defaultCodes()));
      setConfig({ ...CONFIG_DEFAULT, ...readLS('vc-config', {}) });
    }
  }, []);

  useEffect(() => { reloadCatalog(); }, [reloadCatalog]);
  useEffect(() => { reloadOrders(); }, [reloadOrders]);

  /* ── usuario del panel: rol y permisos ──
     Red de seguridad: si vc_users no existe todavía o la consulta falla PERO el
     email figura en VC_SUPERADMINS, igual entra como superadmin. Sin eso, un
     error de base dejaría a los dueños fuera de su propio panel. */
  const loadMe = useCallback(async (email) => {
    const mail = (email || '').trim().toLowerCase();
    /* Modo demo: no hay tabla de usuarios ni sesión con email — quien entra con
       la clave del panel es superadmin. Se resuelve antes que nada porque en demo
       `mail` siempre viene vacío. */
    if (!backendOn()) {
      const demo = { email: mail || 'demo', nombre: 'Modo demo', rol: 'superadmin', permisos: [], activo: true, _fallback: true };
      setMe(demo); setMeLoading(false); return demo;
    }
    if (!mail) { setMe(null); setMeLoading(false); return null; }
    const fallback = window.VC_SUPERADMINS.includes(mail)
      ? { email: mail, nombre: '', rol: 'superadmin', permisos: [], activo: true, _fallback: true }
      : null;
    setMeLoading(true);
    try {
      const row = await BE().fetchMe(mail);
      const resolved = row === undefined ? fallback         // no se pudo leer la tabla
        : row ? (row.activo ? row : null)                   // fila dada de baja
        : fallback;                                         // sin fila cargada
      setMe(resolved);
      return resolved;
    } finally { setMeLoading(false); }
  }, []);

  useEffect(() => {
    if (!auth) { setMe(null); setUsers([]); setMeLoading(false); return; }
    setMeLoading(true);
    loadMe(userEmail);
  }, [auth, userEmail, loadMe]);

  const can = useCallback((perm) => window.vcEffectivePerms(me).includes(perm), [me]);

  const reloadUsers = useCallback(async () => {
    if (!backendOn()) return [];
    const list = await BE().fetchUsers();
    setUsers(list);
    return list;
  }, []);

  useEffect(() => {
    if (me && window.vcEffectivePerms(me).includes('usuarios.gestionar')) reloadUsers();
  }, [me, reloadUsers]);

  const createUser = useCallback(async (payload) => {
    if (!backendOn()) return { error: 'La gestión de usuarios necesita el backend configurado.' };
    const res = await BE().createUser(payload);
    if (res.ok) await reloadUsers();
    return res;
  }, [reloadUsers]);

  const updateUser = useCallback(async (email, fields) => {
    if (!backendOn()) return { error: 'La gestión de usuarios necesita el backend configurado.' };
    const res = await BE().updateUser(email, fields);
    if (res.ok) {
      await reloadUsers();
      if ((email || '').toLowerCase() === (userEmail || '').toLowerCase()) await loadMe(email);
    }
    return res;
  }, [reloadUsers, userEmail, loadMe]);

  const deleteUser = useCallback(async (email) => {
    if (!backendOn()) return { error: 'La gestión de usuarios necesita el backend configurado.' };
    const res = await BE().deleteUser(email);
    if (res.ok) await reloadUsers();
    return res;
  }, [reloadUsers]);

  /* ── mutaciones de pedidos ──
     Todas siguen el mismo patrón: aplican el cambio al estado local al instante
     (el panel responde sin esperar la red) y persisten en background. */
  const persistOrder = useCallback((order, msgError) => {
    if (!backendOn()) { writeLS('vc-orders', ordersRef.current); return; }
    BE().upsertOrder(order).catch(e => {
      console.error('[Vcore] guardar pedido', e.message || e);
      alert(msgError || 'No se pudo guardar el pedido en el servidor. Revisá tu conexión.');
    });
  }, []);

  const addOrder = useCallback((order) => {
    const normalized = { ...order, status: order.status || 'nuevo', date: order.date || new Date(order.ts || Date.now()).toISOString() };
    commitOrders([normalized, ...ordersRef.current]);
    persistOrder(normalized, 'No se pudo guardar el pedido en el servidor. Quedó una copia local.');
    return normalized;
  }, [commitOrders, persistOrder]);

  const patchOrder = useCallback((id, patch, msgError) => {
    const base = ordersRef.current.find(o => o.id === id);
    if (!base) { console.error('[Vcore] pedido no encontrado:', id); return null; }
    const updated = { ...base, ...patch };
    commitOrders(ordersRef.current.map(o => o.id === id ? updated : o));
    persistOrder(updated, msgError);
    return updated;
  }, [commitOrders, persistOrder]);

  const updateOrderStatus = useCallback((id, status) => patchOrder(id, { status }), [patchOrder]);

  const deleteOrder = useCallback((id) => {
    commitOrders(ordersRef.current.filter(o => o.id !== id));
    if (backendOn()) BE().deleteOrder(id).catch(e => alert('No se pudo eliminar: ' + (e.message || e)));
  }, [commitOrders]);

  /* El remito guarda además los campos del pedido que la remitera edita (ítems,
     totales, datos del cliente): así el listado y las estadísticas reflejan
     cualquier cambio hecho desde el remito. */
  const updateOrderRemito = useCallback((id, remito, overrides = {}) =>
    patchOrder(id, { ...overrides, remito }, 'No se pudo guardar el remito en el servidor.'), [patchOrder]);

  const updateOrderPayments = useCallback((id, paymentData) =>
    patchOrder(id, paymentData, 'No se pudieron guardar los pagos en el servidor.'), [patchOrder]);

  const updateOrderCreditNotes = useCallback((id, creditNotes, patch) =>
    patchOrder(id, { ...(patch || {}), creditNotes }, 'No se pudo guardar la nota de crédito.'), [patchOrder]);

  /* Los clientes no son una tabla: se derivan de los pedidos. Editar un cliente
     reescribe sus datos en TODOS sus pedidos; si no, el próximo agrupamiento
     volvería a mostrar el dato viejo. */
  const updateCustomerInfo = useCallback((orderIds, fields) => {
    const ids = new Set(orderIds || []);
    if (!ids.size) return;
    const touched = [];
    const next = ordersRef.current.map(o => {
      if (!ids.has(o.id)) return o;
      const updated = { ...o, ...fields };
      touched.push(updated);
      return updated;
    });
    commitOrders(next);
    let failed = 0;
    touched.forEach(o => {
      if (!backendOn()) return;
      BE().upsertOrder(o).catch(() => {
        failed++;
        if (failed === 1) alert('No se pudieron guardar todos los pedidos del cliente. Revisá tu conexión y reintentá.');
      });
    });
    if (!backendOn()) writeLS('vc-orders', next);
  }, [commitOrders]);

  /* ── mutaciones de catálogo ── */
  const saveProduct = useCallback(async (p) => {
    const norm = D._normalize(p);
    if (backendOn()) {
      await BE().saveProduct(norm);
      await D.loadFromBackend();
    } else {
      const list = readLS('vc-products', D._base) || D._base;
      const i = list.findIndex(x => x.id === norm.id);
      writeLS('vc-products', i >= 0 ? list.map(x => x.id === norm.id ? norm : x) : [...list, norm]);
    }
    await reloadCatalog();
  }, [reloadCatalog]);

  const deleteProduct = useCallback(async (id) => {
    if (backendOn()) { await BE().deleteProduct(id); await D.loadFromBackend(); }
    else writeLS('vc-products', (readLS('vc-products', D._base) || D._base).filter(p => p.id !== id));
    await reloadCatalog();
  }, [reloadCatalog]);

  const saveBanner = useCallback(async (b) => {
    if (backendOn()) { await BE().saveBanner(b); await D.loadFromBackend(); }
    else {
      const list = readLS('vc-banners', []);
      const i = list.findIndex(x => x.id === b.id);
      writeLS('vc-banners', i >= 0 ? list.map(x => x.id === b.id ? b : x) : [...list, b]);
    }
    await reloadCatalog();
  }, [reloadCatalog]);

  const deleteBanner = useCallback(async (id) => {
    if (backendOn()) { await BE().deleteBanner(id); await D.loadFromBackend(); }
    else writeLS('vc-banners', readLS('vc-banners', []).filter(b => b.id !== id));
    await reloadCatalog();
  }, [reloadCatalog]);

  const saveCode = useCallback(async (c) => {
    if (backendOn()) { await BE().saveCode(c); await D.loadFromBackend(); }
    else {
      const list = readLS('vc-codes', defaultCodes());
      const i = list.findIndex(x => x.id === c.id);
      writeLS('vc-codes', i >= 0 ? list.map(x => x.id === c.id ? c : x) : [...list, c]);
    }
    await reloadCatalog();
  }, [reloadCatalog]);

  const deleteCode = useCallback(async (id) => {
    if (backendOn()) { await BE().deleteCode(id); await D.loadFromBackend(); }
    else writeLS('vc-codes', readLS('vc-codes', defaultCodes()).filter(c => c.id !== id));
    await reloadCatalog();
  }, [reloadCatalog]);

  const saveConfig = useCallback(async (cfg) => {
    if (backendOn()) await BE().saveConfig(cfg);
    else writeLS('vc-config', cfg);
    await D.loadFromBackend();
    setConfig({ ...CONFIG_DEFAULT, ...cfg });
  }, []);

  return {
    orders, products, banners, codes, config, secure,
    me, meLoading, users, userEmail, can,
    reloadOrders, reloadCatalog, reloadUsers,
    addOrder, patchOrder, updateOrderStatus, deleteOrder,
    updateOrderRemito, updateOrderPayments, updateOrderCreditNotes, updateCustomerInfo,
    createUser, updateUser, deleteUser,
    saveProduct, deleteProduct, saveBanner, deleteBanner, saveCode, deleteCode, saveConfig,
  };
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
      } catch {
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

/* Sesión válida pero sin permisos cargados: la persona se autenticó, pero nadie
   le dio acceso al panel todavía (o se lo dieron de baja). */
function AdminSinAcceso({ store, onLogout }) {
  return (
    <div className="adm-login">
      <div className="adm-login__box" style={{ textAlign: 'center' }}>
        <IcoShield size={34} />
        <h2 style={{ fontSize: 24, margin: '14px 0 10px' }}>Acceso no habilitado</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.6, margin: '0 0 8px' }}>
          Iniciaste sesión como <strong>{store.userEmail}</strong>, pero ese usuario todavía no tiene
          permisos asignados en el panel.
        </p>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.6, margin: '0 0 22px' }}>
          Pedile a un administrador que te dé de alta en <strong>Usuarios</strong>.
        </p>
        <button className="adm-btn adm-btn--primary" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

/* ═══════════ Períodos (dashboard y facturación) ═══════════ */
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function monthKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${MESES[parseInt(m, 10) - 1]} ${y}`;
}
function monthLabelShort(ym) {
  const [y, m] = ym.split('-');
  return `${MESES[parseInt(m, 10) - 1].slice(0, 3)} ${y}`;
}
/* Límites [from, to] del período elegido. null = histórico completo. */
function periodBounds(periodo) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  if (periodo === 'todo') return null;
  if (periodo === 'mes-actual')   return { from: new Date(y, m, 1).getTime(), to: new Date(y, m + 1, 1).getTime() - 1 };
  if (periodo === 'mes-anterior') return { from: new Date(y, m - 1, 1).getTime(), to: new Date(y, m, 1).getTime() - 1 };
  if (periodo === 'ult-30')       return { from: Date.now() - 30 * 24 * 3600 * 1000, to: Date.now() };
  if (periodo === 'anio')         return { from: new Date(y, 0, 1).getTime(), to: new Date(y + 1, 0, 1).getTime() - 1 };
  if (/^\d{4}-\d{2}$/.test(periodo)) {
    const [yy, mm] = periodo.split('-').map(Number);
    return { from: new Date(yy, mm - 1, 1).getTime(), to: new Date(yy, mm, 1).getTime() - 1 };
  }
  return null;
}
function periodoLabel(periodo) {
  if (periodo === 'todo') return 'Histórico total';
  if (periodo === 'mes-actual') return 'Mes en curso';
  if (periodo === 'mes-anterior') return 'Mes anterior';
  if (periodo === 'ult-30') return 'Últimos 30 días';
  if (periodo === 'anio') return 'Año en curso';
  if (/^\d{4}-\d{2}$/.test(periodo)) return monthLabel(periodo);
  return '';
}

/* Barra de chips de período, compartida por el resumen y la facturación. */
function PeriodFilter({ periodo, onChange, months }) {
  const opts = [
    ['mes-actual', 'Este mes'], ['mes-anterior', 'Mes anterior'],
    ['ult-30', 'Últimos 30 días'], ['anio', 'Este año'], ['todo', 'Todo'],
  ];
  return (
    <div className="adm-panel">
      <div className="adm-bar">
        <span className="adm-chiprow__lbl">Período:</span>
        <div className="adm-chiprow">
          {opts.map(([v, l]) => (
            <button key={v} className={`adm-fchip${periodo === v ? ' on' : ''}`} onClick={() => onChange(v)}>{l}</button>
          ))}
          {months.length > 0 && (
            <>
              <span className="adm-chiprow__lbl" style={{ marginLeft: 10 }}>Mes:</span>
              {months.slice(0, 6).map(ym => (
                <button key={ym} className={`adm-fchip${periodo === ym ? ' on' : ''}`} onClick={() => onChange(ym)}>
                  {monthLabelShort(ym)}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.VcoreAdminKit.periods = { monthKey, monthLabel, monthLabelShort, periodBounds, periodoLabel, PeriodFilter, MESES };
window.VcoreAdminKit.STATUSES = STATUSES;
window.VcoreAdminKit.STATUS_COLORS = STATUS_COLORS;

/* ═══════════════════ Dashboard ═══════════════════════════ */
function AdminDashboard({ store, onNav }) {
  const [periodo, setPeriodo] = useState('mes-actual');

  const months = useMemo(() => {
    const set = new Set();
    (store.orders || []).forEach(o => set.add(monthKey(o.ts)));
    return Array.from(set).sort().reverse();
  }, [store.orders]);

  const bounds = useMemo(() => periodBounds(periodo), [periodo]);
  const filtered = useMemo(() => {
    if (!bounds) return store.orders;
    return store.orders.filter(o => {
      const t = Number(o.ts) || 0;
      return t >= bounds.from && t <= bounds.to;
    });
  }, [store.orders, bounds]);

  /* Los pedidos anulados no cuentan para facturación. */
  const vigentes  = filtered.filter(o => o.status !== 'anulado');
  const facturado = vigentes.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const cobrado   = vigentes.reduce((s, o) => s + Math.min(paidOf(o), Number(o.total) || 0), 0);
  const porCobrar = Math.max(facturado - cobrado, 0);
  const manualCount = filtered.filter(o => o.origen === 'manual').length;
  const webCount    = filtered.length - manualCount;
  const recientes   = filtered.slice(0, 6);
  const nuevos      = store.orders.filter(o => (o.status || 'nuevo') === 'nuevo').length;

  const visibles  = store.products.filter(p => p.visible !== false).length;
  const activos   = store.banners.filter(b => b.active !== false).length;
  const lbl = periodoLabel(periodo);

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Panel</div>
            <h1>Resumen</h1>
            <div className="adm-head__sub">Vista general del estado del negocio.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="adm-btn adm-btn--outline" href="#/">Ver sitio ↗</a>
            {store.can('remitos.crear') && (
              <button className="adm-btn adm-btn--primary" onClick={() => onNav('orders')}>
                <IcoPlus size={14} /> Nuevo remito
              </button>
            )}
          </div>
        </div>
      </div>

      <PeriodFilter periodo={periodo} onChange={setPeriodo} months={months} />

      <div className="adm-stats">
        <div className="adm-stat">
          <h4>Productos</h4>
          <p className="sv">{visibles}<span className="adm-stat__den">/{store.products.length}</span></p>
          <p className="adm-stat__desc">Visibles en el catálogo</p>
        </div>
        <div className="adm-stat">
          <h4>Banners activos</h4>
          <p className="sv">{activos}<span className="adm-stat__den">/{store.banners.length}</span></p>
          <p className="adm-stat__desc">Rotando en el home</p>
        </div>
        <div className="adm-stat">
          <h4>Pedidos</h4>
          <p className="sv">{filtered.length}</p>
          <p className="adm-stat__desc">{webCount} web + {manualCount} manual · {lbl}</p>
        </div>
        <div className="adm-stat">
          <h4>Por cobrar</h4>
          <p className="sv" style={{ color: porCobrar > 0 ? '#B71C1C' : 'var(--text-brand)' }}>{fmt(porCobrar)}</p>
          <p className="adm-stat__desc">Saldo pendiente · {lbl}</p>
        </div>
      </div>

      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="adm-stat">
          <h4>Facturado</h4><p className="sv">{fmt(facturado)}</p>
          <p className="adm-stat__desc">{vigentes.length} pedido{vigentes.length !== 1 ? 's' : ''} vigente{vigentes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="adm-stat">
          <h4>Cobrado</h4><p className="sv" style={{ color: 'var(--text-brand)' }}>{fmt(cobrado)}</p>
          <p className="adm-stat__desc">Pagos recibidos · {lbl}</p>
        </div>
        <div className="adm-stat">
          <h4>Ticket promedio</h4>
          <p className="sv">{vigentes.length ? fmt(facturado / vigentes.length) : '—'}</p>
          <p className="adm-stat__desc">Por pedido del período</p>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel__hd">
          <h3>Últimos pedidos</h3>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onNav('orders')}>Ver todos</button>
        </div>
        {recientes.length === 0 ? (
          <div className="adm-empty">
            <IcoCart size={36} />
            <div>Sin pedidos en este período.</div>
          </div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead><tr>
                <th>N° Remito</th><th>Fecha</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th>
              </tr></thead>
              <tbody>
                {recientes.map(o => (
                  <tr key={o.id}>
                    <td className="mono">
                      <strong>{(o.remito && o.remito.numero) || '—'}</strong>
                      <div style={{ fontSize: 9.5, color: 'var(--ink-400)' }}>{o.id}</div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                      {new Date(o.ts).toLocaleDateString('es-AR')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.customerName || '—'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{o.customerCity || ''}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{(o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0)} u.</td>
                    <td className="num">{fmt(o.total)}</td>
                    <td><span className={`adm-chip ${STATUS_COLORS[o.status] || 'adm-chip--nuevo'}`}>{o.status || 'nuevo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="adm-quick">
        {nuevos > 0 && store.can('pedidos.ver') && (
          <button onClick={() => onNav('orders')}>
            <IcoCart size={15} /> {nuevos} pedido{nuevos > 1 ? 's' : ''} sin gestionar
          </button>
        )}
        {store.can('productos.ver')    && <button onClick={() => onNav('products')}><IcoBox size={15} /> Gestionar productos</button>}
        {store.can('banners.ver')      && <button onClick={() => onNav('banners')}><IcoImage size={15} /> Editar banners</button>}
        {store.can('pagos.ver')        && <button onClick={() => onNav('cuenta')}><IcoWallet size={15} /> Control de pagos</button>}
        {store.can('facturacion.ver')  && <button onClick={() => onNav('facturacion')}><IcoChart size={15} /> Facturación</button>}
        {store.can('config.editar')    && <button onClick={() => onNav('config')}><IcoCog size={15} /> Configuración</button>}
      </div>
    </div>
  );
}

/* ═══════════════════ Productos ═══════════════════════════ */
function emptyProduct() {
  return { id: '', name: '', sub: '', category: D.categories[1] || 'Bienestar',
    badge: '', blurb: '', tone: 'green', photo: '',
    visible: true, featured: false, rating: 4.8, reviews: 0 };
}

/* Deriva las filas de variantes (presentación + precios) desde un producto,
   sea nuevo (variants), legacy (sizes + price) o vacío. */
function productToVariants(p) {
  if (p && Array.isArray(p.variants) && p.variants.length) {
    return p.variants.map(v => ({
      label: v.label || '',
      price: v.price != null ? v.price : 0,
      priceMayorista: v.priceMayorista != null ? v.priceMayorista : 0,
    }));
  }
  if (p && p.sizes && p.sizes.length) {
    return p.sizes.map(label => ({ label, price: p.price != null ? p.price : 0, priceMayorista: 0 }));
  }
  return [{ label: '', price: 0, priceMayorista: 0 }];
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
  function addVariant() { setVariants(vs => [...vs, { label: '', price: 0, priceMayorista: 0 }]); }
  function removeVariant(i) { setVariants(vs => vs.length > 1 ? vs.filter((_, idx) => idx !== i) : vs); }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      let url;
      if (backendOn() && BE().cloudinaryOn()) url = await BE().uploadImage(file);
      else url = await fileToDataUrl(file);
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
      .map(v => ({
        label: String(v.label).trim(),
        price: parseFloat(v.price) || 0,
        priceMayorista: parseFloat(v.priceMayorista) || 0,
      }))
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

          {/* Presentaciones con precio minorista y mayorista */}
          <div className="adm-field">
            <label>Presentaciones y precios</label>
            <div className="adm-var-list">
              <div className="adm-var-head">
                <span>Presentación / peso</span><span>Minorista ($)</span><span>Mayorista ($)</span><span></span>
              </div>
              {variants.map((v, i) => (
                <div className="adm-var-row" key={i}>
                  <input value={v.label} onChange={e => setVariant(i, 'label', e.target.value)}
                    placeholder="Ej. 300 gr · 120 caps" />
                  <input type="number" min={0} value={v.price}
                    onChange={e => setVariant(i, 'price', e.target.value)} placeholder="0" />
                  <input type="number" min={0} value={v.priceMayorista}
                    onChange={e => setVariant(i, 'priceMayorista', e.target.value)} placeholder="opcional" />
                  <button type="button" className="adm-var-del" onClick={() => removeVariant(i)}
                    disabled={variants.length === 1} aria-label="Quitar presentación">
                    <IcoTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
            <span className="adm-field__hint">
              El precio mayorista es opcional y solo lo usa la remitera del panel al elegir la lista
              mayorista. La tienda siempre cotiza con el minorista.
            </span>
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

function AdminProducts({ store }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const puedeEditar = store.can('productos.editar');

  const shown = store.products.filter(p =>
    !q || [p.name, p.sub, p.category].some(t => t && searchNormalize(t).includes(searchNormalize(q)))
  );

  async function save(p) {
    try { await store.saveProduct(p); }
    catch (e) { alert('No se pudo guardar: ' + (e.message || e)); return; }
    setEditing(null); setCreating(false);
  }
  async function del(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await store.deleteProduct(id); } catch (e) { alert('No se pudo eliminar: ' + (e.message || e)); }
  }
  async function toggle(p, field) {
    try { await store.saveProduct({ ...p, [field]: !p[field] }); }
    catch (e) { alert('No se pudo actualizar: ' + (e.message || e)); }
  }
  async function importBase() {
    if (!backendOn()) { alert('La importación requiere tener el backend configurado.'); return; }
    if (!confirm('Se importarán los productos de ejemplo al catálogo en la nube. ¿Continuar?')) return;
    setBusy(true);
    try {
      await BE().importProducts(D._base.map(p => D._normalize(p)));
      await D.loadFromBackend(); await store.reloadCatalog();
      alert('Catálogo de ejemplo importado.');
    } catch (e) { alert('No se pudo importar: ' + (e.message || e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Gestión</div>
            <h1>Productos</h1>
            <div className="adm-head__sub">{store.products.length} productos en el catálogo.</div>
          </div>
          {puedeEditar && (
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
          )}
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
        <div className="adm-tblwrap">
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
                  <td className="num">
                    {D.hasPriceRange(p) && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: 'var(--ink-400)' }}>Desde </span>}
                    {fmt(p.price)}
                  </td>
                  <td><Switch on={p.visible !== false} onChange={() => puedeEditar && toggle(p, 'visible')} /></td>
                  <td><Switch on={!!p.featured} onChange={() => puedeEditar && toggle(p, 'featured')} /></td>
                  <td>
                    {puedeEditar && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(p)}>
                          <IcoEdit size={13} />
                        </button>
                        <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(p.id)}>
                          <IcoTrash size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || creating) && (
        <ProductEditor product={editing} onSave={save}
          onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </div>
  );
}

/* ═══════════════════ Banners ═════════════════════════════ */
function emptyBanner() {
  return { id: '', eyebrow: '', title: '', subtitle: '', ctaLabel: '', ctaHref: '#/tienda',
    photo: '', bg: 'var(--gradient-ink-bloom)', active: true, sort: 0 };
}
const BG_PRESETS = [
  { label: 'Ink bloom (marca oscura)', value: 'var(--gradient-ink-bloom)' },
  { label: 'Verde oscuro → menta',     value: 'linear-gradient(130deg, #0b2d1c 0%, #0d3d25 40%, #156638 72%, #1e8a4e 100%)' },
  { label: 'Green bloom',              value: 'var(--gradient-green-bloom)' },
  { label: 'Sage bloom',               value: 'var(--gradient-sage-bloom)' },
  { label: 'Paper bloom (claro)',      value: 'var(--gradient-paper-bloom)' },
];

function BannerEditor({ banner, onSave, onClose }) {
  const [b, setB] = useState(banner || emptyBanner());
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  function f(k) { return e => setB(v => ({ ...v, [k]: e.target.value })); }
  async function handleFile(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    setBusy(true);
    try {
      const url = (backendOn() && BE().cloudinaryOn()) ? await BE().uploadImage(file) : await fileToDataUrl(file);
      setB(v => ({ ...v, photo: url }));
    } catch (err) { alert('No se pudo subir: ' + err.message); }
    finally { setBusy(false); e.target.value = ''; }
  }
  function save() {
    if (!b.title.trim()) { alert('El banner necesita un título.'); return; }
    onSave({ ...b, id: b.id || uid(), sort: parseInt(b.sort, 10) || 0 });
  }
  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal__hd">
          <h3>{banner ? 'Editar banner' : 'Nuevo banner'}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          <div className="adm-field">
            <label>Imagen del banner (opcional)</label>
            <div className="adm-img-edit">
              <div className="adm-img-preview">
                {b.photo ? <img src={b.photo} alt="preview" /> : <div className="adm-img-ph">Sin imagen<br/><span>se usa fondo de color</span></div>}
              </div>
              <div className="adm-img-actions">
                <button type="button" className="adm-btn adm-btn--outline adm-btn--sm" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
                  <IcoDown size={13} /> {busy ? 'Procesando…' : 'Subir imagen'}
                </button>
                {b.photo && <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => setB(v => ({ ...v, photo: '' }))}>Quitar</button>}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              </div>
            </div>
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Eyebrow (chip superior)</label>
              <input value={b.eyebrow} onChange={f('eyebrow')} placeholder="Ej. Nutrición & Rendimiento" />
            </div>
            <div className="adm-field"><label>Orden</label>
              <input type="number" value={b.sort} onChange={f('sort')} min={0} />
            </div>
          </div>
          <div className="adm-field"><label>Título principal</label>
            <input value={b.title} onChange={f('title')} placeholder="Ej. Más rendimiento, menos complicaciones." />
          </div>
          <div className="adm-field"><label>Subtítulo / descripción</label>
            <textarea value={b.subtitle} onChange={f('subtitle')} rows={2} />
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Texto del botón</label>
              <input value={b.ctaLabel} onChange={f('ctaLabel')} placeholder="Ver productos" />
            </div>
            <div className="adm-field"><label>Link del botón</label>
              <input value={b.ctaHref} onChange={f('ctaHref')} placeholder="#/tienda" />
            </div>
          </div>
          <div className="adm-field"><label>Fondo</label>
            <select value={b.bg} onChange={f('bg')}>
              {BG_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <Switch on={b.active !== false} onChange={v => setB(x => ({ ...x, active: v }))} label="Activo (visible en la home)" />
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn--primary" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AdminBanners({ store }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const puedeEditar = store.can('banners.editar');

  async function save(b) {
    try { await store.saveBanner(b); } catch (e) { alert('No se pudo guardar: ' + e.message); return; }
    setEditing(null); setCreating(false);
  }
  async function del(id) {
    if (!confirm('¿Eliminar este banner?')) return;
    try { await store.deleteBanner(id); } catch (e) { alert('No se pudo eliminar: ' + e.message); }
  }
  async function toggle(b) {
    try { await store.saveBanner({ ...b, active: !b.active }); } catch (e) { alert('No se pudo actualizar: ' + e.message); }
  }
  const activos = store.banners.filter(b => b.active !== false).length;

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Home</div><h1>Banners del hero</h1>
            <div className="adm-head__sub">
              {activos} activo{activos !== 1 ? 's' : ''} · rotan automáticamente cada 6 segundos.
            </div>
          </div>
          {puedeEditar && (
            <button className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
              <IcoPlus size={15} /> Nuevo banner
            </button>
          )}
        </div>
      </div>
      <div className="adm-panel">
        {store.banners.length === 0 ? (
          <div className="adm-empty"><IcoImage size={32} /><div>Sin banners cargados. Si no hay ninguno activo, el home usa los banners por defecto.</div></div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead><tr><th>Vista previa</th><th>Título</th><th>Botón</th><th>Orden</th><th>Activo</th><th></th></tr></thead>
              <tbody>
                {[...store.banners].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ width: 88, height: 44, borderRadius: 8, background: b.bg, backgroundSize: 'cover',
                        backgroundImage: b.photo ? `url(${b.photo})` : undefined, backgroundPosition: 'center' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{b.eyebrow}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{b.ctaLabel || <span style={{ color: 'var(--ink-400)' }}>—</span>}</td>
                    <td className="num">{b.sort ?? 0}</td>
                    <td><Switch on={b.active !== false} onChange={() => puedeEditar && toggle(b)} /></td>
                    <td>
                      {puedeEditar && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(b)}><IcoEdit size={13} /></button>
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(b.id)}><IcoTrash size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(editing || creating) && (
        <BannerEditor banner={editing} onSave={save} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </div>
  );
}

/* ═══════════════ Códigos de descuento ════════════════════ */
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

function AdminCodes({ store }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const puedeEditar = store.can('descuentos.editar');

  async function save(c) {
    try { await store.saveCode(c); } catch (e) { alert('No se pudo guardar: ' + (e.message || e)); return; }
    setEditing(null); setCreating(false);
  }
  async function del(id) {
    if (!confirm('¿Eliminar este código?')) return;
    try { await store.deleteCode(id); } catch (e) { alert('No se pudo eliminar: ' + (e.message || e)); }
  }
  async function toggle(c) {
    try { await store.saveCode({ ...c, active: !c.active }); } catch (e) { alert('No se pudo actualizar: ' + (e.message || e)); }
  }

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div><div className="adm-eye">Gestión</div><h1>Códigos de descuento</h1></div>
          {puedeEditar && (
            <button className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
              <IcoPlus size={15} /> Nuevo código
            </button>
          )}
        </div>
      </div>
      <div className="adm-panel">
        {store.codes.length === 0 ? (
          <div className="adm-empty"><IcoTag size={32} /><div>Sin códigos. Creá el primero.</div></div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead><tr><th>Código</th><th>Descuento</th><th>Nota</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {store.codes.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '.05em' }}>{c.code}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-brand)' }}>{c.value}%</td>
                    <td style={{ fontSize: 13, color: 'var(--ink-500)' }}>{c.note}</td>
                    <td><Switch on={c.active} onChange={() => puedeEditar && toggle(c)} /></td>
                    <td>
                      {puedeEditar && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(c)}><IcoEdit size={13} /></button>
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(c.id)}><IcoTrash size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(editing || creating) && (
        <CodeEditor code={editing} onSave={save} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </div>
  );
}

/* ═══════════════════ Configuración ═══════════════════════ */
function AdminConfig({ store }) {
  const [cfg, setCfg] = useState(() => ({ ...CONFIG_DEFAULT, ...store.config }));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  function f(k) { return e => setCfg(v => ({ ...v, [k]: e.target.value })); }

  useEffect(() => { setCfg({ ...CONFIG_DEFAULT, ...store.config }); }, [store.config]);

  async function save() {
    setBusy(true);
    try {
      await store.saveConfig(cfg);
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
            <span className="adm-field__hint">
              Formato: código de país + número sin espacios ni +. Ej: 5491123456789
            </span>
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>Dirección</label>
              <input value={cfg.address} onChange={f('address')} placeholder="Buenos Aires, Argentina" />
            </div>
            <div className="adm-field"><label>Email de contacto</label>
              <input value={cfg.email} onChange={f('email')} placeholder="hola@vcore.com.ar" />
            </div>
          </div>
          <div className="adm-field"><label>Instagram</label>
            <input value={cfg.instagram} onChange={f('instagram')} placeholder="https://instagram.com/vcorenutri" />
          </div>
        </div>
      </div>

      {/* Lo que imprime el remito: sin esto el pie sale vacío. */}
      <div className="adm-panel">
        <div className="adm-panel__hd"><h3>Datos que imprime el remito</h3></div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="adm-field-row">
            <div className="adm-field"><label>Banco</label>
              <input value={cfg.banco || ''} onChange={f('banco')} placeholder="Ej. Galicia" />
            </div>
            <div className="adm-field"><label>Alias de transferencia</label>
              <input value={cfg.alias || ''} onChange={f('alias')} placeholder="Ej. VCORE.NUTRI" />
            </div>
          </div>
          <div className="adm-field-row">
            <div className="adm-field"><label>CUIT / CUIL</label>
              <input value={cfg.cuit || ''} onChange={f('cuit')} placeholder="20-12345678-9" />
            </div>
            <div className="adm-field"><label>Titular de la cuenta</label>
              <input value={cfg.titular || ''} onChange={f('titular')} placeholder="Nombre y apellido" />
            </div>
          </div>
          <div className="adm-field"><label>Punto de retiro</label>
            <textarea rows={2} value={cfg.retiro || ''} onChange={f('retiro')}
              placeholder={'RETIRO EN LOCAL\nCalle 123, Ciudad · Lun a Vie 9 a 18 hs'} />
            <span className="adm-field__hint">
              Se completa como domicilio de entrega al elegir "Retiro en local" en un remito.
            </span>
          </div>
          <div className="adm-field"><label>Leyenda del remito</label>
            <input value={cfg.remito_leyenda || ''} onChange={f('remito_leyenda')}
              placeholder="Frase o aclaración que va al pie del remito" />
          </div>
          <div className="adm-field"><label>Texto por defecto de "Datos de despacho"</label>
            <input value={cfg.remito_despacho || ''} onChange={f('remito_despacho')}
              placeholder="DESPACHO PRODUCTO FINAL" />
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

/* ═══════════════════ Shell ═══════════════════════════════ */
const NAV = [
  { id: 'dashboard',   label: 'Resumen',          icon: IcoGrid },
  { id: 'products',    label: 'Productos',        icon: IcoBox },
  { id: 'banners',     label: 'Banners',          icon: IcoImage },
  { id: 'orders',      label: 'Pedidos',          icon: IcoCart, badge: 'nuevos' },
  { id: 'clientes',    label: 'Clientes',         icon: IcoUsers },
  { id: 'cuenta',      label: 'Control de pagos', icon: IcoWallet },
  { id: 'facturacion', label: 'Facturación',      icon: IcoChart },
  { id: 'codes',       label: 'Descuentos',       icon: IcoTag },
  { id: 'usuarios',    label: 'Usuarios',         icon: IcoShield },
  { id: 'config',      label: 'Configuración',    icon: IcoCog },
];

function AdminPage({ onExit }) {
  injectAdmin();
  const secure = backendOn();
  const [auth, setAuth] = useState(() => secure ? false : sessionStorage.getItem('vc-admin') === '1');
  const [userEmail, setUserEmail] = useState('');
  const [checking, setChecking] = useState(secure);
  const [section, setSection] = useState('dashboard');

  /* sesión real (Supabase) o demo (sessionStorage) */
  useEffect(() => {
    if (!secure) return;
    let unsub = () => {};
    BE().currentUser().then(u => {
      setAuth(!!u); setUserEmail(u ? u.email : ''); setChecking(false);
    });
    unsub = BE().onAuthChange(u => { setAuth(!!u); setUserEmail(u ? u.email : ''); });
    return unsub;
  }, [secure]);

  const store = useAdminStore({ auth, userEmail });

  function logout() {
    if (secure) BE().logout(); else sessionStorage.removeItem('vc-admin');
    setAuth(false); setUserEmail('');
    if (onExit) onExit();
  }

  if (checking || (auth && store.meLoading)) {
    return <div className="adm-login"><div className="adm-login__box" style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--ink-500)', fontSize: 14 }}>Cargando…</div>
    </div></div>;
  }
  if (!auth) return <AdminLogin onAuth={() => setAuth(true)} />;
  if (!store.me) return <AdminSinAcceso store={store} onLogout={logout} />;

  const Base = window.VcoreDesignSystem_8ff97c?.Logo;
  const nuevos = store.orders.filter(o => (o.status || 'nuevo') === 'nuevo').length;
  const items = NAV.filter(it => store.can(window.VC_SECTION_PERM[it.id]));
  const S = window.VcoreAdminSections;

  /* Además de ocultar el ítem del menú, se bloquea el acceso a la sección. */
  let content;
  if (!store.can(window.VC_SECTION_PERM[section] || '__desconocido')) {
    content = (
      <div className="adm-panel" style={{ padding: '60px 40px', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, margin: '0 0 8px' }}>
          Sección no disponible
        </h3>
        <p style={{ color: 'var(--ink-500)', margin: '0 0 18px', fontSize: 14 }}>
          Tu usuario no tiene permiso para entrar a esta sección. Pedile acceso a un administrador.
        </p>
        {items[0] && (
          <button className="adm-btn adm-btn--primary" onClick={() => setSection(items[0].id)}>
            Ir a {items[0].label}
          </button>
        )}
      </div>
    );
  } else if (section === 'dashboard') content = <AdminDashboard store={store} onNav={setSection} />;
  else if (section === 'products')    content = <AdminProducts store={store} />;
  else if (section === 'banners')     content = <AdminBanners store={store} />;
  else if (section === 'codes')       content = <AdminCodes store={store} />;
  else if (section === 'config')      content = <AdminConfig store={store} />;
  else if (S[section])                content = React.createElement(S[section], { store, onNav: setSection });
  else content = (
    <div className="adm-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--ink-500)' }}>
      Esta sección todavía no está disponible.
    </div>
  );

  const rolLabel = (window.VC_ROLE_INFO[store.me.rol] || {}).label || store.me.rol;

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-side__logo">
          {Base && <Base variant="wordmark" tone="paper" height={26} />}
          {!Base && <strong style={{ color: '#fff', fontFamily: 'var(--font-display)' }}>VCORE</strong>}
          <span>Admin Panel</span>
        </div>
        <nav className="adm-nav">
          {items.map(({ id, label, icon: Ic, badge }) => (
            <button key={id} className={`adm-nav__item${section === id ? ' on' : ''}`}
              onClick={() => setSection(id)}>
              <Ic size={16} />
              {label}
              {badge === 'nuevos' && nuevos > 0 && <span className="adm-nav__badge">{nuevos}</span>}
            </button>
          ))}
        </nav>
        <div className="adm-side__out">
          <div className="adm-side__who">
            <strong>{store.me.nombre || store.userEmail || 'Modo demo'}</strong>
            {rolLabel}
          </div>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>

      <div className="adm-main">{content}</div>
    </div>
  );
}

window.VcoreAdminPage = AdminPage;
