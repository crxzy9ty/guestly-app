import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VenueRankingTable, type VenueStat } from "./VenueRankingTable";

type Partner = { id: string; name: string; question_set_id: string | null; alert_threshold: number };
type Aspect = { key: string; label: string; question_set_id: string };

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const supabase = await createClient();

  // This page used to select EVERY submissions and submission_scores row with
  // no limit and no ORDER BY, then average them here. PostgREST caps responses
  // at max_rows = 1000 without reporting it (supabase/config.toml), so at ~5
  // scores per review that made every number on this page wrong — silently,
  // and from a non-deterministic subset — from roughly 200 total reviews on.
  // The aggregation now happens in SQL and returns one row per partner (plus
  // one per partner/aspect pair), which cannot outgrow that ceiling.
  const [{ data: partners }, { data: summaries }, { data: aspectStats }, { data: aspects }] = await Promise.all([
    supabase.from("partners").select("id, name, question_set_id, alert_threshold").order("name"),
    supabase
      .from("partner_summary_stats")
      .select("partner_id, review_count, prize_count, reviews_24h, reviews_7d, avg_score"),
    supabase.from("partner_aspect_stats").select("partner_id, aspect_key, avg_score, score_count"),
    supabase.from("question_aspects").select("key, label, question_set_id"),
  ]);

  const safePartners = (partners ?? []) as Partner[];
  const safeSummaries = summaries ?? [];
  const safeAspectStats = aspectStats ?? [];
  const safeAspects = (aspects ?? []) as Aspect[];

  if (safePartners.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-6 text-center text-sm text-slate">
        Még nincs felvett partner — kezdd a Partnerek fülön egy új egység hozzáadásával.
      </div>
    );
  }

  // The 24h/7d windows are evaluated per partner inside partner_summary_stats
  // (against the database clock, so they no longer depend on how far the
  // serverless region's time has drifted); the totals are just their sums.
  const summaryByPartner = new Map(safeSummaries.map((s) => [s.partner_id, s]));
  const sum = (pick: (s: (typeof safeSummaries)[number]) => number) =>
    safeSummaries.reduce((acc, s) => acc + Number(pick(s) ?? 0), 0);

  const totalReviews = sum((s) => s.review_count);
  const last24h = sum((s) => s.reviews_24h);
  const last7d = sum((s) => s.reviews_7d);
  const totalPrizeEntries = sum((s) => s.prize_count);
  const responseRate = totalReviews ? Math.round((totalPrizeEntries / totalReviews) * 100) : 0;

  const venueStats = safePartners
    .map((partner) => {
      const summary = summaryByPartner.get(partner.id);
      const partnerAspects = safeAspects.filter((a) => a.question_set_id === partner.question_set_id);
      const statsByKey = new Map(
        safeAspectStats.filter((s) => s.partner_id === partner.id).map((s) => [s.aspect_key, s]),
      );
      // Only aspects belonging to this partner's own question set are eligible,
      // so a venue that was moved between question sets isn't judged on a
      // retired aspect it no longer asks about.
      const worstAspect = partnerAspects
        .map((a) => {
          const stat = statsByKey.get(a.key);
          return stat ? { ...a, avg: stat.avg_score } : null;
        })
        .filter((a): a is Aspect & { avg: number } => a !== null)
        .sort((a, b) => a.avg - b.avg)[0];
      return {
        partner,
        reviewCount: Number(summary?.review_count ?? 0),
        avgScore: summary?.avg_score ?? null,
        prizeCount: Number(summary?.prize_count ?? 0),
        worstAspect,
      };
    })
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));

  const alerts = venueStats
    .filter((v) => v.worstAspect && v.worstAspect.avg < v.partner.alert_threshold)
    .sort((a, b) => a.worstAspect!.avg - b.worstAspect!.avg);

  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-violet">
        Admin nézet · összes egység
      </div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Guestly — minden partner</h1>

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          ["Aktív partnerek", safePartners.length],
          ["Értékelés (24 óra)", last24h],
          ["Értékelés (7 nap)", last7d],
          ["Sorsolásra jelentkezett", `${totalPrizeEntries} (${responseRate}%)`],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl border border-line bg-paper p-3.5">
            <div className="mb-1 text-[11.5px] text-slate">{label}</div>
            <div className="text-xl font-bold tracking-tight text-ink">{val}</div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="mb-2.5 text-sm font-bold text-ink">Figyelendő egységek</div>
          <div className="grid gap-2">
            {/* An alert is the most likely reason to want the venue's detail
                view, so the card itself is the link — otherwise you read the
                warning here and then hunt for the same row in the table. */}
            {alerts.map((a) => (
              <Link
                key={a.partner.id}
                href={`/${adminSlug}/venue/${a.partner.id}`}
                className="block rounded-lg bg-ink p-3.5 text-white"
              >
                <span className="font-bold text-cyan">{a.partner.name}</span> — {a.worstAspect!.label} átlaga{" "}
                {a.worstAspect!.avg.toFixed(1)} (küszöb: {a.partner.alert_threshold})
                <span className="ml-1.5 text-white/60">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <VenueRankingTable
        adminSlug={adminSlug}
        stats={venueStats.map(
          (v): VenueStat => ({
            id: v.partner.id,
            name: v.partner.name,
            avgScore: v.avgScore,
            reviewCount: v.reviewCount,
            prizeCount: v.prizeCount,
            worstAspectLabel: v.worstAspect?.label ?? null,
            worstAspectAvg: v.worstAspect?.avg ?? null,
          }),
        )}
      />
    </div>
  );
}
