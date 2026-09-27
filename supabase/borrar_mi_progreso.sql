-- Borra TODO el progreso de un solo estudiante (identificado por su correo)
-- para poder probar la plataforma desde cero. No afecta a otros usuarios.
--
-- Reemplaza 'tu-correo@aqui.com' por tu correo real antes de correrlo.

do $$
declare
  _student_id uuid;
begin
  select id into _student_id from auth.users where email = 'tu-correo@aqui.com';

  if _student_id is null then
    raise exception 'No se encontró ningún usuario con ese correo.';
  end if;

  delete from reading_completions where student_id = _student_id;
  delete from activity_completions where student_id = _student_id;
  delete from video_completions where student_id = _student_id;
  delete from certificates where attempt_id in (select id from quiz_attempts where student_id = _student_id);
  delete from attempt_answers where attempt_id in (select id from quiz_attempts where student_id = _student_id);
  delete from quiz_attempts where student_id = _student_id;

  raise notice 'Progreso borrado para el usuario %', _student_id;
end $$;
