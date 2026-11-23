import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type AdminSession = NonNullable<Awaited<ReturnType<typeof loadAdmin>>>;

async function loadAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabase
    .from("admins")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return null;
  return { supabase, user, name: admin.full_name as string, role: admin.role as "super_admin" | "pengurus" };
}

export const getAdmin = cache(loadAdmin);

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") redirect("/admin");
  return admin;
}
