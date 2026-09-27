-- Falta un permiso: hoy un estudiante puede ver su propio perfil, y un
-- docente puede ver a sus estudiantes — pero nadie permitía que un
-- estudiante leyera el perfil de SU PROPIO profesor, que es de donde se
-- resuelve la institución/escudo a mostrar. Sin esto, la consulta no
-- truena (RLS simplemente no devuelve filas), así que el escudo
-- silenciosamente nunca aparecía.

drop policy if exists "estudiante ve institucion de su profesor" on public.profiles;
create policy "estudiante ve institucion de su profesor" on public.profiles
  for select
  using (
    exists (
      select 1
      from public.groups g
      join public.group_members gm on gm.group_id = g.id
      where g.teacher_id = profiles.id
        and gm.student_id = auth.uid()
    )
  );
