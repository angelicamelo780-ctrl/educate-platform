-- Crea la fila de "Actividad 8" en la unidad "La batalla final".
-- A diferencia de las demás actividades, esta es un juego a la medida
-- (vive en el código de la app), así que no necesita activity_steps.
-- Seguro de correr varias veces.

do $$
declare
  _unit_id uuid;
begin
  select id into _unit_id from units where title = 'La batalla final';

  if _unit_id is null then
    raise exception 'No se encontró la unidad "La batalla final".';
  end if;

  if not exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 8') then
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 8', 2);
  end if;
end $$;
