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

  // An empty <input type="date"> submits "", which Postgres rejects for a
  // `date` column — it has to become a real NULL. NULL is also the meaningful
  // "no subscription recorded" state, so clearing the field must work.
  const subscriptionStart = str("subscription_start");
  const subscriptionEnd = str("subscription_end");

  // Same empty-string-to-null handling as the dates above. NULL is also the
  // meaningful "use the 8-20 heatmap default" state (src/lib/dashboard/heatmap.ts).
  const hour = (key: string) => {
    const raw = str(key);
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isInteger(n) && n >= 0 && n <= 23 ? n : null;
  };
  const openHour = hour("open_hour");
  const closeHour = hour("close_hour");

  const prizeFrequencyRaw = String(formData.get("prize_frequency") ?? "");
  const prizeFrequency: "weekly" | "monthly" = prizeFrequencyRaw === "monthly" ? "monthly" : "weekly";

  return {
    name: String(formData.get("name") ?? "").trim(),
    address: str("address"),
    phone: str("phone"),
    email: str("email"),
    contact_name: str("contact_name"),
    contact_phone: str("contact_phone"),
    alert_threshold: alertThreshold,
    subscription_start: subscriptionStart,
    subscription_end: subscriptionEnd,
    open_hour: openHour,
    close_hour: closeHour,
    prize_frequency: prizeFrequency,
    prize_description: str("prize_description"),
  };
}

// The DB has a check constraint rejecting end < start, but a silent no-op is a
// bad answer for a typo the admin can immediately fix — so catch it here and
// report it instead of letting the write fail invisibly.
function periodError(data: ReturnType<typeof fields>): string | null {
  if (data.subscription_start && data.subscription_end && data.subscription_end < data.subscription_start) {
    return "Az előfizetés vége nem lehet korábbi, mint a kezdete.";
  }
  return null;
}

// The DB rejects "only one of the two set" with a check constraint, but that
// would surface as a generic "Nem sikerült elmenteni" — catching it here
// gives a specific, actionable message instead.
function hoursError(data: ReturnType<typeof fields>): string | null {
  if ((data.open_hour === null) !== (data.close_hour === null)) {
    return "A nyitás és zárás óráját együtt add meg, vagy hagyd mindkettőt üresen.";
  }
  return null;
}

// Audit finding #6: these three used to discard the Supabase result entirely,
// so an RLS rejection, a check-constraint violation or any other DB error was
// indistinguishable from success — the page simply revalidated and the change
// wasn't there, with nothing shown to the admin. They now report failures.
export type PartnerActionResult = { error: string | null };

export async function createPartner(adminSlug: string, formData: FormData): Promise<PartnerActionResult> {
  const data = fields(formData);
  if (!data.name) return { error: "Az egység neve kötelező." };

  const periodProblem = periodError(data);
  if (periodProblem) return { error: periodProblem };
  const hoursProblem = hoursError(data);
  if (hoursProblem) return { error: hoursProblem };

  const supabase = await createClient();
  const { error } = await supabase.from("partners").insert(data);
  if (error) return { error: "Nem sikerült létrehozni az egységet." };

  revalidatePath(`/${adminSlug}/partners`);
  return { error: null };
}

export async function updatePartner(
  adminSlug: string,
  partnerId: string,
  formData: FormData,
): Promise<PartnerActionResult> {
  const data = fields(formData);
  if (!data.name) return { error: "Az egység neve kötelező." };

  const periodProblem = periodError(data);
  if (periodProblem) return { error: periodProblem };
  const hoursProblem = hoursError(data);
  if (hoursProblem) return { error: hoursProblem };

  const supabase = await createClient();
  const { error } = await supabase.from("partners").update(data).eq("id", partnerId);
  if (error) return { error: "Nem sikerült elmenteni a módosításokat." };

  revalidatePath(`/${adminSlug}/partners`);
  return { error: null };
}

export async function deletePartner(adminSlug: string, partnerId: string): Promise<PartnerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("partners").delete().eq("id", partnerId);

  if (error) {
    // The likeliest cause is prize_draws.submission_id, which references
    // submissions with no ON DELETE action: deleting the partner cascades to
    // its submissions, and that cascade collides with any draw ever recorded
    // for this venue. Previously this failed in total silence — the admin
    // clicked "Törlés megerősítése" and simply nothing happened.
    return {
      error:
        "Nem sikerült törölni az egységet. Ha volt már nyereménysorsolás nála, a sorsolási előzmény blokkolja a törlést.",
    };
  }

  revalidatePath(`/${adminSlug}/partners`);
  return { error: null };
}
