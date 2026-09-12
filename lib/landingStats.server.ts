import { createClient } from "@/lib/supabase/server";
import type { LandingStats } from "@/lib/landingStats";

// Only surface social-proof numbers once they're meaningful. Below this the
// stats are hidden entirely rather than showing embarrassingly small figures.
const MIN_POLLS = 25;
const MIN_VOTES = 50;

/**
 * Real poll/vote counts for the landing page, fetched server-side.
 * Falls back to hidden (show:false) if the tables can't be read or the
 * numbers are too small to be useful. Never throws.
 */
export async function getLandingStats(): Promise<LandingStats> {
  try {
    const supabase = await createClient();
    const [pollsRes, votesRes] = await Promise.all([
      supabase.from("polls").select("*", { count: "exact", head: true }),
      supabase.from("votes").select("*", { count: "exact", head: true }),
    ]);

    const pollCount = pollsRes.count ?? 0;
    const voteCount = votesRes.count ?? 0;
    const readable = !pollsRes.error && !votesRes.error;

    return {
      pollCount,
      voteCount,
      show: readable && pollCount >= MIN_POLLS && voteCount >= MIN_VOTES,
    };
  } catch {
    return { pollCount: 0, voteCount: 0, show: false };
  }
}
