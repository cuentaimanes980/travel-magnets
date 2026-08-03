import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminContext() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { client, user: null };

  const { data: admin, error } = await client.from("admin_users").select("id").eq("id", user.id).eq("is_active", true).maybeSingle();
  if (error || !admin) return { client, user: null };
  return { client, user };
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (!context.user) redirect("/admin/login?error=not-authorized");
  return { client: context.client, user: context.user };
}

export async function requireAdminApi() {
  const context = await getAdminContext();
  if (!context.user) return undefined;
  return context;
}
