"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Colegio = {
  id: string;
  nombre: string;
  municipio: string | null;
  escudo_url: string | null;
  docentes: number;
  registros_con_enlace: number;
  token: string | null;
  expira_en: string | null;
};

const C = {
  gDeep: "#1E5B24",
  gBtn: "#5DBB46",
  gBtnShadow: "#3C8A2B",
  yellow: "#FFC93C",
  cream: "#FFF4D6",
  text: "#1F2A1E",
  text2: "#6B5E45",
  purple: "#8B5CD6",
};

function fecha(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export default function ColegiosClient({ municipios }: { municipios: { id: string; nombre: string }[] }) {
  const supabase = createClient();
  const [q, setQ] = useState("");
  const [lista, setLista] = useState<Colegio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const cargar = useCallback(
    async (texto: string) => {
      const { data, error } = await supabase.rpc("admin_listar_colegios", { _q: texto });
      if (error) {
        setError(
          /admin_listar_colegios/.test(error.message)
            ? "Falta instalar la base de datos de enlaces: ejecuta supabase/enlaces_docentes.sql en Supabase."
            : error.message
        );
        setLista([]);
        return;
      }
      setError(null);
      setLista((data as Colegio[]) ?? []);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const t = setTimeout(() => cargar(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q, cargar]);

  const enlace = (token: string) => `${origin}/login?invitacion=${token}`;

  const mensaje = (c: Colegio) =>
    `Hola 👋 Este es el enlace para que los docentes de ${c.nombre} creen su cuenta en la plataforma Edúcate contra el dengue:\n${enlace(
      c.token!
    )}\n\nCada docente lo abre, escribe su nombre, correo y contraseña, y listo. El enlace sirve hasta el ${fecha(
      c.expira_en
    )}. Por favor compártanlo solo con docentes.`;

  async function copiar(texto: string, key: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(key);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      window.prompt("Copia este texto:", texto);
    }
  }

  async function generar(c: Colegio) {
    if (c.token && !window.confirm(`¿Cambiar el enlace de ${c.nombre}? El enlace anterior dejará de funcionar (los docentes ya registrados no se ven afectados).`))
      return;
    setBusy(c.id);
    const { error } = await supabase.rpc("admin_generar_invitacion", { _institucion_id: c.id });
    setBusy(null);
    if (error) return setError(error.message);
    await cargar(q.trim());
  }

  async function desactivar(c: Colegio) {
    if (!window.confirm(`¿Desactivar el enlace de ${c.nombre}? Nadie más podrá registrarse como docente con él.`)) return;
    setBusy(c.id);
    const { error } = await supabase.rpc("admin_revocar_invitacion", { _institucion_id: c.id });
    setBusy(null);
    if (error) return setError(error.message);
    await cargar(q.trim());
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[30px] leading-tight" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: C.gDeep }}>
            Colegios y enlaces para docentes
          </h1>
          <p className="m-0 mt-1 max-w-[70ch] text-sm font-semibold" style={{ color: C.text2 }}>
            Genera el enlace de un colegio y envíaselo al rector. Cada docente que lo abra queda registrado con ese
            colegio. Si un enlace se filtra, cámbialo: el anterior deja de servir.
          </p>
        </div>
        <button
          onClick={() => setNuevoAbierto((v) => !v)}
          className="admin-btn h-11 rounded-[14px] px-4 text-sm font-extrabold"
          style={{ background: C.cream, color: "#5A3A00", boxShadow: "0 4px 0 #EADFC4" }}
        >
          ➕ Agregar colegio
        </button>
      </div>

      {nuevoAbierto && (
        <NuevoColegio
          municipios={municipios}
          onCreado={(nombre) => {
            setNuevoAbierto(false);
            setQ(nombre);
          }}
        />
      )}

      <label className="mb-4 flex h-14 items-center gap-2.5 rounded-full bg-white px-5 shadow-sm focus-within:ring-4 focus-within:ring-[#FFC93C]">
        <span aria-hidden>🔍</span>
        <span className="sr-only">Buscar colegio o municipio</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca por colegio o municipio… ej: Pitalito"
          className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none"
          style={{ color: C.text }}
        />
      </label>

      {error && (
        <p className="mb-4 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold" style={{ background: "#FDEBE6", borderColor: "#EF6F53", color: "#B4432A" }}>
          ⚠️ {error}
        </p>
      )}

      {lista === null ? (
        <p className="text-sm font-bold" style={{ color: C.text2 }}>
          Cargando colegios…
        </p>
      ) : lista.length === 0 && !error ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm font-bold" style={{ color: C.text2 }}>
          No encontramos colegios con esa búsqueda. Puedes agregarlo con &quot;➕ Agregar colegio&quot;.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((c) => (
            <article
              key={c.id}
              className="rounded-[24px] bg-white p-4 sm:p-5"
              style={{ boxShadow: "0 10px 24px rgba(90,60,20,0.08)", borderLeft: `6px solid ${c.token ? C.gBtn : "#E5DCC9"}` }}
            >
              <div className="flex flex-wrap items-center gap-3">
                {c.escudo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.escudo_url}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-full border-2 bg-white object-contain p-1"
                    style={{ borderColor: C.yellow }}
                  />
                ) : (
                  <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full text-xl" style={{ background: C.cream }}>
                    🏫
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="m-0 text-[17px] leading-tight" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: C.text }}>
                    {c.nombre}
                  </h2>
                  <p className="m-0 text-xs font-bold" style={{ color: C.text2 }}>
                    {c.municipio ?? "Sin municipio"} · {c.docentes} {c.docentes === 1 ? "docente" : "docentes"}
                    {c.registros_con_enlace > 0 && ` · ${c.registros_con_enlace} registrados con enlace`}
                  </p>
                </div>
                {!c.token ? (
                  <button
                    onClick={() => generar(c)}
                    disabled={busy === c.id}
                    className="admin-btn h-11 rounded-[14px] px-4 text-sm font-extrabold text-white disabled:opacity-60"
                    style={{ background: C.gBtn, boxShadow: `0 4px 0 ${C.gBtnShadow}` }}
                  >
                    {busy === c.id ? "Generando…" : "🔗 Generar enlace para docentes"}
                  </button>
                ) : (
                  <span className="rounded-full px-3 py-1 text-[11px] font-extrabold" style={{ background: "#E9F7E2", color: C.gDeep }}>
                    ✅ Enlace activo hasta el {fecha(c.expira_en)}
                  </span>
                )}
              </div>

              {c.token && (
                <div className="mt-3 flex flex-col gap-2.5 rounded-2xl p-3 sm:flex-row sm:items-center" style={{ background: "#FFF7E8" }}>
                  <code className="min-w-0 flex-1 truncate rounded-xl bg-white px-3 py-2 text-[12.5px] font-bold" style={{ color: C.text }}>
                    {enlace(c.token)}
                  </code>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copiar(enlace(c.token!), `l-${c.id}`)}
                      className="admin-btn h-10 rounded-[12px] px-3 text-[13px] font-extrabold text-white"
                      style={{ background: C.gBtn, boxShadow: `0 4px 0 ${C.gBtnShadow}` }}
                    >
                      {copiado === `l-${c.id}` ? "✔️ Copiado" : "📋 Copiar enlace"}
                    </button>
                    <button
                      onClick={() => copiar(mensaje(c), `m-${c.id}`)}
                      className="admin-btn h-10 rounded-[12px] px-3 text-[13px] font-extrabold"
                      style={{ background: C.cream, color: "#5A3A00", boxShadow: "0 4px 0 #EADFC4" }}
                    >
                      {copiado === `m-${c.id}` ? "✔️ Copiado" : "💬 Copiar mensaje para WhatsApp"}
                    </button>
                    <button
                      onClick={() => generar(c)}
                      disabled={busy === c.id}
                      className="admin-btn h-10 rounded-[12px] border-2 bg-white px-3 text-[13px] font-extrabold disabled:opacity-60"
                      style={{ borderColor: "#E5DCC9", color: C.text }}
                    >
                      🔄 Cambiar enlace
                    </button>
                    <button
                      onClick={() => desactivar(c)}
                      disabled={busy === c.id}
                      className="admin-btn h-10 rounded-[12px] border-2 bg-white px-3 text-[13px] font-extrabold disabled:opacity-60"
                      style={{ borderColor: "#F7C3B1", color: "#B4432A" }}
                    >
                      ⛔ Desactivar
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
          {lista.length === 60 && (
            <p className="text-center text-xs font-bold" style={{ color: C.text2 }}>
              Se muestran los primeros 60 — escribe en el buscador para encontrar otro colegio.
            </p>
          )}
        </div>
      )}

      <style jsx global>{`
        .admin-btn {
          transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
        }
        .admin-btn:hover:not(:disabled) {
          filter: brightness(1.04);
        }
        .admin-btn:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: none !important;
        }
        .admin-btn:focus-visible {
          outline: 3px solid #8b5cd6;
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}

function NuevoColegio({
  municipios,
  onCreado,
}: {
  municipios: { id: string; nombre: string }[];
  onCreado: (nombre: string) => void;
}) {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [municipioId, setMunicipioId] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!municipioId) return setError("Elige el municipio.");
    setLoading(true);
    const { error } = await supabase.rpc("admin_crear_colegio", {
      _nombre: nombre,
      _municipio_id: municipioId,
      _direccion: direccion,
      _telefono: telefono,
      _email: email,
    });
    setLoading(false);
    if (error) return setError(error.message);
    onCreado(nombre.trim());
  }

  const input = "h-11 w-full rounded-xl border-2 border-[#E5DCC9] bg-white px-3 text-sm font-bold outline-none focus:border-[#5DBB46]";

  return (
    <form onSubmit={guardar} className="mb-5 grid gap-3 rounded-[24px] bg-white p-5 shadow-sm sm:grid-cols-2">
      <h2 className="m-0 text-lg sm:col-span-2" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800, color: "#1E5B24" }}>
        Agregar un colegio que no está en el directorio
      </h2>
      <label className="text-xs font-extrabold text-gray-600 sm:col-span-2">
        Nombre del colegio *
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={input} />
      </label>
      <label className="text-xs font-extrabold text-gray-600">
        Municipio *
        <select required value={municipioId} onChange={(e) => setMunicipioId(e.target.value)} className={input}>
          <option value="">Elige…</option>
          {municipios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-extrabold text-gray-600">
        Dirección
        <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={input} />
      </label>
      <label className="text-xs font-extrabold text-gray-600">
        Teléfono
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={input} />
      </label>
      <label className="text-xs font-extrabold text-gray-600">
        Correo
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </label>
      {error && <p className="m-0 text-sm font-extrabold text-red-700 sm:col-span-2">⚠️ {error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="admin-btn h-11 rounded-[14px] px-5 text-sm font-extrabold text-white disabled:opacity-60"
          style={{ background: "#5DBB46", boxShadow: "0 4px 0 #3C8A2B" }}
        >
          {loading ? "Guardando…" : "Guardar colegio"}
        </button>
      </div>
    </form>
  );
}
