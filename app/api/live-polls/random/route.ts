// app/api/live-polls/random/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

export async function GET(request: Request) {
  // Rate limit: 20 req/min per IP
  const ip = getIPFromRequest(request);
  const { success: allowed, remaining } = rateLimit(`random:${ip}`, {
    maxTokens: 20,
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

    // Get all active demo polls and randomly select one
    const { data: polls, error } = await supabase
      .from("demo_polls")
      .select("id, question, description, options, category")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      console.error("Error fetching demo polls:", error);
      return NextResponse.json(
        { error: "Failed to fetch demo polls" },
        { status: 500 },
      );
    }

    if (!polls || polls.length === 0) {
      return NextResponse.json(
        { error: "No demo polls available" },
        { status: 404 },
      );
    }

    // Randomly select a poll
    const randomIndex = Math.floor(Math.random() * polls.length);
    const selectedPoll = polls[randomIndex];

    return NextResponse.json(selectedPoll);
  } catch (error) {
    console.error("Error in demo poll random route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
