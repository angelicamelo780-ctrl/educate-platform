-- Contenido real del libro "Los invasores" — correr después de schema.sql
-- en cualquier instalación nueva del proyecto.

insert into public.units (title, description, order_index) values
  ('La invasión', 'Capítulos 1 y 2 de "Los invasores"', 1),
  ('El caos', 'Capítulos 3 y 4 de "Los invasores"', 2),
  ('La batalla final', 'Capítulos 5 y 6 de "Los invasores"', 3);

insert into public.quizzes (unit_id, title, pass_threshold)
select id, 'Cuestionario "la invasión"', 80 from public.units where title = 'La invasión';

insert into public.quizzes (unit_id, title, pass_threshold)
select id, 'Cuestionario "El caos"', 80 from public.units where title = 'El caos';

insert into public.quizzes (unit_id, title, pass_threshold)
select id, 'Cuestionario "Batalla final"', 80 from public.units where title = 'La batalla final';
