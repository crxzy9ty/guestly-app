import { createClient } from "@/lib/supabase/server";
import { PartnerManager } from "./PartnerManager";

export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partners")
    .select("id, name, address, phone, email, contact_name, contact_phone, alert_threshold")
    .order("name");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Partnerek</h1>
      <PartnerManager adminSlug={adminSlug} partners={partners ?? []} siteUrl={siteUrl} />
    </div>
  );
}
