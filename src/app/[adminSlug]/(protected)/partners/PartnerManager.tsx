"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createPartner, updatePartner, deletePartner } from "@/app/actions/partners";
import { QRModal } from "./QRModal";
import { InviteOwnerModal } from "./InviteOwnerModal";
import { downloadCsv } from "@/lib/csv";

export type Partner = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  alert_threshold: number;
};

const inputClass = "h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none";
const labelClass = "mb-1 block text-xs font-bold text-ink";

function PartnerFields({ defaults }: { defaults?: Partial<Partner> }) {
  return (
    <div className="grid gap-2.5">
      <div>
        <label className={labelClass}>Egység neve</label>
        <input name="name" defaultValue={defaults?.name ?? ""} required placeholder="Kávézó Aroma" className={inputClass} />
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
    </div>
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

  const boundCreate = createPartner.bind(null, adminSlug);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) =>
      [p.name, p.address, p.email, p.contact_name, p.phone].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [partners, search]);

  const exportCsv = () => {
    downloadCsv(
      `guestly-partnerek-${new Date().toISOString().slice(0, 10)}.csv`,
      ["nev", "cim", "telefon", "email", "kapcsolattarto", "kapcsolattarto_telefon", "riasztasi_kuszob"],
      filtered.map((p) => [p.name, p.address, p.phone, p.email, p.contact_name, p.contact_phone, p.alert_threshold]),
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
              await boundCreate(formData);
              setShowAddForm(false);
            }}
            className="mt-3.5"
          >
            <PartnerFields />
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
        <button onClick={exportCsv} className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink">
          Exportálás (CSV)
        </button>
        <div className="text-xs text-slate">{filtered.length} találat</div>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 bg-mist text-left">
              <th className="px-3 py-2 font-bold text-slate">Név</th>
              <th className="px-3 py-2 font-bold text-slate">Cím</th>
              <th className="px-3 py-2 font-bold text-slate">Kapcsolattartó</th>
              <th className="px-3 py-2 text-center font-bold text-slate">Riasztási küszöb</th>
              <th className="px-3 py-2 font-bold text-slate"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="border-t border-line">
                  <td colSpan={5} className="px-3 py-3">
                    <form
                      action={async (formData) => {
                        await updatePartner(adminSlug, p.id, formData);
                        setEditingId(null);
                      }}
                    >
                      <PartnerFields defaults={p} />
                      <div className="mt-3 flex gap-2">
                        <button type="submit" className="h-9 rounded-lg bg-ink px-4 text-xs font-bold text-white">
                          Mentés
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-9 rounded-lg border border-line px-4 text-xs font-bold text-ink"
                        >
                          Mégsem
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-ink">{p.name}</td>
                  <td className="max-w-[220px] px-3 py-2 text-slate">{p.address ?? "—"}</td>
                  <td className="px-3 py-2 text-slate">{p.contact_name ?? "—"}</td>
                  <td className="px-3 py-2 text-center font-bold text-ink">{p.alert_threshold.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                      <Link href={`/${adminSlug}/log?partner=${p.id}`} className="font-bold text-violet">
                        Napló →
                      </Link>
                      <button onClick={() => setQrFor(p)} className="font-semibold text-ink">
                        QR-kód
                      </button>
                      <button onClick={() => setInviteFor(p)} className="font-semibold text-violet">
                        Meghívás
                      </button>
                      <button onClick={() => setEditingId(p.id)} className="font-semibold text-ink">
                        Szerkesztés
                      </button>
                      {confirmDeleteId === p.id ? (
                        <span className="inline-flex gap-1.5">
                          <button
                            onClick={async () => {
                              await deletePartner(adminSlug, p.id);
                              setConfirmDeleteId(null);
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
                      ) : (
                        <button onClick={() => setConfirmDeleteId(p.id)} className="font-semibold text-slate">
                          Törlés
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ),
            )}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate">
                  {partners.length === 0 ? "Nincs még felvett egység." : "Nincs a keresésnek megfelelő egység."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {qrFor && <QRModal partner={qrFor} siteUrl={siteUrl} onClose={() => setQrFor(null)} />}
      {inviteFor && <InviteOwnerModal adminSlug={adminSlug} partner={inviteFor} onClose={() => setInviteFor(null)} />}
    </div>
  );
}
