import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupProgress } from "@/lib/bookProgress";
import { Card, formatRelative, PALETTE, ProgressBar, Stat, UnitPill } from "../../../../ui";

export default async function EstudianteDetallePage({
  params,
}: {
  params: Promise<{ id: string; estudianteId: string }>;
}) {
  const { id, estudianteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase.from("groups").select("id, name, teacher_id").eq("id", id).single();
  if (!group || group.teacher_id !== user.id) notFound();

  // El estudiante debe pertenecer a ESTE grupo del docente.
  const { data: membership } = await supabase
    .from("group_members")
    .select("profiles(id, full_name)")
    .eq("group_id", id)
    .eq("student_id", estudianteId)
    .maybeSingle();

  const estudiante = membership?.profiles as unknown as { id: string; full_name: string } | null;
  if (!estudiante) notFound();

  // Los enlaces de cada ítem abren la vista previa del docente, para que
  // pueda ver exactamente la actividad de la que se está hablando.
  const progress = (await getGroupProgress(supabase, [estudiante.id], "/dashboard/docente/material")).get(
    estudiante.id
  )!;

  const totalItems = progress.unitsData.reduce((n, u) => n + u.total, 0);
  const doneItems = progress.unitsData.reduce((n, u) => n + u.done, 0);

  return (
    <div>
      <Link href={`/dashboard/docente/grupos/${group.id}`} className="text-sm font-extrabold" style={{ color: PALETTE.greenDark }}>
        ← Volver a {group.name}
      </Link>

      <Card className="mt-3 mb-6">
        <p className="m-0 text-xs font-extrabold uppercase tracking-wide" style={{ color: PALETTE.purpleDark }}>
          Estudiante · {group.name}
        </p>
        <h1 className="m-0 text-[26px] leading-tight" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
          {estudiante.full_name} {progress.hasCertificate && <span title="Tiene certificado">🏅</span>}
        </h1>
        <div className="mt-3 max-w-md">
          <ProgressBar pct={progress.overallPct} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat value={`${progress.overallPct}%`} label="Avance general" />
          <Stat value={`${doneItems}/${totalItems}`} label="Ítems completados" color={PALETTE.greenDark} />
          <Stat
            value={progress.unitsData.filter((u) => u.state === "done").length}
            label="Secciones terminadas"
            color={PALETTE.purpleDark}
          />
          <Stat value={formatRelative(progress.lastActivityAt)} label="Última actividad" color={PALETTE.coral} />
        </div>
      </Card>

      <div className="flex flex-col gap-5">
        {progress.unitsData.map((unit, i) => (
          <Card key={unit.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-[18px]" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
                {i + 1}. {unit.title}
                <span className="ml-2 text-xs font-bold" style={{ color: PALETTE.inkSoft }}>
                  {unit.done}/{unit.total} completado
                </span>
              </h2>
              <UnitPill unit={unit} />
            </div>
            <div className="flex flex-col gap-2">
              {unit.rows.map((row) => (
                <Link
                  key={row.key}
                  href={row.href}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-transform hover:-translate-y-0.5"
                  style={{ background: row.status === "done" ? PALETTE.greenSoft : PALETTE.cream }}
                  title="Abrir en vista previa"
                >
                  <span className="text-xl">{row.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold" style={{ color: PALETTE.ink }}>
                    {row.title}
                  </span>
                  <span className="flex-shrink-0 text-xs font-extrabold">
                    {row.status === "done" && (
                      <span style={{ color: PALETTE.greenDark }}>
                        ✔️ {row.scoreLabel ? `Aprobado · ${row.scoreLabel}` : "Hecho"}
                      </span>
                    )}
                    {row.status === "score" && (
                      <span style={{ color: PALETTE.coral }}>No aprobado · {row.scoreLabel}</span>
                    )}
                    {row.status === "pending" && <span style={{ color: PALETTE.inkSoft }}>Pendiente</span>}
                    {row.status === "locked" && <span style={{ color: "#aaa" }}>🔒 Bloqueado</span>}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
