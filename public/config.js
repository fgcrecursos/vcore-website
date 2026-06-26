/* ============================================================================
   Vcore — Configuración del backend
   ----------------------------------------------------------------------------
   Valores públicos y seguros de exponer en el navegador (así están diseñados):
     - La publishable key de Supabase está pensada para el cliente; la seguridad
       real la dan las políticas RLS y el login (ver SETUP.md).
     - El cloud name y el upload preset de Cloudinary también son públicos.
   ========================================================================== */
window.__VCORE_CONFIG__ = {
  // Supabase → Project Settings → API Keys
  supabaseUrl: 'https://tojwsfhjvfglutyudspj.supabase.co',
  supabaseAnonKey: 'sb_publishable_w6trFYw6qrwdoElgq0kicg_yBIXcpaj',

  // Cloudinary → Settings → Upload → Upload presets (unsigned)
  cloudinaryCloudName: 'dbmmvwezb',
  cloudinaryUploadPreset: 'vcore_unsigned',
};
