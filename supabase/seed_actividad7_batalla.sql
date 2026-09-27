-- Contenido real de "Actividad 7" (unidad "La batalla final").
-- Crea la actividad si no existe, y le agrega los pasos. Seguro de
-- correr una sola vez: si ya existe con pasos, no hace nada.

do $$
declare
  _unit_id uuid;
  _activity_id uuid;
  _step_id uuid;
begin
  select id into _unit_id from units where title = 'La batalla final';

  if _unit_id is null then
    raise exception 'No se encontró la unidad "La batalla final".';
  end if;

  select id into _activity_id from activities where unit_id = _unit_id and title = 'Actividad 7';

  if _activity_id is null then
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 7', 1)
    returning id into _activity_id;
  end if;

  if exists (select 1 from activity_steps where activity_id = _activity_id) then
    raise notice 'Actividad 7 ya tiene pasos, no se agrega nada.';
    return;
  end if;

  -- Paso 1
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (
    _activity_id, 1, 'multiple_choice',
    'En el capítulo 5, el médico Alberto explicó en qué consistía el problema ocurrido en Lozanía. Según sus explicaciones, responde:',
    '¿Cuál es el nombre del virus que azotó Lozanía?'
  )
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'Malaria', false, 1),
    (_step_id, 'Dengue', true, 1),
    (_step_id, 'Zika', false, 1);

  -- Paso 2
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (
    _activity_id, 2, 'multiple_choice',
    'Elige la respuesta correcta:',
    '¿Cuál es el nombre del zancudo transmisor del dengue?'
  )
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'Culex', false, 1),
    (_step_id, 'Anopheles', false, 1),
    (_step_id, 'Aedes aegypti', true, 1);

  -- Paso 3
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (
    _activity_id, 3, 'multiple_choice',
    'Elige la respuesta correcta:',
    '¿El dengue es contagioso?'
  )
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'No, lo transmite un zancudo', true, 1),
    (_step_id, 'Sí', false, 1),
    (_step_id, 'Sí, se transmite cuando alguien tose', false, 1);

  -- Paso 4
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (
    _activity_id, 4, 'multiple_choice',
    'Elige la respuesta correcta:',
    '¿Era necesario que las personas utilizaran tapabocas?'
  )
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'No', true, 1),
    (_step_id, 'Sí', false, 1),
    (_step_id, 'Tal vez', false, 1);

  -- Paso 5: arrastrar y soltar (una sola zona de destino)
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (
    _activity_id, 5, 'fill_blank_single',
    '¿A qué crees que se debió la muerte del jardinero? Arrastra hasta la zona verde la respuesta que consideras correcta.',
    '¿A qué crees que se debió la muerte del jardinero? Arrastra hasta la zona verde la respuesta que consideras correcta.'
  )
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'Ya estaba muy anciano.', false, 1),
    (_step_id, 'No estaba afiliado al sistema de salud.', false, 1),
    (_step_id, 'No asistió al médico y decidió automedicarse.', true, 1);
end $$;
