-- Carga el contenido real del Cuestionario "la invasión".
-- Seguro de correr una sola vez: si el quiz ya tiene preguntas, no hace nada.

do $$
declare
  _quiz_id uuid;
begin
  select id into _quiz_id from quizzes where title = 'Cuestionario "la invasión"';

  if _quiz_id is null then
    raise exception 'No se encontró el quiz "Cuestionario la invasión" — corre primero el seed de unidades.';
  end if;

  if exists (select 1 from questions where quiz_id = _quiz_id) then
    raise notice 'Este quiz ya tiene preguntas cargadas, no se agrega nada.';
  else
    perform public.create_question_with_options(
      _quiz_id,
      '¿En qué lugar del barco venía oculto el enjambre de mosquitos?',
      1,
      '[
        {"label":"Llantas viejas de camión","is_correct":true},
        {"label":"La bodega del barco","is_correct":false},
        {"label":"En las regaderas del barco","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      'Los mosquitos solo atacaron a los extranjeros del barco.',
      2,
      '[
        {"label":"Falso","is_correct":true},
        {"label":"Verdadero","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿De qué color eran los mosquitos que invadieron Lozanía?',
      3,
      '[
        {"label":"Negros con rayas blancas","is_correct":true},
        {"label":"Blancos con patas negras","is_correct":false},
        {"label":"Amarillos con patas blancas","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      'Lozanía es una ciudad ubicada en lo alto de las montañas.',
      4,
      '[
        {"label":"Falso","is_correct":true},
        {"label":"Verdadero","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿De qué se alimentan las hembras de zancudo Aedes aegypti?',
      5,
      '[
        {"label":"Azúcar","is_correct":false},
        {"label":"Agua de albercas","is_correct":false},
        {"label":"Sangre humana","is_correct":true}
      ]'::jsonb
    );
  end if;
end $$;
