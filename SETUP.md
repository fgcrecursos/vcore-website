# Vcore — Puesta en marcha del backend

La tienda funciona en **modo demo** (catálogo de ejemplo, nada se guarda en la nube)
hasta que completes la configuración. Seguí estos pasos **una sola vez**.

Necesitás dos cuentas gratuitas: **Supabase** (datos + login) y **Cloudinary** (imágenes).

---

## 1) Supabase — base de datos y login

1. Entrá a **https://supabase.com** → *Start your project* → creá una cuenta.
2. *New project*: ponele un nombre (ej. `vcore`), elegí una contraseña de base de
   datos (guardala) y la región más cercana. Esperá ~2 minutos a que se cree.
3. Menú izquierdo → **SQL Editor** → *New query*. Abrí el archivo
   [`supabase/schema.sql`](supabase/schema.sql) de este proyecto, **copiá todo**,
   pegalo y apretá **Run**. Esto crea las tablas y la seguridad.
4. Creá tu usuario de administrador: menú **Authentication** → **Users** →
   *Add user* → *Create new user*. Poné tu **email** y una **contraseña fuerte**.
   (Marcá *Auto Confirm User* si aparece la opción). **Este será tu login del panel.**
5. Copiá las credenciales públicas: **Project Settings** (engranaje) → **API**:
   - **Project URL** → va en `supabaseUrl`
   - **anon public** (en *Project API keys*) → va en `supabaseAnonKey`

> La `anon key` es pública por diseño. La seguridad la dan las políticas (RLS) que
> ya creó el script: el público solo puede **leer** productos y **crear** pedidos;
> editar productos/ver pedidos requiere estar logueado con tu usuario.

---

## 2) Cloudinary — imágenes de productos

1. Entrá a **https://cloudinary.com** → registrate (plan gratuito, 25 GB).
2. En el **Dashboard** vas a ver tu **Cloud name** (ej. `vcore-tienda`). Copialo.
3. Creá un *upload preset* sin firma: **Settings** (engranaje) → **Upload** →
   bajá hasta **Upload presets** → *Add upload preset*:
   - **Signing Mode**: cambialo a **Unsigned**.
   - (Opcional) *Folder*: `vcore` para ordenar las imágenes.
   - Guardá y copiá el **nombre del preset** (ej. `vcore_unsigned`).

---

## 3) Conectar el sitio

Abrí [`public/config.js`](public/config.js) y completá los 4 valores:

```js
window.__VCORE_CONFIG__ = {
  supabaseUrl: 'https://TUPROYECTO.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJI...',
  cloudinaryCloudName: 'vcore-tienda',
  cloudinaryUploadPreset: 'vcore_unsigned',
};
```

Guardá. Listo: el sitio ya usa el backend real.

---

## 4) Cargar el catálogo

1. Entrá al panel: ícono de usuario (o `/` → menú → *Panel de administración*).
2. Logueate con el **email y contraseña** que creaste en el paso 1.4.
3. En **Productos** podés:
   - **Importar catálogo de ejemplo** (botón) para subir los 26 productos base de
     una sola vez, y después editarlos.
   - O crear cada producto a mano, subiendo su imagen (se guarda en Cloudinary).
4. Los productos quedan visibles para **todos** los visitantes, desde cualquier
   dispositivo. Los pedidos por WhatsApp se guardan y los ves en **Pedidos**.

---

## Notas de seguridad

- La contraseña de admin **nunca** está en el código: la valida Supabase.
- No existe registro público de usuarios: solo entran los usuarios que vos crees
  en el panel de Supabase.
- Las claves de `config.js` son públicas y seguras de exponer; lo sensible
  (contraseñas, `service_role` key) nunca se usa en el navegador.
