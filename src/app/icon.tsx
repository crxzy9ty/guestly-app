import { ImageResponse } from "next/og";

// Browser-tab favicon — just the logo's own 3-dot cluster (no wordmark; at
// 32px the full "fydback" text wouldn't read), generated at request time so
// it can never drift from Logo.tsx's actual colors.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <div style={{ display: "flex", width: 5, height: 5, borderRadius: "50%", background: "#17e0ff" }} />
        <div style={{ display: "flex", width: 8, height: 8, borderRadius: "50%", background: "#7c3aff" }} />
        <div style={{ display: "flex", width: 11, height: 11, borderRadius: "50%", background: "#ff2fc4" }} />
      </div>
    ),
    { ...size },
  );
}
