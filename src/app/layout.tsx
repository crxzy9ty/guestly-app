import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Required for opengraph-image.tsx/twitter-image.tsx to resolve to an
  // absolute, publicly-fetchable URL (chat apps unfurling a link cannot
  // reach a relative path) — falls back to the real production domain
  // rather than the .env.local dev default, since a missing env var should
  // never silently point link previews at localhost.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_SITE_URL : "https://fydback.hu"),
  title: "Fydback",
  description: "Vendégelégedettség-mérés valós időben.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
