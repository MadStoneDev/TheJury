import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

// Claims a /jury link code: attaches the Discord guild it was issued for to the
// signed-in user's account. Uses the service role because discord_link_codes is
// service-role-only under RLS.
export async function POST(request: Request) {
  const ip = getIPFromRequest(request);
  const { success } = rateLimit(`discord-link:${ip}`, { maxTokens: 10 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{4,12}$/.test(code)) {
    return NextResponse.json({ error: "Enter the code from Discord." }, { status: 400 });
  }

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: linkCode } = await svc
    .from("discord_link_codes")
    .select("code, guild_id, guild_name, expires_at, claimed")
    .eq("code", code)
    .maybeSingle();

  if (!linkCode || linkCode.claimed) {
    return NextResponse.json({ error: "That code is invalid or already used." }, { status: 404 });
  }
  if (new Date(linkCode.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired — run /jury link again." }, { status: 410 });
  }

  const { error: linkErr } = await svc.from("discord_links").upsert({
    guild_id: linkCode.guild_id,
    guild_name: linkCode.guild_name,
    user_id: user.id,
  });
  if (linkErr) {
    console.error("discord link upsert failed", linkErr);
    return NextResponse.json({ error: "Failed to link server." }, { status: 500 });
  }

  await svc.from("discord_link_codes").update({ claimed: true }).eq("code", code);

  return NextResponse.json({ ok: true, guildName: linkCode.guild_name ?? "your server" });
}
