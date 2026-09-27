-- Crea las filas de "Actividad 9 - Juego del Ahorcado" y
-- "Actividad 10 - Juego de sopa de letras" en "La batalla final".
-- Igual que Actividad 8, son juegos a la medida (viven en el código),
-- así que no necesitan activity_steps. Seguro de correr varias veces.

do $$
declare
  _unit_id uuid;
begin
  select id into _unit_id from units where title = 'La batalla final';

  if _unit_id is null then
    raise exception 'No se encontró la unidad "La batalla final".';
  end if;

  if not exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 9 - Juego del Ahorcado') then
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 9 - Juego del Ahorcado', 3);
  end if;

  if not exists (select 1 from activities where unit_id = _unit_id and title = 'Actividad 10 - Juego de sopa de letras') then
    insert into activities (unit_id, title, order_index)
    values (_unit_id, 'Actividad 10 - Juego de sopa de letras', 4);
  end if;
end $$;
