import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActividadClient from "@/app/dashboard/estudiante/actividades/[id]/ActividadClient";
import HeroeDengueGame from "@/app/dashboard/estudiante/actividades/[id]/HeroeDengueGame";
import AhorcadoGame from "@/app/dashboard/estudiante/actividades/[id]/AhorcadoGame";
import SopaLetrasGame from "@/app/dashboard/estudiante/actividades/[id]/SopaLetrasGame";

// Mismo ruteo por título que la página del estudiante.
export default async function ActividadDocentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activity } = await supabase
    .from("activities")
    .select("id, title, units(title, order_index)")
    .eq("id", id)
    .single();
  if (!activity) notFound();

  const unit = activity.units as unknown as { title: string; order_index: number } | null;
  const common = { activityId: activity.id, moduleNumber: unit?.order_index ?? 1, moduleTitle: unit?.title ?? "" };

  if (activity.title === "Actividad 8") return <HeroeDengueGame {...common} />;
  if (activity.title === "Actividad 9 - Juego del Ahorcado") return <AhorcadoGame {...common} />;
  if (activity.title === "Actividad 10 - Juego de sopa de letras") return <SopaLetrasGame {...common} />;

  return <ActividadClient activityId={activity.id} />;
}
