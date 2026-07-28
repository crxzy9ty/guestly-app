import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Called from src/proxy.ts on every request. Its only job is refreshing the
// auth token/cookies so Server Components always see a valid session — it is
// NOT an authorization check. Route protection lives in each protected
// segment's layout.tsx (see src/app/dashboard/layout.tsx and
// src/app/[adminSlug]/(protected)/layout.tsx), because middleware-only auth
// checks are bypassable by calling Server Actions/Route Handlers directly.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not remove: this call refreshes the session and must run on every request.
  await supabase.auth.getUser();

  return supabaseResponse;
}
