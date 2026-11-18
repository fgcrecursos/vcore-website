/* =====================================================================
   VCORE — Reglas de precio del pedido
   ---------------------------------------------------------------------
   Lo usan la tienda (data.jsx y el carrito, vía window.VcorePrecios) y la Edge
   Function de Mercado Pago (supabase/functions/_shared/precios.js es una COPIA
   IDÉNTICA de este archivo), que recalcula el total en el servidor antes de
   cobrar: el pedido lo arma el navegador y no se puede confiar en su total.

   Si cambiás una regla acá, copiá el archivo a supabase/functions/_shared/ y
   volvé a deployar mp-crear-pago. Si quedan distintos, el servidor rechaza el
   pago con "los precios cambiaron" (falla del lado seguro: no cobra de menos).
   ===================================================================== */
(function (g) {
  /* Umbrales y descuentos iguales a Somos Setas: Mayorista paga $250.000 con -30%
     (250000/0.70 ≈ 357143 de subtotal crudo) y Distribuidor paga $500.000 con -40%
     (500000/0.60 ≈ 833334 de subtotal crudo). */
  const TIERS = [
    { id: 'retail',      label: 'Minorista',   min: 0,       discount: 0,    badge: null },
    { id: 'wholesale',   label: 'Mayorista',    min: 357143,  discount: 0.30, badge: '−30%' },
    { id: 'distributor', label: 'Distribuidor', min: 833334,  discount: 0.40, badge: '−40%' },
  ];

  /* Envío: valor de fábrica mientras config.envio no traiga el dato. La zona
     'otra' no se puede borrar: es a la que cae cualquier zona que ya no exista. */
  const ENVIO_DEFAULT = {
    gratisSucursalDesde:  200000,
    gratisDomicilioDesde: 300000,
    costoSucursal:        8800,
    zonas: [
      { id: 'mendoza-ciudad',        label: 'Ciudad de Mendoza',                                    costo: 3000, cps: ['5500', '5502'] },
      { id: 'godoy-cruz',            label: 'Godoy Cruz',                                            costo: 3000, cps: ['5501', '5503', '5504', '5547'] },
      { id: 'las-heras',             label: 'Las Heras (Centro y El Plumerillo)',                    costo: 3500, cps: ['5539', '5540', '5541', '5542'] },
      { id: 'las-heras-algarrobal',  label: 'Las Heras (Algarrobal, Panquegua, Borbollón)',           costo: 4000, cps: ['5539', '5541'] },
      { id: 'guaymallen',            label: 'Guaymallén (Centro y Villanueva)',                      costo: 3500, cps: ['5519', '5521', '5523', '5526'] },
      { id: 'guaymallen-corralitos', label: 'Guaymallén (Corralitos, Rodeo de la Cruz, Corralitos)',  costo: 4000, cps: ['5525', '5527'] },
      { id: 'maipu',                 label: 'Maipú',                                                 costo: 3500, cps: ['5511', '5513', '5515', '5516', '5517', '5522'] },
      { id: 'lujan',                 label: 'Luján de Cuyo (Centro y Carrodilla)',                   costo: 4000, cps: ['5505', '5507'] },
      { id: 'lujan-chacras',         label: 'Luján de Cuyo (Chacras, Vistalba, Mayor Drummond)',      costo: 4500, cps: ['5505', '5507', '5508', '5509', '5528', '5534'] },
      { id: 'perdriel',              label: 'Perdriel',                                               costo: 4500, cps: ['5509', '5544'] },
      { id: 'otra',                  label: 'Resto de la provincia / país',                           costo: 12000, cps: [] },
    ],
  };

  /* Config de envío efectiva: lo guardado, completado con ENVIO_DEFAULT. */
  function envioDe(cfg) {
    const e = (cfg && cfg.envio) || {};
    const d = ENVIO_DEFAULT;
    const num = (v, def) => (v !== '' && v != null && Number.isFinite(Number(v)) ? Number(v) : def);
    /* Una zona guardada antes de que existieran los códigos postales toma los
       de fábrica de la zona con el mismo id. */
    const zonas = (Array.isArray(e.zonas) && e.zonas.length ? e.zonas : d.zonas).map(z => {
      if (Array.isArray(z.cps)) return z;
      const fab = d.zonas.find(x => x.id === z.id);
      return { ...z, cps: fab ? fab.cps : [] };
    });
    return {
      gratisSucursalDesde:  num(e.gratisSucursalDesde,  d.gratisSucursalDesde),
      gratisDomicilioDesde: num(e.gratisDomicilioDesde, d.gratisDomicilioDesde),
      costoSucursal:        num(e.costoSucursal,        d.costoSucursal),
      zonas: zonas.some(z => z.id === 'otra') ? zonas : [...zonas, d.zonas.find(z => z.id === 'otra')],
    };
  }
  function zonaEnvio(zonaId, zonas) {
    const zs = zonas || ENVIO_DEFAULT.zonas;
    return zs.find(z => z.id === zonaId) || zs.find(z => z.id === 'otra');
  }
  /* Zonas que corresponden a un código postal (5500 o M5500ABC). null = CP
     incompleto; [] = ninguna zona lo tiene, o sea "Resto de la provincia / país";
     más de una = el CP abarca varias zonas y elige la clienta. */
  function zonasPorCP(cp, zonas) {
    const m = String(cp || '').trim().match(/^[a-z]?(\d{4})/i);
    if (!m) return null;
    return (zonas || ENVIO_DEFAULT.zonas).filter(z => z.id !== 'otra' && (z.cps || []).includes(m[1]));
  }
  /* Opciones de envío de la tienda, armadas con los montos de la config.
     `base` de 'home' es el default de la remitera manual (zona 'otra'). */
  function opcionesEnvio(envio) {
    return [
      { id: 'andreani', label: 'Andreani — Sucursal', base: envio.costoSucursal,                    freeFrom: envio.gratisSucursalDesde },
      { id: 'home',     label: 'A domicilio',          base: zonaEnvio('otra', envio.zonas).costo, freeFrom: envio.gratisDomicilioDesde },
      { id: 'pickup',   label: 'Retiro en local',      base: 0,                                     freeFrom: 0 },
    ];
  }
  /* `subtotal` es el subtotal crudo del carrito (antes de descuentos), igual que
     en Somos Setas: los pisos de envío gratis se evalúan contra el subtotal. */
  function costoEnvio(shippingId, subtotal, zonaId, envio) {
    const opt = opcionesEnvio(envio).find(s => s.id === shippingId);
    if (!opt) return 0;
    if (opt.freeFrom !== null && subtotal >= opt.freeFrom) return 0;
    if (shippingId === 'home') return zonaEnvio(zonaId, envio.zonas).costo;
    return opt.base;
  }

  function getTier(subtotal) {
    return [...TIERS].reverse().find(t => subtotal >= t.min) || TIERS[0];
  }

  /* ---------- Promociones ----------
     Una presentación puede traer `pricePromo` y `promoHasta` (AAAA-MM-DD,
     inclusive, en hora de Argentina). Mientras esté vigente, la tienda y el
     cobro usan el precio promo; desde el día siguiente vuelve sola a `price`,
     sin que nadie tenga que tocar nada. El mayorista no cambia. */
  function hoyAR(ahora) {
    return new Date((ahora == null ? Date.now() : ahora) - 3 * 3600 * 1000).toISOString().slice(0, 10);
  }
  function promoVigente(v, ahora) {
    const promo = Number(v && v.pricePromo);
    return promo > 0 && promo < Number(v.price)
      && /^\d{4}-\d{2}-\d{2}$/.test(String(v.promoHasta || ''))
      && hoyAR(ahora) <= v.promoHasta;
  }
  function precioDe(v, ahora) {
    return promoVigente(v, ahora) ? Number(v.pricePromo) : (Number(v && v.price) || 0);
  }

  /* Precio para una presentación específica (con la promo, si está vigente). */
  function priceFor(product, sizeLabel) {
    const variants = (product.variants && product.variants.length)
      ? product.variants
      : [{ label: (product.sizes && product.sizes[0]) || 'Único', price: product.price }];
    const v = variants.find(x => x.label === sizeLabel) || variants[0];
    return v ? precioDe(v) : (product.price || 0);
  }

  /* ---------- Promos por cantidad (llevás N, pagás M) ----------
     Cada promo vale para un escalón (el tipo de cliente se decide por el monto
     del pedido, igual que el descuento) y una lista de productos. Se cuenta por
     presentación: 3 iguales del mismo producto y tamaño = 1 gratis (no se
     mezclan tamaños con precios distintos). La unidad gratis vale su precio de
     lista y el descuento del escalón se calcula después, sobre lo que queda.
     `desde`/`hasta` = primer y último día (AAAA-MM-DD, hora de Argentina,
     inclusive); null = sin límite. */
  const PROMO_PRODUCTOS = ['bicarbonato-sodio', 'vitamina-c', 'vitamina-c-polvo'];
  const PROMOS_CANTIDAD = [
    { id: 'bicarb-vitc-3x2-mayorista',      tier: 'wholesale',   productos: PROMO_PRODUCTOS, lleva: 3, paga: 2, nombre: '3x2', desde: '2026-11-18', hasta: null },
    { id: 'bicarb-vitc-5mas2-distribuidor', tier: 'distributor', productos: PROMO_PRODUCTOS, lleva: 7, paga: 5, nombre: '5+2', desde: '2026-11-18', hasta: null },
  ];
  function promoCantidadVigente(pr, hoy) {
    const d = hoy || hoyAR();
    return (!pr.desde || d >= pr.desde) && (!pr.hasta || d <= pr.hasta);
  }
  /* Promos vigentes de un producto para un escalón ('retail' | 'wholesale' | 'distributor'). */
  function promosDeProducto(productId, tierId, hoy) {
    return PROMOS_CANTIDAD.filter(pr => pr.tier === tierId && pr.productos.includes(productId) && promoCantidadVigente(pr, hoy));
  }
  /* Unidades gratis y ahorro. items: [{ productId, size, qty, price, name }] con
     `price` = precio unitario de lista. */
  function promosCantidad(items, tierId, hoy) {
    const grupos = new Map();
    (items || []).forEach(it => {
      const qty = Math.floor(Number(it.qty)) || 0;
      if (qty <= 0 || !it.productId) return;
      const clave = it.productId + '|' + (it.size || '');
      const g0 = grupos.get(clave);
      if (g0) g0.qty += qty;
      else grupos.set(clave, { productId: it.productId, size: it.size || '', qty, price: Number(it.price) || 0,
        nombre: [it.name, it.size].filter(Boolean).join(' — ') });
    });
    const lineas = [];
    grupos.forEach(g1 => {
      const pr = promosDeProducto(g1.productId, tierId, hoy)[0];
      if (!pr || !(g1.price > 0)) return;
      const gratis = Math.floor(g1.qty / pr.lleva) * (pr.lleva - pr.paga);
      if (gratis > 0) lineas.push({ ...g1, promoId: pr.id, promo: pr.nombre, gratis, ahorro: gratis * g1.price });
    });
    return { descAmt: lineas.reduce((a, l) => a + l.ahorro, 0), lineas };
  }
  /* La tabla `orders` no tiene columna para la promo: viaja dentro de los
     ítems (jsonb). marcarPromo deja `promo` y `promoGratis` en el primer ítem de
     cada grupo; promoDeItems la reconstruye al leer el pedido. */
  function marcarPromo(items, lineas) {
    const usados = new Set();
    return (items || []).map(it => {
      const clave = (it.productId || '') + '|' + (it.size || '');
      const l = (lineas || []).find(x => x.productId + '|' + x.size === clave);
      const limpio = { ...it };
      delete limpio.promo; delete limpio.promoGratis;
      if (!l || usados.has(clave)) return limpio;
      usados.add(clave);
      return { ...limpio, promo: l.promo, promoGratis: l.gratis };
    });
  }
  function promoDeItems(items) {
    const lineas = (items || []).filter(i => Number(i.promoGratis) > 0).map(i => ({
      productId: i.productId || '', size: i.size || '', promo: i.promo || '',
      nombre: [i.name, i.size].filter(Boolean).join(' — '),
      gratis: Number(i.promoGratis), ahorro: Number(i.promoGratis) * (Number(i.price) || 0),
    }));
    return { descAmt: lineas.reduce((a, l) => a + l.ahorro, 0), lineas };
  }
  /* "Promo 3x2 Bicarbonato de Sodio — 500 g (1 gratis)" */
  const detallePromo = (l) => `Promo ${l.promo}${l.nombre ? ' ' + l.nombre : ''} (${l.gratis} gratis)`;

  /* Códigos activos como mapa { CODIGO: fracción }, a partir de las filas de `codes`. */
  function mapaCodigos(filas) {
    const obj = {};
    (filas || []).filter(c => c.active).forEach(c => { obj[c.code] = c.value / 100; });
    return obj;
  }

  /* La cuenta completa del carrito: promo por cantidad, escalón, código, envío y
     total. items (opcional) = las líneas, para las promos por cantidad. */
  function calcularPedido({ subtotal, codigo, codigos, shippingId, zonaId, config, items, hoy }) {
    const envio = envioDe(config);
    const tier = getTier(subtotal);
    const promo = promosCantidad(items, tier.id, hoy);
    const promoSaving = promo.descAmt;
    const tierSaving = Math.round((subtotal - promoSaving) * tier.discount);
    const afterTier = subtotal - promoSaving - tierSaving;
    const codeDiscount = codigo ? (codigos[codigo] || 0) : 0;
    const codeSaving = Math.round(afterTier * codeDiscount);
    const afterCode = afterTier - codeSaving;
    const shippingCost = costoEnvio(shippingId, subtotal, zonaId, envio);
    return { envio, tier, promo, promoSaving, tierSaving, afterTier, codeDiscount, codeSaving, afterCode, shippingCost, total: afterCode + shippingCost };
  }

  /* ---------- Medios de pago ----------
     Los que ofrece el checkout. `mp: true` se cobra con Mercado Pago (Checkout
     Pro, limitado a ese medio) y se confirma solo; la transferencia va a la
     cuenta de la tienda y el cobro se registra a mano. Igual que Somos Setas. */
  const MEDIOS_PAGO = [
    { id: 'tarjeta',       label: 'Tarjeta de crédito o débito',        mp: true },
    { id: 'transferencia', label: 'Transferencia bancaria',             mp: false },
    { id: 'efectivo',      label: 'Efectivo',                           mp: true, detalle: 'En Rapipago o Pago Fácil' },
    { id: 'mercadopago',   label: 'Mercado Pago',                       mp: true },
    { id: 'cuotas',        label: 'Cuotas sin Tarjeta de Mercado Pago', mp: true },
  ];
  const cobraPorMP = (id) => MEDIOS_PAGO.some(m => m.id === id && m.mp);
  const medioLabel = (id) => (MEDIOS_PAGO.find(m => m.id === id) || {}).label || '';

  g.VcorePrecios = {
    TIERS, ENVIO_DEFAULT, envioDe, zonaEnvio, zonasPorCP, opcionesEnvio, costoEnvio, getTier, priceFor,
    hoyAR, promoVigente, precioDe, mapaCodigos,
    PROMOS_CANTIDAD, promoCantidadVigente, promosDeProducto, promosCantidad, detallePromo, marcarPromo, promoDeItems, calcularPedido, MEDIOS_PAGO, cobraPorMP, medioLabel,
  };
})(typeof window !== 'undefined' ? window : globalThis);
