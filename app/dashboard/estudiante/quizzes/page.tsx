import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";

export default async function QuizzesEstudiantePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await hasGroup(supabase, user.id))) {
    redirect("/dashboard/estudiante?sinGrupo=1");
  }

  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, title, pass_threshold")
    .order("created_at", { ascending: true });

  if (quizzesError) console.error("Error cargando quizzes:", quizzesError);

  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, score, passed")
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false });

  if (attemptsError) console.error("Error cargando intentos:", attemptsError);

  // Si el estudiante intentó el cuestionario varias veces (reprobó y luego
  // aprobó, por ejemplo), mostramos el mejor intento: el aprobado si existe,
  // o si no, el de mayor puntaje. Antes se mostraba el primero que devolvía
  // la base de datos sin ordenar, que podía ser un intento reprobado viejo.
  function bestAttemptFor(quizId: string) {
    const forQuiz = attempts?.filter((a) => a.quiz_id === quizId) ?? [];
    if (forQuiz.length === 0) return undefined;
    return forQuiz.reduce((best, a) =>
      a.passed && !best.passed ? a : a.passed === best.passed && a.score > best.score ? a : best
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-center" style={{ fontFamily: "var(--font-baloo)" }}>
        <span className="text-2xl font-extrabold text-gray-900">Edúcate</span>
        <span className="ml-1 align-top text-lg">🦟</span>
        <div className="-mt-0.5 text-xs font-bold text-gray-600">contra el</div>
        <div className="-mt-1 text-xl font-extrabold text-orange-600">dengue</div>
      </div>

      <h1
        className="mt-4 text-center text-2xl font-extrabold text-purple-700"
        style={{ fontFamily: "var(--font-baloo)" }}
      >
        Cuestionarios
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        {(!quizzes || quizzes.length === 0) && (
          <p className="text-center text-sm text-gray-500">Todavía no hay cuestionarios disponibles.</p>
        )}
        {quizzes?.map((q) => {
          const attempt = bestAttemptFor(q.id);
          return (
            <div
              key={q.id}
              className="flex items-center justify-between rounded-[30px] border-4 border-lime-400 bg-white px-6 py-4 shadow-sm"
            >
              <div>
                <p className="font-extrabold text-gray-800">{q.title}</p>
                <p className="text-xs text-gray-500">Aprueba con {q.pass_threshold}%</p>
              </div>
              {attempt ? (
                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}
                >
                  {attempt.passed ? "Aprobado" : "No aprobado"} · {attempt.score}%
                </span>
              ) : (
                <Link
                  href={`/dashboard/estudiante/quizzes/${q.id}`}
                  className="rounded-full bg-orange-500 px-6 py-2 text-sm font-bold text-white shadow transition-transform hover:scale-105"
                >
                  Empezar
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
