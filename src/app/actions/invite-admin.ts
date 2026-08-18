"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteAdminResult =
  | { ok: true; alreadyExisted: boolean; tempPassword?: string; emailSkipped?: boolean }
  | { ok: false; error: string };

function generateTempPassword() {
  return crypto.randomUUID().slice(0, 8) + "-" + crypto.randomUUID().slice(0, 4);
}

// SECURITY: this is the most powerful action in the app — a successful call
// grants full access to every partner's guest emails and prize data, and lets
// the new account invite further admins the same way. createAdminClient()
// bypasses RLS entirely, so the is_admin() check below is the ONLY thing
// standing between a caller and unauthenticated admin account creation. Same
// pattern and same warning as inviteOwnerToPartner — a service-role key held
// server-side is not itself protection; whoever can invoke this action gets
// everything it does.
export async function inviteAdmin(
  adminSlug: string,
  emailRaw: string,
  skipEmail = false,
): Promise<InviteAdminResult> {
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

  const { data: invited, error: inviteError } = skipEmail
    ? { data: null, error: null }
    : await admin.auth.admin.inviteUserByEmail(email, {
        data: { role: "admin" },
        redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
      });

  let userId = invited?.user?.id;
  let alreadyExisted = false;
  let tempPassword: string | undefined;

  if (inviteError || !userId) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      // An existing OWNER account is a deliberate role change, not a side
      // effect of clicking "invite admin" — refuse rather than silently
      // upgrading someone's access. Promoting a partner to admin, if ever
      // needed, should be its own explicit action, not an accidental result
      // of a name/email typo here.
      if (existingProfile.role !== "admin") {
        return {
          ok: false,
          error: "Ez az e-mail cím már egy partneri (owner) fiókhoz tartozik — ezt a felületről nem alakíthatod admin fiókká.",
        };
      }
      userId = existingProfile.id;
      alreadyExisted = true;
    } else {
      // Same fallback as inviteOwnerToPartner: Supabase's default mailer caps
      // at a handful of auth emails per hour, so create the account directly
      // with a temporary password the caller can relay out of band.
      const password = generateTempPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });

      if (createError || !created.user) {
        return { ok: false, error: "Nem sikerült létrehozni a fiókot — próbáld újra." };
      }
      userId = created.user.id;
      tempPassword = password;
    }
  }

  revalidatePath(`/${adminSlug}/settings`);
  return { ok: true, alreadyExisted, tempPassword, emailSkipped: skipEmail };
}
