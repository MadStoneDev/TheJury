// lib/supabaseHelpers.ts
import { supabase } from "./supabase";

// Types
export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  text: string;
  option_order: number;
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
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  options?: PollOption[];
  total_votes?: number;
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
): Promise<string | null> => {
  try {
    // Start a transaction
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([pollData])
      .select("id")
      .single();

    if (pollError) throw pollError;

    // Insert options
    const optionsData = options.map((option, index) => ({
      poll_id: poll.id,
      text: option.text,
      option_order: index + 1,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsData);

    if (optionsError) throw optionsError;

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
): Promise<boolean> => {
  try {
    // Update poll data
    const { error: pollError } = await supabase
      .from("polls")
      .update(pollData)
      .eq("id", pollId);

    if (pollError) throw pollError;

    // Update options if provided
    if (options) {
      // Get existing options
      const { data: existingOptions } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", pollId);

      // Update/insert options while preserving IDs where possible
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const existingOption = existingOptions?.[i];

        if (existingOption) {
          // Update existing option (preserves ID)
          await supabase
            .from("poll_options")
            .update({
              text: option.text,
              option_order: i + 1,
            })
            .eq("id", existingOption.id);
        } else {
          // Insert new option
          await supabase.from("poll_options").insert({
            poll_id: pollId,
            text: option.text,
            option_order: i + 1,
          });
        }
      }

      // Delete any extra options if the new list is shorter
      if (existingOptions && existingOptions.length > options.length) {
        const idsToDelete = existingOptions
          .slice(options.length)
          .map((opt) => opt.id);

        await supabase.from("poll_options").delete().in("id", idsToDelete);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating poll:", error);
    return false;
  }
};

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
          option_order
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
          option_order
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

    return data;
  } catch (error) {
    console.error("Error fetching poll by ID:", error);
    return null;
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
        votes(count)
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { votes: _votes, ...rest } = poll;
      return {
        ...rest,
        total_votes: totalVotes,
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

export const togglePollStatus = async (pollId: string): Promise<boolean> => {
  try {
    // First get current status
    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("is_active")
      .eq("id", pollId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the status
    const { error: updateError } = await supabase
      .from("polls")
      .update({ is_active: !poll.is_active })
      .eq("id", pollId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error toggling poll status:", error);
    return false;
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

    const options = (original.options || []).map((opt) => ({ text: opt.text }));

    const newPollId = await createPoll(pollData, options);
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

    // If single choice poll, only allow one option
    if (!poll.allow_multiple && optionIds.length > 1) {
      throw new Error("This poll only allows single selection");
    }

    // Submit new vote (let database handle duplicate detection)
    const votes = {
      poll_id: pollId,
      options: optionIds,
      user_id: userId || null,
      voter_ip: voterIP || null,
      voter_fingerprint: voterFingerprint || null,
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
