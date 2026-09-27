-- Reemplaza 'correo-del-estudiante@aqui.com' por el correo del estudiante
-- de prueba, para ver exactamente de qué profesor(es) y qué institución
-- está heredando el escudo.

select
  est.email as estudiante,
  g.name as grupo,
  doc.email as profesor,
  i.nombre as institucion,
  m.nombre as municipio
from auth.users est
join group_members gm on gm.student_id = est.id
join groups g on g.id = gm.group_id
join auth.users doc on doc.id = g.teacher_id
left join profiles doc_perfil on doc_perfil.id = g.teacher_id
left join instituciones i on i.id = doc_perfil.institucion_id
left join municipios m on m.id = i.municipio_id
where est.email = 'correo-del-estudiante@aqui.com';
