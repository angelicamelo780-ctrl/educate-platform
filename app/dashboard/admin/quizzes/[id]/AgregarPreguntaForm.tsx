"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AgregarPreguntaForm({
  quizId,
  nextOrderIndex,
}: {
  quizId: string;
  nextOrderIndex: number;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = options
      .map((label, i) => ({ label, is_correct: i === correctIndex }))
      .filter((o) => o.label.trim() !== "");

    if (payload.length < 2) {
      setError("Agrega al menos 2 opciones.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.rpc("create_question_with_options", {
      _quiz_id: quizId,
      _prompt: prompt,
      _order_index: nextOrderIndex,
      _options: payload,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPrompt("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <input
        type="text"
        placeholder="Escribe la pregunta"
        required
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            name="correcta"
            checked={correctIndex === i}
            onChange={() => setCorrectIndex(i)}
            title="Marcar como respuesta correcta"
          />
          <input
            type="text"
            placeholder={`Opción ${i + 1}${i < 2 ? " (obligatoria)" : " (opcional)"}`}
            required={i < 2}
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      ))}
      <p className="text-xs text-gray-500">Marca con el círculo cuál opción es la correcta.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Agregar pregunta"}
      </button>
    </form>
  );
}
