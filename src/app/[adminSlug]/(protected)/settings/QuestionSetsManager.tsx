"use client";

import { useState } from "react";
import { DEFAULT_QUESTION_SET_ID } from "@/lib/constants";
import {
  createQuestionSet,
  duplicateQuestionSet,
  deleteQuestionSet,
  renameQuestionSet,
  addAspect,
  updateAspect,
  deleteAspect,
  moveAspect,
} from "@/app/actions/question-sets";

export type QuestionSet = { id: string; name: string };
export type Aspect = { id: string; question_set_id: string; key: string; label: string; icon: string | null };

const inputClass = "h-10 rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none";

export function QuestionSetsManager({
  adminSlug,
  questionSets,
  aspects,
}: {
  adminSlug: string;
  questionSets: QuestionSet[];
  aspects: Aspect[];
}) {
  const [activeSetId, setActiveSetId] = useState(questionSets[0]?.id ?? "");
  const [newSetName, setNewSetName] = useState("");
  const [editingAspectId, setEditingAspectId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftIcon, setDraftIcon] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("✦");
  const [confirmRemoveAspect, setConfirmRemoveAspect] = useState<string | null>(null);
  const [confirmRemoveSet, setConfirmRemoveSet] = useState<string | null>(null);
  const [renamingSet, setRenamingSet] = useState(false);
  const [draftSetName, setDraftSetName] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Disables both arrows on every row while a move is in flight. Two overlapping
  // renumbers would interleave their writes and land the list in an order
  // neither click asked for.
  const [isReordering, setIsReordering] = useState(false);

  const activeSet = questionSets.find((s) => s.id === activeSetId) ?? questionSets[0];
  const activeAspects = aspects.filter((a) => a.question_set_id === activeSet?.id);

  const startEdit = (a: Aspect) => {
    setEditingAspectId(a.id);
    setDraftLabel(a.label);
    setDraftIcon(a.icon ?? "✦");
  };

  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-slate">
        Egy kérdéscsoport egy újrafelhasználható kérdéslista, amit a &quot;Hozzárendelés&quot; fülön egy vagy
        több partnerhez rendelhetsz. Az &quot;Alap kérdések&quot; minden új partnernek automatikusan jár.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {questionSets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSetId(s.id)}
            className="rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{
              border: activeSetId === s.id ? "1px solid var(--color-ink)" : "1px solid var(--color-line)",
              background: activeSetId === s.id ? "var(--color-ink)" : "var(--color-paper)",
              color: activeSetId === s.id ? "#fff" : "var(--color-ink)",
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={newSetName}
          onChange={(e) => setNewSetName(e.target.value)}
          placeholder="Új kérdéscsoport neve, pl. Bár-specifikus"
          className={`${inputClass} min-w-[220px] flex-1`}
        />
        <button
          disabled={!newSetName.trim()}
          onClick={async () => {
            const id = await createQuestionSet(adminSlug, newSetName);
            if (id) setActiveSetId(id);
            setNewSetName("");
          }}
          className="h-10 rounded-lg border border-line px-4 text-xs font-bold text-ink disabled:opacity-40"
        >
          + Új csoport (alapból indul)
        </button>
      </div>

      {activeSet && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {renamingSet ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={draftSetName}
                  onChange={(e) => setDraftSetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setRenamingSet(false);
                  }}
                  className={`${inputClass} min-w-[180px] flex-1`}
                />
                <button
                  disabled={!draftSetName.trim()}
                  onClick={async () => {
                    const res = await renameQuestionSet(adminSlug, activeSet.id, draftSetName);
                    setError(res.error);
                    if (!res.error) setRenamingSet(false);
                  }}
                  className="h-10 rounded-lg bg-ink px-4 text-xs font-bold text-white disabled:opacity-40"
                >
                  Mentés
                </button>
                <button
                  onClick={() => setRenamingSet(false)}
                  className="h-10 rounded-lg border border-line px-4 text-xs font-bold text-ink"
                >
                  Mégsem
                </button>
              </div>
            ) : (
              <div className="text-sm font-bold text-ink">{activeSet.name}</div>
            )}
            <div className="flex gap-3">
              {!renamingSet && (
                <button
                  onClick={() => {
                    setDraftSetName(activeSet.name);
                    setError(null);
                    setRenamingSet(true);
                  }}
                  className="text-xs font-bold text-violet"
                >
                  Átnevezés
                </button>
              )}
              <button
                onClick={() => duplicateQuestionSet(adminSlug, activeSet.id, `${activeSet.name} (másolat)`)}
                className="text-xs font-bold text-violet"
              >
                Másolat készítése
              </button>
              {activeSet.id !== DEFAULT_QUESTION_SET_ID &&
                (confirmRemoveSet === activeSet.id ? (
                  <span className="inline-flex gap-1.5">
                    <button
                      onClick={() => {
                        deleteQuestionSet(adminSlug, activeSet.id);
                        setActiveSetId(DEFAULT_QUESTION_SET_ID);
                        setConfirmRemoveSet(null);
                      }}
                      className="rounded-md bg-magenta px-2 py-1 text-[11px] font-bold text-white"
                    >
                      Törlés megerősítése
                    </button>
                    <button
                      onClick={() => setConfirmRemoveSet(null)}
                      className="rounded-md border border-line px-2 py-1 text-[11px] text-slate"
                    >
                      Mégsem
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmRemoveSet(activeSet.id)} className="text-xs font-semibold text-slate">
                    Csoport törlése
                  </button>
                ))}
            </div>
          </div>

          <p className="mb-2.5 text-[11.5px] leading-relaxed text-slate">
            A vendég ebben a sorrendben kapja a kérdéseket. A nyilakkal átrendezheted.
          </p>

          <div className="mb-5 grid gap-2.5">
            {activeAspects.map((a, i) => (
              <div key={a.id} className="rounded-xl border border-line bg-paper p-3.5">
                {editingAspectId === a.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={draftIcon} onChange={(e) => setDraftIcon(e.target.value)} className={`${inputClass} w-[50px] text-center`} />
                    <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} className={`${inputClass} min-w-[160px] flex-1`} />
                    <button
                      onClick={() => {
                        updateAspect(adminSlug, a.id, draftLabel, draftIcon);
                        setEditingAspectId(null);
                      }}
                      className="h-10 rounded-lg bg-ink px-4 text-xs font-bold text-white"
                    >
                      Mentés
                    </button>
                    <button onClick={() => setEditingAspectId(null)} className="h-10 rounded-lg border border-line px-4 text-xs font-bold text-ink">
                      Mégsem
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {/* Arrows sit left of the question so the whole column
                          reads as the running order, and the first/last are
                          disabled rather than hidden — a button that vanishes
                          shifts everything below it as you move through. */}
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          disabled={i === 0 || isReordering}
                          title="Feljebb"
                          onClick={async () => {
                            setIsReordering(true);
                            const res = await moveAspect(adminSlug, a.id, "up");
                            setError(res.error);
                            setIsReordering(false);
                          }}
                          className="h-5 w-5 rounded border border-line text-[10px] leading-none text-ink disabled:opacity-25"
                        >
                          ▲
                        </button>
                        <button
                          disabled={i === activeAspects.length - 1 || isReordering}
                          title="Lejjebb"
                          onClick={async () => {
                            setIsReordering(true);
                            const res = await moveAspect(adminSlug, a.id, "down");
                            setError(res.error);
                            setIsReordering(false);
                          }}
                          className="h-5 w-5 rounded border border-line text-[10px] leading-none text-ink disabled:opacity-25"
                        >
                          ▼
                        </button>
                      </div>
                      <span className="text-lg">{a.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-ink">
                          <span className="mr-1.5 text-[11px] font-normal text-slate">{i + 1}.</span>
                          {a.label}
                        </div>
                        <div className="font-mono text-[10.5px] text-slate">{a.key}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button onClick={() => startEdit(a)} className="text-xs font-bold text-violet">
                        Szerkesztés
                      </button>
                      {confirmRemoveAspect === a.id ? (
                        <span className="inline-flex flex-col items-end gap-1">
                          <span className="text-[10.5px] text-slate">
                            A korábbi értékelések megmaradnak, de erre a szempontra nem lesznek láthatók.
                          </span>
                          <span className="inline-flex gap-1.5">
                            <button
                              onClick={() => {
                                deleteAspect(adminSlug, a.id);
                                setConfirmRemoveAspect(null);
                              }}
                              className="rounded-md bg-magenta px-2 py-1 text-[11px] font-bold text-white"
                            >
                              Törlés megerősítése
                            </button>
                            <button onClick={() => setConfirmRemoveAspect(null)} className="rounded-md border border-line px-2 py-1 text-[11px] text-slate">
                              Mégsem
                            </button>
                          </span>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmRemoveAspect(a.id)} className="text-xs font-semibold text-slate">
                          Törlés
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {activeAspects.length === 0 && (
              <div className="rounded-xl border border-line bg-paper p-5 text-center text-sm text-slate">
                Ebben a csoportban nincs kérdés — a hozzárendelt partnerek nem tudnak értékelést leadni, amíg
                nincs legalább egy.
              </div>
            )}
          </div>

          {error && <p className="mb-4 text-sm font-medium text-magenta">{error}</p>}

          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="mb-3 text-sm font-bold text-ink">Kérdés hozzáadása ehhez a csoporthoz</div>
            <div className="flex flex-wrap gap-2">
              <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="✦" className={`${inputClass} w-[60px] text-center`} />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Pl. Parkolás"
                className={`${inputClass} min-w-[180px] flex-1`}
              />
              <button
                disabled={!newLabel.trim()}
                onClick={() => {
                  addAspect(adminSlug, activeSet.id, newLabel, newIcon);
                  setNewLabel("");
                  setNewIcon("✦");
                }}
                className="h-10 rounded-lg bg-ink px-5 text-xs font-bold text-white disabled:opacity-40"
              >
                Hozzáadás
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
