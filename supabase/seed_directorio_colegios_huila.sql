-- Directorio de colegios del Huila (SINEB + directorio complementario),
-- precargado para que los docentes solo busquen y seleccionen su
-- institución en vez de escribirla a mano. Seguro de correr una sola vez.

do $$
declare
  _m0 uuid;
  _m1 uuid;
  _m2 uuid;
  _m3 uuid;
  _m4 uuid;
  _m5 uuid;
  _m6 uuid;
  _m7 uuid;
  _m8 uuid;
  _m9 uuid;
  _m10 uuid;
  _m11 uuid;
  _m12 uuid;
  _m13 uuid;
  _m14 uuid;
  _m15 uuid;
  _m16 uuid;
  _m17 uuid;
  _m18 uuid;
  _m19 uuid;
  _m20 uuid;
  _m21 uuid;
  _m22 uuid;
  _m23 uuid;
  _m24 uuid;
  _m25 uuid;
  _m26 uuid;
  _m27 uuid;
  _m28 uuid;
  _m29 uuid;
  _m30 uuid;
begin
  if exists (select 1 from instituciones where nombre = 'COLEGIO ADVENTISTA INTERAMERICANO CABI') then
    raise notice 'El directorio de colegios ya está cargado, no se agrega de nuevo.';
    return;
  end if;

  insert into municipios (nombre) values ('ACEVEDO')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m0;
  insert into municipios (nombre) values ('AIPE')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m1;
  insert into municipios (nombre) values ('ALGECIRAS')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m2;
  insert into municipios (nombre) values ('ALTAMIRA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m3;
  insert into municipios (nombre) values ('BARAYA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m4;
  insert into municipios (nombre) values ('CAMPOALEGRE')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m5;
  insert into municipios (nombre) values ('EL AGRADO')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m6;
  insert into municipios (nombre) values ('GARZÓN')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m7;
  insert into municipios (nombre) values ('GIGANTE')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m8;
  insert into municipios (nombre) values ('GUADALUPE')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m9;
  insert into municipios (nombre) values ('HOBO')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m10;
  insert into municipios (nombre) values ('ISNOS')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m11;
  insert into municipios (nombre) values ('LA ARGENTINA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m12;
  insert into municipios (nombre) values ('LA PLATA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m13;
  insert into municipios (nombre) values ('NEIVA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m14;
  insert into municipios (nombre) values ('NÁTAGA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m15;
  insert into municipios (nombre) values ('OPORAPA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m16;
  insert into municipios (nombre) values ('PAICOL')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m17;
  insert into municipios (nombre) values ('PALERMO')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m18;
  insert into municipios (nombre) values ('PITAL')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m19;
  insert into municipios (nombre) values ('PITALITO')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m20;
  insert into municipios (nombre) values ('RIVERA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m21;
  insert into municipios (nombre) values ('SAN AGUSTÍN')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m22;
  insert into municipios (nombre) values ('SANTA MARÍA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m23;
  insert into municipios (nombre) values ('SUAZA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m24;
  insert into municipios (nombre) values ('TARQUI')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m25;
  insert into municipios (nombre) values ('TESALIA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m26;
  insert into municipios (nombre) values ('TIMANÁ')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m27;
  insert into municipios (nombre) values ('VILLAVIEJA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m28;
  insert into municipios (nombre) values ('YAGUARÁ')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m29;
  insert into municipios (nombre) values ('ÍQUIRA')
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into _m30;

  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO ADVENTISTA INTERAMERICANO CABI', 'Cl 14 4 46 A', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO ANGLOCANADIENSE DE NEIVA', 'Cl 15 5 98 A', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO ASPAEN LA FRAGUA', 'Kr 50 50 Sur 107 B', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO ASPAEN YUMANA', 'Kr 55 8 108 Km 4 B', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO CAMPESTRE JUAN PABLO II', 'Vda El Centro', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO CAMPESTRE PADRE ARTURO MISIONEROS DE LA DIVINA REDENCION', 'Cl 42 Sur 31 38 Km 2', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO CLARETIANO', 'Cl 44 1 109', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO CLARETIANO NEIVA', 'Cl 44 1 109', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO COLOMBO INGLES DEL HUILA Y CIA LTDA', 'Cl 19 45 04', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO COLOMBO SUECO', 'Kr 3 12 20', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO COOPERATIVO UTRAHUILCA', 'Kr 4 18 54', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO CRISTIANO LA COSECHA', 'Kr 10 A 3 A 69', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO DE FORMACIÓN SCOUT JOSÉ JULIÁN MARTÍ', 'Cl 20 Sur 33 40', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO DE LA PRESENTACION', 'Kr 7 8 19', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO GIMNASIO HUMANISTICO DEL ALTO MAGDALENA', 'Cl 11 6 37', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO GIMNASIO LEONARDO DA VINCI', 'Kr 9 # 2-35', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO HISPANO INGLES', 'Kr 8 4 48', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO LION HILL SCHOOL', 'Cl 8 100 99', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO MARIA AUXILIADORA ALTICO', 'Kr 12 4 50', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO MILITAR GENERAL JOSE ANTONIO ANZOATEGUI', 'Kr 5 A 19 01', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO PIAGET', 'Kr 47 20 A 50', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO RAFAEL POMBO', 'Kr 8 # 3-24', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO REYNALDO MATIZ', 'Cl 22 5 B 09', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO SABIOS VENCEDORES', 'Cl 20 31 36', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO SALESIANO SAN MEDARDO', 'Kr 15 3 107', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO SAN MIGUEL ARCANGEL', 'Kr 1 39 23', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO SANTA CLARA DE HUNGRIA', 'Kr 46 8 170', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO GIMNASIO MODERNO', 'Cl 15 29 19', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO ANTONIO NARIÑO (AMERICANO)', 'Cl 12 5 36', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO CORPETROL', 'Cl 12 5 73', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO POLITECNICO DE LAS AMERICAS', 'Cl 6 4 36', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO TOMAS CIPRIANO DE MOSQUERA', 'Kr 5 8 37', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO UNAD NEIVA', 'Kr 15 8 06', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO EMPRESARIAL DE LOS ANDES', 'Kr 31 18 A 50', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO MONTESSORI', 'Kr 10 7 40', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'COLEGIO NUEVA GRANADA', 'Kr 14 8 17', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'COLEGIO ANDAKI', 'Kr 3 Cl 8', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'COLEGIO ATENEO AUTONOMO DE COLOMBIA', 'Kr 3 Cl 9', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'COLEGIO POLICARPA SALAVARRIETA', 'Cl 4 3 70', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'COLEGIO Bateas', 'Vda Bateas', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'COLEGIO ADVENTISTA DE ALGECIRAS', 'Kr 7 2 08', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m5, 'COLEGIO ATENEO AUTONOMO DE COLOMBIA', 'Cl 17 9 44', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m5, 'COLEGIO HUMANISTICO SAVATER', 'Cl 29 6 44', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m5, 'COLEGIO CRISTIANO EMANUEL', 'Kr 7 22 33', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m5, 'COLEGIO GIMNASIO NUEVA COLOMBIA', 'Kr 10 16 27', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m5, 'COLEGIO GENIOS HUILENSES', 'Kr 5 19 21', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m5, 'COLEGIO NUEVA COLOMBIA', 'Kr 10 16 27', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO CAMPESTRE PEDRO MARIA RAMIREZ RAMOS', 'Kr 4 E 92 00', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO COOP LA PRESENTACION', 'Cl 3 5 111', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO GIMNASIO MINUTO DE DIOS', 'Cl 2 D 4 A 29', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO JOSE CELESTINO MUTIS', 'Cl 6 5 105', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO AMERICAN LANGUAGE SCHOOL', 'Cl 6 5 47', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO COLOMBO INGLES', 'Cl 6 10 40', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO JUAN SABALO', 'Cl 5 5 81', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m7, 'COLEGIO MINUTO DE DIOS', 'Cl 2 d 4 a 29', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'COLEGIO COOPERATIVO LUIS CARLOS GALAN SARMIENTO', 'Cl 3 7 57', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'COLEGIO GIMNASIO MODERNO', 'Cl 4 6 58', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'COLEGIO NUESTRA SEÑORA DE BELEN', 'Kr 5 Cl 3', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m9, 'COLEGIO NUESTRA SEÑORA DE GUADALUPE', 'Cl 5 4 20', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'COLEGIO NUESTRA SEÑORA DE LAS MERCEDES', 'Cl 4 5 12', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'COLEGIO SAN ISIDRO', 'Vda San Isidro', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'COLEGIO COOPERATIVO LA PLATA', 'Kr 4 6 25', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'COLEGIO GIMNASIO CAMPESTRE', 'Cl 2 10 15', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'COLEGIO SAN CARLOS', 'Kr 5 4 30', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m16, 'COLEGIO NUESTRA SEÑORA DEL CARMEN', 'Cl 4 3 20', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m18, 'COLEGIO CAMPESTRE LA SABANA', 'Km 3 Vía Palermo', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m18, 'COLEGIO NUESTRA SEÑORA DEL CARMEN', 'Cl 5 6 12', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m19, 'COLEGIO NUESTRA SEÑORA DE FÁTIMA', 'Cl 3 4 15', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m20, 'COLEGIO ANDINO', 'Cl 4 5 22', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m20, 'COLEGIO GIMNASIO CAMPESTRE', 'Km 2 Vía San Agustín', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m20, 'COLEGIO LA PRESENTACION', 'Kr 4 6 50', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m20, 'COLEGIO NACIONAL PITALITO', 'Cl 3 4 10', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m21, 'COLEGIO CAMPESTRE GIMNASIO DE LOS ANDES', 'Km 4 Vía Rivera', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m21, 'COLEGIO INTEGRAL DE RIVERA', 'Cl 4 5 18', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m22, 'COLEGIO NUESTRA SEÑORA DE LOURDES', 'Cl 4 3 15', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m22, 'COLEGIO SAN AGUSTÍN', 'Kr 5 4 10', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'COLEGIO NUESTRA SEÑORA DE GUADALUPE', 'Cl 4 3 10', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'COLEGIO SUAZA', 'Kr 5 4 20', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m25, 'COLEGIO NUESTRA SEÑORA DE LAS MERCEDES', 'Cl 4 3 12', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m25, 'COLEGIO TARQUI', 'Kr 5 4 15', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'COLEGIO NUESTRA SEÑORA DE FÁTIMA', 'Cl 4 3 10', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'COLEGIO TIMANÁ', 'Kr 5 4 18', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m30, 'INSTITUCION EDUCATIVA MARIA AUXILIADORA', 'KR 9 # 6-30', '3112102667');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m30, 'INSTITUCION EDUCATIVA SAN LUIS', 'INSP SAN LUIS', '3133936972');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m30, 'INSTITUCION EDUCATIVA VALENCIA DE LA PAZ', 'INSP VALENCIA DE LA PAZ', '3116565081');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA BELEN', 'VDA BELEN', '3168029577');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA BORDONES', 'VDA BORDONES', '3224339375');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA JOSE EUSTACIO RIVERA', 'CARRERA 3 N° 8 - 151', '3124328670');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA MONDEYAL', 'VDA MONDEYAL', '3112184061');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA MORTIÑO', 'VDA MORTIÑO', '3115213918');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA SALEN', 'VDA SALEN', '3132116290');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m11, 'INSTITUCION EDUCATIVA SAN VICENTE', 'VDA SAN VICENTE', '3204773481');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m12, 'CENTRO EDUCATIVO NAMUI NU MAI', 'VDA BUENOS AIRES', '3204992959');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m12, 'INSTITUCION EDUCATIVA BETANIA', 'VDA BETANIA', '8311717');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m12, 'INSTITUCION EDUCATIVA EL PENSIL', 'VDA EL PENSIL', '3203445284');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m12, 'INSTITUCION EDUCATIVA EL PESCADOR', 'VDA EL PESCADOR', '3116083844');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m12, 'INSTITUCION EDUCATIVA ELISA BORRERO DE PASTRANA', 'CL 5 1 48', '8311734');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m22, 'INSTITUCION EDUCATIVA PRADERA', 'VDA PRADERA', '8373205');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m22, 'INSTITUCION EDUCATIVA PUERTO QUINCHANA', 'VDA PUERTO QUINCHANA', '3138183296');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m22, 'INSTITUCION ETNOEDUCATIVA YACHAY WASI RUNA YANAKUNA', 'VDA NUEVA ZELANDA', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m23, 'INSTITUCION EDUCATIVA EL CISNE', 'VDA EL CISNE', '3228636517');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m23, 'INSTITUCION EDUCATIVA LAS JUNTAS', 'VDA LAS JUNTAS', '3142318715');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m23, 'INSTITUCION EDUCATIVA SAN JOAQUIN', 'VDA SAN JOAQUIN', '3204138205');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m23, 'INSTITUCION EDUCATIVA SANTA JUANA DE ARCO', 'KR 3 # 10-14', '3213433529');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA ALTO HORIZONTE', 'VDA ALTO HORIZONTE', '3208591703');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA BRASIL', 'VDA EL BRASIL', '3144778329');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA GALLARDO', 'VDA GALLARDO', '3184647924');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA GUAYABAL', 'VDA GUAYABAL', '3202521848');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA LA UNION', 'VDA LA UNION', '8324375');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA SAN CALIXTO', 'VDA SAN CALIXTO', '3125264514');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m24, 'INSTITUCION EDUCATIVA SAN LORENZO', 'CL 8 # 3-68', '3212421933');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m25, 'INSTITUCION EDUCATIVA EL VERGEL', 'CEN POBL EL VERGEL', '3223173767');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA JOSE MIGUEL MONTALVO', 'CL 4 NRO 15 25', '8325037');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA ESCUELA NORMAL SUPERIOR', 'VDA LA GUANDINOSA', '3125929223');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA ISMAEL PERDOMO BORRERO', 'KR 7 1 11', '8326454');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA JORGE ELIECER GAITAN', 'INSP POTRERILLOS', '3213946127');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA JORGE VILLAMIL ORTEGA', 'VDA BAJO COROZAL', '3134614470');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA NICOLAS MANRIQUE', 'VDA CACHAYA', '3163002720');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA SILVANIA', 'CORREG SILVANIA', '8337513');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m8, 'INSTITUCION EDUCATIVA SOSIMO SUAREZ', 'KR 6 12 15', '3214682419');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m9, 'INSTITUCION EDUCATIVA LA PLANTA', 'VDA LA PLANTA', '3204677066');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m9, 'INSTITUCION EDUCATIVA MARIA AUXILIADORA', 'AV CERVANTES 1 65', '8321102');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m9, 'INSTITUCION EDUCATIVA NUESTRA SEÑORA DEL CARMEN', 'VDA MIRAFLORES', '3208410382');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m10, 'INSTITUCION EDUCATIVA ROBERTO', 'KR 2 CL 5', '3023597575');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m1, 'INSTITUCION EDUCATIVA AGROPECUARIA DE AIPE', 'VDA PRAGA', '3102590689');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m1, 'INSTITUCION EDUCATIVA JESUS MARIA AGUIRRE CHARRY', 'CL. 5 # 8 402', '3143085223');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m1, 'INSTITUCION EDUCATIVA LA CEJA MESITAS', 'VDA MESITAS', '3137015085');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m1, 'INSTITUCION EDUCATIVA SANTA RITA', 'VDA SANTA RITA', '3127678146');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'INSTITUCION EDUCATIVA EL PARAISO', 'CARRERA 52A N. 21-28', '3167435372');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'INSTITUCION EDUCATIVA JUAN XXIII', 'KR 5 # 5-53', '8382087');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'INSTITUCION EDUCATIVA LA ARCADIA', 'INSP LA ARCADIA', '3133963698');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'INSTITUCION EDUCATIVA LA PERDIZ', 'VDA LA PERDIZ', '3125688965');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'INSTITUCION EDUCATIVA LOS NEGROS', 'VDA EL KIOSCO', '3134670693');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m2, 'INSTITUCION EDUCATIVA QUEBRADON SUR', 'VDA QUEBRADON SUR', '3202147004');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m3, 'INSTITUCION EDUCATIVA DIVINO SALVADOR', 'CL 6 # 3-49', '3134080439');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m4, 'CENTRO EDUCATIVO LA UNION', 'VDA LA UNION', '3118086140');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m4, 'INSTITUCION EDUCATIVA ANTONIO BARAYA', 'KM 1 VIA LA ESPINALOZA', '8788523');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m4, 'INSTITUCION EDUCATIVA JOAQUIN', 'VDA PATIA', '3124931809');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA BATEAS', 'VDA BATEAS', '3123058007');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA JOSE ACEVEDO Y GOMEZ', 'JOSE ACEVEDO Y GOMEZ', '8317055');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA LA VICTORIA', 'VDA LA VICTORIA', '3112031272');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA MARTICAS', 'VDA MARTICAS', '3134044639');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA SAN ADOLFO', 'INSP SAN ADOLFO', '3212362850');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA SAN ISIDRO', 'VDA SAN ISIDRO', '3172640262');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA SAN JOSE DE LLANITOS', 'VDA SAN JOSE DE LLANITOS', '3123920634');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA SAN JOSE DE RIECITO', 'VDA SAN JOSE DE RIECITO', '3176864701');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m0, 'INSTITUCION EDUCATIVA SAN MARCOS', 'VDA SAN MARCOS', '3134539188');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m6, 'INSTITUCION EDUCATIVA EL CARMEN', 'VDA EL CARMEN', '3133948586');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m6, 'INSTITUCION EDUCATIVA LA MERCED', 'SALIDA VIA A GARZON', '3208035068');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m6, 'INSTITUCION EDUCATIVA MONTESITOS', 'VDA MONTESITOS', '3134967626');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA AGUSTIN CODAZZI', 'KR 18 12 11 SUR', '3123531780');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA AIPECITO', 'VDA AIPECITO', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA ANGEL MARIA PAREDES', 'CL 9 14 18', '8716024');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA ATANASIO GIRARDOT', 'IND KR 32 18 90', '8675990');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA CEINAR', 'CL 14 1 50', '8714461');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA CHAPINERO', 'CORREGIMIENTO CHAPINERO', '3112379291');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA CLARETIANO GUSTAVO TORRES PARRA', 'CL 55 31 151', '3142749360');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA DEPARTAMENTAL TIERRA DE PROMISIÓN', 'CL 21 1 E BIS 40', '8756507');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA EDUARDO SANTOS', 'CL 80 C 4 61', '8662848');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA EL CAGUAN', 'CALLE 2 NO 4-63', '8686192');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA EL LIMONAR', 'KR 37 SUR 19 21', '8734911');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA ESCUELA NORMAL SUPERIOR', 'CL 8 NO. 36-20', '8778744');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA GABRIEL GARCIA MARQUEZ', 'CL 86 # 7-28', '3165560385');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA HUMBERTO TAFUR CHARRY', 'KR 50 C 18 34', '8771346');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA INEM JULIAN MOTTA SALAS', 'KR 1 26 A 01', '8752468');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA JAIRO MORERA LIZCANO', 'CL 1 A 28 82', '8734855');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA JAIRO MOSQUERA MORENO', 'GUACIRCO', '3167405867');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA JOSE EUSTACIO RIVERA', 'KR 32 15 50', '8777567');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA JUAN DE CABRERA', 'KR 21 1 C 80', '8667966');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA LICEO DE SANTA LIBRADA', 'KR 1 26 345', '8741840');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA LUIS IGNACIO ANDRADE', 'CL 35 6 104', '8753990');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m14, 'INSTITUCION EDUCATIVA MARIA AUXILIADORA FORTALECILLAS', 'CORREG. FORTALECILLAS', '8686876');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA SEGOVIANAS', 'VDA SEGOVIANAS', '3153911183');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA TECNICO AGRICOLA', 'KM 1 VIA POPAYAN', '3144879850');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA VILLA DE LOS ANDES', 'INSP BELEN', '3208535141');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA VILLALOSADA', 'CENTRO POBLADO VILLALOSADA', '3133979409');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA YUUCX PISHAU', 'INSP SANTA LETICIA', '3108014752');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m15, 'INSTITUCION EDUCATIVA LAS MERCEDES', 'CL3 KR 6', '3168246580');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m15, 'INSTITUCION EDUCATIVA LOS LAURELES', 'VDA LAURELES', '3134044639');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m15, 'INSTITUCION EDUCATIVA MARIA MANDIGUAGUA', 'VDA LLANOBUCO', '3208283037');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m15, 'INSTITUCION EDUCATIVA PATIO BONITO', 'VDA PATIO BONITO', '3138019037');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m16, 'INSTITUCION EDUCATIVA EL CARMEN', 'INSP EL CARMEN', '3123935108');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m16, 'INSTITUCION EDUCATIVA SAN ROQUE', 'INSP SAN ROQUE', '3118623334');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m16, 'INSTITUCION EDUCATIVA SAN JOSE', 'CL 7 # 9A-34', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m17, 'INSTITUCION EDUCATIVA LUIS EDGAR DURAN RAMIREZ', 'SALIDA VIA A NEIVA', '3206783743');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m18, 'INSTITUCION EDUCATIVA EL JUNCAL', 'INSP EL JUNCAL', '3158017390');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m18, 'INSTITUCION EDUCATIVA JOSE REINEL CERQUERA', 'CR 8 # 43 - 32', '3114779793');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m12, 'INSTITUCION EDUCATIVA LAS TOLDAS', 'VDA LAS TOLDAS', '3203009505');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA CANSARROCINES', 'VDA CANSARROCINES', '3214959490');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA CAMPESTRE SAN JOSE', 'VDA EL SALADO', '3204922151');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA EL CARMELO', 'VDA CARMELO', '3504341161');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA GALLEGO', 'INSP GALLEGO', '3214085648');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA LAS ACACIAS', 'VDA LAS ACACIAS', '3172640262');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA LUIS CARLOS TRUJILLO POLANCO', 'KR 8 # 7-19', '8372884');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA MARILLAC', 'CL 3 4 67', '3112799059');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA MISAEL PASTRANA BORRERO', 'KR 4 CL 3', '8370687');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA MONSERRATE', 'INSP MONSERRATE', '3159275734');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA SAN MIGUEL', 'VDA SAN MIGUEL', '3184610202');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA SAN SEBASTIAN', 'KR 8 4 51', '3182064726');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m13, 'INSTITUCION EDUCATIVA SAN VICENTE', 'INSP SAN VICENTE', null);
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m26, 'INSTITUCION EDUCATIVA EL ROSARIO', 'CL 4 # 3-25', '3186772368');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m26, 'INSTITUCION EDUCATIVA OTONIEL ROJAS CORREA', 'CALLE 9 # 6-31', '3118803864');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m26, 'INSTITUCION EDUCATIVA PACARNI', 'KR 5 # 7-53', '3152662037');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'INSTITUCION EDUCATIVA CASCAJAL', 'VDA CASCAJAL', '3144629657');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'INSTITUCION EDUCATIVA COSANZA', 'INSP COSANZA', '3204489697');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'INSTITUCION EDUCATIVA EL TEJAR', 'VDA EL TEJAR', '3187955949');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'INSTITUCION EDUCATIVA LA GAITANA', 'CL 2 # 2-80', '3178289274');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'INSTITUCION EDUCATIVA NARANJAL', 'INSP NARANJAL', '8375746');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m27, 'INSTITUCION EDUCATIVA PANTANOS', 'VDA PANTANOS', '3204567989');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m28, 'CENTRO EDUCATIVO POLONIA', 'VDA POLONIA', '8777741');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m28, 'INSTITUCION EDUCATIVA GABRIEL PLAZAS', 'CL 3 # 2-74', '3235998555');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m28, 'INSTITUCION EDUCATIVA LA VICTORIA', 'INSP LA VICTORIA', '3106134077');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m28, 'INSTITUCION EDUCATIVA SAN ALFONSO', 'INSP SAN ALFONSO', '3124525948');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m29, 'INSTITUCION EDUCATIVA AMELIA PERDOMO DE GARCIA', 'KR 8 2 40', '3134212934');
  insert into instituciones (municipio_id, nombre, direccion, telefono) values (_m29, 'INSTITUCION EDUCATIVA ANA ELISA CUENCA', 'CALLE 3 N° 9-180', '3132072524');
end $$;
