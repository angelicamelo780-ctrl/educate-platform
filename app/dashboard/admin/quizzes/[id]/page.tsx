import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgregarPreguntaForm from "./AgregarPreguntaForm";

export default async function QuizDetailPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/login");

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, pass_threshold")
    .eq("id", id)
    .single();

  if (!quiz) notFound();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, prompt, order_index, options(id, label, is_correct)")
    .eq("quiz_id", id)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error cargando preguntas:", error);
  }

  const nextOrderIndex = (questions?.length ?? 0) + 1;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/admin/quizzes" className="text-sm text-emerald-700">
        ← Volver a quizzes
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{quiz.title}</h1>
      <p className="text-sm text-gray-600">Aprueba con {quiz.pass_threshold}%</p>

      <div className="mt-6 flex flex-col gap-4">
        {questions?.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold">
              {i + 1}. {q.prompt}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {q.options?.map((o) => (
                <li
                  key={o.id}
                  className={`text-sm ${o.is_correct ? "font-semibold text-emerald-700" : "text-gray-600"}`}
                >
                  {o.is_correct ? "✓ " : "— "}
                  {o.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-semibold text-gray-700">Agregar pregunta</h2>
      <AgregarPreguntaForm quizId={quiz.id} nextOrderIndex={nextOrderIndex} />
    </main>
  );
}
