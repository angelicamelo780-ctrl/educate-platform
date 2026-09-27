"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { getNextActivity } from "@/lib/nextActivity";
import ActivityHeader from "@/components/ActivityHeader";
import { EducateLogo } from "@/components/Mosquito";

const SIZE = 15;
const WORDS: { display: string; grid: string }[] = [
  { display: "FIEBRE", grid: "FIEBRE" },
  { display: "VÓMITO", grid: "VOMITO" },
  { display: "DOLORMUSCULAR", grid: "DOLORMUSCULAR" },
  { display: "DOLORARTICULAR", grid: "DOLORARTICULAR" },
  { display: "MALESTARGENERAL", grid: "MALESTARGENERAL" },
  { display: "FALTADEAPETITO", grid: "FALTADEAPETITO" },
  { display: "DOLORDECABEZA", grid: "DOLORDECABEZA" },
  { display: "HEMORRAGIAS", grid: "HEMORRAGIAS" },
];
const COLORES = ["#39e75f", "#f0923c", "#4fa6d9", "#a855f7", "#f0c93c"];

type Cell = { row: number; col: number };

function generarGrid(): string[][] {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let intento = 0; intento < 60; intento++) {
    const grid: (string | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    const ordenadas = [...WORDS].sort((a, b) => b.grid.length - a.grid.length);
    let ok = true;
    for (const w of ordenadas) {
      let colocada = false;
      for (let t = 0; t < 400; t++) {
        const dir = Math.random() < 0.5 ? "H" : "V";
        const len = w.grid.length;
        if (dir === "H" && len > SIZE) continue;
        if (dir === "V" && len > SIZE) continue;
        const row = dir === "H" ? Math.floor(Math.random() * SIZE) : Math.floor(Math.random() * (SIZE - len + 1));
        const col = dir === "H" ? Math.floor(Math.random() * (SIZE - len + 1)) : Math.floor(Math.random() * SIZE);
        let cabe = true;
        for (let i = 0; i < len; i++) {
          const r = dir === "H" ? row : row + i;
          const c = dir === "H" ? col + i : col;
          const existente = grid[r][c];
          if (existente && existente !== w.grid[i]) {
            cabe = false;
            break;
          }
        }
        if (cabe) {
          for (let i = 0; i < len; i++) {
            const r = dir === "H" ? row : row + i;
            const c = dir === "H" ? col + i : col;
            grid[r][c] = w.grid[i];
          }
          colocada = true;
          break;
        }
      }
      if (!colocada) {
        ok = false;
        break;
      }
    }
    if (ok) {
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) if (!grid[r][c]) grid[r][c] = letras[Math.floor(Math.random() * 26)];
      return grid as string[][];
    }
  }
  // Respaldo (muy improbable llegar aquí): grid solo con letras al azar.
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => letras[Math.floor(Math.random() * 26)]));
}

function playClick() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new Ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.06);
  } catch {
    /* noop */
  }
}
function playVictoria() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new Ctx();
    [659.25, 783.99, 987.77].forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = c.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {
    /* noop */
  }
}
function playError() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new Ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.3);
  } catch {
    /* noop */
  }
}

