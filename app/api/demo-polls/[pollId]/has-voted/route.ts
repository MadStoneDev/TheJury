// app/api/demo-polls/[pollId]/has-voted/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> },
) {
  try {
    const supabase = await createClient();
    const { pollId } = await params; // Await the params Promise
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get("fingerprint");

    if (!fingerprint) {
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
