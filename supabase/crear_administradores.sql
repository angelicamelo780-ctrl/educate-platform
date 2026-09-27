-- ============================================================================
-- CREAR LAS CUENTAS DE ADMINISTRADOR (FUMISUR)
--
-- 1. Cada administrador crea primero su cuenta normal en la plataforma
--    (/login → "Crear cuenta"). Quedará como estudiante.
-- 2. Reemplaza los dos correos de abajo y ejecuta este script en el SQL
--    Editor de Supabase. Esas cuentas pasan a ser administradoras.
-- 3. Al iniciar sesión, entrarán directo al panel de administración.
--
-- Para quitarle el rol a alguien, cambia 'admin' por 'estudiante'.
-- ============================================================================

update public.profiles
set role = 'admin'
where id in (
  select id from auth.users
  where lower(email) in (
    lower('correo-admin-1@ejemplo.com'),
    lower('correo-admin-2@ejemplo.com')
  )
);

-- Verifica quiénes son administradores ahora:
select p.full_name, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
