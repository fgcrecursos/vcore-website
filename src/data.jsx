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

  /* Códigos activos — el admin puede sobrescribir con vc-codes en localStorage */
  get codes() {
    try {
      const stored = localStorage.getItem('vc-codes');
      if (stored) {
        const arr = JSON.parse(stored);
        const obj = {};
        arr.filter(c => c.active).forEach(c => { obj[c.code] = c.value / 100; });
        return obj;
      }
    } catch {}
    return { 'VCORE10': 0.10, 'BIENVENIDO': 0.15 };
  },

  categories: ['Todo', 'Rendimiento', 'Recuperación', 'Vitaminas', 'Bienestar', 'Colágeno', 'Articulaciones'],

  /* Normaliza un producto: garantiza variants [{label, price}], sizes [labels]
     y price (precio "desde" = el menor). Compatible con productos legacy que
     traían sizes + un único price. */
  _normalize(p) {
    let variants;
    if (Array.isArray(p.variants) && p.variants.length) {
      variants = p.variants
        .map(v => ({ label: String(v.label || '').trim(), price: Number(v.price) || 0 }))
        .filter(v => v.label);
    } else {
      const sizes = (p.sizes && p.sizes.length) ? p.sizes : ['Único'];
      variants = sizes.map(label => ({ label: String(label).trim(), price: Number(p.price) || 0 }));
    }
    if (!variants.length) variants = [{ label: 'Único', price: Number(p.price) || 0 }];
    const minPrice = Math.min(...variants.map(v => v.price));
    return { ...p, variants, sizes: variants.map(v => v.label), price: minPrice };
  },

  /* Catálogo base — el admin puede sobrescribir con vc-products en localStorage */
  get products() {
    try {
      const stored = localStorage.getItem('vc-products');
      if (stored) return JSON.parse(stored).filter(p => p.visible !== false).map(p => this._normalize(p));
    } catch {}
    return this._base.filter(p => p.visible !== false).map(p => this._normalize(p));
  },

  get allProducts() {
    try {
      const stored = localStorage.getItem('vc-products');
      if (stored) return JSON.parse(stored).map(p => this._normalize(p));
    } catch {}
    return this._base.map(p => this._normalize(p));
  },

  _base: [
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
        ['Zap',      'Más energía',        'Potencia tus entrenamientos y tu día.'],
        ['Sparkles', 'Claridad mental',    'Apoya el foco y la función cognitiva.'],
        ['Shield',   'Pureza certificada', 'Monohidrato 99.5%, sin agregados.'],
      ],
      visible: true, featured: true,
    },
    {
      id: 'proteina', name: 'Proteína', sub: 'Aislado de Suero de Leche', price: 28990,
      category: 'Recuperación',
      sizes: ['1 kg', '2 kg'], rating: 4.8, reviews: 198, badge: null, tone: 'green',
      blurb: 'Recuperación y construcción muscular con proteína de alta absorción.',
      visible: true, featured: true,
    },
    {
      id: 'magnesio', name: 'Magnesio', sub: 'Bisglicinato', price: 11990,
      category: 'Recuperación',
      sizes: ['120 caps'], rating: 4.9, reviews: 87, badge: null, tone: 'sage',
      blurb: 'Descanso, recuperación y función muscular para cerrar bien el día.',
      visible: true, featured: true,
    },
    {
      id: 'vitamina-c', name: 'Vitamina C', sub: 'Ascorbato puro — Cápsulas', price: 11400,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 54, badge: null, tone: 'green',
      blurb: 'Antioxidante esencial. Apoyo inmunológico y síntesis de colágeno sin excipientes.',
      visible: true, featured: false,
    },
    {
      id: 'vitamina-c-polvo', name: 'Vitamina C', sub: 'Ascorbato puro — Polvo', price: 7300,
      category: 'Vitaminas',
      sizes: ['100 gr', '250 gr'], rating: 4.8, reviews: 31, badge: null, tone: 'green',
      blurb: 'Vitamina C en polvo de alta pureza. Dosificación flexible, sin excipientes.',
      visible: true, featured: false,
    },
    {
      id: 'triple-mag', name: 'Triple Magnesio', sub: 'Citrato · Glicinato · Malato — Cápsulas', price: 16500,
      category: 'Vitaminas',
      sizes: ['90 caps', '180 caps'], rating: 4.9, reviews: 41, badge: null, tone: 'sage',
      blurb: 'Tres formas de magnesio en una cápsula. Máxima absorción y biodisponibilidad.',
      visible: true, featured: false,
    },
    {
      id: 'triple-mag-polvo', name: 'Triple Magnesio', sub: 'Citrato · Glicinato · Malato — Polvo', price: 15000,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.8, reviews: 19, badge: null, tone: 'sage',
      blurb: 'Triple magnesio en polvo. Dosificación precisa, sin cápsulas.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-magnesio', name: 'Citrato de Magnesio', sub: 'Cápsulas', price: 14000,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 33, badge: null, tone: 'sage',
      blurb: 'Alta absorción y tolerancia digestiva. Forma clásica y bien estudiada.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-magnesio-polvo', name: 'Citrato de Magnesio', sub: 'Polvo', price: 7000,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.8, reviews: 22, badge: null, tone: 'sage',
      blurb: 'Citrato de magnesio en polvo. Disolvé en agua o jugo, sin sabor agregado.',
      visible: true, featured: false,
    },
    {
      id: 'glicinato-magnesio', name: 'Glicinato de Magnesio', sub: 'Cápsulas', price: 16800,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.9, reviews: 28, badge: null, tone: 'sage',
      blurb: 'La forma más suave y biodisponible. Ideal para relajación y sueño.',
      visible: true, featured: false,
    },
    {
      id: 'glicinato-magnesio-polvo', name: 'Glicinato de Magnesio', sub: 'Polvo', price: 12700,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.9, reviews: 14, badge: null, tone: 'sage',
      blurb: 'Glicinato en polvo para mayor flexibilidad de dosis.',
      visible: true, featured: false,
    },
    {
      id: 'malato-magnesio', name: 'Malato de Magnesio', sub: 'Cápsulas', price: 18600,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 17, badge: null, tone: 'sage',
      blurb: 'Energía mitocondrial y función muscular. Ideal para rendimiento físico.',
      visible: true, featured: false,
    },
    {
      id: 'malato-magnesio-polvo', name: 'Malato de Magnesio', sub: 'Polvo', price: 12000,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.7, reviews: 11, badge: null, tone: 'sage',
      blurb: 'Malato de magnesio en polvo. Fácil de incorporar a bebidas deportivas.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-potasio', name: 'Citrato de Potasio', sub: 'Cápsulas', price: 13500,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.7, reviews: 24, badge: null, tone: 'green',
      blurb: 'Equilibrio electrolítico, función muscular y cardiovascular. Alta absorción.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-potasio-polvo', name: 'Citrato de Potasio', sub: 'Polvo', price: 6200,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.7, reviews: 16, badge: null, tone: 'green',
      blurb: 'Potasio en polvo soluble. Ideal para combinar con magnesio en bebidas.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-mg-k-polvo', name: 'Citrato Mg + K', sub: 'Magnesio + Potasio — Polvo', price: 7200,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.8, reviews: 20, badge: null, tone: 'sage',
      blurb: 'Fórmula combinada de citrato de magnesio y potasio. Electrolitos completos.',
      visible: true, featured: false,
    },
    {
      id: 'magnesio-potasio', name: 'Magnesio + Potasio', sub: 'Cápsulas', price: 14800,
      category: 'Vitaminas',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 35, badge: null, tone: 'sage',
      blurb: 'Dupla electrolítica para rendimiento, recuperación y calambres.',
      visible: true, featured: false,
    },
    {
      id: 'colageno', name: 'Colágeno', sub: 'Hidrolizado Tipo I & III', price: 12700,
      category: 'Colágeno',
      sizes: ['300 gr', '500 gr'], rating: 4.7, reviews: 66, badge: null, tone: 'paper',
      blurb: 'Soporte para articulaciones, piel y tejido conectivo. Alta biodisponibilidad.',
      visible: true, featured: true,
    },
    {
      id: 'colageno-plus', name: 'Colágeno Plus', sub: 'Con Vitamina C y Ácido Hialurónico', price: 27000,
      category: 'Colágeno',
      sizes: ['300 gr', '500 gr'], rating: 4.8, reviews: 43, badge: 'Premium', tone: 'paper',
      blurb: 'Fórmula potenciada: colágeno hidrolizado + vitamina C + ácido hialurónico.',
      visible: true, featured: false,
    },
    {
      id: 'espirulina', name: 'Espirulina', sub: 'Spirulina platensis', price: 12699,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 29, badge: null, tone: 'green',
      blurb: 'Superalimento completo. Proteína, hierro, clorofila y antioxidantes naturales.',
      visible: true, featured: false,
    },
    {
      id: 'curcuma', name: 'Cúrcuma', sub: 'Curcumina + Piperina', price: 10500,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.8, reviews: 73, badge: null, tone: 'navy',
      blurb: 'Antiinflamatorio natural. La piperina potencia la absorción de curcumina hasta 20×.',
      visible: true, featured: false,
    },
    {
      id: 'maca', name: 'Maca', sub: 'Lepidium meyenii', price: 12900,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.7, reviews: 38, badge: null, tone: 'sage',
      blurb: 'Adaptógeno andino. Vitalidad, energía sostenida y equilibrio hormonal natural.',
      visible: true, featured: false,
    },
    {
      id: 'ajo-vitamina-c', name: 'Ajo + Vitamina C', sub: 'Extracto de ajo + ascorbato', price: 9300,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.7, reviews: 47, badge: null, tone: 'green',
      blurb: 'Defensa inmunológica natural. Ajo deshidratado concentrado + vitamina C.',
      visible: true, featured: false,
    },
    {
      id: 'cardo-mariano', name: 'Cardo Mariano', sub: 'Silimarina 80%', price: 13000,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.7, reviews: 52, badge: null, tone: 'navy',
      blurb: 'Protección y regeneración hepática. Extracto estandarizado en silimarina 80%.',
      visible: true, featured: false,
    },
    {
      id: 'cartilago-tiburon', name: 'Cartílago de Tiburón', sub: 'Condroitina natural', price: 15500,
      category: 'Articulaciones',
      sizes: ['60 caps', '120 caps'], rating: 4.6, reviews: 61, badge: null, tone: 'navy',
      blurb: 'Soporte articular natural. Rico en condroitina para movilidad y flexibilidad.',
      visible: true, featured: false,
    },
    {
      id: 'zeolita', name: 'Zeolita', sub: 'Clinoptilolita activada', price: 13950,
      category: 'Bienestar',
      sizes: ['60 caps', '120 caps'], rating: 4.7, reviews: 34, badge: null, tone: 'navy',
      blurb: 'Desintoxicación celular y equilibrio del pH. Zeolita clínica de alta pureza.',
      visible: true, featured: false,
    },
  ],

  fmt: (n) => '$' + Math.round(n).toLocaleString('es-CL'),

  /* Precio para una presentación específica. */
  priceFor(product, sizeLabel) {
    const variants = (product.variants && product.variants.length)
      ? product.variants
      : [{ label: (product.sizes && product.sizes[0]) || 'Único', price: product.price }];
    const v = variants.find(x => x.label === sizeLabel) || variants[0];
    return v ? v.price : (product.price || 0);
  },

  /* ¿Tiene presentaciones con precios distintos? */
  hasPriceRange(product) {
    if (!product.variants || product.variants.length < 2) return false;
    const prices = product.variants.map(v => v.price);
    return Math.min(...prices) !== Math.max(...prices);
  },

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
