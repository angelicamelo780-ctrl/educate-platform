import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSeccionesPorPalabra } from "@/lib/diccionarioSecciones";
import DiccionarioClient from "./DiccionarioClient";

export default async function DiccionarioPage({
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
