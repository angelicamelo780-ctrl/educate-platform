-- =========================================================
-- FIX + FEATURE: tomar y calificar un quiz sin exponer la
-- respuesta correcta al estudiante antes de responder
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

-- 1. Restringir la lectura directa de "options" solo a docentes.
--    Los estudiantes ya no pueden leer is_correct desde la tabla;
--    para tomar el quiz usan la función de abajo, que no lo expone.
drop policy if exists "leer opciones" on public.options;

-- 2. Entrega las preguntas + opciones de un quiz SIN el campo is_correct.
create or replace function public.get_quiz_for_taking(_quiz_id uuid)
returns table(question_id uuid, prompt text, order_index int, option_id uuid, option_label text)
language sql
security definer
set search_path = public
stable
as $$
  select q.id, q.prompt, q.order_index, o.id, o.label
  from questions q
  join options o on o.question_id = q.id
  where q.quiz_id = _quiz_id
  order by q.order_index, o.id;
$$;

-- 3. Recibe las respuestas del estudiante, califica del lado del
--    servidor (donde sí puede ver is_correct) y guarda todo:
--    intento, respuestas individuales y progreso.
create or replace function public.submit_quiz_attempt(_quiz_id uuid, _answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _student_id uuid := auth.uid();
  _threshold int;
  _total int;
  _correct int := 0;
  _answer jsonb;
  _is_correct boolean;
  _attempt_id uuid;
  _score int;
  _passed boolean;
begin
  if _student_id is null then
    raise exception 'No autenticado';
  end if;

  select pass_threshold into _threshold from quizzes where id = _quiz_id;
  if _threshold is null then
    raise exception 'Quiz no encontrado';
  end if;

  _total := jsonb_array_length(_answers);
  if _total = 0 then
    raise exception 'No se enviaron respuestas';
  end if;

  insert into quiz_attempts (quiz_id, student_id, score, passed)
  values (_quiz_id, _student_id, 0, false)
  returning id into _attempt_id;

  for _answer in select * from jsonb_array_elements(_answers)
  loop
    select is_correct into _is_correct
    from options
    where id = (_answer->>'option_id')::uuid
      and question_id = (_answer->>'question_id')::uuid;

    if _is_correct then
      _correct := _correct + 1;
    end if;

    insert into attempt_answers (attempt_id, question_id, option_id)
    values (_attempt_id, (_answer->>'question_id')::uuid, (_answer->>'option_id')::uuid);
  end loop;

  _score := round((_correct::numeric / _total) * 100);
  _passed := _score >= _threshold;

  update quiz_attempts set score = _score, passed = _passed where id = _attempt_id;

  update progress
  set status = 'completado', updated_at = now()
  where student_id = _student_id
    and unit_id = (select unit_id from quizzes where id = _quiz_id);

  return jsonb_build_object(
    'attempt_id', _attempt_id, 'score', _score, 'passed', _passed,
    'correct', _correct, 'total', _total
  );
end;
$$;
