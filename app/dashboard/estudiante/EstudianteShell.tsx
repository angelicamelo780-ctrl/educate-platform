"use client";

import AppShell, { type NavItem } from "@/components/AppShell";
import type { InstitutionInfo } from "@/lib/institution";

const NAV: NavItem[] = [
  { href: "/dashboard/estudiante", icon: "🏠", label: "Inicio" },
  { href: "/dashboard/estudiante/libro", icon: "📗", label: "Libros activos" },
  { href: "/dashboard/estudiante/diccionario", icon: "📘", label: "Diccionario" },
];

const WIDE = ["/dashboard/estudiante", "/dashboard/estudiante/libro", "/dashboard/estudiante/diccionario"];

export default function EstudianteShell({
  displayName,
  institution,
  children,
}: {
  displayName: string;
  institution?: InstitutionInfo | null;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      nav={NAV}
      homeHref="/dashboard/estudiante"
      displayName={displayName}
      institution={institution}
      hideLogoOnHome
      widePaths={WIDE}
    >
      {children}
    </AppShell>
  );
}
