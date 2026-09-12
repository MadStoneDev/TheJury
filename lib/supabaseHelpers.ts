// lib/supabaseHelpers.ts
import { supabase } from "./supabase";
import {
  createPollWithClient,
  updatePollWithClient,
  togglePollStatusWithClient,
  updateEmbedSettingsWithClient,
  type CreatePollData,
  type UpdatePollData,
} from "./pollWrites";

/**
 * Safely extract the first `count` value from a Supabase aggregate embed
 * (e.g. `votes(count)` returns `[{ count: N }]` or sometimes an object).
 */
function extractCount(input: unknown): number | null {
  if (Array.isArray(input)) {
    const first = input[0];
    if (first && typeof first === "object" && "count" in first) {
      const c = (first as { count: unknown }).count;
      return typeof c === "number" ? c : null;
    }
    return null;
  }
  if (input && typeof input === "object" && "count" in input) {
    const c = (input as { count: unknown }).count;
    return typeof c === "number" ? c : null;
  }
  return null;
}

// Types
export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  stripe_customer_id?: string;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_id?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  text: string;
  option_order: number;
  question_id?: string;
  image_url?: string;
}

export interface PollQuestion {
  id: string;
  poll_id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  allow_multiple: boolean;
  settings: Record<string, unknown>;
  created_at?: string;
  options: PollOption[];
}

export interface Poll {
  id: string;
  code: string;
  user_id: string;
  question: string;
  description?: string;
  allow_multiple: boolean;
  is_active: boolean;
  has_time_limit: boolean;
  show_results_to_voters?: boolean;
  password_hash?: string | null;
  embed_settings?: Record<string, unknown> | null;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  live_mode?: boolean;
  live_state?: string;
  live_current_question?: number;
  options?: PollOption[];
  questions?: PollQuestion[];
  total_votes?: number;
  question_count?: number;
}

export interface Vote {
  id: string;
  poll_id: string;
  options: string[];
  user_id?: string;
  voter_ip?: string;
  voter_fingerprint?: string;
  created_at: string;
}

export interface PollResult {
  option_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

export interface RatingDistribution {
  average: number;
  distribution: Record<number, number>;
  totalRatings: number;
  min: number;
  max: number;
}

export interface RankedOptionResult {
  option_id: string;
  option_text: string;
  avg_position: number;
  first_place_count: number;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  results: PollResult[];
  ratingData?: RatingDistribution;
  rankedData?: RankedOptionResult[];
  openEndedData?: { responses: string[]; totalResponses: number };
}

export interface QuestionInput {
  question_text: string;
  question_type?: string;
  allow_multiple?: boolean;
  settings?: Record<string, unknown>;
  options: { text: string; image_url?: string }[];
}

// =====================================================
// PROFILE FUNCTIONS
// =====================================================

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      console.error("updateProfile: No rows updated (check RLS policies)");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    return false;
  }
};

export const checkUsernameAvailable = async (
  username: string,
  excludeUserId?: string,
): Promise<boolean> => {
  try {
    let query = supabase.from("profiles").select("id").eq("username", username);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.length === 0;
  } catch (error) {
    console.error("Error checking username availability:", error);
    return false;
  }
};

// =====================================================
// POLL FUNCTIONS
// =====================================================

export const checkPollCodeExists = async (code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("polls")
      .select("id")
      .eq("code", code)
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error("Error checking poll code:", error);
    return true; // Assume it exists to be safe
  }
};

export const createPoll = async (
  pollData: CreatePollData,
  options: { text: string }[],
  questions?: QuestionInput[],
): Promise<string | null> =>
  createPollWithClient(supabase, pollData, options, questions);

export const updatePoll = async (
  pollId: string,
  pollData: UpdatePollData,
  options?: { text: string; id?: string }[],
  questions?: (QuestionInput & { id?: string })[],
): Promise<boolean> =>
  updatePollWithClient(supabase, pollId, pollData, options, questions);

export const getPollByCode = async (code: string): Promise<Poll | null> => {
  try {
    const { data, error } = await supabase
      .from("polls")
      .select(
        `
        *,
        options:poll_options(
          id,
          text,
          option_order,
          question_id
        )
      `,
      )
      .eq("code", code)
      .single();

    if (error) throw error;

    // Sort options by order
    if (data.options) {
      data.options.sort(
        (a: { option_order: number }, b: { option_order: number }) =>
          a.option_order - b.option_order,
      );
    }

    // Fetch questions with nested options
    const questions = await getPollQuestions(data.id);
    data.questions = questions;

    return data;
  } catch (error) {
    console.error("Error fetching poll by code:", error);
    return null;
  }
};

