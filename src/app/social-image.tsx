import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

// Shared by opengraph-image.tsx and twitter-image.tsx — not a route itself
// (doesn't match a Next.js file convention name), just the logo lockup both
// of those render at the same 1200x630 size.
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };

// ImageResponse (Satori) only supports ttf/otf/woff — not woff2, and not
// variable fonts reliably. @fontsource ships static, per-weight .woff
// files, read locally rather than fetched over the network at request time
// (no dependency on Google Fonts' user-agent-based format negotiation, no
// runtime fetch to fail).
async function loadFont(pkg: string, file: string): Promise<Buffer> {
  return readFile(join(process.cwd(), `node_modules/@fontsource/${pkg}/files/${file}`));
}

export async function renderSocialImage() {
  // "fyd"+"back" has no accented characters, so plain Outfit is enough
  // there. The tagline does (Hungarian "ő"/"ű") — Satori mis-shapes that
  // specific glyph in Outfit's build (renders a stray loop instead of the
  // double-acute accent) regardless of which subset file supplies it, so
  // the tagline uses Plus Jakarta Sans instead, which shapes it correctly.
  const [outfit, jakarta, jakartaExt] = await Promise.all([
    loadFont("outfit", "outfit-latin-800-normal.woff"),
    loadFont("plus-jakarta-sans", "plus-jakarta-sans-latin-700-normal.woff"),
    loadFont("plus-jakarta-sans", "plus-jakarta-sans-latin-ext-700-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontSize: 140,
            fontWeight: 800,
            fontFamily: "Outfit",
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          {/* Dots centered above "fyd" specifically, not the whole wordmark.
              Plain flexbox (a column whose width is set by "fyd", centering
              the narrower dot row inside it) rather than Logo.tsx's own
              percentage-based translateX(-50%) — Satori's CSS support
              doesn't extend to `%` inside calc(). */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 15, marginLeft: 20, marginBottom: 2 }}>
              <div style={{ display: "flex", width: 20, height: 20, borderRadius: "50%", background: "#17e0ff" }} />
              <div style={{ display: "flex", width: 34, height: 34, borderRadius: "50%", background: "#7c3aff" }} />
              <div style={{ display: "flex", width: 50, height: 50, borderRadius: "50%", background: "#ff2fc4" }} />
            </div>
            <span
              style={{
                display: "flex",
                backgroundImage: "linear-gradient(90deg, #17e0ff 0%, #7c3aff 45%, #ff2fc4 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              fyd
            </span>
          </div>
          <span style={{ display: "flex", color: "#14151a" }}>back</span>
        </div>
        <div
          style={{ display: "flex", marginTop: 26, fontSize: 32, color: "#5b5b68", fontFamily: "Plus Jakarta Sans", fontWeight: 700 }}
        >
          Vendégelégedettség, valós időben
        </div>
      </div>
    ),
    {
      ...SOCIAL_IMAGE_SIZE,
      fonts: [
        { name: "Outfit", data: outfit, weight: 800, style: "normal" },
        { name: "Plus Jakarta Sans", data: jakarta, weight: 700, style: "normal" },
        { name: "Plus Jakarta Sans", data: jakartaExt, weight: 700, style: "normal" },
      ],
    },
  );
}
