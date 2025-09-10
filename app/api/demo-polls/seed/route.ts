// Helper function to add more demo polls (you can run this via API or directly in database)
// app/api/demo-polls/seed/route.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
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

    // Insert additional demo polls
    const { error } = await supabase.from("demo_polls").insert(
      additionalPolls.map((poll) => ({
        question: poll.question,
        description: poll.description,
        options: JSON.stringify(poll.options),
        category: poll.category,
        display_order: poll.display_order,
        is_active: true,
      })),
    );

    if (error) {
      console.error("Error seeding demo polls:", error);
      return NextResponse.json(
        { error: "Failed to seed demo polls" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Demo polls seeded successfully",
    });
  } catch (error) {
    console.error("Error in seed route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
