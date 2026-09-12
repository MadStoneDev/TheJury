// Client-agnostic poll write logic.
//
// These functions take a Supabase client so they can run with either the
// browser client (via lib/supabaseHelpers, used by duplicatePoll etc.) or the
// server client (via the poll server actions in app/actions/polls.ts). This
// module must NOT instantiate any Supabase client at import time so it is safe
// to import from both client and server code.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionInput } from "./supabaseHelpers";

// Loosely-typed client — these tables aren't in the generated Database generic
// used elsewhere, and the query shapes are validated at runtime.
type DB = SupabaseClient;

export interface CreatePollData {
  end_date: string | null;
  code: string;
  is_active: boolean;
  question: string;
  user_id: string;
  has_time_limit: boolean;
  description: string | null;
  allow_multiple: boolean;
  start_date: string | null;
  password_hash?: string | null;
}

export interface UpdatePollData {
  end_date: string | null;
  is_active: boolean;
  question: string;
  has_time_limit: boolean;
  description: string | null;
  allow_multiple: boolean;
  start_date: string | null;
  password_hash?: string | null;
}

export const createPollWithClient = async (
  db: DB,
  pollData: CreatePollData,
  options: { text: string }[],
  questions?: QuestionInput[],
): Promise<string | null> => {
  let createdPollId: string | null = null;
  try {
    const { data: poll, error: pollError } = await db
      .from("polls")
      .insert([pollData])
      .select("id")
      .single();

    if (pollError) throw pollError;
    createdPollId = poll.id;

    if (questions && questions.length > 0) {
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        const { data: question, error: qError } = await db
          .from("poll_questions")
          .insert({
            poll_id: poll.id,
            question_text: q.question_text,
            question_type: q.question_type || "multiple_choice",
            question_order: qi + 1,
            allow_multiple: q.allow_multiple ?? false,
            settings: q.settings || {},
          })
          .select("id")
          .single();

        if (qError) throw qError;

        if (q.options.length > 0) {
          const optionsData = q.options.map((opt, oi) => ({
            poll_id: poll.id,
            question_id: question.id,
            text: opt.text,
            option_order: oi + 1,
            ...(opt.image_url ? { image_url: opt.image_url } : {}),
          }));

          const { error: optError } = await db
            .from("poll_options")
            .insert(optionsData);

          if (optError) throw optError;
        }
      }
    } else {
      const { data: question, error: qError } = await db
        .from("poll_questions")
        .insert({
          poll_id: poll.id,
          question_text: pollData.question,
          question_type: "multiple_choice",
          question_order: 1,
          allow_multiple: pollData.allow_multiple,
        })
        .select("id")
        .single();

      if (qError) throw qError;

      const optionsData = options.map((option, index) => ({
        poll_id: poll.id,
        question_id: question.id,
        text: option.text,
        option_order: index + 1,
      }));

      const { error: optionsError } = await db
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;
    }

    return poll.id;
  } catch (error) {
    console.error("Error creating poll:", error);
    // Best-effort rollback so partial/orphaned rows don't accumulate.
    if (createdPollId) {
      const { error: rollbackErr } = await db
        .from("polls")
        .delete()
        .eq("id", createdPollId);
      if (rollbackErr) {
        console.error(
          "Error rolling back partial poll creation:",
          createdPollId,
          rollbackErr,
        );
      }
    }
    return null;
  }
};

