"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export type DemoRequestState = { ok: boolean; error: string | null };

// RLS grants INSERT on demo_requests to anon + authenticated with a
// no-restriction check(true) — see supabase/migrations/..._rls_policies_and_grants.sql.
export async function submitDemoRequest(
  _prevState: DemoRequestState,
  formData: FormData,
): Promise<DemoRequestState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const business = String(formData.get("business") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!name || !email || !business) {
    return { ok: false, error: "Kérjük, töltsd ki a kötelező mezőket." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("demo_requests").insert({ name, email, business, message });

  if (error) {
    return { ok: false, error: "Hiba történt, kérjük próbáld újra." };
  }

  // Best-effort, non-blocking: the request is already saved even if either
  // email fails to send (e.g. RESEND_API_KEY not configured yet).
  await sendEmail({
    to: email,
    subject: "Megkaptuk a demó-kérésed — Guestly",
    html: `
      <p>Szia ${name.split(" ")[0]}!</p>
      <p>Köszönjük a jelentkezést a(z) <strong>${business}</strong> nevében — hamarosan felvesszük veled a kapcsolatot,
      hogy egyeztessünk egy 15 perces bemutatót.</p>
    `,
  });

  const notifyAddress = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (notifyAddress) {
    await sendEmail({
      to: notifyAddress,
      subject: `Új demó-kérés: ${business}`,
      html: `
        <p><strong>${name}</strong> (${email}) demót kért a(z) <strong>${business}</strong> nevében.</p>
        ${message ? `<p>Üzenet: ${message}</p>` : ""}
      `,
    });
  }

  return { ok: true, error: null };
}