export const getPollById = async (id: string): Promise<Poll | null> => {
  try {
    const { data, error } = await supabase
      .from("polls")
      .select(
        `
        *,
        options:poll_options(
          id,
          text,
          option_order,
          question_id
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Sort options by order
    if (data.options) {
      data.options.sort(
        (a: { option_order: number }, b: { option_order: number }) =>
          a.option_order - b.option_order,
      );
    }

    // Fetch questions with nested options
    const questions = await getPollQuestions(data.id);
    data.questions = questions;

    return data;
  } catch (error) {
    console.error("Error fetching poll by ID:", error);
    return null;
  }
};

export const getPollQuestions = async (
  pollId: string,
): Promise<PollQuestion[]> => {
  try {
    const { data: questions, error } = await supabase
      .from("poll_questions")
      .select(
        `
        id,
        poll_id,
        question_text,
        question_type,
        question_order,
        allow_multiple,
        settings,
        created_at
      `,
      )
      .eq("poll_id", pollId)
      .order("question_order");

    if (error) throw error;
    if (!questions || questions.length === 0) return [];

    // Fetch all options for this poll's questions in one query
    const questionIds = questions.map((q) => q.id);
    const { data: allOptions, error: optError } = await supabase
      .from("poll_options")
      .select("id, text, option_order, question_id")
      .in("question_id", questionIds)
      .order("option_order");

    if (optError) throw optError;

    // Group options by question_id
    const optionsByQuestion: Record<string, PollOption[]> = {};
    (allOptions || []).forEach((opt) => {
      const qid = opt.question_id as string;
      if (!optionsByQuestion[qid]) optionsByQuestion[qid] = [];
      optionsByQuestion[qid].push(opt);
    });

    return questions.map((q) => ({
      ...q,
      settings: (q.settings as Record<string, unknown>) || {},
      options: optionsByQuestion[q.id] || [],
    }));
  } catch (error) {
    console.error("Error fetching poll questions:", error);
    return [];
  }
};

export const getUserPolls = async (userId: string): Promise<Poll[]> => {
  try {
    const { data, error } = await supabase
      .from("polls")
      .select(
        `
        *,
        options:poll_options(
          id,
          text,
          option_order
        ),
        votes(count),
        poll_questions(count)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((poll) => {
      if (poll.options) {
        poll.options.sort(
          (a: { option_order: number }, b: { option_order: number }) =>
            a.option_order - b.option_order,
        );
      }

      const totalVotes =
        extractCount(poll.votes) ?? 0;
      const questionCount =
        extractCount(poll.poll_questions) ?? 1;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { votes: _votes, poll_questions: _pq, ...rest } = poll;
      return {
        ...rest,
        total_votes: totalVotes,
        question_count: questionCount,
      };
    });
  } catch (error) {
    console.error("Error fetching user polls:", error);
    return [];
  }
};

export const deletePoll = async (pollId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("polls").delete().eq("id", pollId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting poll:", error);
    return false;
  }
};

export const togglePollStatus = async (
  pollId: string,
): Promise<{ success: boolean; error?: string }> => {
  const result = await togglePollStatusWithClient(supabase, pollId);
  return { success: result.success, error: result.error };
};

export const getActivePollCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error counting active polls:", error);
    return 0;
  }
};

export const duplicatePoll = async (
  pollId: string,
  userId: string,
): Promise<string | null> => {
  try {
    const original = await getPollById(pollId);
    if (!original) return null;

    // Authorization: user must own the poll, OR (if it's a team poll) be a team member.
    if (original.user_id !== userId) {
      const originalRow = await supabase
        .from("polls")
        .select("team_id")
        .eq("id", pollId)
        .single();
      const teamId = (originalRow.data as { team_id: string | null } | null)?.team_id;
      if (!teamId) return null;

      const { data: membership } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!membership) return null;
    }

    // Generate new code (dynamic import to avoid circular deps)
    const { generateUniquePollCode } = await import(
      "@/utils/pollCodeGenerator"
    );
    const newCode = await generateUniquePollCode();

    const pollData = {
      code: newCode,
      user_id: userId,
      question: original.question + " (Copy)",
      description: original.description || null,
      allow_multiple: original.allow_multiple,
      is_active: false,
      has_time_limit: false,
      start_date: null,
      end_date: null,
    };

    // Build questions array from the original's questions
    const questionsInput: QuestionInput[] =
      original.questions && original.questions.length > 0
        ? original.questions.map((q) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            allow_multiple: q.allow_multiple,
            settings: q.settings,
            options: q.options.map((opt) => ({
              text: opt.text,
              ...(opt.image_url ? { image_url: opt.image_url } : {}),
            })),
          }))
        : [];

    const fallbackOptions = (original.options || []).map((opt) => ({
      text: opt.text,
      ...(opt.image_url ? { image_url: opt.image_url } : {}),
    }));

    const newPollId = await createPoll(
      pollData,
      fallbackOptions,
      questionsInput.length > 0 ? questionsInput : undefined,
    );
    if (!newPollId) return null;

    return newCode;
  } catch (error) {
    console.error("Error duplicating poll:", error);
    return null;
  }
};

