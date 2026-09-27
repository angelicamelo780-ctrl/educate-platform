-- =========================================================
-- FIX: estructura completa de 12 páginas (con las 3 ilustraciones
-- reales) para "Los Invasores - Capítulos 1 y 2"
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

alter table public.chapter_pages add column if not exists image_url text;
alter table public.chapter_pages alter column body drop not null;

do $$
declare
  _unit_id uuid;
  _chapter_id uuid;
begin
  select id into _unit_id from units where title = 'La invasión';

  select id into _chapter_id from chapters
  where unit_id = _unit_id and title = 'Los Invasores - Capítulos 1 y 2';

  if _chapter_id is null then
    insert into chapters (unit_id, title, order_index)
    values (_unit_id, 'Los Invasores - Capítulos 1 y 2', 1)
    returning id into _chapter_id;
  else
    -- Reemplaza las páginas existentes por la estructura completa de 12.
    delete from chapter_pages where chapter_id = _chapter_id;
  end if;

  insert into chapter_pages (chapter_id, page_number, heading, body, image_url) values

  (_chapter_id, 1, 'Capítulo 1',
'Lozania es una ciudad de la costa. Un puerto con calles limpias y cielos despejados, sus muelles fortificados y su gente laboriosa. Un lugar donde las palmeras que bordean sus playas se mecen con el viento en una danza maravillosa que deleita a moradores y visitantes.

Allí, todo marchaba al ritmo de los días que cambiaban de color, según la variación del clima junto al mar tropical. El reloj de la torre marcaba las 4 y 32 de la tarde cuando se escuchó la sirena de un barco con bandera egipcia que arribó al puerto. La gente curiosa, se aglomeró sobre el muelle para ver lo que ocurría. Con asombro, vieron descender a un grupo de extranjeros que venían en busca de nuevos lugares para la diversión y los negocios.

En ese momento, la campana dio por terminadas las clases en la escuela. Los niños salieron apresurados a jugar a la playa, como era costumbre. Entre ellos,', null),

  (_chapter_id, 2, null,
'dos inquietos jovencitos, hijos de Manuel, el inspector de sanidad de Lozania. Alejandro y Mario, eran hermanos por parte de papá, pero hijos de distinta madre. El mayor, es hijo de Liliana, fruto de un amor de la adolescencia de Mario, el menor, hijo de Ángela su actual esposa.

Los hermanos mantenían una constante competencia por demostrar el liderazgo ante sus amigos. De esta manera, sostenían discusiones propias de la edad que los hacían rabiar y disgustarse; pero como hermanos y compañeros de travesuras, pronto olvidaban sus diferencias y jugaban juntos otra vez.

Cansados de este día, todos los niños se sentaron a la orilla del mar para conversar sus historias y reírse de lo ocurrido. Valentina, quien se destacaba por su simpatía, preguntó a los demás sobre lo que querían hacer en su futuro. Algunos manifestaron su deseo de ser policías, enfermeros o bomberos, otros por ser médicos, astronautas o ingenieros; Alejandro y Mario coincidieron en su inclinación por el arte y la música, pues decían que querían ser cantantes famosos. Los otros niños se echaron a reír al escucharlos abrigar esa esperanza, pues les parecía algo imposible de alcanzar, en especial porque el tono de voz de Alejandro estaba cambiando por la pubertad.', null),

  (_chapter_id, 3, null,
'El sol se empezó a ocultar. El mar, agitado por la brisa, empujaba con sus olas al barco egipcio contra el muelle, el cual estaba protegido por unas llantas viejas de camión que traía en los costados. De repente, de las llantas emergió un enjambre de mosquitos que volaba desordenado y sin rumbo, tal vez en busca de alimento. Medían menos de un centímetro y tenían cuerpos negros con patas blancas como una cebra. Parecían inofensivos, pero lo que nadie sospechaba es que ellos estaban decididos a quedarse en Lozania.', null),

  (_chapter_id, 4, null, null, '/illustrations/bus.png'),

  (_chapter_id, 5, null,
'Alejandro rompió en llanto y se marchó, mientras su hermano inmóvil lo observaba.

—Pobrecitos —expresó Valentina.

Llegó el día de la mudanza y todos se reunieron en el terminal de autobuses. Alejandro y su mamá, entre abrazos y llanto, se despidieron.

—Te traje esta carta —le dijo Mario a su hermano, extendiendo su brazo—. Quiero que sepas algo...

Alejandro recibió de mala gana el papel escrito a mano y trató de romperlo, pero lo guardó en la maleta al notar que su padre lo miraba. Lo abrazó sin ganas y le susurró al oído: —No tienes que fingir, sé que estás feliz porque yo me voy.

El autobús que los llevaría a Sausópolis prendió motores y dejó una estela de humo mientras se alejaba. Los pasajeros sacaron sus manos por la ventanilla en señal de adiós y los niños corrieron tras el bus despidiendo a Alejandro, mientras Mario los observaba con lágrimas en su rostro.', null),

  (_chapter_id, 6, 'Capítulo 2',
'Una semana después, algo extraño ocurrió en el puerto. Algunos de los extranjeros y tripulantes que llegaron en el último barco empezaron a padecer una extraña enfermedad que los obligó a visitar médicos y especialistas. Todos coincidían con los mismos síntomas: fiebre, malestar en el cuerpo, dolor en músculos y huesos, sudoración fría, vómitos y diarrea. ¿Será que pese a un virus desconocido que contrajeron durante el viaje? ¿Será que los mosquitos tienen algo que ver con estos casos? Se preguntaron.

Mientras los pacientes eran atendidos, unos mosquitos hambrientos ingresaron de manera silenciosa a los consultorios del hospital y sin el menor descuido, se posaron sobre la piel descubierta de los enfermos, inyectaron su delgada trompa con forma de aguja y succionaron su sangre hasta saciarse. Luego, salieron del lugar y se esparcieron por la ciudad en busca de refugio.', null),

  (_chapter_id, 7, null,
'No pasó mucho tiempo para que los mosquitos estuvieran por todos los rincones de Lozania. Las hembras buscaban alimento en estanques de agua donde asentarse, y los machos se divertían como haraganes. Operadores del sistema portuario, trabajadores de las dependencias municipales, vendedores ambulantes, obreros de la construcción, fueron víctimas de las picaduras de estos insectos.

—A esta ciudad no la salva nada, la va a matar un mosquito —dijo un hombre que cruzó la plaza hablando solo.

Algunos pobladores se empezaron a enfermar y presentaban los mismos síntomas de los extranjeros. Rápidamente, inundaron el hospital que permanecía casi vacío. Ante la situación, la Secretaría de Salud Municipal convocó a una reunión urgente al comité de gestión de riesgo, al alcalde, la gestora social, el sacerdote, un representante de la policía, los secretarios del despacho y al equipo técnico encargado del saneamiento ambiental.

—¡Es un invasor! —exclamó Manuel, el inspector de sanidad—. El Instituto de Salud Pública me ha enviado información expresando que todo es a causa de un zancudo negro de patas pintadas que ha invadido nuestra ciudad. Se tiene evidencia de epidemias causadas por este insecto en otros continentes, dejando muerte y fatalidad.', null),

  (_chapter_id, 8, null, null, '/illustrations/swarm.png'),

  (_chapter_id, 9, null,
'—¿Cómo así? —preguntó el alcalde—. ¿Usted está diciendo que nos ha invadido un insecto mortal?

—Pues yo creo que sí, señor —respondió Manuel.

—¿Yo creo? ¡Esa respuesta no me sirve, necesito certezas de lo que está sucediendo! Háblenos más claro, háblenos del mosquito ese, díganos de qué se trata.

El inspector sacó de su maletín un cartel para empezar su exposición.

—No es un simple mosquito —dijo—, es un zancudo procedente de África llamado Aedes aegypti. Sus hembras se alimentan de la sangre humana; su trompa está alargada con forma de aguja y cuando pican, pueden transmitir virus letales.

—¿Dios mío, un insecto está causando esta crisis? —preguntó sorprendido el sacerdote.

—Abran bien los ojos, porque su peligrosa aguja succiona la sangre como si fuera una jeringa.

—Mucha poesía y poco verbo —dijo malhumorado el alcalde—. Se ve que usted conoce la teoría, pero la ciudad requiere acciones contundentes. No actúe como los embaucadores, necesitamos soluciones.

—En ese caso, se debe eliminar el origen, la fuente del problema —dijo Manuel.', null),

  (_chapter_id, 10, null,
'—¿El origen? —murmuraron todos.

—El origen está en la zancuda que transmite el extraño virus —volvió a explicar Manuel—, ellas no nacen infectadas, adquieren el virus cuando pican a una persona enferma, y cada vez que vuelven a picar, transmiten la enfermedad —sentenció el inspector.

Escarbó otra vez en su maletín y extrajo un catálogo que contenía la imagen de un químico fabricado en Europa. —Lo podemos comprar para fumigar toda la ciudad y acabarlos de una vez —agregó—. Con los equipos necesarios y las personas expertas, se acabará la crisis.

El alcalde aprobó la compra del insecticida, los asistentes aplaudieron y se marcharon confiados en la propuesta de Manuel.

Esa noche, las estrellas titilaban en el firmamento oscuro y la ciudad continuaba sumergida en un ambiente de temor. Unos esperaban preocupados por la noticia de la epidemia, otros usaban tapabocas y tomaban remedios caseros para luchar contra la enfermedad. Se oían los gritos de angustia de mujeres que auxiliaban a sus hijos, y los lamentos de enfermos que empezaban a sentir fiebre y dolores intensos en sus músculos y huesos.

A la mañana siguiente, hombres con fumigadoras a la espalda recorrieron todas las casas de la ciudad,', null),

  (_chapter_id, 11, null, null, '/illustrations/sick.png'),

  (_chapter_id, 12, null,
'esparciendo el químico que dejaba muertos a los zancudos en pisos y corredores.

Un día después, el inspector asediado por los medios de comunicación exclamó orgulloso que todo estaba controlado, que los zancudos transmisores de la epidemia habían sido exterminados y que la tranquilidad reinaría en el puerto.

Hubo vítores, gritos de alegría por las calles, como si el equipo de fútbol de Lozania hubiera ganado el campeonato mundial. La calma volvió a sentirse en la ciudad. La gente retomó los paseos en las tardes y las andanzas nocturnas; las mujeres se quitaron las pañoletas que tapaban sus rostros y ya no llevaban los tapabocas porque toda su angustia se convirtió en sonrisa.

—¡Que viva la libertad, que viva la salud! —gritaban algunos pobladores en coro. La batalla había terminado dejando como héroe a Manuel Ricardo Fandiño, el flamante inspector de sanidad, quien trajo de nuevo la salud y la alegría al lugar.', null);
end $$;
