// Server-side tier enforcement for poll writes.
//
// This is the authoritative check: the poll server actions run it with the
// user's real tier (loaded from the DB) before writing, so a Free user cannot
// bypass the UI to create Pro-only polls. Keep the messages user-facing — the
// UI surfaces the returned string directly.

import { canUseFeature, getFeatureLimit, type Feature } from "./featureGate";
import { getQuestionType } from "./questionTypes";
import type { TierName } from "./stripe";

export interface PollWriteCheck {
  questions: { question_type?: string }[];
  start_date: string | null;
  end_date: string | null;
  password_hash?: string | null;
}

/**
 * Returns a user-facing error string if the write violates the tier's limits,
 * or null if it's allowed.
 */
export function validatePollWriteForTier(
  tier: TierName,
  input: PollWriteCheck,
): string | null {
  // Questions per poll
  const maxQuestions = getFeatureLimit(tier, "maxQuestionsPerPoll");
  if (maxQuestions !== -1 && input.questions.length > maxQuestions) {
    return `Your plan allows up to ${maxQuestions} question${
      maxQuestions === 1 ? "" : "s"
    } per poll. Upgrade to Pro for unlimited questions.`;
  }

  // Question types
  for (const q of input.questions) {
    const def = getQuestionType(q.question_type ?? "multiple_choice");
    if (def?.featureKey && !canUseFeature(tier, def.featureKey as Feature)) {
      return `The "${def.label}" question type is a Pro feature. Upgrade to use it.`;
    }
  }

  // Scheduling
  if (
    (input.start_date || input.end_date) &&
    !canUseFeature(tier, "scheduling")
  ) {
    return "Poll scheduling is a Pro feature. Upgrade to schedule your polls.";
  }

  // Password protection
  if (input.password_hash && !canUseFeature(tier, "passwordProtect")) {
    return "Password protection is a Pro feature. Upgrade to protect your polls.";
  }

  return null;
}

/** Whether the tier may save a custom embed theme. */
export function canSaveEmbedTheme(tier: TierName): boolean {
  return canUseFeature(tier, "customEmbedThemes");
}

/** Whether the tier may export results as CSV. */
export function canExportCsv(tier: TierName): boolean {
  return canUseFeature(tier, "csvExport");
}
