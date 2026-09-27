"use client";

import AppShell, { type NavItem } from "@/components/AppShell";

const NAV: NavItem[] = [
  { href: "/dashboard/admin/colegios", icon: "🏫", label: "Colegios" },
  { href: "/dashboard/admin/quizzes", icon: "📝", label: "Cuestionarios" },
];

export default function AdminShell({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  return (
    <AppShell nav={NAV} homeHref="/dashboard/admin/colegios" displayName={displayName} roleLabel="🛠️ Admin" compact>
      {children}
    </AppShell>
  );
}
