import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateApiKey } from "@/lib/apiAuth";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> },
) {
  try {
    const { pollId } = await params;

    const ip = getIPFromRequest(request);
    const { success: allowed } = rateLimit(`api-v1-poll-detail:${ip}`, {
      maxTokens: 30,
      interval: 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const auth = await validateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 },
      );
    }

    if (!auth.scopes.includes("polls:read")) {
      return NextResponse.json(
        { error: "Insufficient scope. Required: polls:read" },
        { status: 403 },
      );
    }

    const supabase = await createClient();

    // Fetch the poll, ensuring it belongs to the authenticated user
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(
        `
        id,
        code,
        question,
        description,
        is_active,
        allow_multiple,
        has_time_limit,
        start_date,
        end_date,
        created_at,
        updated_at
      `,
      )
      .eq("id", pollId)
      .eq("user_id", auth.userId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 },
      );
    }

    // Fetch options grouped by question
    const { data: options, error: optError } = await supabase
      .from("poll_options")
      .select("id, text, option_order, question_id")
      .eq("poll_id", pollId)
      .order("option_order");

    if (optError) {
      console.error("[API v1] Error fetching options:", optError);
      return NextResponse.json(
        { error: "Failed to fetch poll options" },
        { status: 500 },
      );
    }

    // Fetch votes and count per option
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("options")
      .eq("poll_id", pollId);

    if (votesError) {
      console.error("[API v1] Error fetching votes:", votesError);
      return NextResponse.json(
        { error: "Failed to fetch votes" },
        { status: 500 },
      );
    }

    // Count votes per option
    const voteCounts: Record<string, number> = {};
    (options || []).forEach((opt) => {
      voteCounts[opt.id] = 0;
    });

    (votes || []).forEach((vote) => {
      try {
        const selected = Array.isArray(vote.options)
          ? vote.options
          : JSON.parse((vote.options as string) || "[]");
        selected.forEach((optionId: string) => {
          if (optionId in voteCounts) {
            voteCounts[optionId]++;
          }
        });
      } catch {
        // skip malformed vote
      }
    });

    const totalVotes = votes?.length ?? 0;

    const results = (options || []).map((opt) => ({
      option_id: opt.id,
      option_text: opt.text,
      option_order: opt.option_order,
      vote_count: voteCounts[opt.id] || 0,
    }));

    return NextResponse.json({
      data: {
        ...poll,
        total_votes: totalVotes,
        results,
      },
    });
  } catch (err) {
    console.error("[API v1] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
