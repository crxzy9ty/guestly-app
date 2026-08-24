"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";

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

  // generateLink({ type: "invite" }) creates the account and hands back the
  // activation link WITHOUT emailing anyone — unlike inviteUserByEmail, which
  // always sends Supabase's own built-in mail (a shared sender with poor
  // spam reputation, and — since it also generates invites for
  // inviteOwnerToPartner — the exact same generic email an owner gets, with
  // no way to tell them apart). Sending it ourselves via Resend, on our own
  // verified domain, with copy specific to "this is an admin account", fixes
  // both problems at once.
  const { data: generated, error: inviteError } = skipEmail
    ? { data: null, error: null }
    : await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { role: "admin" },
          redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
        },
      });

  let userId = generated?.user?.id;
  let alreadyExisted = false;
  let tempPassword: string | undefined;

  if (inviteError || !userId) {
    // Supabase refuses to generate an invite link for an email that already
    // has an account — that's expected for an admin who's been invited
    // before. Look them up and treat it as success (no new email needed).
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
      // Same fallback as inviteOwnerToPartner: skipEmail, or a genuine
      // generateLink failure — create the account directly with a temporary
      // password the caller can relay out of band.
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
  } else if (generated?.properties.action_link) {
    await sendEmail({
      to: email,
      subject: "Meghívó a Fydback admin felületére",
      text: [
        "Meghívást kaptál a Fydback admin felületére.",
        "",
        `Fiók aktiválása és jelszó beállítása: ${generated.properties.action_link}`,
        "",
        "Ha nem számítottál erre a meghívóra, nyugodtan hagyd figyelmen kívül ezt az e-mailt.",
      ].join("\n"),
      html: `
        <h2 style="margin:0 0 16px;font-size:20px;color:#15131c;">Meghívást kaptál a Fydback admin felületére</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#15131c;">
          Kattints az alábbi gombra a fiókod aktiválásához és a jelszavad beállításához:
        </p>
        <p style="margin:0 0 24px;">
          <a href="${escapeHtml(generated.properties.action_link)}" style="display:inline-block;background:#15131c;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
            Fiók aktiválása
          </a>
        </p>
        <p style="margin:0;font-size:13px;color:#6b6878;">
          Ha nem számítottál erre a meghívóra, nyugodtan hagyd figyelmen kívül ezt az e-mailt.
        </p>
        <hr style="border:none;border-top:1px solid #e6e4ee;margin:24px 0">
        <p style="font-size:12px;color:#6b6880;margin:0;">
          Ezt a levelet azért kaptad, mert valaki meghívott a Fydback admin felületére.
        </p>
      `,
    });
  }

  revalidatePath(`/${adminSlug}/settings`);
  return { ok: true, alreadyExisted, tempPassword, emailSkipped: skipEmail };
}
