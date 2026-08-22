import { ImageResponse } from "next/og";

// iOS "add to home screen" icon — same dot cluster as icon.tsx, just at the
// larger canvas Apple expects, on a solid paper background (home-screen
// icons render on an opaque tile, unlike a browser tab).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", width: 28, height: 28, borderRadius: "50%", background: "#17e0ff" }} />
        <div style={{ display: "flex", width: 46, height: 46, borderRadius: "50%", background: "#7c3aff" }} />
        <div style={{ display: "flex", width: 66, height: 66, borderRadius: "50%", background: "#ff2fc4" }} />
      </div>
    ),
    { ...size },
  );
}
