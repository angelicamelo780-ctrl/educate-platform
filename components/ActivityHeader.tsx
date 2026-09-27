"use client";

export default function ActivityHeader({
  moduleNumber,
  moduleTitle,
  title,
  onBack,
}: {
  moduleNumber: number;
  moduleTitle: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <div
      className="absolute left-3 top-3 z-30 flex max-w-[calc(100%-24px)] items-center gap-2.5 rounded-2xl px-3 py-2 shadow-lg sm:left-4 sm:top-4"
      style={{ background: "linear-gradient(160deg, #b98a4f, #8a6136)" }}
    >
      <button
        onClick={onBack}
        aria-label="Salir de la actividad"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-[3px] text-sm font-bold transition-transform hover:scale-105"
        style={{ background: "#f3ead2", borderColor: "#6b4527", color: "#7c5230" }}
      >
        ✕
      </button>
      <div className="min-w-0">
        <p className="m-0 truncate text-[10px] font-bold leading-tight" style={{ color: "#f3ead2" }}>
          Módulo {moduleNumber} &gt; {moduleTitle}
        </p>
        <h1
          className="m-0 truncate text-[13.5px] leading-tight"
          style={{ fontFamily: "var(--font-baloo)", color: "#fffdf7" }}
        >
          {title}
        </h1>
      </div>
      <button
        onClick={onBack}
        className="ml-1 hidden flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold sm:block"
        style={{ background: "#f3ead2", color: "#7c5230" }}
      >
        ← Mapa
      </button>
    </div>
  );
}
