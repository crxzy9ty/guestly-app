"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAdmin } from "@/app/actions/auth";

export function AdminNav({ adminSlug, email }: { adminSlug: string; email: string | undefined }) {
  const pathname = usePathname();
  const base = `/${adminSlug}`;
  const tabs = [
    { href: base, label: "Áttekintés" },
    { href: `${base}/partners`, label: "Partnerek" },
    { href: `${base}/log`, label: "Napló" },
    { href: `${base}/settings`, label: "Beállítások" },
    { href: `${base}/help`, label: "Súgó" },
  ];
  const boundSignOut = signOutAdmin.bind(null, adminSlug);

  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="h-[18px] w-[18px] shrink-0 rounded-md bg-gradient-to-br from-cyan via-violet to-magenta" />
          <span className="shrink-0 text-base font-bold tracking-tight text-ink">Fydback</span>
          <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden truncate text-xs text-slate sm:inline">{email}</span>
          {/* Same treatment as the owner dashboard header: Kijelentkezés and
              Jelszó módosítása moved behind a menu so they aren't sitting in
              the open as an easy misclick target. */}
          <details className="relative shrink-0">
            <summary
              aria-label="Fiók menü"
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full bg-mist text-slate [&::-webkit-details-marker]:hidden"
            >
              <span className="flex gap-[3px]">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
            </summary>
            <div className="absolute right-0 z-20 mt-1.5 w-52 rounded-xl border border-line bg-paper p-1.5 shadow-lg">
              {/* /set-password works for any already-authenticated session,
                  not just the post-invite/reset-link flow it was originally
                  built for — updateUser() only needs a session, it doesn't
                  care how the session was established. So this reuses that
                  page rather than needing a separate change-password form. */}
              <Link
                href="/set-password"
                className="block rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-mist"
              >
                Jelszó módosítása
              </Link>
              <form action={boundSignOut}>
                <button
                  type="submit"
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-ink hover:bg-mist"
                >
                  Kijelentkezés
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
      <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 sm:px-6">
        {tabs.map((t) => {
          const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold ${
                active ? "border-ink text-ink" : "border-transparent text-slate"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
