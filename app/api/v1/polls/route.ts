import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateApiKey } from "@/lib/apiAuth";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const ip = getIPFromRequest(request);
    const { success: allowed } = rateLimit(`api-v1-polls:${ip}`, {
      maxTokens: 30,
      interval: 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const auth = await validateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 },
      );
    }

    if (!auth.scopes.includes("polls:read")) {
      return NextResponse.json(
        { error: "Insufficient scope. Required: polls:read" },
        { status: 403 },
      );
    }

    const supabase = await createClient();

    const { data: polls, error } = await supabase
      .from("polls")
      .select(
        `
        id,
        code,
        question,
        description,
        is_active,
        allow_multiple,
        created_at,
        votes(count)
      `,
      )
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API v1] Error fetching polls:", error);
      return NextResponse.json(
        { error: "Failed to fetch polls" },
        { status: 500 },
      );
    }

    const formatted = (polls || []).map((poll) => {
      const totalVotes =
        (poll.votes as unknown as { count: number }[])?.[0]?.count ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { votes: _v, ...rest } = poll;
      return { ...rest, total_votes: totalVotes };
    });

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error("[API v1] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip = getIPFromRequest(request);
    const { success: allowed } = rateLimit(`api-v1-polls-create:${ip}`, {
      maxTokens: 10,
      interval: 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const auth = await validateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 },
      );
    }

    if (!auth.scopes.includes("polls:write")) {
      return NextResponse.json(
        { error: "Insufficient scope. Required: polls:write" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        { error: "question is required and must be a string" },
        { status: 400 },
      );
    }

    if (
      !body.options ||
      !Array.isArray(body.options) ||
      body.options.length < 2
    ) {
      return NextResponse.json(
        { error: "options must be an array with at least 2 items" },
        { status: 400 },
      );
    }

    for (const opt of body.options) {
      if (typeof opt !== "string" || opt.trim().length === 0) {
        return NextResponse.json(
          { error: "Each option must be a non-empty string" },
          { status: 400 },
        );
      }
    }

    const supabase = await createClient();

    // Generate unique poll code
    const { generateUniquePollCode } = await import(
      "@/utils/pollCodeGenerator"
    );
    const code = await generateUniquePollCode();

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        code,
        user_id: auth.userId,
        question: body.question.trim(),
        description: body.description?.trim() || null,
        allow_multiple: body.allow_multiple ?? false,
        is_active: true,
        has_time_limit: false,
        start_date: null,
        end_date: null,
      })
      .select("id, code, question, description, is_active, allow_multiple, created_at")
      .single();

    if (pollError) {
      console.error("[API v1] Error creating poll:", pollError);
      return NextResponse.json(
        { error: "Failed to create poll" },
        { status: 500 },
      );
    }

    // Create the default question
    const { data: question, error: qError } = await supabase
      .from("poll_questions")
      .insert({
        poll_id: poll.id,
        question_text: body.question.trim(),
        question_type: "multiple_choice",
        question_order: 1,
        allow_multiple: body.allow_multiple ?? false,
      })
      .select("id")
      .single();

    if (qError) {
      console.error("[API v1] Error creating question:", qError);
      return NextResponse.json(
        { error: "Failed to create poll question" },
        { status: 500 },
      );
    }

    // Create options
    const optionsData = body.options.map((text: string, index: number) => ({
      poll_id: poll.id,
      question_id: question.id,
      text: text.trim(),
      option_order: index + 1,
    }));

    const { error: optError } = await supabase
      .from("poll_options")
      .insert(optionsData);

    if (optError) {
      console.error("[API v1] Error creating options:", optError);
      return NextResponse.json(
        { error: "Failed to create poll options" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data: {
          ...poll,
          total_votes: 0,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[API v1] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
