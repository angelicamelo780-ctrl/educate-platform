-- Corrige la página 3 del capítulo "Los Invasores - Capítulos 1 y 2":
-- le faltaba el párrafo de Liliana y el diálogo entre Alejandro y Mario.

update chapter_pages
set body = 'El sol se empezó a ocultar. El mar, agitado por la brisa, empujaba con sus olas al barco egipcio contra el muelle, el cual estaba protegido por unas llantas viejas de camión que traía en los costados. De repente, de las llantas emergió un enjambre de mosquitos que volaba desordenado y sin rumbo, tal vez en busca de alimento. Medían menos de un centímetro y tenían cuerpos negros con patas blancas como una cebra. Parecían inofensivos, pero lo que nadie sospechaba es que ellos estaban decididos a quedarse en Lozania.

Liliana, la madre de Alejandro, trabajaba como enfermera, y entre sus aspiraciones estaba la de mudarse a una ciudad más grande para continuar sus estudios. Y la propuesta que esperaba llegó, sin pensarlo, organizó el viaje para iniciar una nueva vida junto a su hijo en Sausópolis, ciudad capital del departamento.

Alejandro reunió a su hermano y sus amigos para contarles la noticia. Todos lucían muy tristes, pero extrañamente a Mario se le dibujó una sonrisa.

—Te noto alegre —exclamó Alejandro.

—¡Claro que sí! —respondió Mario—. Ahora los juguetes serán para mí solo y seré el preferido de papá.

—Eres un fastidioso, Mario, ¿cómo te vas a alegrar si nunca más nos volveremos a ver? ¡Eres un mal hermano! Siempre supe que no me querías.

Mario se percató del dolor que había causado e intentó resarcirlo ofreciendo disculpas, pero era tarde.'
where chapter_id = (
  select id from chapters where title = 'Los Invasores - Capítulos 1 y 2'
)
and page_number = 3;
