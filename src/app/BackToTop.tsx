"use client";

import { useEffect, useState } from "react";

// Only the landing page is long enough (hero through footer, several full
// screens on mobile) for this to earn its place — appears once the visitor
// has scrolled past roughly one viewport, not immediately on load.
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Vissza a tetejére"
      className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-[0_8px_24px_rgba(21,19,28,0.25)] transition-transform hover:-translate-y-0.5"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
