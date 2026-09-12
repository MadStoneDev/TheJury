"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createPollWithClient,
  updatePollWithClient,
  togglePollStatusWithClient,
  updateEmbedSettingsWithClient,
} from "@/lib/pollWrites";
import {
  validatePollWriteForTier,
  canSaveEmbedTheme,
  canExportCsv,
} from "@/lib/tierEnforcement";
import { buildResultsCsv, buildQuestionResultsCsv } from "@/lib/exportUtils";
import type { TierName } from "@/lib/stripe";
import type {
  QuestionInput,
  PollResult,
  QuestionResult,
} from "@/lib/supabaseHelpers";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActionOk<T = undefined> {
  ok: true;
  data?: T;
}
export interface ActionErr {
  ok: false;
  error: string;
}
export type ActionResult<T = undefined> = ActionOk<T> | ActionErr;

async function getUserAndTier(supabase: SupabaseClient): Promise<
  | { userId: string; tier: TierName }
  | null
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier as TierName) || "free";
  return { userId: user.id, tier };
}

/** Server-side unique poll code generator (uses the server client). */
async function generateUniqueCode(supabase: SupabaseClient): Promise<string> {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const make = (len: number) => {
    let r = "";
    for (let i = 0; i < len; i++)
      r += chars.charAt(Math.floor(Math.random() * chars.length));
    return r;
  };
  for (const len of [8, 8, 8, 9, 9, 10, 10]) {
    const code = make(len);
    const { data } = await supabase
      .from("polls")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Unable to generate unique poll code");
}

export interface CreatePollInput {
  question: string;
  description: string | null;
  allow_multiple: boolean;
  is_active: boolean;
  has_time_limit: boolean;
  start_date: string | null;
  end_date: string | null;
  password_hash: string | null;
  questions: QuestionInput[];
  fallbackOptions: { text: string }[];
}

export async function createPollAction(
  input: CreatePollInput,
): Promise<ActionResult<{ pollId: string; code: string }>> {
  const supabase = await createClient();
  const auth = await getUserAndTier(supabase);
  if (!auth) return { ok: false, error: "You must be signed in." };

  const tierError = validatePollWriteForTier(auth.tier, {
    questions: input.questions,
    start_date: input.start_date,
    end_date: input.end_date,
    password_hash: input.password_hash,
  });
  if (tierError) return { ok: false, error: tierError };

  const code = await generateUniqueCode(supabase);

  const pollId = await createPollWithClient(
    supabase,
    {
      code,
      user_id: auth.userId,
      question: input.question,
      description: input.description,
      allow_multiple: input.allow_multiple,
      is_active: input.is_active,
      has_time_limit: input.has_time_limit,
      start_date: input.start_date,
      end_date: input.end_date,
      password_hash: input.password_hash,
    },
    input.fallbackOptions,
    input.questions,
  );

  if (!pollId) return { ok: false, error: "Failed to create poll." };
  return { ok: true, data: { pollId, code } };
}

export interface UpdatePollInput {
  question: string;
  description: string | null;
  allow_multiple: boolean;
  is_active: boolean;
  has_time_limit: boolean;
  start_date: string | null;
  end_date: string | null;
  password_hash: string | null;
  questions: (QuestionInput & { id?: string })[];
}

async function assertOwner(
  supabase: SupabaseClient,
  pollId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();
  return data?.user_id === userId;
}

export async function updatePollAction(
  pollId: string,
  input: UpdatePollInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const auth = await getUserAndTier(supabase);
  if (!auth) return { ok: false, error: "You must be signed in." };

  if (!(await assertOwner(supabase, pollId, auth.userId))) {
    return { ok: false, error: "You don't have permission to edit this poll." };
  }

  const tierError = validatePollWriteForTier(auth.tier, {
    questions: input.questions,
    start_date: input.start_date,
    end_date: input.end_date,
    password_hash: input.password_hash,
  });
  if (tierError) return { ok: false, error: tierError };

  const ok = await updatePollWithClient(
    supabase,
    pollId,
    {
      question: input.question,
      description: input.description,
      allow_multiple: input.allow_multiple,
      is_active: input.is_active,
      has_time_limit: input.has_time_limit,
      start_date: input.start_date,
      end_date: input.end_date,
      password_hash: input.password_hash,
    },
    undefined,
    input.questions,
  );

  if (!ok) return { ok: false, error: "Failed to update poll." };
  return { ok: true };
}

export async function togglePollStatusAction(
  pollId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  const supabase = await createClient();
  const auth = await getUserAndTier(supabase);
  if (!auth) return { ok: false, error: "You must be signed in." };

  if (!(await assertOwner(supabase, pollId, auth.userId))) {
    return { ok: false, error: "You don't have permission to change this poll." };
  }

  const result = await togglePollStatusWithClient(supabase, pollId);
  if (!result.success) {
    return { ok: false, error: result.error || "Failed to update poll." };
  }
  return { ok: true, data: { isActive: result.isActive ?? false } };
}

export async function updateEmbedSettingsAction(
  pollId: string,
  settings: Record<string, unknown>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const auth = await getUserAndTier(supabase);
  if (!auth) return { ok: false, error: "You must be signed in." };

  if (!canSaveEmbedTheme(auth.tier)) {
    return {
      ok: false,
      error: "Custom embed themes are a Pro feature. Upgrade to customise.",
    };
  }

  if (!(await assertOwner(supabase, pollId, auth.userId))) {
    return { ok: false, error: "You don't have permission to edit this poll." };
  }

  const ok = await updateEmbedSettingsWithClient(supabase, pollId, settings);
  if (!ok) return { ok: false, error: "Failed to save embed theme." };
  return { ok: true };
}

export interface ExportCsvInput {
  pollId: string;
  pollCode: string;
  pollTitle: string;
  totalVoters: number;
  isMultiQuestion: boolean;
  results?: PollResult[];
  questionResults?: QuestionResult[];
}

/**
 * Produce the CSV server-side, gated by tier. The bytes are only returned to
 * Pro users, so CSV export is genuinely server-enforced rather than a UI hint.
 */
export async function exportPollCsvAction(
  input: ExportCsvInput,
): Promise<ActionResult<{ csv: string; filename: string }>> {
  const supabase = await createClient();
  const auth = await getUserAndTier(supabase);
  if (!auth) return { ok: false, error: "You must be signed in." };

  if (!canExportCsv(auth.tier)) {
    return {
      ok: false,
      error: "CSV export is a Pro feature. Upgrade to export your results.",
    };
  }

  if (!(await assertOwner(supabase, input.pollId, auth.userId))) {
    return { ok: false, error: "You don't have permission to export this poll." };
  }

  const csv =
    input.isMultiQuestion && input.questionResults
      ? buildQuestionResultsCsv(
          input.pollTitle,
          input.pollCode,
          input.questionResults,
          input.totalVoters,
        )
      : buildResultsCsv(
          input.pollTitle,
          input.pollCode,
          input.results ?? [],
          input.totalVoters,
        );

  const date = new Date().toISOString().split("T")[0];
  return {
    ok: true,
    data: { csv, filename: `poll-results-${input.pollCode}-${date}.csv` },
  };
}
