"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createPartner, updatePartner, deletePartner } from "@/app/actions/partners";
import { QRModal } from "./QRModal";
import { InviteOwnerModal } from "./InviteOwnerModal";
import { downloadCsv } from "@/lib/csv";
import { getSubscriptionStatus, subscriptionSortKey } from "@/lib/subscription";
import { formatRelative, staleness, stalenessColor, exactTooltip } from "@/lib/relative-time";

export type Partner = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  alert_threshold: number;
  subscription_start: string | null;
  subscription_end: string | null;
  open_hour: number | null;
  close_hour: number | null;
  // Engagement, from public.partner_activity. Read-only here.
  lastOwnerSeenAt: string | null;
  lastReviewAt: string | null;
  ownerCount: number;
};

// Two separate signals rather than one "activity" number, because they fail in
// opposite directions: logins with no reviews points at the QR code, reviews
// with no logins points at a partner who isn't getting value and will churn.
function ActivityCell({ iso, kind, extra }: { iso: string | null; kind: "login" | "review"; extra?: string }) {
  const state = staleness(iso, kind);
  const color = stalenessColor(state);
  return (
    <span
      title={`${exactTooltip(iso)}${extra ? ` · ${extra}` : ""}`}
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold"
      style={{ background: color.bg, color: color.fg }}
    >
      {formatRelative(iso)}
    </span>
  );
}

const inputClass = "h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none";
const labelClass = "mb-1 block text-xs font-bold text-ink";

