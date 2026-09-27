"use client";

import { useState } from "react";

// Código del grupo con botón para copiarlo y pegarlo (WhatsApp, tablero...).
export default function CopyCode({ code, large = false }: { code: string; large?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el código igual queda visible.
    }
  }

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-2 rounded-full font-extrabold transition-transform hover:scale-[1.03] ${
        large ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
      }`}
      style={{ background: "#FEF3D6", color: "#8A6100" }}
      title="Copiar código"
    >
      Código:
      <span className={`font-mono tracking-wider ${large ? "text-base" : "text-sm"}`} style={{ color: "#332B1F" }}>
        {code}
      </span>
      <span>{copied ? "✔️" : "📋"}</span>
    </button>
  );
}
