import { SupabaseClient } from "@supabase/supabase-js";
import { DICCIONARIO, TOKEN_RE, buscarExacta } from "@/lib/diccionario";

// En qué secciones del libro (unidades) aparece cada palabra del diccionario.
// Se calcula del texto REAL de las lecturas, así que se actualiza solo si
// cambia el contenido del libro.
export async function getSeccionesPorPalabra(supabase: SupabaseClient) {
  const [{ data: units }, { data: pages }] = await Promise.all([
    supabase.from("units").select("id, title, order_index").order("order_index", { ascending: true }),
    supabase.from("chapter_pages").select("body, chapters(unit_id)"),
  ]);

  const unitTitle = new Map((units ?? []).map((u) => [u.id as string, u.title as string]));
  const secciones: Record<string, string[]> = {};

  for (const pg of pages ?? []) {
    const unitId = (pg.chapters as unknown as { unit_id: string } | null)?.unit_id;
    const title = unitId ? unitTitle.get(unitId) : undefined;
    if (!title || !pg.body) continue;
    for (const tok of (pg.body as string).match(TOKEN_RE) ?? []) {
      const p = buscarExacta(tok);
      if (!p) continue;
      const list = (secciones[p.palabra] ??= []);
      if (!list.includes(title)) list.push(title);
    }
  }

  // Orden de las secciones igual al del mapa.
  const order = (units ?? []).map((u) => u.title as string);
  for (const k of Object.keys(secciones)) secciones[k].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return { secciones, unidades: order, total: DICCIONARIO.length };
}
