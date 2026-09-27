select a.id, a.title, a.order_index, u.title as unidad
from activities a
join units u on u.id = a.unit_id
where u.title ilike '%batalla%'
order by a.order_index;
