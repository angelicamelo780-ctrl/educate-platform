"use client";

import { useState } from "react";
import { playSquashSound } from "@/lib/sounds";

export function Mosquito({
  className = "",
  flip = false,
  style,
}: {
  className?: string;
  flip?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{
        width: 40,
        height: 40,
        animationName: "flyLoop",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        transform: flip ? "scaleX(-1)" : undefined,
        ...style,
      }}
    >
      <ellipse cx="32" cy="36" rx="9" ry="14" fill="#5E3A7D" />
      <circle cx="32" cy="18" r="7" fill="#2C2C2A" />
      <ellipse cx="16" cy="24" rx="16" ry="7" fill="#C9B6E0" opacity="0.85" transform="rotate(-20 16 24)" />
      <ellipse cx="48" cy="24" rx="16" ry="7" fill="#C9B6E0" opacity="0.85" transform="rotate(20 48 24)" />
      <line x1="32" y1="11" x2="26" y2="4" stroke="#2C2C2A" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="11" x2="38" y2="4" stroke="#2C2C2A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Mosquito decorativo interactivo: si le dan clic, se "aplasta" con
// animación + sonido de splat, y después de un momento revive y sigue
// volando. Puramente por diversión, no afecta el progreso de nada.
export function SquashableMosquito({
  className = "",
  flip = false,
  style,
}: {
  className?: string;
  flip?: boolean;
  style?: React.CSSProperties;
}) {
  const [squashed, setSquashed] = useState(false);

  function handleClick() {
    if (squashed) return;
    playSquashSound();
    setSquashed(true);
    setTimeout(() => setSquashed(false), 1800);
  }

  if (squashed) {
    return (
      <svg
        viewBox="0 0 64 64"
        className={className}
        style={{ width: 40, height: 40, cursor: "pointer", ...style, animationName: "none" }}
        onClick={handleClick}
        role="button"
        aria-label="Aplastar mosquito"
      >
        <g className="splat-pop">
          <ellipse cx="32" cy="40" rx="20" ry="7" fill="#3f2b52" opacity="0.85" />
          <path
            d="M14 40 q4 -10 8 0 q4 -12 8 0 q4 -14 8 0 q4 -12 8 0 q4 -10 8 0"
            fill="#5E3A7D"
            opacity="0.7"
          />
          <text x="32" y="24" fontSize="14" textAnchor="middle">
            💥
          </text>
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{
        width: 40,
        height: 40,
        cursor: "pointer",
        animationName: "flyLoop",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        transform: flip ? "scaleX(-1)" : undefined,
        ...style,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Aplastar mosquito"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <ellipse cx="32" cy="36" rx="9" ry="14" fill="#5E3A7D" />
      <circle cx="32" cy="18" r="7" fill="#2C2C2A" />
      <ellipse cx="16" cy="24" rx="16" ry="7" fill="#C9B6E0" opacity="0.85" transform="rotate(-20 16 24)" />
      <ellipse cx="48" cy="24" rx="16" ry="7" fill="#C9B6E0" opacity="0.85" transform="rotate(20 48 24)" />
      <line x1="32" y1="11" x2="26" y2="4" stroke="#2C2C2A" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="11" x2="38" y2="4" stroke="#2C2C2A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EducateLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/illustrations/logo-educate.png" alt="Edúcate contra el dengue" className="mx-auto h-14 w-auto" />
  );
}

// Estilos globales compartidos por las pantallas "tipo nube" (actividades y quizzes).
export const CLOUD_GLOBAL_STYLES = `
  @keyframes flyLoop {
    0% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(24px, -14px) rotate(8deg); }
    50% { transform: translate(48px, 4px) rotate(-6deg); }
    75% { transform: translate(20px, 18px) rotate(4deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  @keyframes walkBob {
    from { transform: translateY(0) rotate(-6deg); }
    to { transform: translateY(-5px) rotate(6deg); }
  }
  @keyframes walkAcross {
    from { transform: translateX(-10%); }
    to { transform: translateX(110%); }
  }
  .walker {
    animation: walkAcross 11s linear infinite;
  }
  @keyframes splatPop {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .splat-pop {
    animation: splatPop 0.25s ease-out;
    transform-origin: center;
  }
`;
