import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TomarQuizClient from "@/app/dashboard/estudiante/quizzes/[id]/TomarQuizClient";

export default async function QuizDocentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
