import { createClient } from "@/lib/supabase/server";
import { VenueRankingTable, type VenueStat } from "./VenueRankingTable";

type Partner = { id: string; name: string; question_set_id: string | null; alert_threshold: number };
type Aspect = { key: string; label: string; question_set_id: string };

function avg(vals: number[]) {
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ data: partners }, { data: submissions }, { data: aspects }] = await Promise.all([
    supabase.from("partners").select("id, name, question_set_id, alert_threshold").order("name"),
    supabase.from("submissions").select("id, partner_id, created_at, prize_id"),
    supabase.from("question_aspects").select("key, label, question_set_id"),
  ]);

  const safePartners = (partners ?? []) as Partner[];
  const safeSubmissions = submissions ?? [];
  const safeAspects = (aspects ?? []) as Aspect[];

  if (safePartners.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-6 text-center text-sm text-slate">
        Még nincs felvett partner — kezdd a Partnerek fülön egy új egység hozzáadásával.
      </div>
    );
  }

  const submissionIds = new Set(safeSubmissions.map((s) => s.id));
  const { data: scores } =
    submissionIds.size > 0
      ? await supabase.from("submission_scores").select("submission_id, aspect_key, score")
      : { data: [] as { submission_id: string; aspect_key: string; score: number }[] };
  const safeScores = scores ?? [];

  // Server Component: this genuinely runs fresh per request, so reading the
  // actual current time here is correct, not a memoization hazard — the
  // react-hooks/purity rule is written for client render purity and doesn't
  // have a server-component-aware exception yet.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const last24h = safeSubmissions.filter((s) => now - new Date(s.created_at).getTime() <= 86_400_000).length;
  const last7d = safeSubmissions.filter((s) => now - new Date(s.created_at).getTime() <= 7 * 86_400_000).length;
  const totalPrizeEntries = safeSubmissions.filter((s) => s.prize_id).length;
  const responseRate = safeSubmissions.length ? Math.round((totalPrizeEntries / safeSubmissions.length) * 100) : 0;

  const venueStats = safePartners
    .map((partner) => {
      const rows = safeSubmissions.filter((s) => s.partner_id === partner.id);
      const rowIds = new Set(rows.map((r) => r.id));
      const partnerScores = safeScores.filter((s) => rowIds.has(s.submission_id));
      const avgScore = partnerScores.length ? avg(partnerScores.map((s) => s.score)) : null;
      const partnerAspects = safeAspects.filter((a) => a.question_set_id === partner.question_set_id);
      const worstAspect = partnerAspects
        .map((a) => {
          const vals = partnerScores.filter((s) => s.aspect_key === a.key).map((s) => s.score);
          return vals.length ? { ...a, avg: avg(vals) } : null;
        })
        .filter((a): a is Aspect & { avg: number } => a !== null)
        .sort((a, b) => a.avg - b.avg)[0];
      return { partner, reviewCount: rows.length, avgScore, prizeCount: rows.filter((r) => r.prize_id).length, worstAspect };
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
            {alerts.map((a) => (
              <div key={a.partner.id} className="rounded-lg bg-ink p-3.5 text-white">
                <span className="font-bold text-cyan">{a.partner.name}</span> — {a.worstAspect!.label} átlaga{" "}
                {a.worstAspect!.avg.toFixed(1)} (küszöb: {a.partner.alert_threshold})
              </div>
            ))}
          </div>
        </div>
      )}

      <VenueRankingTable
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
