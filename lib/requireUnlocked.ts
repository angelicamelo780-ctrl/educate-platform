import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import { getBookProgress, isRowLocked } from "@/lib/bookProgress";

// Guardia del lado del servidor para las pantallas del estudiante: si el
// ítem todavía está bloqueado (no terminó el anterior), lo manda de vuelta
// al mapa con un aviso. Así no se puede saltar pegando la URL.
export async function requireUnlocked(supabase: SupabaseClient, userId: string, key: string) {
  const { unitsData } = await getBookProgress(supabase, userId);
  if (isRowLocked(unitsData, key)) {
    redirect("/dashboard/estudiante/libro?bloqueado=1");
  }
}
