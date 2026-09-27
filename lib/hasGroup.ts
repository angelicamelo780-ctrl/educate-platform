import { SupabaseClient } from "@supabase/supabase-js";

export async function hasGroup(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("student_id", userId);
  return (count ?? 0) > 0;
}
