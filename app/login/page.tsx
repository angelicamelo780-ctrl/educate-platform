"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PALETTE = {
  cream: "#FBF5E6",
  cream2: "#F3ECD7",
  green: "#5FB94C",
  greenDark: "#2E6B2A",
  greenDeep: "#1F4A1D",
  yellow: "#FFC94A",
  yellowDark: "#E8A415",
  purple: "#8C5FBF",
  purpleDark: "#6B3F9E",
  coral: "#EF6F53",
  coralDark: "#D6503A",
  ink: "#332B1F",
  inkSoft: "#6B6152",
};

export default function LoginRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [squashed, setSquashed] = useState(false);

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // register state
  // El rol docente SOLO se obtiene con el enlace de invitación del colegio
  // (/login?invitacion=...). Sin enlace, toda cuenta nueva es de estudiante;
  // la base de datos lo valida de nuevo, así que no se puede saltar.
  const [role, setRole] = useState<"estudiante" | "docente">("estudiante");
  const [invitacion, setInvitacion] = useState<{
    token: string;
    estado: "cargando" | "ok" | "vencida" | "revocada" | "invalida";
    institucion?: string;
    municipio?: string | null;
    escudo?: string | null;
  } | null>(null);
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regNotice, setRegNotice] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invitacion")?.trim();
    if (!token) return;
    setInvitacion({ token, estado: "cargando" });
    setTab("register");
    (async () => {
      const { data, error } = await supabase.rpc("get_invitacion_publica", { _token: token });
      const row = (data as { valida: boolean; motivo: string; institucion: string; municipio: string | null; escudo_url: string | null }[] | null)?.[0];
      if (error || !row) {
        setInvitacion({ token, estado: "invalida" });
        setRole("estudiante");
        return;
      }
      if (!row.valida) {
        setInvitacion({ token, estado: row.motivo === "revocada" ? "revocada" : "vencida", institucion: row.institucion });
        setRole("estudiante");
        return;
      }
      setInvitacion({ token, estado: "ok", institucion: row.institucion, municipio: row.municipio, escudo: row.escudo_url });
      setRole("docente");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const esDocente = role === "docente" && invitacion?.estado === "ok";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginLoading(false);
      setLoginError("Correo o contraseña incorrectos, ¡inténtalo de nuevo!");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const userRole = profile?.role ?? data.user.user_metadata?.role;

    setLoginLoading(false);

    if (userRole === "docente") {
      router.push("/dashboard/docente");
    } else if (userRole === "admin") {
      router.push("/dashboard/admin/colegios");
    } else {
      router.push("/dashboard/estudiante");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);
    setRegNotice(null);
    setRegLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: esDocente
          ? { full_name: fullName, role: "docente", invitacion: invitacion!.token }
          : { full_name: fullName, role: "estudiante" },
      },
    });

    if (error) {
      setRegLoading(false);
      setRegError(error.message);
      return;
    }

    // Si la confirmación por correo está desactivada, ya tenemos sesión
    // activa y podemos unir al estudiante a su grupo de una vez.
    if (data.session && !esDocente && groupCode.trim()) {
      const { data: group } = await supabase
        .from("groups")
        .select("id")
        .eq("join_code", groupCode.trim().toUpperCase())
        .single();

      if (group) {
        await supabase.from("group_members").insert({
          group_id: group.id,
          student_id: data.user!.id,
        });
      }
    }

    setRegLoading(false);

    if (data.session) {
      // El rol final lo decide la base de datos (según el enlace).
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user!.id).single();
      router.push(profile?.role === "docente" ? "/dashboard/docente" : "/dashboard/estudiante");
      return;
    }

    setRegNotice(
      groupCode.trim()
        ? `¡Cuenta creada! Confirma tu correo y luego inicia sesión — usa el código ${groupCode.trim().toUpperCase()} para unirte a tu grupo.`
        : "¡Cuenta creada! Confirma tu correo y luego inicia sesión."
    );
    setTab("login");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center overflow-y-auto p-4 py-8 sm:p-6"
      style={{
        fontFamily: "var(--font-nunito)",
        color: PALETTE.ink,
        background:
          "radial-gradient(circle at 8% 15%, rgba(255,201,74,0.18), transparent 40%), radial-gradient(circle at 92% 85%, rgba(140,95,191,0.14), transparent 45%), " +
          PALETTE.cream,
      }}
    >
      <div
        className="grid w-full max-w-[940px] grid-cols-1 overflow-hidden rounded-[32px] bg-white sm:grid-cols-2"
        style={{ boxShadow: "0 24px 50px rgba(31,74,29,0.18)" }}
      >
        {/* Lado ilustrado */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-9 text-white sm:flex"
          style={{ background: "linear-gradient(165deg, #1F4A1D, #16331A 80%)" }}
        >
          <div className="relative z-10 flex items-center gap-2.5">
            <div
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] text-xl"
              style={{
                background: "radial-gradient(circle at 32% 28%, #fff, #FFC94A 55%, #E8A415 100%)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              }}
            >
              🦟
            </div>
            <div>
              <b className="block text-[15px]" style={{ color: PALETTE.yellow }}>
                Edúcate
              </b>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                contra el dengue
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (squashed) return;
              setSquashed(true);
              setTimeout(() => setSquashed(false), 1200);
            }}
            className={`login-mosquito absolute left-[15%] top-[22%] z-10 text-2xl ${squashed ? "" : "login-mosquito-flying"}`}
            style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.3))" }}
            aria-label="Mosquito"
          >
            {squashed ? "💥" : "🦟"}
          </button>

          <div className="relative z-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/portada-los-invasores.png"
              alt='Portada "Los invasores"'
              className="mx-auto mb-4 w-[120px] rounded-lg"
              style={{
                filter: "drop-shadow(0 14px 20px rgba(0,0,0,0.4))",
                animation: "loginFloat 4s ease-in-out infinite",
              }}
            />
            <h2 className="m-0 mb-1.5 text-[20px]" style={{ fontFamily: "var(--font-baloo)" }}>
              ¡Únete a la misión!
            </h2>
            <p
              className="mx-auto m-0 max-w-[30ch] text-[13px] font-bold"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              Aprende, juega y conviértete en agente anti-dengue con &quot;Los invasores&quot;.
            </p>
          </div>

          <div className="relative z-10 text-[11.5px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
            🌿 Un proyecto de FUMISUR SAS
          </div>
        </div>

        {/* Lado formulario */}
        <div className="flex flex-col p-9 sm:p-11">
          <div className="mb-5 flex items-center gap-2.5 sm:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              style={{
                background: "radial-gradient(circle at 32% 28%, #fff, #FFC94A 55%, #E8A415 100%)",
              }}
            >
              🦟
            </div>
            <div>
              <b className="block text-[15px]" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
                Edúcate
              </b>
              <span className="text-[10.5px] font-bold" style={{ color: PALETTE.inkSoft }}>
                contra el dengue
              </span>
            </div>
          </div>

          <div className="mb-7 flex rounded-full p-1.5" style={{ background: PALETTE.cream2 }}>
            <button
              onClick={() => setTab("login")}
              className="flex-1 rounded-full py-2.5 text-[13.5px] font-extrabold transition-all"
              style={{
                background: tab === "login" ? PALETTE.green : "transparent",
                color: tab === "login" ? "#fff" : PALETTE.inkSoft,
                boxShadow: tab === "login" ? "0 4px 10px rgba(95,185,76,0.35)" : "none",
              }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setTab("register")}
              className="flex-1 rounded-full py-2.5 text-[13.5px] font-extrabold transition-all"
              style={{
                background: tab === "register" ? PALETTE.green : "transparent",
                color: tab === "register" ? "#fff" : PALETTE.inkSoft,
                boxShadow: tab === "register" ? "0 4px 10px rgba(95,185,76,0.35)" : "none",
              }}
            >
              Crear cuenta
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <h1 className="m-0 mb-1 text-2xl" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
                ¡Hola de nuevo! 👋
              </h1>
              <p className="m-0 mb-6 text-[13.5px] font-bold" style={{ color: PALETTE.inkSoft }}>
                Ingresa para seguir tu aventura donde la dejaste.
              </p>

              {loginError && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-[12.5px] font-extrabold"
                  style={{ background: "#FDEBE6", borderColor: PALETTE.coral, color: PALETTE.coralDark }}
                >
                  ⚠️ {loginError}
                </div>
              )}
              {regNotice && (
                <div
                  className="mb-4 rounded-2xl border-2 px-3.5 py-2.5 text-[12.5px] font-extrabold"
                  style={{ background: "#EEF8E8", borderColor: PALETTE.green, color: PALETTE.greenDark }}
                >
                  ✅ {regNotice}
                </div>
              )}

              <Field label="Correo electrónico" icon="✉️">
                <input
                  type="email"
                  required
                  placeholder="tuNombre@correo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Contraseña" icon="🔒">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <button
                type="submit"
                disabled={loginLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-extrabold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(180deg,#7BCB61," + PALETTE.green + ")",
                  boxShadow: "0 8px 16px rgba(95,185,76,0.4)",
                }}
              >
                {loginLoading ? "Entrando..." : "Entrar a la aventura 🚀"}
              </button>

              <p className="mt-5 text-center text-[13px] font-bold" style={{ color: PALETTE.inkSoft }}>
                ¿Aún no tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="font-extrabold"
                  style={{ color: PALETTE.purpleDark }}
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h1 className="m-0 mb-1 text-2xl" style={{ fontFamily: "var(--font-baloo)", color: PALETTE.greenDeep }}>
                {esDocente ? "Crea tu cuenta de docente 🧑‍🏫" : "¡Crea tu cuenta! 🎉"}
              </h1>
              <p className="m-0 mb-5 text-[13.5px] font-bold" style={{ color: PALETTE.inkSoft }}>
                {esDocente
                  ? "Tu colegio ya viene incluido en el enlace: solo completa tus datos."
                  : "Empieza tu aventura anti-dengue."}
              </p>

              {invitacion?.estado === "cargando" && (
                <p className="mb-4 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-extrabold" style={{ background: PALETTE.cream2, color: PALETTE.inkSoft }}>
                  Revisando tu enlace de docente…
                </p>
              )}
              {esDocente && (
                <div
                  className="mb-5 flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3"
                  style={{ background: "#EAF6E4", borderColor: PALETTE.green }}
                >
                  {invitacion?.escudo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={invitacion.escudo}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-full border-2 bg-white object-contain p-1"
                      style={{ borderColor: "#FFC93C" }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] font-extrabold tracking-wide" style={{ color: PALETTE.greenDark }}>
                      COLEGIO{invitacion?.municipio ? ` · ${invitacion.municipio.toUpperCase()}` : ""}
                    </p>
                    <p className="m-0 text-[15px] font-extrabold" style={{ color: PALETTE.greenDeep }}>
                      {invitacion?.institucion}
                    </p>
                  </div>
                </div>
              )}
              {invitacion && ["vencida", "revocada", "invalida"].includes(invitacion.estado) && (
                <div
                  className="mb-4 rounded-2xl border-2 px-3.5 py-2.5 text-[12.5px] font-extrabold"
                  style={{ background: "#FFF4D6", borderColor: PALETTE.yellowDark, color: "#7A4E00" }}
                >
                  ⚠️{" "}
                  {invitacion.estado === "vencida"
                    ? "Este enlace para docentes ya venció."
                    : invitacion.estado === "revocada"
                    ? "Este enlace para docentes fue reemplazado por uno nuevo."
                    : "Este enlace para docentes no es válido."}{" "}
                  Pídele a tu colegio el enlace actualizado. Si eres estudiante, puedes crear tu cuenta aquí abajo.
                </div>
              )}

              {regError && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-[12.5px] font-extrabold"
                  style={{ background: "#FDEBE6", borderColor: PALETTE.coral, color: PALETTE.coralDark }}
                >
                  ⚠️ {regError}
                </div>
              )}


              <Field label="Nombre completo" icon="🖊️">
                <input
                  type="text"
                  required
                  placeholder="Laura Gómez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Correo electrónico" icon="✉️">
                <input
                  type="email"
                  required
                  placeholder="tuNombre@correo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Contraseña" icon="🔒">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              {!esDocente && (
                <Field label="Código de grupo (opcional por ahora)" icon="🔑">
                  <input
                    type="text"
                    placeholder="Ej: AB12CD"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              )}
              {!esDocente && (
                <p className="-mt-2 mb-4 text-[11.5px] font-bold" style={{ color: PALETTE.inkSoft }}>
                  Tu docente te lo comparte — si no lo tienes, puedes unirte después.
                </p>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="mt-1 w-full rounded-full py-3.5 text-[15px] font-extrabold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(180deg,#7BCB61," + PALETTE.green + ")",
                  boxShadow: "0 8px 16px rgba(95,185,76,0.4)",
                }}
              >
                {regLoading ? "Creando..." : "Crear mi cuenta 🌱"}
              </button>

              {!esDocente && (
                <p
                  className="mt-4 rounded-2xl px-3.5 py-2.5 text-center text-[12px] font-bold"
                  style={{ background: PALETTE.cream2, color: PALETTE.inkSoft }}
                >
                  🧑‍🏫 ¿Eres docente? Pídele a tu colegio el enlace de registro para docentes.
                </p>
              )}

              <p className="mt-5 text-center text-[13px] font-bold" style={{ color: PALETTE.inkSoft }}>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="font-extrabold"
                  style={{ color: PALETTE.purpleDark }}
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes loginFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }
        @keyframes loginFly {
          0% {
            top: 20%;
            left: -10%;
            transform: scaleX(-1) rotate(-6deg);
          }
          50% {
            top: 55%;
            left: 60%;
            transform: scaleX(-1) rotate(4deg);
          }
          100% {
            top: 20%;
            left: 110%;
            transform: scaleX(-1) rotate(-6deg);
          }
        }
        .login-mosquito {
          animation: none;
        }
        .login-mosquito-flying {
          animation: loginFly 9s linear infinite !important;
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "14.5px",
  fontWeight: 700,
  color: "#332B1F",
  width: "100%",
};

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[12.5px] font-extrabold" style={{ color: PALETTE.ink }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 rounded-2xl border-2 px-3.5 py-3 transition-colors"
        style={{ background: PALETTE.cream, borderColor: PALETTE.cream2 }}
      >
        <span className="text-base opacity-70">{icon}</span>
        {children}
      </div>
    </div>
  );
}
