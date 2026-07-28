import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "./database.types";

// Next.js 16: cookies() is async-only. Call this fresh in every Server
// Component / Server Action / Route Handler that needs a Supabase client —
// never cache the returned client across requests.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component (not a Server Action/Route Handler) —
            // cookies() there is read-only. Safe to ignore as long as proxy.ts is
            // refreshing the session on every request (see src/proxy.ts).
          }
        },
      },
    },
  );
}

// Every protected layout AND the page it wraps each independently need the
// current user — that's two auth round trips per navigation by default.
// React's cache() dedupes calls with the same reference within a single
// request, so as long as every call site imports this instead of calling
// supabase.auth.getUser() directly, it only hits the network once per request.
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
