import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentInstitution } from "@/lib/institution";
import EstudianteShell from "./EstudianteShell";

export default async function EstudianteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? "";
  const institution = await getStudentInstitution(supabase, user.id);

  return (
    <EstudianteShell displayName={displayName} institution={institution}>
      {children}
    </EstudianteShell>
  );
}
