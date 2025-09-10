// app/api/demo-polls/[pollId]/results/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> },
) {
  try {
    const supabase = await createClient();
    const { pollId } = await params; // Await the params Promise

    console.log("Fetching results for poll:", pollId);

    // First check if the poll exists
    const { data: pollExists, error: pollError } = await supabase
      .from("demo_polls")
      .select("id, question, options")
      .eq("id", pollId)
      .limit(1);

    if (pollError) {
      console.error("Error checking poll existence:", pollError);
      return NextResponse.json(
        { error: "Failed to verify poll" },
        { status: 500 },
      );
    }

    if (!pollExists || pollExists.length === 0) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Try to use the RPC function first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_demo_poll_results",
        {
          poll_uuid: pollId,
        },
      );

      if (!rpcError && rpcData) {
        console.log("RPC results:", rpcData);
        return NextResponse.json(rpcData);
      }

      console.log("RPC failed or returned no data:", rpcError);
    } catch (rpcError) {
      console.log(
        "RPC function failed, falling back to manual query:",
        rpcError,
      );
    }

    // Fallback: Manual aggregation if RPC fails
    const poll = pollExists[0];
    let options = [];

    try {
      options = Array.isArray(poll.options)
        ? poll.options
        : JSON.parse((poll.options as string) || "[]");
    } catch (parseError) {
      console.error("Error parsing poll options:", parseError);
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

    // Count votes for each option
    const voteCounts: Record<string, number> = {};

    // Initialize all options with 0 votes
    options.forEach((option: { id: string; text: string }) => {
      voteCounts[option.id] = 0;
    });

    // Count actual votes
    votes?.forEach((vote) => {
      try {
        const selectedOptions = Array.isArray(vote.selected_options)
          ? vote.selected_options
          : JSON.parse((vote.selected_options as string) || "[]");

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
    const results = options.map((option: { id: string; text: string }) => ({
      option_id: option.id,
      option_text: option.text,
      vote_count: voteCounts[option.id] || 0,
    }));

    console.log("Manual aggregation results:", results);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in demo poll results route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
