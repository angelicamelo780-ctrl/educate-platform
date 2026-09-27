"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useViewerMode, mapHref } from "@/lib/viewerMode";
import { getNextActivity } from "@/lib/nextActivity";
import { buscarExacta, esDelDengue, hablar, TOKEN_RE, type Palabra } from "@/lib/diccionario";

type Page = { id: string; page_number: number; heading: string | null; body: string | null; image_url?: string | null };

// Sonido de "hoja pasando" sintetizado con Web Audio API — no necesita
// ningún archivo de audio externo.
function playPageTurnSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const duration = 0.55;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Envolvente en dos golpes (like whoosh + settle) para que suene
      // más a una hoja real deslizándose y cayendo.
      const envelope = Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.3);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.65;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(3200, ctx.currentTime + duration * 0.4);
    filter.frequency.linearRampToValueAtTime(1800, ctx.currentTime + duration);
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, simplemente
    // no suena — no interrumpe la lectura.
  }
}

// ---------------------------------------------------------------------------
// Lector a pantalla completa con efecto de hoja que se dobla (page-flip,
// MIT). Las hojas se arman con DOM imperativo dentro de un contenedor que
// React nunca re-renderiza, porque la librería mueve esos nodos por su
// cuenta; React solo maneja la interfaz alrededor (barra, botones, fin).
// ---------------------------------------------------------------------------

const COVER_SRC = "/illustrations/portada-los-invasores.png";
const LOGO_SRC = "/illustrations/logo-educate.png";

function isPortraitViewport() {
  return window.innerWidth < 760;
}

