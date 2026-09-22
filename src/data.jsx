/* Vcore website — catalog, discount tiers, shipping, promo codes.
   Fuente de datos: Supabase cuando está configurado (window.VcoreBackend.isOn()),
   con caché en memoria + espejo en localStorage (stale-while-revalidate).
   Sin backend → modo demo (localStorage + catálogo _base). */
function _readLS(key) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
}

window.VcoreData = {

  /* Umbrales y descuentos iguales a Somos Setas: Mayorista paga $250.000 con -30%
     (250000/0.70 ≈ 357143 de subtotal crudo) y Distribuidor paga $500.000 con -40%
     (500000/0.60 ≈ 833334 de subtotal crudo). Ver T_MAYORISTA/T_DISTRIBUIDOR en
     store.jsx de Somos Setas. */
  tiers: [
    { id: 'retail',      label: 'Minorista',   min: 0,       discount: 0,    badge: null },
    { id: 'wholesale',   label: 'Mayorista',    min: 357143,  discount: 0.30, badge: '−30%' },
    { id: 'distributor', label: 'Distribuidor', min: 833334,  discount: 0.40, badge: '−40%' },
  ],

  /* Pisos de envio gratis iguales a Somos Setas (FREE_SUCURSAL_FROM/FREE_DOMICILIO_FROM
     en su store.jsx): se evaluan sobre el subtotal crudo, no sobre el monto post-descuento
     (ver getShippingCost). */
  shipping: [
    { id: 'andreani', label: 'Andreani — Sucursal', base: 7500, freeFrom: 150000 },
    { id: 'home',     label: 'A domicilio',          base: 8800, freeFrom: 280000 },
    { id: 'pickup',   label: 'Retiro en local',      base: 0,    freeFrom: 0      },
  ],

  /* Envío a domicilio en zona de Mendoza: varía según localidad (ver zonaEnvio).
     `base` de 'home' arriba queda como default conservador para la remitera manual
     del admin, que no conoce la zona hasta que se carga a mano (mismo patrón que
     REMITO_SHIP_DOMICILIO en Somos Setas). */
  ZONAS_ENVIO: [
    { id: 'mendoza-ciudad',        label: 'Ciudad de Mendoza',                                    costo: 3000 },
    { id: 'godoy-cruz',            label: 'Godoy Cruz',                                            costo: 3000 },
    { id: 'las-heras',             label: 'Las Heras (Centro y El Plumerillo)',                    costo: 3500 },
    { id: 'las-heras-algarrobal',  label: 'Las Heras (Algarrobal, Panquegua, Borbollón)',           costo: 4000 },
    { id: 'guaymallen',            label: 'Guaymallén (Centro y Villanueva)',                      costo: 3500 },
    { id: 'guaymallen-corralitos', label: 'Guaymallén (Corralitos, Rodeo de la Cruz, Corralitos)',  costo: 4000 },
    { id: 'maipu',                 label: 'Maipú',                                                 costo: 3500 },
    { id: 'lujan',                 label: 'Luján de Cuyo (Centro y Carrodilla)',                   costo: 4000 },
    { id: 'lujan-chacras',         label: 'Luján de Cuyo (Chacras, Vistalba, Mayor Drummond)',      costo: 4500 },
    { id: 'perdriel',              label: 'Perdriel',                                               costo: 4500 },
    { id: 'otra',                  label: 'Resto de la provincia / país',                           costo: 8800 },
  ],

  zonaEnvio(zonaId) {
    return this.ZONAS_ENVIO.find(z => z.id === zonaId) || this.ZONAS_ENVIO.find(z => z.id === 'otra');
  },

  /* caché en memoria, inicializada desde localStorage para mostrar al instante */
  _cache: {
    products: _readLS('vc-products'),
    codes:    _readLS('vc-codes'),
    config:   _readLS('vc-config'),
    banners:  _readLS('vc-banners'),
  },

  get _backendOn() { return !!(window.VcoreBackend && window.VcoreBackend.isOn()); },

  /* Carga inicial desde Supabase → refresca caché + localStorage y avisa a la app */
  async loadFromBackend() {
    if (!this._backendOn) return;
    try {
      const [products, codes, config, bannersRaw] = await Promise.all([
        window.VcoreBackend.fetchProducts(),
        window.VcoreBackend.fetchCodes(),
        window.VcoreBackend.fetchConfig(),
        window.VcoreBackend.fetchBanners(),
      ]);
      if (products) { this._cache.products = products; localStorage.setItem('vc-products', JSON.stringify(products)); }
      if (codes)    { this._cache.codes = codes;       localStorage.setItem('vc-codes', JSON.stringify(codes)); }
      if (config)   { this._cache.config = config;     localStorage.setItem('vc-config', JSON.stringify(config)); }
      if (bannersRaw) {
        const banners = bannersRaw.map(r => window.VcoreBackend._mapBanner(r));
        this._cache.banners = banners;
        localStorage.setItem('vc-banners', JSON.stringify(banners));
      }
    } catch (e) {
      console.error('[Vcore] loadFromBackend', e && e.message);
    }
    window.dispatchEvent(new CustomEvent('vc:data-loaded'));
  },

  /* Banners activos del hero (ordenados por sort) */
  get banners() {
    let arr = this._backendOn ? this._cache.banners : _readLS('vc-banners');
    if (!arr || !arr.length) return null;    // null → home usa los slides hardcoded
    return arr.filter(b => b.active !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  },

  /* Fuente cruda de productos: caché (backend) o localStorage/_base (demo) */
  _rawProducts() {
    if (this._backendOn) return this._cache.products || this._base;
    return _readLS('vc-products') || this._base;
  },

  /* Códigos activos como mapa { CODIGO: fracción } */
  get codes() {
    let arr = this._backendOn ? this._cache.codes : _readLS('vc-codes');
    if (!arr) return this._backendOn ? {} : { 'VCORE10': 0.10, 'BIENVENIDO': 0.15 };
    const obj = {};
    arr.filter(c => c.active).forEach(c => { obj[c.code] = c.value / 100; });
    return obj;
  },

  /* Datos de contacto del negocio */
  get config() {
    if (this._backendOn && this._cache.config) return this._cache.config;
    return _readLS('vc-config') || { whatsapp: '5491100000000', address: '', instagram: '', email: '' };
  },

  categories: ['Todo', 'Rendimiento', 'Recuperación', 'Vitaminas', 'Bienestar', 'Colágeno', 'Articulaciones'],

  /* Normaliza un producto: garantiza variants [{label, price, priceMayorista}],
     sizes [labels] y price (precio "desde" = el menor). Compatible con productos
     legacy que traían sizes + un único price.
     `priceMayorista` es opcional y solo lo usa la remitera del panel (lista de
     precios mayorista); la tienda siempre cotiza con `price`. */
  _normalize(p) {
    let variants;
    if (Array.isArray(p.variants) && p.variants.length) {
      variants = p.variants
        .map(v => ({
          label: String(v.label || '').trim(),
          price: Number(v.price) || 0,
          priceMayorista: Number(v.priceMayorista) || 0,
        }))
        .filter(v => v.label);
    } else {
      const sizes = (p.sizes && p.sizes.length) ? p.sizes : ['Único'];
      variants = sizes.map(label => ({ label: String(label).trim(), price: Number(p.price) || 0, priceMayorista: 0 }));
    }
    if (!variants.length) variants = [{ label: 'Único', price: Number(p.price) || 0, priceMayorista: 0 }];
    const minPrice = Math.min(...variants.map(v => v.price));
    return { ...p, variants, sizes: variants.map(v => v.label), price: minPrice };
  },

  /* Catálogo visible (tienda) y completo (admin), normalizados */
  get products() {
    return this._rawProducts().filter(p => p.visible !== false).map(p => this._normalize(p));
  },

  get allProducts() {
    return this._rawProducts().map(p => this._normalize(p));
  },

  _base: [
    {
      id: 'creatina', name: 'Creatina', sub: 'Monohidrato', price: 23000,
      category: 'Rendimiento',
      variants: [{ label: '300 gr', price: 23000, priceMayorista: 16100 }, { label: '500 gr', price: 32000, priceMayorista: 22400 }],
      rating: 4.9, reviews: 312, badge: 'Más vendido',
      photo: '/assets/vcore-pack-creatina-monohidrato.jpg', tone: 'green',
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
      sizes: ['1 kg', '2 kg'], rating: 4.8, reviews: 198, badge: null, tone: 'coral',
      blurb: 'Recuperación y construcción muscular con proteína de alta absorción.',
      visible: true, featured: true,
    },
    {
      id: 'magnesio', name: 'Magnesio', sub: 'Bisglicinato', price: 14800,
      category: 'Recuperación',
      variants: [{ label: '120 caps', price: 14800, priceMayorista: 10360 }],
      rating: 4.9, reviews: 87, badge: null, tone: 'coral',
      blurb: 'Descanso, recuperación y función muscular para cerrar bien el día.',
      visible: true, featured: true,
    },
    {
      id: 'vitamina-c', name: 'Vitamina C', sub: 'Ascorbato puro — Cápsulas', price: 11400,
      category: 'Vitaminas',
      variants: [{ label: '60 caps', price: 11400, priceMayorista: 7980 }, { label: '120 caps', price: 11400, priceMayorista: 7980 }],
      rating: 4.8, reviews: 54, badge: null, tone: 'navy',
      blurb: 'Antioxidante esencial. Apoyo inmunológico y síntesis de colágeno sin excipientes.',
      visible: true, featured: false,
    },
    {
      id: 'vitamina-c-polvo', name: 'Vitamina C', sub: 'Ascorbato puro — Polvo', price: 7300,
      category: 'Vitaminas',
      sizes: ['100 gr', '250 gr'], rating: 4.8, reviews: 31, badge: null, tone: 'navy',
      blurb: 'Vitamina C en polvo de alta pureza. Dosificación flexible, sin excipientes.',
      visible: true, featured: false,
    },
    {
      id: 'triple-mag', name: 'Triple Magnesio', sub: 'Citrato · Glicinato · Malato — Cápsulas', price: 16500,
      category: 'Vitaminas',
      variants: [{ label: '90 caps', price: 16500, priceMayorista: 11550 }, { label: '180 caps', price: 16500, priceMayorista: 11550 }],
      rating: 4.9, reviews: 41, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-triple-magnesio.jpg',
      blurb: 'Tres formas de magnesio en una cápsula. Máxima absorción y biodisponibilidad.',
      visible: true, featured: false,
    },
    {
      id: 'triple-mag-polvo', name: 'Triple Magnesio', sub: 'Citrato · Glicinato · Malato — Polvo', price: 15000,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.8, reviews: 19, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-triple-magnesio.jpg',
      blurb: 'Triple magnesio en polvo. Dosificación precisa, sin cápsulas.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-magnesio', name: 'Citrato de Magnesio', sub: 'Cápsulas', price: 14000,
      category: 'Vitaminas',
      variants: [{ label: '60 caps', price: 14000, priceMayorista: 9800 }, { label: '120 caps', price: 14000, priceMayorista: 9800 }],
      rating: 4.8, reviews: 33, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-citrato-magnesio.jpg',
      blurb: 'Alta absorción y tolerancia digestiva. Forma clásica y bien estudiada.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-magnesio-polvo', name: 'Citrato de Magnesio', sub: 'Polvo', price: 7000,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.8, reviews: 22, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-citrato-magnesio.jpg',
      blurb: 'Citrato de magnesio en polvo. Disolvé en agua o jugo, sin sabor agregado.',
      visible: true, featured: false,
    },
    {
      id: 'glicinato-magnesio', name: 'Glicinato de Magnesio', sub: 'Cápsulas', price: 16800,
      category: 'Vitaminas',
      variants: [{ label: '60 caps', price: 16800, priceMayorista: 11760 }, { label: '120 caps', price: 16800, priceMayorista: 11760 }],
      rating: 4.9, reviews: 28, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-glicinato-magnesio.jpg',
      blurb: 'La forma más suave y biodisponible. Ideal para relajación y sueño.',
      visible: true, featured: false,
    },
    {
      id: 'glicinato-magnesio-polvo', name: 'Glicinato de Magnesio', sub: 'Polvo', price: 12700,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.9, reviews: 14, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-glicinato-magnesio.jpg',
      blurb: 'Glicinato en polvo para mayor flexibilidad de dosis.',
      visible: true, featured: false,
    },
    {
      id: 'malato-magnesio', name: 'Malato de Magnesio', sub: 'Cápsulas', price: 15860,
      category: 'Vitaminas',
      variants: [{ label: '60 caps', price: 15860, priceMayorista: 11102 }, { label: '120 caps', price: 15860, priceMayorista: 11102 }],
      rating: 4.8, reviews: 17, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-malato-magnesio.jpg',
      blurb: 'Energía mitocondrial y función muscular. Ideal para rendimiento físico.',
      visible: true, featured: false,
    },
    {
      id: 'malato-magnesio-polvo', name: 'Malato de Magnesio', sub: 'Polvo', price: 12000,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.7, reviews: 11, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-malato-magnesio.jpg',
      blurb: 'Malato de magnesio en polvo. Fácil de incorporar a bebidas deportivas.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-potasio', name: 'Citrato de Potasio', sub: 'Cápsulas', price: 13500,
      category: 'Vitaminas',
      variants: [{ label: '60 caps', price: 13500, priceMayorista: 9450 }, { label: '120 caps', price: 13500, priceMayorista: 9450 }],
      rating: 4.7, reviews: 24, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-citrato-potasio.jpg',
      blurb: 'Equilibrio electrolítico, función muscular y cardiovascular. Alta absorción.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-potasio-polvo', name: 'Citrato de Potasio', sub: 'Polvo', price: 6200,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.7, reviews: 16, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-citrato-potasio.jpg',
      blurb: 'Potasio en polvo soluble. Ideal para combinar con magnesio en bebidas.',
      visible: true, featured: false,
    },
    {
      id: 'citrato-mg-k-polvo', name: 'Citrato Mg + K', sub: 'Magnesio + Potasio — Polvo', price: 7200,
      category: 'Vitaminas',
      sizes: ['150 gr', '300 gr'], rating: 4.8, reviews: 20, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-magnesio-potasio.jpg',
      blurb: 'Fórmula combinada de citrato de magnesio y potasio. Electrolitos completos.',
      visible: true, featured: false,
    },
    {
      id: 'magnesio-potasio', name: 'Magnesio + Potasio', sub: 'Cápsulas', price: 13000,
      category: 'Vitaminas',
      variants: [{ label: '60 caps', price: 13000, priceMayorista: 9100 }, { label: '120 caps', price: 13000, priceMayorista: 9100 }],
      rating: 4.8, reviews: 35, badge: null, tone: 'navy',
      photo: '/assets/vcore-pack-magnesio-potasio.jpg',
      blurb: 'Dupla electrolítica para rendimiento, recuperación y calambres.',
      visible: true, featured: false,
    },
    {
      id: 'colageno', name: 'Colágeno', sub: 'Hidrolizado Tipo I & III', price: 12700,
      category: 'Colágeno',
      sizes: ['300 gr', '500 gr'], rating: 4.7, reviews: 66, badge: null, tone: 'coral',
      blurb: 'Soporte para articulaciones, piel y tejido conectivo. Alta biodisponibilidad.',
      visible: true, featured: true,
    },
    {
      id: 'colageno-plus', name: 'Colágeno Plus', sub: 'Con Vitamina C y Ácido Hialurónico', price: 27000,
      category: 'Colágeno',
      sizes: ['300 gr', '500 gr'], rating: 4.8, reviews: 43, badge: 'Premium', tone: 'coral',
      blurb: 'Fórmula potenciada: colágeno hidrolizado + vitamina C + ácido hialurónico.',
      visible: true, featured: false,
    },
    {
      id: 'espirulina', name: 'Espirulina', sub: 'Spirulina platensis', price: 12700,
      category: 'Bienestar',
      variants: [{ label: '60 caps', price: 12700, priceMayorista: 8890 }, { label: '120 caps', price: 12700, priceMayorista: 8890 }],
      rating: 4.8, reviews: 29, badge: null, tone: 'sage',
      blurb: 'Superalimento completo. Proteína, hierro, clorofila y antioxidantes naturales.',
      visible: true, featured: false,
    },
    {
      id: 'curcuma', name: 'Cúrcuma', sub: 'Curcumina + Piperina', price: 10500,
      category: 'Bienestar',
      variants: [{ label: '60 caps', price: 10500, priceMayorista: 7350 }, { label: '120 caps', price: 10500, priceMayorista: 7350 }],
      rating: 4.8, reviews: 73, badge: null, tone: 'sage',
      blurb: 'Antiinflamatorio natural. La piperina potencia la absorción de curcumina hasta 20×.',
      visible: true, featured: false,
    },
    {
      id: 'maca', name: 'Maca', sub: 'Lepidium meyenii', price: 12900,
      category: 'Bienestar',
      variants: [{ label: '60 caps', price: 12900, priceMayorista: 9030 }, { label: '120 caps', price: 12900, priceMayorista: 9030 }],
      rating: 4.7, reviews: 38, badge: null, tone: 'sage',
      blurb: 'Adaptógeno andino. Vitalidad, energía sostenida y equilibrio hormonal natural.',
      visible: true, featured: false,
    },
    {
      id: 'ajo-vitamina-c', name: 'Ajo + Vitamina C', sub: 'Extracto de ajo + ascorbato', price: 9300,
      category: 'Bienestar',
      variants: [{ label: '60 caps', price: 9300, priceMayorista: 6510 }, { label: '120 caps', price: 9300, priceMayorista: 6510 }],
      rating: 4.7, reviews: 47, badge: null, tone: 'sage',
      blurb: 'Defensa inmunológica natural. Ajo deshidratado concentrado + vitamina C.',
      visible: true, featured: false,
    },
    {
      id: 'cardo-mariano', name: 'Cardo Mariano', sub: 'Silimarina 80%', price: 13000,
      category: 'Bienestar',
      variants: [{ label: '60 caps', price: 13000, priceMayorista: 9100 }, { label: '120 caps', price: 13000, priceMayorista: 9100 }],
      rating: 4.7, reviews: 52, badge: null, tone: 'sage',
      blurb: 'Protección y regeneración hepática. Extracto estandarizado en silimarina 80%.',
      visible: true, featured: false,
    },
    {
      id: 'cartilago-tiburon', name: 'Cartílago de Tiburón', sub: 'Condroitina natural', price: 15500,
      category: 'Articulaciones',
      variants: [{ label: '60 caps', price: 15500, priceMayorista: 10850 }, { label: '120 caps', price: 15500, priceMayorista: 10850 }],
      rating: 4.6, reviews: 61, badge: null, tone: 'coral',
      blurb: 'Soporte articular natural. Rico en condroitina para movilidad y flexibilidad.',
      visible: true, featured: false,
    },
    {
      id: 'zeolita', name: 'Zeolita', sub: 'Clinoptilolita activada', price: 13950,
      category: 'Bienestar',
      variants: [{ label: '60 caps', price: 13950, priceMayorista: 9765 }, { label: '120 caps', price: 13950, priceMayorista: 9765 }],
      rating: 4.7, reviews: 34, badge: null, tone: 'sage',
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

  /* `subtotal` es el subtotal crudo del carrito (antes de descuentos), igual que en
     Somos Setas: ahi los pisos de envio gratis se evaluan contra el subtotal, no
     contra el monto ya descontado. */
  getShippingCost(shippingId, subtotal, zonaId) {
    const opt = this.shipping.find(s => s.id === shippingId);
    if (!opt) return 0;
    if (opt.freeFrom !== null && subtotal >= opt.freeFrom) return 0;
    if (shippingId === 'home') return this.zonaEnvio(zonaId).costo;
    return opt.base;
  },
};
