"use client";

import { useMemo, useState, useTransition } from "react";
import { assignQuestionSet } from "@/app/actions/question-sets";
import type { QuestionSet } from "./QuestionSetsManager";

type Partner = { id: string; name: string; question_set_id: string | null };

const selectClass = "h-9 rounded-lg border border-line bg-paper px-2.5 text-xs text-ink";

export function PartnerAssignment({
  adminSlug,
  questionSets,
  partners,
}: {
  adminSlug: string;
  questionSets: QuestionSet[];
  partners: Partner[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkSetId, setBulkSetId] = useState(questionSets[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [filterSetId, setFilterSetId] = useState("all");
  const [isPending, startTransition] = useTransition();

  const visiblePartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      const currentSetId = p.question_set_id ?? questionSets[0]?.id;
      if (filterSetId !== "all" && currentSetId !== filterSetId) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [partners, search, filterSetId, questionSets]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  const visibleIds = visiblePartners.map((p) => p.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected((prev) =>
      allVisibleSelected ? prev.filter((id) => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])],
    );

  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-slate">
        Válassz ki egy vagy több partnert, majd rendelj hozzájuk egy kérdéscsoportot — egyesével is, vagy
        csoportosan.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés egység neve szerint…"
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none"
        />
        <select value={filterSetId} onChange={(e) => setFilterSetId(e.target.value)} className={selectClass}>
          <option value="all">Minden kérdéscsoport</option>
          {questionSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {(search.trim() || filterSetId !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setFilterSetId("all");
            }}
            className="h-9 rounded-lg border border-line px-3.5 text-xs font-bold text-ink"
          >
            Szűrők törlése
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-paper p-3.5">
        <span className="text-xs font-bold text-ink">{selected.length} partner kijelölve</span>
        <select value={bulkSetId} onChange={(e) => setBulkSetId(e.target.value)} className={selectClass}>
          {questionSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          disabled={selected.length === 0 || isPending}
          onClick={() =>
            startTransition(async () => {
              await assignQuestionSet(adminSlug, selected, bulkSetId);
              setSelected([]);
            })
          }
          className="h-9 rounded-lg bg-ink px-4 text-xs font-bold text-white disabled:opacity-40"
        >
          Csoport hozzárendelése a kijelöltekhez
        </button>
      </div>

      <div className="mb-2 text-[11.5px] text-slate">{visiblePartners.length} egység a szűrésnek megfelelően</div>

      <div className="max-h-[65vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[480px] border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 bg-mist text-left">
              <th className="px-3 py-2">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2 font-bold text-slate">Egység</th>
              <th className="px-3 py-2 font-bold text-slate">Jelenlegi kérdéscsoport</th>
              <th className="px-3 py-2 font-bold text-slate">Gyors váltás</th>
            </tr>
          </thead>
          <tbody>
            {visiblePartners.map((p) => {
              const currentSetId = p.question_set_id ?? questionSets[0]?.id;
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td className="px-3 py-2 font-bold text-ink">{p.name}</td>
                  <td className="px-3 py-2 text-ink">{questionSets.find((s) => s.id === currentSetId)?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      value={currentSetId}
                      onChange={(e) => startTransition(() => assignQuestionSet(adminSlug, [p.id], e.target.value))}
                      className={selectClass}
                    >
                      {questionSets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {visiblePartners.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate">
                  {partners.length === 0 ? "Nincs még felvett egység." : "Nincs a szűrésnek megfelelő egység."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
