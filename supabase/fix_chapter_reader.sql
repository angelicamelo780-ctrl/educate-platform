-- =========================================================
-- FEATURE: lector de capítulos (flipbook de páginas de texto)
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete set null,
  title text not null,           -- ej: "Los Invasores - Capítulos 1 y 2"
  order_index int not null default 0
);

create table if not exists public.chapter_pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  page_number int not null,
  heading text,                  -- ej: "Capítulo 1" (solo en la página donde aparece)
  body text not null
);

create table if not exists public.reading_completions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, chapter_id)
);

alter table public.chapters enable row level security;
alter table public.chapter_pages enable row level security;
alter table public.reading_completions enable row level security;

create policy "leer capitulos" on public.chapters
  for select using (auth.role() = 'authenticated');
create policy "admin administra capitulos" on public.chapters
  for all using (public.is_admin()) with check (public.is_admin());

create policy "leer paginas" on public.chapter_pages
  for select using (auth.role() = 'authenticated');
create policy "admin administra paginas" on public.chapter_pages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "estudiante ve sus lecturas completadas" on public.reading_completions
  for select using (auth.uid() = student_id);
create policy "estudiante marca su lectura completada" on public.reading_completions
  for insert with check (auth.uid() = student_id);
create policy "docente ve lecturas completadas de su grupo" on public.reading_completions
  for select using (public.teaches_student(student_id));

create or replace function public.complete_reading(_chapter_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into reading_completions (student_id, chapter_id)
  values (auth.uid(), _chapter_id)
  on conflict (student_id, chapter_id) do nothing;
$$;
