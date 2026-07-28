import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Uses the secret key — full admin/service-role access, bypasses RLS entirely.
// The `server-only` import above makes any accidental import from a Client
// Component fail the build instead of shipping this key to the browser.
// Use ONLY for supabase.auth.admin.* calls (inviteUserByEmail, createUser, …),
// never for regular data queries — those should go through
// src/lib/supabase/server.ts so RLS still applies.
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
