import { SupabaseClient } from "@supabase/supabase-js";

// Dado el unit_id y el order_index de la actividad actual, busca la
// siguiente actividad de esa misma unidad (por order_index). Se usa para
// ofrecer "Continuar a la siguiente actividad" al terminar una actividad,
// además de "Volver al mapa".
export async function getNextActivity(
  supabase: SupabaseClient,
  unitId: string,
  currentOrderIndex: number
): Promise<{ id: string; title: string } | null> {
  const { data, error } = await supabase
    .from("activities")
    .select("id, title, order_index")
    .eq("unit_id", unitId)
    .gt("order_index", currentOrderIndex)
    .order("order_index", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return { id: data[0].id, title: data[0].title };
}
