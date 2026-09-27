"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CrearQuizForm() {
  const supabase = createClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [threshold, setThreshold] = useState(80);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("quizzes").insert({
      title,
      pass_threshold: threshold,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Título del quiz (ej. Unidad 1 - Qué es el dengue)"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        % para aprobar
        <input
          type="number"
          min={1}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-16 rounded-lg border border-gray-300 px-2 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear quiz"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
