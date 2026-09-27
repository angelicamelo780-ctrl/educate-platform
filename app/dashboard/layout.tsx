"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <span className="font-semibold text-emerald-700">Edúcate contra el Dengue</span>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-gray-600 hover:text-red-600"
        >
          Cerrar sesión
        </button>
      </header>
      {children}
    </div>
  );
}
