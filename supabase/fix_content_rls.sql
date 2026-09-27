-- =========================================================
-- FIX: units/quizzes/questions/options quedaron sin RLS activado
-- =========================================================
-- Corre esto en el SQL Editor antes de usar la gestión de quizzes.

-- Función auxiliar: ¿el usuario logueado es docente?
create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'docente'
  );
$$;

alter table public.units enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;

-- Cualquier usuario logueado puede LEER el contenido (lo necesita para
-- tomar el quiz); solo un docente puede crear/editar/borrar.
create policy "leer unidades" on public.units
  for select using (auth.role() = 'authenticated');
create policy "docente administra unidades" on public.units
  for all using (public.is_teacher()) with check (public.is_teacher());

create policy "leer quizzes" on public.quizzes
  for select using (auth.role() = 'authenticated');
create policy "docente administra quizzes" on public.quizzes
  for all using (public.is_teacher()) with check (public.is_teacher());

create policy "leer preguntas" on public.questions
  for select using (auth.role() = 'authenticated');
create policy "docente administra preguntas" on public.questions
  for all using (public.is_teacher()) with check (public.is_teacher());

-- Las opciones SÍ esconden cuál es la correcta para el estudiante:
-- solo exponemos is_correct a quien ya haya respondido (vía attempt_answers)
-- o sea docente. Para el MVP, mantenemos lectura simple para todos los
-- autenticados (el frontend no debe mostrar is_correct al estudiante antes
-- de responder); se puede endurecer más adelante con una vista separada.
create policy "leer opciones" on public.options
  for select using (auth.role() = 'authenticated');
create policy "docente administra opciones" on public.options
  for all using (public.is_teacher()) with check (public.is_teacher());

-- Función que crea una pregunta y sus opciones en una sola operación
-- atómica (si algo falla a mitad de camino, no queda una pregunta huérfana).
-- Corre con los permisos de quien la llama, así que las policies de arriba
-- (solo docente) se siguen aplicando.
create or replace function public.create_question_with_options(
  _quiz_id uuid,
  _prompt text,
  _order_index int,
  _options jsonb -- ej: [{"label":"Opción A","is_correct":true}, ...]
) returns uuid
language plpgsql
as $$
declare
  _question_id uuid;
  _opt jsonb;
begin
  insert into public.questions (quiz_id, prompt, order_index)
  values (_quiz_id, _prompt, _order_index)
  returning id into _question_id;

  for _opt in select * from jsonb_array_elements(_options)
  loop
    insert into public.options (question_id, label, is_correct)
    values (_question_id, _opt->>'label', (_opt->>'is_correct')::boolean);
  end loop;

  return _question_id;
end;
$$;
