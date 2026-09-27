"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { getNextActivity } from "@/lib/nextActivity";
import { Mosquito, SquashableMosquito, EducateLogo, CLOUD_GLOBAL_STYLES } from "@/components/Mosquito";
import ActivityHeader from "@/components/ActivityHeader";

type OptionRow = {
  step_id: string;
  step_order: number;
  step_type: "fill_blank_single" | "fill_blank_multi" | "multiple_choice" | "ordering" | "multi_select";
  instruction: string;
  prompt: string;
  option_id: string;
  option_label: string;
  blank_index: number;
};

type Option = { id: string; label: string; blank_index: number };
type Step = {
  id: string;
  order: number;
  type: OptionRow["step_type"];
  instruction: string;
  prompt: string;
  options: Option[];
};

// Mezcla un array (para no mostrar las opciones siempre en el mismo orden).
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  sharedAudioCtx = sharedAudioCtx || new Ctx();
  return sharedAudioCtx;
}

function playOpenTune() {
  try {
    const c = getAudioCtx();
    const melody = [
      { f: 392.0, t: 0.0, d: 0.14 },
      { f: 440.0, t: 0.14, d: 0.14 },
      { f: 493.88, t: 0.28, d: 0.14 },
      { f: 587.33, t: 0.42, d: 0.22 },
      { f: 523.25, t: 0.68, d: 0.14 },
      { f: 659.25, t: 0.82, d: 0.3 },
    ];
    melody.forEach((note) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = note.f;
      const t = c.currentTime + note.t;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + note.d + 0.02);
    });
  } catch {
    // el navegador puede bloquear audio sin interacción previa; no pasa nada
  }
}

function playCorrectSound() {
  try {
    const c = getAudioCtx();
    // Fanfarria alegre: escala ascendente rápida + acorde final brillante,
    // mucho más festiva que un simple "ding" de 3 notas.
    const run = [523.25, 587.33, 659.25, 783.99, 880.0]; // do-re-mi-sol-la
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
    // Acorde final brillante (do-mi-sol-do agudo) para el remate de fiesta.
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
    // Un chispazo agudo tipo "sparkle" encima para dar sensación de fiesta.
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

function playIncorrectSound() {
  try {
    const c = getAudioCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.32);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.33);
  } catch {
    // silencioso
  }
}

// Ilustraciones SVG propias para las opciones de Actividad 1 (en vez de
// emoji planos). Se dibujan a 1em para heredar el tamaño del texto del
// contenedor donde se usen (text-lg, text-4xl, etc.).
const SVG_ICONS: Record<string, string> = {
  Barco:
    '<svg viewBox="0 0 60 60"><path d="M8 38 L52 38 L46 50 L14 50 Z" fill="#D64545"/><rect x="27" y="14" width="4" height="24" fill="#7c4a2d"/><path d="M31 16 L46 30 L31 30 Z" fill="#FFFFFF" stroke="#c9d6e0"/><rect x="14" y="30" width="14" height="8" rx="1" fill="#EAF4FA"/></svg>',
  "Avión":
    '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="30" rx="22" ry="6" fill="#4FA6D9"/><path d="M30 24 L52 30 L30 36 Z" fill="#2E7DAE"/><path d="M20 30 L10 18 L14 30 L10 42 Z" fill="#2E7DAE"/><path d="M44 27 L52 20 L52 27 Z" fill="#cbe4f5"/></svg>',
  Tren:
    '<svg viewBox="0 0 60 60"><rect x="10" y="20" width="34" height="20" rx="4" fill="#D64545"/><rect x="14" y="24" width="10" height="8" rx="1" fill="#FFF7E0"/><rect x="28" y="24" width="10" height="8" rx="1" fill="#FFF7E0"/><rect x="40" y="14" width="10" height="10" rx="2" fill="#a3312c"/><circle cx="18" cy="44" r="4" fill="#2b2118"/><circle cx="34" cy="44" r="4" fill="#2b2118"/><circle cx="46" cy="44" r="4" fill="#2b2118"/></svg>',
  Llanta:
    '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="#2b2118"/><circle cx="30" cy="30" r="10" fill="#6b6152"/><circle cx="30" cy="30" r="4" fill="#2b2118"/></svg>',
  Cama:
    '<svg viewBox="0 0 60 60"><rect x="10" y="34" width="40" height="12" rx="2" fill="#8C5FBF"/><rect x="8" y="44" width="4" height="8" fill="#5b3d80"/><rect x="48" y="44" width="4" height="8" fill="#5b3d80"/><rect x="12" y="22" width="10" height="14" rx="2" fill="#fff"/><rect x="14" y="30" width="34" height="8" rx="2" fill="#FFC94A"/></svg>',
  Armario:
    '<svg viewBox="0 0 60 60"><rect x="14" y="8" width="32" height="46" rx="2" fill="#7c4a2d"/><rect x="17" y="11" width="12" height="40" fill="#9a623f"/><rect x="31" y="11" width="12" height="40" fill="#9a623f"/><circle cx="27" cy="30" r="1.6" fill="#3d2818"/><circle cx="33" cy="30" r="1.6" fill="#3d2818"/></svg>',
};

