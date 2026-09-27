"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Row } from "@/lib/bookProgress";
import DecorBackground from "@/components/DecorBackground";

const PALETTE = {
  green: "#5FB94C",
  greenDark: "#2E6B2A",
  greenDeep: "#1F4A1D",
  purpleDark: "#6B3F9E",
  coral: "#EF6F53",
  coralDark: "#D6503A",
  blue: "#4FA6D9",
  blueDark: "#2E7DAE",
  yellowDark: "#E8A415",
  ink: "#332B1F",
  inkSoft: "#6B6152",
};

const FACTS = [
  {
    key: "mosquito",
    img: "/illustrations/fact-mosquito.png",
    front: "Solo pica de día",
    back: "El Aedes aegypti es más activo justo después del amanecer y antes del atardecer — evita el agua estancada en esas horas.",
    color: `linear-gradient(150deg, ${PALETTE.coral}, ${PALETTE.coralDark})`,
    top: "#FFE3D9",
    ring: "#F7C3B1",
  },
  {
    key: "bucket",
    img: "/illustrations/fact-bucket.png",
    front: "Nace en agua quieta",
    back: "Basta una tapa de gaseosa con agua para que una hembra ponga sus huevos — revisa floreros y llantas cada semana.",
    color: `linear-gradient(150deg, ${PALETTE.blue}, ${PALETTE.blueDark})`,
    top: "#D8F0F2",
    ring: "#A9DCE0",
  },
  {
    key: "house",
    img: "/illustrations/fact-house.jpg",
    front: "Vive cerca de ti",
    back: "Prefiere las casas y patios antes que la selva — la mayoría de sus criaderos están dentro o cerca de las viviendas.",
    color: `linear-gradient(150deg, ${PALETTE.yellowDark}, #B9780C)`,
    top: "#FFF0C2",
    ring: "#F2D77E",
  },
];

// Paleta del rediseño "Opción B" de Inicio.
const B = {
  cream: "#FFF7E8",
  gDeep: "#1E5B24",
  gMid: "#2F7A2F",
  gLight: "#3E9A38",
  gBtn: "#5DBB46",
  gBtnShadow: "#3C8A2B",
  yellow: "#FFC93C",
  purple: "#8B5CD6",
  lilac: "#EFE7FB",
  coral: "#FF7A59",
  text: "#1F2A1E",
  text2: "#4E5A4B",
};

function playMosquitoThenSquash(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtxRef.current = audioCtxRef.current || new Ctx();
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const buzzDuration = 0.55;

    const carrier = audioCtx.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(250, now);
    carrier.frequency.linearRampToValueAtTime(310, now + 0.14);
    carrier.frequency.linearRampToValueAtTime(220, now + 0.28);
    carrier.frequency.linearRampToValueAtTime(300, now + 0.42);
    carrier.frequency.linearRampToValueAtTime(180, now + buzzDuration);

    const carrierGain = audioCtx.createGain();
    carrierGain.gain.setValueAtTime(0.0001, now);
    carrierGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    carrierGain.gain.setValueAtTime(0.1, now + buzzDuration - 0.08);
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + buzzDuration);

    const wingLfo = audioCtx.createOscillator();
    wingLfo.type = "sine";
    wingLfo.frequency.setValueAtTime(52, now);
    const wingDepth = audioCtx.createGain();
    wingDepth.gain.setValueAtTime(0.06, now);
    wingLfo.connect(wingDepth);
    wingDepth.connect(carrierGain.gain);

    let node: AudioNode = carrierGain;
    if (audioCtx.createStereoPanner) {
      const panner = audioCtx.createStereoPanner();
      panner.pan.setValueAtTime(-0.7, now);
      panner.pan.linearRampToValueAtTime(0.7, now + 0.22);
      panner.pan.linearRampToValueAtTime(-0.4, now + 0.4);
      panner.pan.linearRampToValueAtTime(0, now + buzzDuration);
      carrierGain.connect(panner);
      node = panner;
    }
    node.connect(audioCtx.destination);
    carrier.connect(carrierGain);

    carrier.start(now);
    carrier.stop(now + buzzDuration + 0.02);
    wingLfo.start(now);
    wingLfo.stop(now + buzzDuration + 0.02);

    // splat justo al terminar el zumbido
    const splatStart = now + buzzDuration;
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.18);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, splatStart);
    filter.frequency.exponentialRampToValueAtTime(140, splatStart + 0.16);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.55, splatStart);
    gain.gain.exponentialRampToValueAtTime(0.001, splatStart + 0.18);
    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start(splatStart);
    noise.stop(splatStart + 0.2);

    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, splatStart);
    osc.frequency.exponentialRampToValueAtTime(60, splatStart + 0.12);
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.35, splatStart);
    oscGain.gain.exponentialRampToValueAtTime(0.001, splatStart + 0.14);
    osc.connect(oscGain).connect(audioCtx.destination);
    osc.start(splatStart);
    osc.stop(splatStart + 0.15);
  } catch {
    // silencioso si el navegador bloquea audio
  }
}

