// app/api/demo-polls/vote/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { demo_poll_id, selected_options, voter_fingerprint } = body;

    // Validate required fields
    if (!demo_poll_id || !selected_options || !voter_fingerprint) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!Array.isArray(selected_options) || selected_options.length === 0) {
      return NextResponse.json(
        { error: "Selected options must be a non-empty array" },
        { status: 400 },
      );
    }

    // Check if user has already voted
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
        { status: 400 },
      );
    }

    // Verify the demo poll exists
    const { data: pollExists, error: pollError } = await supabase
      .from("demo_polls")
      .select("id")
      .eq("id", demo_poll_id)
      .eq("is_active", true)
      .limit(1);

    if (pollError) {
      console.error("Error checking poll existence:", pollError);
      return NextResponse.json(
        { error: "Failed to verify poll" },
        { status: 500 },
      );
    }

    if (!pollExists || pollExists.length === 0) {
      return NextResponse.json(
        { error: "Poll not found or inactive" },
        { status: 404 },
      );
    }

    // Insert the vote
    const { data, error: insertError } = await supabase
      .from("demo_votes")
      .insert([
        {
          demo_poll_id,
          selected_options: JSON.stringify(selected_options),
          voter_fingerprint,
          voted_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) {
      console.error("Error inserting vote:", insertError);
      return NextResponse.json(
        { error: "Failed to submit vote" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vote submitted successfully",
      data: data?.[0],
    });
  } catch (error) {
    console.error("Error in demo vote route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
