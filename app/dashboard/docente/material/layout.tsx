import { ViewerModeProvider } from "@/lib/viewerMode";

// Todo lo que está bajo /dashboard/docente/material reutiliza las MISMAS
// pantallas del estudiante (lector, actividades, videos, cuestionarios) en
// modo vista previa: enlaces apuntando a esta sección y sin guardar progreso.
export default function MaterialLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewerModeProvider base="/dashboard/docente/material" preview>
      {children}
    </ViewerModeProvider>
  );
}
