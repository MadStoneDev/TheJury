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

    const additionalPolls = [
      {
        question: "What's your preferred programming language?",
        description: "For building web applications",
        options: [
          { id: "1", text: "JavaScript/TypeScript" },
          { id: "2", text: "Python" },
          { id: "3", text: "Java" },
          { id: "4", text: "Go" },
        ],
        category: "tech",
        display_order: 6,
      },
      {
        question: "How do you stay motivated?",
        description: "What keeps you going when things get tough?",
        options: [
          { id: "1", text: "Setting small goals" },
          { id: "2", text: "Rewards and treats" },
          { id: "3", text: "Support from others" },
          { id: "4", text: "Thinking about the outcome" },
        ],
        category: "motivation",
        display_order: 7,
      },
      {
        question: "What's your ideal weekend?",
        description: "How do you like to spend your free time?",
        options: [
          { id: "1", text: "Outdoors and active" },
          { id: "2", text: "Reading or learning" },
          { id: "3", text: "Socializing with friends" },
          { id: "4", text: "Relaxing at home" },
        ],
        category: "lifestyle",
        display_order: 8,
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
