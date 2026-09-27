// Fondo decorativo del sistema visual "Opción B" (Inicio, Libros activos,
// Diccionario): crema con trama de puntos + 3 manchas de color. Va fijo
// detrás del contenido y no recibe clics.
export default function DecorBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
      style={{
        backgroundColor: "#FFF7E8",
        backgroundImage: "radial-gradient(rgba(30,91,36,0.10) 1.6px, transparent 1.6px)",
        backgroundSize: "26px 26px",
      }}
    >
      <span className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full" style={{ background: "#FFE08A", opacity: 0.45 }} />
      <span className="absolute -right-32 -top-10 h-[460px] w-[460px] rounded-full" style={{ background: "#D9C9F5", opacity: 0.5 }} />
      <span className="absolute -bottom-28 -right-24 h-[380px] w-[380px] rounded-full" style={{ background: "#FFC7B5", opacity: 0.45 }} />
    </div>
  );
}