export default function SopaLetrasGame({
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
  const [screen, setScreen] = useState<"portada" | "juego" | "final">("portada");
  const [grid, setGrid] = useState<string[][] | null>(null);
  const [seleccion, setSeleccion] = useState<Cell[]>([]);
  const [encontradas, setEncontradas] = useState<Record<string, string>>({}); // grid word -> color
  const [errorCells, setErrorCells] = useState<Cell[]>([]);
  const [showAbandon, setShowAbandon] = useState(false);
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

  useEffect(() => {
    setGrid(generarGrid());
  }, []);

  const restantes = WORDS.length - Object.keys(encontradas).length;

  function volverAlMapa() {
    router.push(mapHref(viewerMode));
  }

  function celdaIgual(a: Cell, b: Cell) {
    return a.row === b.row && a.col === b.col;
  }

  function direccionEntre(a: Cell, b: Cell): Cell | null {
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    if (dr === 0 && dc === 0) return null;
    if (dr !== 0 && dc !== 0) return null; // solo horizontal o vertical
    return { row: Math.sign(dr), col: Math.sign(dc) };
  }

  function handleClickCelda(row: number, col: number) {
    if (!grid || screen !== "juego") return;
    const celda = { row, col };
    playClick();

    setSeleccion((prev) => {
      if (prev.length === 0) return [celda];
      if (prev.length === 1) {
        const dir = direccionEntre(prev[0], celda);
        const esAdyacente =
          dir && Math.abs(celda.row - prev[0].row) <= 1 && Math.abs(celda.col - prev[0].col) <= 1;
        return esAdyacente ? [...prev, celda] : [celda];
      }
      const dir = direccionEntre(prev[0], prev[1]);
      const esperada = { row: prev[prev.length - 1].row + (dir?.row ?? 0), col: prev[prev.length - 1].col + (dir?.col ?? 0) };
      return celdaIgual(esperada, celda) ? [...prev, celda] : [celda];
    });
  }

  // Cada vez que cambia la selección (después de un clic), revisamos si ya
  // forma una palabra completa o un error — separado del setSeleccion de
  // arriba para no mezclar efectos secundarios (sonido, guardar en el
  // servidor) dentro de una función de actualización de estado.
  useEffect(() => {
    if (!grid || seleccion.length === 0) return;
    const texto = seleccion.map((c) => grid[c.row][c.col]).join("");
    const match = WORDS.find((w) => w.grid === texto && !encontradas[w.grid]);

    if (match) {
      const color = COLORES[Object.keys(encontradas).length % COLORES.length];
      playVictoria();
      const next = { ...encontradas, [match.grid]: color };
      setEncontradas(next);
      setSeleccion([]);
      if (Object.keys(next).length === WORDS.length) {
        (async () => {
          const { error } = viewerMode.preview ? { error: null } : await supabase.rpc("complete_activity", { _activity_id: activityId });
          if (error) console.error("No se pudo marcar la Sopa de letras como completada:", error);
          setTimeout(() => setScreen("final"), 600);
        })();
      }
      return;
    }

    const esPrefijo = WORDS.some((w) => !encontradas[w.grid] && w.grid.startsWith(texto));
    if (!esPrefijo && texto.length >= 3) {
      playError();
      setErrorCells(seleccion);
      setSeleccion([]);
      const t = setTimeout(() => setErrorCells([]), 2000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion]);

  const seleccionadasSet = useMemo(() => new Set(seleccion.map((c) => `${c.row}-${c.col}`)), [seleccion]);
  const errorSet = useMemo(() => new Set(errorCells.map((c) => `${c.row}-${c.col}`)), [errorCells]);
  // Mapa celda -> color de palabra encontrada (para pintar cada letra que forma parte de una palabra ya hallada).
  const coloreadas = useMemo(() => {
    const map = new Map<string, string>();
    if (!grid) return map;
    // Reconstruimos qué celdas pertenecen a cada palabra encontrada recorriendo el grid.
    for (const [gridWord, color] of Object.entries(encontradas)) {
      outer: for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          // horizontal
          if (c + gridWord.length <= SIZE) {
            let ok = true;
            for (let i = 0; i < gridWord.length; i++) if (grid[r][c + i] !== gridWord[i]) { ok = false; break; }
            if (ok) {
              for (let i = 0; i < gridWord.length; i++) map.set(`${r}-${c + i}`, color);
              break outer;
            }
          }
          // vertical
          if (r + gridWord.length <= SIZE) {
            let ok = true;
            for (let i = 0; i < gridWord.length; i++) if (grid[r + i][c] !== gridWord[i]) { ok = false; break; }
            if (ok) {
              for (let i = 0; i < gridWord.length; i++) map.set(`${r + i}-${c}`, color);
              break outer;
            }
          }
        }
      }
    }
    return map;
  }, [grid, encontradas]);

  const headerEl = (
    <ActivityHeader
      moduleNumber={moduleNumber}
      moduleTitle={moduleTitle}
      title="Sopa de letras"
      onBack={() => setShowAbandon(true)}
    />
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--shell-h)] z-[100] flex items-center justify-center bg-black/60 p-4">
      <div
        className="relative h-full max-h-full w-full max-w-4xl overflow-y-auto rounded-[28px] border-4 border-amber-400 p-6 pt-16 shadow-2xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(255,209,102,.18), transparent 55%), url(/illustrations/escena-nocturna.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {headerEl}
        {[
          { left: "8%", top: "18%", delay: "0s" },
          { left: "16%", top: "50%", delay: ".6s" },
          { left: "88%", top: "28%", delay: "1.1s" },
        ].map((s, i) => (
          <span key={i} className="glow-star absolute text-base" style={{ left: s.left, top: s.top, animationDelay: s.delay }}>
            ✨
          </span>
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/actividad8-heroe-de-pie-hd.png"
          alt=""
          className="pointer-events-none absolute right-3 top-14 hidden w-20 drop-shadow-xl sm:block sm:w-24"
          style={{ animation: "heroeFloatSopa 3s ease-in-out infinite", filter: "drop-shadow(0 0 12px rgba(255,209,102,.6))" }}
        />

        {screen === "portada" && (
          <div className="mx-auto max-w-md text-center">
            <EducateLogo />
            <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#ffd166" }}>
              ⚡ Último reto ⚡
            </p>
            <h1 className="mt-1 text-lg font-extrabold text-white drop-shadow" style={{ fontFamily: "var(--font-baloo)" }}>
              Estás a un paso de ser un Agente Antidengue
            </h1>
            <p className="mt-4 rounded-2xl bg-white/95 p-4 text-sm font-bold leading-relaxed" style={{ color: "#5a3a1a" }}>
              El doctor Alberto explicó los síntomas característicos del dengue. Búscalos en la sopa
              de letras, haz clic sobre las letras para completar la palabra.
            </p>
            <button
              onClick={() => setScreen("juego")}
              className="mt-6 rounded-full px-10 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                fontFamily: "var(--font-baloo)",
                background: "linear-gradient(180deg,#ffd166,#f97316)",
                boxShadow: "0 6px 0 #c2570c, 0 10px 18px rgba(0,0,0,0.25)",
              }}
            >
              Comenzar
            </button>
          </div>
        )}

        {screen === "juego" && grid && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#ffd166" }}>
              ⚡ Último reto ⚡ — Estás a un paso de ser un Agente Antidengue
            </p>
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
              <div
                className="rounded-[20px] p-3 shadow-lg"
                style={{ background: "linear-gradient(160deg,#3a2a1a,#1f150c)", boxShadow: "0 0 0 3px rgba(255,209,102,.5), 0 14px 30px rgba(0,0,0,.5)" }}
              >
                <div
                  className="grid gap-[2px]"
                  style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0,1fr))`, maxWidth: 440 }}
                >
                  {grid.map((fila, r) =>
                    fila.map((letraCell, c) => {
                      const key = `${r}-${c}`;
                      const seleccionada = seleccionadasSet.has(key);
                      const esError = errorSet.has(key);
                      const colorEncontrada = coloreadas.get(key);
                      return (
                        <button
                          key={key}
                          onClick={() => handleClickCelda(r, c)}
                          className="flex aspect-square items-center justify-center rounded-[3px] text-[10px] font-extrabold sm:text-xs"
                          style={{
                            background: esError ? "#ef4444" : colorEncontrada ?? (seleccionada ? "#ffd166" : "#2f4d3a"),
                            color: esError ? "#fff" : colorEncontrada ? "#3d2c18" : seleccionada ? "#3d2c18" : "#eafaf0",
                          }}
                        >
                          {letraCell}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className="w-full max-w-[230px] rounded-lg p-4 shadow-lg"
                style={{
                  background: "#f3e3bd",
                  borderRadius: "8px 24px 8px 24px",
                  boxShadow: "0 14px 30px rgba(0,0,0,.5)",
                }}
              >
                <p className="mb-2 text-xs font-extrabold">🔍 Síntomas ({restantes} por encontrar):</p>
                <ul className="space-y-1.5 text-sm font-bold">
                  {WORDS.map((w) => (
                    <li
                      key={w.grid}
                      className={encontradas[w.grid] ? "line-through" : ""}
                      style={{ color: encontradas[w.grid] ?? "#3d2c18" }}
                    >
                      {w.display}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p
              className="mx-auto max-w-md rounded-full px-4 py-2 text-center text-[11px] font-extrabold"
              style={{ background: "rgba(0,0,0,.35)", color: "#ffe9b0", border: "1px solid rgba(255,209,102,.35)" }}
            >
              🏅 Encuentra las 8 palabras y desbloquea tu insignia de Agente Antidengue
            </p>
          </div>
        )}

        {screen === "final" && (
          <div className="mx-auto max-w-md text-center">
            <EducateLogo />
            <div className="mt-4 text-6xl">🏆</div>
            <h2 className="mt-2 text-xl font-extrabold text-white drop-shadow" style={{ fontFamily: "var(--font-baloo)" }}>
              ¡Has superado el reto!
            </h2>
            <p className="mt-1 text-sm font-extrabold" style={{ color: "#ffd166" }}>
              ¡Felicitaciones, ya eres un Agente Antidengue! 🏅
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
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
        @keyframes heroeFloatSopa {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes glowStar {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .glow-star { animation: glowStar 2.4s ease-in-out infinite; color: #ffd166; }
      `}</style>
    </div>
  );
}
