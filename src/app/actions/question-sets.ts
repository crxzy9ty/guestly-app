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

export async function createQuestionSet(adminSlug: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  const { data } = await supabase.from("question_sets").insert({ name: trimmed }).select("id").single();
  revalidateSettings(adminSlug);
  return data?.id as string | undefined;
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

  await supabase.from("question_aspects").insert({
    question_set_id: questionSetId,
    key: slugify(trimmed),
    label: trimmed,
    icon: icon.trim() || "✦",
    sort_order: count ?? 0,
  });
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
