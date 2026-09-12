import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

// Submit a feature suggestion. Signed-in users only, and not banned/on
// probation (role >= 3). Suggestions are write-only — only admins can read
// them (via the service role, in the roadmap page).
export async function POST(request: Request) {
  const ip = getIPFromRequest(request);
  const { success } = rateLimit(`roadmap-suggest:${ip}`, { maxTokens: 5, interval: 60 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to suggest a feature." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile?.role ?? 3) < 3) {
    return NextResponse.json(
      { error: "Your account can't submit suggestions right now." },
      { status: 403 },
    );
  }

  let body: { body?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < 3 || text.length > 2000) {
    return NextResponse.json(
      { error: "Suggestions must be between 3 and 2000 characters." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("roadmap_suggestions")
    .insert({ user_id: user.id, body: text });
  if (error) {
    console.error("roadmap suggestion insert failed", error);
    return NextResponse.json({ error: "Failed to submit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
