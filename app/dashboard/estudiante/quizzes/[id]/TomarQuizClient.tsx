"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { getBookProgress } from "@/lib/bookProgress";
import ActivityHeader from "@/components/ActivityHeader";

type Row = {
  question_id: string;
  prompt: string;
  order_index: number;
  option_id: string;
  option_label: string;
};

type Question = {
  id: string;
  prompt: string;
  order_index: number;
  options: { id: string; label: string }[];
};

// Íconos decorativos genéricos por posición — se usan solo cuando la opción
// no tiene una ilustración curada específica (ver OPTION_IMAGES_BY_PROMPT).
const OPTION_EMOJIS = ["📦", "🚢", "🛞", "🚿", "🏠", "🩺", "🌊", "🧳"];

// Ilustraciones reales por pregunta + opción. La llave exterior es el prompt
// exacto de la pregunta (para no confundir "Falso"/"Verdadero" de una
// pregunta con el de otra), la interior es la etiqueta de la opción.
const OPTION_IMAGES_BY_PROMPT: Record<string, Record<string, string>> = {
  "¿En qué lugar del barco venía oculto el enjambre de mosquitos?": {
    "En las regaderas del barco": "/illustrations/quiz-regaderas-barco.png",
  },
  "¿De qué color eran los mosquitos que invadieron Lozanía?": {
    "Negros con rayas blancas": "/illustrations/quiz-mosquito-negro.png",
    "Blancos con patas negras": "/illustrations/quiz-mosquito-blanco.png",
    "Amarillos con patas blancas": "/illustrations/quiz-mosquito-amarillo.png",
  },
  "¿De qué se alimentan las hembras de zancudo Aedes aegypti?": {
    "Agua de albercas": "/illustrations/quiz-agua-albercas.png",
    "Sangre humana": "/illustrations/quiz-sangre-humana.png",
    "Azúcar": "/illustrations/quiz-azucar.png",
  },
  "Lozanía es una ciudad ubicada en lo alto de las montañas.": {
    Falso: "/illustrations/quiz-mosquito-falso.png",
    Verdadero: "/illustrations/quiz-village-verdadero.png",
  },
  "¿Cuáles eran los escondites predilectos de las zancudas que descubrió Mario?": {
    "Patio trasero": "/illustrations/quiz-caos-escondite-casa.png",
    "Alberca y tarros plásticos": "/illustrations/quiz-caos-escondite-alberca.png",
    "Cocina y lavaplatos": "/illustrations/quiz-caos-escondite-cocina.png",
  },
  "¿Cuál fue una de las cosas que le contó la alberca a Mario en su sueño?": {
    "Que su padre era un farsante": "/illustrations/quiz-caos-sueno-farsante.png",
    "Que las zancudas cuando pican pueden transmitir el virus del dengue":
      "/illustrations/quiz-caos-sueno-dengue.png",
    "Que su hermano vivía en Sausópolis": "/illustrations/quiz-caos-sueno-sausopolis.png",
  },
  "¿Era útil el uso de tapabocas durante la cuarentena en Lozanía?": {
    "No, porque el dengue no es contagioso": "/illustrations/quiz-caos-tapabocas-mascarilla.png",
    "Sí, porque el dengue es contagioso": "/illustrations/quiz-caos-tapabocas-mosquito.png",
  },
  "¿Cuáles son los síntomas principales del dengue?": {
    "Apetito, sueño y pereza": "/illustrations/batalla-sintoma-apetito.png",
    "Fiebre, malestar general, dolor de cabeza y dolor en músculos y huesos": "/illustrations/batalla-sintoma-fiebre.png",
    "Tos, sueño, dolor de cabeza y flemas": "/illustrations/batalla-sintoma-tos.png",
  },
  "¿Según la explicación del doctor Alberto, qué debes hacer si tienes síntomas de dengue?": {
    Automedicarse: "/illustrations/batalla-automedicarse.png",
    "Usar remedios caseros": "/illustrations/batalla-caseros.png",
    "Acudir al médico": "/illustrations/batalla-medico.png",
  },
  "¿Según la explicación del médico Carlos, qué debes hacer si tienes síntomas de dengue?": {
    Automedicarse: "/illustrations/batalla-automedicarse.png",
    "Usar remedios caseros": "/illustrations/batalla-caseros.png",
    "Acudir al médico": "/illustrations/batalla-medico.png",
  },
  "¿Por qué el plan de los niños ayudó a Manuel?": {
    "Porque ayudaron a otras personas": "/illustrations/batalla-ayudaron.png",
    "Porque lavaron albercas y limpiaron patios": "/illustrations/batalla-albercas.png",
    "Porque guiaron al médico por el pueblo": "/illustrations/batalla-guiaron.png",
  },
  "¿A qué se atribuye el final de la epidemia en Lozanía?": {
    "A las oraciones del sacerdote": "/illustrations/batalla-oraciones.png",
    "A un golpe de suerte": "/illustrations/batalla-suerte.png",
    "A que los niños eliminaron los criaderos de zancudos en las viviendas": "/illustrations/batalla-eliminaron.png",
  },
};

