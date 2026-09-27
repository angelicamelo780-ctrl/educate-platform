-- ============================================================================
-- Vista previa del docente: calificar un cuestionario SIN guardar nada.
--
-- El docente puede recorrer el mismo material que ven sus estudiantes
-- (/dashboard/docente/material). Para que pueda probar los cuestionarios y
-- ver su puntaje, necesitamos calificar en el servidor (las respuestas
-- correctas nunca llegan al navegador), pero sin crear filas en
-- quiz_attempts / attempt_answers ni tocar progress.
--
-- Ejecutar una vez en el SQL Editor de Supabase. Es idempotente.
-- ============================================================================

create or replace function public.preview_quiz_grade(_quiz_id uuid, _answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  _threshold int;
  _total int;
  _correct int := 0;
  _score int;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  -- Solo docentes y admins usan la vista previa.
  if not exists (
    select 1 from profiles where id = auth.uid() and role in ('docente', 'admin')
  ) then
    raise exception 'Solo disponible para docentes';
  end if;

  select pass_threshold into _threshold from quizzes where id = _quiz_id;
  if _threshold is null then
    raise exception 'Quiz no encontrado';
  end if;

  _total := jsonb_array_length(_answers);
  if _total = 0 then
    raise exception 'No se enviaron respuestas';
  end if;

  select count(*) into _correct
  from jsonb_array_elements(_answers) a
  join options o
    on o.id = (a->>'option_id')::uuid
   and o.question_id = (a->>'question_id')::uuid
  where o.is_correct;

  _score := round((_correct::numeric / _total) * 100);

  return jsonb_build_object(
    'attempt_id', null,
    'score', _score,
    'passed', _score >= _threshold,
    'correct', _correct,
    'total', _total
  );
end;
$$;

grant execute on function public.preview_quiz_grade(uuid, jsonb) to authenticated;
