-- =========================================================
-- FEATURE: nuevo tipo de paso "ordering" (ordenar secuencia) +
-- contenido real de Actividad 2 y Actividad 3
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

-- 1. Permitir el nuevo tipo de paso.
alter table public.activity_steps drop constraint if exists activity_steps_step_type_check;
alter table public.activity_steps
  add constraint activity_steps_step_type_check
  check (step_type in ('fill_blank_single', 'fill_blank_multi', 'multiple_choice', 'ordering'));

-- 2. Contenido real: Actividad 2 y Actividad 3 (unidad "La invasión")
do $$
declare
  _unit_id uuid;
  _activity_id uuid;
  _step_id uuid;
begin
  select id into _unit_id from units where title = 'La invasión';

  -- Actividad 2
  if exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 2') then
    raise notice 'Actividad 2 ya existe, no se agrega de nuevo.';
  else
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 2', 2)
    returning id into _activity_id;

    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 1, 'fill_blank_single',
      'Arrastra hasta el recuadro azul la imagen que contenga al zancudo Aedes aegypti.',
      'Arrastra hasta el recuadro azul la imagen que contenga al zancudo Aedes aegypti.'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, 'Polilla', false, 1),
      (_step_id, 'Mosca', false, 1),
      (_step_id, 'Hormiga', false, 1),
      (_step_id, 'Escarabajo', false, 1),
      (_step_id, 'Aedes aegypti', true, 1);
  end if;

  -- Actividad 3
  if exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 3') then
    raise notice 'Actividad 3 ya existe, no se agrega de nuevo.';
  else
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 3', 3)
    returning id into _activity_id;

    insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
    values (
      _activity_id, 1, 'ordering',
      'Organiza la secuencia del ciclo de transmisión del dengue, tal como ocurrió en el libro.',
      'Organiza la secuencia del ciclo de transmisión del dengue, tal como ocurrió en el libro.'
    )
    returning id into _step_id;

    insert into activity_options (step_id, label, is_correct, blank_index) values
      (_step_id, 'La zancuda picó a los extranjeros.', true, 1),
      (_step_id, 'Los extranjeros enfermos fueron al médico.', true, 2),
      (_step_id, 'La zancuda picó a los pobladores.', true, 3),
      (_step_id, 'Los pobladores de Lozanía empezaron a enfermarse.', true, 4);
  end if;
end $$;
