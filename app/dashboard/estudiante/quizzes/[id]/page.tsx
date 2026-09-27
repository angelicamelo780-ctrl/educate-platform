import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";
import { requireUnlocked } from "@/lib/requireUnlocked";
import TomarQuizClient from "./TomarQuizClient";

export default async function TomarQuizPage({
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
  await requireUnlocked(supabase, user.id, `quiz-${id}`);

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, units(title, order_index)")
    .eq("id", id)
    .single();

  if (!quiz) notFound();

  const unit = quiz.units as unknown as { title: string; order_index: number } | null;

  return (
    <TomarQuizClient
      quizId={quiz.id}
      title={quiz.title}
      moduleNumber={unit?.order_index ?? 1}
      moduleTitle={unit?.title ?? ""}
    />
  );
}
