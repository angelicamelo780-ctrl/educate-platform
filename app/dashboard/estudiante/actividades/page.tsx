import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";

export default async function ActividadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await hasGroup(supabase, user.id))) {
    redirect("/dashboard/estudiante?sinGrupo=1");
  }

  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, title")
    .order("order_index", { ascending: true });

  if (error) console.error("Error cargando actividades:", error);

  const { data: completions } = await supabase
    .from("activity_completions")
    .select("activity_id")
    .eq("student_id", user.id);

  const completedIds = new Set(completions?.map((c) => c.activity_id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Actividades</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {(!activities || activities.length === 0) && (
          <li className="text-sm text-gray-500">Todavía no hay actividades disponibles.</li>
        )}
        {activities?.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
          >
            <span className="font-semibold">{a.title}</span>
            <div className="flex items-center gap-3">
              {completedIds.has(a.id) && (
                <span className="text-sm font-semibold text-emerald-700">Completada ✓</span>
              )}
              <Link
                href={`/dashboard/estudiante/actividades/${a.id}`}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {completedIds.has(a.id) ? "Jugar de nuevo" : "Jugar"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
