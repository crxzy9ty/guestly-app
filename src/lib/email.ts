import "server-only";
import { Resend } from "resend";

// EMAIL_FROM defaults to Resend's shared test sender, which works
// immediately with zero setup but only looks professional once a real
// domain is verified in the Resend dashboard and EMAIL_FROM is updated to
// match (e.g. "Guestly <hello@guestly.hu>").
const FROM = process.env.EMAIL_FROM ?? "Guestly <onboarding@resend.dev>";

// Any string interpolated into an email HTML body must go through this if it
// originates from user input (guest-typed review reasons, demo-request
// name/business/message, …) — otherwise a guest can inject markup/links into
// mail sent from your verified domain.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Distinguishes the two ways a send can not happen, because they need
// different responses: "not-configured" is a deployment the operator has to
// fix, while "failed" is usually the recipient or the sending domain. Callers
// that record the outcome (the prize draw) can then say which it was.
//
// A common cause of "failed" worth knowing about: while EMAIL_FROM is still
// Resend's shared onboarding@resend.dev sender, Resend only delivers to the
// account owner's own address. Every other recipient is rejected — silently,
// from the guest's point of view — until a real domain is verified.
export type EmailOutcome = "sent" | "failed" | "not-configured";

// Never throws: delivery is a best-effort side effect and must not undo the
// draw or the demo request it is attached to.
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. Its absence is itself a spam signal — legitimate
   *  senders produce multipart mail, bulk senders often don't. */
  text?: string;
}): Promise<EmailOutcome> {
  const client = getClient();
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not set — skipped sending "${input.subject}" to ${input.to}`);
    return "not-configured";
  }

  const { error } = await client.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (error) {
    console.error(`[email] send failed (from=${FROM}, to=${input.to}):`, error);
    return "failed";
  }
  return "sent";
}
