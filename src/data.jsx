/* Vcore website — catalog, discount tiers, shipping, promo codes. */
window.VcoreData = {

  tiers: [
    { id: 'retail',      label: 'Minorista',   min: 0,       discount: 0,    badge: null },
    { id: 'wholesale',   label: 'Mayorista',    min: 50000,   discount: 0.20, badge: '−20%' },
    { id: 'distributor', label: 'Distribuidor', min: 100000,  discount: 0.35, badge: '−35%' },
  ],

  shipping: [
    { id: 'andreani', label: 'Andreani — Sucursal', base: 5000, freeFrom: 50000 },
    { id: 'home',     label: 'A domicilio',          base: 8000, freeFrom: null  },
    { id: 'pickup',   label: 'Retiro en local',      base: 0,    freeFrom: 0     },
  ],

  codes: { 'VCORE10': 0.10, 'BIENVENIDO': 0.15 },

  categories: ['Todo', 'Rendimiento', 'Recuperación', 'Vitaminas', 'Bienestar', 'Colágeno'],

  products: [
    {
      id: 'creatina', name: 'Creatina', sub: 'Monohidrato', price: 14990,
      category: 'Rendimiento',
      sizes: ['300 gr', '500 gr'], rating: 4.9, reviews: 312, badge: 'Más vendido',
      photo: '/assets/product-creatina-locker.jpg', tone: 'paper',
      blurb: 'Energía celular, claridad mental y rendimiento para tu rutina diaria. Sin vueltas.',
      stats: [
        { value: '0.0%', label: 'aditivos' }, { value: '99.5%', label: 'pureza' },
        { value: '60',   label: 'servicios' }, { value: 'Sin',  label: 'sabor'  },
      ],
      benefits: [
        ['Zap',      'Más energía',      'Potencia tus entrenamientos y tu día.'],
        ['Sparkles', 'Claridad mental',  'Apoya el foco y la función cognitiva.'],
        ['Shield',   'Pureza certificada', 'Monohidrato 99.5%, sin agregados.'],
      ],
    },
    {
      id: 'proteina', name: 'Proteína', sub: 'Whey Isolate', price: 28990,
      category: 'Recuperación',
      sizes: ['1 kg', '2 kg'], rating: 4.8, reviews: 198, badge: null, tone: 'green',
      blurb: 'Recuperación y construcción muscular con proteína de alta absorción.',
    },
    {
      id: 'preworkout', name: 'Pre-Workout', sub: 'Energía + Foco', price: 19990,
      category: 'Rendimiento',
      sizes: ['250 gr'], rating: 4.7, reviews: 144, badge: 'Nuevo', tone: 'navy',
      blurb: 'El empujón limpio antes de entrenar. Sin caída, sin nervios.',
    },
    {
      id: 'magnesio', name: 'Magnesio', sub: 'Bisglicinato', price: 11990,
      category: 'Recuperación',
      sizes: ['120 caps'], rating: 4.9, reviews: 87, badge: null, tone: 'sage',
      blurb: 'Descanso, recuperación y función muscular para cerrar bien el día.',
    },
    {
      id: 'vitamina-c', name: 'Vitamina C', sub: 'Ascorbato puro', price: 11400,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 54, badge: null, tone: 'green',
      blurb: 'Antioxidante esencial. Apoyo inmunológico y síntesis de colágeno sin excipientes.',
    },
    {
      id: 'triple-mag', name: 'Triple Magnesio', sub: 'Citrato · Glicinato · Malato', price: 16500,
      category: 'Vitaminas',
      sizes: ['90 caps', '180 caps'], rating: 4.9, reviews: 41, badge: null, tone: 'sage',
      blurb: 'Tres formas de magnesio en una cápsula. Máxima absorción y biodisponibilidad.',
    },
    {
      id: 'colageno', name: 'Colágeno', sub: 'Hidrolizado Tipo I & III', price: 12700,
      category: 'Colágeno',
      sizes: ['300 gr', '500 gr'], rating: 4.7, reviews: 66, badge: null, tone: 'paper',
      blurb: 'Soporte para articulaciones, piel y tejido conectivo. Alta biodisponibilidad.',
    },
    {
      id: 'espirulina', name: 'Espirulina', sub: 'Spirulina platensis', price: 12699,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 29, badge: null, tone: 'green',
      blurb: 'Superalimento completo. Proteína, hierro, clorofila y antioxidantes naturales.',
    },
    {
      id: 'curcuma', name: 'Cúrcuma', sub: 'Curcumina + Piperina', price: 10500,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 73, badge: null, tone: 'navy',
      blurb: 'Antiinflamatorio natural. La piperina potencia la absorción de curcumina hasta 20×.',
    },
    {
      id: 'maca', name: 'Maca', sub: 'Lepidium meyenii', price: 12900,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.7, reviews: 38, badge: null, tone: 'sage',
      blurb: 'Adaptógeno andino. Vitalidad, energía sostenida y equilibrio hormonal natural.',
    },
  ],

  fmt: (n) => '$' + Math.round(n).toLocaleString('es-CL'),

  getTier(subtotal) {
    return [...this.tiers].reverse().find(t => subtotal >= t.min) || this.tiers[0];
  },

  getNextTier(subtotal) {
    return this.tiers.find(t => t.min > subtotal) || null;
  },

  getShippingCost(shippingId, subtotalAfterDiscount) {
    const opt = this.shipping.find(s => s.id === shippingId);
    if (!opt) return 0;
    if (opt.freeFrom !== null && subtotalAfterDiscount >= opt.freeFrom) return 0;
    return opt.base;
  },
};
