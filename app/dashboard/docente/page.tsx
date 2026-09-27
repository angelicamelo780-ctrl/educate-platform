import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupProgress } from "@/lib/bookProgress";
import { getTeacherInstitution } from "@/lib/institution";
import CrearGrupoForm from "./CrearGrupoForm";
import CompletarInstitucionForm from "./CompletarInstitucionForm";
import CopyCode from "./CopyCode";
import { Card, PageTitle, PALETTE, ProgressBar, Stat } from "./ui";

export default async function DashboardDocente() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, institucion_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error cargando perfil (docente):", profileError);
  }

  // Antes de dejarlo crear grupos, el docente debe completar (o elegir) la
  // institución a la que pertenece — se pide una sola vez por colegio.
  if (!profile?.institucion_id) {
    return <CompletarInstitucionForm teacherId={user.id} />;
  }

  const [institution, { data: groups, error: groupsError }] = await Promise.all([
    getTeacherInstitution(supabase, user.id),
    supabase
      .from("groups")
      .select("id, name, join_code, group_members(student_id)")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (groupsError) {
    console.error("Error cargando grupos:", groupsError);
  }

  const groupList = (groups ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    join_code: g.join_code as string,
    studentIds: ((g.group_members as unknown as { student_id: string }[]) ?? []).map((m) => m.student_id),
  }));

  const allStudentIds = Array.from(new Set(groupList.flatMap((g) => g.studentIds)));
  const progress = await getGroupProgress(supabase, allStudentIds);

  const avg = (ids: string[]) =>
    ids.length === 0
      ? 0
      : Math.round(ids.reduce((sum, id) => sum + (progress.get(id)?.overallPct ?? 0), 0) / ids.length);

  const finished = allStudentIds.filter((id) => progress.get(id)?.unitsData.every((u) => u.state === "done")).length;
  const notStarted = allStudentIds.filter((id) => (progress.get(id)?.overallPct ?? 0) === 0).length;

  return (
    <div>
      {/* HERO: mismo lenguaje visual que el hero del libro del estudiante */}
      <Card className="mb-7 grid grid-cols-1 items-center gap-6 !rounded-[28px] sm:grid-cols-[auto_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/portada-los-invasores.png"
          alt='Portada del libro "Los invasores"'
          className="h-[130px] w-auto justify-self-center rounded-xl object-cover sm:justify-self-start"
          style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.22))", transform: "rotate(-3deg)" }}
        />
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-wide" style={{ color: PALETTE.purpleDark }}>
            Panel docente{institution ? ` · ${institution.nombre}` : ""}
          </p>
          <h1 className="m-0 mt-1 text-[24px] leading-tight" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
            ¡Hola, {profile?.full_name ?? ""}! Así van tus estudiantes en &quot;Los invasores&quot;
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat value={allStudentIds.length} label="Estudiantes" />
            <Stat value={`${avg(allStudentIds)}%`} label="Avance promedio" color={PALETTE.greenDark} />
            <Stat value={finished} label="Terminaron el libro" color={PALETTE.purpleDark} />
            <Stat value={notStarted} label="Sin empezar" color={PALETTE.coral} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/docente/material"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold text-white"
              style={{ background: `linear-gradient(180deg,#7BCB61,${PALETTE.green})`, boxShadow: "0 8px 16px rgba(95,185,76,0.35)" }}
            >
              📗 Ver el material del libro
            </Link>
            <Link
              href="/dashboard/docente/colegio"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold"
              style={{ background: PALETTE.cream2, color: PALETTE.greenDark }}
            >
              🏫 Mi colegio
            </Link>
          </div>
        </div>
      </Card>

      <PageTitle
        title="Tus grupos"
        subtitle="Crea un grupo, comparte el código con tus estudiantes y entra a cada grupo para ver el avance de cada uno."
      />

      <Card className="mb-6">
        <CrearGrupoForm />
      </Card>

      {groupList.length === 0 ? (
        <p className="text-sm font-semibold" style={{ color: PALETTE.inkSoft }}>
          Aún no tienes grupos — crea el primero arriba.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groupList.map((g) => {
            const count = g.studentIds.length;
            const pct = avg(g.studentIds);
            return (
              <div
                key={g.id}
                className="flex flex-col gap-3 rounded-[24px] border-[3px] border-transparent bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#5FB94C]"
                style={{ boxShadow: "0 10px 24px rgba(47,80,20,0.14)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="m-0 text-lg leading-tight" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.ink }}>
                    {g.name}
                  </h2>
                  <span
                    className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ background: PALETTE.greenSoft, color: PALETTE.greenDark }}
                  >
                    {count} {count === 1 ? "estudiante" : "estudiantes"}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-extrabold" style={{ color: PALETTE.inkSoft }}>
                    <span>Avance promedio</span>
                    <span style={{ color: PALETTE.greenDeep }}>{pct}%</span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CopyCode code={g.join_code} />
                  <Link
                    href={`/dashboard/docente/grupos/${g.id}`}
                    className="rounded-full px-4 py-2 text-sm font-extrabold text-white"
                    style={{ background: PALETTE.green }}
                  >
                    Ver avance →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
