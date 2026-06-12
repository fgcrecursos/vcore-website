/* @ds-bundle: {"format":3,"namespace":"VcoreDesignSystem_8ff97c","components":[{"name":"Badge","sourcePath":"components/badge/Badge.jsx"},{"name":"Tag","sourcePath":"components/badge/Tag.jsx"},{"name":"BrandIcon","sourcePath":"components/brand-icon/BrandIcon.jsx"},{"name":"Button","sourcePath":"components/button/Button.jsx"},{"name":"Card","sourcePath":"components/card/Card.jsx"},{"name":"Eyebrow","sourcePath":"components/eyebrow/Eyebrow.jsx"},{"name":"Field","sourcePath":"components/input/Field.jsx"},{"name":"Input","sourcePath":"components/input/Input.jsx"},{"name":"Logo","sourcePath":"components/logo/Logo.jsx"},{"name":"StatRing","sourcePath":"components/stat/StatRing.jsx"}],"sourceHashes":{"components/badge/Badge.jsx":"a9ad91bf86ea","components/badge/Tag.jsx":"0dbc5577b646","components/brand-icon/BrandIcon.jsx":"a26eadd7b37d","components/button/Button.jsx":"e240596fde6e","components/card/Card.jsx":"adbb5b0e41b1","components/eyebrow/Eyebrow.jsx":"1d6ac2979674","components/input/Field.jsx":"2f365abf0de0","components/input/Input.jsx":"0e40cc854c47","components/logo/Logo.jsx":"d581487b8d88","components/stat/StatRing.jsx":"6514659b0f1d","ui_kits/website/app.jsx":"b89e37500eb9","ui_kits/website/cart.jsx":"fe3b00567857","ui_kits/website/data.jsx":"9d06e59dfee6","ui_kits/website/icons.jsx":"a52194e200ad","ui_kits/website/pages.jsx":"c0cf017db8fa","ui_kits/website/shell.jsx":"df8ef1f53ef1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VcoreDesignSystem_8ff97c = window.VcoreDesignSystem_8ff97c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/badge/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-badge {
  display: inline-flex; align-items: center; gap: var(--space-1);
  font-family: var(--font-body); font-weight: var(--weight-bold);
  letter-spacing: .01em; line-height: 1; border-radius: var(--radius-pill);
  border: 1px solid transparent; white-space: nowrap;
}
.vc-badge--md { font-size: var(--text-xs); padding: 5px 11px; }
.vc-badge--sm { font-size: var(--text-2xs); padding: 3px 8px; }
.vc-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
`;
const TONES = {
  green: ['--green-700', '--green-100', '--green-500'],
  navy: ['--navy-500', '--navy-100', '--navy-500'],
  sage: ['--ink-800', '--sage-100', '--sage-500'],
  neutral: ['--ink-700', '--paper-100', '--paper-300'],
  success: ['--green-700', '--green-100', '--green-500'],
  warning: ['#9A6A12', '#FBEFD6', '--warning-500'],
  danger: ['#8E2E22', '#F8E3DF', '--danger-500']
};
const cv = t => t && t.startsWith('--') ? `var(${t})` : t;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Badge({
  children,
  tone = 'green',
  variant = 'soft',
  size = 'md',
  dot = false,
  className = '',
  ...rest
}) {
  useStyle('vc-badge-css', CSS);
  const [fg, soft, solid] = TONES[tone] || TONES.green;
  let style = {};
  if (variant === 'solid') style = {
    background: cv(solid),
    color: 'var(--paper-000)'
  };else if (variant === 'outline') style = {
    background: 'transparent',
    color: cv(fg),
    borderColor: cv(solid)
  };else style = {
    background: cv(soft),
    color: cv(fg)
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `vc-badge vc-badge--${size} ${className}`,
    style: style
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "vc-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badge/Badge.jsx", error: String((e && e.message) || e) }); }

// components/badge/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-tag {
  display: inline-flex; align-items: center; gap: var(--space-2);
  font-family: var(--font-body); font-weight: var(--weight-medium);
  font-size: var(--text-sm); line-height: 1; color: var(--ink-800);
  background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-sm); padding: 7px 12px; white-space: nowrap;
}
.vc-tag--active { background: var(--green-050); border-color: var(--green-400); color: var(--green-800); }
.vc-tag__x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%; cursor: pointer;
  color: var(--ink-500); background: transparent; border: 0; padding: 0;
  transition: background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.vc-tag__x:hover { background: var(--paper-200); color: var(--ink-900); }
.vc-tag__x svg { width: 11px; height: 11px; }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Tag({
  children,
  active = false,
  onRemove,
  className = '',
  ...rest
}) {
  useStyle('vc-tag-css', CSS);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `vc-tag ${active ? 'vc-tag--active' : ''} ${className}`
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "vc-tag__x",
    "aria-label": "Quitar",
    onClick: onRemove
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badge/Tag.jsx", error: String((e && e.message) || e) }); }

// components/brand-icon/BrandIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function assetBase() {
  if (typeof window !== 'undefined' && window.__VCORE_ASSET_BASE__) return window.__VCORE_ASSET_BASE__;
  return '/assets/';
}
const NAMES = ['flexibilidad', 'continuidad', 'vitalidad'];
const TONES = ['ink', 'green', 'white'];
const ASPECT = {
  flexibilidad: 0.946,
  continuidad: 1.067,
  vitalidad: 0.699
};

/**
 * The three official Vcore graphic icons (real artwork, do not modify):
 * Flexibilidad, Continuidad, Vitalidad.
 */