function isBooleanQuestion(options: { label: string }[]) {
  // Cualquier pregunta de 2 opciones se centra igual (Falso/Verdadero,
  // Sí/No, etc.), no solo las que dicen literalmente "Falso"/"Verdadero".
  return options.length === 2;
}

// Sonidos sintetizados (sin archivos externos).
function playCorrectSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new Ctx();
    const run = [523.25, 587.33, 659.25, 783.99, 880.0];
    run.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
    const chordStart = c.currentTime + run.length * 0.07 + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, chordStart);
      gain.gain.linearRampToValueAtTime(0.22, chordStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.55);
      osc.connect(gain).connect(c.destination);
      osc.start(chordStart);
      osc.stop(chordStart + 0.56);
    });
    const sparkleStart = chordStart + 0.05;
    for (let i = 0; i < 4; i++) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      const t = sparkleStart + i * 0.045;
      osc.frequency.setValueAtTime(1600 + i * 220, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  } catch {
    // silencioso
  }
}

// Genera una pista corta y genérica a partir de la pregunta, ya que no
// tenemos pistas curadas por pregunta en la base de datos todavía. Esto es
// contenido de relleno (placeholder): se recomienda reemplazarlo por pistas
// reales escritas para cada pregunta cuando se pueda.
function genericHintFor(prompt: string): string {
  return `¡Piénsalo bien! Vuelve a leer la pregunta con calma: "${prompt}" — la respuesta está relacionada con algo que ya viste en el cuento. ¡Tú puedes!`;
}

function speak(text: string) {
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    // si el navegador no soporta voz, no pasa nada
  }
}

