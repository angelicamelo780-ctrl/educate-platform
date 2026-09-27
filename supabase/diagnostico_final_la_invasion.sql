-- 1. ¿Cuál es el id de "La invasión"? (debe ser una sola fila)
select id, title from units where title = 'La invasión';

-- 2. Todo lo que existe HOY vinculado a esa unidad (copia el id de arriba
--    si prefieres pegarlo a mano; esta consulta ya lo resuelve sola).
select 'capitulo' as tipo, title, id::text
  from chapters
  where unit_id = (select id from units where title = 'La invasión')
union all
select 'actividad', title, id::text
  from activities
  where unit_id = (select id from units where title = 'La invasión')
union all
select 'quiz', title, id::text
  from quizzes
  where unit_id = (select id from units where title = 'La invasión');

-- 3. Por si acaso: ¿existen "Actividad 2" / "Actividad 3" en la tabla,
--    pero apuntando a otro lado (o a ningún lado)?
select id, title, unit_id from activities where title in ('Actividad 2', 'Actividad 3');
