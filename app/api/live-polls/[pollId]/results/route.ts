// app/api/live-polls/[pollId]/results/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeJsonParse } from "@/lib/jsonUtils";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";
import { uuidSchema } from "@/lib/validations";

interface DemoPollOption {
  id: string;
  text: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> },
) {
  // Rate limit: 30 req/min per IP
  const ip = getIPFromRequest(request);
  const { success: allowed, remaining } = rateLimit(`results:${ip}`, {
    maxTokens: 30,
    interval: 60,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  try {
    const supabase = await createClient();
    const { pollId } = await params;

    // Validate pollId is UUID
    const pollIdParsed = uuidSchema.safeParse(pollId);
    if (!pollIdParsed.success) {
      return NextResponse.json(
        { error: "Invalid poll ID format" },
        { status: 400 },
      );
    }

    // Get the poll and its options
    const { data: poll, error: pollError } = await supabase
      .from("demo_polls")
      .select("id, question, options")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      console.error("Error fetching poll:", pollError);
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Parse options with safe parsing
    const options: DemoPollOption[] = safeJsonParse(poll.options, []);

    if (options.length === 0) {
      console.error("No valid options found for poll:", pollId);
      return NextResponse.json(
        { error: "Invalid poll options format" },
        { status: 500 },
      );
    }

    // Get all votes for this poll
    const { data: votes, error: votesError } = await supabase
      .from("demo_votes")
      .select("selected_options")
      .eq("demo_poll_id", pollId);

    if (votesError) {
      console.error("Error fetching votes:", votesError);
      return NextResponse.json(
        { error: "Failed to fetch votes" },
        { status: 500 },
      );
    }

    // Initialize vote counts
    const voteCounts: Record<string, number> = {};
    options.forEach((option) => {
      voteCounts[option.id] = 0;
    });

    // Count votes for each option with safe parsing
    votes?.forEach((vote) => {
      const selectedOptions: string[] = safeJsonParse(
        vote.selected_options,
        [],
      );

      selectedOptions.forEach((optionId: string) => {
        if (voteCounts.hasOwnProperty(optionId)) {
          voteCounts[optionId]++;
        }
      });
    });

    // Format results
    const results = options.map((option) => ({
      option_id: option.id,
      option_text: option.text,
      vote_count: voteCounts[option.id] || 0,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in demo poll results route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
