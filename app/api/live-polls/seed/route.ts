// app/api/live-polls/seed/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isAuthorized(request: Request): boolean {
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;

  // Check Authorization header only (never accept secrets via query params)
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // The hero (app/api/live-polls/random) prefers category "organisation".
    // For a plausible starting distribution and monthly reset, prefer the SQL
    // seed (supabase/seed_demo_polls.sql); this route just ensures the poll row
    // exists.
    const additionalPolls = [
      {
        question: "How does your organisation run votes today?",
        description: "A live demo. Have a go, then see how everyone answered.",
        options: [
          { id: "1", text: "Show of hands" },
          { id: "2", text: "Paper ballots" },
          { id: "3", text: "Email replies" },
          { id: "4", text: "Google Forms or similar" },
          { id: "5", text: "Something else" },
        ],
        category: "organisation",
        display_order: 1,
      },
    ];

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const poll of additionalPolls) {
      try {
        const { data: existing } = await supabase
          .from("demo_polls")
          .select("id")
          .eq("question", poll.question)
          .single();

        if (existing) {
          skippedCount++;
          continue;
        }

        const { error: insertError } = await supabase
          .from("demo_polls")
          .insert({
            question: poll.question,
            description: poll.description,
            options: JSON.stringify(poll.options),
            category: poll.category,
            display_order: poll.display_order,
            is_active: true,
          });

        if (insertError) {
          if (insertError.code === "23505") {
            skippedCount++;
          } else {
            errorCount++;
            console.error("[seed] Insert error:", insertError);
          }
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error("[seed] Unexpected error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      inserted: successCount,
      skipped: skippedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Error in seed route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("demo_polls")
      .select("id, question, category, is_active, created_at")
      .order("display_order");

    if (error) {
      console.error("Error fetching demo polls:", error);
      return NextResponse.json(
        { error: "Failed to fetch demo polls" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      count: data.length,
    });
  } catch (error) {
    console.error("Error in demo polls list route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