function BrandIcon({
  name = 'flexibilidad',
  tone = 'ink',
  size = 48,
  label = false,
  className = '',
  style,
  ...rest
}) {
  const n = NAMES.includes(name) ? name : 'flexibilidad';
  const t = TONES.includes(tone) ? tone : 'ink';
  const src = `${assetBase()}icon-${n}-${t}.png`;
  const img = /*#__PURE__*/React.createElement("img", _extends({
    src: src,
    alt: n,
    className: label ? '' : className,
    style: {
      height: size,
      width: 'auto',
      display: 'block',
      ...(label ? {} : style)
    }
  }, label ? {} : rest));
  if (!label) return img;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: size * 0.28,
      ...style
    }
  }, rest), img, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontStyle: 'italic',
      fontWeight: 500,
      fontSize: 'var(--text-sm)',
      color: 'var(--ink-700)',
      textTransform: 'capitalize'
    }
  }, n));
}
BrandIcon.NAMES = NAMES;
BrandIcon.ASPECT = ASPECT;
Object.assign(__ds_scope, { BrandIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand-icon/BrandIcon.jsx", error: String((e && e.message) || e) }); }

// components/button/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-btn {
  --_bg: var(--action-bg);
  --_bgh: var(--action-bg-hover);
  --_bga: var(--action-bg-active);
  --_fg: var(--action-fg);
  --_bd: transparent;
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  font-family: var(--font-display); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight); line-height: 1;
  border: var(--border-medium) solid var(--_bd); border-radius: var(--radius-pill);
  background: var(--_bg); color: var(--_fg);
  cursor: pointer; white-space: nowrap; text-decoration: none;
  transition: background var(--duration-fast) var(--ease-standard),
              transform var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard);
}
.vc-btn:hover { background: var(--_bgh); }
.vc-btn:active { background: var(--_bga); transform: translateY(1px); }
.vc-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.vc-btn[disabled], .vc-btn[aria-disabled="true"] {
  opacity: .45; pointer-events: none;
}
.vc-btn--md { height: 44px; padding: 0 var(--space-6); font-size: var(--text-base); }
.vc-btn--sm { height: 34px; padding: 0 var(--space-4); font-size: var(--text-sm); }
.vc-btn--lg { height: 54px; padding: 0 var(--space-8); font-size: var(--text-lg); }
.vc-btn--block { display: flex; width: 100%; }

