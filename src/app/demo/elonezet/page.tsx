import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { VenueInsights } from "@/app/VenueInsights";
import { Logo } from "@/app/Logo";
import {
  gridsByAspect,
  hourBucketsFor,
  joinAspectAverages,
  weakestBucket,
  type HeatmapBucketRow,
} from "@/lib/dashboard/heatmap";
import { trendSeriesByAspect, type TrendBucketRow } from "@/lib/dashboard/trend";
import { parsePeriod, periodDays, periodLabel } from "@/lib/dashboard/period";
import { actionSuggestion, type Suggestion } from "@/lib/dashboard/suggestions";
import { wowDeltas } from "@/lib/dashboard/wow";

// Seeded once by scripts/seed-demo-partner.ts — a persistent "DEMO – " partner
// with realistic-looking generated reviews, kept around specifically so this
// page has something to show.
const DEMO_PARTNER_ID = "f5c7eb41-21c2-4a54-9944-83d89da11410";

// A no-login, read-only mirror of the owner dashboard / admin venue-detail
// view (same VenueInsights component), pointed at one fixed, clearly-marked
// demo partner. For sharing with prospects during a sales conversation —
// not a real product feature: there is no way to reach any OTHER partner's
// data through this route (the id is hardcoded here, not taken from the
// URL), and the RLS-bypassing admin client is only ever used to read this
// one fixed row, so this adds no general public-data exposure.
export const metadata: Metadata = {
  title: "Élő demó — Fydback",
  robots: { index: false, follow: false },
};

export default async function DemoPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const sinceDays = periodDays(period);
  const supabase = createAdminClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, name, address, question_set_id, alert_threshold, open_hour, close_hour")
    .eq("id", DEMO_PARTNER_ID)
    .maybeSingle();

  if (!partner) {
    notFound();
  }

  const [{ data: aspects }, { data: summary }, { data: aspectStats }, { data: heatmapRows }, { data: trendRows }, { data: wowRows }] =
    await Promise.all([
      supabase
        .from("question_aspects")
        .select("key, label, icon")
        .eq("question_set_id", partner.question_set_id ?? "")
        .order("sort_order")
        .order("id"),
      supabase.rpc("partner_summary_range", { target_partner_id: partner.id, since_days: sinceDays }).maybeSingle(),
      supabase.rpc("partner_aspect_stats_range", { target_partner_id: partner.id, since_days: sinceDays }),
      supabase.rpc("partner_heatmap_stats_range", { target_partner_id: partner.id, since_days: sinceDays }),
      supabase.rpc("partner_aspect_trend_range", { target_partner_id: partner.id, since_days: sinceDays }),
      supabase.rpc("partner_aspect_stats_wow", { target_partner_id: partner.id }),
    ]);

  const safeAspects = aspects ?? [];
  const aspectAverages = joinAspectAverages(safeAspects, aspectStats ?? []);
  const wow = wowDeltas(wowRows ?? []);
  const hours = hourBucketsFor(partner.open_hour, partner.close_hour);
  const grids = gridsByAspect(
    safeAspects.map((a) => a.key),
    (heatmapRows ?? []) as HeatmapBucketRow[],
    hours,
  );
  const trendSeries = trendSeriesByAspect(
    safeAspects.map((a) => a.key),
    (trendRows ?? []) as TrendBucketRow[],
  );
  const totalSubmissions = Number(summary?.review_count ?? 0);

  let alertMessage: string | null = null;
  let suggestion: Suggestion | null = null;
  if (totalSubmissions >= 5) {
    const withData = aspectAverages.filter((a) => a.avg !== null);
    const weakest = withData.sort((a, b) => a.avg! - b.avg!)[0];
    if (weakest && weakest.avg! < partner.alert_threshold) {
      const bucket = weakestBucket(grids[weakest.key] ?? [], hours);
      alertMessage = bucket
        ? `${weakest.label} gyengébb ${bucket.day} ${bucket.hour}h körül (átlag: ${bucket.avg.toFixed(1)}) — érdemes ilyenkor erősíteni a személyzetet.`
        : `${weakest.label} átlaga jelenleg ${weakest.avg!.toFixed(1)}, a ${partner.alert_threshold} alatti figyelmeztetési küszöb alatt.`;
      if (bucket) {
        suggestion = actionSuggestion(weakest.key, weakest.label, bucket.day, bucket.hour, bucket.avg);
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Logo size={22} />
        <Link href="/demo" className="text-sm font-bold text-violet">
          Kérek saját fiókot →
        </Link>
      </div>

      <div className="mb-5 rounded-lg border border-line bg-mist p-3 text-[11.5px] leading-relaxed text-slate">
        Ez egy élő minta-fiók, generált, valós-szerű adatokkal — pontosan ezt látja egy partner a saját
        irányítópultján, bejelentkezés után.
      </div>

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">{partner.name}</h1>
      {partner.address && <div className="mb-4 text-sm text-slate">{partner.address}</div>}

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
        <span>
          {totalSubmissions} értékelés
          {period === "all" ? " összesen" : ` — ${periodLabel(period).toLowerCase()}`}
        </span>
        <span>Riasztási küszöb: {partner.alert_threshold}</span>
      </div>

      <VenueInsights
        period={period}
        aspectAverages={aspectAverages}
        grids={grids}
        hours={hours}
        trendSeries={trendSeries}
        wow={wow}
        suggestion={suggestion}
        alertMessage={alertMessage}
        totalSubmissions={totalSubmissions}
      />
    </div>
  );
}
