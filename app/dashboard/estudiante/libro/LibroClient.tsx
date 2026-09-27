"use client";

import { useEffect, useRef, useState } from "react";
import type { Row, UnitData } from "@/lib/bookProgress";
import DecorBackground from "@/components/DecorBackground";
import { playSquashSound } from "@/lib/sounds";

const NODE_POS = [
  { x: 90, y: 170, r: 40 },
  { x: 450, y: 110, r: 46 },
  { x: 800, y: 90, r: 40 },
];

// Paleta del sistema visual "Opción B" (igual que Inicio).
const B = {
  gDeep: "#1E5B24",
  gMid: "#2F7A2F",
  gLight: "#3E9A38",
  yellow: "#FFC93C",
  yellowShadow: "#D39A12",
  purple: "#8B5CD6",
  text: "#1F2A1E",
  onGreen: "#E3F2DC",
  text2: "#6B5E45",
};

const PALETTE = {
  cream: "#FBF5E6",
  cream2: "#F3ECD7",
  green: "#5FB94C",
  greenDark: "#2E6B2A",
  greenDeep: "#1F4A1D",
  yellow: "#FFC94A",
  purple: "#8C5FBF",
  purpleDark: "#6B3F9E",
  coral: "#EF6F53",
  ink: "#332B1F",
  inkSoft: "#6B6152",
};

