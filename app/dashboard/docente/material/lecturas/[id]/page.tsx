import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LecturaClient from "@/app/dashboard/estudiante/lecturas/[id]/LecturaClient";

export default async function LecturaDocentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, units(title, order_index)")
    .eq("id", id)
    .single();
  if (!chapter) notFound();

  const unit = chapter.units as unknown as { title: string; order_index: number } | null;

  const { data: pages } = await supabase
    .from("chapter_pages")
    .select("id, page_number, heading, body, image_url")
    .eq("chapter_id", id)
    .order("page_number", { ascending: true });

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