.vc-btn--ink {
  --_bg: var(--action-ink-bg); --_bgh: var(--action-ink-bg-hover);
  --_bga: var(--action-ink-bg-active); --_fg: var(--paper-000);
}
.vc-btn--outline {
  --_bg: transparent; --_bgh: var(--green-050); --_bga: var(--green-100);
  --_fg: var(--green-700); --_bd: var(--green-500);
}
.vc-btn--ghost {
  --_bg: transparent; --_bgh: var(--paper-100); --_bga: var(--paper-200);
  --_fg: var(--ink-900);
}
.vc-btn__icon { display: inline-flex; width: 1.15em; height: 1.15em; }
.vc-btn__icon svg { width: 100%; height: 100%; display: block; }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  as = 'button',
  className = '',
  ...rest
}) {
  useStyle('vc-btn-css', CSS);
  const Tag = as;
  const cls = ['vc-btn', `vc-btn--${size}`, variant !== 'primary' ? `vc-btn--${variant}` : '', fullWidth ? 'vc-btn--block' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    className: "vc-btn__icon"
  }, iconLeft), children, iconRight && /*#__PURE__*/React.createElement("span", {
    className: "vc-btn__icon"
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/button/Button.jsx", error: String((e && e.message) || e) }); }

// components/card/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-card {
  background: var(--surface-card); border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle); overflow: hidden;
  transition: transform var(--duration-base) var(--ease-standard),
              box-shadow var(--duration-base) var(--ease-standard),
              border-color var(--duration-base) var(--ease-standard);
}
.vc-card--elevated { border-color: transparent; box-shadow: var(--shadow-md); }
.vc-card--outline  { box-shadow: none; border-color: var(--border-default); }
.vc-card--interactive { cursor: pointer; }
.vc-card--interactive:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: transparent; }
.vc-card__body--sm { padding: var(--space-4); }
.vc-card__body--md { padding: var(--space-6); }
.vc-card__body--lg { padding: var(--space-8); }
.vc-card__body--none { padding: 0; }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Card({
  children,
  variant = 'surface',
  interactive = false,
  padding = 'md',
  className = '',
  ...rest
}) {
  useStyle('vc-card-css', CSS);
  const mod = variant === 'elevated' ? ' vc-card--elevated' : variant === 'outline' ? ' vc-card--outline' : '';
  const cls = `vc-card${mod}${interactive ? ' vc-card--interactive' : ''} ${className}`;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: `vc-card__body--${padding}`
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/card/Card.jsx", error: String((e && e.message) || e) }); }

// components/eyebrow/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-eyebrow-c {
  display: inline-flex; align-items: center; gap: var(--space-3);
  font-family: var(--font-body); font-weight: var(--weight-bold);
  font-size: var(--text-xs); letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase; color: var(--text-brand);
}
.vc-eyebrow-c__dash { width: 26px; height: 3px; border-radius: 2px; background: currentColor; }
.vc-eyebrow-c--ondark { color: var(--green-400); }
.vc-eyebrow-c--ink { color: var(--ink-700); }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Eyebrow({
  children,
  tone = 'brand',
  withDash = true,
  className = '',
  ...rest
}) {
  useStyle('vc-eyebrow-css', CSS);
  const mod = tone === 'onDark' ? ' vc-eyebrow-c--ondark' : tone === 'ink' ? ' vc-eyebrow-c--ink' : '';
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `vc-eyebrow-c${mod} ${className}`
  }, rest), withDash && /*#__PURE__*/React.createElement("span", {
    className: "vc-eyebrow-c__dash"
  }), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/eyebrow/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/input/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-field { display: flex; flex-direction: column; gap: var(--space-2); }
.vc-field__label {
  font-family: var(--font-body); font-weight: var(--weight-semibold);
  font-size: var(--text-sm); color: var(--ink-900);
}
.vc-field__req { color: var(--green-600); margin-left: 2px; }
.vc-field__msg { font-size: var(--text-xs); color: var(--ink-500); }
.vc-field__msg--error { color: var(--danger-500); font-weight: var(--weight-medium); }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Field({
  label,
  required = false,
  helper,
  error,
  htmlFor,
  children,
  className = '',
  ...rest
}) {
  useStyle('vc-field-css', CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `vc-field ${className}`
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    className: "vc-field__label",
    htmlFor: htmlFor
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "vc-field__req"
  }, "*")), children, error ? /*#__PURE__*/React.createElement("span", {
    className: "vc-field__msg vc-field__msg--error"
  }, error) : helper ? /*#__PURE__*/React.createElement("span", {
    className: "vc-field__msg"
  }, helper) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/input/Field.jsx", error: String((e && e.message) || e) }); }

