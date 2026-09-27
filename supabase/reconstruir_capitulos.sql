-- =========================================================
-- FEATURE: lector de capítulos (flipbook de páginas de texto)
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete set null,
  title text not null,           -- ej: "Los Invasores - Capítulos 1 y 2"
  order_index int not null default 0
);

create table if not exists public.chapter_pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  page_number int not null,
  heading text,                  -- ej: "Capítulo 1" (solo en la página donde aparece)
  body text not null
);

create table if not exists public.reading_completions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, chapter_id)
);

alter table public.chapters enable row level security;
alter table public.chapter_pages enable row level security;
alter table public.reading_completions enable row level security;

create policy "leer capitulos" on public.chapters
  for select using (auth.role() = 'authenticated');
create policy "admin administra capitulos" on public.chapters
  for all using (public.is_admin()) with check (public.is_admin());

create policy "leer paginas" on public.chapter_pages
  for select using (auth.role() = 'authenticated');
create policy "admin administra paginas" on public.chapter_pages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "estudiante ve sus lecturas completadas" on public.reading_completions
  for select using (auth.uid() = student_id);
create policy "estudiante marca su lectura completada" on public.reading_completions
  for insert with check (auth.uid() = student_id);
create policy "docente ve lecturas completadas de su grupo" on public.reading_completions
  for select using (public.teaches_student(student_id));

