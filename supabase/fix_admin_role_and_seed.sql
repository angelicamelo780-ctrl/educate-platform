-- =========================================================
-- FIX + SEED: el docente ya NO administra quizzes (solo ve progreso).
-- Se crea el rol "admin" para gestionar el contenido de la plataforma,
-- y se siembran las 3 unidades reales del libro "Los invasores".
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

-- 1. Función para saber si el usuario logueado es admin de contenido.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Las policies de contenido pasan de "docente" a "admin".
drop policy if exists "docente administra unidades" on public.units;
create policy "admin administra unidades" on public.units
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "docente administra quizzes" on public.quizzes;
create policy "admin administra quizzes" on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "docente administra preguntas" on public.questions;
create policy "admin administra preguntas" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "docente administra opciones" on public.options;
create policy "admin administra opciones" on public.options
  for all using (public.is_admin()) with check (public.is_admin());

-- 3. Siembra las 3 unidades reales del libro "Los invasores".
insert into public.units (title, description, order_index) values
  ('La invasión', 'Capítulos 1 y 2 de "Los invasores"', 1),
  ('El caos', 'Capítulos 3 y 4 de "Los invasores"', 2),
  ('La batalla final', 'Capítulos 5 y 6 de "Los invasores"', 3);

-- 4. Siembra los 3 cuestionarios reales, uno por unidad (sin preguntas
--    todavía — esas se agregan desde /dashboard/admin/quizzes).
insert into public.quizzes (unit_id, title, pass_threshold)
select id, 'Cuestionario "la invasión"', 80 from public.units where title = 'La invasión';

insert into public.quizzes (unit_id, title, pass_threshold)
select id, 'Cuestionario "El caos"', 80 from public.units where title = 'El caos';

insert into public.quizzes (unit_id, title, pass_threshold)
select id, 'Cuestionario "Batalla final"', 80 from public.units where title = 'La batalla final';

-- 5. Para entrar al área de administración de contenido, promueve tu
--    propia cuenta a admin (reemplaza el correo por el tuyo):
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'TU-CORREO-AQUI');
