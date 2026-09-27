import { SupabaseClient } from "@supabase/supabase-js";

export type InstitutionInfo = {
  id: string;
  nombre: string;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  logo_url: string | null;
  municipio_nombre: string | null;
  municipio_escudo_url: string | null;
};

function mapRow(row: any): InstitutionInfo | null {
  if (!row) return null;
  const municipio = row.municipios as { nombre: string; escudo_url: string | null } | null;
  return {
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion,
    email: row.email,
    telefono: row.telefono,
    logo_url: row.logo_url,
    municipio_nombre: municipio?.nombre ?? null,
    municipio_escudo_url: municipio?.escudo_url ?? null,
  };
}

// Institución de un DOCENTE: directo desde su propio perfil.
export async function getTeacherInstitution(
  supabase: SupabaseClient,
  teacherId: string
): Promise<InstitutionInfo | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("institucion_id")
    .eq("id", teacherId)
    .single();

  if (!profile?.institucion_id) return null;

  const { data } = await supabase
    .from("instituciones")
    .select("id, nombre, direccion, email, telefono, logo_url, municipios(nombre, escudo_url)")
    .eq("id", profile.institucion_id)
    .single();

  return mapRow(data);
}

// Institución de un ESTUDIANTE: se resuelve por su grupo → el profesor de
// ese grupo → la institución de ese profesor. Si el estudiante está en
// varios grupos (poco común), se usa el primero que tenga institución.
export async function getStudentInstitution(
  supabase: SupabaseClient,
  studentId: string
): Promise<InstitutionInfo | null> {
  const { data: memberships } = await supabase
    .from("group_members")
    .select("groups(teacher_id)")
    .eq("student_id", studentId);

  const teacherIds = (memberships ?? [])
    .map((m) => (m.groups as unknown as { teacher_id: string } | null)?.teacher_id)
    .filter((id): id is string => Boolean(id));

  for (const teacherId of teacherIds) {
    const info = await getTeacherInstitution(supabase, teacherId);
    if (info) return info;
  }
  return null;
}
