-- =========================================================
-- FIX: recursión infinita entre policies de groups <-> group_members
-- =========================================================
-- Corre este bloque completo en el SQL Editor de Supabase.

-- 1. Funciones que evalúan el permiso "por dentro", sin volver a
--    disparar RLS sobre la otra tabla (evitan el ciclo).
create or replace function public.is_teacher_of_group(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from groups where id = _group_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_member_of_group(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = _group_id and student_id = auth.uid()
  );
$$;

create or replace function public.teaches_student(_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members gm
    join groups g on g.id = gm.group_id
    where gm.student_id = _student_id and g.teacher_id = auth.uid()
  );
$$;

-- 2. Reemplazar las policies que causaban el ciclo, usando las funciones.

drop policy if exists "estudiante ve su grupo" on public.groups;
create policy "estudiante ve su grupo" on public.groups
  for select using (public.is_member_of_group(id));

drop policy if exists "buscar grupo por codigo para unirse" on public.groups;
create policy "buscar grupo por codigo para unirse" on public.groups
  for select using (auth.role() = 'authenticated');

drop policy if exists "docente ve miembros de su grupo" on public.group_members;
create policy "docente ve miembros de su grupo" on public.group_members
  for select using (public.is_teacher_of_group(group_id));

drop policy if exists "docente ve estudiantes de su grupo" on public.profiles;
create policy "docente ve estudiantes de su grupo" on public.profiles
  for select using (public.teaches_student(id));

drop policy if exists "docente ve intentos de su grupo" on public.quiz_attempts;
create policy "docente ve intentos de su grupo" on public.quiz_attempts
  for select using (public.teaches_student(student_id));

drop policy if exists "docente ve progreso de su grupo" on public.progress;
create policy "docente ve progreso de su grupo" on public.progress
  for select using (public.teaches_student(student_id));

drop policy if exists "docente ve certificados de su grupo" on public.certificates;
create policy "docente ve certificados de su grupo" on public.certificates
  for select using (public.teaches_student(student_id));
