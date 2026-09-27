-- Carga el contenido real de los cuestionarios "El caos" y "Batalla final".
-- Seguro de correr una sola vez: si el quiz ya tiene preguntas, no hace nada.

do $$
declare
  _quiz_id uuid;
begin
  -- =========================================================
  -- Cuestionario "El caos"
  -- =========================================================
  select id into _quiz_id from quizzes where title = 'Cuestionario "El caos"';

  if _quiz_id is null then
    raise exception 'No se encontró el quiz "Cuestionario El caos".';
  end if;

  if exists (select 1 from questions where quiz_id = _quiz_id) then
    raise notice 'Cuestionario "El caos" ya tiene preguntas, no se agrega nada.';
  else
    perform public.create_question_with_options(
      _quiz_id,
      'Eclosionar es: salir la larva de su cascarón.',
      1,
      '[
        {"label":"Verdadero","is_correct":true},
        {"label":"Falso","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿Cuáles eran los escondites predilectos de las zancudas que descubrió Mario?',
      2,
      '[
        {"label":"Patio trasero","is_correct":false},
        {"label":"Alberca y tarros plásticos","is_correct":true},
        {"label":"Cocina y lavaplatos","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿Cuál fue una de las cosas que le contó la alberca a Mario en su sueño?',
      3,
      '[
        {"label":"Que las zancudas cuando pican pueden transmitir el virus del dengue","is_correct":true},
        {"label":"Que su hermano vivía en Sausópolis","is_correct":false},
        {"label":"Que su padre era un farsante","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿Era útil el uso de tapabocas durante la cuarentena en Lozanía?',
      4,
      '[
        {"label":"No, porque el dengue no es contagioso","is_correct":true},
        {"label":"Sí, porque el dengue es contagioso","is_correct":false}
      ]'::jsonb
    );
  end if;

  -- =========================================================
  -- Cuestionario "Batalla final"
  -- =========================================================
  select id into _quiz_id from quizzes where title = 'Cuestionario "Batalla final"';

  if _quiz_id is null then
    raise exception 'No se encontró el quiz "Cuestionario Batalla final".';
  end if;

  if exists (select 1 from questions where quiz_id = _quiz_id) then
    raise notice 'Cuestionario "Batalla final" ya tiene preguntas, no se agrega nada.';
  else
    perform public.create_question_with_options(
      _quiz_id,
      '¿Cuáles son los síntomas principales del dengue?',
      1,
      '[
        {"label":"Apetito, sueño y pereza","is_correct":false},
        {"label":"Fiebre, malestar general, dolor de cabeza y dolor en músculos y huesos","is_correct":true},
        {"label":"Tos, sueño, dolor de cabeza y flemas","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿Según la explicación del médico Carlos, qué debes hacer si tienes síntomas de dengue?',
      2,
      '[
        {"label":"Automedicarse","is_correct":false},
        {"label":"Usar remedios caseros","is_correct":false},
        {"label":"Acudir al médico","is_correct":true}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿Por qué el plan de los niños ayudó a Manuel?',
      3,
      '[
        {"label":"Porque ayudaron a otras personas","is_correct":false},
        {"label":"Porque lavaron albercas y limpiaron patios","is_correct":true},
        {"label":"Porque guiaron al médico por el pueblo","is_correct":false}
      ]'::jsonb
    );

    perform public.create_question_with_options(
      _quiz_id,
      '¿A qué se atribuye el final de la epidemia en Lozanía?',
      4,
      '[
        {"label":"A las oraciones del sacerdote","is_correct":false},
        {"label":"A un golpe de suerte","is_correct":false},
        {"label":"A que los niños eliminaron los criaderos de zancudos en las viviendas","is_correct":true}
      ]'::jsonb
    );
  end if;
end $$;
