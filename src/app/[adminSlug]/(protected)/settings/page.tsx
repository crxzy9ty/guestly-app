import { redirect } from "next/navigation";
import { createClient, getCachedUser } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/content";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { SettingsView } from "./SettingsView";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const supabase = await createClient();
  const user = await getCachedUser();

  // The (protected)/layout.tsx guard runs CONCURRENTLY with this page, not
  // before it — its redirect() does not stop this body from executing on a
  // session that expires mid-navigation. Repeating the check here (rather
  // than asserting user is non-null) is what audit finding #1 fixed
  // elsewhere; skipping it here would reopen the same crash.
  if (!user) {
    redirect(`/${adminSlug}/login`);
  }

  const [{ data: contentRow }, { data: demoRequests }, { data: questionSets }, { data: aspects }, { data: partners }, { data: admins }, { data: partnerMessages }] =
    await Promise.all([
      supabase.from("content_settings").select("content").eq("id", 1).maybeSingle(),
      supabase
        .from("demo_requests")
        .select("id, name, email, business, message, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("question_sets").select("id, name").order("name"),
      supabase.from("question_aspects").select("id, question_set_id, key, label, icon").order("sort_order").order("id"),
      supabase.from("partners").select("id, name, question_set_id").order("name"),
      // profiles_select_self_or_admin already lets an admin see every row, so
      // this is a plain filtered select — no new RLS or view needed.
      supabase.from("profiles").select("id, email, last_seen_at").eq("role", "admin").order("email"),
      supabase
        .from("partner_messages")
        .select("id, message, is_read, created_at, partners(name)")
        .order("created_at", { ascending: false }),
    ]);

  const content = resolveContent(contentRow?.content);
  const messages = (partnerMessages ?? []).map((m) => ({
    id: m.id,
    message: m.message,
    is_read: m.is_read,
    created_at: m.created_at,
    partnerName: (m.partners as unknown as { name: string } | null)?.name ?? "Ismeretlen egység",
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Beállítások</h1>
      <SettingsView
        adminSlug={adminSlug}
        content={content}
        demoRequests={demoRequests ?? []}
        questionSets={questionSets ?? []}
        aspects={aspects ?? []}
        partners={partners ?? []}
        admins={admins ?? []}
        partnerMessages={messages}
        currentUserId={user.id}
        // Only the boolean crosses the server/client boundary, never the
        // configured address itself — the client bundle has no way to learn
        // what SUPER_ADMIN_EMAIL is set to.
        canDeleteAdmins={isSuperAdminEmail(user.email)}
      />
    </div>
  );
}
