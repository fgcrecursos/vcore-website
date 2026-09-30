/* =====================================================================
   Meta Pixel (Facebook / Instagram) — el mismo archivo en Somos Setas y Vcore.
   ---------------------------------------------------------------------
   Uso:  MetaPixel.init("ID_DEL_PIXEL")  y después  MetaPixel.track(...)
   - Sin ID no carga nada: todas las llamadas quedan en silencio.
   - El panel (#/admin) no cuenta: ni carga el script de Meta ni manda eventos,
     así las visitas del equipo no ensucian las audiencias.
   - La tienda navega por hash (#/producto/…), que Meta no ve como página nueva:
     el PageView de cada cambio de ruta lo manda este archivo.
   - En localhost no se manda nada, salvo con  localStorage.pixelDebug = "1".
   - Todo evento va además a window.__metaPixelLog (para verificar a mano).
   ===================================================================== */
(function () {
  var pixelId = "";
  var cargado = false;
  var cola = [];            // eventos anteriores a la carga del script de Meta
  var ultimaRuta = null;
  window.__metaPixelLog = window.__metaPixelLog || [];

  function esAdmin() {
    return /^#\/?admin/.test(window.location.hash || "");
  }
  function esLocal() {
    var h = window.location.hostname;
    var local = h === "localhost" || h === "127.0.0.1" || h === "[::1]" || /\.localhost$/.test(h);
    if (!local) return false;
    try { return localStorage.getItem("pixelDebug") !== "1"; } catch (e) { return true; }
  }
  function activo() { return !!pixelId && !esAdmin() && !esLocal(); }

  function cargar() {
    if (cargado || !activo()) return;
    cargado = true;
    /* Snippet oficial de Meta, sin cambios salvo el formato. */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* La ruta la maneja este archivo: que Meta no sume PageViews propios al
       cambiar la URL con history (p. ej. la vuelta de Mercado Pago). */
    window.fbq.disablePushState = true;
    window.fbq("init", pixelId);
    cola.splice(0).forEach(function (args) { window.fbq.apply(null, args); });
  }

  function enviar(args) {
    window.__metaPixelLog.push({ ts: Date.now(), args: args });
    if (!activo()) return;
    if (!cargado) cargar();
    if (window.fbq) window.fbq.apply(null, args); else cola.push(args);
  }

  function pageView() {
    var ruta = window.location.pathname + (window.location.hash || "");
    if (ruta === ultimaRuta) return;
    ultimaRuta = ruta;
    if (esAdmin()) return;
    enviar(["track", "PageView"]);
  }

  /* Normaliza los montos: Meta pide número y moneda en cada evento con valor. */
  function conMoneda(params) {
    var p = {};
    for (var k in params || {}) if (params[k] !== undefined && params[k] !== null) p[k] = params[k];
    if (p.value !== undefined) { p.value = Math.round(Number(p.value) || 0); p.currency = p.currency || "ARS"; }
    return p;
  }

  window.MetaPixel = {
    init: function (id) {
      pixelId = String(id || "").trim();
      if (!pixelId) return;
      pageView();
      window.addEventListener("hashchange", pageView);
    },
    /* track("AddToCart", {...}, { eventID }) — el eventID deja deduplicar el día
       que se sume la API de Conversiones del lado del servidor. */
    track: function (evento, params, opciones) {
      var args = ["track", evento, conMoneda(params)];
      if (opciones && opciones.eventID) args.push({ eventID: String(opciones.eventID) });
      enviar(args);
    },
    /* Coincidencia avanzada: Meta hashea el email y el teléfono en el navegador
       antes de mandarlos; sirve para atribuir la compra a quien vio el anuncio. */
    identificar: function (datos) {
      if (!activo() || !datos) return;
      var d = {};
      if (datos.email) d.em = String(datos.email).trim().toLowerCase();
      if (datos.telefono) {
        var tel = String(datos.telefono).replace(/\D/g, "");
        if (tel && tel.indexOf("54") !== 0) tel = "54" + tel.replace(/^0/, "");
        if (tel.length >= 10) d.ph = tel;
      }
      if (!d.em && !d.ph) return;
      cargar();
      if (window.fbq) window.fbq("init", pixelId, d);
    },
  };
})();
