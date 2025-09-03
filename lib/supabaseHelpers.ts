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
    const { data, error } = await supabase.rpc("poll_code_exists", {
      poll_code: code,
    });

    if (error) throw error;
    return data;
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
  options?: { text: string }[],
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
      // Delete existing options
      const { error: deleteError } = await supabase
        .from("poll_options")
        .delete()
        .eq("poll_id", pollId);

      if (deleteError) throw deleteError;

      // Insert new options
      const optionsData = options.map((option, index) => ({
        poll_id: pollId,
        text: option.text,
        option_order: index + 1,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;
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
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Sort options and add vote counts
    return await Promise.all(
      data.map(async (poll) => {
        if (poll.options) {
          poll.options.sort(
            (a: { option_order: number }, b: { option_order: number }) =>
              a.option_order - b.option_order,
          );
        }

        // Get total votes for this poll
        const { count } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", poll.id);

        return {
          ...poll,
          total_votes: count || 0,
        };
      }),
    );
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

    // Check if user has already voted
    let hasVoted = false;

    if (userId) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("user_id", userId)
        .single();

      hasVoted = !!existingVote;
    } else if (voterIP && voterFingerprint) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("voter_ip", voterIP)
        .eq("voter_fingerprint", voterFingerprint)
        .single();

      hasVoted = !!existingVote;
    }

    if (hasVoted) {
      // Delete existing votes for this user/poll
      if (userId) {
        await supabase
          .from("votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("voter_ip", voterIP)
          .eq("voter_fingerprint", voterFingerprint);
      }
    }

    // Submit new votes
    const votes = {
      poll_id: pollId,
      options: optionIds,
      user_id: userId || null,
      voter_ip: voterIP || null,
      voter_fingerprint: voterFingerprint || null,
    };

    const { error: voteError } = await supabase.from("votes").insert(votes);

    if (voteError) throw voteError;
    return true;
  } catch (error) {
    console.error("Error submitting vote:", error);
    return false;
  }
};

export const getPollResults = async (pollId: string): Promise<PollResult[]> => {
  try {
    const { data, error } = await supabase.rpc("get_poll_results", {
      poll_uuid: pollId,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching poll results:", error);
    return [];
  }
};

export const hasUserVoted = async (
  pollId: string,
  userId?: string,
  voterIP?: string,
  voterFingerprint?: string,
): Promise<boolean> => {
  try {
    let query = supabase.from("votes").select("id").eq("poll_id", pollId);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (voterIP && voterFingerprint) {
      query = query
        .eq("voter_ip", voterIP)
        .eq("voter_fingerprint", voterFingerprint);
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
  voterIP?: string,
  voterFingerprint?: string,
): Promise<string[]> => {
  try {
    let query = supabase.from("votes").select("options").eq("poll_id", pollId);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (voterIP && voterFingerprint) {
      query = query
        .eq("voter_ip", voterIP)
        .eq("voter_fingerprint", voterFingerprint);
    } else {
      return [];
    }

    const { data, error } = await query.single();

    if (error) throw error;
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

// Get client IP (for anonymous voting)
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error getting client IP:", error);
    return "unknown";
  }
};

// Generate browser fingerprint (for anonymous voting)
export const generateFingerprint = (): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx!.textBaseline = "top";
  ctx!.font = "14px Arial";
  ctx!.fillText("Browser fingerprint", 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
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
};
