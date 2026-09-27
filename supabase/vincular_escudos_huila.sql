-- Vincula los escudos (que subiste manualmente al bucket "instituciones-logos")
-- a cada municipio, e inserta los 6 municipios del Huila que el directorio de
-- colegios no traía (Colombia, Tello, Teruel, Elías, Palestina, Saladoblanco).
--
-- ANTES DE CORRER ESTO:
-- 1. Descomprime escudos-huila.zip (37 archivos .png).
-- 2. En Supabase: Storage → bucket "instituciones-logos" → sube los 37 archivos
--    tal cual (no cambies los nombres, ya vienen en minúsculas sin tildes:
--    neiva.png, aipe.png, san-agustin.png, etc.).
-- 3. Reemplaza _base_url abajo por la URL pública de tu proyecto. La
--    encuentras así: en Storage, abre cualquier archivo del bucket → "..."→
--    "Copiar URL", y quita el nombre del archivo del final (deja el "/" antes
--    de donde iría el nombre). Debe verse algo como:
--    https://xxxxxxxx.supabase.co/storage/v1/object/public/instituciones-logos/

do $$
declare
  _base_url text := 'https://hmluutnudmxpkbgvsalz.supabase.co/storage/v1/object/public/instituciones-logos/';
begin
  -- Municipios que ya existían (del directorio de colegios) — solo se les
  -- agrega el escudo.
  update municipios set escudo_url = _base_url || 'neiva.png' where nombre = 'NEIVA';
  update municipios set escudo_url = _base_url || 'aipe.png' where nombre = 'AIPE';
  update municipios set escudo_url = _base_url || 'algeciras.png' where nombre = 'ALGECIRAS';
  update municipios set escudo_url = _base_url || 'baraya.png' where nombre = 'BARAYA';
  update municipios set escudo_url = _base_url || 'campoalegre.png' where nombre = 'CAMPOALEGRE';
  update municipios set escudo_url = _base_url || 'hobo.png' where nombre = 'HOBO';
  update municipios set escudo_url = _base_url || 'iquira.png' where nombre = 'ÍQUIRA';
  update municipios set escudo_url = _base_url || 'palermo.png' where nombre = 'PALERMO';
  update municipios set escudo_url = _base_url || 'rivera.png' where nombre = 'RIVERA';
  update municipios set escudo_url = _base_url || 'santa-maria.png' where nombre = 'SANTA MARÍA';
  update municipios set escudo_url = _base_url || 'villavieja.png' where nombre = 'VILLAVIEJA';
  update municipios set escudo_url = _base_url || 'yaguara.png' where nombre = 'YAGUARÁ';
  update municipios set escudo_url = _base_url || 'garzon.png' where nombre = 'GARZÓN';
  update municipios set escudo_url = _base_url || 'agrado.png' where nombre = 'EL AGRADO';
  update municipios set escudo_url = _base_url || 'altamira.png' where nombre = 'ALTAMIRA';
  update municipios set escudo_url = _base_url || 'gigante.png' where nombre = 'GIGANTE';
  update municipios set escudo_url = _base_url || 'guadalupe.png' where nombre = 'GUADALUPE';
  update municipios set escudo_url = _base_url || 'el-pital.png' where nombre = 'PITAL';
  update municipios set escudo_url = _base_url || 'suaza.png' where nombre = 'SUAZA';
  update municipios set escudo_url = _base_url || 'tarqui.png' where nombre = 'TARQUI';
  update municipios set escudo_url = _base_url || 'la-plata.png' where nombre = 'LA PLATA';
  update municipios set escudo_url = _base_url || 'la-argentina.png' where nombre = 'LA ARGENTINA';
  update municipios set escudo_url = _base_url || 'nataga.png' where nombre = 'NÁTAGA';
  update municipios set escudo_url = _base_url || 'paicol.png' where nombre = 'PAICOL';
  update municipios set escudo_url = _base_url || 'tesalia.png' where nombre = 'TESALIA';
  update municipios set escudo_url = _base_url || 'pitalito.png' where nombre = 'PITALITO';
  update municipios set escudo_url = _base_url || 'acevedo.png' where nombre = 'ACEVEDO';
  update municipios set escudo_url = _base_url || 'isnos.png' where nombre = 'ISNOS';
  update municipios set escudo_url = _base_url || 'oporapa.png' where nombre = 'OPORAPA';
  update municipios set escudo_url = _base_url || 'san-agustin.png' where nombre = 'SAN AGUSTÍN';
  update municipios set escudo_url = _base_url || 'timana.png' where nombre = 'TIMANÁ';

  -- Municipios del Huila que no tenían colegios en el directorio anterior,
  -- pero sí existen y ya tienen su escudo listo.
  insert into municipios (nombre, escudo_url) values
    ('COLOMBIA', _base_url || 'colombia.png'),
    ('TELLO', _base_url || 'tello.png'),
    ('TERUEL', _base_url || 'teruel.png'),
    ('ELÍAS', _base_url || 'elias.png'),
    ('PALESTINA', _base_url || 'palestina.png'),
    ('SALADOBLANCO', _base_url || 'saladoblanco.png')
  on conflict (nombre) do update set escudo_url = excluded.escudo_url;
end $$;
