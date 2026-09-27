-- ============================================================================
-- ENLACES DE INVITACIÓN PARA DOCENTES
--
-- Un docente solo puede registrarse con el enlace de su colegio. FUMISUR lo
-- genera desde el panel de administración (Colegios → "Generar enlace") y se
-- lo envía al rector, quien lo reenvía a sus docentes.
--
-- Este script además cierra tres huecos de seguridad que existían:
--   1. Cualquiera podía registrarse como docente (o como ADMIN) enviando el
--      rol en los datos del registro.
--   2. Cualquier usuario podía cambiar su propio rol editando su perfil.
--   3. Cualquier usuario podía crear colegios, municipios, subir escudos o
--      crear grupos.
--
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es seguro volver a correrlo.
-- Los docentes y estudiantes que ya existen no se ven afectados.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla de invitaciones (una activa por colegio)
-- ---------------------------------------------------------------------------
create table if not exists public.docente_invitaciones (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  token text not null unique,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expira_en timestamptz not null,
  revocada_en timestamptz
);

create index if not exists docente_invitaciones_institucion_idx
  on public.docente_invitaciones (institucion_id);

alter table public.docente_invitaciones enable row level security;

drop policy if exists "admin administra invitaciones" on public.docente_invitaciones;
create policy "admin administra invitaciones" on public.docente_invitaciones
  for all using (public.is_admin()) with check (public.is_admin());

-- Con qué enlace se registró cada docente (para el conteo del panel).
alter table public.profiles
  add column if not exists invitacion_id uuid references public.docente_invitaciones(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. Registro: el rol ya NO viene del formulario
--    - Sin enlace válido → siempre "estudiante".
--    - Con enlace válido → "docente" + su colegio.
--    - "admin" nunca se puede pedir desde el registro.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.user_role := 'estudiante';
  _institucion uuid := null;
  _invitacion uuid := null;
begin
  if new.raw_user_meta_data->>'role' = 'docente'
     and coalesce(new.raw_user_meta_data->>'invitacion', '') <> '' then
    select i.id, i.institucion_id into _invitacion, _institucion
    from docente_invitaciones i
    where i.token = new.raw_user_meta_data->>'invitacion'
      and i.revocada_en is null
      and i.expira_en > now();

    if _invitacion is not null then
      _role := 'docente';
    end if;
  end if;

  insert into public.profiles (id, full_name, role, school, institucion_id, invitacion_id)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Sin nombre'),
    _role,
    new.raw_user_meta_data->>'school',
    _institucion,
    _invitacion
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Nadie puede cambiar su propio rol ni moverse de colegio desde la app.
--    (El SQL Editor y los administradores sí pueden.)
-- ---------------------------------------------------------------------------
create or replace function public.proteger_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SQL Editor / service role (sin usuario) o administradores: permitido.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'No puedes cambiar tu rol';
  end if;

  if new.invitacion_id is distinct from old.invitacion_id then
    raise exception 'No puedes cambiar tu invitación';
  end if;

  if new.institucion_id is distinct from old.institucion_id then
    -- Solo un docente SIN colegio (cuentas antiguas) puede elegirlo, una vez.
    if old.role <> 'docente' or old.institucion_id is not null then
      raise exception 'Para cambiar de colegio, contacta a FUMISUR';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_perfil on public.profiles;
create trigger proteger_perfil
  before update on public.profiles
  for each row execute procedure public.proteger_perfil();

-- ---------------------------------------------------------------------------
-- 4. Colegios, municipios y escudos: solo los administradores los crean
-- ---------------------------------------------------------------------------
drop policy if exists "instituciones_insert_authenticated" on public.instituciones;
drop policy if exists "admin administra instituciones" on public.instituciones;
create policy "admin administra instituciones" on public.instituciones
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "municipios_insert_authenticated" on public.municipios;
drop policy if exists "admin administra municipios" on public.municipios;
create policy "admin administra municipios" on public.municipios
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "logos_insert_authenticated" on storage.objects;
drop policy if exists "logos_insert_admin" on storage.objects;
create policy "logos_insert_admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'instituciones-logos' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Grupos: solo los docentes (o admins) pueden crearlos
-- ---------------------------------------------------------------------------
drop policy if exists "docente administra sus grupos" on public.groups;
create policy "docente administra sus grupos" on public.groups
  for all
  using (auth.uid() = teacher_id)
  with check (
    auth.uid() = teacher_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('docente', 'admin'))
  );

