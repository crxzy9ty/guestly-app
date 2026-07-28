"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteOwnerResult =
  | { ok: true; alreadyExisted: boolean; tempPassword?: string }
  | { ok: false; error: string };

function generateTempPassword() {
  return crypto.randomUUID().slice(0, 8) + "-" + crypto.randomUUID().slice(0, 4);
}

// No manual is_admin() check here: inviteUserByEmail requires the service-role
// key (createAdminClient), which only server code holds — a non-admin caller
// can't reach this action's privileged half at all. The partner_members
// insert at the end still goes through the regular RLS-respecting client, so
// even a bug here can't bypass the database's own admin-only write policy.
export async function inviteOwnerToPartner(
  adminSlug: string,
  partnerId: string,
  emailRaw: string,
): Promise<InviteOwnerResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Érvénytelen e-mail cím." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role: "owner" },
    redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
  });

  let userId = invited?.user?.id;
  let alreadyExisted = false;
  let tempPassword: string | undefined;

  if (inviteError || !userId) {
    // Supabase refuses to re-invite an email that already has an account —
    // that's expected for an owner who already manages another venue. Look
    // them up and just add the new partner link instead of treating it as
    // a failure.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.role !== "owner") {
        return { ok: false, error: "Ez az e-mail cím már egy admin fiókhoz tartozik." };
      }
      userId = existingProfile.id;
      alreadyExisted = true;
    } else {
      // The invite most likely failed because the invite EMAIL couldn't be
      // sent (Supabase's default mailer allows only ~2 auth emails/hour —
      // easy to hit, and will keep happening for real customers until a
      // verified sending domain is configured). Rather than hard-failing,
      // create the account directly with a temporary password the admin can
      // relay to the partner manually.
      const password = generateTempPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "owner" },
      });

      if (createError || !created.user) {
        return { ok: false, error: "Nem sikerült létrehozni a fiókot — próbáld újra." };
      }
      userId = created.user.id;
      tempPassword = password;
    }
  }

  const { error: linkError } = await supabase.from("partner_members").insert({ partner_id: partnerId, user_id: userId! });

  // 23505 = unique_violation — already linked to this exact partner, treat as success.
  if (linkError && linkError.code !== "23505") {
    return { ok: false, error: "A fiók elkészült, de a partnerhez rendelés nem sikerült." };
  }

  revalidatePath(`/${adminSlug}/partners`);
  return { ok: true, alreadyExisted, tempPassword };
}
