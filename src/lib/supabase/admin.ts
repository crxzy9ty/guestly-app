import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Uses the secret key — full admin/service-role access, bypasses RLS entirely.
// The `server-only` import above makes any accidental import from a Client
// Component fail the build instead of shipping this key to the browser.
// Use for supabase.auth.admin.* calls (inviteUserByEmail, createUser, …), and
// for the one context where RLS genuinely cannot apply: the cron route in
// src/app/api/cron/daily-draw/route.ts, which runs with no user session at all
// and so has no role for RLS to evaluate. That route authenticates the CALLER
// instead, via CRON_SECRET.
//
// Everything reached through a user request must still go through
// src/lib/supabase/server.ts so RLS applies. "There is no session" is the only
// acceptable reason to use this for data queries — not convenience, and not to
// work around a policy that is inconvenient.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
