-- =========================================================
-- Edúcate contra el Dengue — Esquema de base de datos
-- =========================================================
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo)

-- ---------------------------------------------------------
-- 1. PERFILES (extiende auth.users con rol y datos básicos)
-- ---------------------------------------------------------
create type public.user_role as enum ('estudiante', 'docente', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'estudiante',
  school text,
  created_at timestamptz not null default now()
);

-- Crea automáticamente el perfil cuando alguien se registra.
-- El rol y nombre vienen del formulario de registro (ver metadata).
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, school)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'estudiante'),
    new.raw_user_meta_data->>'school'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2. GRUPOS (un docente puede tener varios grupos/clases)
-- ---------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  join_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

-- ---------------------------------------------------------
-- 3. CONTENIDO Y QUIZZES
-- ---------------------------------------------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int not null default 0
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete set null,
  title text not null,
  pass_threshold int not null default 80, -- % mínimo para aprobar / certificarse
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  order_index int not null default 0
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false
);

-- ---------------------------------------------------------
-- 4. INTENTOS DE QUIZ Y PROGRESO
-- ---------------------------------------------------------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score int not null,          -- porcentaje 0-100
  passed boolean not null,
  submitted_at timestamptz not null default now()
);

create table public.attempt_answers (
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  option_id uuid not null references public.options(id),
  primary key (attempt_id, question_id)
);

create table public.progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  status text not null default 'no_iniciado', -- no_iniciado | en_progreso | completado
  updated_at timestamptz not null default now(),
  primary key (student_id, unit_id)
);

-- ---------------------------------------------------------
-- 5. CERTIFICADOS
-- ---------------------------------------------------------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  attempt_id uuid not null references public.quiz_attempts(id),
  issued_at timestamptz not null default now(),
  pdf_url text -- se llena luego de generar el PDF (Supabase Storage)
);

-- ---------------------------------------------------------
-- 6. ROW LEVEL SECURITY (cada quien ve lo suyo)
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;
alter table public.units enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;

-- Funciones auxiliares (security definer): evalúan el permiso "por dentro"
-- sin volver a disparar RLS sobre la otra tabla — evita recursión infinita
-- entre las policies de groups <-> group_members.
create or replace function public.is_teacher_of_group(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from groups where id = _group_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_member_of_group(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = _group_id and student_id = auth.uid()
  );
$$;

create or replace function public.teaches_student(_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members gm
    join groups g on g.id = gm.group_id
    where gm.student_id = _student_id and g.teacher_id = auth.uid()
  );
$$;

-- Perfiles: cada usuario ve/edita el suyo; docentes ven perfiles de sus estudiantes
create policy "ver propio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "docente ve estudiantes de su grupo" on public.profiles
  for select using (public.teaches_student(id));

create policy "editar propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Grupos: el docente dueño los administra
create policy "docente administra sus grupos" on public.groups
  for all using (auth.uid() = teacher_id);

create policy "estudiante ve su grupo" on public.groups
  for select using (public.is_member_of_group(id));

-- Cualquier usuario logueado puede buscar un grupo por su código para
-- poder unirse (no expone nada sensible, solo id/nombre/código).
create policy "buscar grupo por codigo para unirse" on public.groups
  for select using (auth.role() = 'authenticated');

-- Membresías
create policy "estudiante ve su membresía" on public.group_members
  for select using (auth.uid() = student_id);

create policy "estudiante se une con código" on public.group_members
  for insert with check (auth.uid() = student_id);

create policy "docente ve miembros de su grupo" on public.group_members
  for select using (public.is_teacher_of_group(group_id));

-- Intentos de quiz: el estudiante ve/crea los suyos; el docente ve los de su grupo
create policy "estudiante gestiona sus intentos" on public.quiz_attempts
  for all using (auth.uid() = student_id);

create policy "docente ve intentos de su grupo" on public.quiz_attempts
  for select using (public.teaches_student(student_id));

create policy "estudiante gestiona sus respuestas" on public.attempt_answers
  for all using (
    exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and qa.student_id = auth.uid())
  );

-- Progreso
create policy "estudiante gestiona su progreso" on public.progress
  for all using (auth.uid() = student_id);

create policy "docente ve progreso de su grupo" on public.progress
  for select using (public.teaches_student(student_id));

-- Certificados
create policy "estudiante ve sus certificados" on public.certificates
  for select using (auth.uid() = student_id);

create policy "docente ve certificados de su grupo" on public.certificates
  for select using (public.teaches_student(student_id));

-- ---------------------------------------------------------
-- 7. CONTENIDO: solo el docente crea/edita, todos los logueados leen
-- ---------------------------------------------------------
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

create policy "leer unidades" on public.units
  for select using (auth.role() = 'authenticated');
create policy "admin administra unidades" on public.units
  for all using (public.is_admin()) with check (public.is_admin());

create policy "leer quizzes" on public.quizzes
  for select using (auth.role() = 'authenticated');
create policy "admin administra quizzes" on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "leer preguntas" on public.questions
  for select using (auth.role() = 'authenticated');
create policy "admin administra preguntas" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin administra opciones" on public.options
  for all using (public.is_admin()) with check (public.is_admin());

-- Entrega preguntas + opciones de un quiz SIN el campo is_correct
-- (para que el estudiante pueda tomarlo sin ver la respuesta).
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

-- Recibe las respuestas del estudiante y califica del lado del servidor.
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

-- Crea una pregunta + sus opciones en una sola operación atómica.
create or replace function public.create_question_with_options(
  _quiz_id uuid,
  _prompt text,
  _order_index int,
  _options jsonb
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
-- (contenido real de las actividades: ver supabase/fix_activities.sql / seed_content.sql)
