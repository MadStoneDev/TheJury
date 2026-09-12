import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";

// Calendar invite for a scheduling poll's winning date.
//   GET .../calendar            -> downloads an .ics file
//   GET .../calendar?format=json -> { available, optionText, date, googleUrl, icsUrl }
// Only works for polls whose question settings carry `scheduleDates` (created
// via /jury schedule). Public — the whole group adds the winning night.

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://thejury.app").replace(/\/$/, "");

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function parseArr(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollCode: string }> },
) {
  const ip = getIPFromRequest(request);
  const { success } = rateLimit(`poll-calendar:${ip}`, { maxTokens: 30, interval: 60 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { pollCode } = await params;
  const { searchParams } = new URL(request.url);
  const json = searchParams.get("format") === "json";
  const wantOption = searchParams.get("option");

  const db = svc();
  const { data: poll } = await db
    .from("polls")
    .select("id, question, code")
    .eq("code", pollCode.toUpperCase())
    .maybeSingle();

  const unavailable = () =>
    json
      ? NextResponse.json({ available: false })
      : NextResponse.json({ error: "No calendar date for this poll." }, { status: 404 });

  if (!poll) return unavailable();

  const { data: question } = await db
    .from("poll_questions")
    .select("settings")
    .eq("poll_id", poll.id)
    .order("question_order")
    .limit(1)
    .maybeSingle();

  const scheduleDates = parseArr(
    (question?.settings as { scheduleDates?: unknown } | null)?.scheduleDates,
  );
  if (scheduleDates.length === 0) return unavailable();

  const { data: options } = await db
    .from("poll_options")
    .select("id, text, option_order")
    .eq("poll_id", poll.id)
    .order("option_order");
  if (!options || options.length === 0) return unavailable();

  // Tally votes.
  const { data: votes } = await db.from("votes").select("options").eq("poll_id", poll.id);
  const tally: Record<string, number> = {};
  for (const o of options) tally[o.id] = 0;
  for (const v of votes ?? []) {
    for (const id of parseArr(v.options)) if (id in tally) tally[id] += 1;
  }

  // Target option: explicit ?option, else the winner (most votes, first on tie).
  let target = options.find((o) => o.id === wantOption);
  if (!target) {
    target = [...options].sort(
      (a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0) || a.option_order - b.option_order,
    )[0];
  }

  const date = scheduleDates[(target.option_order ?? 1) - 1];
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return unavailable();

  const ymd = date.replace(/-/g, "");
  const title = poll.question;
  const details = `Scheduled via TheJury — ${SITE}/results/${poll.code}`;
  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${ymd}T190000/${ymd}T210000` +
    `&details=${encodeURIComponent(details)}`;

  if (json) {
    return NextResponse.json({
      available: true,
      optionText: target.text,
      date,
      googleUrl,
      icsUrl: `${SITE}/api/polls/${poll.code}/calendar${wantOption ? `?option=${wantOption}` : ""}`,
    });
  }

  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TheJury//Poll//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${poll.code}-${target.id}@thejury.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${ymd}T190000`,
    `DTEND:${ymd}T210000`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="thejury-${poll.code}.ics"`,
    },
  });
}
