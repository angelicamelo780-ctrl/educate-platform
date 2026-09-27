"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DICCIONARIO, esDelDengue, hablar, letraInicial, normalizar, type Palabra } from "@/lib/diccionario";
import DecorBackground from "@/components/DecorBackground";

const COLORS = ["#5FB94C", "#FFC94A", "#8C5FBF", "#EF6F53"];
const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

const P = {
  cream: "#FBF5E6",
  cream2: "#F3ECD7",
  green: "#5FB94C",
  gdark: "#2E6B2A",
  gdeep: "#1F4A1D",
  gsoft: "#E9F7E2",
  ysoft: "#FEF3D6",
  coral: "#EF6F53",
  csoft: "#FDE4DC",
  ink: "#332B1F",
  soft: "#6B6152",
};

type Filtro = "all" | "dengue" | string; // string = título de una sección

function slug(w: string) {
  return "w-" + normalizar(w).replace(/[^a-z0-9]+/g, "-");
}

export default function DiccionarioClient({
  secciones,
  unidades,
  palabraInicial,
}: {
  secciones: Record<string, string[]>;
  unidades: string[];
  palabraInicial: string | null;
}) {
  const inicial = palabraInicial ? DICCIONARIO.find((p) => normalizar(p.palabra) === normalizar(palabraInicial)) : null;

  const [letra, setLetra] = useState(inicial ? letraInicial(inicial.palabra) : "A");
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [abiertas, setAbiertas] = useState<Set<string>>(() => new Set(inicial ? [inicial.palabra] : []));
  const [resaltada, setResaltada] = useState<string | null>(inicial?.palabra ?? null);
  const [wodIndex, setWodIndex] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of DICCIONARIO) c[letraInicial(p.palabra)] = (c[letraInicial(p.palabra)] ?? 0) + 1;
    return c;
  }, []);

  const totalDengue = useMemo(() => DICCIONARIO.filter(esDelDengue).length, []);

  function pasaFiltro(p: Palabra, f: Filtro = filtro) {
    if (f === "all") return true;
    if (f === "dengue") return esDelDengue(p);
    return (secciones[p.palabra] ?? []).includes(f);
  }

  const q = normalizar(debounced.trim());
  const lista = useMemo(() => {
    if (q) {
      return DICCIONARIO.filter((p) => normalizar(p.palabra).includes(q) && pasaFiltro(p)).sort(
        (a, b) =>
          (normalizar(a.palabra).startsWith(q) ? 0 : 1) - (normalizar(b.palabra).startsWith(q) ? 0 : 1) ||
          a.palabra.localeCompare(b.palabra, "es")
      );
    }
    return DICCIONARIO.filter((p) => letraInicial(p.palabra) === letra && pasaFiltro(p)).sort((a, b) =>
      a.palabra.localeCompare(b.palabra, "es")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, letra, filtro, secciones]);

  // Palabra del día: fija por fecha (cambia cada día), elegida entre las que
  // aparecen en el libro. "Otra palabra" elige una al azar.
  const pool = useMemo(() => DICCIONARIO.filter((p) => (secciones[p.palabra] ?? []).length > 0), [secciones]);
  useEffect(() => {
    if (pool.length) setWodIndex(Math.floor(Date.now() / 864e5) % pool.length);
  }, [pool.length]);
  const wod = wodIndex !== null ? pool[wodIndex] ?? DICCIONARIO[0] : null;

  // Si llega con ?palabra=..., o se abre desde la palabra del día: ir a su tarjeta.
  const scrolled = useRef(false);
  useEffect(() => {
    if (!resaltada) return;
    const el = document.getElementById(slug(resaltada));
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: scrolled.current ? "smooth" : "auto", block: "center" }), 80);
      scrolled.current = true;
    }
    const t = setTimeout(() => setResaltada(null), 2200);
    return () => clearTimeout(t);
  }, [resaltada, lista]);

  function abrirPalabra(p: Palabra) {
    setQuery("");
    setDebounced("");
    setFiltro("all");
    setLetra(letraInicial(p.palabra));
    setAbiertas((s) => new Set(s).add(p.palabra));
    setResaltada(p.palabra);
  }

  function elegirFiltro(f: Filtro) {
    setFiltro(f);
    // Si la letra actual se queda sin palabras con el filtro, salta a la primera que tenga.
    if (!q && !DICCIONARIO.some((p) => letraInicial(p.palabra) === letra && pasaFiltro(p, f))) {
      const primera = DICCIONARIO.filter((p) => pasaFiltro(p, f)).sort((a, b) =>
        a.palabra.localeCompare(b.palabra, "es")
      )[0];
      if (primera) setLetra(letraInicial(primera.palabra));
    }
  }

  const chips: { f: Filtro; label: string }[] = [
    { f: "all", label: `📚 Todas (${DICCIONARIO.length})` },
    { f: "dengue", label: `🦟 Del dengue (${totalDengue})` },
    ...unidades.map((u) => ({ f: u, label: `📖 ${u}` })),
  ];

  function resaltar(word: string) {
    if (!q) return word;
    const plain = normalizar(word);
    const i = plain.indexOf(q);
    if (i < 0) return word;
    return (
      <>
        {word.slice(0, i)}
        <mark className="rounded bg-[#FFC94A] px-0 text-inherit">{word.slice(i, i + q.length)}</mark>
        {word.slice(i + q.length)}
      </>
    );
  }

  return (
    <div className="dicc">
      <DecorBackground />

      <div className="relative z-10">
      {/* BANNER. El superhéroe y el logo van FUERA del contenedor con
          overflow-hidden para poder sobresalir por arriba. */}
      <div className="relative mx-auto mt-2 max-w-[1180px] lg:mt-[62px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/actividad8-heroe-de-pie-hd.png"
          alt=""
          className="dicc-hero pointer-events-none absolute z-20 hidden lg:block"
          style={{ left: 18, top: -55, width: 250, height: 356, objectFit: "contain" }}
        />
        <div
          className="absolute z-30 hidden lg:block"
          style={{ right: 70, top: -44 }}
        >
          <div
            className="flex h-[128px] w-[230px] items-center justify-center rounded-[24px] bg-white p-3.5"
            style={{ transform: "rotate(-4deg)", boxShadow: "0 8px 0 #FFC93C, 0 18px 30px rgba(0,0,0,0.2)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/logo-educate.png" alt="Edúcate contra el dengue" className="h-full w-full object-contain" />
          </div>
        </div>

        <section
          className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[36px] px-5 pb-8 pt-6 text-center lg:min-h-[400px] lg:flex-row lg:items-start lg:gap-0 lg:p-0 lg:text-left"
          style={{ background: "#1E5B24", boxShadow: "0 18px 40px rgba(30,91,36,0.28)" }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1180 400"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <circle cx="140" cy="210" r="150" fill="#FFC93C" opacity="0.22" />
            <circle cx="1010" cy="230" r="220" fill="#FFC93C" opacity="0.08" />
            {/* lupa decorativa en trazo blanco */}
            <g stroke="#fff" strokeWidth="14" fill="none" opacity="0.1" strokeLinecap="round">
              <circle cx="1080" cy="70" r="56" />
              <line x1="1120" y1="112" x2="1170" y2="162" />
            </g>
            <g fill="#fff" opacity="0.12">
              <ellipse cx="520" cy="46" rx="60" ry="19" />
              <ellipse cx="556" cy="34" rx="36" ry="21" />
              <ellipse cx="800" cy="90" rx="64" ry="20" />
            </g>
            <path d="M0 330 C 140 292 260 322 390 310 C 540 296 640 342 800 322 C 960 304 1060 332 1180 314 L1180 400 L0 400 Z" fill="#2F7A2F" />
            <path d="M0 362 C 160 336 300 362 460 352 C 620 342 720 372 880 358 C 1020 346 1100 364 1180 356 L1180 400 L0 400 Z" fill="#3E9A38" />
          </svg>

          {/* Superhéroe y logo en pantallas chicas (apilados) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/actividad8-heroe-de-pie-hd.png"
            alt=""
            className="dicc-hero relative z-10 h-[170px] w-auto lg:hidden"
          />

          <div className="relative z-10 w-full max-w-[540px] lg:ml-[280px] lg:mt-9 lg:w-[540px] lg:pb-10">
            <span
              className="inline-block rounded-full px-3 py-1 text-[12px]"
              style={{ background: "rgba(255,255,255,0.16)", color: "#FFE08A", fontWeight: 800, letterSpacing: "1.2px" }}
            >
              {DICCIONARIO.length} PALABRAS DE &quot;LOS INVASORES&quot;
            </span>
            <h1
              className="m-0 mt-2.5 text-[34px] leading-none text-white lg:text-[46px]"
              style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}
            >
              Diccionario del <span style={{ color: "#FFC93C" }}>explorador</span>
            </h1>
            <p className="mb-0 mt-2 text-[15px] lg:text-[17px]" style={{ color: "#E3F2DC", fontWeight: 700 }}>
              ¿Encontraste una palabra rara en &quot;Los invasores&quot;? Búscala aquí, escúchala y descubre qué significa.
            </p>

            <div
              className="mt-4 flex h-16 items-center gap-2.5 rounded-full bg-white pl-5 pr-2 transition-shadow focus-within:ring-4 focus-within:ring-[#FFC93C]"
              style={{ boxShadow: "0 6px 0 #123A16" }}
            >
              <label htmlFor="dicc-q" className="flex min-w-0 flex-1 items-center gap-2.5">
                <span aria-hidden>🔍</span>
                <span className="sr-only">Buscar una palabra</span>
                <input
                  id="dicc-q"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Escribe una palabra… ej: zancudo"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold outline-none"
                  style={{ color: P.ink }}
                />
              </label>
              <button
                type="button"
                onClick={() => setDebounced(query)}
                aria-label="Buscar"
                className="dicc-press grid h-12 w-12 flex-shrink-0 place-items-center rounded-full text-lg text-white"
                style={{ background: "#5DBB46", boxShadow: "0 4px 0 #3C8A2B" }}
              >
                ➔
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              {chips.map((c) => (
                <button
                  key={c.f}
                  onClick={() => elegirFiltro(c.f)}
                  aria-pressed={filtro === c.f}
                  className={`dicc-press dicc-focus h-[38px] rounded-full px-3.5 text-[13px] ${
                    filtro === c.f ? "dicc-chip-on" : "dicc-chip"
                  }`}
                  style={{ fontWeight: 800 }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* PALABRA DEL DÍA (tarjeta blanca) */}
          {wod && (
            <div className="relative z-10 w-full max-w-[320px] lg:ml-auto lg:mr-10 lg:mt-[104px] lg:w-[320px] lg:flex-shrink-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => abrirPalabra(wod)}
                onKeyDown={(e) => e.key === "Enter" && abrirPalabra(wod)}
                className="dicc-focus cursor-pointer rounded-[28px] bg-white px-6 py-[26px] text-left"
                style={{ boxShadow: "0 10px 0 #FFC93C, 0 22px 40px rgba(0,0,0,0.22)" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] text-white"
                    style={{ background: "#8B5CD6", fontWeight: 800, letterSpacing: "1.2px" }}
                  >
                    PALABRA DEL DÍA
                  </span>
                  <span className="text-[24px]" aria-hidden>
                    ✨
                  </span>
                </div>
                <h3 className="m-0 mb-1.5 mt-3 text-[34px] leading-none" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: "#1E5B24" }}>
                  {wod.palabra}
                </h3>
                <p className="m-0 line-clamp-3 text-[14px] font-semibold leading-snug" style={{ color: "#4E5A4B" }}>
                  {wod.definicion}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      hablar(`${wod.palabra}. ${wod.definicion}`);
                    }}
                    className="dicc-press dicc-focus h-10 rounded-[14px] px-3.5 text-[13px] text-white"
                    style={{ background: "#5DBB46", boxShadow: "0 4px 0 #3C8A2B", fontWeight: 800 }}
                  >
                    🔊 Escuchar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWodIndex(Math.floor(Math.random() * pool.length));
                    }}
                    className="dicc-press dicc-focus h-10 rounded-[14px] px-3.5 text-[13px]"
                    style={{ background: "#FFF4D6", color: "#5A3A00", boxShadow: "0 4px 0 #EADFC4", fontWeight: 800 }}
                  >
                    🎲 Otra palabra
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logo apilado en pantallas chicas */}
          <div
            className="relative z-10 flex h-[100px] w-[190px] items-center justify-center rounded-[22px] bg-white p-3 lg:hidden"
            style={{ transform: "rotate(-4deg)", boxShadow: "0 8px 0 #FFC93C" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/logo-educate.png" alt="Edúcate contra el dengue" className="h-full w-full object-contain" />
          </div>
        </section>
      </div>

      {/* ABECEDARIO */}
      <div
        className="mx-auto mb-2 mt-[50px] flex max-w-[1180px] flex-wrap justify-center gap-x-3 gap-y-4 rounded-[30px] bg-white px-4 py-6 sm:gap-x-3.5 sm:gap-y-[18px] lg:px-10 lg:py-[34px]"
        style={{ boxShadow: "0 14px 34px rgba(90,60,20,0.10)" }}
        aria-label="Selecciona una letra"
      >
        {LETTERS.map((L) => {
          const n = conteo[L] ?? 0;
          const on = !q && L === letra;
          return (
            <button
              key={L}
              disabled={n === 0}
              aria-pressed={on}
              title={n === 0 ? `Todavía no hay palabras con ${L}` : `${n} palabras con ${L}`}
              onClick={() => {
                setLetra(L);
                setQuery("");
                setDebounced("");
              }}
              className={`dicc-letter dicc-focus relative h-12 w-12 rounded-[14px] text-[20px] sm:h-[60px] sm:w-[60px] sm:rounded-[16px] sm:text-[24px] ${
                n === 0 ? "dicc-letter-off" : on ? "dicc-letter-on" : "dicc-letter-has"
              }`}
              style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}
            >
              {L}
              {n > 0 && (
                <i
                  className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 bg-white px-1 text-[11px] not-italic"
                  style={{ borderColor: "#F0E6D2", color: "#6B5E45", fontFamily: "var(--font-nunito)", fontWeight: 800 }}
                >
                  {n}
                </i>
              )}
            </button>
          );
        })}
      </div>

      {/* RESULTADOS */}
      <div className="mt-4 grid grid-cols-1 items-start gap-5 md:grid-cols-[160px_1fr]">
        <div className="flex items-center gap-3.5 text-center md:sticky md:top-24 md:block">
          <div
            className="text-[80px] leading-[0.9] md:text-[150px]"
            style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: P.green, textShadow: `6px 6px 0 ${P.ysoft}` }}
          >
            {q ? "🔍" : letra}
          </div>
          <div>
            <p className="m-0 text-[13px] font-extrabold" style={{ color: P.soft }}>
              {q
                ? `${lista.length} ${lista.length === 1 ? "resultado" : "resultados"}`
                : `${lista.length} ${lista.length === 1 ? "palabra" : "palabras"}`}
            </p>
            <span className="dicc-fly inline-block text-[28px]" aria-hidden>
              🦟
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
          {lista.length === 0 && (
            <div className="col-span-full rounded-[20px] bg-white p-8 text-center font-bold" style={{ color: P.soft }}>
              <b className="block text-[22px]" style={{ fontFamily: "var(--font-baloo)", color: P.gdeep }}>
                ¡Ups! No encontramos esa palabra 🦟
              </b>
              Prueba con otra letra, o revisa cómo la escribiste.
            </div>
          )}
          {lista.map((p, i) => {
            const abierta = abiertas.has(p.palabra);
            const tags = secciones[p.palabra] ?? [];
            const dengue = esDelDengue(p);
            return (
              <article
                key={`${q}-${letra}-${filtro}-${p.palabra}`}
                id={slug(p.palabra)}
                className={`dicc-card flex flex-col gap-2 rounded-[20px] bg-white px-4 pb-3 pt-4 ${
                  resaltada === p.palabra ? "dicc-flash" : ""
                }`}
                style={{
                  borderTop: `6px solid ${COLORS[(letraInicial(p.palabra).charCodeAt(0) + i) % 4]}`,
                  boxShadow: "0 6px 16px rgba(47,80,20,0.1)",
                  animationDelay: `${Math.min(i * 35, 500)}ms`,
                }}
              >
                <h2 className="m-0 text-[22px] leading-tight" style={{ fontFamily: "var(--font-baloo)", color: P.gdeep }}>
                  {resaltar(p.palabra)}
                </h2>
                <p
                  className={`m-0 text-[13.5px] font-semibold leading-relaxed ${abierta ? "" : "line-clamp-3"}`}
                  style={{ color: "#4a4235" }}
                >
                  {p.definicion}
                </p>
                {(dengue || tags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {dengue && (
                      <span className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: P.csoft, color: "#B4432A" }}>
                        🦟 Del dengue
                      </span>
                    )}
                    {tags.map((t) => (
                      <span key={t} className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: P.gsoft, color: P.gdark }}>
                        📖 {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <button
                    onClick={() =>
                      setAbiertas((s) => {
                        const n = new Set(s);
                        if (n.has(p.palabra)) n.delete(p.palabra);
                        else n.add(p.palabra);
                        return n;
                      })
                    }
                    className="py-1 text-[12.5px] font-extrabold"
                    style={{ color: "#6B3F9E" }}
                  >
                    {abierta ? "Ver menos ▴" : "Leer todo ▾"}
                  </button>
                  <button
                    onClick={() => hablar(`${p.palabra}. ${p.definicion}`)}
                    aria-label={`Escuchar ${p.palabra}`}
                    className="grid h-[34px] w-[34px] place-items-center rounded-full text-[15px] transition-transform hover:scale-110"
                    style={{ background: P.ysoft }}
                  >
                    🔊
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      </div>

      <style jsx global>{`
        .dicc-press {
          transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
        }
        .dicc-press:hover:not(:disabled) {
          filter: brightness(1.05);
        }
        .dicc-press:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: none !important;
        }
        .dicc-focus:focus-visible {
          outline: 3px solid #8b5cd6;
          outline-offset: 3px;
        }
        .dicc-chip {
          background: rgba(255, 255, 255, 0.12);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: #fff;
        }
        .dicc-chip-on {
          background: #ffc93c;
          color: #4a3000;
          box-shadow: 0 4px 0 #d39a12;
        }
        .dicc-letter {
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .dicc-letter-has {
          background: #fff4d6;
          color: #1e5b24;
          box-shadow: 0 5px 0 #eadfc4;
        }
        .dicc-letter-has:hover {
          transform: translateY(-2px);
        }
        .dicc-letter-on {
          background: #5dbb46;
          color: #fff;
          box-shadow: 0 5px 0 #3c8a2b;
        }
        .dicc-letter-has:active,
        .dicc-letter-on:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #3c8a2b;
        }
        .dicc-letter-off {
          background: #f7f2e6;
          color: #c9c0aa;
          cursor: not-allowed;
        }
        .dicc-hero {
          animation: diccBob 3.2s ease-in-out infinite;
        }
        @keyframes diccBob {
          0%,
          100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(-8px) rotate(3deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .dicc-hero,
          .dicc-fly,
          .dicc-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
        .dicc-card {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
          animation: diccIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .dicc-flash {
          animation: diccIn 0.4s forwards, diccFlash 1.6s ease 0.2s;
        }
        @keyframes diccIn {
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes diccFlash {
          0%,
          100% {
            box-shadow: 0 6px 16px rgba(47, 80, 20, 0.1);
          }
          30% {
            box-shadow: 0 0 0 5px #ffc94a, 0 10px 24px rgba(0, 0, 0, 0.15);
          }
        }
        .dicc-fly {
          animation: diccFly 3.5s ease-in-out infinite;
        }
        @keyframes diccFly {
          0%,
          100% {
            transform: translate(0, 0) rotate(-8deg);
          }
          50% {
            transform: translate(18px, -10px) rotate(8deg);
          }
        }
      `}</style>
    </div>
  );
}
