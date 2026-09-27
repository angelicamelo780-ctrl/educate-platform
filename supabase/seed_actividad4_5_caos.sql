-- =========================================================
-- Actividad 4 y Actividad 5 de la unidad "El caos"
-- Agrega el tipo de paso "multi_select" (elegir varias opciones
-- correctas de una lista, ej. "elige los 3 elementos que...").
-- Seguro de correr una sola vez: si la actividad ya existe, no
-- hace nada.
-- =========================================================

-- 1. Permitir el nuevo tipo de paso "multi_select".
alter table public.activity_steps drop constraint if exists activity_steps_step_type_check;
alter table public.activity_steps
  add constraint activity_steps_step_type_check
  check (step_type in ('fill_blank_single', 'fill_blank_multi', 'multiple_choice', 'ordering', 'multi_select'));

do $$
declare
  _unit_id uuid;
  _activity_id uuid;
  _step_id uuid;
begin
  select id into _unit_id from units where title = 'El caos';

  if _unit_id is null then
    raise exception 'No se encontró la unidad "El caos".';
  end if;

  -- =========================================================
  -- Actividad 4: ciclo de vida del zancudo (arrastra la etapa a
  -- su letrero en el estanque)
  -- =========================================================
  if exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 4') then
    raise notice 'Actividad 4 ya existe, no se agrega de nuevo.';
  else
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 4', 4)
    returning id into _activity_id;

    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 1, 'fill_blank_multi',
      '¡Hola! Soy el agua estancada. El zancudo ya empezó su ciclo. ¡Ayúdame a detenerlo! Arrastra cada palabra al letrero que le corresponde.',
      '¡Hola! Soy el agua estancada. El zancudo ya empezó su ciclo. ¡Ayúdame a detenerlo! Arrastra cada palabra al letrero que le corresponde.'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, 'Huevo', true, 1),
      (_step_id, 'Larva', true, 2),
      (_step_id, 'Pupa', true, 3),
      (_step_id, 'Adulto', true, 4);
  end if;

  -- =========================================================
  -- Actividad 5: la investigación de Mario (capítulo 4)
  -- =========================================================
  if exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 5') then
    raise notice 'Actividad 5 ya existe, no se agrega de nuevo.';
  else
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 5', 5)
    returning id into _activity_id;

    -- Paso 1: multiple_choice (hora de la investigación)
    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 1, 'multiple_choice',
      'En el capítulo 4, Mario inició una investigación. De acuerdo con esto, elige la respuesta correcta.',
      '¿A qué hora inició Mario su investigación?'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, '5:00 PM', false, 1),
      (_step_id, '2:00 PM', false, 1),
      (_step_id, '4:30 AM', true, 1);

    -- Paso 2: multi_select (3 elementos que usó Mario)
    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 2, 'multi_select',
      'Selecciona los tres elementos que utilizó Mario en su investigación.',
      'Selecciona los tres elementos que utilizó Mario en su investigación.'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, 'Tablet', false, 1),
      (_step_id, 'Impresora', false, 1),
      (_step_id, 'Celular', false, 1),
      (_step_id, 'Lupa', true, 1),
      (_step_id, 'Linterna', true, 1),
      (_step_id, 'Libreta', true, 1),
      (_step_id, 'Patineta', false, 1),
      (_step_id, 'Balón', false, 1),
      (_step_id, 'Bicicleta', false, 1);

    -- Paso 3: multiple_choice (dónde se ocultan las zancudas)
    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 3, 'multiple_choice',
      'Elige la respuesta correcta:',
      '¿Dónde se ocultan las zancudas?'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, 'Llantas con agua estancada', true, 1),
      (_step_id, 'Un cuarto', false, 1),
      (_step_id, 'La cocina', false, 1);

    -- Paso 4: fill_blank_multi (la alberca le habló a Mario en un
    -- sueño — arrastra cada respuesta correcta a su pregunta)
    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 4, 'fill_blank_multi',
      'Una alberca le habló a Mario a través de un sueño. Arrastra la imagen correcta a cada pregunta para descubrir lo que le contó.',
      '¿De qué se alimentan las zancudas? {1}   ¿Qué virus te pueden transmitir las zancudas cuando te pican? {2}   ¿Con qué debes lavar la alberca semanalmente? {3}'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, 'Sangre humana', true, 1),
      (_step_id, 'Virus del dengue', true, 2),
      (_step_id, 'Productos de limpieza', true, 3),
      (_step_id, 'Alcohol', false, 1),
      (_step_id, 'Bote de basura', false, 2),
      (_step_id, 'Frutas', false, 3);
  end if;
end $$;
