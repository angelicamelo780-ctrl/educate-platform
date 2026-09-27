import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookProgress } from "@/lib/bookProgress";
import LibroClient from "@/app/dashboard/estudiante/libro/LibroClient";

export default async function MaterialDocentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Solo necesitamos la estructura del libro; los estados se ignoran en
  // modo vista previa (todo desbloqueado).
  const { unitsData } = await getBookProgress(supabase, user.id, "/dashboard/docente/material");

  return <LibroClient units={unitsData} overallPct={0} certifiableAttemptId={null} preview />;
}