export default function TomarQuizClient({
  quizId,
  title,
  moduleNumber,
  moduleTitle,
}: {
  quizId: string;
  title: string;
  moduleNumber: number;
  moduleTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const viewerMode = useViewerMode();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAbandon, setShowAbandon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    attempt_id: string;
    score: number;
    passed: boolean;
    correct: number;
    total: number;
  } | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  // Solo se puede generar el certificado cuando TODO el mapa (las 3
  // secciones: la invasión, el caos, la batalla final) está al 100%, no con
  // aprobar un solo cuestionario. null = todavía no lo sabemos.
  const [bookComplete, setBookComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("get_quiz_for_taking", { _quiz_id: quizId });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as Row[];
      const grouped = new Map<string, Question>();
      for (const r of rows) {
        if (!grouped.has(r.question_id)) {
          grouped.set(r.question_id, {
            id: r.question_id,
            prompt: r.prompt,
            order_index: r.order_index,
            options: [],
          });
        }
        grouped.get(r.question_id)!.options.push({ id: r.option_id, label: r.option_label });
      }

      const list = Array.from(grouped.values()).sort((a, b) => a.order_index - b.order_index);
      setQuestions(list);
      setLoading(false);
    }
    load();
  }, [quizId, supabase]);

  const currentQuestion = questions?.[qIndex] ?? null;

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function openHint() {
    setShowHint(true);
  }

  function closeHint() {
    window.speechSynthesis.cancel();
    setShowHint(false);
  }

  async function handleNext() {
    if (!currentQuestion) return;
    setError(null);

    if (!answers[currentQuestion.id]) {
      setError("Elige una respuesta antes de continuar.");
      return;
    }

    if (questions && qIndex + 1 < questions.length) {
      playCorrectSound();
      setQIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    const payload = questions!.map((q) => ({
      question_id: q.id,
      option_id: answers[q.id],
    }));

    // En modo docente (vista previa) se califica igual en el servidor, pero
    // con una función que NO guarda ningún intento ni toca el progreso.
    const { data, error } = await supabase.rpc(
      viewerMode.preview ? "preview_quiz_grade" : "submit_quiz_attempt",
      { _quiz_id: quizId, _answers: payload }
    );

    setSubmitting(false);

    if (error) {
      setError(
        viewerMode.preview && /preview_quiz_grade/.test(error.message)
          ? "Falta instalar la calificación de vista previa: ejecuta supabase/docente_vista_previa.sql en Supabase."
          : error.message
      );
      return;
    }

    const r = data as { attempt_id: string; score: number; passed: boolean; correct: number; total: number };
    setResult(r);
    if (viewerMode.preview) {
      // Vista previa: no hay certificado para el docente.
      if (r.passed) playCorrectSound();
      return;
    }
    if (r.passed) {
      playCorrectSound();
      // Recién ahora, después de guardar el intento, revisamos si con esto
      // se completó TODO el mapa (no solo esta sección) antes de ofrecer
      // el certificado.
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          const { overallPct } = await getBookProgress(supabase, auth.user.id);
          setBookComplete(overallPct >= 100);
        }
      } catch {
        setBookComplete(false);
      }
    } else {
      setBookComplete(false);
    }
  }

  async function handleGenerarCertificado() {
    if (!result) return;
    setCertLoading(true);
    setCertError(null);

    const res = await fetch("/api/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_id: result.attempt_id }),
    });

    const body = await res.json();
    setCertLoading(false);

    if (!res.ok) {
      setCertError(body.error ?? "No se pudo generar el certificado.");
      return;
    }

    setCertUrl(body.pdf_url);
  }

  const headerEl = (
    <ActivityHeader
      moduleNumber={moduleNumber}
      moduleTitle={moduleTitle}
      title={title}
      onBack={() => setShowAbandon(true)}
    />
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--shell-h)] z-[100] flex items-center justify-center bg-black/45 p-4">
      <div
        className="relative h-full min-h-0 w-full max-w-5xl overflow-y-auto rounded-[28px] border-4 border-lime-500 p-5 pt-16 shadow-2xl sm:p-8 sm:pt-16"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.20), transparent 40%), radial-gradient(circle at 85% 75%, rgba(0,0,0,0.12), transparent 45%), url(/illustrations/valle-fondo.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "inset 0 0 0 1px rgba(124,82,48,0.25)",
        }}
      >
        {headerEl}
        {loading && <p className="text-center text-sm" style={{ color: "#5a3a1a" }}>Cargando quiz...</p>}
        {error && !questions && <p className="text-center text-sm text-red-700">{error}</p>}

        {!loading && questions && (
          <>
            {result ? (
              <div className="mx-auto max-w-md text-center">
                <h2
                  className="text-2xl font-extrabold"
                  style={{ fontFamily: "var(--font-baloo)", color: "#3d5a24" }}
                >
                  {result.passed ? "¡Aprobaste! 🎉" : "No alcanzaste el puntaje mínimo"}
                </h2>
                <p className="mt-2 text-sm font-semibold" style={{ color: "#5a3a1a" }}>
                  Respondiste bien {result.correct} de {result.total} preguntas — {result.score}%
                </p>
                {viewerMode.preview && (
                  <p
                    className="mt-3 rounded-2xl px-4 py-2 text-xs font-bold"
                    style={{ background: "#EDE3F7", color: "#6B3F9E" }}
                  >
                    👩‍🏫 Vista previa docente: este intento no se guardó.
                  </p>
                )}

                {result.passed && !certUrl && bookComplete && (
                  <button
                    onClick={handleGenerarCertificado}
                    disabled={certLoading}
                    className="mt-4 rounded-full bg-purple-600 px-6 py-2 text-sm font-bold text-white shadow disabled:opacity-50"
                  >
                    {certLoading ? "Generando..." : "Generar certificado"}
                  </button>
                )}

                {result.passed && !certUrl && bookComplete === false && (
                  <p
                    className="mt-3 rounded-2xl px-4 py-2 text-xs font-bold"
                    style={{ background: "#fdf1d6", color: "#7c5230" }}
                  >
                    Te falta completar otras secciones del mapa. Cuando termines todo, podrás generar tu
                    certificado desde el mapa de aventura.
                  </p>
                )}

                {certError && <p className="mt-2 text-sm text-red-700">{certError}</p>}

                {certUrl && (
                  <a
                    href={certUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-full bg-purple-600 px-6 py-2 text-sm font-bold text-white shadow"
                  >
                    Descargar certificado (PDF)
                  </a>
                )}

                <div>
                  <Link
                    href={mapHref(viewerMode)}
                    className="mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow"
                  >
                    Volver al mapa de aventura
                  </Link>
                </div>
              </div>
            ) : (
              currentQuestion && (
                <div className="mx-auto max-w-4xl">
                  {/* Barra de progreso con estrellas */}
                  <div className="mb-4 flex items-center justify-center gap-2">
                    {questions.map((q, i) => (
                      <span
                        key={q.id}
                        className="text-xl"
                        style={{ opacity: i <= qIndex ? 1 : 0.35 }}
                        aria-hidden
                      >
                        {i < qIndex ? "⭐" : i === qIndex ? "🌟" : "☆"}
                      </span>
                    ))}
                  </div>
                  <p
                    className="mb-4 text-center text-xs font-extrabold"
                    style={{ color: "#7c5230", fontFamily: "var(--font-baloo)" }}
                  >
                    Pregunta {qIndex + 1} de {questions.length}
                  </p>

                  {/* Pregunta */}
                  <div className="mb-6 flex items-start justify-center gap-2">
                    <p
                      className="max-w-xl rounded-2xl border-2 px-5 py-4 text-center text-[16px] font-bold"
                      style={{ borderColor: "#b98a4f", color: "#3d2c18", background: "rgba(255,255,255,0.7)" }}
                    >
                      {currentQuestion.prompt}
                    </p>
                    <button
                      onClick={openHint}
                      className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[10px] font-extrabold shadow transition-transform hover:scale-105"
                      style={{ background: "#e9d9b8", color: "#5a3a1a" }}
                    >
                      <span className="text-xl leading-none">🦉</span>
                      Pista
                    </button>
                  </div>

                  {/* Tarjetas de opción ilustradas. Preguntas de 3 opciones van en
                      grid de 3 columnas; las de Falso/Verdadero (2 opciones) se
                      muestran centradas como un par, no pegadas a la izquierda. */}
                  <div
                    className={
                      isBooleanQuestion(currentQuestion.options)
                        ? "mx-auto grid max-w-md grid-cols-2 gap-4"
                        : "grid grid-cols-1 gap-4 sm:grid-cols-3"
                    }
                  >
                    {currentQuestion.options.map((opt, i) => {
                      const selected = answers[currentQuestion.id] === opt.id;
                      const curatedImage =
                        OPTION_IMAGES_BY_PROMPT[currentQuestion.prompt]?.[opt.label];
                      return (
                        <button
                          key={opt.id}
                          onClick={() => selectOption(currentQuestion.id, opt.id)}
                          className="relative flex flex-col overflow-hidden rounded-[26px] text-left shadow-md transition-transform hover:-translate-y-1"
                          style={{
                            border: selected ? "4px solid #39e75f" : "4px solid transparent",
                            boxShadow: selected
                              ? "0 0 0 3px rgba(57,231,95,0.35), 0 8px 16px rgba(0,0,0,0.2)"
                              : "0 6px 14px rgba(0,0,0,0.18)",
                          }}
                        >
                          <span
                            className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-extrabold shadow"
                            style={{ color: "#7c5230", fontFamily: "var(--font-baloo)" }}
                          >
                            {i + 1}
                          </span>
                          {selected && (
                            <span className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#39e75f] text-sm font-extrabold text-white shadow">
                              ✔
                            </span>
                          )}
                          {curatedImage ? (
                            <span
                              className="flex h-44 items-center justify-center p-2"
                              style={{ background: "linear-gradient(160deg,#fdf6e3,#f3e3bd)" }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={curatedImage}
                                alt={opt.label}
                                className="h-full w-full object-contain"
                              />
                            </span>
                          ) : opt.label === "Falso" || opt.label === "Verdadero" ? (
                            <span
                              className="flex h-44 items-center justify-center text-[56px]"
                              style={{
                                background:
                                  opt.label === "Falso"
                                    ? "linear-gradient(160deg,#f8b3a8,#e0533f)"
                                    : "linear-gradient(160deg,#a8e6b3,#4fae63)",
                              }}
                            >
                              {opt.label === "Falso" ? "❌" : "✅"}
                            </span>
                          ) : (
                            <span
                              className="flex h-44 items-center justify-center text-[64px]"
                              style={{ background: "linear-gradient(160deg,#fdf6e3,#f3e3bd)" }}
                            >
                              {OPTION_EMOJIS[i % OPTION_EMOJIS.length]}
                            </span>
                          )}
                          <span
                            className="flex flex-1 items-center justify-center px-3 py-3 text-center text-[13px] font-extrabold leading-snug text-white"
                            style={{ background: "#3d2c18" }}
                          >
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {error && <p className="mt-3 text-center text-sm font-bold text-red-700">{error}</p>}

                  <div className="mt-7 flex justify-center">
                    <button
                      onClick={handleNext}
                      disabled={submitting}
                      className="rounded-full px-10 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{
                        fontFamily: "var(--font-baloo)",
                        background: "linear-gradient(180deg,#ffb04d,#f97316)",
                        boxShadow: "0 6px 0 #c2570c, 0 10px 18px rgba(0,0,0,0.25)",
                      }}
                    >
                      {submitting
                        ? "..."
                        : qIndex + 1 < questions.length
                        ? "SIGUIENTE ➔"
                        : "ENVIAR ➔"}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Modal de Pista del Sabio */}
            {showHint && currentQuestion && (
              <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[28px] bg-black/40 p-5">
                <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
                  <div
                    className="flex flex-col items-center px-6 pb-5 pt-7 text-center"
                    style={{ background: "linear-gradient(160deg,#fdf6e3,#f3e3bd)" }}
                  >
                    <div className="text-6xl">🦉</div>
                    <div
                      className="relative mt-3 rounded-2xl bg-white px-4 py-3 text-[13.5px] font-bold leading-snug shadow"
                      style={{ color: "#5a3a1a" }}
                    >
                      <span
                        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white"
                        aria-hidden
                      />
                      {genericHintFor(currentQuestion.prompt)}
                    </div>
                    <button
                      onClick={() => speak(genericHintFor(currentQuestion.prompt))}
                      className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow"
                      style={{ background: "#e9d9b8", color: "#5a3a1a" }}
                    >
                      🔊 Escuchar de nuevo
                    </button>
                  </div>
                  <div className="p-4">
                    <button
                      onClick={closeHint}
                      className="w-full rounded-full py-3 text-base font-extrabold text-white shadow"
                      style={{ fontFamily: "var(--font-baloo)", background: "#5FB94C" }}
                    >
                      ¡Entendido!
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showAbandon && (
              <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[28px] bg-black/35 p-5">
                <div className="w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl">
                  <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">
                    ¿Salir del cuestionario?
                  </div>
                  <div className="bg-lime-500 px-5 py-6 text-center">
                    <p className="mb-5 font-extrabold text-white">
                      Vas a volver al mapa de aventura. Tus respuestas de este intento se perderán.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => router.push(mapHref(viewerMode))}
                        className="rounded-lg border-2 border-lime-800 bg-lime-700 px-5 py-1.5 text-sm font-bold text-white hover:bg-lime-800"
                      >
                        Salir
                      </button>
                      <button
                        onClick={() => setShowAbandon(false)}
                        className="rounded-lg border-2 border-lime-800 bg-lime-700 px-5 py-1.5 text-sm font-bold text-white hover:bg-lime-800"
                      >
                        Seguir aquí
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
