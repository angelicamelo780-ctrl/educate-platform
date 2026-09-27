import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasGroup } from "@/lib/hasGroup";
import { getBookProgress } from "@/lib/bookProgress";
import LibroClient from "./LibroClient";

export default async function LibroPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string }>;
}) {
  const { bloqueado } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await hasGroup(supabase, user.id))) {
    redirect("/dashboard/estudiante?sinGrupo=1");
  }

  const { unitsData, overallPct, certifiableAttemptId } = await getBookProgress(supabase, user.id);

  return (
    <LibroClient
      units={unitsData}
      overallPct={overallPct}
      certifiableAttemptId={certifiableAttemptId}
      blockedNotice={Boolean(bloqueado)}
    />
  );
}