-- ---------------------------------------------------------------------------
-- 6. Consultar un enlace desde el login (sin haber iniciado sesión).
--    Solo devuelve el nombre del colegio y si el enlace sirve.
-- ---------------------------------------------------------------------------
create or replace function public.get_invitacion_publica(_token text)
returns table (valida boolean, motivo text, institucion text, municipio text, escudo_url text)
language sql
security definer
set search_path = public
stable
as $$
  select
    (i.revocada_en is null and i.expira_en > now()) as valida,
    case
      when i.revocada_en is not null then 'revocada'
      when i.expira_en <= now() then 'vencida'
      else 'ok'
    end as motivo,
    ins.nombre,
    m.nombre,
    m.escudo_url
  from docente_invitaciones i
  join instituciones ins on ins.id = i.institucion_id
  left join municipios m on m.id = ins.municipio_id
  where i.token = _token;
$$;

grant execute on function public.get_invitacion_publica(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Funciones del panel de administración (solo admins)
-- ---------------------------------------------------------------------------

-- Lista de colegios con su enlace activo y cuántos docentes tienen.
create or replace function public.admin_listar_colegios(_q text default '')
returns table (
  id uuid,
  nombre text,
  municipio text,
  escudo_url text,
  docentes bigint,
  registros_con_enlace bigint,
  token text,
  expira_en timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;

  return query
  select
    ins.id,
    ins.nombre,
    m.nombre,
    m.escudo_url,
    (select count(*) from profiles p where p.institucion_id = ins.id and p.role = 'docente'),
    (select count(*) from profiles p join docente_invitaciones di on di.id = p.invitacion_id
       where di.institucion_id = ins.id),
    act.token,
    act.expira_en
  from instituciones ins
  left join municipios m on m.id = ins.municipio_id
  left join lateral (
    select di.token, di.expira_en
    from docente_invitaciones di
    where di.institucion_id = ins.id and di.revocada_en is null and di.expira_en > now()
    order by di.created_at desc
    limit 1
  ) act on true
  where coalesce(_q, '') = ''
     or ins.nombre ilike '%' || _q || '%'
     or m.nombre ilike '%' || _q || '%'
  order by (act.token is null), ins.nombre
  limit 60;
end;
$$;

-- Genera (o cambia) el enlace de un colegio. El anterior deja de servir.
-- Por defecto vence el 31 de diciembre del año en curso.
create or replace function public.admin_generar_invitacion(_institucion_id uuid, _expira_en timestamptz default null)
returns table (token text, expira_en timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  _token text := replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  _exp timestamptz := coalesce(
    _expira_en,
    make_timestamptz(extract(year from now() at time zone 'America/Bogota')::int, 12, 31, 23, 59, 0, 'America/Bogota')
  );
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;

  update docente_invitaciones
  set revocada_en = now()
  where institucion_id = _institucion_id and revocada_en is null;

  insert into docente_invitaciones (institucion_id, token, creado_por, expira_en)
  values (_institucion_id, _token, auth.uid(), _exp);

  return query select _token, _exp;
end;
$$;

-- Desactiva el enlace de un colegio (los docentes ya registrados siguen igual).
create or replace function public.admin_revocar_invitacion(_institucion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;

  update docente_invitaciones
  set revocada_en = now()
  where institucion_id = _institucion_id and revocada_en is null;
end;
$$;

-- Agrega un colegio que no está en el directorio.
create or replace function public.admin_crear_colegio(
  _nombre text,
  _municipio_id uuid,
  _direccion text default null,
  _telefono text default null,
  _email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;

  if exists (
    select 1 from instituciones
    where lower(trim(nombre)) = lower(trim(_nombre)) and municipio_id = _municipio_id
  ) then
    raise exception 'Ese colegio ya existe en ese municipio';
  end if;

  insert into instituciones (nombre, municipio_id, direccion, telefono, email)
  values (trim(_nombre), _municipio_id, nullif(trim(_direccion), ''), nullif(trim(_telefono), ''), nullif(trim(_email), ''))
  returning id into _id;

  return _id;
end;
$$;

grant execute on function public.admin_listar_colegios(text) to authenticated;
grant execute on function public.admin_generar_invitacion(uuid, timestamptz) to authenticated;
grant execute on function public.admin_revocar_invitacion(uuid) to authenticated;
grant execute on function public.admin_crear_colegio(text, uuid, text, text, text) to authenticated;
