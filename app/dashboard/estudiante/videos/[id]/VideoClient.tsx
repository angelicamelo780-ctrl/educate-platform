"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { EducateLogo } from "@/components/Mosquito";
import ActivityHeader from "@/components/ActivityHeader";

export default function VideoClient({
  videoId,
  title,
  videoUrl,
  moduleNumber,
  moduleTitle,
}: {
  videoId: string;
  title: string;
  videoUrl: string;
  moduleNumber: number;
  moduleTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const viewerMode = useViewerMode();
  const [finished, setFinished] = useState(false);

  async function handleEnded() {
    if (!viewerMode.preview) await supabase.rpc("complete_video", { _video_id: videoId });
    setFinished(true);
  }

  function volverAlMapa() {
    router.push(mapHref(viewerMode));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--shell-h)] z-[100] flex items-center justify-center bg-black/45 p-4">
      <div
        className="relative h-full max-h-full w-full max-w-5xl overflow-hidden rounded-[28px] border-4 border-lime-500 shadow-2xl"
        style={{
          backgroundImage: "url(/illustrations/valle-fondo.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: 24,
        }}
      >
        <ActivityHeader
          moduleNumber={moduleNumber}
          moduleTitle={moduleTitle}
          title={title}
          onBack={volverAlMapa}
        />

        <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-y-auto pt-14">
          {finished ? (
            <div className="mx-auto max-w-md rounded-[32px] border-4 border-emerald-500 bg-white/95 p-8 text-center shadow-lg">
              <EducateLogo />
              <h2
                className="mt-4 text-2xl font-extrabold text-emerald-700"
                style={{ fontFamily: "var(--font-baloo)" }}
              >
                ¡Terminaste el video! 🎉
              </h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={volverAlMapa}
                  className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow"
                >
                  Volver al mapa
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[24px] bg-black shadow-2xl">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={videoUrl}
                controls
                onEnded={handleEnded}
                className="aspect-video w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
