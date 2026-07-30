import { createClient } from "@/lib/supabase/server";
import { AdminLogClient, type AdminLogRow } from "./AdminLogClient";
import { DEFAULT_QUESTION_SET_ID } from "@/lib/constants";

export default async function AdminLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ adminSlug: string }>;
  searchParams: Promise<{ partner?: string }>;
}) {
  const { adminSlug } = await params;
  const { partner: partnerParam } = await searchParams;
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partners")
    .select("id, name, question_set_id")
    .order("name");

  const safePartners = partners ?? [];
  const selectedPartner = safePartners.find((p) => p.id === partnerParam) ?? null;
  const partnerNameById = new Map(safePartners.map((p) => [p.id, p.name]));

  // submission_log_view returns one row per submission with its scores/reasons
  // already folded in, replacing the previous two-step fetch that passed up to
  // 300 uuids back through `.in("submission_id", ids)` — a query string that
  // grew past what a URL can carry, and a second response that max_rows could
  // silently truncate. See supabase/migrations/..._aggregate_stats_views.sql.
  let query = supabase
    .from("submission_log_view")
    .select("id, partner_id, created_at, email, prize_id, winner_id, scores, reasons")
    .order("created_at", { ascending: false })
    .limit(300);
  if (selectedPartner) query = query.eq("partner_id", selectedPartner.id);

  // Simplification: the combined ("all venues") log shows the DEFAULT question
  // set's columns, since most partners share it today. Once question-set
  // management differs meaningfully per partner, filtering to one venue shows
  // that venue's real columns correctly either way.
  const questionSetId = selectedPartner?.question_set_id ?? DEFAULT_QUESTION_SET_ID;

  // Both only depend on `partners` (already resolved above), not on each
  // other — fetched in parallel to save a round trip.
  const [{ data: submissions }, { data: aspects }] = await Promise.all([
    query,
    supabase.from("question_aspects").select("key, label").eq("question_set_id", questionSetId).order("sort_order"),
  ]);
  const rows: AdminLogRow[] = (submissions ?? []).map((s) => ({
    id: s.id,
    createdAt: s.created_at,
    venue: partnerNameById.get(s.partner_id) ?? "—",
    email: s.email,
    prizeId: s.prize_id,
    winnerId: s.winner_id,
    scores: s.scores ?? {},
    reasons: s.reasons ?? {},
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Napló</h1>
      <AdminLogClient
        adminSlug={adminSlug}
        partners={safePartners.map((p) => ({ id: p.id, name: p.name }))}
        selectedPartnerId={selectedPartner?.id ?? null}
        aspects={aspects ?? []}
        rows={rows}
      />
    </div>
  );
}
