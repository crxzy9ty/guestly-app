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
  ];
  const boundSignOut = signOutAdmin.bind(null, adminSlug);

  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-[18px] w-[18px] rounded-md bg-gradient-to-br from-cyan via-violet to-magenta" />
          <span className="text-base font-bold tracking-tight text-ink">Guestly</span>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-xs text-slate">{email}</span>
          <form action={boundSignOut}>
            <button type="submit" className="text-sm font-semibold text-slate hover:text-ink">
              Kijelentkezés
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto flex max-w-4xl gap-1 px-6">
        {tabs.map((t) => {
          const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`border-b-2 px-3 py-2.5 text-sm font-bold ${
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
