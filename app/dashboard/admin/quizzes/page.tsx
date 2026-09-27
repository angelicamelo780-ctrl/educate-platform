import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CrearQuizForm from "./CrearQuizForm";

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/login");

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("id, title, pass_threshold, questions(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando quizzes:", error);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Quizzes</h1>
      <p className="mt-1 text-sm text-gray-600">
        Crea un quiz y luego entra a agregarle preguntas.
      </p>

      <div className="mt-6">
        <CrearQuizForm />
      </div>

      <ul className="mt-8 flex flex-col gap-2">
        {(!quizzes || quizzes.length === 0) && (
          <li className="text-sm text-gray-500">Aún no hay quizzes — crea el primero arriba.</li>
        )}
        {quizzes?.map((q) => (
          <li key={q.id}>
            <Link
              href={`/dashboard/admin/quizzes/${q.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-emerald-400"
            >
              <span className="font-semibold">{q.title}</span>
              <span className="text-sm text-gray-500">
                {q.questions?.[0]?.count ?? 0} preguntas · aprueba con {q.pass_threshold}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
