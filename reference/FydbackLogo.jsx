import React, { useEffect } from "react";

/**
 * FydbackLogo
 *
 * Self-contained: injects the "Outfit" Google Font on mount, so it renders
 * correctly even without any font <link> set up elsewhere in the app.
 * If your project already loads "Outfit" globally (e.g. via next/font/google),
 * you can safely delete the useEffect block below — it's a no-op if the
 * font is already present.
 *
 * Usage:
 *   <FydbackLogo />
 *   <FydbackLogo variant="dark" size={80} />
 */

const GRADIENT = "linear-gradient(90deg, #17e0ff 0%, #7c3aff 45%, #ff2fc4 100%)";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@700&display=swap";

export default function FydbackLogo({ variant = "light", size = 64 }) {
  useEffect(() => {
    const id = "fydback-outfit-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
  }, []);

  const isDark = variant === "dark";
  const textColor = isDark ? "#f5f5f7" : "#14151a";
  const bgColor = isDark ? "#0c0d11" : "#ffffff";
  const dotBase = size / 64;

  return (
    <div
      style={{
        background: bgColor,
        padding: `${size * 0.6}px`,
        borderRadius: "20px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "inline-block",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
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
                backgroundImage: GRADIENT,
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
              <div
                style={{
                  width: `${7 * dotBase}px`,
                  height: `${7 * dotBase}px`,
                  borderRadius: "50%",
                  background: "#17e0ff",
                }}
              />
              <div
                style={{
                  width: `${12 * dotBase}px`,
                  height: `${12 * dotBase}px`,
                  borderRadius: "50%",
                  background: "#7c3aff",
                }}
              />
              <div
                style={{
                  width: `${18 * dotBase}px`,
                  height: `${18 * dotBase}px`,
                  borderRadius: "50%",
                  background: "#ff2fc4",
                }}
              />
            </div>
          </span>
          <span style={{ color: textColor }}>back</span>
        </div>
      </div>
    </div>
  );
}
