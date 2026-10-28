-- ============================================================================
-- Vcore — Solicitudes de acceso al panel (registro propio de usuarios)
-- Correlo en: Supabase → SQL Editor → New query → Run
-- Idempotente: podés correrlo múltiples veces.
--
-- QUÉ HACE
--   Desde la pantalla de ingreso del panel, una persona puede crear su cuenta
--   ("Solicitar acceso"). Eso NO le da ningún permiso: queda una solicitud en
--   vc_user_requests y un usuario con acceso total la aprueba (eligiendo rol y
--   permisos) o la rechaza desde Usuarios.
--
--   El registro deja la solicitud a través de un trigger sobre auth.users, para
--   que funcione aunque Supabase exija confirmar el email (en ese caso el alta
--   no devuelve sesión y el navegador no podría escribir la tabla por sí mismo).
--
-- Requiere schema-v3.sql (usa vc_users y vc_can_manage_users()).
-- ============================================================================

create table if not exists public.vc_user_requests (
  email      text primary key,
  nombre     text default '' check (char_length(nombre)  <= 120),
  mensaje    text default '' check (char_length(mensaje) <= 500),
  created_at timestamptz default now()
);

alter table public.vc_user_requests enable row level security;

-- Cada persona ve, crea y retira SU solicitud; quien gestiona usuarios ve y
-- resuelve todas. Sin política de UPDATE: una solicitud no se edita, se aprueba
-- o se borra.
drop policy if exists vc_user_requests_read   on public.vc_user_requests;
drop policy if exists vc_user_requests_insert on public.vc_user_requests;
drop policy if exists vc_user_requests_delete on public.vc_user_requests;

create policy vc_user_requests_read on public.vc_user_requests for select
  to authenticated
  using (public.vc_can_manage_users() or email = lower(auth.jwt() ->> 'email'));

create policy vc_user_requests_insert on public.vc_user_requests for insert
  to authenticated
  with check (email = lower(auth.jwt() ->> 'email'));

create policy vc_user_requests_delete on public.vc_user_requests for delete
  to authenticated
  using (public.vc_can_manage_users() or email = lower(auth.jwt() ->> 'email'));

-- ---------- Trigger: el alta con "solicita_panel" deja la solicitud ----------
-- Solo actúa si el registro viene del formulario del panel (metadata
-- solicita_panel = true). Las cuentas que crea un administrador desde Usuarios
-- no lo traen, así que no generan solicitudes.
-- El bloque exception es a propósito: un problema acá nunca puede impedir que
-- la cuenta se cree.
create or replace function public.vc_on_auth_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'solicita_panel', '') = 'true' then
    insert into public.vc_user_requests (email, nombre, mensaje)
    values (
      lower(new.email),
      left(coalesce(new.raw_user_meta_data ->> 'nombre',  ''), 120),
      left(coalesce(new.raw_user_meta_data ->> 'mensaje', ''), 500)
    )
    on conflict (email) do nothing;
  end if;
  return new;
exception when others then
  raise warning 'vc_on_auth_signup: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.vc_on_auth_signup() from public;

drop trigger if exists vc_on_auth_signup on auth.users;
create trigger vc_on_auth_signup
  after insert on auth.users
  for each row execute function public.vc_on_auth_signup();

-- ---------------------------------------------------------------------------
-- Verificación: esto tiene que devolver filas (o ninguna) sin error.
--   select email, nombre, created_at from public.vc_user_requests order by created_at;
-- ---------------------------------------------------------------------------