// =====================================================
// VOTING FUNCTIONS
// =====================================================

export const submitVote = async (
  pollId: string,
  optionIds: string[],
  userId?: string,
  voterIP?: string,
  voterFingerprint?: string,
  answers?: Record<string, unknown>,
): Promise<boolean> => {
  try {
    // Check if poll allows multiple votes
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("allow_multiple, is_active, has_time_limit, start_date, end_date")
      .eq("id", pollId)
      .single();

    if (pollError) throw pollError;

    if (!poll.is_active) {
      throw new Error("Poll is not active");
    }

    // Check time limits
    if (poll.has_time_limit) {
      const now = new Date();
      if (poll.start_date && new Date(poll.start_date) > now) {
        throw new Error("Voting has not started yet");
      }
      if (poll.end_date && new Date(poll.end_date) < now) {
        throw new Error("Voting has ended");
      }
    }

    // For single-question polls, enforce single-choice if not allow_multiple
    // Multi-question polls have per-question allow_multiple (validated client-side)
    const { count: questionCount } = await supabase
      .from("poll_questions")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId);

    if ((questionCount || 1) <= 1 && !poll.allow_multiple && optionIds.length > 1) {
      throw new Error("This poll only allows single selection");
    }

    // Submit new vote (let database handle duplicate detection)
    const votes = {
      poll_id: pollId,
      options: optionIds,
      user_id: userId || null,
      voter_ip: voterIP || null,
      voter_fingerprint: voterFingerprint || null,
      answers: answers || {},
    };

    const { error: voteError } = await supabase.from("votes").insert(votes);

    if (voteError) {
      // Check if it's a duplicate key error
      if (
        voteError.code === "23505" &&
        voteError.message.includes("duplicate key")
      ) {
        throw new Error("You have already voted in this poll");
      }
      throw voteError;
    }

    return true;
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error; // Re-throw so the component can handle the specific error message
  }
};

