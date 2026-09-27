"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { getNextActivity } from "@/lib/nextActivity";
import ActivityHeader from "@/components/ActivityHeader";
import { EducateLogo } from "@/components/Mosquito";

type Nivel = { pista: string; palabra: string };

const NIVELES: Nivel[] = [
  {
    pista:
      "Más conocido como el mosquito del dengue, mosquito momia o mosquito de la fiebre amarilla, es un mosquito que puede ser portador del virus del dengue",
    palabra: "AEDESAEGYPTI",
  },
  {
    pista: "Una de las acciones del plan de exterminio de zancudos, realizadas por los niños de lozanía ¿era?",
    palabra: "LAVADODEALBERCAS",
  },
  { pista: "Mario cumplió su sueño de ser", palabra: "CANTANTE" },
];

type Screen = "instrucciones" | "nivel" | "perdiste" | "felicitacionesNivel" | "felicitacionesFinal";

let sharedCtx: AudioContext | null = null;
function ctx() {
  const Ctx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  sharedCtx = sharedCtx || new Ctx();
  return sharedCtx;
}
function playClick() {
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.value = 700;
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.07);
  } catch {
    /* noop */
  }
}
function playVictoria() {
  try {
    const c = ctx();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = c.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {
    /* noop */
  }
}
function playError() {
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.3);
  } catch {
    /* noop */
  }
}

