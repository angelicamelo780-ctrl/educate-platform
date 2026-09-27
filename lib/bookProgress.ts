import { SupabaseClient } from "@supabase/supabase-js";

export type Row = {
  key: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  href: string;
  // "locked": el ítem anterior de la sección aún no está terminado (o la
  // sección entera sigue bloqueada). Mismo criterio que los niveles del mapa.
  status: "done" | "pending" | "score" | "locked";
  scoreLabel?: string;
};

export type UnitData = {
  id: string;
  title: string;
  rows: Row[];
  total: number;
  done: number;
  pct: number;
  state: "done" | "current" | "locked";
};

const ACTIVITY_ICONS = ["🧩", "🎯", "🔀", "🖐️", "🖐️"];

// Descripciones reales de la plataforma original, por título de contenido.
const DESCRIPTIONS: Record<string, string> = {
  "Los Invasores - Capítulos 1 y 2":
    '¡Prepárate para una emocionante aventura con nuestro increíble libro "Los Invasores"! Sumérgete en sus páginas y descubre los fascinantes momentos que te esperan, llenos de acción y misterio.',
  "Actividad 1":
    "¡Atrévete a ser un héroe contra el dengue! Participa en nuestras actividades y aprende cómo proteger a tu familia y comunidad.",
  "Actividad 2":
    "¡Explora el mundo del dengue de manera interactiva! Nuestras actividades te enseñarán cómo prevenir esta enfermedad y salvar vidas.",
  "Actividad 3":
    "¡Prevenir el dengue es un desafío que podemos superar juntos! Únete a nuestras actividades y haz la diferencia.",
  'Cuestionario "la invasión"':
    'En este cuestionario podrás poner a prueba todo lo tratado en los capítulos 1 y 2 del libro "Los invasores".',
  "Capítulos 3 y 4":
    "Descubre la emoción y aventura que te dejarán sin aliento. ¡Es hora de sumergirse en un mundo lleno de acción y diversión!",
  "Ciclo de vida del mosquito": "Aprende paso a paso cómo nace y se convierte en adulto un mosquito.",
  "Actividad 4":
    "¡Transforma el conocimiento en acción! Participa en nuestras actividades y conviértete en un agente de cambio.",
  "Actividad 5":
    "¡Descubre cómo pequeñas acciones pueden marcar la diferencia en la prevención del dengue!",
  'Cuestionario "El caos"':
    'En este cuestionario podrás poner a prueba todo lo tratado en los capítulos 3 y 4 del libro "Los invasores".',
  'Cuestionario "Batalla final"':
    "En este cuestionario podrás poner a prueba todo lo tratado en los capítulos 5 y 6 del libro.",
  "Capítulos 5 y 6":
    '¡Adéntrate en la intriga y la emoción en este final de nuestro libro "Los Invasores"! ¡Prepárate para vivir una aventura como nunca antes! En estos emocionantes capítulos, nuestros valientes héroes se enfrentarán a desafíos aún mayores.',
  "Actividad 7":
    "¡Juntos podemos detener al dengue! Únete a nuestras actividades y construyamos un futuro más saludable.",
  "Actividad 8":
    "¡Aprende, practica y previene! Participa en nuestras actividades y haz tu parte en la lucha contra el dengue.",
  "Actividad 9 - Juego del Ahorcado":
    "Estimado candidato antidengue, estás a punto de ingresar al reto el cual corresponde a un juego de ahorcado donde deberás encontrar las 3 palabras ocultas.",
  "Actividad 10 - Juego de sopa de letras":
    "El doctor alberto explicó los síntomas característicos del dengue. Búscalos en la sopa de letras, haz click sobre las letras para completar la palabra.",
};

function describe(title: string, fallback: string) {
  return DESCRIPTIONS[title] ?? fallback;
}

type Catalog = {
  units: { id: string; title: string; order_index: number }[];
  chapters: { id: string; title: string; unit_id: string }[];
  activities: { id: string; title: string; unit_id: string }[];
  quizzes: { id: string; title: string; unit_id: string }[];
  videos: { id: string; title: string; unit_id: string }[];
};

type Attempt = { quiz_id: string; score: number; passed: boolean; submitted_at?: string };

type StudentCompletions = {
  readSet: Set<string>;
  actSet: Set<string>;
  videoSet: Set<string>;
  attempts: Attempt[];
};

