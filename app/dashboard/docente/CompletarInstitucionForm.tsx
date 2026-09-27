"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Institucion = { id: string; nombre: string; municipios: { nombre: string } | null };
type Municipio = { id: string; nombre: string };

export default function CompletarInstitucionForm({ teacherId }: { teacherId: string }) {
  const supabase = createClient();
  const router = useRouter();

  // Los colegios nuevos ahora los agrega FUMISUR desde el panel de
  // administración; el docente solo elige del directorio.
  const [modo] = useState<"elegir" | "crear">("elegir");
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  // Campos para crear una institución nueva
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [municipioId, setMunicipioId] = useState<string>("");
  const [municipioNuevo, setMunicipioNuevo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [escudoFile, setEscudoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const { data: inst } = await supabase
        .from("instituciones")
        .select("id, nombre, municipios(nombre)")
        .order("nombre");
      setInstituciones((inst as unknown as Institucion[]) ?? []);
      const { data: muni } = await supabase.from("municipios").select("id, nombre").order("nombre");
      setMunicipios(muni ?? []);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function subirArchivo(file: File, prefijo: string): Promise<string | null> {
    const ruta = `${prefijo}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("instituciones-logos").upload(ruta, file);
    if (uploadError) {
      setError("No se pudo subir la imagen: " + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from("instituciones-logos").getPublicUrl(ruta);
    return data.publicUrl;
  }

  async function handleElegir() {
    if (!seleccionId) {
      setError("Selecciona una institución de la lista.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ institucion_id: seleccionId })
      .eq("id", teacherId);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function handleCrear() {
    if (!nombre.trim()) {
      setError("El nombre de la institución es obligatorio.");
      return;
    }
    if (!municipioId && !municipioNuevo.trim()) {
      setError("Elige el municipio, o escribe uno nuevo.");
      return;
    }
    setLoading(true);
    setError(null);

    let finalMunicipioId = municipioId || null;

    if (!finalMunicipioId && municipioNuevo.trim()) {
      let escudoUrl: string | null = null;
      if (escudoFile) {
        escudoUrl = await subirArchivo(escudoFile, "municipio");
        if (escudoFile && !escudoUrl) {
          setLoading(false);
          return;
        }
      }
      const { data: nuevoMunicipio, error: municipioError } = await supabase
        .from("municipios")
        .insert({ nombre: municipioNuevo.trim(), escudo_url: escudoUrl })
        .select("id")
        .single();
      if (municipioError) {
        setLoading(false);
        setError(municipioError.message);
        return;
      }
      finalMunicipioId = nuevoMunicipio.id;
    }

    let logoUrl: string | null = null;
    if (logoFile) {
      logoUrl = await subirArchivo(logoFile, "institucion");
      if (logoFile && !logoUrl) {
        setLoading(false);
        return;
      }
    }

    const { data: nuevaInstitucion, error: institucionError } = await supabase
      .from("instituciones")
      .insert({
        nombre: nombre.trim(),
        direccion: direccion.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        logo_url: logoUrl,
        municipio_id: finalMunicipioId,
      })
      .select("id")
      .single();

    if (institucionError) {
      setLoading(false);
      setError(institucionError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ institucion_id: nuevaInstitucion.id })
      .eq("id", teacherId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  const institucionesFiltradas = instituciones.filter((i) =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800">Completa los datos de tu institución</h2>
      <p className="mt-1 text-sm text-gray-500">
        Busca tu colegio en el directorio y selecciónalo. Esto solo se pide una vez. Si tu colegio no
        aparece, pídele a FUMISUR que lo agregue.
      </p>


      {modo === "elegir" ? (
        <div className="mt-4">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca tu institución..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-200">
            {institucionesFiltradas.length === 0 && (
              <p className="p-3 text-sm text-gray-400">No hay instituciones que coincidan.</p>
            )}
            {institucionesFiltradas.map((i) => (
              <label
                key={i.id}
                className={`flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 ${
                  seleccionId === i.id ? "bg-emerald-50" : ""
                }`}
              >
                <input
                  type="radio"
                  name="institucion"
                  checked={seleccionId === i.id}
                  onChange={() => setSeleccionId(i.id)}
                />
                <span className="font-semibold">{i.nombre}</span>
                {i.municipios?.nombre && <span className="text-gray-400">— {i.municipios.nombre}</span>}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {instituciones.length > 0
              ? `${instituciones.length} instituciones en la lista (incluye el directorio del Huila).`
              : ""}
          </p>
          <button
            onClick={handleElegir}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Confirmar institución"}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la institución"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo de contacto"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <label className="text-xs font-semibold text-gray-500">Logo de la institución</label>
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />

          <div className="mt-2 border-t border-gray-100 pt-3">
            <label className="text-xs font-semibold text-gray-500">Municipio</label>
            <select
              value={municipioId}
              onChange={(e) => {
                setMunicipioId(e.target.value);
                setMunicipioNuevo("");
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">— elegir de la lista —</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <p className="my-1 text-center text-xs text-gray-400">o</p>
            <input
              value={municipioNuevo}
              onChange={(e) => {
                setMunicipioNuevo(e.target.value);
                setMunicipioId("");
              }}
              placeholder="Escribe el municipio si no está en la lista"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {municipioNuevo.trim() && (
              <>
                <label className="mt-2 block text-xs font-semibold text-gray-500">
                  Escudo del municipio (opcional)
                </label>
                <input type="file" accept="image/*" onChange={(e) => setEscudoFile(e.target.files?.[0] ?? null)} />
              </>
            )}
          </div>

          <button
            onClick={handleCrear}
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear institución"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
