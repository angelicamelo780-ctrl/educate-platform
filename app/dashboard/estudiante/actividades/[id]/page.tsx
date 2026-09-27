import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";
import { requireUnlocked } from "@/lib/requireUnlocked";
import ActividadClient from "./ActividadClient";
import HeroeDengueGame from "./HeroeDengueGame";
import AhorcadoGame from "./AhorcadoGame";
import SopaLetrasGame from "./SopaLetrasGame";

export default async function ActividadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await hasGroup(supabase, user.id))) {
    redirect("/dashboard/estudiante?sinGrupo=1");
  }

  // Igual que en los niveles del mapa: no se abre sin terminar el anterior.
  await requireUnlocked(supabase, user.id, `activity-${id}`);

  const { data: activity } = await supabase
    .from("activities")
    .select("id, title, units(title, order_index)")
    .eq("id", id)
    .single();

  if (!activity) notFound();

  const unit = activity.units as unknown as { title: string; order_index: number } | null;

  // Actividad 8, 9 y 10 ("La batalla final") son juegos completamente a la
  // medida (no encajan en el motor genérico de pasos), así que tienen su
  // propio componente en vez de ActividadClient.
  if (activity.title === "Actividad 8") {
    return (
      <HeroeDengueGame
        activityId={activity.id}
        moduleNumber={unit?.order_index ?? 1}
        moduleTitle={unit?.title ?? ""}
      />
    );
  }

  if (activity.title === "Actividad 9 - Juego del Ahorcado") {
    return (
      <AhorcadoGame
        activityId={activity.id}
        moduleNumber={unit?.order_index ?? 1}
        moduleTitle={unit?.title ?? ""}
      />
    );
  }

  if (activity.title === "Actividad 10 - Juego de sopa de letras") {
    return (
      <SopaLetrasGame
        activityId={activity.id}
        moduleNumber={unit?.order_index ?? 1}
        moduleTitle={unit?.title ?? ""}
      />
    );
  }

  return <ActividadClient activityId={activity.id} />;
}
