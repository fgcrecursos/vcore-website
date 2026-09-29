/* Vcore — Selector de sucursal Andreani.
   Con el CP de la clienta sugiere la sucursal que Andreani le asigna y ofrece las
   más cercanas (ver andreani-sucursales.js, compartido con Somos Setas). Si
   Andreani no responde avisa y deja seguir: la sucursal se coordina por WhatsApp
   (onEstado('error')), nunca se bloquea la venta.
   Lo usan el carrito y el panel (window.VcoreSelectorSucursal). */
import './andreani-sucursales.js';

const React = window.React;
const { useState, useEffect } = React;

const CSS = `
.vc-suc-list { display: flex; flex-direction: column; gap: 7px; }
.vc-suc-opt { display: flex; gap: 10px; align-items: flex-start; width: 100%; text-align: left;
  padding: 10px 12px; border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); cursor: pointer; font-family: var(--font-body); color: var(--ink-800);
  transition: border-color .15s, background .15s; }
.vc-suc-opt:hover { border-color: var(--green-500); }
.vc-suc-opt.on { border-color: var(--green-500); background: var(--green-050); }
.vc-suc-radio { flex: none; width: 15px; height: 15px; margin-top: 2px; border-radius: 50%;
  border: 1.5px solid var(--border-default); position: relative; background: var(--surface-card); }
.vc-suc-opt.on .vc-suc-radio { border-color: var(--green-600); }
.vc-suc-opt.on .vc-suc-radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--green-600); }
.vc-suc-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vc-suc-nombre { font-weight: 700; font-size: 13.5px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.vc-suc-badge { font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 999px; background: var(--green-600); color: #fff; }
.vc-suc-dir { font-size: 12px; color: var(--ink-600); }
.vc-suc-hor { font-size: 11px; color: var(--ink-400); }
.vc-suc-nota { font-size: 12px; color: var(--ink-500); margin: 0; line-height: 1.5; }
.vc-suc-nota.err { color: #8E2E22; font-weight: 700; }
.vc-suc-link { align-self: flex-start; background: none; border: 0; padding: 2px 0; cursor: pointer;
  font: inherit; font-size: 12px; font-weight: 700; color: var(--green-700); text-decoration: underline; }
[data-theme="dark"] .vc-suc-link { color: var(--green-400); }
`;

function injectCss() {
  if (document.getElementById('vc-suc-css')) return;
  const el = document.createElement('style');
  el.id = 'vc-suc-css';
  el.textContent = CSS;
  document.head.appendChild(el);
}

function SelectorSucursal({ cp, value, onChange, onEstado }) {
  injectCss();
  const [estado, setEstado] = useState('idle'); // idle | cargando | ok | error | cp-invalido | cp-inexistente
  const [lista, setLista] = useState([]);
  const [sugeridaId, setSugeridaId] = useState(null);
  const [verMas, setVerMas] = useState(false);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    const api = window.AndreaniSucursales;
    const c = api && api.cp4(cp);
    if (!api || !c) { setEstado(String(cp || '').trim() ? 'cp-invalido' : 'idle'); setLista([]); onChange(null); return; }
    let vivo = true;
    setEstado('cargando');
    /* Espera a que termine de escribir el CP antes de consultar. */
    const t = setTimeout(() => {
      api.paraCP(c, 6).then(r => {
        if (!vivo) return;
        setEstado(r.estado);
        setLista(r.sucursales);
        setSugeridaId(r.sugeridaId);
        setVerMas(false);
        /* Conserva la elegida si sigue en la lista; si no, propone la sugerida. */
        const sigue = value && r.sucursales.find(s => s.id === value.id);
        onChange(sigue || r.sucursales[0] || null);
      }).catch(() => { if (vivo) { setEstado('error'); setLista([]); onChange(null); } });
    }, 400);
    return () => { vivo = false; clearTimeout(t); };
  }, [cp, reintento]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (onEstado) onEstado(estado); }, [estado]); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado === 'idle') return <p className="vc-suc-nota">Completá el código postal y te mostramos las sucursales más cercanas.</p>;
  if (estado === 'cp-invalido') return null; // el campo de CP ya muestra el error
  if (estado === 'cp-inexistente') return <p className="vc-suc-nota err">Andreani no reconoce ese código postal. Revisalo.</p>;
  if (estado === 'cargando') return <p className="vc-suc-nota">Buscando sucursales…</p>;
  if (estado === 'error') return (
    <p className="vc-suc-nota">
      No pudimos consultar las sucursales de Andreani. Podés seguir igual: la coordinamos por WhatsApp.{' '}
      <button type="button" className="vc-suc-link" onClick={() => setReintento(n => n + 1)}>Reintentar</button>
    </p>
  );

  const visibles = verMas ? lista : lista.slice(0, 3);
  return (
    <div className="vc-suc-list" role="radiogroup" aria-label="Sucursal Andreani">
      {visibles.map(s => {
        const on = value && value.id === s.id;
        return (
          <button type="button" key={s.id} role="radio" aria-checked={!!on}
            className={'vc-suc-opt' + (on ? ' on' : '')} onClick={() => onChange(s)}>
            <span className="vc-suc-radio" aria-hidden="true" />
            <span className="vc-suc-body">
              <span className="vc-suc-nombre">
                {s.nombre}
                {s.id === sugeridaId && <span className="vc-suc-badge">Sugerida para tu CP</span>}
              </span>
              <span className="vc-suc-dir">{[s.calle, s.localidad, s.provincia].filter(Boolean).join(', ')}</span>
              {s.horario && <span className="vc-suc-hor">{s.horario}</span>}
            </span>
          </button>
        );
      })}
      {lista.length > 3 && (
        <button type="button" className="vc-suc-link" onClick={() => setVerMas(v => !v)}>
          {verMas ? 'Ver menos' : `Ver ${lista.length - 3} sucursales más`}
        </button>
      )}
    </div>
  );
}

window.VcoreSelectorSucursal = SelectorSucursal;
