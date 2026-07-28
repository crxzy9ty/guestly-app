import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
