import { Outfit } from "next/font/google";

// Adapted from a supplied JSX component (reference/fydbacklogo.jsx): same
// gradient "fyd" + 3-dot cluster + "back" mark, same variant/size logic.
// Two changes from the original —
//   - Outfit loaded via next/font/google (matching how every other font in
//     this app is loaded, see layout.tsx) instead of a useEffect that
//     inserts a <link> into document.head at runtime. That makes this a
//     plain Server Component: no "use client", no hydration-unfriendly DOM
//     write, no per-mount flash of the fallback font.
//   - The outer padded/background <div> from the original is dropped —
//     that reads as a logo presented on its own card, not a mark meant to
//     sit inline inside an existing header row (all 8 call sites here).
const outfit = Outfit({ weight: "700", subsets: ["latin"] });

export function Logo({ variant = "light", size = 20 }: { variant?: "light" | "dark"; size?: number }) {
  const isDark = variant === "dark";
  const textColor = isDark ? "#f5f5f7" : "#14151a";
  const dotBase = size / 64;

  return (
    <div className={outfit.className} style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          fontWeight: 700,
          letterSpacing: "-0.03em",
          fontSize: `${size}px`,
          display: "inline-flex",
          alignItems: "baseline",
          lineHeight: 1,
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          <span
            style={{
              backgroundImage: "linear-gradient(90deg, #17e0ff 0%, #7c3aff 45%, #ff2fc4 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            fyd
          </span>

          {/* 3-dot rating cluster, growing size, centered above "fyd" */}
          <div
            style={{
              position: "absolute",
              top: `${-16 * dotBase}px`,
              left: "50%",
              transform: `translateX(calc(-50% + ${6 * dotBase}px))`,
              display: "flex",
              alignItems: "flex-end",
              gap: `${6 * dotBase}px`,
            }}
          >
            <div style={{ width: `${7 * dotBase}px`, height: `${7 * dotBase}px`, borderRadius: "50%", background: "#17e0ff" }} />
            <div style={{ width: `${12 * dotBase}px`, height: `${12 * dotBase}px`, borderRadius: "50%", background: "#7c3aff" }} />
            <div style={{ width: `${18 * dotBase}px`, height: `${18 * dotBase}px`, borderRadius: "50%", background: "#ff2fc4" }} />
          </div>
        </span>
        <span style={{ color: textColor }}>back</span>
      </div>
    </div>
  );
}