// Fotos reales (Actividad 2: identificar al Aedes aegypti entre varios
// insectos). Tienen prioridad sobre las ilustraciones SVG y los emoji.
const REAL_PHOTOS: Record<string, string> = {
  Polilla: "/illustrations/bug-polilla.png",
  Mosca: "/illustrations/bug-mosca.png",
  Hormiga: "/illustrations/bug-hormiga.png",
  Escarabajo: "/illustrations/bug-escarabajo.png",
  "Aedes aegypti": "/illustrations/bug-aedes.png",
  Barco: "/illustrations/icon-barco.png",
  "Avión": "/illustrations/icon-avion.png",
  Tren: "/illustrations/icon-tren.png",
  Armario: "/illustrations/icon-armario.png",
  Llanta: "/illustrations/icon-llanta.png",
  Cama: "/illustrations/icon-cama.png",
  // Actividad 5, paso 4 ("El caos"): sueño de la alberca.
  "Sangre humana": "/illustrations/actividad5-sangre.png",
  "Virus del dengue": "/illustrations/actividad5-dengue.png",
  "Productos de limpieza": "/illustrations/actividad5-limpieza.png",
  Alcohol: "/illustrations/actividad5-alcohol.png",
  "Bote de basura": "/illustrations/actividad5-basura.png",
  Frutas: "/illustrations/actividad5-frutas.png",
  // Actividad 4 ("El caos"): las palabras arrastrables también llevan una
  // miniatura de su propia etapa, para reforzar la asociación palabra-imagen.
  Huevo: "/illustrations/actividad4-huevo.png",
  Larva: "/illustrations/actividad4-larva.png",
  Pupa: "/illustrations/actividad4-pupa.png",
  Adulto: "/illustrations/actividad4-adulto.png",
};

// Ícono representativo para las opciones tipo "imagen" (fill_blank_single).
// Si una palabra nueva no está en el mapa, cae a un ícono genérico.
const ICONS: Record<string, string> = {
  Auto: "🚗",
};
function getIcon(label: string) {
  if (REAL_PHOTOS[label]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={REAL_PHOTOS[label]}
        alt={label}
        className="h-[1em] w-[1em] rounded-md object-cover align-middle"
      />
    );
  }
  if (SVG_ICONS[label]) {
    return (
      <span
        className="inline-block h-[1em] w-[1em] align-middle"
        dangerouslySetInnerHTML={{ __html: SVG_ICONS[label] }}
      />
    );
  }
  return ICONS[label] ?? "🖼️";
}
// true si la palabra tiene una imagen o ícono real (no el emoji genérico de
// respaldo). Las opciones que son oraciones largas (sin ícono propio) se
// muestran como texto en vez de con el ícono genérico, que quedaría enorme
// y no dejaría ver la frase.
function hasIcon(label: string) {
  return Boolean(REAL_PHOTOS[label] || SVG_ICONS[label] || ICONS[label]);
}
const CARD_BORDERS = ["border-yellow-400", "border-blue-400", "border-red-400", "border-gray-400"];
const ORDINALS = ["PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO"];

// Ilustraciones reales para los pasos de la Actividad 3 (ordenar la secuencia).
const ORDER_IMAGES: Record<string, string> = {
  "La zancuda picó a los extranjeros.": "/illustrations/paso-barco.png",
  "Los extranjeros enfermos fueron al médico.": "/illustrations/paso-medico.png",
  "La zancuda picó a los pobladores.": "/illustrations/paso-pobladores.png",
  "Los pobladores de Lozanía empezaron a enfermarse.": "/illustrations/paso-enfermos.png",
};

// Actividad 7 ("La batalla final"): texto del popup de "Info", visible en
// todas las pantallas de la actividad. Otras actividades no tienen esta
// clave, así que no aparece el botón para ellas.
const ACTIVITY_INFO_TEXT: Record<string, string> = {
  "Actividad 7":
    "Estimado usuario, para realizar esta actividad correctamente, te invitamos a completar la lectura en el capítulo 5 del libro. ¡Gracias por tu atención!",
};

// Versión corta de cada frase para las tarjetas (más fácil de leer para niños).
const ORDER_LABELS_SIMPLE: Record<string, string> = {
  "La zancuda picó a los extranjeros.": "Picó a los viajeros",
  "Los extranjeros enfermos fueron al médico.": "Fueron al médico",
  "La zancuda picó a los pobladores.": "Picó a la gente",
  "Los pobladores de Lozanía empezaron a enfermarse.": "Se enfermaron",
};

// Actividad 4 ("El caos"): imagen permanente de cada etapa del ciclo de
// vida, mostrada en su letrero del estanque incluso antes de soltar la
// palabra correcta (así el estudiante sabe qué etapa está identificando).
// Clave externa = instruction del paso, clave interna = blank_index.
const STAGE_SLOT_IMAGES: Record<string, Record<number, string>> = {
  "¡Hola! Soy el agua estancada. El zancudo ya empezó su ciclo. ¡Ayúdame a detenerlo! Arrastra cada palabra al letrero que le corresponde.":
    {
      1: "/illustrations/actividad4-huevo.png",
      2: "/illustrations/actividad4-larva.png",
      3: "/illustrations/actividad4-pupa.png",
      4: "/illustrations/actividad4-adulto.png",
    },
};

// Actividad 5, paso 4 ("El caos"): este fill_blank_multi usa fotos reales
// en vez de emojis genéricos, aunque no sea de tipo fill_blank_single.
const IMAGE_STYLE_MULTI_PROMPTS = new Set<string>([
  "¿De qué se alimentan las zancudas? {1}   ¿Qué virus te pueden transmitir las zancudas cuando te pican? {2}   ¿Con qué debes lavar la alberca semanalmente? {3}",
]);

