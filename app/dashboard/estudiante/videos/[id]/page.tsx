import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";
import { requireUnlocked } from "@/lib/requireUnlocked";
import VideoClient from "./VideoClient";

export default async function VideoPage({
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
  await requireUnlocked(supabase, user.id, `video-${id}`);

  const { data: video } = await supabase
    .from("videos")
    .select("id, title, video_url, units(title, order_index)")
    .eq("id", id)
    .single();

  if (!video) notFound();

  const unit = video.units as unknown as { title: string; order_index: number } | null;

  return (
    <VideoClient
      videoId={video.id}
      title={video.title}
      videoUrl={video.video_url}
      moduleNumber={unit?.order_index ?? 1}
      moduleTitle={unit?.title ?? ""}
    />
  );
}
