import { createClient } from "@/lib/supabase/server";
import ColegiosClient from "./ColegiosClient";

export default async function ColegiosPage() {
  const supabase = await createClient();
  const { data: municipios } = await supabase.from("municipios").select("id, nombre").order("nombre");
  return <ColegiosClient municipios={(municipios ?? []) as { id: string; nombre: string }[]} />;
}
