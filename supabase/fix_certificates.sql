-- =========================================================
-- FEATURE: certificados en PDF
-- =========================================================
-- Corre esto en el SQL Editor de Supabase.

-- 1. Bucket público donde se guardan los PDFs generados.
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- 2. Cada estudiante puede subir/actualizar su propio certificado
--    (el archivo se guarda como "{student_id}/{attempt_id}.pdf").
--    Cualquiera con el link puede verlo (para que sea fácil de compartir).
drop policy if exists "estudiante sube su certificado" on storage.objects;
create policy "estudiante sube su certificado" on storage.objects
  for insert with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "estudiante actualiza su certificado" on storage.objects;
create policy "estudiante actualiza su certificado" on storage.objects
  for update using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lectura publica de certificados" on storage.objects;
create policy "lectura publica de certificados" on storage.objects
  for select using (bucket_id = 'certificates');

-- 3. Faltaba el permiso para CREAR el registro de certificado
--    (antes solo existían policies de lectura).
drop policy if exists "estudiante crea su certificado" on public.certificates;
create policy "estudiante crea su certificado" on public.certificates
  for insert with check (auth.uid() = student_id);

-- 4. Evita duplicados: un solo certificado por intento aprobado.
do $$
begin
  alter table public.certificates
    add constraint certificates_attempt_id_key unique (attempt_id);
exception
  when duplicate_object then null;
end $$;
