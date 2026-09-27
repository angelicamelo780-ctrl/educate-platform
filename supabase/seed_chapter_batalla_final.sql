-- Carga el contenido real del capítulo de la unidad "La batalla final"
-- (capítulos 5 y 6 del libro). Seguro de correr una sola vez: si el
-- capítulo ya existe, no hace nada.

do $$
declare
  _unit_id uuid;
  _chapter_id uuid;
begin
  select id into _unit_id from units where title = 'La batalla final';

  if _unit_id is null then
    raise exception 'No se encontró la unidad "La batalla final".';
  end if;

  if exists (select 1 from chapters where unit_id = _unit_id and title = 'Capítulos 5 y 6') then
    raise notice 'El capítulo ya existe, no se agrega de nuevo.';
    return;
  end if;

  insert into chapters (unit_id, title, order_index)
  values (_unit_id, 'Capítulos 5 y 6', 1)
  returning id into _chapter_id;

  insert into chapter_pages (chapter_id, page_number, heading, body, image_url) values

  (_chapter_id, 1, 'Capítulo 5',
'Lozanía era caos y tristeza. Nico escuchó en la radio que el gobierno central había declarado la alerta roja y ordenaba a las autoridades el bloqueo de la ciudad donde se había presentado la primera muerte. Así que, los soldados vigilaban todas las entradas y salidas con la orden estricta de impedir que alguien las cruzara. Un noticiero de televisión nacional transmitió la noticia.

Sin saber si Alejandro, el hermano de Mario, estaba enterado, Nico decidió llamarlo y contarle lo sucedido.

—¡Alejo! —dijo Nico angustiado—. No sé si tu papá te lo contó, pero Mario está hospitalizado.

—No sabía nada —respondió sorprendido—. ¿Cómo está mi hermano?

—Bastante mal, lleva varios días en cuidados intensivos y cada vez está peor. Los médicos están muy preocupados porque no ven mejoría.', null),

  (_chapter_id, 2, null, null, '/illustrations/cap56-llamada.jpg'),

  (_chapter_id, 3, null,
'Alejandro se quedó mudo al imaginar a su hermano internado en el hospital y recordó la carta que este le había entregado en su despedida. En un cajón, reconoció el papel escrito por su hermano y por fin lo leyó, aterrado por la idea de su posible muerte.

En letras retorcidas, propias de un niño de su edad, decía: "Discúlpame hermanito, te amo". Un dibujo en el que un hombre y sus dos hijos se abrazan y disfrutan de una tarde de paseo, decoraba el papel. Alejandro no pudo evitar el llanto.

Afanosamente, reunió a su mamá y al doctor Alberto, les narró lo sucedido y los convenció de viajar a Lozanía para ayudar a salvar a su hermano. Ellos sabían que no podrían ingresar fácilmente a la ciudad militarizada, así que prepararon una tienda de campaña con equipaje liviano.

Sausópolis y Lozanía eran ciudades de la misma región, separadas por unos 150 kilómetros de distancia. En la entrada de Lozanía, había un control militar que los detuvo y pidió su documentación.

—Ustedes no pueden ingresar a la ciudad —advirtió un soldado—, está estrictamente prohibido el paso hasta que se vaya la peste y la zona esté asegurada.

—¿La peste? —preguntó Liliana.

—Yo soy médico —explicó Alberto—, y esta no es una peste, es una epidemia de dengue, un virus transmitido por los zancudos y si lo tratamos correctamente, podremos salvar muchas vidas.

—Debo cumplir las órdenes, doctor —contestó el militar con tono autoritario—. Por favor, les pido que se retiren inmediatamente.

Sin darse por vencidos, acamparon a un kilómetro del límite de la ciudad. Los militares pusieron los ojos sobre ellos y patrullaban minuciosamente la zona siguiendo sus movimientos. Serían las 3 de la mañana cuando Alberto, Liliana y Alejandro abandonaron la carpa con el plan de ingresar clandestinamente a la ciudad.

En una carrera frenética, se dirigieron allí entre la maleza. Algunos muros en abandono sirvieron de escudo para no ser sorprendidos. En el hospital, las sirenas y las luces de las ambulancias permanecían encendidas y la gente corría de un lado a otro sin percatarse de los tres fugitivos que habían violado las normas de la cuarentena y se exponían a una detención policial por varios días.

Una bodega en donde se almacenaban uniformes y elementos de salud, cerca del hospital, permanecía abierta para atender cualquier urgencia. Alberto, haciendo uso de su título médico, entró con propiedad y solicitó prendas de quirófano para él y para Liliana.

Usando los atuendos médicos, los tres ingresaron por la puerta trasera del hospital y en la sala de urgencias se cruzaron con Manuel. Él se sorprendió al ver a Liliana tomada de la mano con otro hombre y a Alejandro detrás de ellos.

—¿Cómo llegaron ustedes aquí? —preguntó Manuel.

—Eso te lo contaremos después —respondió Liliana—, te presento a Alberto. Él es un médico infectólogo y quiere ayudar a salvar a Mario.

—¿Infectólogo? —preguntó Manuel, extendiéndole la mano para saludarlo.

El doctor Alberto mostró a los directivos del hospital sus credenciales como experto en el tratamiento de enfermedades tropicales e infectología. Él ofreció hacerse cargo de algunos pacientes y orientar al grupo médico sobre los protocolos pertinentes para casos como estos. Pidió analgésicos y sueros para aplicar por vía endovenosa con el fin contrarrestar la deshidratación, la fiebre, los vómitos o cualquier otro síntoma de alarma.

Les explicó a todos que la enfermedad era producida por el virus del dengue, que no era contagioso al contacto humano, pero que las personas se enfermaban después de haber sido picadas por un zancudo infectado. También, resaltó la importancia de no automedicarse pues al parecer, Lucas, el jardinero, nunca asistió al médico y esto hizo que su condición se agravara y él muriera.', null),

  (_chapter_id, 4, null, null, '/illustrations/cap56-selva.jpg'),

  (_chapter_id, 5, null,
'Lo primero que hizo el doctor Alberto fue estabilizar a Mario quien, conectado a los equipos médicos, deliraba que una alberca era su amiga. De repente, Mario movió su cabeza y abrió los ojos sin saber lo que había sucedido. Vio su sangre en las sábanas, reconoció las paredes del hospital y también a sus seres queridos que lo rodeaban. Se fijó en su hermano Alejandro, quien sujetaba su mano cabizbajo. Mario emocionado le sonrió y trató de abrazarlo.

—Perdóname —le dijo con voz débil—, ¡perdóname por favor!

—Ahora, todo está bien —exclamó Alejandro—. Todo pasará, ya lo verás.

El niño, miró a Manuel e intentó contarle la visión que había tenido con la alberca, pero este lo interrumpió.

—No te preocupes, hijo, fue solo un sueño.

—Pero todo es cierto, papá. Lo he investigado y, aunque también creo que lo soñé, debemos hacer caso a lo que me dijo la alberca.

Los presentes se miraron entre sí y sonrieron compasivos ante el entusiasmo de Mario, creyendo que, efectivamente, se trataba de una alucinación.

—No pienses más en eso, hijo. Descansa —le susurró Ángela.

Cuando Mario se sintió mejor, Alejandro les pidió a todos que le permitieran un momento a solas con su hermano.

—Cuéntame lo que viste en el sueño, ¿qué es eso de una alberca que habla? —le preguntó Alejandro.

—No fue un sueño, o mejor dicho sí fue un sueño, pero yo creo que todo es verdad. Tú sí me vas a creer, ¿cierto?', null),

  (_chapter_id, 6, 'Capítulo 6',
'Manuel, en su labor de inspector de sanidad, se llenó de alivio al ver que Alberto y el personal médico habían controlado la situación y los pacientes reaccionaban de manera favorable. Entusiasmado, se despidió del hospital para ir a coordinar personalmente una nueva fumigación fulminante, pues los zancudos seguían volando por todas partes y había que derrotarlos ¡de una vez por todas!

En el despacho municipal, el alcalde le preguntó:
—¿Acaso le faltan pruebas para darse cuenta de que sus tales químicos no sirvieron? Esta es una tragedia de la que todo el país está hablando.

—Cambiaremos de químico, dijo Manuel—. Utilizaremos uno de mayor toxicidad.

—¿Y eso nos garantiza la solución? —respondió el alcalde esperanzado.

—¡Mientras más tóxico, más efectivo! —dijo Manuel con vehemencia—. Déjeme intentarlo señor alcalde, tengo un compromiso con usted, pero sobre todo con la gente de la ciudad. Mi propio hijo fue una de las víctimas.

Entonces, el alcalde angustiado, aprobó la fumigación.

La misma mañana que Mario narró su sueño, Alejandro organizó un plan siguiendo paso a paso las instrucciones de su hermano. Se encontró con Nico y le pidió ayuda para reunir a la mayor cantidad de los niños del puerto: amigos, no amigos, conocidos, desconocidos; todos los que quisieran participar en un juego de valientes.

Al comienzo, los niños se mostraron desconfiados, pero fue tal la fuerza de las palabras de Alejandro y Nico, que acabaron convenciéndolos. Se reunieron en la plaza principal y todos escucharon atentos el plan del exterminio. De común acuerdo, se comprometieron a lavar y tapar las albercas, y a limpiar sus patios y sus casas para evitar aguas estancadas en recipientes viejos.

Llegó la hora cero. El día anterior a la fumigación los niños lavaron con cepillo y jabón los tanques de reserva de agua y las albercas, luego los taparon. Pusieron las botellas y los tarros reutilizables boca abajo, vaciaron el agua de las llantas viejas y las pusieron bajo techo, botaron los plásticos inservibles y recogieron cualquier recipiente que pudiera acumular agua lluvia. El plan del exterminio consistía en que cuando las zancudas buscaran un lugar para poner sus huevos, ya no tendrían dónde hacerlo.', null),

  (_chapter_id, 7, null, null, '/illustrations/cap56-pueblo.jpg'),

  (_chapter_id, 8, null,
'Y, así ocurrió. Las zancudas llegaron campantes a poner sus huevos, pero ¡oh sorpresa! no encontraron un lugar apropiado para hacerlo. Aturdidas, volaban descontroladas y chocaban unas con otras mientras se escuchaban retumbantes las máquinas de fumigación. Los niños cumplieron con su plan de limpieza y los exterminadores expertos fumigaron con destreza. Las zancudas, vencidas al fin, cayeron al piso asfixiadas.

Una semana después de la fumigación, Manuel se despertó, abrió la ventana y esperó ver los enjambres de zancudos que, a diario, rondaban la ciudad. Pero encontró un panorama muy distinto. El cielo azul presagiaba un gran verano con pleno sol, algunos niños jugaban en la playa y otros iban saludables a la escuela. La calma estaba regresando a la ciudad, nadie más había vuelto a enfermar por el virus, y Mario, al igual que los demás pacientes del hospital, se recuperó satisfactoriamente.

El Instituto Nacional de Salud Pública decretó el final de la cuarentena. Esa misma tarde Manuel recibió una llamada del alcalde con la intención de verlo para agradecerle y felicitarlo personalmente.', null),

  (_chapter_id, 9, null,
'Entretanto, él y su esposa Ángela se preguntaban cómo los químicos derrotaron a los invasores tan rápido pues desconocían la hazaña secreta que habían realizado los niños del pueblo. ¿Serían las oraciones del sacerdote? ¿Sería la llegada del verano? ¿Sería un golpe de suerte? ¿Sería simple coincidencia? ¿Sería un hecho sobrenatural?

Lozanía estaba de gala. Al llegar al despacho del alcalde, Manuel se sorprendió con todo lo que habían preparado. No era una simple felicitación: era un acto público de reconocimiento a su labor. Manuel fue ascendido como director de la unidad sanitaria y premiado con la medalla al mérito. Al doctor Alberto, le entregaron el escudo de la ciudad y le ofrecieron el cargo de director general del hospital.

En tanto que, Alejandro, Mario, Nico y sus amigos, quienes estaban entre el público, celebraron de felicidad. Entonces, decidieron subir a la improvisada tarima y tomar posesión de los micrófonos:
—¡CONTAREMOS LA VERDAD! —gritaron con energía.

Los pobladores, con gran expectativa, escucharon con atención la historia de los niños, quienes explicaron cómo ejecutaron su plan y cómo a través de la higiene salvaron la situación. Todos se levantaron de sus sillas colmados de sonrisas y aplausos de agradecimiento.

Mario, sacó de su bolsillo una hoja de papel y se la enseñó a Alejandro.', null),

  (_chapter_id, 10, null,
'—¿Quieres cumplir nuestro sueño de ser cantantes? —le dijo. Su hermano sonrió. Era una canción que Mario escribió basado en su investigación sobre el zancudo Aedes aegypti.

Y así como los micrófonos revelaron con gran euforia la historia de lo sucedido, un maestro de ceremonias anunció:

—Señoras y señores... todos de pie, vamos a celebrar con los ANTIAEDES DEL REGUETÓN y su éxito EL ZANCUDO INVASOR.

Y sin más espera, los chicos interpretaron con gran talento su canción. Mario cumplió su sueño de ser cantante al lado de su hermano y la tranquilidad en el puerto los unió en un interminable abrazo, el cual, presagiaba la unión de dos familias de padres separados.

Desde entonces, en Lozanía cada año se celebran sus festividades con un reinado en honor a la higiene.

FIN', null);
end $$;
