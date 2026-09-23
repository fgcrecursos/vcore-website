/* Vcore website — pages: HeroBanner, Home, Shop, Product, SearchOverlay, AdminPage. */
const React = window.React;
const { useState, useEffect, useRef } = React;
const { Button, Badge, Card, StatRing, Eyebrow, Tag } = window.VcoreDesignSystem_8ff97c;
const I = window.VcoreIcons;
const D = window.VcoreData;
const ProductImage = window.VcoreProductImage;

const PAGE_CSS = `
/* ---- Reveal al entrar en viewport ---- */
.vc-reveal { opacity: 0; transform: translateY(26px);
  transition: opacity .75s cubic-bezier(.2,.8,.2,1), transform .75s cubic-bezier(.2,.8,.2,1); }
.vc-reveal.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .vc-reveal { opacity: 1; transform: none; transition: none; }
}

/* ---- Hero: campo de color + foto + pack flotante, en capas con parallax ---- */
.vc-banner { position: relative; overflow: hidden; isolation: isolate; min-height: 780px; background: var(--ink-950); }
.vc-slide { position: absolute; inset: 0; opacity: 0;
  transition: opacity .8s cubic-bezier(.4,0,.2,1); pointer-events: none; }
.vc-slide.active { opacity: 1; pointer-events: auto; }
.vc-hero__field { position: absolute; inset: 0; will-change: transform; }
.vc-hero__mark { position: absolute; right: -190px; top: -150px; width: 860px; opacity: .055;
  pointer-events: none; will-change: transform; z-index: 1; }
.vc-hero__label { position: absolute; left: 44px; top: 50%; transform: translateY(-50%) rotate(180deg);
  writing-mode: vertical-rl; font-size: 11.5px; font-weight: 700; letter-spacing: .32em;
  text-transform: uppercase; color: rgba(255,255,255,.45); z-index: 4; }
.vc-hero__photo { position: absolute; right: 60px; top: 122px; width: 432px; height: 610px;
  border-radius: 26px; overflow: hidden; box-shadow: 0 50px 110px rgba(0,0,0,.5);
  z-index: 2; will-change: transform; }
.vc-hero__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vc-hero__pack { position: absolute; right: 374px; top: 442px; width: 262px; height: 330px;
  border-radius: 20px; background: #F2F1EF; box-shadow: 0 40px 80px rgba(0,0,0,.42);
  display: flex; align-items: center; justify-content: center; z-index: 3; will-change: transform; }
.vc-hero__pack img { width: 86%; height: 86%; object-fit: contain; display: block; }
/* Ojo: estos bloques también llevan .vc-wrap, así que el padding se declara por
   eje para no pisar el padding lateral del contenedor. */
.vc-hero__inner { position: relative; z-index: 4; min-height: 780px; display: flex;
  flex-direction: column; justify-content: center; padding-top: 130px; padding-bottom: 56px;
  box-sizing: border-box; }
.vc-hero__copy { width: min(620px, 100%); color: #fff; }
.vc-hero__l1, .vc-hero__l2, .vc-hero__l3 { display: block; }
.vc-hero__l1, .vc-hero__l3 { font-family: var(--font-display); font-weight: 200;
  font-size: clamp(32px, 4.3vw, 62px); line-height: 1; letter-spacing: -.025em; }
.vc-hero__l1 { color: rgba(255,255,255,.9); }
.vc-hero__l2 { font-family: var(--font-display); font-weight: 800;
  font-size: clamp(56px, 7.5vw, 108px); line-height: .92; letter-spacing: -.05em;
  color: #fff; margin: 2px 0 2px -6px; }
.vc-hero__l3 { color: var(--green-300); }
.vc-hero__copy p { font-size: 17px; line-height: 1.65; color: rgba(255,255,255,.74);
  margin: 30px 0 0; max-width: 400px; }
.vc-hero__ctas { display: flex; gap: 12px; margin-top: 34px; flex-wrap: wrap; }
.vc-hero__btn { display: inline-flex; align-items: center; gap: 10px; height: 54px; padding: 0 30px;
  border-radius: var(--radius-pill); background: #fff; color: #0B3327; border: 0; cursor: pointer;
  font-family: var(--font-body); font-size: 15px; font-weight: 700;
  transition: transform .18s ease, box-shadow .18s ease; }
.vc-hero__btn:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(0,0,0,.28); }
.vc-hero__btn--ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,.4); }
.vc-hero__btn--ghost:hover { background: rgba(255,255,255,.12); }
.vc-hero__stats { margin-top: auto; padding-top: 22px; width: min(620px, 100%);
  border-top: 1px solid rgba(255,255,255,.16); display: flex; gap: 52px; }
.vc-hero__stat-v { font-family: var(--font-display); font-weight: 600; font-size: 22px;
  color: #fff; line-height: 1; }
.vc-hero__stat-l { margin-top: 6px; font-size: 11px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: rgba(255,255,255,.5); }
.vc-hero__cue { position: absolute; right: 28px; bottom: 56px; display: flex; align-items: center;
  gap: 12px; z-index: 5; font-size: 11px; font-weight: 700; letter-spacing: .2em;
  text-transform: uppercase; color: rgba(255,255,255,.5); }
.vc-hero__cue i { display: block; width: 52px; height: 1px; background: rgba(255,255,255,.35); }
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
  letter-spacing: -.025em; margin: 0; }

/* ---- Benefits: editorial, sin tarjetas — ícono grande + divisor, como el catálogo ---- */
.vc-ben { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.vc-ben__item { text-align: center; padding: 0 8px; }
.vc-ben__icon { position: relative; width: 76px; height: 76px; border-radius: 50%;
  background: var(--gradient-green-bloom); color: #fff;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 22px;
  overflow: hidden; box-shadow: var(--shadow-md); }
.vc-ben__icon::after { content: ""; position: absolute; inset: 0; background: var(--vignette-soft); }
.vc-ben__icon svg { position: relative; z-index: 1; }
.vc-ben h3 { font-family: var(--font-display); font-weight: 800; font-size: 21px;
  letter-spacing: -.01em; margin: 0 0 12px; }
.vc-ben__div { width: 22px; height: 2px; background: var(--green-300); margin: 0 auto 14px; border-radius: 2px; }
.vc-ben p { font-size: 14.5px; color: var(--ink-700); margin: 0 auto; line-height: 1.6; max-width: 30ch; }

/* ---- Volume tiers ---- */
.vc-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
  background: var(--paper-200); border-radius: var(--radius-xl); overflow: hidden; }
.vc-tier { background: var(--surface-card); padding: 26px 22px; position: relative; }
.vc-tier__flag { position: absolute; top: 14px; right: 14px; font-size: 12px; font-weight: 800;
  padding: 3px 10px; border-radius: var(--radius-pill); }
.vc-tier__flag--plain { background: var(--paper-200); color: var(--ink-600); }
.vc-tier__flag--mid { background: var(--green-100); color: var(--green-700); }
.vc-tier__flag--top { background: var(--gradient-green-bloom); color: #fff; }
.vc-tier__name { font-family: var(--font-display); font-weight: 800; font-size: 22px;
  margin: 0 0 4px; letter-spacing: -.01em; }
.vc-tier__from { font-size: 13px; color: var(--ink-500); margin: 0 0 16px; }
.vc-tier__perk { display: flex; align-items: center; gap: 8px; font-size: 14px;
  color: var(--ink-700); margin-bottom: 7px; }
.vc-tier__perk svg { color: var(--green-600); flex: none; }

/* ---- Cómo comprar: pasos en línea de tiempo que avanzan solos + panel que cambia ---- */
.vc-how { position: relative; overflow: hidden; isolation: isolate; background: #0B0E0C; color: #F1F5F2; }
.vc-how::before { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 56%;
  background: radial-gradient(80% 70% at 70% 50%, #14402B 0%, #0E2A1E 45%, rgba(11,14,12,0) 80%);
  pointer-events: none; z-index: 0; }
.vc-how__inner { position: relative; z-index: 1; padding-top: 104px; padding-bottom: 104px;
  display: grid; grid-template-columns: minmax(0, 1fr) 500px; gap: 88px; align-items: center; }
.vc-how h2 { margin: 0; font-family: var(--font-display); line-height: .94; }
.vc-how__l1 { display: block; font-weight: 200; font-size: clamp(34px, 3.9vw, 56px);
  letter-spacing: -.025em; color: rgba(255,255,255,.88); }
.vc-how__l2 { display: block; font-weight: 800; font-size: clamp(52px, 6.4vw, 92px);
  letter-spacing: -.05em; color: #fff; margin-left: -4px; }
.vc-how__steps { list-style: none; margin: 48px 0 0; padding: 0; }
.vc-how__step { position: relative; display: grid; grid-template-columns: 56px minmax(0, 1fr);
  gap: 24px; padding-bottom: 30px; }
.vc-how__step:last-child { padding-bottom: 0; }
.vc-how__track { position: absolute; left: 27px; top: 62px; bottom: 6px; width: 2px;
  background: rgba(91,183,131,.22); border-radius: 2px; overflow: hidden; }
.vc-how__fill { position: absolute; left: 0; top: 0; width: 100%; height: 0; background: var(--green-500); }
.vc-how__step.is-done .vc-how__fill { height: 100%; }
.vc-how__step.is-on .vc-how__fill { animation: vcHowFill var(--vc-how-ms, 5000ms) linear forwards; }
.vc-how.is-paused .vc-how__step.is-on .vc-how__fill { animation-play-state: paused; }
@keyframes vcHowFill { from { height: 0; } to { height: 100%; } }
.vc-how__num { width: 56px; height: 56px; border-radius: 50%; box-sizing: border-box;
  border: 1.5px solid rgba(255,255,255,.3); background: transparent; color: rgba(255,255,255,.8);
  display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;
  font-family: var(--font-display); font-weight: 600; font-size: 18px;
  transition: background .35s ease, border-color .35s ease, color .35s ease, box-shadow .35s ease; }
.vc-how__step.is-done .vc-how__num { border-color: var(--green-500); color: var(--green-300); }
.vc-how__step.is-on .vc-how__num { background: var(--green-500); border-color: var(--green-500);
  color: #fff; font-weight: 700; box-shadow: 0 0 0 8px rgba(55,167,105,.16); }
.vc-how__txt { display: block; padding: 6px 0 0; cursor: pointer; text-align: left; background: none;
  border: 0; color: inherit; font: inherit; }
.vc-how__txt h3 { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 24px;
  letter-spacing: -.015em; color: rgba(255,255,255,.72); transition: color .35s ease; }
.vc-how__step.is-on .vc-how__txt h3 { color: #fff; }
.vc-how__txt p { margin: 8px 0 0; font-size: 15px; line-height: 1.65; color: rgba(255,255,255,.58);
  max-width: 440px; }
.vc-how__cta { display: flex; align-items: center; gap: 16px; margin-top: 44px; flex-wrap: wrap; }
.vc-how__btn { display: inline-flex; align-items: center; gap: 10px; height: 54px; padding: 0 28px;
  border-radius: var(--radius-pill); background: var(--green-500); color: #fff; border: 0; cursor: pointer;
  font-family: var(--font-display); font-size: 16px; font-weight: 700;
  transition: transform .18s ease, box-shadow .18s ease; }
.vc-how__btn:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(0,0,0,.35); }
.vc-how__cta span { font-size: 13px; color: rgba(255,255,255,.55); }

/* panel derecho: una escena por paso, con fundido */
.vc-how__stage { position: relative; height: 640px; }
.vc-how__scene { position: absolute; left: 30px; right: 30px; top: 40px; opacity: 0;
  transform: translateY(18px) scale(.98); pointer-events: none;
  transition: opacity .55s ease, transform .55s cubic-bezier(.2,.8,.2,1); }
.vc-how__scene.is-on { opacity: 1; transform: none; }
.vc-how__card { border-radius: 28px; background: #111917; border: 1px solid rgba(255,255,255,.1);
  box-shadow: 0 60px 120px rgba(0,0,0,.55); overflow: hidden; }
.vc-how__cardhd { display: flex; align-items: center; gap: 14px; padding: 20px 24px;
  background: #1A2421; border-bottom: 1px solid rgba(255,255,255,.06); }
.vc-how__av { width: 42px; height: 42px; border-radius: 50%; background: var(--green-800); color: #fff;
  display: flex; align-items: center; justify-content: center; flex: none; }
.vc-how__av img { width: 24px; }
.vc-how__cardhd b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.vc-how__cardhd small { display: block; margin-top: 2px; font-size: 12px; color: var(--green-300); }
.vc-how__body { padding: 26px 24px 30px; display: flex; flex-direction: column; gap: 14px; }
.vc-how__line { display: flex; align-items: center; gap: 14px; }
.vc-how__thumb { width: 54px; height: 66px; border-radius: 10px; background: #F2F1EF; flex: none;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
.vc-how__thumb img { width: 88%; height: 88%; object-fit: contain; }
.vc-how__line-n { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.vc-how__line-s { font-size: 12.5px; color: rgba(255,255,255,.55); margin-top: 2px; }
.vc-how__line-p { margin-left: auto; font-family: var(--font-display); font-weight: 700; font-size: 15px;
  white-space: nowrap; }
.vc-how__total { display: flex; justify-content: space-between; align-items: baseline;
  border-top: 1px solid rgba(255,255,255,.1); padding-top: 16px; margin-top: 4px;
  font-size: 13px; color: rgba(255,255,255,.6); }
.vc-how__total b { font-family: var(--font-display); font-size: 22px; color: #fff; }
.vc-how__fakebtn { height: 46px; border-radius: var(--radius-pill); background: var(--green-500);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: var(--font-display); font-weight: 700; font-size: 14.5px; color: #fff; }
.vc-how__msg { max-width: 300px; padding: 15px 18px; font-size: 14px; line-height: 1.55; }
.vc-how__msg--out { align-self: flex-end; border-radius: 18px 18px 4px 18px; background: #1C5436; color: #EFF8F2; }
.vc-how__msg--in { align-self: flex-start; border-radius: 18px 18px 18px 4px; background: #202C29; color: #E2E8E4; }
.vc-how__msg time { display: block; text-align: right; font-size: 11px; opacity: .55; margin-top: 4px; }
.vc-how__opt { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 16px;
  border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); }
.vc-how__opt.is-main { border-color: rgba(55,167,105,.55); background: rgba(55,167,105,.1); }
.vc-how__opt-ic { width: 42px; height: 42px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.06); color: var(--green-300); }
.vc-how__route { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,.65); }
.vc-how__route i { flex: 1; height: 0; border-top: 2px dashed rgba(91,183,131,.5); }
.vc-how__pack { position: absolute; border-radius: 18px; background: #F2F1EF; z-index: 2;
  display: flex; align-items: center; justify-content: center; box-shadow: 0 40px 80px rgba(0,0,0,.5);
  overflow: hidden; transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.vc-how__pack img { width: 88%; height: 88%; object-fit: contain; }
.vc-how__pack--a { right: -14px; bottom: -20px; width: 160px; height: 200px; }
.vc-how__pack--b { left: -6px; bottom: -22px; width: 132px; height: 166px; }
@media (prefers-reduced-motion: reduce) {
  .vc-how__scene, .vc-how__pack { transition: none; }
  .vc-how__step.is-on .vc-how__fill { animation: none; height: 100%; }
}

/* ---- Product grid ---- */
.vc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
.vc-grid--3 { grid-template-columns: repeat(3, 1fr); }
.vc-grid--2 { grid-template-columns: repeat(2, 1fr); }
.vc-pcard { position: relative; cursor: pointer; background: transparent; border: 0;
  transition: transform .24s cubic-bezier(.2,.8,.2,1); }
.vc-pcard:hover { transform: translateY(-6px); }
.vc-pcard__plate { position: relative; background: #F2F1EF; border-radius: 20px;
  overflow: hidden; border-bottom: 6px solid var(--green-500);
  transition: box-shadow .24s ease; }
.vc-pcard:hover .vc-pcard__plate { box-shadow: 0 26px 52px rgba(19,22,21,.18); }
.vc-pcard__plate--green { border-bottom-color: var(--green-500); }
.vc-pcard__plate--navy  { border-bottom-color: var(--info-500); }
.vc-pcard__plate--coral { border-bottom-color: var(--coral-500); }
.vc-pcard__plate--sage  { border-bottom-color: var(--sage-500); }
.vc-pcard__plate--paper { border-bottom-color: var(--paper-400); }
.vc-pcard__body { padding: 16px 2px 0; }
.vc-pc__name { font-family: var(--font-display); font-weight: 800; font-size: 20px;
  letter-spacing: -.01em; margin: 0 0 2px; line-height: 1.15; }
.vc-pc__sub { font-size: 13px; color: var(--ink-500); margin: 0 0 10px; }
.vc-pc__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.vc-pc__price { font-family: var(--font-display); font-weight: 800; font-size: 20px; }
.vc-pc__from { font-family: var(--font-body); font-weight: 600; font-size: 11px;
  color: var(--ink-500); letter-spacing: 0; }
.vc-rating { display: inline-flex; align-items: center; gap: 5px;
  color: var(--ink-600); font-size: 13px; font-weight: 600; }
.vc-rating svg { color: var(--warning-500); }

/* ---- Mission band: full-bleed, tipografía grande al estilo Instagram ---- */
.vc-band-outer { position: relative; background: var(--gradient-ink-bloom); color: #EAF0EC;
  overflow: hidden; isolation: isolate; margin: 96px 0; }
.vc-band-outer::after { content: ""; position: absolute; inset: 0; background: var(--vignette);
  pointer-events: none; z-index: 0; }
.vc-band { position: relative; z-index: 1; padding: 88px 0;
  display: grid; grid-template-columns: 1.1fr .9fr; gap: 56px; align-items: center; }
.vc-band h2 { font-family: var(--font-display); font-weight: 800; font-size: clamp(34px, 4vw, 56px);
  letter-spacing: -.025em; line-height: .98; margin: 0; }
.vc-band h2 em { font-style: italic; font-weight: 600; color: var(--green-400); }
.vc-band p { color: rgba(255,255,255,.72); font-size: 17px; line-height: 1.7; margin: 0 0 16px; }
.vc-band__frame { aspect-ratio: 4 / 3.4; overflow: hidden; border-radius: var(--radius-2xl);
  box-shadow: 0 24px 60px rgba(0,0,0,.35); }
.vc-band__photo { width: 100%; height: 100%; object-fit: cover; display: block; will-change: transform; }
@media (max-width: 760px) { .vc-band { grid-template-columns: 1fr; gap: 22px; padding: 56px 0; } .vc-band__frame { aspect-ratio: 16 / 10; } }

/* ---- Líneas: campo de color conmutable con packs en parallax ---- */
.vc-lineas { position: relative; overflow: hidden; isolation: isolate; color: #fff; }
.vc-lineas__field { position: absolute; inset: 0; opacity: 0; transition: opacity .7s ease; }
.vc-lineas__field.on { opacity: 1; }
.vc-lineas__ghost { position: absolute; right: 40px; top: 28px; will-change: transform; font-family: var(--font-display);
  font-weight: 800; font-size: 210px; line-height: .8; letter-spacing: -.06em;
  color: rgba(255,255,255,.07); pointer-events: none; z-index: 2; }
.vc-lineas__inner { position: relative; z-index: 3; padding-top: 92px; }
.vc-lineas__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.vc-lineas h2 { font-family: var(--font-display); font-weight: 800;
  font-size: clamp(36px, 5vw, 72px); line-height: .94; letter-spacing: -.045em; margin: 0; }
.vc-lineas p { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,.76);
  margin: 24px 0 0; max-width: 430px; }
.vc-lineas__cta { display: inline-flex; align-items: center; gap: 10px; margin-top: 30px;
  height: 52px; padding: 0 28px; border-radius: var(--radius-pill); background: #fff;
  color: #10352A; border: 0; cursor: pointer; font-family: var(--font-body);
  font-size: 15px; font-weight: 700; transition: transform .18s ease; }
.vc-lineas__cta:hover { transform: translateY(-2px); }
.vc-lineas__packs { position: relative; height: 430px; }
.vc-lineas__pack { position: absolute; border-radius: 18px; background: #F2F1EF;
  display: flex; align-items: center; justify-content: center; will-change: transform;
  box-shadow: 0 32px 64px rgba(0,0,0,.36); }
.vc-lineas__pack img { width: 88%; height: 88%; object-fit: contain; display: block; }
.vc-lineas__rail { position: relative; z-index: 3; display: flex; gap: 2px; padding: 40px 0 56px; }
.vc-lineas__rail button { flex: 1; text-align: left; background: none; cursor: pointer;
  padding: 20px 24px 18px; border: 0; border-top: 2px solid rgba(255,255,255,.22);
  color: rgba(255,255,255,.58); font-family: var(--font-display);
  transition: color .25s ease, border-color .25s ease; }
.vc-lineas__rail button.on { border-top-color: #fff; color: #fff; }
.vc-lineas__rail-n { font-weight: 600; font-size: 13px; letter-spacing: .12em; }
.vc-lineas__rail-t { margin-top: 7px; font-weight: 600; font-size: 19px; letter-spacing: -.01em; }

/* ---- Laboratorio: Pureza · Balance · Transparencia ---- */
.vc-lab { position: relative; overflow: hidden; isolation: isolate; color: #fff;
  background: radial-gradient(100% 80% at 82% 110%, #14402B 0%, #0E2A1E 36%, #0B0E0C 74%); }
.vc-lab__ghost { position: absolute; width: 320px; opacity: .05; pointer-events: none;
  will-change: transform; z-index: 1; }
.vc-lab__inner { position: relative; z-index: 3; padding-top: 96px; padding-bottom: 96px; }
.vc-lab__head { display: grid; grid-template-columns: 1fr 440px; gap: 48px; align-items: start; }
.vc-lab h2 { font-family: var(--font-display); font-weight: 800; font-size: clamp(36px, 5vw, 72px);
  line-height: .94; letter-spacing: -.045em; margin: 0; }
.vc-lab__photo { border-radius: 22px; overflow: hidden; height: 248px;
  box-shadow: 0 40px 80px rgba(0,0,0,.45); }
.vc-lab__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vc-lab__caption { margin: 16px 0 0; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,.66); }
.vc-lab__cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 76px; }
.vc-lab__icon { width: 54px; height: auto; display: block; }
.vc-lab h3 { font-family: var(--font-display); font-weight: 700; font-size: 28px;
  letter-spacing: -.02em; margin: 24px 0 0; }
.vc-lab__div { width: 26px; height: 2px; background: var(--green-500); margin: 16px 0; }
.vc-lab__cols p { font-size: 15.5px; line-height: 1.7; color: rgba(255,255,255,.68); margin: 0; }
.vc-lab__foot { margin-top: 64px; padding-top: 26px; border-top: 1px solid rgba(255,255,255,.14);
  display: flex; align-items: center; gap: 24px; font-size: 13.5px; color: rgba(255,255,255,.55); }

/* ---- PDP inmersiva ---- */
.vc-pdp2 { display: grid; grid-template-columns: 54% 46%; min-height: 720px; }
.vc-pdp2__art { position: relative; overflow: hidden; display: flex;
  align-items: center; justify-content: center; padding: 64px 0; }
.vc-pdp2__ghost { position: absolute; left: -24px; top: 40px; writing-mode: vertical-rl;
  font-family: var(--font-display); font-weight: 800; font-size: 180px; line-height: .8;
  letter-spacing: -.06em; color: rgba(255,255,255,.16); pointer-events: none; z-index: 1; }
.vc-pdp2__plate { position: relative; z-index: 3; width: min(400px, 74%); aspect-ratio: 4 / 5;
  border-radius: 24px; background: #F2F1EF; box-shadow: 0 50px 100px rgba(16,28,24,.42);
  display: flex; align-items: center; justify-content: center; will-change: transform; }
.vc-pdp2__plate img { width: 90%; height: 90%; object-fit: contain; display: block; }
.vc-pdp2__back { position: absolute; left: 40px; top: 36px; z-index: 4; display: inline-flex;
  align-items: center; gap: 10px; color: #fff; font-size: 11.5px; font-weight: 700;
  letter-spacing: .24em; text-transform: uppercase; background: none; border: 0; cursor: pointer; }
.vc-pdp2__circles { position: absolute; left: 40px; bottom: 40px; display: flex; gap: 10px; z-index: 4; }
.vc-pdp2__circle { width: 64px; height: 64px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,.6); display: flex; flex-direction: column;
  align-items: center; justify-content: center; color: #fff; }
.vc-pdp2__circle b { font-family: var(--font-display); font-weight: 700; font-size: 15px; line-height: 1; }
.vc-pdp2__circle span { font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; margin-top: 3px; }
.vc-pdp2__panel { padding: 72px 56px 72px 64px; display: flex; flex-direction: column; }
.vc-pdp2__panel h1 { font-family: var(--font-display); font-weight: 800;
  font-size: clamp(38px, 4.4vw, 60px); line-height: .95; letter-spacing: -.045em; margin: 0; }

/* ---- Shop ---- */
.vc-shop-head { display: flex; align-items: flex-end; gap: 32px; padding: 68px 0 0; }
.vc-shop-head h1 { font-family: var(--font-display); font-weight: 800;
  font-size: clamp(42px, 6vw, 86px); line-height: .92; letter-spacing: -.05em; margin: 0; }
.vc-shop-head p { width: 330px; flex: none; font-size: 16px; line-height: 1.65;
  color: var(--ink-600); margin: 0 0 12px; }
@media (max-width: 860px) {
  .vc-shop-head { flex-direction: column; align-items: flex-start; gap: 16px; padding-top: 36px; }
  .vc-shop-head p { width: auto; }
}
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
  .vc-banner { min-height: 0; }
  .vc-slide { position: relative; }
  .vc-slide:not(.active) { display: none; }
  .vc-hero__mark, .vc-hero__label, .vc-hero__cue { display: none; }
  .vc-hero__photo { position: relative; right: auto; top: auto; width: 100%; height: 300px;
    border-radius: 0; box-shadow: none; transform: none !important; }
  .vc-hero__pack { right: 14px; top: 160px; width: 132px; height: 166px; border-radius: 14px; }
  .vc-hero__inner { min-height: 0; padding-top: 30px; padding-bottom: 40px;
    transform: none !important; opacity: 1 !important; }
  .vc-hero__copy p { font-size: 15.5px; }
  .vc-hero__stats { gap: 26px; margin-top: 34px; }
  .vc-banner__arr { display: none; }
  .vc-banner__dots { bottom: 16px; }

  /* líneas + laboratorio + pdp */
  .vc-lineas__grid { grid-template-columns: 1fr; gap: 28px; }
  .vc-lineas__inner { padding-top: 56px; }
  .vc-lineas__ghost { font-size: 120px; right: 16px; }
  .vc-lineas__packs { height: 300px; }
  .vc-lineas__rail { flex-direction: column; gap: 0; padding: 28px 0 44px; }
  .vc-lab__inner { padding-top: 56px; padding-bottom: 56px; }
  .vc-lab__head { grid-template-columns: 1fr; gap: 28px; }
  .vc-lab__cols { grid-template-columns: 1fr; gap: 32px; margin-top: 44px; }
  .vc-lab__foot { flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 40px; }
  .vc-lab__ghost { display: none; }
  .vc-pdp2 { grid-template-columns: 1fr; min-height: 0; }
  .vc-pdp2__art { padding: 72px 0 48px; }
  .vc-pdp2__ghost { font-size: 110px; left: -14px; }
  .vc-pdp2__panel { padding: 36px 20px 56px; }

  /* sections */
  .vc-section { padding: 40px 0; }
  .vc-section__head { flex-direction: column; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
  .vc-section__head h2 { font-size: 27px; }

  /* grids → 1 col */
  .vc-ben, .vc-tiers { grid-template-columns: 1fr; }
  .vc-how__inner { grid-template-columns: 1fr; gap: 40px; padding-top: 64px; padding-bottom: 72px; }
  .vc-how::before { width: 100%; top: 45%; }
  .vc-how__stage { height: 580px; }
  .vc-how__scene { left: 0; right: 0; top: 10px; }
  .vc-how__pack--a { width: 110px; height: 138px; right: -4px; }
  .vc-how__pack--b { width: 96px; height: 120px; left: -4px; }
  .vc-grid, .vc-grid--3, .vc-grid--2 { grid-template-columns: repeat(2, 1fr); gap: 12px; }

  /* mission band */
  .vc-band-outer { margin: 56px 0; }

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

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch (e) { return false; }
}

/* Posición de scroll en px, throttleada por rAF. Devuelve 0 si el usuario
   pidió menos movimiento, así todas las capas quedan quietas. */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setY(window.scrollY || window.pageYOffset || 0);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

/* Desplazamiento relativo al centro de la sección: 0 cuando la sección está
   centrada en el viewport, negativo antes y positivo después. Así las capas
   quedan en su posición de diseño justo cuando la sección se está mirando. */
function useSectionScroll(ref) {
  /* useScrollY solo se usa para re-renderizar en cada cuadro de scroll; la
     posición se mide en vivo para no quedar desfasada cuando cargan imágenes
     o el catálogo del backend y la sección se corre. */
  useScrollY();
  if (!ref.current || prefersReducedMotion()) return 0;
  const r = ref.current.getBoundingClientRect();
  return window.innerHeight / 2 - (r.top + r.height / 2);
}

function useRevealAll(dep) {
  useEffect(() => {
    const els = document.querySelectorAll('.vc-reveal:not(.is-in)');
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
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

/* Las tres líneas de producto. El catálogo oficial declara las dos primeras;
   la tercera agrupa lo que ya está en la tienda y no figura en el PDF. */
const LINEAS = [
  { id: 'rendimiento', n: '01', title: 'Rendimiento y Fuerza', cats: ['Rendimiento'],
    field: 'radial-gradient(120% 95% at 16% -15%, #3AA86C 0%, #1E7247 24%, #125138 48%, #0B3327 72%, #06201A 100%)',
    blurb: 'Creatina monohidrato micronizada, de máxima pureza. Solubilidad superior y absorción ultra rápida, sin molestias digestivas.' },
  { id: 'salud', n: '02', title: 'Salud y Recuperación', cats: ['Recuperación', 'Vitaminas'],
    field: 'radial-gradient(115% 95% at 78% -10%, #4A93C9 0%, #2A6A9E 25%, #1A4E78 48%, #123754 72%, #0A2033 100%)',
    blurb: 'Citrato, glicinato, malato y triple magnesio. Sales orgánicas puras en cápsulas y polvo, sin excipientes ni azúcares agregados.' },
  { id: 'bienestar', n: '03', title: 'Bienestar diario', cats: ['Bienestar', 'Colágeno', 'Articulaciones'],
    field: 'radial-gradient(110% 90% at 30% 110%, #C98B4B 0%, #8A5A2E 24%, #4A3520 50%, #241B12 78%, #12100C 100%)',
    blurb: 'Colágeno, cúrcuma, espirulina y vitaminas para sostener la rutina de todos los días. Lo básico, bien hecho.' },
];

function lineaOf(category) {
  return LINEAS.find(l => l.cats.indexOf(category) >= 0) || LINEAS[2];
}

function ProductCard({ p, onOpen, onAdd }) {
  const tone = p.tone || 'green';
  return (
    <div className="vc-pcard" onClick={() => onOpen(p)}>
      <div className={`vc-pcard__plate vc-pcard__plate--${tone}`}>
        <ProductImage product={p} />
        {p.badge && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <Badge tone={tone} variant="solid">{p.badge}</Badge>
          </div>
        )}
      </div>
      <div className="vc-pcard__body">
        <div className="vc-pc__name">{p.name}</div>
        <div className="vc-pc__sub">{p.sub}</div>
        <div className="vc-pc__foot">
          <span className="vc-pc__price">
            {D.hasPriceRange(p) && <span className="vc-pc__from">Desde </span>}{D.fmt(p.price)}
          </span>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onAdd(p); }}>Agregar</Button>
        </div>
      </div>
    </div>
  );
}

/* --- Hero: campo de color + foto + pack, en capas que se mueven a distinta
   velocidad al hacer scroll (mismo recurso que los posts de Instagram). --- */
const HERO_STATS = [
  { v: '0.0%', l: 'Azúcares' },
  { v: '0.0%', l: 'Rellenos' },
  { v: 'RNE 13010908', l: 'Laboratorio propio' },
];

const SLIDES = [
  {
    eyebrow: 'Línea 01 — Rendimiento y Fuerza',
    l1: 'Suplementación',
    l2: 'simple.',
    l3: 'para tu vida.',
    body: 'Creatina, magnesios y vitaminas fraccionados en nuestro propio laboratorio. Para quien camina, entrena o simplemente quiere llegar entero al final del día.',
    field: LINEAS[0].field,
    photo: '/assets/lifestyle-estiramiento-manana.jpg',
    pack: '/assets/vcore-pack-creatina-monohidrato.jpg',
    packAlt: 'Creatina Monohidrato',
    ctas: [
      { label: 'Ver el catálogo', nav: 'shop', primary: true },
      { label: 'Conocé el laboratorio', nav: 'nosotros', primary: false },
    ],
  },
];

/* Convierte un banner del backend (texto plano) al shape que el render usa. */
function bannerToSlide(b) {
  return {
    eyebrow: b.eyebrow || '',
    l1: '',
    l2: b.title || '',
    l3: '',
    body: b.subtitle || '',
    field: b.bg || LINEAS[0].field,
    photo: b.photo || '',
    pack: '',
    ctas: b.ctaLabel ? [{
      label: b.ctaLabel,
      nav: (b.ctaHref || '').replace(/^#\/?/, '').replace('tienda', 'shop').replace('nosotros', 'nosotros') || 'shop',
      primary: true,
    }] : [],
  };
}

function HeroBanner({ onNav }) {
  injectPages();
  /* Usa banners del backend si hay; si no, cae a los slides del código. */
  const backendBanners = D.banners;
  const slides = (backendBanners && backendBanners.length)
    ? backendBanners.map(bannerToSlide)
    : SLIDES;
  const n = slides.length;
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (n <= 1) return;
    const t = setTimeout(() => setSlide(s => (s + 1) % n), 6000);
    return () => clearTimeout(t);
  }, [slide, n]);

  useEffect(() => { if (slide >= n) setSlide(0); }, [n]);

  const y = useScrollY();
  const base = window.__VCORE_ASSET_BASE__ || '/assets/';

  return (
    <div className="vc-banner">
      {slides.map((s, i) => (
        <div key={i} className={`vc-slide${i === slide ? ' active' : ''}`}>
          <div className="vc-hero__field"
            style={{ background: s.field, transform: `translateY(${y * 0.35}px)` }} />

          <img className="vc-hero__mark" src={base + 'vcore-isotipo-white.png'} alt=""
            style={{ transform: `translateY(${y * 0.22}px) rotate(${y * 0.02}deg)` }} />

          {s.eyebrow && <div className="vc-hero__label">{s.eyebrow}</div>}

          {s.photo && (
            <div className="vc-hero__photo" style={{ transform: `translateY(${y * 0.12}px)` }}>
              <img src={s.photo} alt="" />
            </div>
          )}

          {s.pack && (
            <div className="vc-hero__pack"
              style={{ transform: `translateY(${-y * 0.32}px) rotate(${-5 + y * 0.012}deg)` }}>
              <img src={s.pack} alt={s.packAlt || ''} />
            </div>
          )}

          <div className="vc-wrap vc-hero__inner"
            style={{ transform: `translateY(${y * 0.2}px)`, opacity: Math.max(0, 1 - y / 900) }}>
            <div className="vc-hero__copy">
              <h1 style={{ margin: 0 }}>
                {s.l1 && <span className="vc-hero__l1">{s.l1}</span>}
                <span className="vc-hero__l2">{s.l2}</span>
                {s.l3 && <span className="vc-hero__l3">{s.l3}</span>}
              </h1>
              <p>{s.body}</p>
              <div className="vc-hero__ctas">
                {s.ctas.map((c, j) => (
                  <button key={j} onClick={() => onNav(c.nav)}
                    className={`vc-hero__btn${c.primary ? '' : ' vc-hero__btn--ghost'}`}>
                    {c.label}
                    {c.primary && <I.ArrowRight size={17} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="vc-hero__stats">
              {HERO_STATS.map((st, j) => (
                <div key={j}>
                  <div className="vc-hero__stat-v">{st.v}</div>
                  <div className="vc-hero__stat-l">{st.l}</div>
                </div>
              ))}
            </div>

            <div className="vc-hero__cue">Deslizá<i /></div>
          </div>
        </div>
      ))}

      {n > 1 && (
        <div className="vc-banner__dots">
          {slides.map((_, i) => (
            <button key={i} className={`vc-banner__dot${i === slide ? ' active' : ''}`}
              onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Sección de líneas: campo de color conmutable, packs en parallax. */
function LineasSection({ onNav }) {
  const [active, setActive] = useState(1);
  const ref = useRef(null);
  const d = useSectionScroll(ref);
  const linea = LINEAS[active];

  /* Varios productos comparten la misma foto de packaging (cápsulas y polvo de
     la misma sal), así que se muestra una sola vez cada imagen. */
  const vistas = {};
  const packs = D.products
    .filter(p => linea.cats.indexOf(p.category) >= 0 && p.photo)
    .filter(p => (vistas[p.photo] ? false : (vistas[p.photo] = true)))
    .slice(0, 3);

  const geom = [
    { right: 0,   top: 14,  w: 236, h: 300, rot: 4,  depth: 0.08 },
    { right: 190, top: 104, w: 214, h: 272, rot: -6, depth: 0.16 },
    { right: 28,  top: 178, w: 190, h: 240, rot: 9,  depth: 0.24 },
  ];

  return (
    <section className="vc-lineas" ref={ref}>
      {LINEAS.map((l, i) => (
        <div key={l.id} className={`vc-lineas__field${i === active ? ' on' : ''}`}
          style={{ background: l.field }} />
      ))}
      <div className="vc-lineas__ghost" style={{ transform: `translateY(${d * 0.22}px)` }}>{linea.n}</div>

      <div className="vc-wrap vc-lineas__inner">
        <div className="vc-lineas__grid">
          <div className="vc-reveal">
            <h2>{linea.title}</h2>
            <p>{linea.blurb}</p>
            <button className="vc-lineas__cta" onClick={() => onNav('shop')}>
              Ver la línea
              <I.ArrowRight size={17} />
            </button>
          </div>
          <div className="vc-lineas__packs">
            {packs.map((p, i) => {
              const g = geom[i] || geom[0];
              return (
                <div key={p.id} className="vc-lineas__pack"
                  style={{
                    right: g.right, top: g.top, width: g.w, height: g.h,
                    transform: `translateY(${-d * g.depth}px) rotate(${g.rot + d * g.depth * 0.02}deg)`,
                  }}>
                  <img src={p.photo} alt={p.name} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="vc-lineas__rail">
          {LINEAS.map((l, i) => (
            <button key={l.id} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
              <div className="vc-lineas__rail-n">{l.n}</div>
              <div className="vc-lineas__rail-t">{l.title}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Banda del laboratorio: los tres íconos de marca + el texto del catálogo. */
function LaboratorioBand() {
  const ref = useRef(null);
  const d = useSectionScroll(ref);
  const base = window.__VCORE_ASSET_BASE__ || '/assets/';
  const pilares = [
    ['icon-continuidad-white.png', 'Pureza',
      'Utilizamos fórmulas limpias y transparentes. 0.0% azúcares, 0.0% rellenos innecesarios. Materias primas de alta biodisponibilidad y máxima absorción.'],
    ['icon-flexibilidad-white.png', 'Balance',
      'Precios y formatos muy competitivos. Al integrar verticalmente el fraccionamiento y envasado, eliminamos intermediarios para ofrecer la mejor relación precio-calidad.'],
    ['icon-vitalidad-white.png', 'Transparencia',
      'Control de calidad total e infraestructura in-house. Registro de establecimiento legalizado bajo estrictas normas de seguridad y trazabilidad (RNE 13010908).'],
  ];
  return (
    <section className="vc-lab" ref={ref}>
      {pilares.map((p, i) => (
        <img key={i} className="vc-lab__ghost" src={base + p[0]} alt=""
          style={{
            left: `${8 + i * 32}%`,
            top: 280 + i * 30,
            transform: `translateY(${-d * (0.12 + i * 0.07)}px)`,
          }} />
      ))}
      <div className="vc-wrap vc-lab__inner">
        <div className="vc-lab__head vc-reveal">
          <div>
            <h2>Lo que<br />no negociamos.</h2>
          </div>
          <p className="vc-lab__caption" style={{ marginTop: 10 }}>Fraccionamos y envasamos puertas adentro, en Godoy Cruz. Integrar el proceso es lo que nos deja bajar el precio sin bajar la calidad — y poder decir exactamente qué hay en cada envase.</p>
        </div>

        <div className="vc-lab__cols">
          {pilares.map((p, i) => (
            <div key={i} className="vc-reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <img className="vc-lab__icon" src={base + p[0]} alt="" />
              <h3>{p[1]}</h3>
              <div className="vc-lab__div" />
              <p>{p[2]}</p>
            </div>
          ))}
        </div>

        <div className="vc-lab__foot">
          <span>Godoy Cruz, Mendoza — Industria argentina</span>
          <span>RNE 13010908</span>
        </div>
      </div>
    </section>
  );
}

function VolumeTiers() {
  return (
    <div className="vc-wrap">
      <section className="vc-section">
        <div className="vc-section__head">
          <div>
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

const HOW_STEPS = [
  { n: '01', title: 'Elegí tus productos',
    body: 'Navegá el catálogo, leé los beneficios y agregá al carrito todo lo que necesités.' },
  { n: '02', title: 'Coordiná por WhatsApp',
    body: 'Tu pedido se convierte en un mensaje listo. Lo enviás a nuestro WhatsApp y coordinamos pago y envío.' },
  { n: '03', title: 'Recibí en todo el país',
    body: 'Despachamos por Andreani a todo el país. También podés retirar en local sin costo.' },
];
const HOW_MS = 5000;

/* Cómo comprar: los pasos avanzan solos (se frena al pasar el mouse o al
   hacer foco) y el panel derecho muestra la escena de cada paso. El pedido
   de ejemplo sale del catálogo real, así el total nunca queda desactualizado. */
function HowToBuy() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const base = window.__VCORE_ASSET_BASE__ || '/assets/';

  useEffect(() => {
    if (paused || prefersReducedMotion()) return;
    const t = setTimeout(() => setStep(s => (s + 1) % HOW_STEPS.length), HOW_MS);
    return () => clearTimeout(t);
  }, [step, paused]);

  const conFoto = D.products.filter(p => p.photo);
  const pick = (id, i) => D.products.find(p => p.id === id) || conFoto[i] || D.products[i];
  const lines = [
    { p: pick('creatina', 0), qty: 1 },
    { p: pick('glicinato-magnesio', 1), qty: 2 },
  ].filter(l => l.p);
  const total = lines.reduce((sum, l) => sum + l.p.price * l.qty, 0);
  const wa = () => window.open(`https://wa.me/${(D.config && D.config.whatsapp) || '5491100000000'}?text=Hola!%20Quiero%20hacer%20un%20pedido`, '_blank');
  const thumb = p => (p.photo ? <img src={p.photo} alt="" /> : <ProductImage product={p} />);

  return (
    <section className={`vc-how${paused ? ' is-paused' : ''}`} id="como-comprar"
      style={{ '--vc-how-ms': `${HOW_MS}ms` }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="vc-wrap vc-how__inner">
        <div className="vc-reveal">
          <h2>
            <span className="vc-how__l1">Del carrito</span>
            <span className="vc-how__l2">a tu puerta.</span>
          </h2>

          <ol className="vc-how__steps">
            {HOW_STEPS.map((s, i) => (
              <li key={s.n}
                className={`vc-how__step${i === step ? ' is-on' : ''}${i < step ? ' is-done' : ''}`}>
                {i < HOW_STEPS.length - 1 && (
                  <div className="vc-how__track"><div className="vc-how__fill" key={`${step}-${i}`} /></div>
                )}
                <button className="vc-how__num" onClick={() => setStep(i)}
                  aria-label={`Paso ${i + 1}: ${s.title}`} aria-current={i === step ? 'step' : undefined}>
                  {s.n}
                </button>
                <button className="vc-how__txt" onClick={() => setStep(i)} tabIndex={-1}>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </button>
              </li>
            ))}
          </ol>

          <div className="vc-how__cta">
            <button className="vc-how__btn" onClick={wa}>
              Hablar por WhatsApp
              <I.ArrowRight size={17} />
            </button>
            <span>Respondemos en minutos</span>
          </div>
        </div>

        <div className="vc-how__stage" aria-hidden="true">
          <div className={`vc-how__scene${step === 0 ? ' is-on' : ''}`}>
            <div className="vc-how__card">
              <div className="vc-how__cardhd">
                <div className="vc-how__av"><I.Bag size={20} /></div>
                <div><b>Tu carrito</b><small>{lines.reduce((n, l) => n + l.qty, 0)} productos</small></div>
              </div>
              <div className="vc-how__body">
                {lines.map(l => (
                  <div key={l.p.id} className="vc-how__line">
                    <div className="vc-how__thumb">{thumb(l.p)}</div>
                    <div>
                      <div className="vc-how__line-n">{l.p.name}</div>
                      <div className="vc-how__line-s">{l.p.sub} · x{l.qty}</div>
                    </div>
                    <div className="vc-how__line-p">{D.fmt(l.p.price * l.qty)}</div>
                  </div>
                ))}
                <div className="vc-how__total"><span>Total</span><b>{D.fmt(total)}</b></div>
                <div className="vc-how__fakebtn">Enviar pedido por WhatsApp <I.ArrowRight size={16} /></div>
              </div>
            </div>
          </div>

          <div className={`vc-how__scene${step === 1 ? ' is-on' : ''}`}>
            <div className="vc-how__card">
              <div className="vc-how__cardhd">
                <div className="vc-how__av"><img src={base + 'vcore-isotipo-white.png'} alt="" /></div>
                <div><b>Vcore</b><small>en línea</small></div>
              </div>
              <div className="vc-how__body">
                <div className="vc-how__msg vc-how__msg--out">
                  <strong>¡Hola! Quiero hacer este pedido:</strong>
                  {lines.map(l => <div key={l.p.id}>• {l.qty}× {l.p.name} — {l.p.sub}</div>)}
                  <div style={{ marginTop: 6 }}><strong>Total: {D.fmt(total)}</strong></div>
                  <time>10:24 ✓✓</time>
                </div>
                <div className="vc-how__msg vc-how__msg--in">
                  ¡Hola! Te lo preparamos hoy. ¿Envío a domicilio o retirás en el local?
                  <time>10:27</time>
                </div>
              </div>
            </div>
          </div>

          <div className={`vc-how__scene${step === 2 ? ' is-on' : ''}`}>
            <div className="vc-how__card">
              <div className="vc-how__cardhd">
                <div className="vc-how__av"><I.Truck size={20} /></div>
                <div><b>Tu pedido está en camino</b><small>Despachado desde el laboratorio</small></div>
              </div>
              <div className="vc-how__body">
                <div className="vc-how__route">
                  <span>Godoy Cruz, Mendoza</span><i /><span>Tu casa</span>
                </div>
                <div className="vc-how__opt is-main">
                  <div className="vc-how__opt-ic"><I.Truck size={20} /></div>
                  <div>
                    <div className="vc-how__line-n">Envío por Andreani</div>
                    <div className="vc-how__line-s">A todo el país</div>
                  </div>
                </div>
                <div className="vc-how__opt">
                  <div className="vc-how__opt-ic"><I.Bag size={20} /></div>
                  <div>
                    <div className="vc-how__line-n">Retiro en el local</div>
                    <div className="vc-how__line-s">Sin costo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {lines[0] && (
            <div className="vc-how__pack vc-how__pack--a"
              style={{ transform: `rotate(${[7, 12, 4][step]}deg) translateY(${[0, -14, 8][step]}px)` }}>
              {thumb(lines[0].p)}
            </div>
          )}
          {lines[1] && (
            <div className="vc-how__pack vc-how__pack--b"
              style={{ transform: `rotate(${[-8, -3, -12][step]}deg) translateY(${[0, 10, -12][step]}px)` }}>
              {thumb(lines[1].p)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Banda de misión: la foto se desliza dentro de su marco al pasar. */
function MissionBand() {
  const ref = useRef(null);
  const d = useSectionScroll(ref);
  return (
    <div className="vc-band-outer" ref={ref}>
      <div className="vc-wrap vc-band vc-reveal">
        <div>
          <h2>Democratizar el bienestar<br />y el <em>rendimiento.</em></h2>
          <p style={{ marginTop: 24 }}>No diseñamos solo para atletas de élite. Vcore es para quienes corren hacia su trabajo, entrenan por salud o buscan energía para superar su día a día.</p>
        </div>
        <div className="vc-band__frame">
          <img className="vc-band__photo" src="/assets/lifestyle-pareja-caminando.jpg" alt=""
            style={{ transform: `translateY(${d * 0.06}px) scale(1.24)` }} />
        </div>
      </div>
    </div>
  );
}

function Home({ onNav, onAdd, onOpen }) {
  injectPages();
  const featured = D.products.filter(p => p.featured).slice(0, 4);
  useRevealAll(featured.length);
  return (
    <main>
      <HeroBanner onNav={onNav} />

      <LineasSection onNav={onNav} />

      <div className="vc-wrap">
        <section className="vc-section">
          <div className="vc-section__head vc-reveal">
            <div><h2>Lo esencial</h2></div>
            <Button variant="ghost" onClick={() => onNav('shop')} iconRight={<I.ArrowRight size={16} />}>
              Ver todo
            </Button>
          </div>
          <div className="vc-grid">
            {featured.map((p, i) => (
              <div key={p.id} className="vc-reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {false && <VolumeTiers />}

      <LaboratorioBand />

      <HowToBuy />

      <MissionBand />
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
      <section className="vc-section" style={{ paddingBottom: 24, paddingTop: 0 }}>
        <div className="vc-shop-head">
          <div style={{ flexGrow: 1 }}>
            <h1>Todo lo que<br />fraccionamos.</h1>
          </div>
          <p>{D.products.length} productos en cápsulas y polvo, envasados en nuestra propia planta en Mendoza. Sin intermediarios.</p>
        </div>
        <div className="vc-shop-search" style={{ marginTop: 40 }}>
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

function Product({ product, onAdd, onOpen }) {
  injectPages();
  const p = product || D.products[0];
  const [size, setSize] = useState(p.sizes[0]);
  const [qty, setQty] = useState(1);
  const stats = p.stats || D.products[0].stats;

  useEffect(() => { setSize(p.sizes[0]); setQty(1); }, [p.id]);

  /* relacionados: misma categoría primero, completar con el resto */
  const related = (() => {
    const all = D.products.filter(x => x.id !== p.id);
    const sameCat = all.filter(x => x.category === p.category);
    const rest = all.filter(x => x.category !== p.category);
    return [...sameCat, ...rest].slice(0, 4);
  })();

  const y = useScrollY();
  const linea = lineaOf(p.category);
  const circles = (stats && stats.length ? stats : [
    { value: '0.0%', label: 'Azúcares' },
    { value: '0.0%', label: 'Rellenos' },
    { value: 'Puro', label: 'Sin aditivos' },
  ]).slice(0, 3);

  return (
    <main>
      <section className="vc-pdp2">
        <div className="vc-pdp2__art" style={{ background: linea.field }}>
          <div className="vc-pdp2__ghost">{p.name}</div>
          <button className="vc-pdp2__back"
            onClick={() => window.dispatchEvent(new CustomEvent('vc:nav', { detail: 'shop' }))}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Volver al catálogo
          </button>
          <div className="vc-pdp2__plate"
            style={{
              transform: `translateY(${-y * 0.14}px) rotate(${-3 + y * 0.01}deg)`,
              background: p.photo ? '#F2F1EF' : 'transparent',
              boxShadow: p.photo ? undefined : 'none',
            }}>
            {p.photo
              ? <img src={p.photo} alt={p.name} />
              : <ProductImage product={p} />}
          </div>
          <div className="vc-pdp2__circles">
            {circles.map((c, i) => (
              <div key={i} className="vc-pdp2__circle">
                <b>{c.value}</b>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vc-pdp2__panel">
          <h1>{p.name}</h1>
          <div className="vc-pdp__sub" style={{ marginTop: 14 }}>{p.sub}</div>
          <Rating r={p.rating} n={p.reviews} />
          <p className="vc-pdp__blurb">{p.blurb}</p>
          <p className="vc-pdp__price">{D.fmt(D.priceFor(p, size))}</p>

          <div style={{ marginTop: 26, marginBottom: 10, fontSize: 11.5, fontWeight: 700,
            letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
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
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Quitar uno"><I.Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Agregar uno"><I.Plus size={16} /></button>
            </div>
            <Button size="lg" onClick={() => onAdd(p, qty, size)} iconRight={<I.Bag size={18} />}>
              Agregar al carrito
            </Button>
          </div>

          <div className="vc-pdp__stats">
            <span className="vc-pdp__stat"><I.Truck size={18} /> Envío gratis desde $150.000</span>
            <span className="vc-pdp__stat"><I.Shield size={18} /> RNE 13010908</span>
            <span className="vc-pdp__stat"><I.Leaf size={18} /> Industria argentina</span>
          </div>
        </div>
      </section>

      {related.length > 0 && onOpen && (
        <div className="vc-wrap">
          <section className="vc-section">
            <div className="vc-section__head">
              <div>
                <h2>Productos relacionados</h2>
              </div>
            </div>
            <div className="vc-grid">
              {related.map(rp => <ProductCard key={rp.id} p={rp} onOpen={onOpen} onAdd={onAdd} />)}
            </div>
          </section>
        </div>
      )}
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
            <div className="vc-about-mark" style={{
              backgroundImage: `linear-gradient(180deg, rgba(10,26,20,0) 55%, rgba(8,20,16,.78) 100%), url(${(window.__VCORE_ASSET_BASE__ || '/assets/')}lifestyle-pareja-caminando.jpg)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
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
      <div className="vc-band-outer">
        <div className="vc-wrap vc-band">
          <div>
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
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
              letterSpacing: '-.02em', margin: '0 0 10px' }}>¿Tenés preguntas?</h3>
            <p style={{ fontSize: 15, color: 'var(--ink-600)', margin: 0 }}>
              Escribinos por WhatsApp — respondemos en minutos.
            </p>
          </div>
          <Button size="lg"
            onClick={() => window.open(`https://wa.me/${(D.config && D.config.whatsapp) || '5491100000000'}?text=Hola!%20Tengo%20una%20consulta`, '_blank')}
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
