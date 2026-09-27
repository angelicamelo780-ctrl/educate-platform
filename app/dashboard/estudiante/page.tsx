import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookProgress } from "@/lib/bookProgress";
import UnirseGrupoForm from "./UnirseGrupoForm";
import InicioClient from "./InicioClient";

export default async function DashboardEstudiante({
  searchParams,
}: {
  searchParams: Promise<{ sinGrupo?: string }>;
}) {
  const { sinGrupo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("groups(name)")
    .eq("student_id", user.id);

  if (membershipsError) {
    console.error("Error cargando grupos del estudiante:", membershipsError);
  }

  const enGrupo = (memberships?.length ?? 0) > 0;

  if (!enGrupo) {
    return (
      <div>
        {sinGrupo && (
          <p className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            Únete primero a un grupo con el código que te dé tu docente para desbloquear el libro.
          </p>
        )}
        <div
          className="rounded-[20px] bg-white p-5"
          style={{ boxShadow: "0 10px 24px rgba(47,80,20,0.14)" }}
        >
          <p
            className="mb-3 font-extrabold"
            style={{ fontFamily: "var(--font-baloo)", color: "#2E6B2A" }}
          >
            Únete a un grupo
          </p>
          <UnirseGrupoForm />
        </div>
      </div>
    );
  }

  const { unitsData } = await getBookProgress(supabase, user.id);
  const currentUnit = unitsData.find((u) => u.state === "current");
  const nextRow = currentUnit?.rows.find((r) => r.status !== "done");
  const remaining = currentUnit ? currentUnit.total - currentUnit.done : 0;

  return (
    <InicioClient
      currentUnitTitle={currentUnit?.title ?? null}
      remaining={remaining}
      nextRow={nextRow ?? null}
      allDone={unitsData.length > 0 && unitsData.every((u) => u.total === 0 || u.done === u.total)}
    />
  );
}
