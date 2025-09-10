// app/api/demo-polls/vote/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { demo_poll_id, selected_options, voter_fingerprint } = body;

    // Validate input
    if (!demo_poll_id || !selected_options || !voter_fingerprint) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!Array.isArray(selected_options) || selected_options.length === 0) {
      return NextResponse.json(
        { error: "Invalid selected options" },
        { status: 400 },
      );
    }

    // Check if already voted
    const { data: existingVote, error: checkError } = await supabase
      .from("demo_votes")
      .select("id")
      .eq("demo_poll_id", demo_poll_id)
      .eq("voter_fingerprint", voter_fingerprint)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing vote:", checkError);
      return NextResponse.json(
        { error: "Failed to check vote status" },
        { status: 500 },
      );
    }

    if (existingVote && existingVote.length > 0) {
      return NextResponse.json(
        { error: "You have already voted on this poll" },
        { status: 409 },
      );
    }

    // Verify demo poll exists and is active
    const { data: demoPoll, error: pollError } = await supabase
      .from("demo_polls")
      .select("id, is_active")
      .eq("id", demo_poll_id)
      .single();

    if (pollError || !demoPoll) {
      return NextResponse.json(
        { error: "Demo poll not found" },
        { status: 404 },
      );
    }

    if (!demoPoll.is_active) {
      return NextResponse.json(
        { error: "This demo poll is not active" },
        { status: 400 },
      );
    }

    // Insert the vote
    const { error: voteError } = await supabase.from("demo_votes").insert({
      demo_poll_id,
      selected_options: JSON.stringify(selected_options),
      voter_fingerprint,
      voted_at: new Date().toISOString(),
    });

    if (voteError) {
      console.error("Error inserting demo vote:", voteError);

      // Check for duplicate key error
      if (voteError.code === "23505") {
        return NextResponse.json(
          { error: "You have already voted on this poll" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to submit vote" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in demo vote route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
