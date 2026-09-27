import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";
import { requireUnlocked } from "@/lib/requireUnlocked";
import LecturaClient from "./LecturaClient";

export default async function LecturaPage({
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
  await requireUnlocked(supabase, user.id, `chapter-${id}`);

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, units(title, order_index)")
    .eq("id", id)
    .single();

  if (!chapter) notFound();

  const unit = chapter.units as unknown as { title: string; order_index: number } | null;

  const { data: pages, error } = await supabase
    .from("chapter_pages")
    .select("id, page_number, heading, body, image_url")
    .eq("chapter_id", id)
    .order("page_number", { ascending: true });

  if (error) console.error("Error cargando páginas:", error);

  return (
    <LecturaClient
      chapterId={chapter.id}
      title={chapter.title}
      pages={pages ?? []}
      moduleNumber={unit?.order_index ?? 1}
      moduleTitle={unit?.title ?? ""}
    />
  );
}
