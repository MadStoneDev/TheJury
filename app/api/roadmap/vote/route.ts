import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";
import { uuidSchema } from "@/lib/validations";

// Toggle a roadmap vote. Open to everyone: signed-in users vote by account,
// guests by a device fingerprint. All reads/writes use the service role so
// voter identities stay private and dedupe is enforced by the unique index.
export async function POST(request: Request) {
  const ip = getIPFromRequest(request);
  const { success } = rateLimit(`roadmap-vote:${ip}`, { maxTokens: 30, interval: 60 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { item_id?: unknown; fingerprint?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!uuidSchema.safeParse(body.item_id).success) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }
  const itemId = body.item_id as string;

  // Who's voting?
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let voterKey: string;
  if (user) {
    voterKey = `user:${user.id}`;
  } else {
    const fp = typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";
    if (!fp || fp.length < 6 || fp.length > 200) {
      return NextResponse.json({ error: "Missing voter id" }, { status: 400 });
    }
    voterKey = `fp:${fp}`;
  }

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: existing } = await svc
    .from("roadmap_votes")
    .select("id")
    .eq("item_id", itemId)
    .eq("voter_key", voterKey)
    .maybeSingle();

  let voted: boolean;
  if (existing) {
    await svc.from("roadmap_votes").delete().eq("id", existing.id);
    voted = false;
  } else {
    const { error } = await svc
      .from("roadmap_votes")
      .insert({ item_id: itemId, voter_key: voterKey });
    // Ignore unique-violation races — the vote already exists, which is fine.
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
    }
    voted = true;
  }

  const { count } = await svc
    .from("roadmap_votes")
    .select("*", { count: "exact", head: true })
    .eq("item_id", itemId);

  return NextResponse.json({ voted, count: count ?? 0 });
}
