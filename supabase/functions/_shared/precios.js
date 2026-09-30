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
    gratisSucursalDesde:  180000,
    gratisDomicilioDesde: 280000,
    costoSucursal:        7500,
    zonas: [
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
  };

  /* Config de envío efectiva: lo guardado, completado con ENVIO_DEFAULT. */
  function envioDe(cfg) {
    const e = (cfg && cfg.envio) || {};
    const d = ENVIO_DEFAULT;
    const num = (v, def) => (v !== '' && v != null && Number.isFinite(Number(v)) ? Number(v) : def);
    const zonas = Array.isArray(e.zonas) && e.zonas.length ? e.zonas : d.zonas;
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

  /* Precio para una presentación específica. */
  function priceFor(product, sizeLabel) {
    const variants = (product.variants && product.variants.length)
      ? product.variants
      : [{ label: (product.sizes && product.sizes[0]) || 'Único', price: product.price }];
    const v = variants.find(x => x.label === sizeLabel) || variants[0];
    return v ? v.price : (product.price || 0);
  }

  /* Códigos activos como mapa { CODIGO: fracción }, a partir de las filas de `codes`. */
  function mapaCodigos(filas) {
    const obj = {};
    (filas || []).filter(c => c.active).forEach(c => { obj[c.code] = c.value / 100; });
    return obj;
  }

  /* La cuenta completa del carrito: escalón, código, envío y total. */
  function calcularPedido({ subtotal, codigo, codigos, shippingId, zonaId, config }) {
    const envio = envioDe(config);
    const tier = getTier(subtotal);
    const tierSaving = Math.round(subtotal * tier.discount);
    const afterTier = subtotal - tierSaving;
    const codeDiscount = codigo ? (codigos[codigo] || 0) : 0;
    const codeSaving = Math.round(afterTier * codeDiscount);
    const afterCode = afterTier - codeSaving;
    const shippingCost = costoEnvio(shippingId, subtotal, zonaId, envio);
    return { envio, tier, tierSaving, afterTier, codeDiscount, codeSaving, afterCode, shippingCost, total: afterCode + shippingCost };
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
    TIERS, ENVIO_DEFAULT, envioDe, zonaEnvio, opcionesEnvio, costoEnvio, getTier, priceFor,
    mapaCodigos, calcularPedido, MEDIOS_PAGO, cobraPorMP, medioLabel,
  };
})(typeof window !== 'undefined' ? window : globalThis);
