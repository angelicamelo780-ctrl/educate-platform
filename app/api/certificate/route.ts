import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { attempt_id } = await request.json();
  if (!attempt_id) {
    return NextResponse.json({ error: "Falta attempt_id" }, { status: 400 });
  }

  // 1. Verificar que el intento es del usuario logueado y que aprobó.
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, student_id, score, passed")
    .eq("id", attempt_id)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });
  }
  if (attempt.student_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!attempt.passed) {
    return NextResponse.json({ error: "Este intento no aprobó el quiz" }, { status: 400 });
  }

  // 2. Si ya existe un certificado para este intento, lo devolvemos tal cual.
  const { data: existing } = await supabase
    .from("certificates")
    .select("pdf_url")
    .eq("attempt_id", attempt_id)
    .maybeSingle();

  if (existing?.pdf_url) {
    return NextResponse.json({ pdf_url: existing.pdf_url });
  }

  // 3. Datos para el certificado.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("title")
    .eq("id", attempt.quiz_id)
    .single();

  const studentName = profile?.full_name ?? "Estudiante";
  const quizTitle = quiz?.title ?? "Cuestionario";
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 4. Generar el PDF.
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 horizontal
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const verde = rgb(0.176, 0.608, 0.431);
  const morado = rgb(0.482, 0.31, 0.627);
  const gris = rgb(0.3, 0.3, 0.3);

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(0.984, 0.969, 0.925) });
  page.drawRectangle({ x: 20, y: 20, width: 802, height: 555, borderColor: verde, borderWidth: 4 });

  page.drawText("Edúcate contra el Dengue", {
    x: 60,
    y: 500,
    size: 20,
    font: fontBold,
    color: verde,
  });

  page.drawText("Certificado de finalización", {
    x: 60,
    y: 430,
    size: 34,
    font: fontBold,
    color: morado,
  });

  page.drawText("Se otorga el presente certificado a:", {
    x: 60,
    y: 370,
    size: 14,
    font: fontRegular,
    color: gris,
  });

  page.drawText(studentName, {
    x: 60,
    y: 335,
    size: 28,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(`por completar exitosamente: ${quizTitle}`, {
    x: 60,
    y: 295,
    size: 15,
    font: fontRegular,
    color: gris,
  });

  page.drawText(`Puntaje obtenido: ${attempt.score}%`, {
    x: 60,
    y: 265,
    size: 15,
    font: fontRegular,
    color: gris,
  });

  page.drawText(fecha, {
    x: 60,
    y: 90,
    size: 12,
    font: fontRegular,
    color: gris,
  });

  const pdfBytes = await pdfDoc.save();

  // 5. Subir a Storage.
  const path = `${user.id}/${attempt_id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("certificates")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("certificates").getPublicUrl(path);

  // 6. Guardar el registro del certificado.
  const { error: insertError } = await supabase.from("certificates").insert({
    student_id: user.id,
    quiz_id: attempt.quiz_id,
    attempt_id: attempt_id,
    pdf_url: publicUrl,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ pdf_url: publicUrl });
}