export const getPollResultsByQuestion = async (
  pollId: string,
): Promise<QuestionResult[]> => {
  try {
    const questions = await getPollQuestions(pollId);
    if (questions.length === 0) {
      // Fallback: return flat results as a single question
      const flatResults = await getPollResults(pollId);
      return [
        {
          question_id: "",
          question_text: "",
          question_type: "multiple_choice",
          question_order: 1,
          results: flatResults,
        },
      ];
    }

    // Get all votes (including answers for rating_scale, ranked_choice)
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("options, answers")
      .eq("poll_id", pollId);

    if (votesError) throw votesError;

    // Build a set of all voted option IDs
    const voteCounts: Record<string, number> = {};
    (votes || []).forEach((vote) => {
      try {
        const selected = Array.isArray(vote.options)
          ? vote.options
          : JSON.parse((vote.options as string) || "[]");
        selected.forEach((optionId: string) => {
          voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
        });
      } catch (err) {
        console.error(
          "[supabaseHelpers] Malformed vote.options (poll",
          pollId,
          "):",
          err,
          "raw:",
          vote.options,
        );
      }
    });

    // Build per-question results based on question type
    const questionResults: QuestionResult[] = [];

    for (const q of questions) {
      const base: QuestionResult = {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        question_order: q.question_order,
        results: q.options.map((opt) => ({
          option_id: opt.id,
          option_text: opt.text,
          option_order: opt.option_order,
          vote_count: voteCounts[opt.id] || 0,
        })),
      };

      if (q.question_type === "rating_scale") {
        // Compute rating distribution from votes.answers
        const settings = (q.settings || {}) as { min?: number; max?: number };
        const min = settings.min ?? 1;
        const max = settings.max ?? 5;
        const distribution: Record<number, number> = {};
        for (let i = min; i <= max; i++) distribution[i] = 0;

        let totalRatings = 0;
        let sum = 0;

        (votes || []).forEach((vote) => {
          try {
            const ans = vote.answers as Record<string, { type?: string; value?: number }> | null;
            if (ans && ans[q.id] && typeof ans[q.id].value === "number") {
              const val = ans[q.id].value!;
              if (val >= min && val <= max) {
                distribution[val] = (distribution[val] || 0) + 1;
                totalRatings++;
                sum += val;
              }
            }
          } catch { /* skip */ }
        });

        base.ratingData = {
          average: totalRatings > 0 ? sum / totalRatings : 0,
          distribution,
          totalRatings,
          min,
          max,
        };
      } else if (q.question_type === "ranked_choice") {
        // Compute average position and first-place counts
        const positionSums: Record<string, { total: number; count: number; firstPlace: number }> = {};
        q.options.forEach((opt) => {
          positionSums[opt.id] = { total: 0, count: 0, firstPlace: 0 };
        });

        (votes || []).forEach((vote) => {
          try {
            const ans = vote.answers as Record<string, { type?: string; rankings?: string[] }> | null;
            if (ans && ans[q.id] && Array.isArray(ans[q.id].rankings)) {
              const rankings = ans[q.id].rankings!;
              rankings.forEach((optId, idx) => {
                if (positionSums[optId]) {
                  positionSums[optId].total += idx + 1;
                  positionSums[optId].count++;
                  if (idx === 0) positionSums[optId].firstPlace++;
                }
              });
            }
          } catch { /* skip */ }
        });

        base.rankedData = q.options
          .map((opt) => ({
            option_id: opt.id,
            option_text: opt.text,
            avg_position: positionSums[opt.id]?.count > 0
              ? positionSums[opt.id].total / positionSums[opt.id].count
              : q.options.length,
            first_place_count: positionSums[opt.id]?.firstPlace || 0,
          }))
          .sort((a, b) => a.avg_position - b.avg_position);
      } else if (q.question_type === "open_ended") {
        // Fetch text responses from poll_responses table
        const { data: responses } = await supabase
          .from("poll_responses")
          .select("response_text")
          .eq("question_id", q.id)
          .order("created_at", { ascending: false })
          .limit(100);

        base.openEndedData = {
          responses: (responses || []).map((r) => r.response_text),
          totalResponses: (responses || []).length,
        };
      }

      questionResults.push(base);
    }

    return questionResults;
  } catch (error) {
    console.error("Error fetching poll results by question:", error);
    return [];
  }
};

export const getPollResults = async (pollId: string): Promise<PollResult[]> => {
  try {
    // Get poll options first
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("id, text, option_order")
      .eq("poll_id", pollId)
      .order("option_order");

    if (optionsError) throw optionsError;

    // Get all votes for this poll
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("options")
      .eq("poll_id", pollId);

    if (votesError) throw votesError;

    // Initialize vote counts
    const voteCounts: Record<string, number> = {};
    options?.forEach((option) => {
      voteCounts[option.id] = 0;
    });

    // Count votes for each option
    votes?.forEach((vote) => {
      try {
        const selectedOptions = Array.isArray(vote.options)
          ? vote.options
          : JSON.parse((vote.options as string) || "[]");

        selectedOptions.forEach((optionId: string) => {
          if (voteCounts.hasOwnProperty(optionId)) {
            voteCounts[optionId]++;
          }
        });
      } catch (parseError) {
        console.error("Error parsing vote options:", parseError);
      }
    });

    // Format results
    const results: PollResult[] =
      options?.map((option) => ({
        option_id: option.id,
        option_text: option.text,
        option_order: option.option_order,
        vote_count: voteCounts[option.id] || 0,
      })) || [];

    return results;
  } catch (error) {
    console.error("Error fetching poll results:", error);
    return [];
  }
};

