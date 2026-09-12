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

    // Prefer gaming/community polls so the hero demo suits our audience;
    // fall back to the full set if none are seeded yet.
    const onBrand = polls.filter(
      (p) => p.category === "gaming" || p.category === "community",
    );
    const pool = onBrand.length > 0 ? onBrand : polls;

    // Randomly select a poll
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedPoll = pool[randomIndex];

    return NextResponse.json(selectedPoll);
  } catch (error) {
    console.error("Error in demo poll random route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
