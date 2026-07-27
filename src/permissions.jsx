/* Vcore — Roles y permisos del panel de administración.
   Se carga ANTES de admin.jsx (ver main.jsx) porque el panel lo usa para decidir
   qué secciones muestra y qué acciones habilita.

   Los usuarios viven en la tabla `vc_users` de Supabase (ver supabase/schema-v3.sql):
     email · nombre · rol · permisos[] · activo · notas
   El rol define un set de permisos base; `permisos` permite sumarle permisos
   sueltos (rol "custom") sin tocar código. */

/* Emails que SIEMPRE son superadmin, aunque la tabla vc_users todavía no exista
   o quede vacía. Red de seguridad para no quedarse afuera del panel. */
window.VC_SUPERADMINS = ['fngc279@gmail.com', 'hola@vcore.com.ar'];

/* ── Catálogo de permisos, agrupado por área (el orden define el de la UI) ── */
window.VC_PERM_GROUPS = [
  {
    id: 'general', label: 'General',
    perms: [
      { id: 'resumen.ver', label: 'Ver el resumen', desc: 'Acceso a la pantalla de inicio con las métricas del negocio.' },
    ],
  },
  {
    id: 'catalogo', label: 'Catálogo y tienda',
    perms: [
      { id: 'productos.ver',     label: 'Ver productos',     desc: 'Consultar el catálogo y sus precios.' },
      { id: 'productos.editar',  label: 'Editar productos',  desc: 'Crear, modificar y eliminar productos y presentaciones.' },
      { id: 'banners.ver',       label: 'Ver banners',       desc: 'Consultar los banners del hero.' },
      { id: 'banners.editar',    label: 'Editar banners',    desc: 'Crear, modificar, activar y eliminar banners.' },
      { id: 'descuentos.ver',    label: 'Ver descuentos',    desc: 'Consultar los códigos de descuento.' },
      { id: 'descuentos.editar', label: 'Editar descuentos', desc: 'Crear, modificar, activar y eliminar códigos de descuento.' },
    ],
  },
  {
    id: 'pedidos', label: 'Pedidos y remitos',
    perms: [
      { id: 'pedidos.ver',       label: 'Ver pedidos',              desc: 'Acceso a la lista de pedidos y a ver los remitos.' },
      { id: 'pedidos.estado',    label: 'Cambiar estado',           desc: 'Pasar un pedido de nuevo → confirmado → enviado → entregado.' },
      { id: 'pedidos.editar',    label: 'Editar remitos',           desc: 'Modificar ítems, precios, descuentos y datos de un remito.' },
      { id: 'remitos.crear',     label: 'Crear remitos manuales',   desc: 'Generar un pedido/remito sin una compra previa de la tienda.' },
      { id: 'pedidos.anular',    label: 'Anular pedidos',           desc: 'Marcar un pedido como anulado (no se borra).' },
      { id: 'pedidos.desanular', label: 'Quitar la anulación',      desc: 'Reactivar un pedido anulado y volver a editarlo.' },
      { id: 'pedidos.eliminar',  label: 'Eliminar definitivamente', desc: 'Borrar un pedido de la base de datos. No se puede deshacer.' },
    ],
  },
  {
    id: 'clientes', label: 'Clientes',
    perms: [
      { id: 'clientes.ver',    label: 'Ver clientes',            desc: 'Listado de clientes, su historial y su estado de cuenta.' },
      { id: 'clientes.editar', label: 'Editar datos de clientes', desc: 'Corregir o completar nombre, DNI, contacto y domicilio.' },
    ],
  },
  {
    id: 'dinero', label: 'Cobranzas y facturación',
    perms: [
      { id: 'pagos.ver',       label: 'Ver control de pagos', desc: 'Saldos por cliente, pagos registrados y cuentas corrientes.' },
      { id: 'pagos.registrar', label: 'Registrar pagos',      desc: 'Cargar cobros individuales, múltiples o generales.' },
      { id: 'pagos.credito',   label: 'Notas de crédito',     desc: 'Emitir y aplicar crédito a favor del cliente.' },
      { id: 'facturacion.ver', label: 'Ver facturación',      desc: 'Reportes de ventas por período, método de pago y producto.' },
    ],
  },
  {
    id: 'sistema', label: 'Sistema',
    perms: [
      { id: 'config.editar',      label: 'Editar configuración', desc: 'Datos de contacto del sitio.' },
      { id: 'usuarios.gestionar', label: 'Gestionar usuarios',   desc: 'Crear usuarios, asignar roles y permisos, dar de baja.' },
    ],
  },
];

/* Lista plana de todos los ids de permiso. */
window.VC_ALL_PERMS = window.VC_PERM_GROUPS.reduce((acc, g) => acc.concat(g.perms.map(p => p.id)), []);

