import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase invite / password-reset / magic-link emails.
//
// Two shapes reach here, and only one of them carries a `?code=`:
//   - Password reset is user-initiated from THIS app's own browser session
//     (resetPasswordForEmail, called via the SSR client), so Supabase issues
//     a PKCE `code` this route can exchange server-side.
//   - Admin/owner invites are generated on OUR server via the admin API
//     (generateLink/inviteUserByEmail) — no browser ever held a PKCE
//     code_verifier for them, so Supabase can only hand back the session as
//     a `#access_token=…` URL FRAGMENT, appended to `next` below. A server
//     route can never read a fragment (it never leaves the browser), so the
//     old code here guessed "no code = error" and sent invites to
//     /login?error=auth instead — where the fragment then sat unread, since
//     that page has no session-recovery logic.
// The fix isn't here: fragments survive an HTTP redirect onto a URL with no
// fragment of its own (RFC 7231 §7.1.2, followed by every major browser), so
// redirecting to `next` unconditionally is enough to deliver it intact to
// /set-password, which DOES know how to read it (see that page's own
// comment for the client-side half of this fix).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/set-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
