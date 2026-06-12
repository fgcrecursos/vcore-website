/* Vcore UI kit — icon set. Shared via window. */
const React = window.React;

function mk(paths, opts = {}) {
  return function Icon({ size = 20, stroke = 2, className = '', style }) {
    return React.createElement('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: opts.fill ? 'currentColor' : 'none',
      stroke: opts.fill ? 'none' : 'currentColor', strokeWidth: stroke,
      strokeLinecap: 'round', strokeLinejoin: 'round', className, style: { display: 'block', ...style },
      dangerouslySetInnerHTML: { __html: paths },
    });
  };
}

const Icons = {
  Bag: mk('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
  Search: mk('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  Menu: mk('<path d="M4 12h16M4 6h16M4 18h16"/>'),
  ArrowRight: mk('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  Check: mk('<path d="M20 6 9 17l-5-5"/>'),
  Plus: mk('<path d="M5 12h14M12 5v14"/>'),
  Minus: mk('<path d="M5 12h14"/>'),
  X: mk('<path d="M18 6 6 18M6 6l12 12"/>'),
  Star: mk('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', { fill: true }),
  Zap: mk('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  Leaf: mk('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>'),
  Sparkles: mk('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>'),
  Shield: mk('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/>'),
  ChevronDown: mk('<path d="m6 9 6 6 6-6"/>'),
  User: mk('<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>'),
  Truck: mk('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'),
  Moon: mk('<path d="M12 3a6.5 6.5 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  Sun: mk('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'),
};

window.VcoreIcons = Icons;
