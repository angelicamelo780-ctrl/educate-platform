"use client";

import { createContext, useContext } from "react";

// Modo de visualización del material del libro.
//
// - Estudiante (por defecto): base "/dashboard/estudiante", preview=false →
//   las lecturas/actividades/videos/cuestionarios guardan progreso normal.
// - Docente: base "/dashboard/docente/material", preview=true → el docente ve
//   exactamente el mismo material, todo desbloqueado, pero NADA de lo que haga
//   se guarda como progreso (no marca completados ni crea intentos de quiz).
//
// Los componentes cliente leen este contexto para armar sus enlaces
// ("Volver al mapa", "Siguiente actividad") y para saltarse las escrituras.
export type ViewerMode = { base: string; preview: boolean };

const DEFAULT_MODE: ViewerMode = { base: "/dashboard/estudiante", preview: false };

const ViewerModeContext = createContext<ViewerMode>(DEFAULT_MODE);

export function ViewerModeProvider({
  base,
  preview,
  children,
}: ViewerMode & { children: React.ReactNode }) {
  return <ViewerModeContext.Provider value={{ base, preview }}>{children}</ViewerModeContext.Provider>;
}

export function useViewerMode(): ViewerMode {
  return useContext(ViewerModeContext);
}

// Ruta del mapa de aventura para cada modo.
export function mapHref(mode: ViewerMode) {
  return mode.preview ? mode.base : `${mode.base}/libro`;
}
