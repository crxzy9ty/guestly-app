"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteOwnerResult =
  | { ok: true; alreadyExisted: boolean; tempPassword?: string; emailSkipped?: boolean }
  | { ok: false; error: string };

function generateTempPassword() {
  return crypto.randomUUID().slice(0, 8) + "-" + crypto.randomUUID().slice(0, 4);
}

// SECURITY: this action is the one place in the app where RLS is NOT the
// enforcement layer — createAdminClient() holds the service-role key and
// bypasses RLS entirely, so the check below is the only thing standing
// between an arbitrary caller and unauthenticated account creation. (An
// earlier version of this comment claimed holding the service-role key
// server-side was sufficient protection — it wasn't: whoever can invoke this
// Server Action gets everything it does, key included. Explicit is_admin()
// check required.)
// `skipEmail` creates the account directly with a generated password and sends
// nothing, for onboarding a partner who is sitting in front of you (or when
// the mail path is known to be rate-limited). The same createUser() fallback
// already existed, but only reachable by the invite email FAILING — which made
// the deliberate case impossible to ask for.
export async function inviteOwnerToPartner(
  adminSlug: string,
  partnerId: string,
  emailRaw: string,
  skipEmail = false,
): Promise<InviteOwnerResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Érvénytelen e-mail cím." };
  }

  const supabase = await createClient();

  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) {
    return { ok: false, error: "Nincs bejelentkezve." };
  }
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", caller.id).single();
  if (callerProfile?.role !== "admin") {
    return { ok: false, error: "Ehhez admin jogosultság szükséges." };
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // When skipping email, don't call inviteUserByEmail at all — calling it and
  // ignoring the result would still send the message. Falling through with a
  // null userId reuses the existing "already has an account?" / createUser
  // branch below, so both paths stay one code path.
  const { data: invited, error: inviteError } = skipEmail
    ? { data: null, error: null }
    : await admin.auth.admin.inviteUserByEmail(email, {
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
      // Either the caller asked to skip email outright, or the invite failed —
      // most likely because the invite EMAIL couldn't be sent (Supabase's
      // default mailer allows only ~2 auth emails/hour, easy to hit, and it
      // will keep happening for real customers until a verified sending domain
      // is configured). Both want the same outcome: create the account
      // directly with a temporary password the admin relays manually.
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
  return { ok: true, alreadyExisted, tempPassword, emailSkipped: skipEmail };
}
