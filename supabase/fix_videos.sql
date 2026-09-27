-- =========================================================
-- FEATURE: contenido tipo video (ej. "Ciclo de vida del mosquito")
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete set null,
  title text not null,
  video_url text not null,   -- ruta dentro de /public, ej: /videos/ciclo-vida-mosquito.mp4
  order_index int not null default 0
);

create table if not exists public.video_completions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, video_id)
);

alter table public.videos enable row level security;
alter table public.video_completions enable row level security;

create policy "leer videos" on public.videos
  for select using (auth.role() = 'authenticated');
create policy "admin administra videos" on public.videos
  for all using (public.is_admin()) with check (public.is_admin());

create policy "estudiante ve sus videos completados" on public.video_completions
  for select using (auth.uid() = student_id);
create policy "estudiante marca su video completado" on public.video_completions
  for insert with check (auth.uid() = student_id);
create policy "docente ve videos completados de su grupo" on public.video_completions
  for select using (public.teaches_student(student_id));

create or replace function public.complete_video(_video_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into video_completions (student_id, video_id)
  values (auth.uid(), _video_id)
  on conflict (student_id, video_id) do nothing;
$$;

-- Contenido real: el video del ciclo de vida, en la unidad "El caos".
do $$
declare
  _unit_id uuid;
begin
  select id into _unit_id from units where title = 'El caos';

  if not exists (select 1 from videos where unit_id = _unit_id) then
    insert into videos (unit_id, title, video_url, order_index)
    values (_unit_id, 'Ciclo de vida del mosquito', '/videos/ciclo-vida-mosquito.mp4', 2);
  end if;
end $$;