export default function InicioClient({
  currentUnitTitle,
  remaining,
  nextRow,
  allDone,
}: {
  currentUnitTitle: string | null;
  remaining: number;
  nextRow: Row | null;
  allDone: boolean;
}) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  function toggleFlip(key: string) {
    setFlipped((prev) => ({ ...prev, [key]: !prev[key] }));
    playMosquitoThenSquash(audioCtxRef);
  }

  return (
    <div className="relative">
      {/* FONDO DECORATIVO: crema con trama de puntos + 3 manchas de color */}
      <DecorBackground />

      <div className="relative z-10">
        {/* BANNER (HÉROE). El superhéroe va FUERA del contenedor con
            overflow-hidden para poder sobresalir por arriba. */}
        <div className="relative mx-auto mt-2 max-w-[1180px] lg:mt-[62px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/actividad8-heroe-de-pie-hd.png"
            alt=""
            className="inicio-hero-char pointer-events-none absolute z-20 hidden lg:block"
            style={{ left: 34, bottom: 25, width: 260, height: 370, objectFit: "contain", animation: "inicioBob 3.2s ease-in-out infinite" }}
          />

          <div
            className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[36px] px-6 pb-8 pt-6 text-center lg:h-[340px] lg:flex-row lg:gap-0 lg:p-0 lg:text-left"
            style={{ background: B.gDeep, boxShadow: "0 18px 40px rgba(30,91,36,0.28)" }}
          >
            {/* Fondo ilustrado del banner */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1180 340"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              {/* halo detrás del personaje */}
              <circle cx="164" cy="190" r="150" fill={B.yellow} opacity="0.22" />
              {/* halos detrás del logo */}
              <circle cx="1010" cy="170" r="190" fill={B.yellow} opacity="0.12" />
              <circle cx="1010" cy="170" r="130" fill={B.yellow} opacity="0.16" />
              {/* nubes */}
              <g fill="#fff" opacity="0.12">
                <ellipse cx="420" cy="58" rx="58" ry="20" />
                <ellipse cx="455" cy="46" rx="36" ry="22" />
                <ellipse cx="740" cy="84" rx="70" ry="22" />
                <ellipse cx="780" cy="70" rx="40" ry="24" />
                <ellipse cx="610" cy="30" rx="34" ry="12" />
              </g>
              {/* colinas */}
              <path d="M0 262 C 140 214 260 250 390 236 C 540 220 640 272 800 250 C 960 228 1060 262 1180 240 L1180 340 L0 340 Z" fill={B.gMid} />
              <path d="M0 300 C 160 268 300 300 460 288 C 620 276 720 312 880 296 C 1020 282 1100 304 1180 292 L1180 340 L0 340 Z" fill={B.gLight} />
            </svg>

            {/* Personaje en pantallas chicas (apilado) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/actividad8-heroe-de-pie-hd.png"
              alt=""
              className="relative z-10 h-[190px] w-auto drop-shadow-lg lg:hidden"
              style={{ animation: "inicioBob 3.2s ease-in-out infinite" }}
            />

            {/* Texto */}
            <div className="relative z-10 max-w-[500px] lg:ml-[300px] lg:min-w-0 lg:flex-1 xl:ml-[320px]">
              <h1
                className="m-0 text-[30px] leading-[1.08] text-white sm:text-[36px] lg:text-[44px]"
                style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}
              >
                {allDone ? (
                  "¡Ya casi terminas el libro! 🎉"
                ) : currentUnitTitle ? (
                  <>
                    ¡Hoy toca seguir en &quot;<span style={{ color: B.yellow }}>{currentUnitTitle}</span>&quot;! 🦟
                  </>
                ) : (
                  "¡Bienvenido a Los invasores! 🦟"
                )}
              </h1>
              <p className="m-0 mt-3 text-[16px] lg:text-[19px]" style={{ color: "#E3F2DC", fontWeight: 700 }}>
                {allDone
                  ? "Genera tu certificado desde 'Libros activos' cuando quieras."
                  : currentUnitTitle
                  ? `Ya casi terminas esta zona — solo ${remaining} ${remaining === 1 ? "actividad" : "actividades"} más.`
                  : "Entra a 'Libros activos' para empezar tu aventura."}
              </p>
            </div>

            {/* Logo en "calcomanía" */}
            <div className="relative z-10 lg:ml-6 lg:mr-10 lg:flex-shrink-0 xl:ml-auto xl:mr-[64px]">
              <div
                className="flex items-center justify-center rounded-[30px] bg-white p-4 lg:h-[160px] lg:w-[240px] lg:p-5 xl:h-[196px] xl:w-[300px]"
                style={{ transform: "rotate(-3deg)", boxShadow: `0 10px 0 ${B.yellow}, 0 22px 40px rgba(0,0,0,0.25)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/illustrations/logo-educate.png"
                  alt="Edúcate contra el dengue"
                  className="h-auto w-[200px] object-contain lg:w-[200px] xl:w-[260px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MISIÓN DEL DÍA */}
        {nextRow && (
          <div
            className="mx-auto mt-10 flex max-w-[1180px] flex-col items-center gap-5 rounded-[30px] bg-white px-6 py-6 text-center lg:flex-row lg:gap-[30px] lg:px-9 lg:py-7 lg:text-left"
            style={{ boxShadow: "0 14px 34px rgba(90,60,20,0.10)" }}
          >
            <div
              className="flex h-[124px] w-[124px] flex-shrink-0 items-center justify-center rounded-[28px] text-[64px]"
              style={{ background: B.lilac }}
            >
              🎯
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="inline-block rounded-full px-3 py-1 text-[12px] text-white"
                style={{ background: B.purple, fontWeight: 800, letterSpacing: "1.4px" }}
              >
                MISIÓN DEL DÍA
              </span>
              <h3
                className="m-0 mb-1.5 mt-2.5 text-[24px] leading-tight lg:text-[30px]"
                style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: B.text }}
              >
                {nextRow.title}
              </h3>
              {nextRow.status === "score" && nextRow.scoreLabel && (
                <span
                  className="mb-1.5 inline-block rounded-full px-2.5 py-1 text-[12px] font-extrabold"
                  style={{ background: "#FDECEA", color: PALETTE.coralDark }}
                >
                  Tu último intento: {nextRow.scoreLabel} — no alcanzó el mínimo, vuelve a intentarlo
                </span>
              )}
              <p className="m-0 max-w-[720px] text-[16px]" style={{ color: B.text2, fontWeight: 600 }}>
                {nextRow.description}
              </p>
            </div>
            <Link
              href={nextRow.href}
              className="inicio-btn-game flex h-[60px] w-full flex-shrink-0 items-center justify-center whitespace-nowrap rounded-[18px] px-8 text-[21px] text-white lg:w-auto"
              style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}
            >
              Empezar →
            </Link>
          </div>
        )}

        {/* DATOS CURIOSOS */}
        <div className="mx-auto mt-12 max-w-[1180px]">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-[28px] lg:text-[32px]" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: B.text }}>
              ¿Sabías que...?
            </h2>
            <p className="m-0 text-[15px]" style={{ color: "#6B5E45", fontWeight: 700 }}>
              Toca una tarjeta para descubrir más
            </p>
          </div>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-3" style={{ perspective: 1200 }}>
            {FACTS.map((fact) => (
              <div
                key={fact.key}
                role="button"
                tabIndex={0}
                aria-pressed={Boolean(flipped[fact.key])}
                aria-label={fact.front}
                onClick={() => toggleFlip(fact.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleFlip(fact.key);
                  }
                }}
                className="inicio-fact h-[340px] cursor-pointer rounded-[28px]"
                style={{ perspective: 1200 }}
              >
                <div
                  className="relative h-full w-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped[fact.key] ? "rotateY(180deg)" : "none",
                    transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <div
                    className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] bg-white text-center"
                    style={{ backfaceVisibility: "hidden", boxShadow: "0 12px 28px rgba(90,60,20,0.10)" }}
                  >
                    <div className="flex h-[220px] flex-shrink-0 items-center justify-center" style={{ background: fact.top }}>
                      <div
                        className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full bg-white"
                        style={{ boxShadow: `0 8px 0 ${fact.ring}` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fact.img} alt={fact.front} className="h-[82%] w-[82%] object-contain" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center px-4">
                      <b className="text-[22px] leading-tight" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: B.text }}>
                        {fact.front}
                      </b>
                      <span className="mt-1 text-[12px] font-extrabold" style={{ color: B.text2 }}>
                        Toca para saber más
                      </span>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[28px] p-7 text-center text-[16px] font-bold leading-snug text-white"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: fact.color }}
                  >
                    <div>{fact.back}</div>
                    <span className="absolute bottom-4 text-[11px] font-extrabold opacity-75">Toca para volver</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[13px] font-bold" style={{ color: B.text2 }}>
            💡 Cada tarjeta gira al tocarla — perfecto para explorar a tu propio ritmo.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes inicioBob {
          0%,
          100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(-8px) rotate(3deg);
          }
        }
        .inicio-btn-game {
          background: #5dbb46;
          box-shadow: 0 6px 0 #3c8a2b;
          transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
        }
        .inicio-btn-game:hover {
          filter: brightness(1.06);
        }
        .inicio-btn-game:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #3c8a2b;
        }
        .inicio-btn-game:focus-visible,
        .inicio-fact:focus-visible {
          outline: 3px solid #8b5cd6;
          outline-offset: 4px;
        }
        .inicio-fact {
          transition: transform 0.15s;
        }
        .inicio-fact:hover {
          transform: translateY(-4px);
        }
        .inicio-fact:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
