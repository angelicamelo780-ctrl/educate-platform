import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";

export default async function LecturasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await hasGroup(supabase, user.id))) {
    redirect("/dashboard/estudiante?sinGrupo=1");
  }

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, title")
    .order("order_index", { ascending: true });

  if (error) console.error("Error cargando capítulos:", error);

  const { data: completions } = await supabase
    .from("reading_completions")
    .select("chapter_id")
    .eq("student_id", user.id);

  const completedIds = new Set(completions?.map((c) => c.chapter_id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Lecturas</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {(!chapters || chapters.length === 0) && (
          <li className="text-sm text-gray-500">Todavía no hay capítulos disponibles.</li>
        )}
        {chapters?.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
          >
            <span className="font-semibold">{c.title}</span>
            <div className="flex items-center gap-3">
              {completedIds.has(c.id) && (
                <span className="text-sm font-semibold text-emerald-700">Leído ✓</span>
              )}
              <Link
                href={`/dashboard/estudiante/lecturas/${c.id}`}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {completedIds.has(c.id) ? "Leer de nuevo" : "Leer"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
