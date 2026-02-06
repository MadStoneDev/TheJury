// app/api/live-polls/seed/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isAuthorized(request: Request): boolean {
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // Check query param
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") === secret) return true;

  return false;
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
    const results = [];

    // Insert each poll individually to handle duplicates gracefully
    for (const poll of additionalPolls) {
      try {
        // First check if poll already exists
        const { data: existing } = await supabase
          .from("demo_polls")
          .select("id, question")
          .eq("question", poll.question)
          .single();

        if (existing) {
          skippedCount++;
          results.push({
            question: poll.question,
            status: "skipped",
            reason: "already exists",
          });
          continue;
        }

        // Insert the new poll
        const { data: inserted, error: insertError } = await supabase
          .from("demo_polls")
          .insert({
            question: poll.question,
            description: poll.description,
            options: JSON.stringify(poll.options),
            category: poll.category,
            display_order: poll.display_order,
            is_active: true,
          })
          .select("id, question")
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            skippedCount++;
            results.push({
              question: poll.question,
              status: "skipped",
              reason: "duplicate detected during insert",
            });
          } else {
            throw insertError;
          }
        } else {
          successCount++;
          results.push({
            question: poll.question,
            status: "inserted",
            id: inserted.id,
          });
        }
      } catch (error) {
        results.push({
          question: poll.question,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeding completed: ${successCount} inserted, ${skippedCount} skipped`,
      details: results,
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
      polls: data,
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
