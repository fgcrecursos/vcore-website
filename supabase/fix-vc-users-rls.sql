-- ============================================================================
-- Vcore — ARREGLO: "infinite recursion detected in policy for relation vc_users"
-- Correlo en: Supabase → SQL Editor → New query → Run
-- Idempotente: podés correrlo múltiples veces.
--
-- SÍNTOMA
--   Al crear un usuario del panel, el alta falla con:
--     La cuenta se creó, pero no se pudieron guardar los permisos:
--     infinite recursion detected in policy for relation "vc_users"
--   Y además la sección Usuarios aparece vacía y el panel cae al fallback de
--   superadmin de src/permissions.jsx, porque ni siquiera puede LEER la tabla.
--
-- CAUSA
--   La política vc_users_write de schema-v3.sql estaba escrita así:
--     create policy vc_users_write on public.vc_users for all
--       using ( exists (select 1 from public.vc_users u where ...) )
--   La política de vc_users hace un SELECT sobre vc_users, y ese SELECT vuelve a
--   disparar la política: Postgres detecta el ciclo y aborta con el código 42P17.
--   Como era FOR ALL, el ciclo se disparaba también en los SELECT normales, así
--   que rompía la lectura de la tabla, no solo la escritura.
--
-- ARREGLO
--   La comprobación pasa a una función SECURITY DEFINER, que corre como su dueño
--   y NO reevalúa RLS: ahí se corta la recursión. Es el mismo enfoque que usa
--   ss_is_superadmin() en Somos Setas, donde esto nunca falló.
--   Además las políticas de escritura se separan por comando, para que un error
--   en ellas no pueda volver a romper la lectura.
--
-- Si todavía no corriste schema-v3.sql, corré ese: ya viene con este arreglo
-- incorporado y no hace falta ejecutar este archivo.
-- ============================================================================

create or replace function public.vc_can_manage_users()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.vc_users u
    where u.email = lower(auth.jwt() ->> 'email')
      and u.activo
      and (u.rol = 'superadmin' or u.permisos ? 'usuarios.gestionar')
  );
$$;

revoke all on function public.vc_can_manage_users() from public;
grant execute on function public.vc_can_manage_users() to authenticated;

-- Fuera la política recursiva y cualquier resto de una corrida anterior.
drop policy if exists vc_users_read   on public.vc_users;
drop policy if exists vc_users_write  on public.vc_users;
drop policy if exists vc_users_insert on public.vc_users;
drop policy if exists vc_users_update on public.vc_users;
drop policy if exists vc_users_delete on public.vc_users;

create policy vc_users_read on public.vc_users for select
  to authenticated
  using (true);

create policy vc_users_insert on public.vc_users for insert
  to authenticated
  with check (public.vc_can_manage_users());

create policy vc_users_update on public.vc_users for update
  to authenticated
  using (public.vc_can_manage_users())
  with check (public.vc_can_manage_users());

-- Nadie puede borrar a un superadmin (misma regla que aplica el panel).
create policy vc_users_delete on public.vc_users for delete
  to authenticated
  using (public.vc_can_manage_users() and rol <> 'superadmin');

-- ---------------------------------------------------------------------------
-- Red de seguridad: si la tabla quedó sin ningún superadmin, nadie podría volver
-- a escribirla (vc_can_manage_users() daría false para todos). Cambiá el email
-- si tu cuenta del panel es otra.
-- ---------------------------------------------------------------------------
insert into public.vc_users (email, nombre, rol, activo)
values ('fngc279@gmail.com', 'Administrador', 'superadmin', true)
on conflict (email) do update
  set rol = 'superadmin', activo = true;

-- ---------------------------------------------------------------------------
-- Verificación: esto tiene que devolver filas sin error.
--   select email, rol, activo from public.vc_users order by created_at;
-- ---------------------------------------------------------------------------
