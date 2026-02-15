// lib/supabaseHelpers.ts
import { supabase } from "./supabase";

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
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
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
  pollData: {
    end_date: string | null;
    code: string;
    is_active: boolean;
    question: string;
    user_id: string;
    has_time_limit: boolean;
    description: string | null;
    allow_multiple: boolean;
    start_date: string | null;
  },
  options: { text: string }[],
  questions?: QuestionInput[],
): Promise<string | null> => {
  try {
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([pollData])
      .select("id")
      .single();

    if (pollError) throw pollError;

    if (questions && questions.length > 0) {
      // Multi-question mode: create poll_questions with nested options
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        const { data: question, error: qError } = await supabase
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

          const { error: optError } = await supabase
            .from("poll_options")
            .insert(optionsData);

          if (optError) throw optError;
        }
      }
    } else {
      // Legacy single-question mode: create one poll_question + flat options
      const { data: question, error: qError } = await supabase
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

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;
    }

    return poll.id;
  } catch (error) {
    console.error("Error creating poll:", error);
    return null;
  }
};

export const updatePoll = async (
  pollId: string,
  pollData: {
    end_date: string | null;
    is_active: boolean;
    question: string;
    has_time_limit: boolean;
    description: string | null;
    allow_multiple: boolean;
    start_date: string | null;
  },
  options?: { text: string; id?: string }[],
  questions?: (QuestionInput & { id?: string })[],
): Promise<boolean> => {
  try {
    // Update poll data
    const { error: pollError } = await supabase
      .from("polls")
      .update(pollData)
      .eq("id", pollId);

    if (pollError) throw pollError;

    if (questions && questions.length > 0) {
      // Multi-question update: handle question-level CRUD
      const { data: existingQuestions } = await supabase
        .from("poll_questions")
        .select("id")
        .eq("poll_id", pollId)
        .order("question_order");

      const existingIds = new Set((existingQuestions || []).map((q) => q.id));
      const updatedIds = new Set<string>();

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];

        if (q.id && existingIds.has(q.id)) {
          // Update existing question
          updatedIds.add(q.id);
          await supabase
            .from("poll_questions")
            .update({
              question_text: q.question_text,
              question_type: q.question_type || "multiple_choice",
              question_order: qi + 1,
              allow_multiple: q.allow_multiple ?? false,
              settings: q.settings || {},
            })
            .eq("id", q.id);

          // Update options for this question
          await updateQuestionOptions(pollId, q.id, q.options);
        } else {
          // Insert new question
          const { data: newQ, error: qErr } = await supabase
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

            await supabase.from("poll_options").insert(optionsData);
          }
        }
      }

      // Delete removed questions (cascade deletes their options)
      const toDelete = [...existingIds].filter((id) => !updatedIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from("poll_questions").delete().in("id", toDelete);
      }
    } else if (options) {
      // Legacy single-question update
      // Get the first question for this poll
      const { data: existingQ } = await supabase
        .from("poll_questions")
        .select("id")
        .eq("poll_id", pollId)
        .order("question_order")
        .limit(1)
        .single();

      if (existingQ) {
        // Update question text and allow_multiple
        await supabase
          .from("poll_questions")
          .update({
            question_text: pollData.question,
            allow_multiple: pollData.allow_multiple,
          })
          .eq("id", existingQ.id);

        await updateQuestionOptions(pollId, existingQ.id, options);
      } else {
        // No question exists yet (shouldn't happen after migration, but be safe)
        const { data: newQ, error: qErr } = await supabase
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

        await supabase.from("poll_options").insert(optionsData);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating poll:", error);
    return false;
  }
};

async function updateQuestionOptions(
  pollId: string,
  questionId: string,
  options: { text: string; image_url?: string }[],
) {
  const { data: existingOptions } = await supabase
    .from("poll_options")
    .select("*")
    .eq("question_id", questionId)
    .order("option_order");

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const existing = existingOptions?.[i];

    if (existing) {
      await supabase
        .from("poll_options")
        .update({
          text: option.text,
          option_order: i + 1,
          ...(option.image_url !== undefined ? { image_url: option.image_url } : {}),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("poll_options").insert({
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
    await supabase.from("poll_options").delete().in("id", idsToDelete);
  }
}

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
        (poll.votes as unknown as { count: number }[])?.[0]?.count ?? 0;
      const questionCount =
        (poll.poll_questions as unknown as { count: number }[])?.[0]?.count ?? 1;

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
  try {
    // First get current status and owner
    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("is_active, user_id")
      .eq("id", pollId)
      .single();

    if (fetchError) throw fetchError;

    // If activating, check the active poll limit
    if (!poll.is_active) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", poll.user_id)
        .single();

      const tier = profile?.subscription_tier || "free";

      // Import dynamically to avoid circular deps at module level
      const { getFeatureLimit } = await import("@/lib/featureGate");
      const limit = getFeatureLimit(tier as "free" | "pro" | "team", "maxActivePolls");

      if (limit !== -1) {
        const activeCount = await getActivePollCount(poll.user_id);
        if (activeCount >= limit) {
          return {
            success: false,
            error: `You've reached your limit of ${limit} active polls. Upgrade to Pro for unlimited active polls.`,
          };
        }
      }
    }

    // Toggle the status
    const { error: updateError } = await supabase
      .from("polls")
      .update({ is_active: !poll.is_active })
      .eq("id", pollId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error("Error toggling poll status:", error);
    return { success: false, error: "Failed to update poll status" };
  }
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
            options: q.options.map((opt) => ({ text: opt.text })),
          }))
        : [];

    const fallbackOptions = (original.options || []).map((opt) => ({
      text: opt.text,
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
      } catch {
        // skip malformed vote
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
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("polls")
      .update({ embed_settings: embedSettings })
      .eq("id", pollId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating embed settings:", error);
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
