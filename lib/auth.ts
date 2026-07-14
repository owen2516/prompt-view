import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Admin } from "@/types/db";

// Returns the currently logged-in admin's auth user id, or null.
// Route Handlers use this to decide `admin_id` scoping before touching the
// service-role client (which itself bypasses RLS and has no idea who's asking).
export async function getAuthenticatedAdminId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAuthenticatedAdmin(): Promise<Admin | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Admin) ?? null;
}