export default function AhorcadoGame({
  activityId,
  moduleNumber,
  moduleTitle,
}: {
  activityId: string;
  moduleNumber: number;
  moduleTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const viewerMode = useViewerMode();
  const [screen, setScreen] = useState<Screen>("instrucciones");
  const [nivelIndex, setNivelIndex] = useState(0);
  const [reveladas, setReveladas] = useState<Set<string>>(new Set());
  const [intentadas, setIntentadas] = useState<Set<string>>(new Set());
  const [vidas, setVidas] = useState(3);
  const [letra, setLetra] = useState("");
  const [showAbandon, setShowAbandon] = useState(false);
  const musicRef = useRef<{ stop: boolean }>({ stop: false });
  const [nextActivity, setNextActivity] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function loadNext() {
      const { data } = await supabase.from("activities").select("unit_id, order_index").eq("id", activityId).single();
      if (data?.unit_id != null) {
        const next = await getNextActivity(supabase, data.unit_id, data.order_index);
        setNextActivity(next);
      }
    }
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nivel = NIVELES[nivelIndex];

  function iniciarMusica() {
    const state = musicRef.current;
    state.stop = false;
    const melodia = [392, 440, 349, 392, 330, 349, 294, 330];
    let i = 0;
    function loop() {
      if (state.stop) return;
      try {
        const c = ctx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.value = melodia[i % melodia.length];
        gain.gain.setValueAtTime(0.0001, c.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.52);
      } catch {
        /* noop */
      }
      i++;
      setTimeout(loop, 550);
    }
    loop();
  }

  useEffect(() => {
    return () => {
      musicRef.current.stop = true;
    };
  }, []);

  function handleIniciar() {
    playClick();
    iniciarMusica();
    setScreen("nivel");
  }

  async function handleAdivinar() {
    const l = letra.trim().toUpperCase();
    setLetra("");
    if (!l || intentadas.has(l)) return;
    playClick();
    const nuevasIntentadas = new Set(intentadas);
    nuevasIntentadas.add(l);
    setIntentadas(nuevasIntentadas);

    if (nivel.palabra.includes(l)) {
      const nuevasReveladas = new Set(reveladas);
      nuevasReveladas.add(l);
      setReveladas(nuevasReveladas);
      const completa = nivel.palabra.split("").every((ch) => nuevasReveladas.has(ch));
      if (completa) {
        playVictoria();
        musicRef.current.stop = true;
        if (nivelIndex + 1 >= NIVELES.length) {
          const { error } = viewerMode.preview ? { error: null } : await supabase.rpc("complete_activity", { _activity_id: activityId });
          if (error) console.error("No se pudo marcar el Ahorcado como completado:", error);
          setScreen("felicitacionesFinal");
        } else {
          setScreen("felicitacionesNivel");
        }
      }
    } else {
      playError();
      const nuevasVidas = vidas - 1;
      setVidas(nuevasVidas);
      if (nuevasVidas <= 0) {
        musicRef.current.stop = true;
        setScreen("perdiste");
      }
    }
  }

  function handleReintentar() {
    setVidas(3);
    setReveladas(new Set());
    setIntentadas(new Set());
    iniciarMusica();
    setScreen("nivel");
  }

  function handleSiguienteNivel() {
    setVidas(3);
    setReveladas(new Set());
    setIntentadas(new Set());
    setNivelIndex((i) => i + 1);
    iniciarMusica();
    setScreen("nivel");
  }

  function volverAlMapa() {
    musicRef.current.stop = true;
    router.push(mapHref(viewerMode));
  }

  const headerEl = (
    <ActivityHeader
      moduleNumber={moduleNumber}
      moduleTitle={moduleTitle}
      title="Juego del Ahorcado"
      onBack={() => setShowAbandon(true)}
    />
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--shell-h)] z-[100] flex items-center justify-center bg-black/45 p-4">
      <div
        className="relative h-full max-h-full w-full max-w-3xl overflow-y-auto rounded-[28px] border-4 border-lime-500 p-6 pt-16 shadow-2xl"
        style={{
          backgroundImage: "url(/illustrations/valle-fondo.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {headerEl}
        <span className="mosquito-fly-ahorcado absolute text-xl" aria-hidden>
          🦟
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/actividad8-heroe-de-pie-hd.png"
          alt=""
          className="pointer-events-none absolute right-3 top-14 hidden w-20 drop-shadow-xl sm:block sm:w-24"
          style={{ animation: "heroeFloatAhorcado 3s ease-in-out infinite" }}
        />

        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <EducateLogo />

          {screen === "instrucciones" && (
            <div className="mt-6 rounded-[24px] bg-white/95 p-6 shadow-xl">
              <div className="mb-2 text-5xl">🎪</div>
              <p className="text-sm font-bold leading-relaxed" style={{ color: "#3d2c18" }}>
                Estimado candidato antidengue, estás a punto de ingresar al reto el cual corresponde
                a un juego de ahorcado donde deberás encontrar las 3 palabras ocultas. Recuerda que
                por cada nivel tienes 3 intentos. Pulsa el botón continuar para iniciar.
              </p>
              <button
                onClick={handleIniciar}
                className="mt-5 rounded-full bg-orange-500 px-8 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
              >
                Continuar
              </button>
            </div>
          )}

          {screen === "nivel" && (
            <div className="mt-6 w-full rounded-[26px] bg-white/96 p-6 shadow-xl">
              <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: "#9333ea" }}>
                Nivel {nivelIndex + 1} de {NIVELES.length}
              </p>
              <p className="mt-2 text-sm font-bold leading-relaxed" style={{ color: "#3d2c18" }}>
                {nivel.pista}
              </p>

              {/* palabra oculta: fichas moradas para letras reveladas, raya para las ocultas */}
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {nivel.palabra.split("").map((ch, i) =>
                  reveladas.has(ch) ? (
                    <span
                      key={i}
                      className="flex h-9 w-8 items-center justify-center rounded-lg text-lg font-extrabold text-white sm:h-10 sm:w-9"
                      style={{
                        background: "linear-gradient(160deg,#a855f7,#7e22ce)",
                        boxShadow: "0 3px 0 #5b1a99",
                      }}
                    >
                      {ch}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className="flex h-9 w-8 items-end justify-center border-b-4 pb-0.5 text-lg font-extrabold sm:h-10 sm:w-9"
                      style={{ borderColor: "#9333ea", color: "transparent" }}
                    >
                      {ch}
                    </span>
                  )
                )}
              </div>

              {/* vidas */}
              <div className="mt-5">
                <p className="mb-1 text-[11px] font-extrabold" style={{ color: "#5a3a1a" }}>
                  Vidas
                </p>
                <div className="mx-auto flex justify-center gap-2 text-2xl">
                  {[0, 1, 2].map((i) => (
                    <span key={i}>{i < vidas ? "💚" : "🤍"}</span>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdivinar();
                }}
                className="mt-5 flex items-center justify-center gap-2"
              >
                <input
                  value={letra}
                  onChange={(e) => setLetra(e.target.value.slice(0, 1))}
                  maxLength={1}
                  className="h-11 w-14 rounded-lg border-2 border-purple-300 text-center text-xl font-extrabold uppercase"
                  style={{ color: "#2b1055" }}
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
                >
                  Adivinar
                </button>
              </form>

              {intentadas.size > 0 && (
                <p className="mt-3 text-[11px] font-bold text-gray-500">
                  Letras intentadas: {Array.from(intentadas).join(", ")}
                </p>
              )}
            </div>
          )}

          {screen === "perdiste" && (
            <div className="mt-6 rounded-[24px] bg-white/95 p-8 shadow-xl">
              <div className="text-6xl">💀</div>
              <h2 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#b91c1c" }}>
                Perdiste
              </h2>
              <p className="mt-2 text-sm font-bold" style={{ color: "#5a3a1a" }}>
                La palabra era: {nivel.palabra}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleReintentar}
                  className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
                >
                  Reintentar
                </button>
                <button
                  onClick={volverAlMapa}
                  className="rounded-full bg-gray-500 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
                >
                  Salir
                </button>
              </div>
            </div>
          )}

          {screen === "felicitacionesNivel" && (
            <div className="mt-6 rounded-[24px] bg-white/95 p-8 shadow-xl">
              <div className="text-6xl">🎉</div>
              <h2 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#2E6B2A" }}>
                ¡Felicitaciones!
              </h2>
              <p className="mt-2 text-sm font-bold" style={{ color: "#5a3a1a" }}>
                Superaste el nivel {nivelIndex + 1}.
              </p>
              <button
                onClick={handleSiguienteNivel}
                className="mt-5 rounded-full bg-emerald-600 px-8 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
              >
                Continuar
              </button>
            </div>
          )}

          {screen === "felicitacionesFinal" && (
            <div className="mt-6 rounded-[24px] bg-white/95 p-8 shadow-xl">
              <div className="text-6xl">🏆</div>
              <h2 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#2E6B2A" }}>
                ¡Felicitaciones, superaste el reto completo!
              </h2>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {nextActivity && (
                  <button
                    onClick={() => router.push(`${viewerMode.base}/actividades/${nextActivity.id}`)}
                    className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
                  >
                    Continuar a la siguiente actividad
                  </button>
                )}
                <button
                  onClick={volverAlMapa}
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
                >
                  Volver al mapa
                </button>
              </div>
            </div>
          )}
        </div>

        {showAbandon && (
          <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[28px] bg-black/35 p-5">
            <div className="w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl">
              <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">
                ¿Salir de la actividad?
              </div>
              <div className="bg-lime-500 px-5 py-6 text-center">
                <p className="mb-5 font-extrabold text-white">Vas a volver al mapa de aventura.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={volverAlMapa}
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
      </div>

      <style jsx global>{`
        @keyframes heroeFloatAhorcado {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes mosquitoFlyAhorcado {
          0% { left: 8%; top: 12%; }
          33% { left: 80%; top: 8%; }
          66% { left: 70%; top: 60%; }
          100% { left: 8%; top: 12%; }
        }
        .mosquito-fly-ahorcado { animation: mosquitoFlyAhorcado 12s linear infinite; }
      `}</style>
    </div>
  );
}
