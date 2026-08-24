"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";

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

  // generateLink({ type: "invite" }) creates the account and hands back the
  // activation link WITHOUT emailing anyone — unlike inviteUserByEmail, which
  // always sends Supabase's own built-in mail: a shared sender with poor
  // spam reputation, and — since inviteAdmin generates the exact same kind
  // of link — indistinguishable from an admin invite. Sending it ourselves
  // via Resend, on our own verified domain, with copy that names the venue,
  // fixes both problems at once.
  const { data: generated, error: inviteError } = skipEmail
    ? { data: null, error: null }
    : await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { role: "owner" },
          redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
        },
      });

  let userId = generated?.user?.id;
  let alreadyExisted = false;
  let tempPassword: string | undefined;

  if (inviteError || !userId) {
    // Supabase refuses to generate an invite link for an email that already
    // has an account — that's expected for an owner who already manages
    // another venue. Look them up and just add the new partner link instead
    // of treating it as a failure.
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
      // Either the caller asked to skip email outright, or generateLink
      // failed — most likely Supabase's default mailer/rate limits, though
      // that no longer applies to the link itself now that we send it via
      // Resend; kept as a fallback for a genuine API error. Both want the
      // same outcome: create the account directly with a temporary password
      // the admin relays manually.
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
  } else if (generated?.properties.action_link) {
    const { data: partner } = await supabase.from("partners").select("name").eq("id", partnerId).maybeSingle();
    const partnerName = partner?.name ?? "a Fydback fiókodhoz";

    await sendEmail({
      to: email,
      subject: `Meghívó a Fydback fiókodhoz — ${partnerName}`,
      text: [
        `Meghívást kaptál, hogy hozzáférj a(z) ${partnerName} Fydback vendégelégedettség-adataihoz.`,
        "",
        `Fiók aktiválása és jelszó beállítása: ${generated.properties.action_link}`,
        "",
        "Ha nem számítottál erre a meghívóra, nyugodtan hagyd figyelmen kívül ezt az e-mailt.",
      ].join("\n"),
      html: `
        <h2 style="margin:0 0 16px;font-size:20px;color:#15131c;">Meghívást kaptál a Fydback fiókodhoz</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#15131c;">
          Hozzáférést kaptál a(z) <strong>${escapeHtml(partnerName)}</strong> vendégelégedettség-adataihoz.
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
          Ezt a levelet azért kaptad, mert valaki meghívott a Fydback rendszerébe.
        </p>
      `,
    });
  }

  const { error: linkError } = await supabase.from("partner_members").insert({ partner_id: partnerId, user_id: userId! });

  // 23505 = unique_violation — already linked to this exact partner, treat as success.
  if (linkError && linkError.code !== "23505") {
    return { ok: false, error: "A fiók elkészült, de a partnerhez rendelés nem sikerült." };
  }

  revalidatePath(`/${adminSlug}/partners`);
  return { ok: true, alreadyExisted, tempPassword, emailSkipped: skipEmail };
}
