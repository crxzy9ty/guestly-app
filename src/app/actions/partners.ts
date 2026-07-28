"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// No manual role check here: partners RLS only grants insert/update/delete to
// is_admin() (see supabase/migrations/..._rls_policies_and_grants.sql) — if a
// non-admin session somehow called this, the write would simply fail in the
// database, same defense-in-depth pattern used everywhere else in the app.

function fields(formData: FormData) {
  const str = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const thresholdRaw = parseFloat(String(formData.get("alert_threshold") ?? ""));
  const alertThreshold = Number.isFinite(thresholdRaw) ? Math.min(10, Math.max(1, thresholdRaw)) : 6.5;
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: str("address"),
    phone: str("phone"),
    email: str("email"),
    contact_name: str("contact_name"),
    contact_phone: str("contact_phone"),
    alert_threshold: alertThreshold,
  };
}

export async function createPartner(adminSlug: string, formData: FormData) {
  const data = fields(formData);
  if (!data.name) return;

  const supabase = await createClient();
  await supabase.from("partners").insert(data);
  revalidatePath(`/${adminSlug}/partners`);
}

export async function updatePartner(adminSlug: string, partnerId: string, formData: FormData) {
  const data = fields(formData);
  if (!data.name) return;

  const supabase = await createClient();
  await supabase.from("partners").update(data).eq("id", partnerId);
  revalidatePath(`/${adminSlug}/partners`);
}

export async function deletePartner(adminSlug: string, partnerId: string) {
  const supabase = await createClient();
  await supabase.from("partners").delete().eq("id", partnerId);
  revalidatePath(`/${adminSlug}/partners`);
}
