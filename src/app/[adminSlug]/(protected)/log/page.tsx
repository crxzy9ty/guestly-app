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

  let query = supabase
    .from("submissions")
    .select("id, partner_id, created_at, email, prize_id, winner_id")
    .order("created_at", { ascending: false })
    .limit(300);
  if (selectedPartner) query = query.eq("partner_id", selectedPartner.id);
  const { data: submissions } = await query;
  const safeSubmissions = submissions ?? [];

  const submissionIds = safeSubmissions.map((s) => s.id);
  const { data: scores } =
    submissionIds.length > 0
      ? await supabase
          .from("submission_scores")
          .select("submission_id, aspect_key, score, reason")
          .in("submission_id", submissionIds)
      : { data: [] as { submission_id: string; aspect_key: string; score: number; reason: string | null }[] };

  // Simplification: the combined ("all venues") log shows the DEFAULT question
  // set's columns, since most partners share it today. Once question-set
  // management differs meaningfully per partner, filtering to one venue shows
  // that venue's real columns correctly either way.
  const questionSetId = selectedPartner?.question_set_id ?? DEFAULT_QUESTION_SET_ID;
  const { data: aspects } = await supabase
    .from("question_aspects")
    .select("key, label")
    .eq("question_set_id", questionSetId)
    .order("sort_order");

  const rowsMap = new Map<string, AdminLogRow>();
  for (const s of safeSubmissions) {
    rowsMap.set(s.id, {
      id: s.id,
      createdAt: s.created_at,
      venue: partnerNameById.get(s.partner_id) ?? "—",
      email: s.email,
      prizeId: s.prize_id,
      winnerId: s.winner_id,
      scores: {},
      reasons: {},
    });
  }
  for (const s of scores ?? []) {
    const row = rowsMap.get(s.submission_id);
    if (!row) continue;
    row.scores[s.aspect_key] = s.score;
    if (s.reason) row.reasons[s.aspect_key] = s.reason;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Napló</h1>
      <AdminLogClient
        adminSlug={adminSlug}
        partners={safePartners.map((p) => ({ id: p.id, name: p.name }))}
        selectedPartnerId={selectedPartner?.id ?? null}
        aspects={aspects ?? []}
        rows={Array.from(rowsMap.values())}
      />
    </div>
  );
}