export default function LibroClient({
  units,
  overallPct,
  certifiableAttemptId,
  preview = false,
  blockedNotice = false,
}: {
  units: UnitData[];
  overallPct: number;
  certifiableAttemptId: string | null;
  // Vista docente: todo desbloqueado, sin anillo de progreso ni certificado.
  preview?: boolean;
  // Llegó redirigido por intentar abrir un ítem bloqueado.
  blockedNotice?: boolean;
}) {
  const [ringPct, setRingPct] = useState(0);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [squashed, setSquashed] = useState(false);
  const [toast, setToast] = useState<string | null>(
    blockedNotice ? "🔒 Primero termina la actividad anterior" : null
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Anillo de 150px con trazo de 14px → radio 68.
  const circumference = 2 * Math.PI * 68;

  useEffect(() => {
    if (!blockedNotice) return;
    const current = units.find((u) => u.state === "current");
    if (current) setOpenUnit(current.id);
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const step = () => {
        current += 2;
        if (current > overallPct) current = overallPct;
        setRingPct(current);
        if (current < overallPct) requestAnimationFrame(() => setTimeout(step, 14));
      };
      step();
    }, 300);
    return () => clearTimeout(timer);
  }, [overallPct]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  // Al reaparecer, el mosquito arranca en otro punto de su vuelo.
  const [mosqSpot, setMosqSpot] = useState({ top: 0, delay: 0 });
  const [mosqGone, setMosqGone] = useState(false);

  function squashMosquito() {
    if (squashed) return;
    playSquashSound();
    setSquashed(true);
    showToast("¡Splat! 🎉");
    setTimeout(() => setMosqGone(true), 450); // fin de la animación de aplastado
    setTimeout(() => {
      setMosqSpot({ top: Math.round(Math.random() * 22), delay: -Math.round(Math.random() * 12) });
      setMosqGone(false);
      setSquashed(false);
    }, 3200);
  }

  async function handleGenerarCertificado() {
    if (overallPct < 100 || !certifiableAttemptId) return;
    setModalOpen(true);
    burstConfetti();
    if (!certUrl) {
      setCertLoading(true);
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt_id: certifiableAttemptId }),
      });
      const body = await res.json();
      setCertLoading(false);
      if (res.ok) setCertUrl(body.pdf_url);
    }
  }

  function burstConfetti() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = [PALETTE.green, PALETTE.yellow, PALETTE.purple, PALETTE.coral];
    const pieces = Array.from({ length: 120 }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
      y: window.innerHeight / 2 - 40,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 4,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 14,
    }));
    let frame = 0;
    function loop() {
      frame++;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      pieces.forEach((p) => {
        p.vy += 0.28;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rot * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      });
      if (frame < 130) requestAnimationFrame(loop);
      else ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    }
    loop();
  }

  const pathD = "M90,170 C220,60 320,220 450,110 C560,20 640,200 800,90";

  return (
    <div>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />

      <DecorBackground />

      <div className="relative z-10">
      {/* Mosquito decorativo (aplastable) */}
      <div className="relative mx-auto mb-2 h-9 max-w-[1180px]">
        {!mosqGone && (
          <button
            onClick={squashMosquito}
            aria-label="Aplastar mosquito"
            className={`libro-mosq shell-focus absolute left-0 z-30 rounded-full text-2xl transition-transform hover:scale-110 ${
              squashed ? "libro-mosq-squash" : ""
            }`}
            style={{
              top: mosqSpot.top,
              animation: squashed ? undefined : `libroFly 13s linear ${mosqSpot.delay}s infinite`,
            }}
          >
            {squashed ? "💥" : "🦟"}
            {squashed && (
              <span className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => (
                  <i key={i} className="libro-splat" style={{ ["--a" as string]: `${i * 45}deg` }} />
                ))}
              </span>
            )}
          </button>
        )}
      </div>

      {/* BANNER DEL LIBRO. La portada va FUERA del contenedor con
          overflow-hidden para poder sobresalir por arriba. */}
      <div className="relative mx-auto mb-[50px] mt-2 max-w-[1180px] lg:mt-[44px]">
        <div
          className="pointer-events-none absolute z-20 hidden lg:block"
          style={{ left: 56, top: -40 }}
        >
          <div
            className="rounded-[22px] bg-white p-2.5"
            style={{ transform: "rotate(-5deg)", boxShadow: `0 10px 0 ${B.yellow}, 0 22px 40px rgba(0,0,0,0.25)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/portada-los-invasores.png"
              alt='Portada del libro "Los invasores"'
              className="block h-[294px] w-[160px] rounded-[14px] object-cover"
            />
          </div>
        </div>

        <section
          className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[36px] px-6 py-8 text-center lg:h-[290px] lg:flex-row lg:gap-0 lg:p-0 lg:text-left"
          style={{ background: B.gDeep, boxShadow: "0 18px 40px rgba(30,91,36,0.28)" }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1180 290"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <circle cx="140" cy="150" r="140" fill={B.yellow} opacity="0.25" />
            <circle cx="1030" cy="130" r="170" fill={B.yellow} opacity="0.10" />
            <g fill="#fff" opacity="0.12">
              <ellipse cx="430" cy="52" rx="58" ry="19" />
              <ellipse cx="465" cy="40" rx="36" ry="21" />
              <ellipse cx="760" cy="70" rx="68" ry="21" />
              <ellipse cx="800" cy="58" rx="40" ry="23" />
            </g>
            <path d="M0 222 C 140 180 260 212 390 200 C 540 186 640 232 800 212 C 960 194 1060 222 1180 204 L1180 290 L0 290 Z" fill={B.gMid} />
            <path d="M0 256 C 160 228 300 256 460 246 C 620 236 720 266 880 252 C 1020 240 1100 258 1180 250 L1180 290 L0 290 Z" fill={B.gLight} />
          </svg>

          {/* Portada en pantallas chicas (apilada) */}
          <div
            className="relative z-10 rounded-[18px] bg-white p-2 lg:hidden"
            style={{ transform: "rotate(-5deg)", boxShadow: `0 8px 0 ${B.yellow}, 0 18px 30px rgba(0,0,0,0.25)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/portada-los-invasores.png"
              alt='Portada del libro "Los invasores"'
              className="block h-[220px] w-[120px] rounded-[12px] object-cover"
            />
          </div>

          <div className="relative z-10 lg:ml-[270px] lg:min-w-0 lg:flex-1">
            <h2
              className="m-0 mb-2 text-[36px] leading-none text-white lg:text-[48px]"
              style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}
            >
              Los invasores
            </h2>
            <p className="m-0 max-w-[560px] text-[16px] lg:text-[18px]" style={{ color: B.onGreen, fontWeight: 700 }}>
              Sigue el mapa de aventura, supera cada zona y descubre cómo derrotar al mosquito Aedes
              aegypti.
            </p>
            {preview ? (
              <span
                className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-extrabold"
                style={{ background: "#EDE3F7", color: PALETTE.purpleDark }}
              >
                👩‍🏫 Vista docente: todo está desbloqueado y nada de lo que hagas cuenta como progreso.
              </span>
            ) : (
              <span
                className="mt-4 inline-flex h-[38px] items-center gap-1.5 rounded-full px-4 text-[15px]"
                style={{ background: B.yellow, color: "#4A3000", fontWeight: 800, boxShadow: `0 4px 0 ${B.yellowShadow}` }}
              >
                📍 Vas en: {units.find((u) => u.state === "current")?.title ?? "¡Ya casi terminas!"}
              </span>
            )}
          </div>

          {preview ? (
            <div className="relative z-10 flex flex-col items-center gap-1 text-center lg:mx-14">
              <span className="text-[44px] leading-none text-white" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}>
                {units.length}
              </span>
              <span className="text-[11px] font-extrabold" style={{ color: B.onGreen }}>
                SECCIONES · {units.reduce((n, u) => n + u.total, 0)} ÍTEMS
              </span>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-3.5 lg:mx-12 lg:flex-shrink-0">
              <div className="relative h-[150px] w-[150px]">
                <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="75" cy="75" r="68" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="14" />
                  <circle
                    cx="75"
                    cy="75"
                    r="68"
                    fill="none"
                    stroke={B.yellow}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * ringPct) / 100}
                    style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[40px] leading-none text-white" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}>
                    {ringPct}%
                  </span>
                  <span className="mt-1 text-[11px]" style={{ color: B.onGreen, fontWeight: 800 }}>
                    COMPLETADO
                  </span>
                </div>
              </div>
              <button
                onClick={handleGenerarCertificado}
                disabled={overallPct < 100 || !certifiableAttemptId}
                className={`libro-cert shell-focus inline-flex h-12 items-center gap-2 rounded-[16px] px-5 text-[15px] ${
                  overallPct < 100 || !certifiableAttemptId ? "libro-cert-off" : "libro-cert-on"
                }`}
                style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}
              >
                🏅 Generar certificado
              </button>
            </div>
          )}
        </section>
      </div>

      {/* MAPA */}
      <div
        className="relative mx-auto mb-7 max-w-[1180px] overflow-hidden rounded-[36px] bg-white"
        style={{ boxShadow: "0 14px 34px rgba(90,60,20,0.12)" }}
      >
        <div className="flex flex-col items-start gap-2 px-6 py-4 lg:h-[76px] lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-[12px] text-white"
              style={{ background: B.purple, fontWeight: 800, letterSpacing: "1.2px" }}
            >
              MAPA
            </span>
            <h2 className="m-0 text-[24px] lg:text-[28px]" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: B.text }}>
              Mapa de aventura
            </h2>
          </div>
          <p className="m-0 text-[15px]" style={{ color: B.text2, fontWeight: 700 }}>
            Toca una zona para ver sus actividades
          </p>
        </div>
      <section
        className="relative overflow-hidden p-5 pb-2 sm:p-8"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(20,30,10,0.1), rgba(20,30,10,0.05) 35%, rgba(20,30,10,0.3)), url(/illustrations/valle-fondo.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        <svg viewBox="0 0 900 220" className="block w-full">
          <path
            d={pathD}
            fill="none"
            stroke="#fff9d6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="1 20"
            opacity="0.95"
          />
          {units.slice(0, 3).map((unit, i) => {
            const pos = NODE_POS[i];
            const badgeHref =
              unit.state === "current"
                ? "/illustrations/badge-actual.png"
                : unit.state === "locked"
                ? "/illustrations/badge-bloqueado.png"
                : null;
            const clickable = preview || unit.state !== "locked";
            const nodeColors = [PALETTE.green, PALETTE.yellow, PALETTE.purple];
            return (
              <g
                key={unit.id}
                onClick={() => clickable && setOpenUnit(openUnit === unit.id ? null : unit.id)}
                style={{ cursor: clickable ? "pointer" : "not-allowed" }}
              >
                {preview ? (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={pos.r}
                      fill={nodeColors[i]}
                      stroke="#fff"
                      strokeWidth="5"
                      opacity={openUnit === unit.id ? 1 : 0.95}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 11}
                      fontSize="30"
                      textAnchor="middle"
                      fill="#fff"
                      fontFamily="Baloo 2"
                      fontWeight="800"
                    >
                      {i + 1}
                    </text>
                  </>
                ) : badgeHref ? (
                  <>
                    <defs>
                      <clipPath id={`clip-${unit.id}`}>
                        <circle cx={pos.x} cy={pos.y} r={pos.r} />
                      </clipPath>
                    </defs>
                    <circle cx={pos.x} cy={pos.y} r={pos.r + 4} fill="#fff" opacity="0.9" />
                    <image
                      href={badgeHref}
                      x={pos.x - pos.r}
                      y={pos.y - pos.r}
                      width={pos.r * 2}
                      height={pos.r * 2}
                      clipPath={`url(#clip-${unit.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    >
                      {unit.state === "current" && (
                        <animate attributeName="opacity" values="1;0.75;1" dur="1.8s" repeatCount="indefinite" />
                      )}
                    </image>
                  </>
                ) : (
                  <>
                    <circle cx={pos.x} cy={pos.y} r={pos.r} fill={PALETTE.green} stroke="#fff" strokeWidth="5" />
                    <text x={pos.x} y={pos.y + 8} fontSize="28" textAnchor="middle">
                      ✅
                    </text>
                  </>
                )}
                {!preview && unit.state === "current" && (
                  <text x={pos.x} y={pos.y + pos.r + 22} fontSize="12" textAnchor="middle" fill="#fff" fontWeight="800" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                    {unit.pct}%
                  </text>
                )}
                <text
                  x={pos.x}
                  y={pos.y + pos.r + (!preview && unit.state === "current" ? 42 : 26)}
                  fontSize="15"
                  textAnchor="middle"
                  fill="#fff"
                  fontFamily="Baloo 2"
                  fontWeight="700"
                  style={{ textShadow: "0 2px 5px rgba(0,0,0,0.6)" }}
                >
                  {unit.title}
                </text>
              </g>
            );
          })}
        </svg>

        {units.map((unit) => (
          <div
            key={unit.id}
            className={`relative z-10 -mt-1.5 mb-6 rounded-2xl bg-white p-4 shadow ${openUnit === unit.id ? "block" : "hidden"}`}
          >
            <p
              className="mb-3 flex items-center gap-2 text-[15px] font-bold"
              style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}
            >
              {preview ? "📘" : unit.state === "done" ? "✅" : unit.state === "current" ? "🦟" : "🔒"} {unit.title}
              {preview
                ? unit.total > 0 && ` — ${unit.total} ítems`
                : unit.total > 0 && ` — ${unit.done}/${unit.total} completado`}
            </p>
            <div className="flex flex-col gap-2.5">
              {unit.rows.length === 0 && (
                <p className="text-sm" style={{ color: PALETTE.inkSoft }}>
                  Todavía no hay contenido cargado aquí.
                </p>
              )}
              {unit.rows.map((row) => {
                const locked = !preview && row.status === "locked";
                if (locked) {
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => showToast("🔒 Primero termina la actividad anterior")}
                      className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl border-2 border-dashed p-3 text-left"
                      style={{ background: "#F4F1EA", borderColor: "#DDD5C3" }}
                      aria-disabled="true"
                    >
                      <span className="flex-shrink-0 text-2xl grayscale" style={{ opacity: 0.45 }}>
                        {row.icon}
                      </span>
                      <div className="min-w-0 flex-1" style={{ opacity: 0.55 }}>
                        <p className="m-0 truncate text-sm font-extrabold" style={{ color: PALETTE.ink }}>
                          {row.title}
                        </p>
                        <p className="m-0 line-clamp-1 text-xs font-semibold" style={{ color: PALETTE.inkSoft }}>
                          Se desbloquea al terminar la anterior
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xl">🔒</span>
                    </button>
                  );
                }
                return (
                <a
                  key={row.key}
                  href={row.href}
                  className="flex items-center gap-3 rounded-2xl border-2 border-transparent p-3 text-left transition-transform hover:-translate-y-0.5"
                  style={{
                    background: !preview && row.status === "done" ? "#E9F7E2" : PALETTE.cream,
                  }}
                >
                  <span className="flex-shrink-0 text-2xl">{row.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-extrabold" style={{ color: PALETTE.ink }}>
                      {row.title}
                    </p>
                    <p className="m-0 line-clamp-2 text-xs font-semibold" style={{ color: PALETTE.inkSoft }}>
                      {row.description}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xl">
                    {preview && (
                      <span className="text-xs font-extrabold" style={{ color: PALETTE.purpleDark }}>
                        Ver →
                      </span>
                    )}
                    {!preview && row.status === "done" && "✔️"}
                    {!preview && row.status === "score" && (
                      <span className="text-sm font-extrabold" style={{ color: PALETTE.coral }}>
                        {row.scoreLabel}
                      </span>
                    )}
                    {!preview && row.status === "pending" && (
                      <span className="text-xs font-extrabold" style={{ color: PALETTE.greenDark }}>
                        Empezar →
                      </span>
                    )}
                  </span>
                </a>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      </div>
      </div>

      {/* CERTIFICATE MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[61] flex items-center justify-center p-5"
          style={{ background: "rgba(31,74,29,0.45)", backdropFilter: "blur(2px)" }}
        >
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-[22px] bg-white shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-3.5 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-black/10 font-extrabold"
            >
              ✕
            </button>
            <div
              className="h-4"
              style={{
                background: `repeating-linear-gradient(90deg,${PALETTE.green} 0 24px, ${PALETTE.yellow} 24px 48px, ${PALETTE.purple} 48px 72px, ${PALETTE.coral} 72px 96px)`,
              }}
            />
            <div className="px-6 pb-6 pt-7 text-center">
              <div className="text-3xl">🦟🏅🦟</div>
              <h3
                className="my-1.5 text-[22px] tracking-wide"
                style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}
              >
                CERTIFICADO DE HONOR
              </h3>
              <p className="my-2.5 text-sm font-bold" style={{ color: PALETTE.inkSoft }}>
                Completaste &quot;Los invasores&quot; con éxito
              </p>
              {certLoading && <p className="text-sm">Generando tu certificado...</p>}
              {certUrl && (
                <a
                  href={certUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block rounded-full px-6 py-2.5 font-extrabold text-white"
                  style={{ background: PALETTE.green }}
                >
                  Descargar certificado (PDF)
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow"
          style={{ background: PALETTE.greenDeep }}
        >
          {toast}
        </div>
      )}

      <style jsx global>{`
        .libro-mosq-squash {
          animation: libroSquash 0.45s ease-out forwards !important;
        }
        @keyframes libroSquash {
          0% {
            transform: scale(1);
          }
          35% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(0);
          }
        }
        .libro-splat {
          position: absolute;
          left: -3px;
          top: -3px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #5e3a7d;
          animation: libroSplat 0.45s ease-out forwards;
        }
        .libro-splat:nth-child(even) {
          background: #ef6f53;
        }
        @keyframes libroSplat {
          from {
            transform: rotate(var(--a)) translateX(0);
            opacity: 1;
          }
          to {
            transform: rotate(var(--a)) translateX(28px);
            opacity: 0;
          }
        }
        .libro-cert {
          transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
        }
        .libro-cert-on {
          background: #ffc93c;
          color: #4a3000;
          box-shadow: 0 6px 0 #d39a12;
        }
        .libro-cert-on:hover {
          filter: brightness(1.05);
        }
        .libro-cert-on:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #d39a12;
        }
        .libro-cert-off {
          background: rgba(255, 255, 255, 0.12);
          border: 2px solid rgba(255, 255, 255, 0.35);
          color: #fff;
          cursor: not-allowed;
        }
        @media (prefers-reduced-motion: reduce) {
          .libro-mosq {
            animation: none !important;
            left: 45% !important;
          }
          .libro-mosq-squash,
          .libro-splat {
            animation: none !important;
            opacity: 0;
          }
        }
        @keyframes libroFly {
          0% {
            left: -6%;
            top: 0px;
            transform: rotate(-6deg) scaleX(-1);
          }
          25% {
            top: 16px;
            transform: rotate(4deg) scaleX(-1);
          }
          50% {
            left: 50%;
            top: -2px;
            transform: rotate(-4deg) scaleX(-1);
          }
          75% {
            top: 14px;
            transform: rotate(6deg) scaleX(-1);
          }
          100% {
            left: 106%;
            top: 0px;
            transform: rotate(-6deg) scaleX(-1);
          }
        }
      `}</style>
    </div>
  );
}
