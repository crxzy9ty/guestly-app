"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MarketingContent } from "@/lib/content";

// RLS: content_settings UPDATE is admin-only (is_admin()) — see
// supabase/migrations/..._rls_policies_and_grants.sql. A non-admin session
// calling this would simply have the update rejected by the database.
export async function saveContent(adminSlug: string, content: MarketingContent) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("content_settings")
    .update({ content, updated_by: user?.id ?? null })
    .eq("id", 1);

  if (error) return { ok: false as const };

  revalidatePath("/");
  revalidatePath(`/${adminSlug}/settings`);
  return { ok: true as const };
}

export async function updateDemoRequestStatus(
  adminSlug: string,
  requestId: string,
  status: "new" | "contacted" | "closed",
) {
  const supabase = await createClient();
  await supabase.from("demo_requests").update({ status }).eq("id", requestId);
  revalidatePath(`/${adminSlug}/settings`);
}
