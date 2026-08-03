import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin, error } = await client.from("admin_users").select("id").eq("id", user.id).eq("is_active", true).maybeSingle();
  if (error || !admin) redirect("/admin/login?error=not-authorized");
  return { client, user };
}

