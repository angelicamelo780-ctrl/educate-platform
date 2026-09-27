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
