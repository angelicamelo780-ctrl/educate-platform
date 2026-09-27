-- =========================================================
-- FIX: unidades duplicadas (ej. "La invasión" repetida) y
-- prevención de que vuelva a pasar
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

-- 1. Diagnóstico: ¿hay títulos de unidad duplicados?
select title, count(*) as copias
from public.units
group by title
having count(*) > 1;

-- 2. Fusiona duplicados: por cada título repetido, deja una sola fila
--    (la de id menor) y reasigna todo el contenido de las demás a esa.
do $$
declare
  r record;
  canonical_id uuid;
begin
  for r in
    select title from public.units group by title having count(*) > 1
  loop
    select min(id) into canonical_id from public.units where title = r.title;

    update public.chapters set unit_id = canonical_id
      where unit_id in (select id from public.units where title = r.title and id <> canonical_id);
    update public.activities set unit_id = canonical_id
      where unit_id in (select id from public.units where title = r.title and id <> canonical_id);
    update public.quizzes set unit_id = canonical_id
      where unit_id in (select id from public.units where title = r.title and id <> canonical_id);
    update public.videos set unit_id = canonical_id
      where unit_id in (select id from public.units where title = r.title and id <> canonical_id);

    delete from public.units where title = r.title and id <> canonical_id;

    raise notice 'Unidad "%" fusionada en %', r.title, canonical_id;
  end loop;
end $$;

-- 3. Evita que se puedan volver a duplicar títulos de unidad.
do $$
begin
  alter table public.units add constraint units_title_key unique (title);
exception
  when duplicate_object then null;
  when unique_violation then
    raise notice 'Todavía hay duplicados, revisa el resultado del paso 1.';
end $$;

-- 4. Verifica que ahora sí aparezca todo el contenido de "La invasión".
select 'capitulo' as tipo, title from public.chapters
  where unit_id = (select id from public.units where title = 'La invasión')
union all
select 'actividad', title from public.activities
  where unit_id = (select id from public.units where title = 'La invasión')
union all
select 'quiz', title from public.quizzes
  where unit_id = (select id from public.units where title = 'La invasión');
