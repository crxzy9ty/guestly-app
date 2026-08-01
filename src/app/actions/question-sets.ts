"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_QUESTION_SET_ID } from "@/lib/constants";

// All writes here are RLS-gated to is_admin() at the database level (see
// supabase/migrations/..._rls_policies_and_grants.sql) — same defense-in-depth
// pattern as partners.ts/content.ts.

// NFD-normalizes then drops combining diacritical marks (U+0300-U+036F) by
// numeric code point rather than a regex literal, to sidestep any risk of
// mangled unicode ranges in source.
function stripDiacritics(input: string) {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x0300 || code > 0x036f) out += ch;
  }
  return out;
}

function slugify(text: string) {
  const base = stripDiacritics(text.toLowerCase().normalize("NFD"))
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return base || `szempont${Math.random().toString(36).slice(2, 6)}`;
}

function revalidateSettings(adminSlug: string) {
  revalidatePath(`/${adminSlug}/settings`);
}

// The button that calls this is labelled "+ Új csoport (alapból indul)" —
// it needs to actually start from the base aspects, not an empty set. An
// empty set silently breaks the guest flow for any venue it gets assigned
// to (the review page shows "nincs beállítva kérdéssor" instead of a form).
export async function createQuestionSet(adminSlug: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const [{ data: newSet }, { data: defaultAspects }] = await Promise.all([
    supabase.from("question_sets").insert({ name: trimmed }).select("id").single(),
    supabase.from("question_aspects").select("key, label, icon, sort_order").eq("question_set_id", DEFAULT_QUESTION_SET_ID).order("sort_order"),
  ]);

  if (newSet && defaultAspects && defaultAspects.length > 0) {
    await supabase.from("question_aspects").insert(defaultAspects.map((a) => ({ ...a, question_set_id: newSet.id })));
  }

  revalidateSettings(adminSlug);
  return newSet?.id as string | undefined;
}

export async function renameQuestionSet(adminSlug: string, questionSetId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "A csoport neve nem lehet üres." };

  const supabase = await createClient();
  const { error } = await supabase.from("question_sets").update({ name: trimmed }).eq("id", questionSetId);
  if (error) return { error: "Nem sikerült átnevezni a csoportot." };

  revalidateSettings(adminSlug);
  return { error: null };
}

// Moves one aspect up or down within its set. Guests see the questions in this
// order, so being unable to change it meant a question added later was stuck at
// the end permanently — the only fix was editing the database by hand.
//
// Renumbers the WHOLE set to 0..n-1 rather than swapping two values. Swapping
// is fewer writes but far harder to reason about here, because existing
// sort_order values are not guaranteed to be unique or gapless: addAspect
// derives them from a COUNT, so deleting an aspect and adding another produces
// duplicates. Renumbering makes the stored order match the displayed order
// exactly, and repairs any such damage as a side effect. A question set holds a
// handful of rows, so the extra writes cost nothing.
export async function moveAspect(adminSlug: string, aspectId: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: aspect } = await supabase
    .from("question_aspects")
    .select("question_set_id")
    .eq("id", aspectId)
    .maybeSingle();

  if (!aspect) return { error: "A kérdés nem található." };

  // (sort_order, id) is the same ordering the guest flow and this manager read
  // with, so duplicates still resolve to one stable, predictable sequence.
  const { data: siblings } = await supabase
    .from("question_aspects")
    .select("id")
    .eq("question_set_id", aspect.question_set_id)
    .order("sort_order")
    .order("id");

  const ordered = (siblings ?? []).map((s) => s.id);
  const index = ordered.indexOf(aspectId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  // Already at the end: nothing to do, and not an error worth showing.
  if (index === -1 || targetIndex < 0 || targetIndex >= ordered.length) {
    return { error: null };
  }

  [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];

  const results = await Promise.all(
    ordered.map((id, position) =>
      supabase.from("question_aspects").update({ sort_order: position }).eq("id", id),
    ),
  );

  if (results.some((r) => r.error)) return { error: "Nem sikerült átrendezni a kérdéseket." };

  revalidateSettings(adminSlug);
  return { error: null };
}

export async function duplicateQuestionSet(adminSlug: string, sourceId: string, newName: string) {
  const supabase = await createClient();
  const { data: sourceAspects } = await supabase
    .from("question_aspects")
    .select("key, label, icon, sort_order")
    .eq("question_set_id", sourceId)
    .order("sort_order");

  const { data: newSet } = await supabase.from("question_sets").insert({ name: newName }).select("id").single();
  if (newSet && sourceAspects && sourceAspects.length > 0) {
    await supabase.from("question_aspects").insert(
      sourceAspects.map((a) => ({ ...a, question_set_id: newSet.id })),
    );
  }
  revalidateSettings(adminSlug);
  return newSet?.id as string | undefined;
}

export async function deleteQuestionSet(adminSlug: string, questionSetId: string) {
  if (questionSetId === DEFAULT_QUESTION_SET_ID) return; // the base set can't be deleted

  const supabase = await createClient();
  await supabase.from("partners").update({ question_set_id: DEFAULT_QUESTION_SET_ID }).eq("question_set_id", questionSetId);
  await supabase.from("question_sets").delete().eq("id", questionSetId);
  revalidateSettings(adminSlug);
}

export async function addAspect(adminSlug: string, questionSetId: string, label: string, icon: string) {
  const trimmed = label.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("question_aspects")
    .select("id", { count: "exact", head: true })
    .eq("question_set_id", questionSetId);

  const baseKey = slugify(trimmed);
  const { error } = await supabase.from("question_aspects").insert({
    question_set_id: questionSetId,
    key: baseKey,
    label: trimmed,
    icon: icon.trim() || "✦",
    sort_order: count ?? 0,
  });

  // 23505 = unique_violation on (question_set_id, key) — two labels that
  // slugify to the same key (e.g. "Kávé minősége" / "Kávé, minősége" both
  // -> "kaveminosege"). Retry once with a disambiguating suffix instead of
  // silently dropping the aspect the admin just tried to add.
  if (error?.code === "23505") {
    await supabase.from("question_aspects").insert({
      question_set_id: questionSetId,
      key: `${baseKey}${Math.random().toString(36).slice(2, 5)}`,
      label: trimmed,
      icon: icon.trim() || "✦",
      sort_order: count ?? 0,
    });
  }

  revalidateSettings(adminSlug);
}

export async function updateAspect(adminSlug: string, aspectId: string, label: string, icon: string) {
  const trimmed = label.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  await supabase.from("question_aspects").update({ label: trimmed, icon: icon.trim() || "✦" }).eq("id", aspectId);
  revalidateSettings(adminSlug);
}

export async function deleteAspect(adminSlug: string, aspectId: string) {
  const supabase = await createClient();
  await supabase.from("question_aspects").delete().eq("id", aspectId);
  revalidateSettings(adminSlug);
}

export async function assignQuestionSet(adminSlug: string, partnerIds: string[], questionSetId: string) {
  if (partnerIds.length === 0) return;
  const supabase = await createClient();
  await supabase.from("partners").update({ question_set_id: questionSetId }).in("id", partnerIds);
  revalidateSettings(adminSlug);
}
