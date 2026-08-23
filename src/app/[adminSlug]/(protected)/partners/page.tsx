import { createClient } from "@/lib/supabase/server";
import { PartnerManager } from "./PartnerManager";

export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const supabase = await createClient();

  const [{ data: partners }, { data: activity }] = await Promise.all([
    supabase
      .from("partners")
      .select(
        "id, name, address, phone, email, contact_name, contact_phone, alert_threshold, subscription_start, subscription_end, open_hour, close_hour, prize_frequency, prize_description",
      )
      .order("name"),
    supabase
      .from("partner_activity")
      .select("partner_id, last_owner_seen_at, last_review_at, owner_count"),
  ]);

  const activityByPartner = new Map((activity ?? []).map((a) => [a.partner_id, a]));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Partnerek</h1>
      <PartnerManager
        adminSlug={adminSlug}
        partners={(partners ?? []).map((p) => ({
          ...p,
          lastOwnerSeenAt: activityByPartner.get(p.id)?.last_owner_seen_at ?? null,
          lastReviewAt: activityByPartner.get(p.id)?.last_review_at ?? null,
          ownerCount: activityByPartner.get(p.id)?.owner_count ?? 0,
        }))}
        siteUrl={siteUrl}
      />
    </div>
  );
}