/* Diccionario id → definición, para mostrar etiquetas en la UI. */
window.VC_PERM_INFO = window.VC_PERM_GROUPS.reduce((acc, g) => {
  g.perms.forEach(p => { acc[p.id] = { ...p, group: g.label }; });
  return acc;
}, {});

/* ── Roles predefinidos. `perms: "*"` = todos los permisos, presentes y futuros ── */
window.VC_ROLES = [
  {
    id: 'superadmin',
    label: 'Acceso total',
    desc: 'Control absoluto del panel, incluida la gestión de usuarios. Los accesos totales no se pueden eliminar ni degradar entre sí.',
    perms: '*',
  },
  {
    id: 'admin',
    label: 'Administrador general',
    desc: 'Gestiona todo el día a día del negocio. No administra usuarios ni borra pedidos de forma definitiva.',
    perms: [
      'resumen.ver',
      'productos.ver', 'productos.editar', 'banners.ver', 'banners.editar',
      'descuentos.ver', 'descuentos.editar',
      'pedidos.ver', 'pedidos.estado', 'pedidos.editar', 'remitos.crear', 'pedidos.anular',
      'clientes.ver', 'clientes.editar',
      'pagos.ver', 'pagos.registrar', 'pagos.credito', 'facturacion.ver',
      'config.editar',
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas y pedidos',
    desc: 'Carga y gestiona pedidos y remitos, y consulta el catálogo y los clientes.',
    perms: [
      'resumen.ver', 'productos.ver',
      'pedidos.ver', 'pedidos.estado', 'pedidos.editar', 'remitos.crear', 'pedidos.anular',
      'clientes.ver', 'clientes.editar',
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo y marketing',
    desc: 'Administra productos, banners y códigos de descuento. No accede a pedidos ni a datos de clientes.',
    perms: [
      'resumen.ver',
      'productos.ver', 'productos.editar',
      'banners.ver', 'banners.editar',
      'descuentos.ver', 'descuentos.editar',
    ],
  },
  {
    id: 'cobranzas',
    label: 'Cobranzas y facturación',
    desc: 'Registra pagos, emite notas de crédito y consulta la facturación. No modifica pedidos ni el catálogo.',
    perms: [
      'resumen.ver', 'pedidos.ver',
      'clientes.ver', 'clientes.editar',
      'pagos.ver', 'pagos.registrar', 'pagos.credito', 'facturacion.ver',
    ],
  },
  {
    id: 'deposito',
    label: 'Depósito y entregas',
    desc: 'Prepara los pedidos: ve remitos, los imprime y actualiza el estado de entrega. No modifica precios ni importes.',
    perms: ['pedidos.ver', 'pedidos.estado', 'clientes.ver'],
  },
  {
    id: 'lectura',
    label: 'Solo lectura',
    desc: 'Consulta información pero no puede modificar nada.',
    perms: ['resumen.ver', 'productos.ver', 'pedidos.ver', 'clientes.ver', 'pagos.ver', 'facturacion.ver'],
  },
  {
    id: 'custom',
    label: 'Personalizado',
    desc: 'Permisos elegidos uno por uno.',
    perms: [],
  },
];

window.VC_ROLE_INFO = window.VC_ROLES.reduce((acc, r) => { acc[r.id] = r; return acc; }, {});

/* Permisos base que aporta un rol (array de ids; "*" se expande a todos). */
window.vcRolePerms = function (rolId) {
  const rol = window.VC_ROLE_INFO[rolId];
  if (!rol) return [];
  return rol.perms === '*' ? window.VC_ALL_PERMS.slice() : rol.perms.slice();
};

/* Permisos efectivos de un usuario = los del rol ∪ los extra guardados en la fila.
   Un superadmin siempre tiene todo, aunque su columna `permisos` esté vacía. */
window.vcEffectivePerms = function (user) {
  if (!user || user.activo === false) return [];
  if (user.rol === 'superadmin') return window.VC_ALL_PERMS.slice();
  const base = window.vcRolePerms(user.rol);
  const extra = Array.isArray(user.permisos) ? user.permisos : [];
  return Array.from(new Set(base.concat(extra)));
};

/* Sección del panel → permiso necesario para entrar. */
window.VC_SECTION_PERM = {
  dashboard:   'resumen.ver',
  products:    'productos.ver',
  banners:     'banners.ver',
  orders:      'pedidos.ver',
  clientes:    'clientes.ver',
  cuenta:      'pagos.ver',
  facturacion: 'facturacion.ver',
  codes:       'descuentos.ver',
  usuarios:    'usuarios.gestionar',
  config:      'config.editar',
};

export default null;
