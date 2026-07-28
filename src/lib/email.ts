import "server-only";
import { Resend } from "resend";

// EMAIL_FROM defaults to Resend's shared test sender, which works
// immediately with zero setup but only looks professional once a real
// domain is verified in the Resend dashboard and EMAIL_FROM is updated to
// match (e.g. "Guestly <hello@guestly.hu>").
const FROM = process.env.EMAIL_FROM ?? "Guestly <onboarding@resend.dev>";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Never throws — email delivery is a best-effort side effect, not something
// that should fail the winner draw or the demo-request submission it's
// attached to. Returns whether it actually attempted a send (false when
// RESEND_API_KEY isn't configured yet, e.g. in local dev before setup).
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not set — skipped sending "${input.subject}" to ${input.to}`);
    return false;
  }

  const { error } = await client.emails.send({ from: FROM, to: input.to, subject: input.subject, html: input.html });
  if (error) {
    console.error("[email] send failed:", error);
    return false;
  }
  return true;
}
