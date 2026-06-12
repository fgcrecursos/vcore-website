/* Vcore website — demo catalog data. */
window.VcoreData = {
  products: [
    {
      id: 'creatina', name: 'Creatina', sub: 'Monohidrato', price: 14990,
      sizes: ['300 gr', '500 gr'], rating: 4.9, reviews: 312, badge: 'Más vendido',
      photo: '/assets/product-creatina-locker.jpg',
      tone: 'paper',
      blurb: 'Energía celular, claridad mental y rendimiento para tu rutina diaria. Sin vueltas.',
      stats: [
        { value: '0.0%', label: 'aditivos' },
        { value: '99.5%', label: 'pureza' },
        { value: '60', label: 'servicios' },
        { value: 'Sin', label: 'sabor' },
      ],
      benefits: [
        ['Zap', 'Más energía', 'Potencia tus entrenamientos y tu día.'],
        ['Sparkles', 'Claridad mental', 'Apoya el foco y la función cognitiva.'],
        ['Shield', 'Pureza certificada', 'Monohidrato 99.5%, sin agregados.'],
      ],
    },
    {
      id: 'proteina', name: 'Proteína', sub: 'Whey Isolate', price: 28990,
      sizes: ['1 kg', '2 kg'], rating: 4.8, reviews: 198, badge: null,
      tone: 'green',
      blurb: 'Recuperación y construcción muscular con proteína de alta absorción.',
    },
    {
      id: 'preworkout', name: 'Pre-Workout', sub: 'Energía + foco', price: 19990,
      sizes: ['250 gr'], rating: 4.7, reviews: 144, badge: 'Nuevo',
      tone: 'navy',
      blurb: 'El empujón limpio antes de entrenar. Sin caída, sin nervios.',
    },
    {
      id: 'magnesio', name: 'Magnesio', sub: 'Bisglicinato', price: 11990,
      sizes: ['120 caps'], rating: 4.9, reviews: 87, badge: null,
      tone: 'sage',
      blurb: 'Descanso, recuperación y función muscular para cerrar bien el día.',
    },
  ],
  fmt: (n) => '$' + n.toLocaleString('es-CL'),
};
