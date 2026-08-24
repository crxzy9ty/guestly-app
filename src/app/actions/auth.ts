"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  success?: boolean;
};

// The base URL password-reset links point at. Read from configuration ONLY —
// never from the request.
//
// This used to prefer the `Origin` header, which the client fully controls: a
// crafted request with `Origin: https://attacker.example` would have produced a
// reset link pointing there, handing the recovery token to whoever sent it, for
// any address they cared to name. Supabase's own redirect allow-list is a
// second line of defence, but it is configured elsewhere and easy to widen by
// accident, so this must not depend on it.
function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Owner login (email + password). The /dashboard layout independently verifies
// profiles.role === 'owner', and RLS independently restricts what an owner can
// reach, so neither depends on the role check here.
//
// The role IS checked here anyway, purely for the error message: an admin
// signing in on this form used to authenticate successfully, get redirected to
// /dashboard, be bounced straight back by that layout's role gate, and land on
// this page again with no explanation — indistinguishable from a wrong
// password, with correct credentials.
export async function signInOwner(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Hibás e-mail cím vagy jelszó." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "admin") {
    // Deliberately vague about WHERE the admin area is — this form is public,
    // and the admin route's only obscurity is that its URL isn't published.
    await supabase.auth.signOut();
    return { error: "Ez egy admin fiók — az admin felület saját bejelentkezési címen érhető el." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Admin login: same credentials check, but ALSO rejects non-admin accounts
// here (defense in depth — the [adminSlug]/(protected) layout enforces this
// independently regardless of what this action does).
export async function signInAdmin(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const adminSlug = String(formData.get("adminSlug") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Hibás e-mail cím vagy jelszó." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Ehhez a fiókhoz nincs admin jogosultság." };
  }

  revalidatePath("/", "layout");
  redirect(`/${adminSlug}`);
}

export async function signOutOwner() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signOutAdmin(adminSlug: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(`/${adminSlug}/login`);
}

// Sends a password reset / invite-acceptance email. Used both for "forgot
// password" and as the mechanism an invited owner/admin uses to set their
// first password (Supabase's invite email links to the same code-exchange
// flow at /auth/callback).
export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Add meg az e-mail címed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/set-password`,
  });

  if (error) {
    return { error: "Hiba történt, próbáld újra." };
  }

  return { error: null, success: true };
}

// Sets a new password for the currently-authenticated user (reached via the
// /auth/callback code-exchange redirect after clicking an invite/reset link).
export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "A jelszónak legalább 8 karakter hosszúnak kell lennie." };
  }
  if (password !== confirmPassword) {
    return { error: "A két jelszó nem egyezik." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Was previously swallowed entirely — every failure reported the same
    // generic "request a new link" regardless of cause, indistinguishable
    // from the log's point of view whether the session never existed, had
    // expired, or Supabase's own password policy rejected the value.
    console.error(`[updatePassword] failed (code=${error.code ?? "?"}):`, error.message);
    if (error.code === "weak_password") {
      return { error: "Ez a jelszó nem elég erős. Próbálj egy hosszabbat, számmal és nagybetűvel." };
    }
    return { error: "Nem sikerült frissíteni a jelszót. Kérj egy új linket." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // updateUser() above succeeding implies a session, but a token that expires
  // in between still returns null here — and a non-null assertion would turn
  // that into an unhandled TypeError instead of a recoverable error message.
  if (!user) {
    return { error: "A munkamenet lejárt. Kérj egy új linket." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  revalidatePath("/", "layout");
  redirect(profile?.role === "admin" ? `/${process.env.ADMIN_ROUTE_SECRET}` : "/dashboard");
}
