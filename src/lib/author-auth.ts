import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

async function loadAuthor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Aturan RLS: penulis hanya bisa membaca barisnya sendiri
  const { data: author } = await supabase.from("authors").select("full_name, member_id").eq("user_id", user.id).maybeSingle();
  if (!author) return null;
  return { supabase, user, name: author.full_name as string, memberId: (author.member_id as string | null) ?? null };
}

export const getAuthor = cache(loadAuthor);

export async function requireAuthor() {
  const a = await getAuthor();
  if (!a) redirect("/penulis/masuk");
  return a;
}