// Preguntas de multiple_choice ("El caos") con imagen real por opción, en
// vez de la lista de radio-botones de solo texto.
const CHOICE_IMAGES_BY_PROMPT: Record<string, Record<string, string>> = {
  "¿A qué hora inició Mario su investigación?": {
    "5:00 PM": "/illustrations/actividad5-reloj-5pm.png",
    "2:00 PM": "/illustrations/actividad5-reloj-2pm.png",
    "4:30 AM": "/illustrations/actividad5-reloj-430am.png",
  },
  "¿Dónde se ocultan las zancudas?": {
    "Llantas con agua estancada": "/illustrations/actividad5-llantas.png",
    "Un cuarto": "/illustrations/actividad5-cuarto.png",
    "La cocina": "/illustrations/actividad5-cocina.png",
  },
};

// Actividad 5, paso 2 ("El caos"): imagen real de cada objeto que el
// estudiante puede seleccionar (tablet, lupa, linterna, etc.), en vez de
// solo el nombre en un chip de texto.
const MULTI_SELECT_IMAGES: Record<string, Record<string, string>> = {
  "Selecciona los tres elementos que utilizó Mario en su investigación.": {
    Tablet: "/illustrations/actividad5-tablet.png",
    Impresora: "/illustrations/actividad5-impresora.png",
    Celular: "/illustrations/actividad5-celular.png",
    Lupa: "/illustrations/actividad5-lupa.png",
    Linterna: "/illustrations/actividad5-linterna.png",
    Libreta: "/illustrations/actividad5-libreta.png",
    Patineta: "/illustrations/actividad5-patineta.png",
    "Balón": "/illustrations/actividad5-balon.png",
    Bicicleta: "/illustrations/actividad5-bicicleta.png",
  },
};

