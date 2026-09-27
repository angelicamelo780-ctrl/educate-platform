"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UnirseGrupoForm() {
  const supabase = createClient();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión expirada, vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }

    // 1. Buscamos el grupo por su código.
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("join_code", code.trim().toUpperCase())
      .single();

    if (groupError || !group) {
      setError("No encontramos ningún grupo con ese código.");
      setLoading(false);
      return;
    }

    // 2. Nos unimos (si ya estaba unido, el primary key evita duplicados).
    const { error: joinError } = await supabase.from("group_members").insert({
      group_id: group.id,
      student_id: user.id,
    });

    setLoading(false);

    if (joinError && !joinError.message.includes("duplicate")) {
      setError(joinError.message);
      return;
    }

    setCode("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Código del grupo (ej. AB12CD)"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Uniendo..." : "Unirme"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
