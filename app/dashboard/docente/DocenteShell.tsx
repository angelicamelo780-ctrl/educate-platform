"use client";

import AppShell, { type NavItem } from "@/components/AppShell";
import type { InstitutionInfo } from "@/lib/institution";

const NAV: NavItem[] = [
  { href: "/dashboard/docente", icon: "👥", label: "Mis grupos", match: ["/dashboard/docente/grupos"] },
  { href: "/dashboard/docente/material", icon: "📗", label: "Material" },
  { href: "/dashboard/docente/diccionario", icon: "📘", label: "Diccionario" },
  { href: "/dashboard/docente/colegio", icon: "🏫", label: "Mi colegio" },
];

export default function DocenteShell({
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
      homeHref="/dashboard/docente"
      displayName={displayName}
      roleLabel="👩‍🏫 Docente"
      compact
      institution={institution}
    >
      {children}
    </AppShell>
  );
}
