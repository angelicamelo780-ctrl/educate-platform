import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VideoClient from "@/app/dashboard/estudiante/videos/[id]/VideoClient";

export default async function VideoDocentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
