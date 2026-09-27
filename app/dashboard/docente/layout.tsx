import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeacherInstitution } from "@/lib/institution";
import DocenteShell from "./DocenteShell";

export default async function DocenteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? "";
  const institution = await getTeacherInstitution(supabase, user.id);

  return (
    <DocenteShell displayName={displayName} institution={institution}>
      {children}
    </DocenteShell>
  );
}
