"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CrearGrupoForm() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
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

    const { error } = await supabase.from("groups").insert({
      teacher_id: user.id,
      name,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    router.refresh(); // recarga la lista de grupos en el dashboard
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Nombre del grupo (ej. 5to A - Colegio San José)"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear grupo"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