// Envuelve el contenido en un popup de pantalla completa (fondo de valle
// real detrás, tarjeta centrada con scroll propio si el contenido es alto,
// con un alto mínimo para que no se colapse mientras carga/pregunta).
function Backdrop({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
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
        {header}
        <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function ActividadClient({ activityId }: { activityId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const viewerMode = useViewerMode();
  const [showAbandon, setShowAbandon] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [steps, setSteps] = useState<Step[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [placements, setPlacements] = useState<Record<number, string | null>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [trayOrder, setTrayOrder] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correcto" | "incorrecto" | null>(null);
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ optionId: string; label: string; x: number; y: number } | null>(
    null
  );
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [askContinue, setAskContinue] = useState(false);
  const [tuneReady, setTuneReady] = useState(false);
  const [headerInfo, setHeaderInfo] = useState<{
    moduleNumber: number;
    moduleTitle: string;
    title: string;
    unitId: string | null;
    orderIndex: number;
  } | null>(null);
  const [nextActivity, setNextActivity] = useState<{ id: string; title: string } | null>(null);

  const progressKey = `actividad-progreso-${activityId}`;

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("get_activity_for_playing", {
        _activity_id: activityId,
      });
      if (error) {
        setError(error.message);
        return;
      }

      const { data: activityRow } = await supabase
        .from("activities")
        .select("title, unit_id, order_index, units(title, order_index)")
        .eq("id", activityId)
        .single();
      if (activityRow) {
        const unit = activityRow.units as unknown as { title: string; order_index: number } | null;
        setHeaderInfo({
          moduleNumber: unit?.order_index ?? 1,
          moduleTitle: unit?.title ?? "",
          title: activityRow.title,
          unitId: activityRow.unit_id,
          orderIndex: activityRow.order_index,
        });
        if (activityRow.unit_id) {
          const next = await getNextActivity(supabase, activityRow.unit_id, activityRow.order_index);
          setNextActivity(next);
        }
      }

      const rows = (data ?? []) as OptionRow[];
      const grouped = new Map<string, Step>();
      for (const r of rows) {
        if (!grouped.has(r.step_id)) {
          grouped.set(r.step_id, {
            id: r.step_id,
            order: r.step_order,
            type: r.step_type,
            instruction: r.instruction,
            prompt: r.prompt,
            options: [],
          });
        }
        grouped.get(r.step_id)!.options.push({
          id: r.option_id,
          label: r.option_label,
          blank_index: r.blank_index,
        });
      }
      const list = Array.from(grouped.values()).sort((a, b) => a.order - b.order);
      setSteps(list);

      const saved = typeof window !== "undefined" ? window.localStorage.getItem(progressKey) : null;
      const savedIndex = saved ? Number(saved) : 0;
      if (savedIndex > 0 && savedIndex < list.length) {
        setAskContinue(true);
      } else {
        playOpenTune();
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, supabase]);

  useEffect(() => {
    if (!steps || askContinue) return;
    window.localStorage.setItem(progressKey, String(stepIndex));
  }, [stepIndex, steps, askContinue, progressKey]);

  function handleContinueYes() {
    const saved = window.localStorage.getItem(progressKey);
    setStepIndex(saved ? Number(saved) : 0);
    setAskContinue(false);
    playOpenTune();
  }

  function handleContinueNo() {
    window.localStorage.removeItem(progressKey);
    setStepIndex(0);
    setAskContinue(false);
    playOpenTune();
  }

  const currentStep = steps?.[stepIndex] ?? null;

  useEffect(() => {
    if (!currentStep) return;
    setPlacements({});
    setSelectedOption(null);
    setSelectedOptions(new Set());
    setFeedback(null);
    setTrayOrder(shuffle(currentStep.options.map((o) => o.id)));
  }, [currentStep]);

  // Drag global: sigue al puntero y detecta sobre qué "blank" se soltó.
  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      setDragging((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    }
    function onUp(e: PointerEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zone = el?.closest("[data-blank]") as HTMLElement | null;
      setDragging((d) => {
        if (d && zone) {
          const blankIndex = Number(zone.dataset.blank);
          setPlacements((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(next)) {
              if (next[Number(k)] === d.optionId) next[Number(k)] = null;
            }
            next[blankIndex] = d.optionId;
            return next;
          });
        }
        return null;
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  function startDrag(e: React.PointerEvent, optionId: string, label: string, fromBlank?: number) {
    e.preventDefault();
    if (fromBlank != null) {
      setPlacements((prev) => ({ ...prev, [fromBlank]: null }));
    }
    setDragging({ optionId, label, x: e.clientX, y: e.clientY });
  }

  const placedIds = useMemo(() => new Set(Object.values(placements).filter(Boolean) as string[]), [
    placements,
  ]);

  const trayOptions = useMemo(() => {
    if (!currentStep) return [];
    return trayOrder
      .map((id) => currentStep.options.find((o) => o.id === id)!)
      .filter((o) => o && !placedIds.has(o.id) && o.id !== dragging?.optionId);
  }, [trayOrder, currentStep, placedIds, dragging]);

  const requiredBlanks = useMemo(() => {
    if (!currentStep) return [];
    return Array.from(new Set(currentStep.options.map((o) => o.blank_index))).sort((a, b) => a - b);
  }, [currentStep]);

  const hasInlineBlanks = currentStep ? /\{\d+\}/.test(currentStep.prompt) : false;

  async function handleSubmit() {
    if (!currentStep) return;
    setError(null);

    let placementsPayload: { option_id: string; blank_index: number }[] = [];

    if (currentStep.type === "multiple_choice") {
      if (!selectedOption) {
        setError("Elige una respuesta primero.");
        return;
      }
      placementsPayload = [{ option_id: selectedOption, blank_index: 1 }];
    } else if (currentStep.type === "multi_select") {
      if (selectedOptions.size === 0) {
        setError("Selecciona al menos una opción.");
        return;
      }
      placementsPayload = Array.from(selectedOptions).map((optionId) => ({
        option_id: optionId,
        blank_index: 1,
      }));
    } else {
      if (requiredBlanks.some((b) => !placements[b])) {
        setError("Completa todos los espacios antes de enviar.");
        return;
      }
      placementsPayload = Object.entries(placements).map(([blankIndex, optionId]) => ({
        option_id: optionId as string,
        blank_index: Number(blankIndex),
      }));
    }

    setChecking(true);
    const { data, error } = await supabase.rpc("check_activity_step", {
      _step_id: currentStep.id,
      _placements: placementsPayload,
    });
    setChecking(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data) {
      playCorrectSound();
      setFeedback("correcto");
      const colores = ["#2D9B6E", "#FFC94A", "#7B4FA0", "#3AA8D8"];
      setConfetti(
        Array.from({ length: 20 }, (_, i) => ({
          id: Date.now() + i,
          left: 30 + Math.random() * 40,
          color: colores[i % colores.length],
          delay: Math.random() * 0.25,
        }))
      );
      setTimeout(async () => {
        setConfetti([]);
        if (steps && stepIndex + 1 < steps.length) {
          setStepIndex((i) => i + 1);
        } else {
          window.localStorage.removeItem(progressKey);
          if (!viewerMode.preview) await supabase.rpc("complete_activity", { _activity_id: activityId });
          setFinished(true);
        }
      }, 1100);
    } else {
      playIncorrectSound();
      setFeedback("incorrecto");
      setShakeNonce((n) => n + 1);
    }
  }

  const headerEl = headerInfo ? (
    <>
      <ActivityHeader
        moduleNumber={headerInfo.moduleNumber}
        moduleTitle={headerInfo.moduleTitle}
        title={headerInfo.title}
        onBack={() => setShowAbandon(true)}
      />
      {ACTIVITY_INFO_TEXT[headerInfo.title] && (
        <button
          onClick={() => setShowInfo(true)}
          className="absolute right-3 top-3 z-30 flex h-9 items-center gap-1 rounded-full border-[3px] px-3 text-xs font-extrabold shadow-lg sm:right-4 sm:top-4"
          style={{ background: "#f3ead2", borderColor: "#6b4527", color: "#7c5230" }}
        >
          ℹ️ Info
        </button>
      )}
      {showInfo && ACTIVITY_INFO_TEXT[headerInfo.title] && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-5">
          <div className="w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">Info</div>
            <div className="bg-lime-500 px-5 py-6 text-center">
              <p className="mb-5 font-extrabold text-white">{ACTIVITY_INFO_TEXT[headerInfo.title]}</p>
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-lg border-2 border-lime-800 bg-lime-700 px-6 py-1.5 text-sm font-bold text-white hover:bg-lime-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : undefined;

  if (error && !steps) return <Backdrop header={headerEl}><div className="flex flex-1 items-center justify-center"><p className="rounded-2xl bg-white p-6 text-sm text-red-600">{error}</p></div></Backdrop>;
  if (!steps) return <Backdrop header={headerEl}><div className="flex flex-1 items-center justify-center"><p className="rounded-2xl bg-white p-6 text-sm text-gray-500">Cargando actividad...</p></div></Backdrop>;

  if (askContinue) {
    return (
      <Backdrop header={headerEl}>
        <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-xs overflow-hidden rounded-2xl shadow-2xl">
          <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">
            Continuar
          </div>
          <div className="bg-lime-500 px-5 py-6 text-center">
            <p className="mb-5 font-extrabold text-white">¿Quieres continuar donde te quedaste?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleContinueYes}
                className="rounded-lg border-2 border-lime-800 bg-lime-700 px-6 py-1.5 text-sm font-bold text-white hover:bg-lime-800"
              >
                Sí
              </button>
              <button
                onClick={handleContinueNo}
                className="rounded-lg border-2 border-lime-800 bg-lime-700 px-6 py-1.5 text-sm font-bold text-white hover:bg-lime-800"
              >
                No
              </button>
            </div>
          </div>
        </div>
        </div>
      </Backdrop>
    );
  }

  if (finished) {
    return (
      <Backdrop header={headerEl}>
        <div className="flex flex-1 items-center justify-center">
        <div className="rounded-[28px] border-4 border-emerald-500 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold text-emerald-700">¡Actividad completada! 🎉</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {nextActivity && (
              <Link
                href={`${viewerMode.base}/actividades/${nextActivity.id}`}
                className="inline-block rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white"
              >
                Continuar a la siguiente actividad
              </Link>
            )}
            <Link
              href={mapHref(viewerMode)}
              className="inline-block rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white"
            >
              Volver al mapa de aventura
            </Link>
          </div>
        </div>
        </div>
      </Backdrop>
    );
  }

  if (!currentStep) return null;

  // Divide el prompt en segmentos de texto y espacios en blanco {1} {2} ...
  const segments = currentStep.prompt.split(/(\{\d+\})/g);

  return (
    <Backdrop header={headerEl}>
    <div className="relative flex-1 rounded-[20px] p-6 pt-14 sm:p-10 sm:pt-16">
      {/* Mosquitos decorativos volando en bucle — dales clic para aplastarlos */}
      <SquashableMosquito className="absolute left-2 top-6" style={{ animationDuration: "7s" }} />
      <SquashableMosquito
        className="absolute right-4 top-20"
        flip
        style={{ animationDuration: "9s", animationDelay: "1s" }}
      />
      {/* Héroe Agente Antidengue, decorativo — aparece desde "El caos" en
          adelante (todavía no existe como personaje en "La invasión"), y no
          en el paso de selección múltiple de la Actividad 5, que ya trae su
          propio héroe dentro de la tarjeta. */}
      {headerInfo?.moduleTitle !== "La invasión" && currentStep.type !== "multi_select" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/illustrations/actividad8-heroe-de-pie-hd.png"
          alt=""
          className="pointer-events-none absolute bottom-2 right-2 hidden w-20 drop-shadow-xl sm:block sm:w-24"
          style={{ animation: "heroeFloatActividad 3s ease-in-out infinite" }}
        />
      )}

      <div
        key={currentStep.id}
        className={`step-enter relative mx-auto rounded-[28px] p-8 pt-6 shadow-lg ${
          currentStep.type === "ordering" ? "max-w-4xl" : "max-w-xl"
        }`}
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 85% 75%, rgba(120,85,40,0.12), transparent 45%), radial-gradient(circle at 75% 15%, rgba(120,85,40,0.10), transparent 40%), linear-gradient(160deg, #f3e3bd, #e9d3a3 55%, #ecdcb8)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(124,82,48,0.25)",
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={checking}
          className="absolute right-6 top-6 rounded-full bg-orange-500 px-6 py-2 font-bold text-white shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {checking ? "..." : "ENVIAR"}
        </button>

        <EducateLogo />

        {currentStep.type !== "ordering" && !STAGE_SLOT_IMAGES[currentStep.instruction] && (
          <p className="mt-4 text-center text-sm text-gray-700">{currentStep.instruction}</p>
        )}

        {currentStep.type === "multiple_choice" ? (
          CHOICE_IMAGES_BY_PROMPT[currentStep.prompt] ? (
            <div className="mt-6">
              {currentStep.prompt !== currentStep.instruction && (
                <p className="mb-3 rounded-lg border-2 border-dashed border-red-300 px-3 py-2 text-center text-sm font-semibold">
                  {currentStep.prompt}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {currentStep.options.map((opt) => {
                  const img = CHOICE_IMAGES_BY_PROMPT[currentStep.prompt][opt.label];
                  const selected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id)}
                      className="flex flex-col overflow-hidden rounded-2xl text-left shadow-md transition-transform hover:-translate-y-1"
                      style={{
                        border: selected ? "4px solid #39e75f" : "4px solid transparent",
                        boxShadow: selected
                          ? "0 0 0 3px rgba(57,231,95,0.35), 0 8px 16px rgba(0,0,0,0.2)"
                          : "0 6px 14px rgba(0,0,0,0.18)",
                      }}
                    >
                      <span className="flex h-32 items-center justify-center bg-white p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={opt.label} className="h-full w-full object-contain" />
                      </span>
                      <span className="flex items-center justify-center bg-[#3d2c18] px-3 py-2 text-center text-[13px] font-extrabold text-white">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-2">
              <p className="mb-2 rounded-lg border-2 border-dashed border-red-300 px-3 py-2 text-sm font-semibold">
                {currentStep.prompt}
              </p>
              {currentStep.options.map((opt) => {
                const selected = selectedOption === opt.id;
                return (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                    style={{
                      border: selected ? "3px solid #39e75f" : "2px solid #d8c49a",
                      background: selected ? "#eafaf0" : "#fffdf7",
                      color: "#3d2c18",
                      boxShadow: selected ? "0 3px 8px rgba(57,231,95,0.25)" : "none",
                    }}
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white"
                      style={{ borderColor: selected ? "#39e75f" : "#c8b48a", background: selected ? "#39e75f" : "transparent" }}
                    >
                      {selected ? "✔" : ""}
                    </span>
                    <input
                      type="radio"
                      checked={selected}
                      onChange={() => setSelectedOption(opt.id)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          )
        ) : currentStep.type === "multi_select" ? (
          <div
            className="relative mt-4 overflow-hidden rounded-3xl p-4 pb-6"
            style={{ background: "linear-gradient(180deg,#8fd0ea,#bfe4f5)" }}
          >
            {currentStep.prompt !== currentStep.instruction && (
              <p className="relative z-10 mb-3 rounded-lg border-2 border-dashed border-white/70 bg-white/80 px-3 py-2 text-center text-sm font-semibold text-[#2f5a75]">
                {currentStep.prompt}
              </p>
            )}

            <div className="relative flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/actividad5-superheroe.png"
                alt=""
                className="hidden h-40 w-auto flex-shrink-0 sm:block"
              />

              <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-3">
                {currentStep.options.map((opt) => {
                  const checked = selectedOptions.has(opt.id);
                  const img = MULTI_SELECT_IMAGES[currentStep.prompt]?.[opt.label];
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelectedOptions((prev) => {
                          const next = new Set(prev);
                          if (next.has(opt.id)) next.delete(opt.id);
                          else next.add(opt.id);
                          return next;
                        })
                      }
                      className="relative flex flex-col items-center gap-1 rounded-[26px] px-2 py-3 shadow-md transition-transform hover:-translate-y-1"
                      style={{
                        background: "#fdfefe",
                        boxShadow: checked
                          ? "0 0 0 3px #39e75f, 0 8px 14px rgba(0,0,0,0.18)"
                          : "0 6px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      {checked && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#39e75f] text-xs font-extrabold text-white shadow">
                          ✔
                        </span>
                      )}
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={opt.label} className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
                      ) : (
                        <span className="text-4xl">{getIcon(opt.label)}</span>
                      )}
                      <span className="text-center text-[11px] font-extrabold leading-tight" style={{ color: "#3d2c18" }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : currentStep.type === "ordering" ? (
          <>
            <p
              key={shakeNonce}
              className={`mt-2 rounded-full px-5 py-2.5 text-center text-base font-extrabold tracking-wide ${
                feedback === "incorrecto" ? "shake" : ""
              }`}
              style={{
                fontFamily: "var(--font-baloo)",
                color: "#fff",
                background: "linear-gradient(160deg,#f0923c,#d6752a)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              }}
            >
              ARRASTRA LAS IMÁGENES AL ORDEN ➔
            </p>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Tablero izquierdo: grid 2x2 con el orden correcto */}
              <div className="mx-auto grid w-full max-w-md flex-1 grid-cols-2 gap-4">
                {requiredBlanks.map((blankIndex, idx) => {
                  const placedId = placements[blankIndex];
                  const placedOption = currentStep.options.find((o) => o.id === placedId);
                  const slotColors = [
                    { bg: "linear-gradient(160deg,#ffe08a,#f0c93c)", ring: "#c9932f" }, // 1 amarillo
                    { bg: "linear-gradient(160deg,#8fe0a0,#4fae63)", ring: "#2f8a43" }, // 2 verde
                    { bg: "linear-gradient(160deg,#f29a92,#e0533f)", ring: "#b03a2a" }, // 3 rojo
                    { bg: "linear-gradient(160deg,#8fd4e8,#4fa6c9)", ring: "#2f7a99" }, // 4 azul
                  ];
                  const sc = slotColors[idx % 4];
                  return (
                    <span
                      key={blankIndex}
                      data-blank={blankIndex}
                      className="relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-3xl p-2 text-center shadow-lg"
                      style={{ background: sc.bg, boxShadow: `inset 0 0 0 4px rgba(255,255,255,0.4), 0 6px 14px rgba(0,0,0,0.25)` }}
                    >
                      <span
                        className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-extrabold"
                        style={{ color: sc.ring, fontFamily: "var(--font-baloo)" }}
                      >
                        {idx + 1}°
                      </span>
                      {placedOption ? (
                        <span
                          onPointerDown={(e) =>
                            startDrag(e, placedOption.id, placedOption.label, blankIndex)
                          }
                          className="flex h-full w-full cursor-grab select-none flex-col items-center justify-center gap-1 rounded-2xl bg-white/90 p-2"
                          style={{ touchAction: "none" }}
                        >
                          {ORDER_IMAGES[placedOption.label] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ORDER_IMAGES[placedOption.label]}
                              alt=""
                              className="h-[62%] w-full object-contain"
                            />
                          )}
                          <span
                            className="text-[11px] font-extrabold leading-tight"
                            style={{ color: "#5a3a1a", fontFamily: "var(--font-baloo)" }}
                          >
                            {ORDER_LABELS_SIMPLE[placedOption.label] ?? placedOption.label}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-white/90">Suelta aquí</span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Panel derecho: galería de opciones en 2 columnas */}
              <div className="grid grid-cols-2 gap-3.5 lg:w-64 lg:flex-shrink-0">
                {trayOptions.map((opt, i) => {
                  const cardColors = ["#f0923c", "#f0c93c", "#e0533f", "#e0743a"];
                  const tc = cardColors[i % 4];
                  return (
                    <div
                      key={opt.id}
                      onPointerDown={(e) => startDrag(e, opt.id, opt.label)}
                      className="flex aspect-square cursor-grab select-none flex-col items-center justify-center gap-1 rounded-2xl bg-[#fffdf7] p-2 text-center shadow-md transition-transform hover:-translate-y-0.5"
                      style={{ touchAction: "none", border: `4px solid ${tc}` }}
                    >
                      {ORDER_IMAGES[opt.label] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ORDER_IMAGES[opt.label]}
                          alt=""
                          className="h-[70%] w-full object-contain"
                        />
                      )}
                      <span
                        className="text-[11px] font-extrabold leading-tight"
                        style={{ fontFamily: "var(--font-baloo)", color: "#5a3a1a" }}
                      >
                        {ORDER_LABELS_SIMPLE[opt.label] ?? opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : hasInlineBlanks ? (
          <>
            <p
              key={shakeNonce}
              className={`mt-6 rounded-lg border-2 border-dashed border-red-300 px-4 py-3 text-center text-sm font-semibold leading-loose ${
                feedback === "incorrecto" ? "shake" : ""
              }`}
            >
              {segments.map((seg, i) => {
                const match = seg.match(/^\{(\d+)\}$/);
                if (!match) return <span key={i}>{seg}</span>;
                const blankIndex = Number(match[1]);
                const placedId = placements[blankIndex];
                const placedOption = currentStep.options.find((o) => o.id === placedId);
                const isImageType =
                  currentStep.type === "fill_blank_single" ||
                  IMAGE_STYLE_MULTI_PROMPTS.has(currentStep.prompt);
                return (
                  <span
                    key={i}
                    data-blank={blankIndex}
                    className={`mx-1 inline-flex min-w-[90px] items-center justify-center rounded-xl border-2 border-dashed align-middle ${
                      isImageType
                        ? "border-yellow-400 bg-yellow-50 px-3 py-2"
                        : "border-orange-400 bg-orange-50 px-2 py-1"
                    }`}
                  >
                    {placedOption ? (
                      <span
                        onPointerDown={(e) => startDrag(e, placedOption.id, placedOption.label, blankIndex)}
                        className="inline-flex cursor-grab select-none items-center gap-1.5 rounded bg-white px-2 py-1 font-bold text-gray-800 shadow-sm transition-transform hover:scale-105"
                        style={{ touchAction: "none" }}
                      >
                        {isImageType && <span className="text-3xl">{getIcon(placedOption.label)}</span>}
                        {placedOption.label}
                      </span>
                    ) : (
                      <span className="text-transparent">…</span>
                    )}
                  </span>
                );
              })}
            </p>

            {currentStep.type === "fill_blank_single" || IMAGE_STYLE_MULTI_PROMPTS.has(currentStep.prompt) ? (
              <div className="mt-6 flex flex-wrap justify-center gap-5">
                {trayOptions.map((opt, i) => (
                  <div
                    key={opt.id}
                    onPointerDown={(e) => startDrag(e, opt.id, opt.label)}
                    className={`flex w-32 cursor-grab select-none flex-col items-center gap-2 rounded-2xl border-[5px] bg-white p-3 shadow-md transition-transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg sm:w-36 ${CARD_BORDERS[i % CARD_BORDERS.length]}`}
                    style={{ touchAction: "none" }}
                  >
                    <span className="text-6xl sm:text-7xl">{getIcon(opt.label)}</span>
                    <span className="text-sm font-extrabold text-gray-800 sm:text-base">{opt.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {trayOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onPointerDown={(e) => startDrag(e, opt.id, opt.label)}
                    className="cursor-grab select-none rounded-lg border-2 border-orange-300 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-900 shadow-sm transition-transform hover:-translate-y-0.5 hover:scale-105 hover:shadow-md"
                    style={{ touchAction: "none" }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // fill_blank_single / fill_blank_multi SIN frase embebida: el prompt es
          // solo instrucción, y hay un recuadro suelto (o varios) donde soltar.
          <>
            {STAGE_SLOT_IMAGES[currentStep.instruction] && (
              // Actividad 4 ("El caos"): encabezado temático del estanque con
              // el niño y su globo de diálogo, en vez del texto plano genérico.
              <div
                className="mt-3 flex items-end gap-3 rounded-3xl p-4"
                style={{ background: "linear-gradient(180deg,#bfe4f5,#8fd0ea)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/illustrations/actividad4-nino.png"
                  alt=""
                  className="h-24 w-auto flex-shrink-0 sm:h-28"
                />
                <div
                  className="relative flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-snug shadow"
                  style={{ color: "#2f5a75" }}
                >
                  <span
                    className="absolute -left-2 bottom-4 h-4 w-4 -rotate-45 bg-white"
                    aria-hidden
                  />
                  {currentStep.instruction}
                </div>
              </div>
            )}

            {currentStep.prompt !== currentStep.instruction && (
              <p
                key={shakeNonce}
                className={`mt-4 rounded-lg border-2 border-dashed border-red-300 px-4 py-3 text-center text-sm font-semibold ${
                  feedback === "incorrecto" ? "shake" : ""
                }`}
              >
                {currentStep.prompt}
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {requiredBlanks.map((blankIndex) => {
                const placedId = placements[blankIndex];
                const placedOption = currentStep.options.find((o) => o.id === placedId);
                const stageImg = STAGE_SLOT_IMAGES[currentStep.instruction]?.[blankIndex];
                const wideMode = !stageImg && currentStep.options.some((o) => !hasIcon(o.label));

                if (stageImg) {
                  // Actividad 4 ("El caos"): la ilustración de la etapa es
                  // permanente (siempre visible), y debajo hay una franja
                  // más chica donde se suelta la palabra correcta.
                  return (
                    <span
                      key={blankIndex}
                      className="flex w-40 flex-col overflow-hidden rounded-3xl border-4 border-sky-400 bg-white shadow-md sm:w-48"
                    >
                      <span
                        className="flex h-28 items-center justify-center p-2 sm:h-32"
                        style={{ background: "linear-gradient(160deg,#eaf6ff,#cdeaff)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stageImg} alt="" className="h-full w-full object-contain" />
                      </span>
                      <span
                        data-blank={blankIndex}
                        className="flex h-14 items-center justify-center border-t-4 border-dashed border-sky-300 bg-sky-50"
                      >
                        {placedOption ? (
                          <span
                            onPointerDown={(e) =>
                              startDrag(e, placedOption.id, placedOption.label, blankIndex)
                            }
                            className="cursor-grab select-none rounded-full bg-white px-4 py-1.5 text-sm font-extrabold shadow-sm transition-transform hover:scale-105"
                            style={{ touchAction: "none", color: "#5a3a1a" }}
                          >
                            {placedOption.label}
                          </span>
                        ) : (
                          <span className="text-xs text-sky-400">Suelta aquí</span>
                        )}
                      </span>
                    </span>
                  );
                }

                return (
                  <span
                    key={blankIndex}
                    data-blank={blankIndex}
                    className={
                      wideMode
                        ? "flex min-h-[8rem] w-full max-w-md items-center justify-center rounded-3xl border-4 border-dashed border-sky-400 bg-sky-50 p-4 sm:min-h-[9rem]"
                        : "flex h-40 w-40 items-center justify-center rounded-3xl border-4 border-dashed border-sky-400 bg-sky-50 sm:h-48 sm:w-48"
                    }
                  >
                    {placedOption ? (
                      <span
                        onPointerDown={(e) =>
                          startDrag(e, placedOption.id, placedOption.label, blankIndex)
                        }
                        className="flex h-full w-full cursor-grab select-none items-center justify-center rounded-2xl bg-white p-2 shadow-sm transition-transform hover:scale-105"
                        style={{ touchAction: "none" }}
                      >
                        {hasIcon(placedOption.label) ? (
                          <span className="block h-full w-full text-[120px] leading-none sm:text-[140px]">
                            {getIcon(placedOption.label)}
                          </span>
                        ) : (
                          <span
                            className="px-2 text-center text-sm font-extrabold leading-snug"
                            style={{ color: "#3d2c18" }}
                          >
                            {placedOption.label}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-sky-300">
                        {wideMode ? "Coloca aquí la respuesta correcta." : "Suelta aquí"}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-5">
              {trayOptions.map((opt, i) =>
                hasIcon(opt.label) ? (
                  <div
                    key={opt.id}
                    onPointerDown={(e) => startDrag(e, opt.id, opt.label)}
                    className={`flex h-32 w-32 cursor-grab select-none items-center justify-center rounded-2xl border-[5px] bg-white p-2 shadow-md transition-transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg sm:h-36 sm:w-36 ${CARD_BORDERS[i % CARD_BORDERS.length]}`}
                    style={{ touchAction: "none" }}
                  >
                    <span className="block h-full w-full text-[90px] leading-none sm:text-[104px]">
                      {getIcon(opt.label)}
                    </span>
                  </div>
                ) : (
                  <div
                    key={opt.id}
                    onPointerDown={(e) => startDrag(e, opt.id, opt.label)}
                    className={`flex w-48 cursor-grab select-none items-center justify-center rounded-2xl border-[5px] bg-white p-3 text-center shadow-md transition-transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg ${CARD_BORDERS[i % CARD_BORDERS.length]}`}
                    style={{ touchAction: "none" }}
                  >
                    <span className="text-sm font-extrabold leading-snug" style={{ color: "#3d2c18" }}>
                      {opt.label}
                    </span>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        {feedback === "correcto" && (
          <p className="mt-4 animate-bounce text-center text-sm font-semibold text-emerald-700">
            ¡Correcto! 🎉
          </p>
        )}
        {feedback === "incorrecto" && (
          <p className="mt-4 text-center text-sm font-semibold text-red-600">
            Casi... ¡inténtalo de nuevo!
          </p>
        )}

        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti-piece"
            style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s` }}
          />
        ))}
      </div>

      {dragging && (
        <div
          style={{
            position: "fixed",
            left: dragging.x - 40,
            top: dragging.y - 20,
            pointerEvents: "none",
            zIndex: 50,
          }}
          className="scale-110 rounded-lg border-2 border-orange-400 bg-orange-100 px-4 py-3 text-sm font-semibold text-orange-900 shadow-lg"
        >
          {dragging.label}
        </div>
      )}

      {showAbandon && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[20px] bg-black/35 p-5">
          <div className="w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-b border-white/30 bg-lime-600 px-4 py-2.5 font-bold text-white">
              ¿Salir de la actividad?
            </div>
            <div className="bg-lime-500 px-5 py-6 text-center">
              <p className="mb-5 font-extrabold text-white">
                Vas a volver al mapa de aventura. ¿Qué quieres hacer?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push(mapHref(viewerMode))}
                  className="rounded-lg border-2 border-lime-800 bg-lime-700 px-5 py-1.5 text-sm font-bold text-white hover:bg-lime-800"
                >
                  Abandonar
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

      <style jsx global>{CLOUD_GLOBAL_STYLES}</style>
      <style jsx global>{`
        @keyframes heroeFloatActividad {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
      <style jsx>{`
        @keyframes stepIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shake {
          10%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          80% {
            transform: translateX(4px);
          }
          30%,
          50%,
          70% {
            transform: translateX(-8px);
          }
          40%,
          60% {
            transform: translateX(8px);
          }
        }
        @keyframes confettiFall {
          to {
            transform: translateY(220px) rotate(360deg);
            opacity: 0;
          }
        }
        .step-enter {
          animation: stepIn 0.4s ease-out;
        }
        .shake {
          animation: shake 0.5s;
        }
        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          opacity: 0.9;
          animation: confettiFall 1s ease-in forwards;
        }
      `}</style>
    </div>
    </Backdrop>
  );
}
