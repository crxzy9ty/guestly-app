import { redirect } from "next/navigation";
import { createClient, getCachedUser } from "@/lib/supabase/server";
import { signOutOwner } from "@/app/actions/auth";
import { VenueSwitcher } from "./VenueSwitcher";
import { OwnerDashboardClient } from "./OwnerDashboardClient";
import type { LogRow } from "./LogTable";
import { buildHeatmapGrid, computeAspectAverages, weakestBucket } from "@/lib/dashboard/heatmap";

type PartnerRow = { id: string; name: string; question_set_id: string | null; alert_threshold: number };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner: partnerParam } = await searchParams;
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

  const { data: memberships } = await supabase
    .from("partner_members")
    .select("partners(id, name, question_set_id, alert_threshold)")
    .eq("user_id", user.id);

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

  // Both only depend on `selected`, not on each other — fetched in parallel.
  const [{ data: aspects }, { data: submissions }] = await Promise.all([
    supabase
      .from("question_aspects")
      .select("key, label, icon")
      .eq("question_set_id", selected.question_set_id ?? "")
      .order("sort_order"),
    supabase
      .from("submissions_owner_view")
      .select("id, created_at")
      .eq("partner_id", selected.id)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const safeAspects = aspects ?? [];
  const submissionRows = submissions ?? [];
  const submissionIds = submissionRows.map((s) => s.id);

  const { data: scores } =
    submissionIds.length > 0
      ? await supabase
          .from("submission_scores")
          .select("submission_id, aspect_key, score, reason")
          .in("submission_id", submissionIds)
      : { data: [] as { submission_id: string; aspect_key: string; score: number; reason: string | null }[] };

  const safeScores = scores ?? [];
  const createdAtBySubmission = new Map(submissionRows.map((s) => [s.id, s.created_at]));

  const aspectAverages = computeAspectAverages(safeAspects, safeScores);

  const grids = Object.fromEntries(
    safeAspects.map((a) => [
      a.key,
      buildHeatmapGrid(
        safeScores
          .filter((s) => s.aspect_key === a.key)
          .map((s) => ({ createdAt: createdAtBySubmission.get(s.submission_id)!, score: s.score })),
      ),
    ]),
  );

  const totalSubmissions = submissionRows.length;

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

  const rowsBySubmission = new Map<string, LogRow>();
  for (const s of submissionRows) {
    rowsBySubmission.set(s.id, { id: s.id, createdAt: s.created_at, scores: {}, reasons: {} });
  }
  for (const s of safeScores) {
    const row = rowsBySubmission.get(s.submission_id);
    if (!row) continue;
    row.scores[s.aspect_key] = s.score;
    if (s.reason) row.reasons[s.aspect_key] = s.reason;
  }
  const logRows = Array.from(rowsBySubmission.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Header email={user?.email} />

      <div className="mb-1">
        <VenueSwitcher partners={partners.map((p) => ({ id: p.id, name: p.name }))} selectedId={selected.id} />
      </div>

      <OwnerDashboardClient
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
