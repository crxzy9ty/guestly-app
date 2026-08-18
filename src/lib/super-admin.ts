import "server-only";

// Deliberately gated on ONE specific, explicitly designated account rather
// than "any admin" — deleting an admin is powerful enough to remove every
// other admin that it shouldn't be something a newly-invited admin can do on
// day one, or something a compromised admin account could use to purge the
// others. A DB role/flag wouldn't give that guarantee: any admin already has
// UPDATE on profiles (see ..._rls_policies_and_grants.sql), so a boolean
// column here could be granted to itself by whoever holds any admin session.
// An env var can only be changed by whoever controls the Vercel project
// settings — outside the app's own reach entirely.
//
// Plain (non-"use server") module: a "use server" file may only export async
// functions, and this needs to be called synchronously from a Server
// Component (settings/page.tsx) as well as from the delete-admin action.
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return Boolean(SUPER_ADMIN_EMAIL) && email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}
