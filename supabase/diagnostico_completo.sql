select 'UNIDAD' as tipo, id::text, title, order_index::text as extra
from units
union all
select 'ACTIVIDAD' as tipo, a.id::text, a.title, coalesce(u.title, '(sin unidad)') as extra
from activities a
left join units u on u.id = a.unit_id
order by tipo, extra;
