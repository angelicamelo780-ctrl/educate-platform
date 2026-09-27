import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSeccionesPorPalabra } from "@/lib/diccionarioSecciones";
import DiccionarioClient from "@/app/dashboard/estudiante/diccionario/DiccionarioClient";

// El docente ve exactamente el mismo diccionario que sus estudiantes.
export default async function DiccionarioDocentePage({
  searchParams,
}: {
  searchParams: Promise<{ palabra?: string }>;
}) {
  const { palabra } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { secciones, unidades } = await getSeccionesPorPalabra(supabase);
  return <DiccionarioClient secciones={secciones} unidades={unidades} palabraInicial={palabra ?? null} />;
}
