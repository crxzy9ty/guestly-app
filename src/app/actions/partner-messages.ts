"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCachedUser } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";

export type SendPartnerMessageState = { ok: boolean; error: string | null };

const MAX_MESSAGE_LENGTH = 2000;

// The only way a partner owner reaches this table — RLS also enforces
// is_partner_member(partner_id) and sender_user_id = auth.uid(), this is
// just the friendly, specific error before that generic DB rejection.
export async function sendPartnerMessage(
  partnerId: string,
  _prevState: SendPartnerMessageState,
  formData: FormData,
): Promise<SendPartnerMessageState> {
  const user = await getCachedUser();
  if (!user) return { ok: false, error: "Nincs bejelentkezve." };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { ok: false, error: "Írj be egy üzenetet." };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Az üzenet legfeljebb ${MAX_MESSAGE_LENGTH} karakter lehet.` };
  }

  const supabase = await createClient();
  const { data: partner } = await supabase.from("partners").select("name").eq("id", partnerId).maybeSingle();

  const { error } = await supabase
    .from("partner_messages")
    .insert({ partner_id: partnerId, sender_user_id: user.id, message });

  if (error) {
    return { ok: false, error: "Nem sikerült elküldeni az üzenetet." };
  }

  // Best-effort, non-blocking — the message is already saved even if this
  // fails or ADMIN_NOTIFICATION_EMAIL isn't configured (same pattern as the
  // demo-request notification in actions/demo-requests.ts).
  const notifyAddress = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (notifyAddress) {
    await sendEmail({
      to: notifyAddress,
      subject: `Új üzenet — ${partner?.name ?? "ismeretlen egység"}`,
      html: `
        <p><strong>${escapeHtml(partner?.name ?? "Ismeretlen egység")}</strong> (${escapeHtml(user.email ?? "")}) üzenetet küldött:</p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    });
  }

  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

// Admin-only per RLS (partner_messages_update_admin) — a non-admin session's
// call simply fails the update and this reports the generic failure.
export async function markPartnerMessageRead(
  adminSlug: string,
  messageId: string,
  isRead: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("partner_messages").update({ is_read: isRead }).eq("id", messageId);
  if (error) return { error: "Nem sikerült frissíteni az üzenetet." };

  revalidatePath(`/${adminSlug}/settings`);
  return { error: null };
}