export const hasUserVoted = async (
  pollId: string,
  userId?: string,
  voterFingerprint?: string,
): Promise<boolean> => {
  try {
    let query = supabase.from("votes").select("id").eq("poll_id", pollId);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (voterFingerprint) {
      query = query.eq("voter_fingerprint", voterFingerprint);
    } else {
      return false;
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error("Error checking if user voted:", error);
    return false;
  }
};

export const getUserVotes = async (
  pollId: string,
  userId?: string,
  voterFingerprint?: string,
): Promise<string[]> => {
  try {
    let query = supabase.from("votes").select("options").eq("poll_id", pollId);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (voterFingerprint) {
      query = query.eq("voter_fingerprint", voterFingerprint);
    } else {
      return [];
    }

    const { data, error } = await query.single();

    if (error) {
      // If no vote found, return empty array instead of throwing
      if (error.code === "PGRST116") {
        // No rows returned
        return [];
      }
      throw error;
    }

    return data?.options || [];
  } catch (error) {
    console.error("Error fetching user votes:", error);
    return [];
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
  return !error;
};


// Generate browser fingerprint (for anonymous voting)
// Generate browser fingerprint (for anonymous voting)
export const generateFingerprint = (): string => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      // Server-side fallback - generate a random string
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      // Canvas context not available, fallback to random
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    }

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Browser fingerprint", 2, 2);

    const fingerprint = [
      navigator.userAgent || "unknown",
      navigator.language || "unknown",
      (screen.width || 0) + "x" + (screen.height || 0),
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString();
  } catch (error) {
    console.error("Error generating fingerprint:", error);
    // Fallback to random string on any error
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
};

// ─── Embed Settings ──────────────────────────────────────────

export const updateEmbedSettings = async (
  pollId: string,
  embedSettings: Record<string, unknown>,
): Promise<boolean> =>
  updateEmbedSettingsWithClient(supabase, pollId, embedSettings);

export const updatePollLiveState = async (
  pollId: string,
  updates: {
    live_mode?: boolean;
    live_state?: string;
    live_current_question?: number;
    is_active?: boolean;
  },
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("polls")
      .update(updates)
      .eq("id", pollId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating poll live state:", error);
    return false;
  }
};

// ─── A/B Testing ─────────────────────────────────────────────

export interface ABExperiment {
  id: string;
  poll_id: string;
  name: string;
  is_active: boolean;
}

export interface ABVariantData {
  id: string;
  experiment_id: string;
  name: string;
  question_text: string;
  weight: number;
}

/**
 * Create an A/B experiment for a poll with variants.
 */
export async function createABExperiment(
  pollId: string,
  name: string,
  variants: { name: string; questionText: string; weight: number }[],
): Promise<string | null> {
  const { data: experiment, error: expError } = await supabase
    .from("ab_experiments")
    .insert({ poll_id: pollId, name })
    .select("id")
    .single();

  if (expError || !experiment) {
    console.error("Error creating AB experiment:", expError);
    return null;
  }

  const variantRows = variants.map((v) => ({
    experiment_id: experiment.id,
    name: v.name,
    question_text: v.questionText,
    weight: v.weight,
  }));

  const { error: varError } = await supabase
    .from("poll_variants")
    .insert(variantRows);

  if (varError) {
    console.error("Error creating variants:", varError);
    return null;
  }

  return experiment.id;
}

/**
 * Get the A/B experiment and its variants for a poll.
 */
export async function getABExperiment(
  pollId: string,
): Promise<{ experiment: ABExperiment; variants: ABVariantData[] } | null> {
  const { data: experiment } = await supabase
    .from("ab_experiments")
    .select("*")
    .eq("poll_id", pollId)
    .eq("is_active", true)
    .single();

  if (!experiment) return null;

  const { data: variants } = await supabase
    .from("poll_variants")
    .select("*")
    .eq("experiment_id", experiment.id)
    .order("created_at", { ascending: true });

  return {
    experiment,
    variants: variants || [],
  };
}

/**
 * Assign a variant to a user/fingerprint using weighted random selection.
 * Returns the assigned variant, or existing assignment if already assigned.
 */
export async function assignVariant(
  experimentId: string,
  variants: ABVariantData[],
  userId?: string,
  fingerprint?: string,
): Promise<ABVariantData | null> {
  if (variants.length === 0) return null;

  // Check existing assignment
  let query = supabase
    .from("user_variant_assignments")
    .select("variant_id")
    .eq("experiment_id", experimentId);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (fingerprint) {
    query = query.eq("voter_fingerprint", fingerprint);
  } else {
    return null;
  }

  const { data: existing } = await query.single();

  if (existing) {
    return variants.find((v) => v.id === existing.variant_id) || variants[0];
  }

  // Weighted random assignment
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = variants[0];

  for (const v of variants) {
    random -= v.weight;
    if (random <= 0) {
      selected = v;
      break;
    }
  }

  // Record assignment
  await supabase.from("user_variant_assignments").insert({
    experiment_id: experimentId,
    variant_id: selected.id,
    user_id: userId || null,
    voter_fingerprint: fingerprint || null,
  });

  return selected;
}
