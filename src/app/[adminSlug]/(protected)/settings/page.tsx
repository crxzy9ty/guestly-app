import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTENT, type MarketingContent } from "@/lib/content";
import { SettingsView } from "./SettingsView";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const supabase = await createClient();

  const [{ data: contentRow }, { data: demoRequests }, { data: questionSets }, { data: aspects }, { data: partners }] =
    await Promise.all([
      supabase.from("content_settings").select("content").eq("id", 1).maybeSingle(),
      supabase
        .from("demo_requests")
        .select("id, name, email, business, message, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("question_sets").select("id, name").order("name"),
      supabase.from("question_aspects").select("id, question_set_id, key, label, icon").order("sort_order").order("id"),
      supabase.from("partners").select("id, name, question_set_id").order("name"),
    ]);

  const content = (contentRow?.content as MarketingContent | undefined) ?? DEFAULT_CONTENT;

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
      />
    </div>
  );
}