export const updatePollWithClient = async (
  db: DB,
  pollId: string,
  pollData: UpdatePollData,
  options?: { text: string; id?: string }[],
  questions?: (QuestionInput & { id?: string })[],
): Promise<boolean> => {
  try {
    const { error: pollError } = await db
      .from("polls")
      .update(pollData)
      .eq("id", pollId);

    if (pollError) throw pollError;

    if (questions && questions.length > 0) {
      const { data: existingQuestions } = await db
        .from("poll_questions")
        .select("id")
        .eq("poll_id", pollId)
        .order("question_order");

      const existingIds = new Set((existingQuestions || []).map((q) => q.id));
      const updatedIds = new Set<string>();

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];

        if (q.id && existingIds.has(q.id)) {
          updatedIds.add(q.id);
          await db
            .from("poll_questions")
            .update({
              question_text: q.question_text,
              question_type: q.question_type || "multiple_choice",
              question_order: qi + 1,
              allow_multiple: q.allow_multiple ?? false,
              settings: q.settings || {},
            })
            .eq("id", q.id);

          await updateQuestionOptions(db, pollId, q.id, q.options);
        } else {
          const { data: newQ, error: qErr } = await db
            .from("poll_questions")
            .insert({
              poll_id: pollId,
              question_text: q.question_text,
              question_type: q.question_type || "multiple_choice",
              question_order: qi + 1,
              allow_multiple: q.allow_multiple ?? false,
              settings: q.settings || {},
            })
            .select("id")
            .single();

          if (qErr) throw qErr;

          if (q.options.length > 0) {
            const optionsData = q.options.map((opt, oi) => ({
              poll_id: pollId,
              question_id: newQ.id,
              text: opt.text,
              option_order: oi + 1,
              ...(opt.image_url ? { image_url: opt.image_url } : {}),
            }));

            await db.from("poll_options").insert(optionsData);
          }
        }
      }

      const toDelete = [...existingIds].filter((id) => !updatedIds.has(id));
      if (toDelete.length > 0) {
        await db.from("poll_questions").delete().in("id", toDelete);
      }
    } else if (options) {
      const { data: existingQ } = await db
        .from("poll_questions")
        .select("id")
        .eq("poll_id", pollId)
        .order("question_order")
        .limit(1)
        .single();

      if (existingQ) {
        await db
          .from("poll_questions")
          .update({
            question_text: pollData.question,
            allow_multiple: pollData.allow_multiple,
          })
          .eq("id", existingQ.id);

        await updateQuestionOptions(db, pollId, existingQ.id, options);
      } else {
        const { data: newQ, error: qErr } = await db
          .from("poll_questions")
          .insert({
            poll_id: pollId,
            question_text: pollData.question,
            question_type: "multiple_choice",
            question_order: 1,
            allow_multiple: pollData.allow_multiple,
          })
          .select("id")
          .single();

        if (qErr) throw qErr;

        const optionsData = options.map((opt, i) => ({
          poll_id: pollId,
          question_id: newQ.id,
          text: opt.text,
          option_order: i + 1,
        }));

        await db.from("poll_options").insert(optionsData);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating poll:", error);
    return false;
  }
};

async function updateQuestionOptions(
  db: DB,
  pollId: string,
  questionId: string,
  options: { text: string; image_url?: string }[],
) {
  const { data: existingOptions } = await db
    .from("poll_options")
    .select("*")
    .eq("question_id", questionId)
    .order("option_order");

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const existing = existingOptions?.[i];

    if (existing) {
      await db
        .from("poll_options")
        .update({
          text: option.text,
          option_order: i + 1,
          ...(option.image_url !== undefined ? { image_url: option.image_url } : {}),
        })
        .eq("id", existing.id);
    } else {
      await db.from("poll_options").insert({
        poll_id: pollId,
        question_id: questionId,
        text: option.text,
        option_order: i + 1,
        ...(option.image_url ? { image_url: option.image_url } : {}),
      });
    }
  }

  if (existingOptions && existingOptions.length > options.length) {
    const idsToDelete = existingOptions
      .slice(options.length)
      .map((opt) => opt.id);
    await db.from("poll_options").delete().in("id", idsToDelete);
  }
}

/** Toggle a poll's active flag. Ownership must be checked by the caller. */
export const togglePollStatusWithClient = async (
  db: DB,
  pollId: string,
): Promise<{ success: boolean; isActive?: boolean; error?: string }> => {
  try {
    const { data: poll, error: fetchError } = await db
      .from("polls")
      .select("is_active")
      .eq("id", pollId)
      .single();

    if (fetchError) throw fetchError;

    const next = !poll.is_active;
    const { error: updateError } = await db
      .from("polls")
      .update({ is_active: next })
      .eq("id", pollId);

    if (updateError) throw updateError;
    return { success: true, isActive: next };
  } catch (error) {
    console.error("Error toggling poll status:", error);
    return { success: false, error: "Failed to update poll status" };
  }
};

// ─── Embed settings ──────────────────────────────────────────

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_FONT_FAMILIES = new Set([
  "Outfit",
  "Inter",
  "DM Sans",
  "Roboto",
  "System Default",
]);

export function sanitizeEmbedSettings(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const colorKeys = ["primaryColor", "backgroundColor", "textColor"] as const;
  for (const key of colorKeys) {
    const v = raw[key];
    if (typeof v === "string" && HEX_COLOR_RE.test(v)) {
      out[key] = v;
    }
  }
  if (
    typeof raw.borderRadius === "number" &&
    Number.isFinite(raw.borderRadius) &&
    raw.borderRadius >= 0 &&
    raw.borderRadius <= 64
  ) {
    out.borderRadius = raw.borderRadius;
  }
  if (
    typeof raw.fontFamily === "string" &&
    ALLOWED_FONT_FAMILIES.has(raw.fontFamily)
  ) {
    out.fontFamily = raw.fontFamily;
  }
  return out;
}

export const updateEmbedSettingsWithClient = async (
  db: DB,
  pollId: string,
  embedSettings: Record<string, unknown>,
): Promise<boolean> => {
  try {
    const sanitized = sanitizeEmbedSettings(embedSettings);
    const { error } = await db
      .from("polls")
      .update({ embed_settings: sanitized })
      .eq("id", pollId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating embed settings:", error);
    return false;
  }
};
