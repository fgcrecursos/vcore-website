/* ============================================================================
   Vcore — Configuración del backend
   ----------------------------------------------------------------------------
   Completá estos valores con los de TU proyecto. Son TODOS públicos y seguros
   de exponer en el navegador (así están diseñados):
     - La "anon key" de Supabase está pensada para el cliente; la seguridad
       real la dan las políticas RLS y el login (ver SETUP.md).
     - El "cloud name" y el "upload preset" de Cloudinary también son públicos.

   Mientras estén vacíos, el sitio funciona en MODO DEMO (catálogo local de
   ejemplo, sin guardar nada en la nube). Al completarlos, se activa el backend.
   Ver instrucciones detalladas en SETUP.md
   ========================================================================== */
window.__VCORE_CONFIG__ = {
  // Supabase → Project Settings → API
  supabaseUrl: '',          // ej: https://abcd1234.supabase.co
  supabaseAnonKey: '',      // ej: eyJhbGciOiJI...

  // Cloudinary → Settings → Upload → Upload presets (unsigned)
  cloudinaryCloudName: '',  // ej: vcore-tienda
  cloudinaryUploadPreset: '', // ej: vcore_unsigned
};