// Contenido del libro (igual para todos): unidades y sus ítems.
async function fetchCatalog(supabase: SupabaseClient): Promise<Catalog> {
  const { data: units } = await supabase
    .from("units")
    .select("id, title, order_index")
    .order("order_index", { ascending: true });

  const unitIds = (units ?? []).map((u) => u.id);

  const [{ data: chapters }, { data: activities }, { data: quizzes }, { data: videos }] = await Promise.all([
    supabase.from("chapters").select("id, title, unit_id").in("unit_id", unitIds),
    supabase
      .from("activities")
      .select("id, title, unit_id")
      .in("unit_id", unitIds)
      .order("order_index", { ascending: true }),
    supabase.from("quizzes").select("id, title, unit_id").in("unit_id", unitIds),
    supabase.from("videos").select("id, title, unit_id").in("unit_id", unitIds),
  ]);

  return {
    units: units ?? [],
    chapters: chapters ?? [],
    activities: activities ?? [],
    quizzes: quizzes ?? [],
    videos: videos ?? [],
  };
}

// Un estudiante puede intentar un cuestionario varias veces (por ejemplo,
// fallar y luego aprobar). Nos quedamos con el MEJOR intento por
// cuestionario: si alguno está aprobado, ese manda; si no, el de mayor puntaje.
function bestAttempts(attempts: Attempt[]) {
  const best = new Map<string, Attempt>();
  for (const a of attempts) {
    const current = best.get(a.quiz_id);
    if (
      !current ||
      (a.passed && !current.passed) ||
      (a.passed === current.passed && a.score > current.score)
    ) {
      best.set(a.quiz_id, a);
    }
  }
  return best;
}

// Cálculo puro (sin consultas) del mapa de un estudiante.
function computeProgress(catalog: Catalog, c: StudentCompletions, basePath: string) {
  const { units, chapters, activities, quizzes, videos } = catalog;
  const bestAttemptByQuiz = bestAttempts(c.attempts);

  const totalItems = chapters.length + activities.length + quizzes.length + videos.length;
  const doneItems =
    chapters.filter((ch) => c.readSet.has(ch.id)).length +
    activities.filter((a) => c.actSet.has(a.id)).length +
    quizzes.filter((q) => c.attempts.some((a) => a.quiz_id === q.id)).length +
    videos.filter((v) => c.videoSet.has(v.id)).length;

  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const unitsData: UnitData[] = [];
  let currentAssigned = false;

  for (const unit of units) {
    const rows: Row[] = [];

    for (const ch of chapters.filter((x) => x.unit_id === unit.id)) {
      rows.push({
        key: `chapter-${ch.id}`,
        icon: "📖",
        label: "Lectura",
        title: ch.title,
        description: describe(ch.title, "Lee el capítulo de esta sección."),
        href: `${basePath}/lecturas/${ch.id}`,
        status: c.readSet.has(ch.id) ? "done" : "pending",
      });
    }
    for (const v of videos.filter((x) => x.unit_id === unit.id)) {
      rows.push({
        key: `video-${v.id}`,
        icon: "🎬",
        label: v.title,
        title: v.title,
        description: describe(v.title, "Mira este video."),
        href: `${basePath}/videos/${v.id}`,
        status: c.videoSet.has(v.id) ? "done" : "pending",
      });
    }
    activities
      .filter((x) => x.unit_id === unit.id)
      .forEach((act, i) => {
        rows.push({
          key: `activity-${act.id}`,
          icon: ACTIVITY_ICONS[i] ?? "🖐️",
          label: act.title,
          title: act.title,
          description: describe(act.title, "Completa esta actividad interactiva."),
          href: `${basePath}/actividades/${act.id}`,
          status: c.actSet.has(act.id) ? "done" : "pending",
        });
      });
    for (const q of quizzes.filter((x) => x.unit_id === unit.id)) {
      const attempt = bestAttemptByQuiz.get(q.id);
      rows.push({
        key: `quiz-${q.id}`,
        icon: "📝",
        label: "Cuestionario",
        title: q.title,
        description: describe(q.title, "Pon a prueba lo que aprendiste."),
        href: `${basePath}/quizzes/${q.id}`,
        status: attempt ? (attempt.passed ? "done" : "score") : "pending",
        scoreLabel: attempt ? `${attempt.score}%` : undefined,
      });
    }

    const total = rows.length;
    const done = rows.filter((r) => r.status === "done").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    let state: "done" | "current" | "locked";
    if (total > 0 && done === total) {
      state = "done";
    } else if (total > 0 && !currentAssigned) {
      state = "current";
      currentAssigned = true;
    } else {
      state = "locked";
    }

    // Desbloqueo en cadena dentro de la sección: cada ítem se abre solo
    // cuando el anterior está terminado (el quiz cuenta como terminado solo
    // si se aprobó). En una sección bloqueada, todo queda bloqueado. Lo ya
    // hecho nunca se vuelve a bloquear, para que puedan repasarlo.
    let prevDone = state !== "locked";
    for (const row of rows) {
      if (row.status !== "done" && !prevDone) {
        row.status = "locked";
        row.scoreLabel = undefined;
      }
      prevDone = row.status === "done";
    }

    unitsData.push({ id: unit.id, title: unit.title, rows, total, done, pct, state });
  }

  return { unitsData, overallPct, bestAttemptByQuiz };
}

