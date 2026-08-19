import { DAYS, heatColor, type HeatmapGrid } from "@/lib/dashboard/heatmap";

export function Heatmap({ grid, hours }: { grid: HeatmapGrid; hours: number[] }) {
  return (
    <div>
      <div className="mb-1.5 grid gap-[3px]" style={{ gridTemplateColumns: `44px repeat(${hours.length}, 1fr)` }}>
        <div />
        {hours.map((h) => (
          <div key={h} className="text-center text-[10px] text-slate">
            {h}h
          </div>
        ))}
      </div>
      {DAYS.map((d, di) => (
        <div key={d} className="mb-[3px] grid gap-[3px]" style={{ gridTemplateColumns: `44px repeat(${hours.length}, 1fr)` }}>
          <div className="flex items-center text-[11px] text-slate">{d}</div>
          {(grid[di] ?? []).map((cell, hi) => (
            <div
              key={hi}
              title={cell ? `${d} ${hours[hi]}h: ${cell.avg.toFixed(1)} (${cell.count} értékelés)` : `${d} ${hours[hi]}h: nincs adat`}
              className="flex aspect-square items-center justify-center rounded text-[9px] font-bold"
              style={{
                background: cell ? heatColor(cell.avg) : "var(--color-mist)",
                color: cell && cell.avg < 5 ? "#fff" : "var(--color-ink)",
                border: cell ? "none" : "1px dashed var(--color-line)",
              }}
            >
              {cell ? cell.avg.toFixed(1) : ""}
            </div>
          ))}
        </div>
      ))}
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate">
        <span>Figyelendő</span>
        <div
          className="mx-2 h-1.5 flex-1 rounded-full"
          style={{ background: "linear-gradient(90deg, #E619C8, #F6F5FA, #1F9D6B)" }}
        />
        <span>Erős</span>
      </div>
    </div>
  );
}
