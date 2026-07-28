"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRModal({
  partner,
  siteUrl,
  onClose,
}: {
  partner: { id: string; name: string };
  siteUrl: string;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url = `${siteUrl}/ertekeles/${partner.id}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 320, margin: 2 }).then((d) => {
      if (!cancelled) setDataUrl(d);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-paper p-7 text-center"
      >
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-violet">
          QR-kód
        </div>
        <div className="mb-4 text-base font-bold text-ink">{partner.name}</div>

        <div className="mb-4 flex items-center justify-center">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, next/image can't optimize it anyway
            <img src={dataUrl} alt={`QR-kód — ${partner.name}`} width={220} height={220} className="rounded-lg border border-line" />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center text-xs text-slate">
              Generálás…
            </div>
          )}
        </div>

        <div className="mb-5 break-all text-[11px] text-slate">{url}</div>

        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={dataUrl ?? "#"}
            download={`guestly-qr-${partner.id}.png`}
            className={`h-10 rounded-lg bg-ink px-4 text-sm font-bold leading-10 text-white ${dataUrl ? "" : "pointer-events-none opacity-40"}`}
          >
            Letöltés (PNG)
          </a>
          <button onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm font-bold text-ink">
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