// basePath permite reutilizar el mismo mapa para el docente
// (/dashboard/docente/material) con los enlaces apuntando a su vista previa.
export async function getBookProgress(
  supabase: SupabaseClient,
  userId: string,
  basePath: string = "/dashboard/estudiante"
) {
  const [catalog, r, a, v, q] = await Promise.all([
    fetchCatalog(supabase),
    supabase.from("reading_completions").select("chapter_id").eq("student_id", userId),
    supabase.from("activity_completions").select("activity_id").eq("student_id", userId),
    supabase.from("video_completions").select("video_id").eq("student_id", userId),
    supabase.from("quiz_attempts").select("quiz_id, score, passed").eq("student_id", userId),
  ]);

  const { unitsData, overallPct, bestAttemptByQuiz } = computeProgress(
    catalog,
    {
      readSet: new Set(r.data?.map((x) => x.chapter_id)),
      actSet: new Set(a.data?.map((x) => x.activity_id)),
      videoSet: new Set(v.data?.map((x) => x.video_id)),
      attempts: q.data ?? [],
    },
    basePath
  );

  const passedQuizId = catalog.quizzes.find((qz) => bestAttemptByQuiz.get(qz.id)?.passed)?.id;
  const { data: certifiableAttempt } = passedQuizId
    ? await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("student_id", userId)
        .eq("quiz_id", passedQuizId)
        .eq("passed", true)
        .limit(1)
        .maybeSingle()
    : { data: null };

  return {
    unitsData,
    overallPct,
    certifiableAttemptId: (certifiableAttempt?.id as string | undefined) ?? null,
  };
}

// ¿Puede el estudiante abrir este ítem? key = "chapter-<id>", "video-<id>",
// "activity-<id>" o "quiz-<id>". Si el ítem no aparece en el mapa (p. ej.
// contenido sin unidad), no se bloquea.
export function isRowLocked(unitsData: UnitData[], key: string) {
  for (const unit of unitsData) {
    const row = unit.rows.find((r) => r.key === key);
    if (row) return row.status === "locked";
  }
  return false;
}

export type StudentProgress = {
  unitsData: UnitData[];
  overallPct: number;
  lastActivityAt: string | null;
  hasCertificate: boolean;
};

// Progreso de VARIOS estudiantes de una vez (panel del docente). Hace el
// mismo cálculo que getBookProgress, pero con 1 consulta por tabla para todo
// el grupo en vez de ~9 consultas por estudiante. La RLS existente
// (teaches_student) garantiza que el docente solo recibe filas de SUS
// estudiantes.
export async function getGroupProgress(
  supabase: SupabaseClient,
  studentIds: string[],
  basePath: string = "/dashboard/estudiante"
): Promise<Map<string, StudentProgress>> {
  const result = new Map<string, StudentProgress>();
  if (studentIds.length === 0) return result;

  const [catalog, r, a, v, q, certs] = await Promise.all([
    fetchCatalog(supabase),
    supabase.from("reading_completions").select("student_id, chapter_id, completed_at").in("student_id", studentIds),
    supabase.from("activity_completions").select("student_id, activity_id, completed_at").in("student_id", studentIds),
    supabase.from("video_completions").select("student_id, video_id, completed_at").in("student_id", studentIds),
    supabase.from("quiz_attempts").select("student_id, quiz_id, score, passed, submitted_at").in("student_id", studentIds),
    supabase.from("certificates").select("student_id").in("student_id", studentIds),
  ]);

  for (const err of [r.error, a.error, v.error, q.error, certs.error]) {
    if (err) console.error("Error cargando progreso del grupo:", err);
  }

  const certSet = new Set((certs.data ?? []).map((c) => c.student_id as string));

  for (const id of studentIds) {
    const reads = (r.data ?? []).filter((x) => x.student_id === id);
    const acts = (a.data ?? []).filter((x) => x.student_id === id);
    const vids = (v.data ?? []).filter((x) => x.student_id === id);
    const atts = (q.data ?? []).filter((x) => x.student_id === id);

    const dates = [
      ...reads.map((x) => x.completed_at as string),
      ...acts.map((x) => x.completed_at as string),
      ...vids.map((x) => x.completed_at as string),
      ...atts.map((x) => x.submitted_at as string),
    ].filter(Boolean);
    const lastActivityAt = dates.length ? dates.sort().at(-1)! : null;

    const { unitsData, overallPct } = computeProgress(
      catalog,
      {
        readSet: new Set(reads.map((x) => x.chapter_id)),
        actSet: new Set(acts.map((x) => x.activity_id)),
        videoSet: new Set(vids.map((x) => x.video_id)),
        attempts: atts,
      },
      basePath
    );

    result.set(id, { unitsData, overallPct, lastActivityAt, hasCertificate: certSet.has(id) });
  }

  return result;
}
