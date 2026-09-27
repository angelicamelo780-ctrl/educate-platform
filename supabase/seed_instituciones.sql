-- =========================================================
-- Municipios e Instituciones (colegios), compartidos entre
-- docentes — un colegio se registra UNA vez y todos sus
-- profesores lo seleccionan de una lista, en vez de escribirlo
-- cada uno a mano.
-- =========================================================

create table if not exists public.municipios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  escudo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.instituciones (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid references public.municipios(id) on delete set null,
  nombre text not null,
  direccion text,
  email text,
  telefono text,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Cada docente pertenece a una institución. Los estudiantes NO tienen
-- este campo — su institución se resuelve por el grupo al que pertenecen
-- (ver lib/institution.ts), así que si el colegio cambia el logo, se
-- actualiza para todos sin tocar cada estudiante.
alter table public.profiles add column if not exists institucion_id uuid references public.instituciones(id) on delete set null;

-- =========================================================
-- Permisos (RLS)
-- =========================================================
alter table public.municipios enable row level security;
alter table public.instituciones enable row level security;

drop policy if exists "municipios_select_all" on public.municipios;
create policy "municipios_select_all" on public.municipios for select using (true);
drop policy if exists "municipios_insert_authenticated" on public.municipios;
create policy "municipios_insert_authenticated" on public.municipios for insert to authenticated with check (true);

drop policy if exists "instituciones_select_all" on public.instituciones;
create policy "instituciones_select_all" on public.instituciones for select using (true);
drop policy if exists "instituciones_insert_authenticated" on public.instituciones;
create policy "instituciones_insert_authenticated" on public.instituciones for insert to authenticated with check (true);

-- =========================================================
-- Storage: bucket público para los logos de instituciones y
-- escudos de municipios.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('instituciones-logos', 'instituciones-logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_select_public" on storage.objects;
create policy "logos_select_public" on storage.objects for select
  using (bucket_id = 'instituciones-logos');

drop policy if exists "logos_insert_authenticated" on storage.objects;
create policy "logos_insert_authenticated" on storage.objects for insert to authenticated
  with check (bucket_id = 'instituciones-logos');
