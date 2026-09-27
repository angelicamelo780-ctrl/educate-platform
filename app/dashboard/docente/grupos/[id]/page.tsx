import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupProgress } from "@/lib/bookProgress";
import CopyCode from "../../CopyCode";
import { Card, formatRelative, PALETTE, ProgressBar, Stat, UnitPill } from "../../ui";

export default async function GrupoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, join_code, teacher_id")
    .eq("id", id)
    .single();

  if (!group || group.teacher_id !== user.id) notFound();

  const { data: members } = await supabase
    .from("group_members")
    .select("profiles(id, full_name)")
    .eq("group_id", id);

  const estudiantes = (members ?? [])
    .map((m) => m.profiles as unknown as { id: string; full_name: string } | null)
    .filter((p): p is { id: string; full_name: string } => Boolean(p))
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? "", "es"));

  // Mismo cálculo que el mapa del estudiante, pero en lote para todo el grupo.
  const progress = await getGroupProgress(
    supabase,
    estudiantes.map((e) => e.id)
  );

  const filas = estudiantes.map((est) => ({ estudiante: est, ...progress.get(est.id)! }));
  const units = filas[0]?.unitsData ?? [];

  const promedio = filas.length
    ? Math.round(filas.reduce((s, f) => s + (f.overallPct ?? 0), 0) / filas.length)
    : 0;
  const terminaron = filas.filter((f) => f.unitsData?.every((u) => u.state === "done")).length;
  const sinEmpezar = filas.filter((f) => (f.overallPct ?? 0) === 0).length;

  return (
    <div>
      <Link href="/dashboard/docente" className="text-sm font-extrabold" style={{ color: PALETTE.greenDark }}>
        ← Volver a mis grupos
      </Link>

      <Card className="mt-3 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-extrabold uppercase tracking-wide" style={{ color: PALETTE.purpleDark }}>
              Grupo
            </p>
            <h1 className="m-0 text-[26px] leading-tight" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
              {group.name}
            </h1>
          </div>
          <CopyCode code={group.join_code} large />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat value={filas.length} label="Estudiantes" />
          <Stat value={`${promedio}%`} label="Avance promedio" color={PALETTE.greenDark} />
          <Stat value={terminaron} label="Terminaron" color={PALETTE.purpleDark} />
          <Stat value={sinEmpezar} label="Sin empezar" color={PALETTE.coral} />
        </div>
      </Card>

      {filas.length === 0 ? (
        <Card>
          <p className="m-0 text-sm font-semibold" style={{ color: PALETTE.inkSoft }}>
            Todavía no hay estudiantes en este grupo — comparte el código de arriba para que se unan.
          </p>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr
                  className="text-[11px] font-extrabold uppercase tracking-wide"
                  style={{ background: PALETTE.cream, color: PALETTE.inkSoft }}
                >
                  <th className="px-5 py-3">Estudiante</th>
                  {units.map((u, i) => (
                    <th key={u.id} className="px-3 py-3 text-center">
                      {i + 1}. {u.title}
                    </th>
                  ))}
                  <th className="px-4 py-3">General</th>
                  <th className="px-4 py-3">Última actividad</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.estudiante.id} className="border-t" style={{ borderColor: PALETTE.cream2 }}>
                    <td className="px-5 py-3">
                      <span className="font-extrabold" style={{ color: PALETTE.ink }}>
                        {f.estudiante.full_name}
                      </span>
                      {f.hasCertificate && (
                        <span className="ml-1.5" title="Tiene certificado">
                          🏅
                        </span>
                      )}
                    </td>
                    {f.unitsData.map((u) => {
                      const quiz = u.rows.find((r) => r.key.startsWith("quiz-"));
                      return (
                        <td key={u.id} className="px-3 py-3 text-center">
                          <UnitPill unit={u} />
                          {quiz?.scoreLabel && (
                            <p
                              className="m-0 mt-1 text-[10.5px] font-extrabold"
                              style={{ color: quiz.status === "done" ? PALETTE.greenDark : PALETTE.coral }}
                            >
                              📝 {quiz.scoreLabel}
                            </p>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex min-w-[110px] items-center gap-2">
                        <ProgressBar pct={f.overallPct} height={8} />
                        <span className="w-9 text-right text-xs font-extrabold" style={{ color: PALETTE.greenDeep }}>
                          {f.overallPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: PALETTE.inkSoft }}>
                      {formatRelative(f.lastActivityAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/docente/grupos/${group.id}/estudiantes/${f.estudiante.id}`}
                        className="whitespace-nowrap text-xs font-extrabold"
                        style={{ color: PALETTE.greenDark }}
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 border-t px-5 py-3 text-[11.5px] font-semibold" style={{ borderColor: PALETTE.cream2, color: PALETTE.inkSoft }}>
            ✅ Terminada · 🦟 En curso (% de la sección) · 🔒 Sin empezar · 📝 Mejor nota del cuestionario · 🏅 Certificado
          </p>
        </Card>
      )}
    </div>
  );
}
