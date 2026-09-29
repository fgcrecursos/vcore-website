/* Sucursales de Andreani para que la clienta elija dónde retirar.
   ---------------------------------------------------------------------------
   Usa la API pública de Andreani (sin credenciales, con CORS abierto):
     /v2/sucursales?canal=B2C        → todas las sucursales de atención al público
     /v2/sucursales?codigoPostal=XXXX → las que Andreani le asigna a ese CP
   Con un CP se sugiere la sucursal asignada y se ofrecen las más cercanas a
   ella (por coordenadas), así la clienta puede elegir otra que le quede mejor.
   Si la API no responde, se devuelve el error y el checkout sigue: la sucursal
   se coordina por WhatsApp. Nunca bloquea una venta.

   El mismo archivo vive en Somos Setas y en Vcore: si se toca uno, copiar al otro. */
(function () {
  var API = "https://apis.andreani.com/v2/sucursales";
  var catalogo = null;          // Promise de la lista normalizada
  var porCP = new Map();        // "5501" → Promise de la respuesta cruda (o null si el CP no existe)

  function conTimeout(url, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .finally(function () { if (t) clearTimeout(t); });
  }

  // "GODOY CRUZ (AV SAN MARTIN SUR)" → "Godoy Cruz (Av San Martin Sur)"
  function titulo(s) {
    return String(s || "").toLowerCase().replace(/(^|[\s(\/.-])([a-záéíóúñü])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }

  // Solo las de atención al público que entregan envíos. Quedan afuera las plantas,
  // los centros internos y las marcadas "NO USAR".
  function esDeAtencion(s) {
    var d = s && s.datosAdicionales;
    return s && s.canal === "B2C" && d && d.seHaceAtencionAlCliente && d.entregaEnvios && !/NO USAR/i.test(s.descripcion || "");
  }

  function normalizar(s) {
    var dir = s.direccion || {};
    var calle = [dir.calle, dir.numero].filter(function (x) { return x && !/^s\/?n$/i.test(String(x).trim()); })
      .join(" ").replace(/\s+/g, " ").trim();
    var co = s.coordenadas || {};
    return {
      id: s.id, codigo: s.codigo || "", numero: s.numero || "",
      nombre: titulo(s.descripcion),
      calle: calle, localidad: titulo(dir.localidad), provincia: dir.provincia || "", cp: dir.codigoPostal || "",
      lat: Number(co.latitud), lng: Number(co.longitud),
      horario: s.horarioDeAtencion || "",
    };
  }

  function todas() {
    if (!catalogo) {
      catalogo = conTimeout(API + "?canal=B2C", 10000)
        .then(function (r) { if (!r.ok) throw new Error("Andreani respondió " + r.status); return r.json(); })
        .then(function (lista) { return (lista || []).filter(esDeAtencion).map(normalizar); })
        .catch(function (e) { catalogo = null; throw e; });
    }
    return catalogo;
  }

  // CP de 4 dígitos, o los 4 del medio de un CPA (M5500ABC).
  function cp4(cp) {
    var m = String(cp || "").trim().match(/^[a-z]?(\d{4})(?:[a-z]{3})?$/i);
    return m ? m[1] : null;
  }

  function km(a, b) {
    if (!isFinite(a.lat) || !isFinite(b.lat)) return Infinity;
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* → { estado: "ok" | "cp-invalido" | "cp-inexistente", sugeridaId, sucursales: [...] }
     Tira error si Andreani no responde (el que llama decide qué mostrar). */
  function paraCP(cp, cuantas) {
    cuantas = cuantas || 6;
    var c = cp4(cp);
    if (!c) return Promise.resolve({ estado: "cp-invalido", sugeridaId: null, sucursales: [] });
    if (!porCP.has(c)) {
      porCP.set(c, conTimeout(API + "?codigoPostal=" + c, 10000).then(function (r) {
        if (r.status === 400) return null;       // "El código postal es inexistente"
        if (!r.ok) throw new Error("Andreani respondió " + r.status);
        return r.json();
      }));
    }
    var asignadasP = porCP.get(c).catch(function (e) { porCP.delete(c); throw e; });
    return Promise.all([asignadasP, todas()]).then(function (res) {
      var asignadas = res[0], lista = res[1];
      if (asignadas === null) return { estado: "cp-inexistente", sugeridaId: null, sucursales: [] };
      var cruda = (asignadas || []).filter(esDeAtencion)[0];
      var sugerida = cruda ? (lista.find(function (s) { return s.id === cruda.id; }) || normalizar(cruda)) : null;
      // Sin una asignada de atención al público, se ordena desde la primera que
      // tenga coordenadas (es la base de Andreani que atiende ese CP).
      var origen = sugerida || (asignadas || []).map(normalizar).find(function (s) { return isFinite(s.lat); });
      var resto = lista.filter(function (s) { return !sugerida || s.id !== sugerida.id; });
      if (origen) resto.sort(function (a, b) { return km(origen, a) - km(origen, b); });
      var orden = (sugerida ? [sugerida] : []).concat(resto).slice(0, cuantas);
      return { estado: "ok", sugeridaId: sugerida ? sugerida.id : null, sucursales: orden };
    });
  }

  // Lo que se guarda en el pedido: sin coordenadas ni horario, que no hacen falta
  // para despachar y cambian con el tiempo.
  function paraPedido(s) {
    if (!s) return null;
    return { id: s.id, codigo: s.codigo, numero: s.numero, nombre: s.nombre, calle: s.calle, localidad: s.localidad, provincia: s.provincia, cp: s.cp };
  }

  function texto(s) {
    if (!s) return "";
    return s.nombre + " — " + [s.calle, s.localidad].filter(Boolean).join(", ");
  }

  window.AndreaniSucursales = { paraCP: paraCP, todas: todas, cp4: cp4, paraPedido: paraPedido, texto: texto };
})();
