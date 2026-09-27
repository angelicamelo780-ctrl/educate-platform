import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeacherInstitution } from "@/lib/institution";
import { Card, PageTitle, PALETTE, Stat } from "../ui";

export default async function MiColegioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const institution = await getTeacherInstitution(supabase, user.id);

  if (!institution) {
    return (
      <div>
        <PageTitle title="Mi colegio" />
        <Card>
          <p className="m-0 text-sm font-semibold" style={{ color: PALETTE.inkSoft }}>
            Todavía no has elegido tu institución.{" "}
            <Link href="/dashboard/docente" className="font-extrabold" style={{ color: PALETTE.greenDark }}>
              Complétala aquí →
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const { data: groups } = await supabase
    .from("groups")
    .select("id, group_members(student_id)")
    .eq("teacher_id", user.id);

  const groupCount = groups?.length ?? 0;
  const studentCount = new Set(
    (groups ?? []).flatMap((g) => ((g.group_members as unknown as { student_id: string }[]) ?? []).map((m) => m.student_id))
  ).size;

  const contact = [
    { icon: "📍", label: "Dirección", value: institution.direccion },
    { icon: "📞", label: "Teléfono", value: institution.telefono },
    { icon: "✉️", label: "Correo", value: institution.email },
  ];

  return (
    <div>
      <PageTitle title="Mi colegio" subtitle="Esta es la información que también ven tus estudiantes al tocar el escudo en la barra superior." />

      <section className="mb-6 overflow-hidden rounded-[28px] bg-white" style={{ boxShadow: "0 10px 24px rgba(47,80,20,0.14)" }}>
        <div
          className="flex flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:text-left"
          style={{ background: PALETTE.greenDeep }}
        >
          {(institution.logo_url || institution.municipio_escudo_url) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(institution.logo_url ?? institution.municipio_escudo_url)!}
              alt=""
              className="h-24 w-24 flex-shrink-0 rounded-2xl bg-white object-contain p-2 shadow-md"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[24px] leading-tight text-white" style={{ fontFamily: "var(--font-baloo)" }}>
              {institution.nombre}
            </h2>
            {institution.municipio_nombre && (
              <p className="m-0 mt-1 text-sm font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>
                {institution.municipio_nombre}
              </p>
            )}
          </div>
          {institution.logo_url && institution.municipio_escudo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institution.municipio_escudo_url}
              alt="Escudo del municipio"
              className="h-16 w-16 flex-shrink-0 rounded-full bg-white object-contain p-1.5 shadow-md"
            />
          )}
        </div>
        <div
          className="h-3"
          style={{
            background: `repeating-linear-gradient(90deg,${PALETTE.green} 0 24px, ${PALETTE.yellow} 24px 48px, ${PALETTE.purple} 48px 72px, ${PALETTE.coral} 72px 96px)`,
          }}
        />
        <div className="grid gap-3 p-6 sm:grid-cols-3">
          {contact.map((c) => (
            <div key={c.label} className="rounded-2xl p-4" style={{ background: PALETTE.cream }}>
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: PALETTE.inkSoft }}>
                {c.icon} {c.label}
              </p>
              <p className="m-0 mt-1 break-words text-sm font-bold" style={{ color: c.value ? PALETTE.ink : "#aaa" }}>
                {c.value ?? "Sin registrar"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Card>
        <h2 className="m-0 mb-3 text-[18px]" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
          Tu participación
        </h2>
        <div className="grid max-w-md grid-cols-2 gap-2.5">
          <Stat value={groupCount} label={groupCount === 1 ? "Grupo" : "Grupos"} />
          <Stat value={studentCount} label="Estudiantes" color={PALETTE.purpleDark} />
        </div>
      </Card>
    </div>
  );
}
