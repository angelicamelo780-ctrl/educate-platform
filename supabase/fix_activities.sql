-- =========================================================
-- FEATURE: actividades interactivas (arrastrar y soltar)
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete set null,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_steps (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  order_index int not null default 0,
  step_type text not null check (step_type in ('fill_blank_single', 'fill_blank_multi', 'multiple_choice')),
  instruction text not null,      -- ej: "Arrastra al cuadro verde la imagen que complete..."
  prompt text not null            -- la frase, con {1} {2} {3} como marcadores de espacio en blanco
);

create table if not exists public.activity_options (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.activity_steps(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  blank_index int not null default 1  -- a qué espacio en blanco pertenece (para fill_blank_multi)
);

create table if not exists public.activity_completions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, activity_id)
);

alter table public.activities enable row level security;
alter table public.activity_steps enable row level security;
alter table public.activity_options enable row level security;
alter table public.activity_completions enable row level security;

create policy "leer actividades" on public.activities
  for select using (auth.role() = 'authenticated');
create policy "admin administra actividades" on public.activities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "leer pasos de actividad" on public.activity_steps
  for select using (auth.role() = 'authenticated');
create policy "admin administra pasos de actividad" on public.activity_steps
  for all using (public.is_admin()) with check (public.is_admin());

-- Igual que con los quizzes: la respuesta correcta NO se expone a estudiantes
-- por lectura directa; solo el admin puede leer/editar esta tabla.
create policy "admin administra opciones de actividad" on public.activity_options
  for all using (public.is_admin()) with check (public.is_admin());

create policy "estudiante ve sus actividades completadas" on public.activity_completions
  for select using (auth.uid() = student_id);
create policy "estudiante marca su actividad completada" on public.activity_completions
  for insert with check (auth.uid() = student_id);
create policy "docente ve completadas de su grupo" on public.activity_completions
  for select using (public.teaches_student(student_id));

-- Entrega los pasos + opciones de una actividad SIN is_correct
-- (para que el estudiante la resuelva sin ver la respuesta).
create or replace function public.get_activity_for_playing(_activity_id uuid)
returns table(
  step_id uuid, step_order int, step_type text, instruction text, prompt text,
  option_id uuid, option_label text, blank_index int
)
language sql
security definer
set search_path = public
stable
as $$
  select s.id, s.order_index, s.step_type, s.instruction, s.prompt,
         o.id, o.label, o.blank_index
  from activity_steps s
  join activity_options o on o.step_id = s.id
  where s.activity_id = _activity_id
  order by s.order_index;
$$;

-- Verifica las respuestas de UN paso (el frontend llama esto por cada
-- paso, así el estudiante ve si acertó antes de avanzar al siguiente).
-- _placements: [{"option_id": "...", "blank_index": 1}, ...]
create or replace function public.check_activity_step(_step_id uuid, _placements jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _placement jsonb;
  _option_id uuid;
  _blank_index int;
  _is_correct boolean;
  _correct_blank int;
  _all_ok boolean := true;
  _total_correct_options int;
begin
  select count(*) into _total_correct_options
  from activity_options where step_id = _step_id and is_correct;

  if jsonb_array_length(_placements) != _total_correct_options then
    return false;
  end if;

  for _placement in select * from jsonb_array_elements(_placements)
  loop
    _option_id := (_placement->>'option_id')::uuid;
    _blank_index := (_placement->>'blank_index')::int;

    select is_correct, blank_index into _is_correct, _correct_blank
    from activity_options
    where id = _option_id and step_id = _step_id;

    if not found or not _is_correct or _correct_blank != _blank_index then
      _all_ok := false;
    end if;
  end loop;

  return _all_ok;
end;
$$;

-- Marca la actividad completa cuando el estudiante termina todos los pasos.
create or replace function public.complete_activity(_activity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into activity_completions (student_id, activity_id)
  values (auth.uid(), _activity_id)
  on conflict (student_id, activity_id) do nothing;
$$;

-- =========================================================
-- Contenido real: Actividad 1 (unidad "La invasión")
-- =========================================================
do $$
declare
  _unit_id uuid;
  _activity_id uuid;
  _step_id uuid;
begin
  select id into _unit_id from units where title = 'La invasión';

  if exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 1') then
    raise notice 'Actividad 1 ya existe, no se agrega de nuevo.';
    return;
  end if;

  insert into activities (unit_id, title, order_index)
  values (_unit_id, 'Actividad 1', 1)
  returning id into _activity_id;

  -- Paso 1: fill_blank_single (Barco / Avión / Tren)
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (_activity_id, 1, 'fill_blank_single',
    'Arrastra al cuadro verde el nombre del dibujo que complete correctamente la frase:',
    'Los mosquitos invasores llegaron desde África en un: {1}')
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'Barco', true, 1),
    (_step_id, 'Avión', false, 1),
    (_step_id, 'Tren', false, 1);

  -- Paso 2: fill_blank_single (Llanta / Cama / Armario)
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (_activity_id, 2, 'fill_blank_single',
    'Arrastra al cuadro verde la imagen que complete correctamente la frase:',
    '¿Dónde se ocultaron los mosquitos durante el viaje? {1}')
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'Llanta', true, 1),
    (_step_id, 'Cama', false, 1),
    (_step_id, 'Armario', false, 1);

  -- Paso 3: fill_blank_multi (picaron / enfermos / la enfermedad)
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (_activity_id, 3, 'fill_blank_multi',
    'Arrastra al cuadro naranja la palabra que consideres correcta para completar la frase.',
    'Los zancudos {1} a los extranjeros {2} y luego transmitieron {3} a los pobladores de Lozanía.')
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'picaron', true, 1),
    (_step_id, 'enfermos', true, 2),
    (_step_id, 'la enfermedad', true, 3);

  -- Paso 4: multiple_choice (síntomas del dengue)
  insert into activity_steps (activity_id, order_index, step_type, instruction, prompt)
  values (_activity_id, 4, 'multiple_choice',
    'Elige la respuesta correcta:',
    'Son síntomas de dengue:')
  returning id into _step_id;

  insert into activity_options (step_id, label, is_correct, blank_index) values
    (_step_id, 'Fiebre, dolor de cabeza, dolor en articulaciones y malestar.', true, 1),
    (_step_id, 'Cansancio y dolor de muela.', false, 1),
    (_step_id, 'Visión borrosa, insomnio y jaqueca.', false, 1),
    (_step_id, 'Tos, catarro y malestar.', false, 1);
end $$;
