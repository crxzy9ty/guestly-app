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
        <div className="flex shrink-0 items-center gap-3.5">
          <span className="hidden truncate text-xs text-slate sm:inline">{email}</span>
          {/* /set-password works for any already-authenticated session, not
              just the post-invite/reset-link flow it was originally built
              for — updateUser() only needs a session, it doesn't care how the
              session was established. So this reuses that page rather than
              needing a separate change-password form. */}
          <Link href="/set-password" className="whitespace-nowrap text-sm font-semibold text-slate hover:text-ink">
            Jelszó módosítása
          </Link>
          <form action={boundSignOut}>
            <button type="submit" className="whitespace-nowrap text-sm font-semibold text-slate hover:text-ink">
              Kijelentkezés
            </button>
          </form>
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
