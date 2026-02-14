import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

const AI_FREE_LIMIT = 3; // free tier: 3 generations per month

interface GeneratedQuestion {
  question_text: string;
  question_type: string;
  allow_multiple: boolean;
  options: { text: string }[];
}

export async function POST(request: Request) {
  try {
    const ip = getIPFromRequest(request);
    const { success: allowed } = rateLimit(`ai-generate:${ip}`, {
      maxTokens: 20,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a description of the poll you want to create" },
        { status: 400 },
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Description is too long (max 500 characters)" },
        { status: 400 },
      );
    }

    // Check user tier and usage
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = profile?.subscription_tier || "free";
    const monthYear = new Date().toISOString().slice(0, 7); // "2026-02"

    if (tier === "free") {
      // Check monthly usage
      const { data: usage } = await supabase
        .from("ai_poll_usage")
        .select("usage_count")
        .eq("user_id", user.id)
        .eq("month_year", monthYear)
        .single();

      if (usage && usage.usage_count >= AI_FREE_LIMIT) {
        return NextResponse.json(
          {
            error: `You've used all ${AI_FREE_LIMIT} free AI generations this month. Upgrade to Pro for unlimited.`,
            limitReached: true,
          },
          { status: 403 },
        );
      }
    }

    // Generate poll using rule-based approach (no external AI API dependency)
    const generated = generatePollFromPrompt(prompt.trim());

    // Track usage
    const { data: existingUsage } = await supabase
      .from("ai_poll_usage")
      .select("id, usage_count")
      .eq("user_id", user.id)
      .eq("month_year", monthYear)
      .single();

    if (existingUsage) {
      await supabase
        .from("ai_poll_usage")
        .update({ usage_count: existingUsage.usage_count + 1, updated_at: new Date().toISOString() })
        .eq("id", existingUsage.id);
    } else {
      await supabase.from("ai_poll_usage").insert({
        user_id: user.id,
        month_year: monthYear,
        usage_count: 1,
      });
    }

    return NextResponse.json({
      title: generated.title,
      description: generated.description,
      questions: generated.questions,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate poll" },
      { status: 500 },
    );
  }
}

/**
 * Generate a poll structure from a text prompt.
 * This is a rule-based generator that creates sensible poll structures
 * based on keywords in the prompt. It can be replaced with an actual
 * AI API call (OpenAI, Anthropic, etc.) when desired.
 */
function generatePollFromPrompt(prompt: string): {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
} {
  const lower = prompt.toLowerCase();

  // Detect intent categories
  const isFeedback =
    lower.includes("feedback") ||
    lower.includes("satisfaction") ||
    lower.includes("review") ||
    lower.includes("rate");
  const isPreference =
    lower.includes("prefer") ||
    lower.includes("favorite") ||
    lower.includes("favourite") ||
    lower.includes("best") ||
    lower.includes("choose");
  const isEvent =
    lower.includes("event") ||
    lower.includes("meeting") ||
    lower.includes("date") ||
    lower.includes("schedule") ||
    lower.includes("when");
  const isTeam =
    lower.includes("team") ||
    lower.includes("employee") ||
    lower.includes("workplace") ||
    lower.includes("sprint") ||
    lower.includes("retro");
  const isFood =
    lower.includes("food") ||
    lower.includes("lunch") ||
    lower.includes("dinner") ||
    lower.includes("restaurant") ||
    lower.includes("eat");

  // Capitalize first letter of prompt for title
  const title =
    prompt.charAt(0).toUpperCase() + prompt.slice(1).replace(/[?.!]+$/, "");

  if (isFeedback) {
    return {
      title,
      description: "Share your honest feedback to help us improve",
      questions: [
        {
          question_text: `How would you rate your experience with ${extractSubject(prompt)}?`,
          question_type: "multiple_choice",
          allow_multiple: false,
          options: [
            { text: "Excellent" },
            { text: "Good" },
            { text: "Average" },
            { text: "Below Average" },
            { text: "Poor" },
          ],
        },
        {
          question_text: "What aspects stood out to you?",
          question_type: "multiple_choice",
          allow_multiple: true,
          options: [
            { text: "Quality" },
            { text: "Speed" },
            { text: "Value for money" },
            { text: "Customer service" },
            { text: "Ease of use" },
          ],
        },
      ],
    };
  }

  if (isFood) {
    return {
      title,
      description: "Vote for your preferred option",
      questions: [
        {
          question_text: "What type of food are you in the mood for?",
          question_type: "multiple_choice",
          allow_multiple: false,
          options: [
            { text: "Pizza" },
            { text: "Sushi" },
            { text: "Burgers" },
            { text: "Thai" },
            { text: "Mexican" },
            { text: "Indian" },
          ],
        },
      ],
    };
  }

  if (isEvent) {
    return {
      title,
      description: "Help us find the best time for everyone",
      questions: [
        {
          question_text: "Which day works best for you?",
          question_type: "multiple_choice",
          allow_multiple: true,
          options: [
            { text: "Monday" },
            { text: "Tuesday" },
            { text: "Wednesday" },
            { text: "Thursday" },
            { text: "Friday" },
          ],
        },
        {
          question_text: "What time of day do you prefer?",
          question_type: "multiple_choice",
          allow_multiple: false,
          options: [
            { text: "Morning (9am-12pm)" },
            { text: "Afternoon (12pm-5pm)" },
            { text: "Evening (5pm-8pm)" },
          ],
        },
      ],
    };
  }

  if (isTeam) {
    return {
      title,
      description: "Anonymous team feedback survey",
      questions: [
        {
          question_text: "How would you rate team morale this week?",
          question_type: "multiple_choice",
          allow_multiple: false,
          options: [
            { text: "Great" },
            { text: "Good" },
            { text: "Okay" },
            { text: "Could be better" },
            { text: "Needs improvement" },
          ],
        },
        {
          question_text: "What should we focus on improving?",
          question_type: "multiple_choice",
          allow_multiple: true,
          options: [
            { text: "Communication" },
            { text: "Work-life balance" },
            { text: "Project planning" },
            { text: "Tools & processes" },
            { text: "Team bonding" },
          ],
        },
      ],
    };
  }

  if (isPreference) {
    return {
      title,
      description: "Cast your vote and see what others think",
      questions: [
        {
          question_text: prompt.endsWith("?") ? prompt : `${prompt}?`,
          question_type: "multiple_choice",
          allow_multiple: false,
          options: [
            { text: "Option A" },
            { text: "Option B" },
            { text: "Option C" },
            { text: "Option D" },
          ],
        },
      ],
    };
  }

  // Default: create a simple poll from the prompt
  return {
    title,
    description: "Share your opinion",
    questions: [
      {
        question_text: prompt.endsWith("?") ? prompt : `${prompt}?`,
        question_type: "multiple_choice",
        allow_multiple: false,
        options: [
          { text: "Strongly Agree" },
          { text: "Agree" },
          { text: "Neutral" },
          { text: "Disagree" },
          { text: "Strongly Disagree" },
        ],
      },
    ],
  };
}

function extractSubject(prompt: string): string {
  // Try to extract a meaningful subject from the prompt
  const words = prompt.replace(/[?.!,]/g, "").split(/\s+/);
  if (words.length <= 3) return prompt;
  // Take last few meaningful words
  const filtered = words.filter(
    (w) =>
      !["the", "a", "an", "for", "with", "about", "on", "in", "to", "of", "how", "what", "is", "are", "my", "our", "your"].includes(
        w.toLowerCase(),
      ),
  );
  return filtered.slice(-3).join(" ") || prompt;
}
