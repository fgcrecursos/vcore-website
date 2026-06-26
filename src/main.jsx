import React from 'react';
import { createRoot } from 'react-dom/client';

window.React = React;
window.ReactDOM = { createRoot };

function loadBundle() {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/ds_bundle.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

(async () => {
  await loadBundle();
  await import('./icons.jsx');
  await import('./backend.jsx');   // window.VcoreBackend (Supabase + Cloudinary)
  await import('./data.jsx');
  await import('./shell.jsx');
  await import('./pages.jsx');
  await import('./cart.jsx');
  await import('./admin.jsx');
  const { default: App } = await import('./App.jsx');
  createRoot(document.getElementById('root')).render(<App />);
  /* refresca catálogo/códigos/config desde el backend (si está configurado) */
  window.VcoreData.loadFromBackend();
})();
