import type { PortfolioDayPoint } from "@/lib/dashboard/trend";

const WIDTH = 600;
const HEIGHT = 100;
const PAD_X = 6;
const PAD_TOP = 6;
const PAD_BOTTOM = 20;
const BAR_GAP = 2;

// A heartbeat view across every partner combined — the complement to the
// per-partner "Szokatlan forgalom" spike detector, which only ever looks at
// one venue at a time. A sudden portfolio-wide DROP (every QR code silently
// broken after a deploy, for instance) is exactly the failure mode a
// per-partner-only view would never surface, since nothing there compares a
// venue to the rest of the portfolio.
export function PortfolioTrendChart({ points }: { points: PortfolioDayPoint[] }) {
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const barWidth = points.length > 0 ? plotWidth / points.length - BAR_GAP : 0;
  // At least 1 so an all-zero window doesn't divide by zero and collapse
  // every bar to the same height.
  const max = Math.max(1, ...points.map((p) => p.count));

  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-[100px] w-full"
      role="img"
      aria-label="Napi értékelésszám a teljes portfólióban"
    >
      {points.map((p, i) => {
        // A day with zero reviews gets a visible muted baseline tick rather
        // than no bar at all — an absent bar would be indistinguishable from
        // a gap in the data, when it is in fact the signal worth noticing.
        const h = p.count > 0 ? Math.max((p.count / max) * plotHeight, 2) : 2;
        const x = PAD_X + i * (barWidth + BAR_GAP);
        const y = HEIGHT - PAD_BOTTOM - h;
        return (
          <g key={p.date}>
            <rect
              x={x}
              y={y}
              width={Math.max(barWidth, 1)}
              height={h}
              rx={1.5}
              fill={p.count > 0 ? "var(--color-violet)" : "var(--color-line)"}
            >
              <title>{`${p.label}: ${p.count} értékelés`}</title>
            </rect>
            {i % labelStep === 0 && (
              <text x={x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle" fontSize={9} fill="var(--color-slate)">
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
