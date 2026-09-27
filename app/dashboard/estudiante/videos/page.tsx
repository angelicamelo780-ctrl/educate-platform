import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";

export default async function VideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await hasGroup(supabase, user.id))) {
    redirect("/dashboard/estudiante?sinGrupo=1");
  }

  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title")
    .order("order_index", { ascending: true });

  if (error) console.error("Error cargando videos:", error);

  const { data: completions } = await supabase
    .from("video_completions")
    .select("video_id")
    .eq("student_id", user.id);

  const completedIds = new Set(completions?.map((c) => c.video_id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Videos</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {(!videos || videos.length === 0) && (
          <li className="text-sm text-gray-500">Todavía no hay videos disponibles.</li>
        )}
        {videos?.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
          >
            <span className="font-semibold">{v.title}</span>
            <div className="flex items-center gap-3">
              {completedIds.has(v.id) && (
                <span className="text-sm font-semibold text-emerald-700">Visto ✓</span>
              )}
              <Link
                href={`/dashboard/estudiante/videos/${v.id}`}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {completedIds.has(v.id) ? "Ver de nuevo" : "Ver"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
