import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VenueInsights } from "@/app/VenueInsights";
import {
  gridsByAspect,
  joinAspectAverages,
  weakestBucket,
  type HeatmapBucketRow,
} from "@/lib/dashboard/heatmap";
import { trendSeriesByAspect, type TrendBucketRow } from "@/lib/dashboard/trend";
import { parsePeriod, periodDays, periodLabel } from "@/lib/dashboard/period";

// Admin view of a single venue, showing exactly what that venue's owner sees
// on their own dashboard (same VenueInsights component, same aggregate views).
// Added because the admin overview only carried summary figures — an admin
// fielding a "what does this number mean?" call had no way to look at the
// partner's actual heatmap, and neither did anyone wanting to verify the
// heatmap aggregation without logging in as an owner.
export default async function AdminVenueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ adminSlug: string; partnerId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { adminSlug, partnerId } = await params;
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const sinceDays = periodDays(period);
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, name, address, question_set_id, alert_threshold")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) {
    notFound();
  }

  const [{ data: aspects }, { data: summary }, { data: aspectStats }, { data: heatmapRows }, { data: trendRows }] =
    await Promise.all([
      supabase
        .from("question_aspects")
        .select("key, label, icon")
        .eq("question_set_id", partner.question_set_id ?? "")
        .order("sort_order").order("id"),
      supabase
        .rpc("partner_summary_range", { target_partner_id: partner.id, since_days: sinceDays })
        .maybeSingle(),
      supabase.rpc("partner_aspect_stats_range", {
        target_partner_id: partner.id,
        since_days: sinceDays,
      }),
      supabase.rpc("partner_heatmap_stats_range", {
        target_partner_id: partner.id,
        since_days: sinceDays,
      }),
      supabase.rpc("partner_aspect_trend_range", {
        target_partner_id: partner.id,
        since_days: sinceDays,
      }),
    ]);

  const safeAspects = aspects ?? [];
  const aspectAverages = joinAspectAverages(safeAspects, aspectStats ?? []);
  const grids = gridsByAspect(
    safeAspects.map((a) => a.key),
    (heatmapRows ?? []) as HeatmapBucketRow[],
  );
  const trendSeries = trendSeriesByAspect(
    safeAspects.map((a) => a.key),
    (trendRows ?? []) as TrendBucketRow[],
  );
  const totalSubmissions = Number(summary?.review_count ?? 0);

  // Same wording and same 5-review floor as the owner dashboard, so a partner
  // and an admin never read a different alert off identical data.
  let alertMessage: string | null = null;
  if (totalSubmissions >= 5) {
    const withData = aspectAverages.filter((a) => a.avg !== null);
    const weakest = withData.sort((a, b) => a.avg! - b.avg!)[0];
    if (weakest && weakest.avg! < partner.alert_threshold) {
      const bucket = weakestBucket(grids[weakest.key] ?? []);
      alertMessage = bucket
        ? `${weakest.label} gyengébb ${bucket.day} ${bucket.hour}h körül (átlag: ${bucket.avg.toFixed(1)}) — érdemes ilyenkor erősíteni a személyzetet.`
        : `${weakest.label} átlaga jelenleg ${weakest.avg!.toFixed(1)}, a ${partner.alert_threshold} alatti figyelmeztetési küszöb alatt.`;
    }
  }

  return (
    <div>
      <Link href={`/${adminSlug}`} className="mb-4 inline-block text-xs font-semibold text-slate hover:text-ink">
        ← Vissza az áttekintésre
      </Link>

      <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-violet">
        Partner nézete
      </div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">{partner.name}</h1>
      {partner.address && <div className="mb-4 text-sm text-slate">{partner.address}</div>}

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
        <span>
          {totalSubmissions} értékelés
          {period === "all" ? " összesen" : ` — ${periodLabel(period).toLowerCase()}`}
        </span>
        <span>{Number(summary?.prize_count ?? 0)} sorsolásra jelentkezett</span>
        <span>Riasztási küszöb: {partner.alert_threshold}</span>
        <Link href={`/${adminSlug}/log?partner=${partner.id}`} className="font-semibold text-violet">
          Napló →
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-line bg-paper p-3 text-[11.5px] leading-relaxed text-slate">
        Ez pontosan az, amit a partner lát a saját felületén — ugyanazokból az adatokból, ugyanazzal a
        riasztási szöveggel. A vendégek e-mail címei és sorsolási azonosítói itt nem jelennek meg; azok
        a Naplóban érhetők el.
      </div>

      <VenueInsights
        period={period}
        aspectAverages={aspectAverages}
        grids={grids}
        trendSeries={trendSeries}
        alertMessage={alertMessage}
        totalSubmissions={totalSubmissions}
      />
    </div>
  );
}
