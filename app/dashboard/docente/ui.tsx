// Piezas visuales compartidas del panel docente. Usan la misma paleta,
// tipografías (Baloo 2 + Nunito), radios y sombras que la vista del
// estudiante para que ambas se sientan parte de la misma plataforma.
import type { UnitData } from "@/lib/bookProgress";

export const PALETTE = {
  cream: "#FBF5E6",
  cream2: "#F3ECD7",
  green: "#5FB94C",
  greenDark: "#2E6B2A",
  greenDeep: "#1F4A1D",
  greenSoft: "#E9F7E2",
  yellow: "#FFC94A",
  yellowSoft: "#FEF3D6",
  purple: "#8C5FBF",
  purpleDark: "#6B3F9E",
  purpleSoft: "#EDE3F7",
  coral: "#EF6F53",
  ink: "#332B1F",
  inkSoft: "#6B6152",
};

export const CARD_SHADOW = "0 10px 24px rgba(47,80,20,0.14)";

export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`rounded-[24px] bg-white p-5 sm:p-6 ${className}`} style={{ boxShadow: CARD_SHADOW, ...style }}>
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="m-0 text-[26px] leading-tight" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
        {title}
      </h1>
      {subtitle && (
        <p className="m-0 mt-1 max-w-[62ch] text-sm font-semibold" style={{ color: PALETTE.inkSoft }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Stat({ value, label, color = PALETTE.greenDeep }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl px-3 py-3 text-center" style={{ background: PALETTE.cream }}>
      <span className="text-[26px] font-extrabold leading-none" style={{ fontFamily: "var(--font-baloo)", color }}>
        {value}
      </span>
      <span className="mt-1 text-[10.5px] font-extrabold uppercase tracking-wide" style={{ color: PALETTE.inkSoft }}>
        {label}
      </span>
    </div>
  );
}

export function ProgressBar({ pct, height = 10 }: { pct: number; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ background: PALETTE.cream2, height }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: `linear-gradient(90deg, ${PALETTE.yellow}, ${PALETTE.green})`,
        }}
      />
    </div>
  );
}

// Estado de una sección con los mismos íconos del mapa del estudiante.
export function UnitPill({ unit }: { unit: UnitData }) {
  const started = unit.done > 0;
  const style =
    unit.state === "done"
      ? { bg: PALETTE.greenSoft, fg: "#1F7A3D", icon: "✅", text: "Terminada" }
      : started
      ? { bg: PALETTE.yellowSoft, fg: "#8A6100", icon: "🦟", text: `${unit.pct}%` }
      : { bg: "#F1F1F1", fg: "#8a8a8a", icon: "🔒", text: "Sin empezar" };
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-extrabold"
      style={{ background: style.bg, color: style.fg }}
      title={`${unit.title}: ${unit.done}/${unit.total} ítems`}
    >
      <span>{style.icon}</span> {style.text}
    </span>
  );
}

export function formatRelative(iso: string | null) {
  if (!iso) return "Sin actividad";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
