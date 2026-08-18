import { heatColor } from "@/lib/dashboard/heatmap";
import type { TrendPoint } from "@/lib/dashboard/trend";

const WIDTH = 600;
const HEIGHT = 160;
const PAD_X = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

// Fixed 1-10 axis rather than auto-scaled to the data's own min/max: an
// auto-scaled axis would make a 7-8 range look as dramatic as a 2-9 range,
// which is exactly the kind of visual exaggeration a feedback tool showing
// real guest scores shouldn't produce.
const MIN_SCORE = 1;
const MAX_SCORE = 10;

function scoreToY(score: number): number {
  const t = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  return HEIGHT - PAD_BOTTOM - t * (HEIGHT - PAD_TOP - PAD_BOTTOM);
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-xs text-slate">
        Nincs elég adat ehhez az időszakhoz.
      </div>
    );
  }

  const plotWidth = WIDTH - PAD_X * 2;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const xAt = (i: number) => PAD_X + i * step;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${scoreToY(p.avg).toFixed(1)}`)
    .join(" ");

  // Caps x-axis text labels at roughly 8 regardless of point count, so a
  // dense window (30 daily points) doesn't overlap into unreadable text —
  // the dots themselves still render for every point.
  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-[160px] w-full"
      role="img"
      aria-label="Trend grafikon"
    >
      {points.length > 1 && <path d={path} fill="none" stroke="var(--color-violet)" strokeWidth={2} />}
      {points.map((p, i) => (
        <g key={p.date}>
          <circle
            cx={xAt(i)}
            cy={scoreToY(p.avg)}
            r={points.length > 20 ? 2.5 : 4}
            fill={heatColor(p.avg)}
            stroke="var(--color-paper)"
            strokeWidth={1}
          >
            <title>{`${p.label}: ${p.avg.toFixed(1)} (${p.count} értékelés)`}</title>
          </circle>
          {i % labelStep === 0 && (
            <text x={xAt(i)} y={HEIGHT - 6} textAnchor="middle" fontSize={9} fill="var(--color-slate)">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
