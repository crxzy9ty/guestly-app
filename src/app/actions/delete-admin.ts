"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminEmail } from "@/lib/super-admin";

export type DeleteAdminResult = { ok: true } | { ok: false; error: string };

// deleteUser() removes the auth.users row outright, which cascades to
// profiles and from there to partner_members (both `on delete cascade`) —
// a full, clean removal rather than a role flip that would leave a stray
// account behind.
export async function deleteAdmin(adminSlug: string, targetUserId: string): Promise<DeleteAdminResult> {
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  // auth.getUser()'s email comes from the verified JWT, not the denormalized
  // profiles.email column — nothing reachable through the app can tamper
  // with what this check compares against.
  if (!caller || !isSuperAdminEmail(caller.email)) {
    return { ok: false, error: "Ehhez nincs jogosultságod." };
  }

  // Blocks the one path that could zero out admin access entirely: since
  // only this one account can call this action at all, refusing self-deletion
  // guarantees at least one admin (this one) always survives it.
  if (targetUserId === caller.id) {
    return { ok: false, error: "A saját fiókodat nem törölheted." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) {
    return { ok: false, error: "Nem sikerült törölni a fiókot." };
  }

  revalidatePath(`/${adminSlug}/settings`);
  return { ok: true };
}
