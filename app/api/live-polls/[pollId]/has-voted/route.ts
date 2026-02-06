// app/api/live-polls/[pollId]/has-voted/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";
import { uuidSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> },
) {
  // Rate limit: 30 req/min per IP
  const ip = getIPFromRequest(request);
  const { success: allowed, remaining } = rateLimit(`has-voted:${ip}`, {
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

    // Validate pollId
    const pollIdParsed = uuidSchema.safeParse(pollId);
    if (!pollIdParsed.success) {
      return NextResponse.json({ hasVoted: false });
    }

    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get("fingerprint");

    if (!fingerprint || fingerprint.length > 500) {
      return NextResponse.json({ hasVoted: false });
    }

    // Check if this fingerprint has voted on this demo poll
    const { data, error } = await supabase
      .from("demo_votes")
      .select("id")
      .eq("demo_poll_id", pollId)
      .eq("voter_fingerprint", fingerprint)
      .limit(1);

    if (error) {
      console.error("Error checking demo vote status:", error);
      return NextResponse.json({ hasVoted: false });
    }

    return NextResponse.json({ hasVoted: data.length > 0 });
  } catch (error) {
    console.error("Error in has-voted route:", error);
    return NextResponse.json({ hasVoted: false });
  }
}