// Lo más grande posible (≈ pantalla completa) manteniendo la proporción de
// hoja. En celular se muestra 1 página y la hoja es un poco más alargada.
function computeSize() {
  const portrait = isPortraitViewport();
  const ratio = portrait ? 0.62 : 0.7;
  const top = portrait ? 64 : 70;
  const bottom = portrait ? 70 : 56;
  const availH = window.innerHeight - top - bottom - 24;
  const availW = window.innerWidth - (portrait ? 20 : 190);
  const count = portrait ? 1 : 2;
  let pageH = availH;
  let pageW = pageH * ratio;
  if (pageW * count > availW) {
    pageW = availW / count;
    pageH = pageW / ratio;
  }
  return { pageW: Math.floor(pageW), pageH: Math.floor(pageH), count };
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Marca las palabras del diccionario dentro del texto. Van como <button>
// porque page-flip ignora los clics sobre botones (no pasa la página al
// tocar una palabra).
function markDictionaryWords(text: string) {
  return escapeHtml(text).replace(TOKEN_RE, (tok) => {
    const p = buscarExacta(tok);
    return p ? `<button type="button" class="lb-word" data-w="${escapeHtml(p.palabra)}">${tok}</button>` : tok;
  });
}

function buildPageNodes(pages: Page[], title: string): HTMLElement[] {
  const make = (html: string) => {
    const d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstElementChild as HTMLElement;
  };
  const nodes: HTMLElement[] = [];
  nodes.push(
    make(`<div class="lb-page lb-cover" data-density="hard"><img src="${COVER_SRC}" alt="Portada del libro" /></div>`)
  );
  for (const p of pages) {
    if (p.image_url) {
      // La ilustración llena TODA la hoja (object-fit: cover) con un pequeño
      // zoom que recorta los bordes del escaneo.
      nodes.push(
        make(
          `<div class="lb-page lb-image"><div class="lb-inner"><img src="${escapeHtml(p.image_url)}" alt="Ilustración del libro" /><span class="lb-num">${p.page_number}</span></div></div>`
        )
      );
    } else {
      nodes.push(
        make(
          `<div class="lb-page lb-text"><div class="lb-inner">${
            p.heading ? `<h2>${escapeHtml(p.heading)}</h2>` : ""
          }<div class="lb-body">${markDictionaryWords(p.body ?? "")}</div><span class="lb-num">${p.page_number}</span></div></div>`
        )
      );
    }
  }
  nodes.push(
    make(
      `<div class="lb-page lb-back" data-density="hard"><div class="lb-inner"><h3>Fin de la lectura</h3><p>${escapeHtml(
        title
      )}</p><img src="${LOGO_SRC}" alt="Edúcate contra el dengue" /></div></div>`
    )
  );
  return nodes;
}

// Mismo tamaño de letra en todo el libro (como uno impreso); solo se reduce
// en la hoja que no alcance. Se mide ANTES de montar, porque la librería
// oculta las hojas que no están a la vista (sin alto no se puede medir).
function fitText(nodes: HTMLElement[], pageW: number, pageH: number) {
  const measurer = document.createElement("div");
  measurer.className = "lb-measure";
  document.body.appendChild(measurer);
  const base = Math.max(13, Math.min(23, pageH / 33));
  for (const node of nodes) {
    if (!node.classList.contains("lb-text")) continue;
    node.style.width = `${pageW}px`;
    node.style.height = `${pageH}px`;
    measurer.appendChild(node);
    const inner = node.querySelector<HTMLElement>(".lb-inner")!;
    const body = node.querySelector<HTMLElement>(".lb-body")!;
    let size = base;
    inner.style.fontSize = `${size}px`;
    while (body.scrollHeight > body.clientHeight + 1 && size > 12) {
      size -= 0.5;
      inner.style.fontSize = `${size}px`;
    }
    // Último recurso (páginas muy largas en celular): scroll dentro de la hoja.
    if (body.scrollHeight > body.clientHeight + 1) body.classList.add("lb-scroll");
    node.style.width = "";
    node.style.height = "";
  }
  measurer.remove();
}

export default function LecturaClient({
  chapterId,
  title,
  pages,
  moduleNumber,
  moduleTitle,
}: {
  chapterId: string;
  title: string;
  pages: Page[];
  moduleNumber: number;
  moduleTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const viewerMode = useViewerMode();

  const holderRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlipInstance | null>(null);
  const mutedRef = useRef(false);
  const finishedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [portrait, setPortrait] = useState(false);
  const [shift, setShift] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [lastVisible, setLastVisible] = useState(0);

  // Popup del diccionario al tocar/pasar por una palabra marcada.
  const [word, setWord] = useState<{ p: Palabra; rect: DOMRect } | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(() => new Set());
  const popRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dictHref = viewerMode.preview ? "/dashboard/docente/diccionario" : "/dashboard/estudiante/diccionario";

  // Siguiente paso de la sección en el mismo orden del mapa: si la sección
  // tiene video (p. ej. "El caos"), va primero el video y luego las
  // actividades.
  const [nextStep, setNextStep] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    async function loadNext() {
      const { data: chapter } = await supabase.from("chapters").select("unit_id").eq("id", chapterId).single();
      if (chapter?.unit_id) {
        const { data: videos } = await supabase
          .from("videos")
          .select("id")
          .eq("unit_id", chapter.unit_id)
          .limit(1);
        if (videos && videos.length > 0) {
          setNextStep({ href: `${viewerMode.base}/videos/${videos[0].id}`, label: "Continuar al video" });
          return;
        }
        const next = await getNextActivity(supabase, chapter.unit_id, 0);
        if (next) {
          setNextStep({
            href: `${viewerMode.base}/actividades/${next.id}`,
            label: "Continuar a la siguiente actividad",
          });
        }
      }
    }
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const handleReachedEnd = useCallback(async () => {
    // Si ya se completó antes (p. ej. "Leer otra vez"), solo vuelve a mostrar
    // las opciones del final, sin guardar de nuevo.
    if (finishedRef.current) {
      setTimeout(() => setShowDone(true), 450);
      return;
    }
    finishedRef.current = true;
    if (!viewerMode.preview) await supabase.rpc("complete_reading", { _chapter_id: chapterId });
    setFinished(true);
    setTimeout(() => setShowDone(true), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, viewerMode.preview]);

  // Montar (y re-montar al cambiar el tamaño de la ventana) el libro.
  useEffect(() => {
    if (pages.length === 0) return;
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let last = { w: window.innerWidth, h: window.innerHeight };

    async function mount(startPage: number) {
      const { PageFlip } = (await import("page-flip")) as unknown as { PageFlip: PageFlipCtor };
      if (cancelled || !holderRef.current || !wrapRef.current) return;

      const { pageW, pageH, count } = computeSize();
      wrapRef.current.style.width = `${pageW * count}px`;
      wrapRef.current.style.height = `${pageH}px`;
      setPortrait(count === 1);

      holderRef.current.innerHTML = "";
      const bookEl = document.createElement("div");
      holderRef.current.appendChild(bookEl);

      const nodes = buildPageNodes(pages, title);
      fitText(nodes, pageW, pageH);
      nodes.forEach((n) => bookEl.appendChild(n));

      const flip = new PageFlip(bookEl, {
        width: pageW,
        height: pageH,
        size: "fixed",
        showCover: true,
        usePortrait: true,
        drawShadow: true,
        maxShadowOpacity: 0.55,
        flippingTime: 900,
        mobileScrollSupport: false,
        swipeDistance: 20,
        showPageCorners: true,
        startPage,
      });
      flip.loadFromHTML(Array.from(bookEl.querySelectorAll<HTMLElement>(".lb-page")));
      flipRef.current = flip;

      const sync = () => {
        const i = flip.getCurrentPageIndex();
        const n = flip.getPageCount();
        setIndex(i);
        setTotal(n);
        // Hoja suelta (portada, o contraportada sin pareja): en modo de dos
        // páginas el libro se desliza para dejarla CENTRADA.
        let s = 0;
        if (flip.getOrientation() === "landscape") {
          if (i === 0) s = -pageW / 2;
          else if (i === n - 1 && i % 2 === 1) s = pageW / 2;
        }
        setShift(s);
        // En modo de dos páginas el índice es el de la hoja IZQUIERDA: si el
        // capítulo tiene un número impar de páginas, la contraportada queda
        // a la derecha del último par y el índice nunca llega a n-1.
        const lastVisible = flip.getOrientation() === "landscape" && i > 0 ? i + 1 : i;
        setLastVisible(lastVisible);
        if (lastVisible >= n - 1) handleReachedEnd();
      };
      flip.on("flip", sync);
      flip.on("changeState", (e) => {
        if (e.data === "flipping" || e.data === "user_fold") setWord(null);
        if (e.data === "flipping" && !mutedRef.current) playPageTurnSound();
      });
      sync();
    }

    mount(0);

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (Math.abs(w - last.w) < 40 && Math.abs(h - last.h) < 60) return;
        last = { w, h };
        const at = flipRef.current?.getCurrentPageIndex() ?? 0;
        flipRef.current?.destroy();
        flipRef.current = null;
        mount(at);
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      flipRef.current?.destroy();
      flipRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, title]);

  // Palabras del diccionario: eventos delegados en el contenedor del libro
  // (las hojas se re-crean al cambiar de tamaño, el contenedor no).
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const canHover = window.matchMedia("(hover: hover)").matches;
    const target = (e: Event) => (e.target as HTMLElement | null)?.closest?.(".lb-word") as HTMLElement | null;
    const open = (el: HTMLElement) => {
      const p = buscarExacta(el.dataset.w ?? "");
      if (!p) return;
      clearTimeout(hideTimer.current);
      holder.querySelectorAll(".lb-word.lb-active").forEach((x) => x.classList.remove("lb-active"));
      el.classList.add("lb-active");
      setWord({ p, rect: el.getBoundingClientRect() });
      setDiscovered((s) => (s.has(p.palabra) ? s : new Set(s).add(p.palabra)));
    };
    const onClick = (e: MouseEvent) => {
      const el = target(e);
      if (!el) return;
      e.stopPropagation();
      open(el);
    };
    const onOver = (e: MouseEvent) => {
      const el = target(e);
      if (el) open(el);
    };
    const onOut = (e: MouseEvent) => {
      if (target(e)) hideTimer.current = setTimeout(() => setWord(null), 260);
    };
    holder.addEventListener("click", onClick);
    if (canHover) {
      holder.addEventListener("mouseover", onOver);
      holder.addEventListener("mouseout", onOut);
    }
    return () => {
      holder.removeEventListener("click", onClick);
      holder.removeEventListener("mouseover", onOver);
      holder.removeEventListener("mouseout", onOut);
    };
  }, [pages.length]);

  useEffect(() => {
    if (word) return;
    holderRef.current?.querySelectorAll(".lb-word.lb-active").forEach((x) => x.classList.remove("lb-active"));
  }, [word]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      setWord(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Ubica el popup encima de la palabra (o debajo si no cabe arriba).
  useLayoutEffect(() => {
    const pop = popRef.current;
    if (!pop || !word) return;
    const r = word.rect;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const left = Math.min(Math.max(10, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 10);
    let top = r.top - ph - 14;
    let below = false;
    if (top < 70) {
      top = r.bottom + 14;
      below = true;
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.setProperty("--ax", `${r.left + r.width / 2 - left}px`);
    pop.classList.toggle("lb-pop-below", below);
  }, [word]);

  // Aparece con un fundido; bloquea el scroll de la página de fondo.
  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
    };
  }, []);

  const close = useCallback(() => {
    router.push(mapHref(viewerMode));
  }, [router, viewerMode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") flipRef.current?.flipNext();
      if (e.key === "ArrowLeft") flipRef.current?.flipPrev();
      if (e.key === "Escape") {
        if (word) setWord(null);
        else close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, word]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function rereadFromStart() {
    setShowDone(false);
    flipRef.current?.turnToPage(0);
    const n = flipRef.current?.getPageCount() ?? 0;
    setIndex(0);
    setLastVisible(0);
    setShift(n > 0 && !portrait ? -(wrapRef.current?.offsetWidth ?? 0) / 4 : 0);
  }

  const contentPages = Math.max(0, total - 2);
  const atEnd = total > 0 && lastVisible >= total - 1;
  const counter =
    total === 0
      ? ""
      : index === 0
      ? "Portada"
      : atEnd
      ? "Fin"
      : portrait
      ? `Página ${index} de ${contentPages}`
      : `Páginas ${index}–${Math.min(index + 1, contentPages)} de ${contentPages}`;
  const progressPct = total > 1 ? Math.round((index / (total - 1)) * 100) : 0;

  return (
    <div
      className={`lb-reader fixed inset-0 z-[300] grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] items-center px-3 py-2.5 transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`Lectura: ${title}`}
    >
      {/* Barra superior: ubicación + sonido + pantalla completa + cerrar */}
      <div className="flex min-h-12 items-center gap-2.5">
        <div
          className="min-w-0 rounded-2xl px-3.5 py-1.5 shadow-lg"
          style={{ background: "linear-gradient(160deg, #b98a4f, #8a6136)" }}
        >
          <p className="m-0 truncate text-[10px] font-bold leading-tight" style={{ color: "#f3ead2" }}>
            Módulo {moduleNumber} &gt; {moduleTitle}
          </p>
          <h1 className="m-0 truncate text-[14px] leading-tight" style={{ fontFamily: "var(--font-baloo)", color: "#fffdf7" }}>
            {title}
          </h1>
        </div>
        {viewerMode.preview && (
          <span
            className="hidden flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold text-white sm:inline"
            style={{ background: "rgba(140,95,191,0.85)" }}
          >
            👩‍🏫 Vista previa: no guarda progreso
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          className="lb-icon-btn"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button onClick={toggleFullscreen} aria-label="Pantalla completa" className="lb-icon-btn lb-fs">
          ⤢
        </button>
        <button onClick={close} aria-label="Cerrar lectura" className="lb-icon-btn lb-close">
          ✕
        </button>
      </div>

      {/* Libro */}
      <div className="relative flex h-full min-h-0 items-center justify-center">
        {pages.length === 0 ? (
          <p className="rounded-2xl bg-white/90 px-5 py-3 text-sm font-bold text-gray-600">
            Este capítulo todavía no tiene páginas cargadas.
          </p>
        ) : (
          <div
            ref={wrapRef}
            className="relative"
            style={{ transform: `translateX(${shift}px)`, transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}
          >
            <button
              onClick={() => flipRef.current?.flipPrev()}
              disabled={index === 0}
              aria-label="Página anterior"
              className="lb-nav hidden sm:block"
              style={{ left: -74 }}
            >
              ‹
            </button>
            <div ref={holderRef} className="lb-book" />
            <button
              onClick={() => flipRef.current?.flipNext()}
              disabled={atEnd}
              aria-label="Página siguiente"
              className="lb-nav hidden sm:block"
              style={{ right: -74 }}
            >
              ›
            </button>
          </div>
        )}

        {showDone && (
          <div className="absolute inset-0 z-40 grid place-items-center" style={{ background: "rgba(10,12,30,0.55)" }}>
            <div className="lb-done-card mx-3 max-w-[420px] rounded-[36px] border-4 border-emerald-500 bg-white px-6 py-8 text-center shadow-2xl">
              <div className="text-3xl">🎉📖🦟</div>
              <h2 className="m-0 mt-1 text-2xl font-extrabold text-emerald-700" style={{ fontFamily: "var(--font-baloo)" }}>
                ¡Terminaste la lectura!
              </h2>
              <p className="mt-2 text-sm font-semibold text-gray-600">¿Seguimos con las actividades de esta sección?</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                {nextStep && (
                  <Link
                    href={nextStep.href}
                    className="inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-extrabold text-white shadow"
                  >
                    {nextStep.label}
                  </Link>
                )}
                <Link
                  href={mapHref(viewerMode)}
                  className="inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow"
                >
                  Volver al mapa de aventura
                </Link>
              </div>
              <button
                onClick={rereadFromStart}
                className="mt-3 rounded-full px-5 py-2 text-sm font-extrabold"
                style={{ background: "#f3ecd7", color: "#2E6B2A" }}
              >
                ↺ Leer otra vez
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior: contador + progreso (+ flechas en celular) */}
      <div className="flex min-h-10 items-center justify-center gap-3.5 text-white">
        <button
          onClick={() => flipRef.current?.flipPrev()}
          disabled={index === 0}
          aria-label="Página anterior"
          className="lb-mnav sm:hidden"
        >
          ‹
        </button>
        <span className="rounded-full px-3.5 py-1.5 text-[13px] font-extrabold" style={{ background: "rgba(0,0,0,0.35)" }}>
          {counter}
        </span>
        <span className="h-1.5 w-[min(320px,40vw)] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
          <i
            className="block h-full transition-[width] duration-500"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#FFC94A,#5FB94C)" }}
          />
        </span>
        <span className="hidden text-xs font-bold opacity-80 lg:inline">
          {finished ? "¡Lectura completada! ✔️" : "Arrastra la esquina de la hoja · toca las palabras con puntitos"}
        </span>
        {discovered.size > 0 && (
          <span
            className="rounded-full px-3 py-1.5 text-[12px] font-extrabold"
            style={{ background: "#FFC94A", color: "#332B1F" }}
            title={Array.from(discovered).join(", ")}
          >
            ⭐ {discovered.size} {discovered.size === 1 ? "palabra descubierta" : "palabras descubiertas"}
          </span>
        )}
        <button
          onClick={() => flipRef.current?.flipNext()}
          disabled={atEnd}
          aria-label="Página siguiente"
          className="lb-mnav sm:hidden"
        >
          ›
        </button>
      </div>

      {word && (
        <div
          ref={popRef}
          className="lb-pop"
          role="dialog"
          aria-label={`Significado de ${word.p.palabra}`}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={() => {
            hideTimer.current = setTimeout(() => setWord(null), 260);
          }}
        >
          <button className="lb-pop-x" onClick={() => setWord(null)} aria-label="Cerrar">
            ✕
          </button>
          <h5>
            {word.p.palabra}
            {esDelDengue(word.p) && <small>DENGUE</small>}
          </h5>
          <p>{word.p.definicion}</p>
          <div className="lb-pop-row">
            <button
              className="lb-pop-say"
              onClick={() => hablar(`${word.p.palabra}. ${word.p.definicion}`)}
              aria-label="Escuchar"
            >
              🔊
            </button>
            <a
              href={`${dictHref}?palabra=${encodeURIComponent(word.p.palabra)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lb-pop-link"
            >
              Ver en el diccionario ↗
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
        .lb-reader {
          background: linear-gradient(rgba(12, 14, 34, 0.72), rgba(12, 14, 34, 0.72)),
            url(/illustrations/escena-nocturna.jpg) center / cover no-repeat, #191c3f;
          padding-top: max(10px, env(safe-area-inset-top, 0px));
          padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
          font-family: var(--font-nunito), system-ui, sans-serif;
        }
        .lb-icon-btn {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          font-size: 18px;
          backdrop-filter: blur(4px);
          transition: transform 0.15s, background 0.15s;
        }
        .lb-icon-btn:hover {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 0.24);
        }
        .lb-fs {
          display: none;
        }
        @media (min-width: 640px) {
          .lb-fs {
            display: grid;
          }
        }
        .lb-close {
          width: 52px;
          height: 52px;
          background: #fff !important;
          color: #1f4a1d;
          font-size: 24px;
          font-weight: 800;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        }
        .lb-nav {
          position: absolute;
          top: 50%;
          z-index: 20;
          width: 58px;
          height: 58px;
          transform: translateY(-50%);
          border-radius: 9999px;
          background: #fff;
          color: #0284c7;
          font-family: var(--font-baloo), system-ui, sans-serif;
          font-size: 34px;
          font-weight: 800;
          line-height: 1;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          transition: transform 0.15s, opacity 0.2s;
        }
        .lb-nav:hover {
          transform: translateY(-50%) scale(1.1);
        }
        .lb-nav:disabled {
          opacity: 0;
          pointer-events: none;
        }
        .lb-mnav {
          display: inline-grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 9999px;
          background: #fff;
          color: #0284c7;
          font-family: var(--font-baloo), system-ui, sans-serif;
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
        }
        .lb-mnav:disabled {
          opacity: 0.35;
        }
        @media (min-width: 640px) {
          .lb-mnav {
            display: none;
          }
        }
        .lb-book {
          filter: drop-shadow(0 26px 40px rgba(0, 0, 0, 0.45));
        }
        .lb-page {
          background: #fffdf7;
          overflow: hidden;
        }
        .lb-measure {
          position: absolute;
          left: -99999px;
          top: 0;
          visibility: hidden;
        }
        .lb-measure .lb-page {
          position: relative;
        }
        .lb-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          padding: 7% 8% 5%;
        }
        .lb-text .lb-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 20% 10%, rgba(255, 201, 74, 0.07), transparent 40%),
            repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.012) 0 2px, transparent 2px 4px);
        }
        .lb-page h2 {
          margin: 0 0 0.6em;
          text-align: center;
          font-family: var(--font-baloo), system-ui, sans-serif;
          font-size: 1.45em;
          font-weight: 800;
          line-height: 1.1;
          color: #ea580c;
        }
        .lb-body {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          white-space: pre-line;
          line-height: 1.55;
          font-weight: 500;
          color: #2b2b2b;
        }
        .lb-body.lb-scroll {
          overflow-y: auto;
        }
        .lb-num {
          position: absolute;
          bottom: 2.4%;
          font-size: 12px;
          font-weight: 700;
          color: #b9b2a3;
        }
        .lb-page.--left .lb-num {
          left: 6%;
        }
        .lb-page.--right .lb-num {
          right: 6%;
        }
        /* Lomo del libro: sombra suave hacia el centro */
        .lb-page.--left .lb-inner {
          box-shadow: inset -26px 0 30px -24px rgba(0, 0, 0, 0.35);
        }
        .lb-page.--right .lb-inner {
          box-shadow: inset 26px 0 30px -24px rgba(0, 0, 0, 0.35);
        }
        .lb-image .lb-inner {
          padding: 0;
          overflow: hidden;
        }
        .lb-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transform: scale(1.05);
        }
        .lb-image .lb-num {
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }
        .lb-cover {
          background: #1f4a1d;
        }
        .lb-cover img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }
        .lb-back {
          background: linear-gradient(160deg, #2e6b2a, #1f4a1d);
          color: #fff;
        }
        .lb-back .lb-inner {
          align-items: center;
          justify-content: center;
          gap: 14px;
          text-align: center;
        }
        .lb-back h3 {
          margin: 0;
          font-family: var(--font-baloo), system-ui, sans-serif;
          font-size: 2.2em;
          font-weight: 800;
          line-height: 1;
        }
        .lb-back p {
          margin: 0;
          font-weight: 700;
          opacity: 0.85;
        }
        .lb-back img {
          width: 46%;
          max-width: 180px;
          border-radius: 14px;
          background: #fff;
          padding: 8px;
        }
        .lb-word {
          display: inline;
          margin: 0;
          padding: 0;
          border: 0;
          border-bottom: 2px dotted #8c5fbf;
          border-radius: 3px;
          background: none;
          color: inherit;
          font: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          text-align: inherit;
          cursor: help;
          transition: background 0.15s, color 0.15s;
        }
        .lb-word:hover,
        .lb-word.lb-active {
          background: #ede3f7;
          color: #6b3f9e;
        }
        .lb-pop {
          position: fixed;
          z-index: 400;
          width: min(320px, 86vw);
          padding: 14px 16px 12px;
          border-top: 6px solid #8c5fbf;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
          animation: lbPopIn 0.16s ease;
        }
        .lb-pop::after {
          content: "";
          position: absolute;
          left: var(--ax, 50%);
          bottom: -9px;
          width: 18px;
          height: 18px;
          transform: translateX(-50%) rotate(45deg);
          border-radius: 3px;
          background: #fff;
        }
        .lb-pop.lb-pop-below::after {
          top: -9px;
          bottom: auto;
        }
        .lb-pop h5 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          padding-right: 18px;
          font-family: var(--font-baloo), system-ui, sans-serif;
          font-size: 22px;
          font-weight: 800;
          line-height: 1;
          color: #6b3f9e;
        }
        .lb-pop h5 small {
          padding: 3px 8px;
          border-radius: 999px;
          background: #8c5fbf;
          color: #fff;
          font-size: 10px;
          letter-spacing: 0.04em;
          font-family: var(--font-nunito), sans-serif;
        }
        .lb-pop p {
          max-height: 40vh;
          overflow-y: auto;
          margin: 8px 0 10px;
          color: #4a4235;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.5;
        }
        .lb-pop-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .lb-pop-say {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: #fef3d6;
          font-size: 15px;
        }
        .lb-pop-link {
          color: #6b3f9e;
          font-size: 12.5px;
          font-weight: 800;
        }
        .lb-pop-x {
          position: absolute;
          right: 10px;
          top: 8px;
          color: #aaa;
          font-size: 16px;
        }
        @keyframes lbPopIn {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .lb-done-card {
          animation: lbPop 0.4s cubic-bezier(0.22, 1.4, 0.36, 1);
        }
        @keyframes lbPop {
          from {
            transform: scale(0.7);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Tipos mínimos de page-flip (el paquete no trae declaraciones).
type PageFlipEvent = { data: unknown };
type PageFlipInstance = {
  loadFromHTML(items: HTMLElement[]): void;
  on(event: "flip" | "changeState" | "changeOrientation" | "init", cb: (e: PageFlipEvent) => void): void;
  flipNext(): void;
  flipPrev(): void;
  turnToPage(page: number): void;
  getCurrentPageIndex(): number;
  getPageCount(): number;
  getOrientation(): "portrait" | "landscape";
  destroy(): void;
};
type PageFlipCtor = new (el: HTMLElement, settings: Record<string, unknown>) => PageFlipInstance;
