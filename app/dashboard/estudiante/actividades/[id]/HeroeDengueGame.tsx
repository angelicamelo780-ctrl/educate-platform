"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { getNextActivity } from "@/lib/nextActivity";
import ActivityHeader from "@/components/ActivityHeader";

type Screen = "portada" | "contexto" | "juego" | "correcto" | "incorrecto" | "revelado" | "resultados";

type Ronda = {
  objetivo: string;
  hints: string[];
  exito: string;
};

const RONDAS: Ronda[] = [
  {
    objetivo: "balde",
    hints: [
      "Siempre están contigo para jugar y hacer tus momentos más divertidos.",
      "Los usamos para tomar agua, pueden ser peligrosos.",
      "¡Toby necesita un baño! Busca el objeto donde recogemos agua para bañarlo.",
    ],
    exito:
      "¡Muy bien! Los baldes nos ayudan a recoger agua para lavar la ropa y darle de beber a nuestra mascota, pero si no los limpiamos y los dejamos boca abajo, pueden atraer a los mosquitos.",
  },
  {
    objetivo: "llanta",
    hints: ["Ruedan y ruedan... ¡y nos encanta jugar con ellas!"],
    exito:
      "¡Muy bien! Las llantas suelen acumular grandes depósitos de mosquitos, por lo tanto es importante limpiarlas constantemente y cubrirlas.",
  },
  {
    objetivo: "caneca",
    hints: ["Todos los días la sacamos y la guardamos en bolsas para que la casa esté limpia."],
    exito:
      "¡Muy bien! La basura debe estar en el lugar indicado, cubierta y sin depósitos de agua para evitar que los mosquitos depositen sus huevos.",
  },
  {
    objetivo: "lavadero",
    hints: ["La usamos para lavar la ropa y dejarla limpia y lista para usar."],
    exito: "¡Muy bien! Las albercas son importantes; hay que limpiarlas con jabón y cepillo para proteger a nuestras familias.",
  },
];

// Posiciones (en % del ancho/alto de la imagen de fondo del patio) de cada
// objeto clickeable. "lavadero" usa el cajón gris junto a la casa.
const OBJETOS: { id: string; left: number; top: number; label: string }[] = [
  { id: "lavadero", left: 16.8, top: 52.1, label: "Cajón gris junto a la casa" },
  { id: "balde", left: 23.2, top: 61, label: "Balde verde" },
  { id: "botas", left: 15.6, top: 78.9, label: "Botas" },
  { id: "camion", left: 25.4, top: 92.6, label: "Camión de juguete" },
  { id: "caneca", left: 62.3, top: 49.9, label: "Caneca de basura" },
  { id: "pelota", left: 59.6, top: 65.5, label: "Pelota" },
  { id: "botella", left: 76, top: 55.4, label: "Botella plástica" },
  { id: "comedero", left: 81.4, top: 69.5, label: "Comedero del perro" },
  { id: "bloques", left: 83.3, top: 79.6, label: "Bloques" },
  { id: "llanta", left: 57.9, top: 83.3, label: "Llanta" },
];

const MAX_POR_RONDA = 15;
const PUNTOS_POR_INTENTO = [15, 10, 5]; // 1er, 2do, 3er intento
const PUNTAJE_MAXIMO = RONDAS.length * MAX_POR_RONDA; // 60
const UMBRAL_APROBACION = 50; // 83.33%

function progressKey(activityId: string) {
  return `heroe-dengue-progress-${activityId}`;
}

function playTone(freqs: number[], type: OscillatorType = "sine") {
  try {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new Ctx();
    freqs.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } catch {
    /* noop */
  }
}

const FAIL_MESSAGES = [
  "¡FALLASTE! Tienes otra oportunidad. ¡Tú puedes lograrlo!",
  "¡INCORRECTO! No elegiste la respuesta correcta. ¡Inténtalo de nuevo!",
];

