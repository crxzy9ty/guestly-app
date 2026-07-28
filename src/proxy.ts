import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (exported
// function renamed `middleware` -> `proxy`). This only refreshes the Supabase
// session cookie on every request; it is NOT an authorization gate. See
// src/lib/supabase/middleware.ts for why, and src/app/dashboard/layout.tsx /
// src/app/[adminSlug]/(protected)/layout.tsx for where the real role checks live.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
