"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { InstitutionInfo } from "@/lib/institution";

// `match`: prefijos de ruta extra que también marcan el ítem como activo
// (p. ej. "Inicio" del docente sigue activo dentro de /grupos/...).
export type NavItem = { href: string; icon: string; label: string; match?: string[] };

// Marco común (barra superior fija + fondo + modal de institución) que
// comparten la vista del estudiante y la del docente, para que ambas se vean
// y se comporten igual. El alto de la barra vive en --shell-h (globals.css).
export default function AppShell({
  nav,
  homeHref,
  displayName,
  roleLabel,
  institution,
  hideLogoOnHome = false,
  widePaths = [],
  compact = false,
  children,
}: {
  nav: NavItem[];
  homeHref: string;
  displayName: string;
  roleLabel?: string;
  institution?: InstitutionInfo | null;
  // En la página de inicio el logo pasa al banner (se oculta en la barra).
  hideLogoOnHome?: boolean;
  // Páginas con banner de ~1180px (Inicio, Libros activos, Diccionario)
  // usan un contenedor más ancho.
  widePaths?: string[];
  // Barra compacta (vista docente): menos alto y elementos más pequeños
  // para que todo el menú quepa sin hacer scroll.
  compact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const [showInstitution, setShowInstitution] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="estudiante-theme min-h-screen"
      style={{
        ...(compact ? ({ "--shell-h": "74px" } as React.CSSProperties) : {}),
        fontFamily: "var(--font-nunito)",
        background:
          "radial-gradient(circle at 8% 15%, rgba(255,201,74,0.18), transparent 40%), radial-gradient(circle at 92% 85%, rgba(140,95,191,0.14), transparent 45%), #FBF5E6",
        color: "#332B1F",
      }}
    >
      {/* Barra superior fija, siempre visible en todas las pantallas. Su alto
          total (barra + franja de colores) es la variable CSS --shell-h
          (globals.css): las actividades, videos y quizzes se ubican debajo
          con top-[var(--shell-h)]. */}
      <div className="fixed inset-x-0 top-0 z-[200]" style={{ height: "var(--shell-h)" }}>
        <header
          className={`flex items-center gap-3 bg-white px-4 sm:px-6 ${compact ? "lg:px-8" : "lg:gap-3 lg:px-8 xl:gap-4 xl:px-16"}`}
          style={{ height: "calc(var(--shell-h) - 6px)", boxShadow: "0 6px 24px rgba(60,40,10,0.08)" }}
        >
          {!(hideLogoOnHome && pathname === homeHref) && (
            <>
              <Link href={homeHref} className="shell-focus flex-shrink-0 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/illustrations/logo-educate.png"
                  alt="Edúcate contra el dengue"
                  className={compact ? "h-10 w-auto lg:h-12" : "h-10 w-auto lg:h-16 xl:h-[76px]"}
                />
              </Link>
              <span className="hidden h-11 w-0.5 flex-shrink-0 rounded-full lg:block" style={{ background: "#F0E6D2" }} aria-hidden />
            </>
          )}

          <nav className="flex flex-1 items-center gap-2 overflow-x-auto py-2 lg:gap-2.5">
            {nav.map((item) => {
              const active =
                (item.href === homeHref ? pathname === homeHref : pathname.startsWith(item.href)) ||
                (item.match ?? []).some((m) => pathname.startsWith(m));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shell-focus shell-pill flex h-10 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[15px] ${compact ? "" : "lg:h-11 lg:px-4 lg:text-[16px] xl:h-12 xl:px-[22px] xl:text-[18px]"} ${
                    active ? "shell-pill-on" : ""
                  }`}
                  style={{ fontFamily: "var(--font-baloo)", fontWeight: 700 }}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              );
            })}
          </nav>

          <span
            className={`hidden h-10 flex-shrink-0 items-center truncate rounded-full px-4 ${compact ? "text-[15px] 2xl:flex" : "sm:flex lg:h-11 lg:text-[16px] xl:h-12 xl:px-5 xl:text-[18px]"}`}
            style={{ background: "#FFF4D6", color: "#5A3A00", fontFamily: "var(--font-baloo)", fontWeight: 700 }}
          >
            ¡Hola, {displayName}! 👋
          </span>

          {roleLabel && (
            <span
              className="hidden flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold xl:block"
              style={{ background: "#EDE3F7", color: "#6B3F9E" }}
            >
              {roleLabel}
            </span>
          )}

          <button
            onClick={handleLogout}
            className={`shell-focus flex h-10 flex-shrink-0 items-center rounded-full border-2 bg-white px-3.5 text-[12.5px] font-extrabold transition-colors hover:bg-[#FFF7E8] active:translate-y-px ${compact ? "" : "lg:h-11 xl:h-12 xl:px-5 xl:text-[14px]"}`}
            style={{ borderColor: "#E5DCC9", color: "#3D4A3B" }}
          >
            Cerrar sesión
          </button>

          {institution?.municipio_escudo_url && (
            <>
              <span className="hidden h-11 w-0.5 flex-shrink-0 rounded-full lg:block" style={{ background: "#F0E6D2" }} aria-hidden />
              <button
                onClick={() => setShowInstitution(true)}
                className="shell-focus flex-shrink-0 rounded-full transition-transform hover:scale-105 active:scale-95"
                aria-label="Ver información de la institución"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={institution.municipio_escudo_url}
                  alt="Escudo del municipio"
                  className={`h-12 w-12 rounded-full border-[3px] bg-white object-contain p-1 ${compact ? "" : "lg:h-[68px] lg:w-[68px] lg:p-1.5"}`}
                  style={{ borderColor: "#FFC93C", boxShadow: "0 4px 12px rgba(60,40,10,0.12)" }}
                />
              </button>
            </>
          )}
        </header>
        {/* Franja de 4 colores bajo la barra */}
        <div className="flex h-1.5" aria-hidden>
          <span className="flex-1" style={{ background: "#5DBB46" }} />
          <span className="flex-1" style={{ background: "#FFC93C" }} />
          <span className="flex-1" style={{ background: "#8B5CD6" }} />
          <span className="flex-1" style={{ background: "#FF7A59" }} />
        </div>
      </div>

      {showInstitution && institution && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowInstitution(false)}
          role="dialog"
          aria-modal="true"
          aria-label={institution.nombre}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arriba el escudo del municipio; abajo el colegio */}
            <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-7 text-center" style={{ background: "#1E5B24" }}>
              {institution.municipio_escudo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institution.municipio_escudo_url}
                  alt={`Escudo de ${institution.municipio_nombre ?? "el municipio"}`}
                  className="h-24 w-24 rounded-full border-[3px] bg-white object-contain p-2"
                  style={{ borderColor: "#FFC93C", boxShadow: "0 6px 0 #D39A12" }}
                />
              )}
              {institution.municipio_nombre && (
                <p className="m-0 mt-2 text-[11px] font-extrabold tracking-wider" style={{ color: "#FFE08A" }}>
                  {institution.municipio_nombre.toUpperCase()}
                </p>
              )}
              <div className="mt-1 flex items-center justify-center gap-2.5">
                {institution.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={institution.logo_url} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-0.5" />
                )}
                <h3 className="m-0 text-lg text-white" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}>
                  {institution.nombre}
                </h3>
              </div>
            </div>
            {(institution.telefono || institution.email) && (
              <div className="flex flex-col gap-3 px-6 py-5 text-sm">
                {institution.telefono && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span className="text-gray-700">{institution.telefono}</span>
                  </div>
                )}
                {institution.email && (
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <span className="text-gray-700">{institution.email}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowInstitution(false)}
              className="shell-focus w-full border-t border-gray-100 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Contenido: empieza debajo de la barra fija, con margen coherente */}
      <main
        className={`mx-auto px-5 pb-10 sm:px-8 ${widePaths.includes(pathname) ? "max-w-[1244px]" : "max-w-[1100px]"}`}
        style={{ paddingTop: "calc(var(--shell-h) + 16px)" }}
      >
        {children}
      </main>
    </div>
  );
}