create or replace function public.complete_reading(_chapter_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into reading_completions (student_id, chapter_id)
  values (auth.uid(), _chapter_id)
  on conflict (student_id, chapter_id) do nothing;
$$;
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
-- Carga el contenido real del capítulo de la unidad "El caos".
-- Seguro de correr una sola vez: si el capítulo ya existe, no hace nada.

do $$
declare
  _unit_id uuid;
  _chapter_id uuid;
begin
  select id into _unit_id from units where title = 'El caos';

  if exists (select 1 from chapters where unit_id = _unit_id and title = 'Capítulos 3 y 4') then
    raise notice 'El capítulo ya existe, no se agrega de nuevo.';
    return;
  end if;

  insert into chapters (unit_id, title, order_index)
  values (_unit_id, 'Capítulos 3 y 4', 1)
  returning id into _chapter_id;

  insert into chapter_pages (chapter_id, page_number, heading, body, image_url) values

  (_chapter_id, 1, 'Capítulo 3',
'Alejandro y su mamá se instalaron en Sausópolis. Juntos, vivían en una casa modesta, en medio del orden y el aseo. Alejandro se fue adaptando a su nueva vida y a su nuevo colegio. Ella, ahora trabajaba en el hospital departamental, donde también se rumoraban los estragos que, a nivel mundial, estaba dejando la picadura de un zancudo. Allí, conoció a Alberto, un médico que recién había llegado de Europa donde consiguió el título de especialista en infectología. Alberto se convirtió en un buen amigo que la ayudaba y la guiaba, además, la cortejaba.

Al chico no le parecía buena idea que su mamá recibiera los galanteos de ese hombre que apareció de repente. Muchas veces, con ademanes de celos rechazaba las atenciones del doctor.

—Nosotros no estamos enfermos, doctor —le dijo Alejandro—. ¿A qué viene?', null),

  (_chapter_id, 2, null,
'—Es por si se enferman, niño —contestó el médico, ajustándose a la condición de un hombre enamorado con buenas intenciones.

—Voy un rato al parque, mamá. Esteban y Mariela están esperándome. Regresaré pronto —dijo Alejandro, dando por terminado el roce para irse a jugar con sus nuevos amigos.

—¿Oye, Alejo... tú y tu papá? —preguntó Mariela cuando Alejandro les contó que un médico estaba cortejando a su mamá.

—¿Mi papá?... ¿Qué con mi papá? —replicó un poco disgustado—. Vive lejos, a muchos kilómetros de aquí. No sé cuándo lo volveré a ver. Él tiene otra esposa.

—¿Otra esposa? ¿O sea que tienes más hermanos? —insistió Mariela.

—No. No tengo hermanos —aseguró Alejandro.

Pasó una semana desde el día en que se hizo la fumigación y en Lozania, todo estaba tranquilo y poco se había vuelto a hablar de los zancudos invasores. Las calles alumbraban con el sol de la tarde y los árboles formaban figuras con sus sombras en el piso. Todo lucía tranquilo, como si nunca hubieran ocurrido las angustias de unos días atrás.

Sin embargo, una mañana, Mario notó que un mosquito lo había picado en la mejilla y se rascó', null),

  (_chapter_id, 3, null, null, '/illustrations/window.png'),

  (_chapter_id, 4, null,
'desesperado, se aplicó una crema que encontró y la picadura se convirtió en irritación con una roncha visible. Frente al espejo, en su reflejo detectó a una zancuda que salió por la ventana en vuelo lento. Decidió seguirla hasta que le perdió el rastro entre unos tarros plásticos abandonados en el patio.

Mario no fue el único. En el vecindario, la gente se rascaba en diferentes partes del cuerpo, sin imaginarse que el transmisor de la enfermedad estaba haciendo su trabajo de vuelta. La ciudad cayó de nuevo, víctima de otra invasión. El Aedes aegypti estaba de regreso.

El primero en darse cuenta fue Manuel, quien no entendía lo que estaba pasando pues él fue muy estricto con la fumigación. Llamó al alcalde y le sugirió realizar nuevas tareas de exterminio e incrementar las jornadas de fumigación, tantas veces como fuera necesario. El mandatario aprobó la proposición de inmediato y los exterminadores se armaron nuevamente con los químicos y los trajes especiales que los cubrían rostro y cuerpo, como un desfile de disfraces.

Fumigaron una y otra vez y a los pocos días reaparecían los zancudos. La historia se repetía con resultados nada satisfactorios y el hospital volvió a estar atiborrado de pacientes. Parecía que los zancudos se multiplicaban por arte de magia. Y lo más grave, como producto de las fumigaciones ya no solo llegaban pacientes con síntomas de las picaduras', null),

  (_chapter_id, 5, null, null, '/illustrations/houses.png'),

  (_chapter_id, 6, null,
'o la enfermedad transmitida, sino con enfermedades pulmonares y afecciones respiratorias que se atribuían a un exceso de los químicos en el ambiente.

Manuel, su esposa y su hijo Mario también se vieron afectados por lo que sería amenaza a la salud de Lozania. Después de que los técnicos exterminadores fueron aplaudidos y alabados por la gente de la ciudad, ahora eran difamados e insultados. Especialmente Manuel, a quien tildaron de irresponsable y mentiroso. Sus compañeros de trabajo le decían al padre que la había engañado con tales fumigaciones.

—¡Tu papá es un farsante! —le dijo uno de los chicos.

—¡Escúchenme! —respondió Mario—. Por la ventana de mi cuarto he visto salir una zancuda de esas, que por cierto he logrado seguir, pero se perdió entre los arbustos. Les propongo que todos les sigamos la pista a esos mosquitos para saber dónde se ocultan y las derrotaremos. ¡No nos echemos culpas y hagamos algo, por favor!

—Ya tu papá actuó y de nada sirvió —le dijeron—, no pudo él, mucho menos nosotros.

—Debemos investigar y llegar al fondo del asunto —insistió Mario con voz más fuerte y optimista, pero sus compañeros lo ignoraron y se marcharon.', null),

  (_chapter_id, 7, 'Capítulo 4',
'Mario regresó a casa desilusionado. Buscó un lugar para pensar y descansar. No quería rendirse ni podía permitir que hablaran así de su papá, así que ideó alternativas para transformar la situación. En el garaje encontró una linterna, unas pinzas, una lupa y una libreta de calendario viejo y armó un pequeño laboratorio donde preparó su plan.

A las 4 y 30 de la mañana, mientras los demás dormían, alistó su equipo de trabajo y con actitud decidida, salió al patio trasero agazapándose entre los arbustos. Esperó, y cuando el sol empezó a brillar, observó cómo varias zancudas salían por las ventanas de las habitaciones y se ocultaban en la alberca y en unos tarros plásticos llenos de agua turbia. Esos depósitos parecían ser sus escondites predilectos.

Tuvo paciencia y tomó apuntes de todo lo que estaba viendo. En su análisis preliminar descubrió', null),

  (_chapter_id, 8, null, null, '/illustrations/magnifier.png'),

  (_chapter_id, 9, null,
'que la alberca era un elemento para tener en cuenta. Entonces, cuando las zancudas se marcharon, se acercó, sacó la lupa y la linterna y observó lo que había en su interior. Notó que las zancudas habían dejado unos huevecillos pegados en las paredes; parecían más de cien por cada una de ellas. Observó también unos diminutos gusanos en el agua, que zigzagueaban en un movimiento constante.

Ya era hora de alistarse para ir a la escuela, estaba tan concentrado que no se percató de la presencia de su mamá.

—Y tú ¿qué haces ahí, Mario? Ven a desayunar, tienes que ir a la escuela.

—¡Mamá! —exclamó el chico emocionado—, creo que encontré de dónde viene la epidemia.

—Ya deja de estar pensando cosas raras.

—No son cosas raras, mamá tiene que saber esto.

—¿Qué te qué, hijo? —preguntó Manuel saliendo de la habitación.

—El desagüe se está enfriando, mi amor —exclamó Ángela.

—Frío estoy yo con las noticias de los muchos casos de la enfermedad que se están presentando en Lozania. No aguanto esta situación y mucho menos que la gente siga hablando mal de mí.', null),

  (_chapter_id, 10, null,
'—No te atormentes así, ven y siéntate a desayunar —insistió Ángela.

—No puedo desayunar ahora, amor. Voy tarde al trabajo.

—Papá, tengo que contarte algo...

—Ahora no tengo tiempo, hijo.

—Papá, estoy investigando sobre las zancudas y he visto cómo han picado unos gusanitos en la alberca.

Manuel se acercó a su hijo y con un gesto cariñoso le revolvió el cabello. —No te preocupes por eso, yo me ocupo. Todas las albercas hay bichos. Me tengo que ir, nos vemos en la tarde.

Mario caminó a la escuela con la idea recurrente de buscar soluciones y le contó a su amigo Nico lo ocurrido. Él lo escuchó en voz baja, tratando de que nadie más se enterara.

—No lo vas a creer Nico, hoy no amanecí en mi cama y descubrí algo.

—Estás loco, Mario, ¿cómo no amaneciste en tu cama?

—Las estuve vigilando. Parecía que estuvieran planeando un ataque agresivo, como si fuera un ejército de guerreros armados, pero en miniatura.

Nico se sorprendió con la confesión.', null),

  (_chapter_id, 11, null,
'—¿Vigilar a quiénes? —le preguntó.

—A las zancudas. Ellas son las causantes de esta epidemia —dijo—. Es necesario hacer algo, no podemos dejarnos vencer. Mi padre es el hazmerreír de la ciudad.

—Pues habla con él —dijo Nico—, pero no me escuchó.

—Mañana al amanecer lo espero en mi casa —exclamó Mario—. Al parecer las zancudas atacan muy temprano. ¿Irás?

—Está bien. Allá nos vemos.

Mario se mostró muy distraído y nervioso durante las clases. Cuando sonó la campana, corrió muy ansioso a su casa.

Esa madrugada, como otras tantas desde hacía un par de semanas en Lozania, el pánico se agudizaba. No se sabía dónde ni a qué hora podría surgir el próximo enfermo. Mientras tanto, Mario aguardaba la hora para salir de su cuarto. Una pequeña piedra lanzada a su ventana rompió el silencio y alertó a Mario sobre la llegada de Nico.

—Calla, Nico —le susurró Mario con una seña de un dedo en sus labios—. Vas a despertar a mis padres.

La mañana era brumosa, pero la valentía les calentó el corazón a los dos niños. Con sigilo, para', null),

  (_chapter_id, 12, null,
'no ser descubiertos, se treparon al ático. De repente, vieron cientos de fantasmales voladores de patas negras con anillos blancos que se esparcían por el aire como si estuvieran celebrando un festival.

Conmocionado por lo que vio, Mario trató de bajar del ático aprisa, pero resbaló y cayó. Nico ahogó un grito e intentó auxiliar a su amigo quien yacía en el suelo inmóvil, pero al ver que el chico no reaccionaba corrió a pedir ayuda. Mario, sin sentido, se sumergió lentamente en un sueño profundo en el que, si se tratara de una escena de ciencia ficción, vio a una indefensa alberca que parecía sacudirse cuando las zancudas se acercaban. Estas ingresaron en su interior por unos minutos y luego se marcharon.

En su sueño, Mario se acercó curioso a la alberca. Al verlo, ella le habló pidiéndole ayuda. El chico aterrorizado intentó correr, pero la alberca lo perseguía.

—¡Mario espera!, te contaré lo que está pasando —le gritó la alberca.

—¿Cómo sabes mi nombre?, ¿cómo sabes hablar?

—No tengas miedo. Escúchame porque tenemos poco tiempo —insistió la alberca—. Debes saber que las zancudas son unos bichos extranjeros que llegaron para atacar tu ciudad. He escuchado sus conversaciones. Ellas se alimentan de sangre humana', null),

  (_chapter_id, 13, null, null, '/illustrations/swarm2.png'),

  (_chapter_id, 14, null,
'y cuando te pican pueden transmitir el virus del dengue. Para reproducirse me necesitan a mí o cualquier otro recipiente con agua. Dejan sus huevos pegados en las paredes, y estos, al hacer contacto con el agua eclosionan, se vuelven larvas, pasan a fase de pupa y en una semana, son nuevos zancudos. De esta manera, ocultan a sus crías en los depósitos y logran sobrevivir.

—¡Ahora lo entiendo todo! —exclamó Mario en su sueño—. Es por eso que, por más que hagan fumigaciones, los mosquitos reaparecen, ¡la higiene es la solución!

—Soy un ser inerte, Mario, no me puedo defender. Si lavas semanalmente con cepillo mis paredes y eliminas de las tapas los objetos inservibles que puedan almacenar agua, ellas no podrán reproducirse —le suplicó la alberca, y agregó—: ¡Tienes que hacer algo para salvar a la ciudad! —Mientras su presencia se desvanecía en la mente delirante del chico.

En el ático, las zancudas al verse descubiertas lanzaron un enjambre y picaron a Mario, inyectando en su cuerpo el peligroso virus. Nico llegó corriendo con sus padres. Alarmados, al ver que Mario no reaccionaba decidieron trasladarlo al hospital.

Después de unos días, sin saber a ciencia cierta lo ocurrido, Mario se encontraba en la unidad de cuidados intensivos pues empezó a sangrar por la nariz, tenía fiebre alta, vómitos, deposiciones con', null),

  (_chapter_id, 15, null,
'sangre y le aparecieron unos puntos morados en el cuerpo. Los médicos y su familia sabían que su vida corría peligro.

Entretanto y para colmo de males, una mañana gris, el jardinero de la escuela, el señor Lucas, fue hallado muerto por causa del virus invasor sin dar tregua a un posible tratamiento. La Secretaría de Salud Municipal reportó de inmediato el primer caso de mortalidad y el Instituto Nacional de Salud Pública no dudó en declarar una cuarentena para la ciudad, pues se estimaba que la epidemia amenazaba con expandirse a las poblaciones aledañas, poniendo en riesgo a más víctimas.', null);
end $$;
