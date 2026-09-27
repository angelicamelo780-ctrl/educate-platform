-- Corre esto en el SQL Editor y pégame el resultado completo.

-- 1. ¿Cuántas filas "La invasión" hay realmente, y cuáles son sus ids?
select id, title from units where title = 'La invasión';

-- 2. ¿A qué unit_id apunta cada capítulo, y coincide con alguno de arriba?
select id, title, unit_id from chapters;

-- 3. ¿A qué unit_id apunta cada actividad?
select id, title, unit_id, order_index from activities order by order_index;

-- 4. ¿A qué unit_id apunta cada quiz?
select id, title, unit_id from quizzes;
