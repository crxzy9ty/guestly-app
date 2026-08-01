import { redirect } from "next/navigation";
import { createClient, getCachedUser } from "@/lib/supabase/server";
import { signOutOwner } from "@/app/actions/auth";
import { VenueSwitcher } from "./VenueSwitcher";
import { OwnerDashboardClient } from "./OwnerDashboardClient";
import type { LogRow } from "./LogTable";
import { gridsByAspect, joinAspectAverages, weakestBucket, type HeatmapBucketRow } from "@/lib/dashboard/heatmap";
import { parsePeriod, periodDays } from "@/lib/dashboard/period";

// How many recent submissions the Napló shows. Bounded on purpose: this is the
// one query here that returns row-level data rather than aggregates, and
// PostgREST silently truncates at max_rows = 1000 (supabase/config.toml).
const LOG_ROW_LIMIT = 300;

type PartnerRow = { id: string; name: string; question_set_id: string | null; alert_threshold: number };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string; period?: string }>;
}) {
  const { partner: partnerParam, period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const sinceDays = periodDays(period);
  const supabase = await createClient();
  const user = await getCachedUser();

  // layout.tsx runs the same check, but Next.js renders layouts and pages
  // CONCURRENTLY — its redirect() does not prevent this page's body from
  // executing. A session that expires mid-navigation therefore reached
  // `user!.id` here and crashed the route in production (TypeError: Cannot
  // read properties of null). The guard has to be repeated, not asserted away.
  if (!user) {
    redirect("/login");
  }

  // Records that this partner looked at their dashboard, for the admin
  // Partners tab. Self-throttling in SQL (a no-op within 15 minutes), so
  // refreshing doesn't cost a write.
  //
  // Awaited rather than fired and forgotten: an un-awaited promise can be cut
  // off when the serverless response is sent, which would drop the write
  // sometimes and make "last seen" quietly unreliable. Run alongside the
  // membership query so it costs no extra latency.
  const [{ data: memberships }] = await Promise.all([
    supabase
      .from("partner_members")
      .select("partners(id, name, question_set_id, alert_threshold)")
      .eq("user_id", user.id),
    supabase.rpc("touch_last_seen"),
  ]);

  const partners = (memberships ?? [])
    .map((m) => m.partners as unknown as PartnerRow | null)
    .filter((p): p is PartnerRow => p !== null);

  if (partners.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Header email={user?.email} />
        <div className="rounded-xl border border-line bg-paper p-5 text-sm text-slate">
          Ehhez a fiókhoz még nincs egység hozzárendelve — keresd az adminisztrátort.
        </div>
      </div>
    );
  }

  const selected = partners.find((p) => p.id === partnerParam) ?? partners[0];

  // Four independent reads, none derived from another, so they go out together.
  // Every one of them is bounded: the aggregates are grouped in SQL (see
  // supabase/migrations/..._aggregate_stats_views.sql) and the log is capped, so
  // none of this scales with the number of reviews the way the previous
  // fetch-everything-and-average-in-JS version did.
  const [{ data: aspects }, { data: summary }, { data: aspectStats }, { data: heatmapRows }, { data: logs }] =
    await Promise.all([
      supabase
        .from("question_aspects")
        .select("key, label, icon")
        .eq("question_set_id", selected.question_set_id ?? "")
        .order("sort_order").order("id"),
      // The *_range RPCs aggregate within the selected window in SQL. Filtering
      // client-side instead would mean fetching every score row first — the
      // exact thing ..._aggregate_stats_views.sql was written to stop.
      supabase
        .rpc("partner_summary_range", { target_partner_id: selected.id, since_days: sinceDays })
        .maybeSingle(),
      supabase.rpc("partner_aspect_stats_range", {
        target_partner_id: selected.id,
        since_days: sinceDays,
      }),
      supabase.rpc("partner_heatmap_stats_range", {
        target_partner_id: selected.id,
        since_days: sinceDays,
      }),
      supabase
        .from("submission_log_view")
        .select("id, created_at, scores, reasons")
        .eq("partner_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(LOG_ROW_LIMIT),
    ]);

  const safeAspects = aspects ?? [];
  const aspectAverages = joinAspectAverages(safeAspects, aspectStats ?? []);
  const grids = gridsByAspect(
    safeAspects.map((a) => a.key),
    (heatmapRows ?? []) as HeatmapBucketRow[],
  );

  // Counted in SQL across the selected window, so it stays correct even though
  // the Napló below only carries the most recent LOG_ROW_LIMIT rows.
  const totalSubmissions = Number(summary?.review_count ?? 0);

  let alertMessage: string | null = null;
  if (totalSubmissions >= 5) {
    const withData = aspectAverages.filter((a) => a.avg !== null);
    const weakest = withData.sort((a, b) => a.avg! - b.avg!)[0];
    if (weakest && weakest.avg! < selected.alert_threshold) {
      const bucket = weakestBucket(grids[weakest.key] ?? []);
      alertMessage = bucket
        ? `${weakest.label} gyengébb ${bucket.day} ${bucket.hour}h körül (átlag: ${bucket.avg.toFixed(1)}) — érdemes ilyenkor erősíteni a személyzetet.`
        : `${weakest.label} átlaga jelenleg ${weakest.avg!.toFixed(1)}, a ${selected.alert_threshold} alatti figyelmeztetési küszöb alatt.`;
    }
  }

  // submission_log_view already returns one row per submission with its scores
  // and reasons folded into JSON objects, ordered newest-first by the query —
  // no id-list round trip and no client-side regrouping needed.
  const logRows: LogRow[] = (logs ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    scores: row.scores ?? {},
    reasons: row.reasons ?? {},
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Header email={user?.email} />

      <div className="mb-1">
        <VenueSwitcher partners={partners.map((p) => ({ id: p.id, name: p.name }))} selectedId={selected.id} />
      </div>

      <OwnerDashboardClient
        period={period}
        aspectAverages={aspectAverages}
        grids={grids}
        alertMessage={alertMessage}
        totalSubmissions={totalSubmissions}
        logRows={logRows}
        aspects={safeAspects}
      />
    </div>
  );
}

function Header({ email }: { email: string | undefined }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet">Partneri nézet</div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate">{email}</span>
        <form action={signOutOwner}>
          <button type="submit" className="text-sm font-semibold text-slate hover:text-ink">
            Kijelentkezés
          </button>
        </form>
      </div>
    </div>
  );
}