function PartnerFields({ defaults }: { defaults?: Partial<Partner> }) {
  return (
    <div className="grid gap-2.5">
      <div>
        <label className={labelClass}>Egység neve</label>
        <input name="name" defaultValue={defaults?.name ?? ""} required placeholder="Aroma" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Pontos cím</label>
        <input name="address" defaultValue={defaults?.address ?? ""} placeholder="Utca, házszám, város" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass}>Telefonszám</label>
          <input name="phone" defaultValue={defaults?.phone ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>E-mail cím</label>
          <input name="email" type="email" defaultValue={defaults?.email ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass}>Kapcsolattartó neve</label>
          <input name="contact_name" defaultValue={defaults?.contact_name ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Kapcsolattartó telefonszáma</label>
          <input name="contact_phone" defaultValue={defaults?.contact_phone ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass}>Előfizetés kezdete</label>
          <input
            name="subscription_start"
            type="date"
            defaultValue={defaults?.subscription_start ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Előfizetés vége</label>
          <input
            name="subscription_end"
            type="date"
            defaultValue={defaults?.subscription_end ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <p className="-mt-1 text-[11px] leading-relaxed text-slate">
        Mindkettő opcionális. Üresen hagyva &quot;Nincs előfizetés&quot; állapot. A lejárat nem töröl és nem
        kapcsol ki semmit — az egység adatai és a QR-kódja megmaradnak, csak a jelzés változik a
        táblázatban.
      </p>
      <div>
        <label className={labelClass}>Riasztási küszöb</label>
        <input
          name="alert_threshold"
          type="number"
          min={1}
          max={10}
          step={0.1}
          defaultValue={defaults?.alert_threshold ?? 6.5}
          className={`${inputClass} max-w-[120px]`}
        />
        <p className="mt-1 text-[11px] text-slate">
          Ha egy szempont átlaga ez alá esik, az egység megjelenik a &quot;Figyelendő egységek&quot; listában.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass}>Nyitás órája</label>
          <input
            name="open_hour"
            type="number"
            min={0}
            max={23}
            defaultValue={defaults?.open_hour ?? ""}
            placeholder="8"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Zárás órája</label>
          <input
            name="close_hour"
            type="number"
            min={0}
            max={23}
            defaultValue={defaults?.close_hour ?? ""}
            placeholder="20"
            className={inputClass}
          />
        </div>
      </div>
      <p className="-mt-1 text-[11px] leading-relaxed text-slate">
        Mindkettő opcionális — üresen hagyva a hőtérkép 8-20 óráig mutatja az adatokat. Ha éjfél után zár, pl.
        18 és 2, azt is helyesen kezeli.
      </p>
    </div>
  );
}

// Colour comes from getSubscriptionStatus so the scale is defined in exactly
// one place — the table, and anywhere else that shows this later, can't drift.
function SubscriptionPill({ partner }: { partner: Partner }) {
  const status = getSubscriptionStatus(partner.subscription_start, partner.subscription_end);
  return (
    <span
      title={
        partner.subscription_start || partner.subscription_end
          ? `${partner.subscription_start ?? "—"} → ${partner.subscription_end ?? "nyitott"}`
          : "Nincs előfizetési időszak megadva"
      }
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold"
      style={{ background: status.color.bg, color: status.color.fg }}
    >
      {status.label}
    </span>
  );
}

export function PartnerManager({
  adminSlug,
  partners,
  siteUrl,
}: {
  adminSlug: string;
  partners: Partner[];
  siteUrl: string;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [qrFor, setQrFor] = useState<Partner | null>(null);
  const [inviteFor, setInviteFor] = useState<Partner | null>(null);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sortByExpiry, setSortByExpiry] = useState(false);

  const boundCreate = createPartner.bind(null, adminSlug);

  // Looked up from `partners`, not `filtered`: narrowing the search while a row
  // is open would otherwise make the edit panel vanish mid-edit.
  const editingPartner = partners.find((p) => p.id === editingId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = q
      ? partners.filter((p) =>
          [p.name, p.address, p.email, p.contact_name, p.phone].filter(Boolean).join(" ").toLowerCase().includes(q),
        )
      : partners;

    if (!sortByExpiry) return matched;

    // Expired first, then soonest-to-expire — the renewal worklist, in order.
    return [...matched].sort(
      (a, b) =>
        subscriptionSortKey(getSubscriptionStatus(a.subscription_start, a.subscription_end)) -
        subscriptionSortKey(getSubscriptionStatus(b.subscription_start, b.subscription_end)),
    );
  }, [partners, search, sortByExpiry]);

  const exportCsv = () => {
    downloadCsv(
      `fydback-partnerek-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "nev",
        "cim",
        "telefon",
        "email",
        "kapcsolattarto",
        "kapcsolattarto_telefon",
        "riasztasi_kuszob",
        "elofizetes_kezdete",
        "elofizetes_vege",
        "elofizetes_allapota",
        "utolso_belepes",
        "utolso_ertekeles",
        "fiokok_szama",
      ],
      filtered.map((p) => [
        p.name,
        p.address,
        p.phone,
        p.email,
        p.contact_name,
        p.contact_phone,
        p.alert_threshold,
        p.subscription_start,
        p.subscription_end,
        getSubscriptionStatus(p.subscription_start, p.subscription_end).label,
        // Exact timestamps in the export, not "3 napja": a CSV gets sorted and
        // filtered in a spreadsheet, where a relative phrase is useless.
        p.lastOwnerSeenAt ? exactTooltip(p.lastOwnerSeenAt) : "",
        p.lastReviewAt ? exactTooltip(p.lastReviewAt) : "",
        p.ownerCount,
      ]),
    );
  };

  return (
    <div>
      <div className="mb-4 rounded-xl border border-line bg-paper p-4">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-bold text-ink"
        >
          Új vendéglátóegység hozzáadása
          <span className="text-lg text-slate">{showAddForm ? "−" : "+"}</span>
        </button>

        {showAddForm && (
          <form
            action={async (formData) => {
              const res = await boundCreate(formData);
              setFormError(res.error);
              if (!res.error) setShowAddForm(false);
            }}
            className="mt-3.5"
          >
            <PartnerFields />
            {formError && <p className="mt-2.5 text-sm font-medium text-magenta">{formError}</p>}
            <button type="submit" className="mt-3 h-10 rounded-lg bg-ink px-5 text-sm font-bold text-white">
              Egység hozzáadása
            </button>
          </form>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, cím, e-mail vagy kapcsolattartó szerint…"
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
        />
        <button
          onClick={() => setSortByExpiry((v) => !v)}
          className="h-9 whitespace-nowrap rounded-lg px-3 text-xs font-bold"
          style={{
            border: sortByExpiry ? "1px solid var(--color-ink)" : "1px solid var(--color-line)",
            background: sortByExpiry ? "var(--color-ink)" : "var(--color-paper)",
            color: sortByExpiry ? "#fff" : "var(--color-ink)",
          }}
        >
          Lejárat szerint
        </button>
        <button onClick={exportCsv} className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink">
          Exportálás (CSV)
        </button>
        <div className="text-xs text-slate">{filtered.length} találat</div>
      </div>

      {/* The edit form used to live inside the table, in a <td colSpan>. That
          left the column headers rendered above a form that has nothing to do
          with those columns, so they collapsed into one another
          ("NévElőfizetésCímKapcsolattartó…") above an obviously non-tabular
          grid. It belongs outside the table, in the same panel style as the add
          form above. */}
      {editingPartner && (
        <div className="mb-4 rounded-xl border-2 border-violet bg-paper p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-violet">
            Egység szerkesztése
          </div>
          <div className="mb-3.5 text-base font-bold text-ink">{editingPartner.name}</div>
          <form
            action={async (formData) => {
              const res = await updatePartner(adminSlug, editingPartner.id, formData);
              setFormError(res.error);
              if (!res.error) setEditingId(null);
            }}
          >
            {/* Keyed on the partner id so switching which row you're editing
                resets the uncontrolled defaultValue inputs to the new venue's
                data instead of keeping the previous one's. */}
            <PartnerFields key={editingPartner.id} defaults={editingPartner} />
            {formError && <p className="mt-2.5 text-sm font-medium text-magenta">{formError}</p>}
            <div className="mt-3 flex gap-2">
              <button type="submit" className="h-10 rounded-lg bg-ink px-5 text-sm font-bold text-white">
                Mentés
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setEditingId(null);
                }}
                className="h-10 rounded-lg border border-line px-4 text-sm font-bold text-ink"
              >
                Mégsem
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-h-[65vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 bg-mist text-left">
              <th className="px-3 py-2 font-bold text-slate">Név</th>
              <th className="px-3 py-2 font-bold text-slate">Előfizetés</th>
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate" title="Mikor nyitotta meg a partner utoljára a saját felületét">
                Utolsó belépés
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-bold text-slate" title="Mikor érkezett utoljára vendégértékelés ehhez az egységhez">
                Utolsó értékelés
              </th>
              <th className="px-3 py-2 font-bold text-slate">Cím</th>
              <th className="px-3 py-2 font-bold text-slate">Kapcsolattartó</th>
              <th className="px-3 py-2 text-center font-bold text-slate">Riasztási küszöb</th>
              <th className="px-3 py-2 font-bold text-slate"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-t border-line"
                // Marks which row the edit panel above belongs to — without it,
                // the form appears detached from any particular venue.
                style={editingId === p.id ? { background: "var(--color-mist)" } : undefined}
              >
                  <td className="px-3 py-2 font-bold text-ink">{p.name}</td>
                  <td className="px-3 py-2">
                    <SubscriptionPill partner={p} />
                  </td>
                  <td className="px-3 py-2">
                    <ActivityCell
                      iso={p.lastOwnerSeenAt}
                      kind="login"
                      extra={
                        p.ownerCount === 0
                          ? "Nincs még fiók ehhez az egységhez"
                          : `${p.ownerCount} fiók`
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ActivityCell iso={p.lastReviewAt} kind="review" />
                  </td>
                  <td className="max-w-[220px] px-3 py-2 text-slate">{p.address ?? "—"}</td>
                  <td className="px-3 py-2 text-slate">{p.contact_name ?? "—"}</td>
                  <td className="px-3 py-2 text-center font-bold text-ink">{p.alert_threshold.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                      <Link href={`/${adminSlug}/venue/${p.id}`} className="font-bold text-violet">
                        Nézet
                      </Link>
                      <Link href={`/${adminSlug}/log?partner=${p.id}`} className="font-bold text-violet">
                        Napló →
                      </Link>
                      <button onClick={() => setQrFor(p)} className="font-semibold text-ink">
                        QR-kód
                      </button>
                      <button onClick={() => setInviteFor(p)} className="font-semibold text-violet">
                        Meghívás
                      </button>
                      <button
                        onClick={() => {
                          setFormError(null);
                          setEditingId(editingId === p.id ? null : p.id);
                        }}
                        className="font-semibold text-ink"
                      >
                        {editingId === p.id ? "Szerkesztés bezárása" : "Szerkesztés"}
                      </button>
                      {confirmDeleteId === p.id ? (
                        <span className="inline-flex flex-col items-end gap-1">
                          <span className="text-[10.5px] font-semibold text-magenta">
                            Az összes eddigi értékelés is véglegesen törlődik. Ez nem vonható vissza.
                          </span>
                          <span className="inline-flex gap-1.5">
                            <button
                              onClick={async () => {
                                const res = await deletePartner(adminSlug, p.id);
                                setFormError(res.error);
                                if (!res.error) setConfirmDeleteId(null);
                              }}
                              className="rounded-md bg-magenta px-2 py-1 font-bold text-white"
                            >
                              Törlés megerősítése
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-line px-2 py-1 text-slate"
                            >
                              Mégsem
                            </button>
                          </span>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(p.id)} className="font-semibold text-slate">
                          Törlés
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate">
                  {partners.length === 0 ? "Nincs még felvett egység." : "Nincs a keresésnek megfelelő egység."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete failures have no form to render into, so they surface here. */}
      {formError && !showAddForm && editingId === null && (
        <p className="mt-3 text-sm font-medium text-magenta">{formError}</p>
      )}

      {qrFor && <QRModal partner={qrFor} siteUrl={siteUrl} onClose={() => setQrFor(null)} />}
      {inviteFor && <InviteOwnerModal adminSlug={adminSlug} partner={inviteFor} onClose={() => setInviteFor(null)} />}
    </div>
  );
}
