-- Corrige un error de nombre: el cuestionario "Batalla final" decía
-- "el médico Carlos", pero en el libro (capítulos 5 y 6) el médico se
-- llama Alberto. Seguro de correr varias veces.

update questions
set prompt = '¿Según la explicación del doctor Alberto, qué debes hacer si tienes síntomas de dengue?'
where prompt = '¿Según la explicación del médico Carlos, qué debes hacer si tienes síntomas de dengue?';