// components/input/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-input-wrap { position: relative; display: flex; align-items: center; }
.vc-input {
  width: 100%; font-family: var(--font-body); font-size: var(--text-base);
  color: var(--ink-900); background: var(--surface-card);
  border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  padding: 0 var(--space-4); height: 46px; box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
}
.vc-input::placeholder { color: var(--ink-500); }
.vc-input:hover { border-color: var(--paper-400); }
.vc-input:focus { outline: none; border-color: var(--green-500); box-shadow: var(--shadow-focus); }
.vc-input--sm { height: 38px; font-size: var(--text-sm); }
.vc-input--lg { height: 54px; font-size: var(--text-lg); }
.vc-input--invalid { border-color: var(--danger-500); }
.vc-input--invalid:focus { box-shadow: 0 0 0 3px rgba(200,80,62,.28); }
.vc-input--has-icon { padding-left: 42px; }
.vc-input__icon { position: absolute; left: 14px; display: inline-flex; color: var(--ink-500); pointer-events: none; }
.vc-input__icon svg { width: 18px; height: 18px; display: block; }
.vc-input[disabled] { background: var(--paper-100); color: var(--ink-500); cursor: not-allowed; }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function Input({
  size = 'md',
  invalid = false,
  iconLeft,
  className = '',
  ...rest
}) {
  useStyle('vc-input-css', CSS);
  const cls = ['vc-input', size !== 'md' ? `vc-input--${size}` : '', invalid ? 'vc-input--invalid' : '', iconLeft ? 'vc-input--has-icon' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", {
    className: "vc-input-wrap"
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    className: "vc-input__icon"
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    className: cls,
    "aria-invalid": invalid || undefined
  }, rest)));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/input/Input.jsx", error: String((e && e.message) || e) }); }

// components/logo/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Resolve where the brand PNGs live. Defaults to project-root /assets/.
   A host page can override via window.__VCORE_ASSET_BASE__ (e.g. "../../assets/"). */
function assetBase() {
  if (typeof window !== 'undefined' && window.__VCORE_ASSET_BASE__) return window.__VCORE_ASSET_BASE__;
  return '/assets/';
}
const TONES = ['white', 'ink', 'green', 'navy', 'paper'];
const ASPECT = {
  wordmark: 3.495,
  isotipo: 0.968
};

/**
 * Renders the OFFICIAL Vcore artwork (do not modify). `wordmark` is the full
 * "Vcore®" lockup; `isotipo` is the standalone V®. Both are the real logo files,
 * recolored per `tone`.
 */
function Logo({
  variant = 'wordmark',
  tone = 'ink',
  height,
  alt = 'Vcore',
  className = '',
  style,
  ...rest
}) {
  const v = variant === 'isotipo' ? 'isotipo' : 'wordmark';
  const t = TONES.includes(tone) ? tone : 'ink';
  const h = height || (v === 'isotipo' ? 40 : 30);
  const src = `${assetBase()}vcore-${v}-${t}.png`;
  return /*#__PURE__*/React.createElement("img", _extends({
    src: src,
    alt: alt,
    className: className,
    style: {
      height: h,
      width: 'auto',
      display: 'block',
      ...style
    }
  }, rest));
}
Logo.ASPECT = ASPECT;
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/logo/Logo.jsx", error: String((e && e.message) || e) }); }

// components/stat/StatRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.vc-stat {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; border-radius: 50%; aspect-ratio: 1; box-sizing: border-box;
  border: 2px solid var(--green-500); color: var(--green-700);
  font-family: var(--font-body);
}
.vc-stat--filled { background: var(--green-500); border-color: var(--green-500); color: var(--paper-000); }
.vc-stat--soft   { background: var(--green-050); }
.vc-stat--navy   { border-color: var(--navy-500); color: var(--navy-500); }
.vc-stat__value { font-family: var(--font-display); font-weight: var(--weight-black);
  letter-spacing: -.02em; line-height: 1; }
.vc-stat__label { font-weight: var(--weight-semibold); text-transform: uppercase;
  letter-spacing: .1em; opacity: .85; margin-top: .35em; }
`;
function useStyle(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
function StatRing({
  value,
  label,
  size = 104,
  variant = 'outline',
  tone = 'green',
  className = '',
  ...rest
}) {
  useStyle('vc-stat-css', CSS);
  const mod = variant === 'filled' ? ' vc-stat--filled' : variant === 'soft' ? ' vc-stat--soft' : '';
  const toneMod = tone === 'navy' ? ' vc-stat--navy' : '';
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `vc-stat${mod}${toneMod} ${className}`,
    style: {
      width: size,
      height: size
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "vc-stat__value",
    style: {
      fontSize: size * 0.30
    }
  }, value), label && /*#__PURE__*/React.createElement("span", {
    className: "vc-stat__label",
    style: {
      fontSize: size * 0.092
    }
  }, label));
}
Object.assign(__ds_scope, { StatRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stat/StatRing.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.BrandIcon = __ds_scope.BrandIcon;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.StatRing = __ds_scope.StatRing;

})();