// Envuelve TODAS las pantallas del juego con el mismo fondo del valle que
// usan las demás actividades (en vez de un degradado propio).
function Marco({ children, headerEl }: { children: React.ReactNode; headerEl: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--shell-h)] z-[100] flex items-center justify-center bg-black/45 p-4">
      <div
        className="relative h-full max-h-full w-full max-w-5xl overflow-hidden rounded-[28px] border-4 border-lime-500 shadow-2xl"
        style={{
          backgroundImage: "url(/illustrations/valle-fondo.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: 24,
        }}
      >
        {headerEl}
        <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-y-auto pt-14">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HeroeDengueGame({
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
  const [screen, setScreen] = useState<Screen>("portada");
  const [askContinue, setAskContinue] = useState(false);
  const [rondaIndex, setRondaIndex] = useState(0);
  const [intento, setIntento] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [showAbandon, setShowAbandon] = useState(false);
  const [flying, setFlying] = useState(false);
  const [nextActivity, setNextActivity] = useState<{ id: string; title: string } | null>(null);
  const musicRef = useRef<{ stop: boolean }>({ stop: false });

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

  useEffect(() => {
    const saved = window.localStorage.getItem(progressKey(activityId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { rondaIndex: number; puntaje: number };
        if (parsed.rondaIndex > 0 && parsed.rondaIndex < RONDAS.length) {
          setAskContinue(true);
        }
      } catch {
        /* progreso corrupto, se ignora */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function guardarProgreso(nuevaRonda: number, nuevoPuntaje: number) {
    window.localStorage.setItem(progressKey(activityId), JSON.stringify({ rondaIndex: nuevaRonda, puntaje: nuevoPuntaje }));
  }

  function handleContinuarSi() {
    const saved = window.localStorage.getItem(progressKey(activityId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { rondaIndex: number; puntaje: number };
        setRondaIndex(parsed.rondaIndex);
        setPuntaje(parsed.puntaje);
      } catch {
        /* nada */
      }
    }
    setAskContinue(false);
    setScreen("contexto");
  }

  function handleContinuarNo() {
    window.localStorage.removeItem(progressKey(activityId));
    setRondaIndex(0);
    setPuntaje(0);
    setIntento(0);
    setAskContinue(false);
    setScreen("contexto");
  }

  function reiniciarTodo() {
    window.localStorage.removeItem(progressKey(activityId));
    setRondaIndex(0);
    setPuntaje(0);
    setIntento(0);
    setFlying(false);
    setScreen("portada");
  }

  async function handleClickObjeto(objId: string) {
    if (screen !== "juego") return;
    const ronda = RONDAS[rondaIndex];
    if (objId === ronda.objetivo) {
      const puntos = PUNTOS_POR_INTENTO[Math.min(intento, PUNTOS_POR_INTENTO.length - 1)];
      const nuevoPuntaje = puntaje + puntos;
      playTone([523.25, 659.25, 783.99, 1046.5], "triangle");
      setPuntaje(nuevoPuntaje);
      setScreen("correcto");
      guardarProgreso(rondaIndex + 1, nuevoPuntaje);
    } else {
      playTone([220, 160], "sawtooth");
      const nuevoIntento = intento + 1;
      setIntento(nuevoIntento);
      setScreen(nuevoIntento >= 3 ? "revelado" : "incorrecto");
    }
  }

  async function avanzarRonda() {
    setIntento(0);
    if (rondaIndex + 1 >= RONDAS.length) {
      const aprobado = puntaje >= UMBRAL_APROBACION;
      if (aprobado) {
        const { error } = viewerMode.preview ? { error: null } : await supabase.rpc("complete_activity", { _activity_id: activityId });
        if (error) console.error("No se pudo marcar Actividad 8 como completada:", error);
        setFlying(true);
      }
      window.localStorage.removeItem(progressKey(activityId));
      setScreen("resultados");
    } else {
      setRondaIndex((i) => i + 1);
      setScreen("juego");
    }
  }

  function volverAlMapa() {
    router.push(mapHref(viewerMode));
  }

  const headerEl = (
    <ActivityHeader
      moduleNumber={moduleNumber}
      moduleTitle={moduleTitle}
      title="Soy un héroe contra el dengue"
      onBack={() => setShowAbandon(true)}
    />
  );

  const ronda = RONDAS[rondaIndex];
  const pct = Math.round((puntaje / PUNTAJE_MAXIMO) * 10000) / 100;
  const aprobado = puntaje >= UMBRAL_APROBACION;

  return (
    <Marco headerEl={headerEl}>
      {screen === "portada" && !askContinue && (
        <div className="relative flex w-full items-center justify-center">
          <div className="text-center">
            <h1 className="mb-1 text-2xl font-extrabold text-white drop-shadow sm:text-3xl" style={{ fontFamily: "var(--font-baloo)" }}>
              Edúcate contra el dengue 🦟
            </h1>
            <h2 className="mb-6 text-xl font-extrabold text-emerald-900 sm:text-2xl" style={{ fontFamily: "var(--font-baloo)" }}>
              Soy un héroe contra el dengue
            </h2>
            <button
              onClick={() => setScreen("contexto")}
              className="rounded-full px-10 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                fontFamily: "var(--font-baloo)",
                background: "linear-gradient(180deg,#ffb04d,#f97316)",
                boxShadow: "0 6px 0 #c2570c, 0 10px 18px rgba(0,0,0,0.25)",
              }}
            >
              COMENZAR
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/actividad8-heroe-de-pie-hd.png"
            alt=""
            className="pointer-events-none absolute right-2 top-2 hidden w-32 drop-shadow-xl sm:block sm:w-40"
            style={{ animation: "heroeFloat 3s ease-in-out infinite" }}
          />
        </div>
      )}

      {askContinue && (
        <div className="mx-auto max-w-xs overflow-hidden rounded-2xl shadow-2xl">
          <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">Continuar</div>
          <div className="bg-lime-500 px-5 py-6 text-center">
            <p className="mb-5 font-extrabold text-white">¿Quieres continuar donde te quedaste?</p>
            <div className="flex justify-center gap-3">
              <button onClick={handleContinuarSi} className="rounded-lg border-2 border-lime-800 bg-lime-700 px-6 py-1.5 text-sm font-bold text-white hover:bg-lime-800">
                Sí
              </button>
              <button onClick={handleContinuarNo} className="rounded-lg border-2 border-lime-800 bg-lime-700 px-6 py-1.5 text-sm font-bold text-white hover:bg-lime-800">
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "contexto" && (
        <div className="relative w-full">
          <div className="mx-auto max-w-lg rounded-[28px] bg-white/95 p-6 text-center shadow-xl sm:p-8">
            <p className="text-sm font-bold leading-relaxed" style={{ color: "#2f5a35" }}>
              En el capítulo 6, los niños iniciaron un plan de exterminio que consistía en evitar
              que los mosquitos se criaran en los depósitos de agua dentro del hogar. De acuerdo
              con este plan, vamos a jugar a &quot;Soy un héroe contra el dengue&quot;. El juego
              consiste en hacer clic en las zonas de tu casa que debemos limpiar para evitar que
              los mosquitos pongan sus crías. ¡Protege a tu familia!
            </p>
            <button
              onClick={() => setScreen("juego")}
              className="mt-6 rounded-full px-10 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                fontFamily: "var(--font-baloo)",
                background: "linear-gradient(180deg,#ffb04d,#f97316)",
                boxShadow: "0 6px 0 #c2570c, 0 10px 18px rgba(0,0,0,0.25)",
              }}
            >
              JUGAR
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/actividad8-heroe-saludo-hd.png"
            alt=""
            className="pointer-events-none absolute -bottom-2 left-2 hidden w-32 drop-shadow-xl sm:block sm:w-40"
            style={{ animation: "heroeWave 1.8s ease-in-out infinite", transformOrigin: "bottom center" }}
          />
        </div>
      )}

      {screen === "juego" && (
        <div className="w-full">
          <div className="mx-auto mb-2 flex max-w-md items-start gap-2 rounded-2xl bg-white/90 px-4 py-2.5 shadow">
            <span className="text-2xl">🦉</span>
            <p className="text-left text-xs font-bold leading-snug" style={{ color: "#5a3a1a" }}>
              <span className="font-extrabold">Pista:</span> {ronda.hints[Math.min(intento, ronda.hints.length - 1)]}
            </p>
          </div>

          <div
            className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border-4 border-white/80 shadow-lg"
            style={{
              aspectRatio: "1573 / 672",
              backgroundImage: "url(/illustrations/actividad8-fondo.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <span className="mosquito-fly-8 absolute text-xl sm:text-2xl" aria-hidden>
              🦟
            </span>

            {OBJETOS.map((obj) => (
              <button
                key={obj.id}
                onClick={() => handleClickObjeto(obj.id)}
                aria-label={obj.label}
                className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-125 hover:bg-white/25 active:scale-95 sm:h-14 sm:w-14"
                style={{ left: `${obj.left}%`, top: `${obj.top}%` }}
              />
            ))}
          </div>

          <p className="mx-auto mt-3 max-w-md text-center text-xs font-extrabold text-white drop-shadow">
            Haz clic en la imagen correcta y sabrás de inmediato si acertaste. ¡Tienes {3 - intento} {3 - intento === 1 ? "intento" : "intentos"}!
          </p>
          <p className="mx-auto mt-1 max-w-md text-center text-[11px] font-bold text-white drop-shadow">
            Ronda {rondaIndex + 1} de {RONDAS.length}
          </p>
        </div>
      )}

      {screen === "incorrecto" && (
        <div className="mx-auto max-w-sm rounded-[28px] bg-white/95 p-8 text-center shadow-xl">
          <div className="text-6xl">😟</div>
          <div className="mx-auto -mt-3 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-2xl font-extrabold text-white shadow">
            ✕
          </div>
          <h2 className="text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#b91c1c" }}>
            {FAIL_MESSAGES[intento % FAIL_MESSAGES.length]}
          </h2>
          <button onClick={() => setScreen("juego")} className="mt-5 rounded-full bg-orange-500 px-8 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105">
            CONTINUAR
          </button>
        </div>
      )}

      {screen === "revelado" && (
        <div className="mx-auto max-w-sm rounded-[28px] bg-white/95 p-8 text-center shadow-xl">
          <div className="text-6xl">😟</div>
          <h2 className="mt-2 text-lg font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#b91c1c" }}>
            Usaste tus 3 intentos en esta ronda
          </h2>
          <p className="mt-2 text-sm font-bold" style={{ color: "#5a3a1a" }}>
            {ronda.exito}
          </p>
          <button onClick={avanzarRonda} className="mt-5 rounded-full bg-orange-500 px-8 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105">
            CONTINUAR
          </button>
        </div>
      )}

      {screen === "correcto" && (
        <div className="mx-auto max-w-sm rounded-[28px] bg-white/95 p-8 text-center shadow-xl">
          <div className="text-6xl">🙋‍♀️</div>
          <div className="mx-auto -mt-3 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-2xl font-extrabold text-white shadow">
            ✔
          </div>
          <h2 className="text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#2E6B2A" }}>
            ¡RESPUESTA CORRECTA!
          </h2>
          <p className="mt-2 text-sm font-bold" style={{ color: "#5a3a1a" }}>
            {ronda.exito}
          </p>
          <button onClick={avanzarRonda} className="mt-5 rounded-full bg-emerald-600 px-8 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105">
            CONTINUAR
          </button>
        </div>
      )}

      {screen === "resultados" && (
        <div className="relative mx-auto max-w-md rounded-[28px] bg-white/95 p-8 text-center shadow-xl">
          <div className="text-6xl">{aprobado ? "🏆" : "🎈"}</div>
          <p className="mt-1 text-4xl">🎉👦🧒👧🎉</p>
          <h2 className="mt-3 text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: "#2E6B2A" }}>
            {aprobado ? "¡Felicitaciones, aprobaste!" : "Casi lo logras"}
          </h2>
          <div className="mt-3 space-y-1 text-sm font-bold" style={{ color: "#5a3a1a" }}>
            <p>
              Puntaje de aprobación: {Math.round((UMBRAL_APROBACION / PUNTAJE_MAXIMO) * 10000) / 100}% ({UMBRAL_APROBACION} puntos)
            </p>
            <p>
              Tu puntuación: {pct}% ({puntaje} puntos)
            </p>
            <p>Resultado: {aprobado ? "✅ Felicitaciones, aprobaste." : "❌ Aún no alcanzas el puntaje mínimo."}</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {aprobado && nextActivity && (
              <button
                onClick={() => router.push(`${viewerMode.base}/actividades/${nextActivity.id}`)}
                className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105"
              >
                CONTINUAR A LA SIGUIENTE ACTIVIDAD
              </button>
            )}
            {!aprobado && (
              <button onClick={reiniciarTodo} className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105">
                INTENTAR DE NUEVO
              </button>
            )}
            <button onClick={volverAlMapa} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow transition-transform hover:scale-105">
              SALIR
            </button>
          </div>
          {aprobado && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/illustrations/actividad8-heroe-de-pie-hd.png"
              alt=""
              className={`pointer-events-none absolute -right-4 -top-8 w-24 ${flying ? "avatar-fly-away" : ""}`}
            />
          )}
        </div>
      )}

      {showAbandon && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[28px] bg-black/35 p-5">
          <div className="w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">¿Salir de la actividad?</div>
            <div className="bg-lime-500 px-5 py-6 text-center">
              <p className="mb-5 font-extrabold text-white">Tu progreso de esta ronda se guarda. Puedes continuar más tarde.</p>
              <div className="flex justify-center gap-3">
                <button onClick={volverAlMapa} className="rounded-lg border-2 border-lime-800 bg-lime-700 px-5 py-1.5 text-sm font-bold text-white hover:bg-lime-800">
                  Salir
                </button>
                <button onClick={() => setShowAbandon(false)} className="rounded-lg border-2 border-lime-800 bg-lime-700 px-5 py-1.5 text-sm font-bold text-white hover:bg-lime-800">
                  Seguir aquí
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes heroeFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes heroeWave {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes mosquitoFly8 {
          0% { left: 12%; top: 15%; }
          25% { left: 68%; top: 10%; }
          50% { left: 82%; top: 55%; }
          75% { left: 35%; top: 60%; }
          100% { left: 12%; top: 15%; }
        }
        .mosquito-fly-8 { animation: mosquitoFly8 14s linear infinite; }
        @keyframes avatarFlyAway {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(160px, -240px) scale(0.25) rotate(15deg); opacity: 0; }
        }
        .avatar-fly-away { animation: avatarFlyAway 1.8s ease-in forwards; animation-delay: 0.6s; }
      `}</style>
    </Marco>
  );
}
