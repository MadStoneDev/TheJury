import { supabase } from "./supabase";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++)
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

async function generateUniquePollCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = randomCode(6);
    const { data } = await supabase
      .from("polls")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique poll code");
}

/** The TheJury account a guild is linked to, or null. */
export async function getGuildUserId(guildId: string): Promise<string | null> {
  const { data } = await supabase
    .from("discord_links")
    .select("user_id")
    .eq("guild_id", guildId)
    .maybeSingle();
  return data?.user_id ?? null;
}

/** The linked account's subscription tier (defaults to "free"). */
export async function getAccountTier(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  return data?.subscription_tier ?? "free";
}

/** Create a short-lived link code for /jury link (valid 15 minutes). */
export async function createLinkCode(
  guildId: string,
  guildName: string | null,
): Promise<string> {
  const code = randomCode(6);
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error } = await supabase.from("discord_link_codes").insert({
    code,
    guild_id: guildId,
    guild_name: guildName,
    expires_at: expires,
    claimed: false,
  });
  if (error) throw error;
  return code;
}

export interface CreatedPoll {
  pollId: string;
  code: string;
  options: { id: string; text: string }[];
}

/** Create a real poll under the linked account. */
export async function createPoll(
  userId: string,
  title: string,
  optionTexts: string[],
  opts: { allowMultiple: boolean; closeHours?: number },
): Promise<CreatedPoll> {
  const code = await generateUniquePollCode();
  const endDate = opts.closeHours
    ? new Date(Date.now() + opts.closeHours * 3600 * 1000).toISOString()
    : null;

  const { data: poll, error: pErr } = await supabase
    .from("polls")
    .insert({
      code,
      user_id: userId,
      question: title,
      description: null,
      allow_multiple: opts.allowMultiple,
      is_active: true,
      has_time_limit: !!endDate,
      start_date: null,
      end_date: endDate,
    })
    .select("id")
    .single();
  if (pErr) throw pErr;

  const { data: question, error: qErr } = await supabase
    .from("poll_questions")
    .insert({
      poll_id: poll.id,
      question_text: title,
      question_type: "multiple_choice",
      question_order: 1,
      allow_multiple: opts.allowMultiple,
    })
    .select("id")
    .single();
  if (qErr) throw qErr;

  const { data: options, error: oErr } = await supabase
    .from("poll_options")
    .insert(
      optionTexts.map((text, i) => ({
        poll_id: poll.id,
        question_id: question.id,
        text,
        option_order: i + 1,
      })),
    )
    .select("id, text, option_order");
  if (oErr) throw oErr;

  const ordered = (options ?? []).sort(
    (a, b) => (a.option_order ?? 0) - (b.option_order ?? 0),
  );
  return {
    pollId: poll.id,
    code,
    options: ordered.map((o) => ({ id: o.id, text: o.text })),
  };
}

function parseOptions(raw: unknown): string[] {
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

/**
 * Record a Discord user's vote. One vote row per (poll, discord user):
 * single-choice replaces the selection; multi-choice toggles the option.
 */
export async function recordVote(
  pollId: string,
  optionId: string,
  discordUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const fingerprint = `discord:${discordUserId}`;

  const { data: poll } = await supabase
    .from("polls")
    .select("allow_multiple, is_active, end_date")
    .eq("id", pollId)
    .maybeSingle();
  if (!poll) return { ok: false, error: "Poll not found." };
  if (poll.is_active === false) return { ok: false, error: "Voting is closed." };
  if (poll.end_date && new Date(poll.end_date).getTime() < Date.now())
    return { ok: false, error: "Voting has closed." };

  const { data: existing } = await supabase
    .from("votes")
    .select("id, options")
    .eq("poll_id", pollId)
    .eq("voter_fingerprint", fingerprint)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("votes").insert({
      poll_id: pollId,
      voter_fingerprint: fingerprint,
      options: [optionId],
    });
    // 23505 = another click landed first (the unique index caught the race).
    // That's fine — their vote is already recorded.
    if (error && error.code !== "23505") {
      return { ok: false, error: "Failed to record vote." };
    }
    return { ok: true };
  }

  let next: string[];
  if (poll.allow_multiple) {
    const cur = parseOptions(existing.options);
    next = cur.includes(optionId)
      ? cur.filter((o) => o !== optionId)
      : [...cur, optionId];
  } else {
    next = [optionId];
  }
  const { error } = await supabase
    .from("votes")
    .update({ options: next })
    .eq("id", existing.id);
  return error ? { ok: false, error: "Failed to update vote." } : { ok: true };
}

export interface Counts {
  options: { id: string; text: string; count: number }[];
  total: number;
}

export async function getCounts(pollId: string): Promise<Counts> {
  const { data: options } = await supabase
    .from("poll_options")
    .select("id, text, option_order")
    .eq("poll_id", pollId)
    .order("option_order");

  const { data: votes } = await supabase
    .from("votes")
    .select("options")
    .eq("poll_id", pollId);

  const tally: Record<string, number> = {};
  for (const o of options ?? []) tally[o.id] = 0;
  for (const v of votes ?? []) {
    for (const optId of parseOptions(v.options)) {
      if (optId in tally) tally[optId] += 1;
    }
  }
  return {
    options: (options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
      count: tally[o.id] ?? 0,
    })),
    total: votes?.length ?? 0,
  };
}

export interface PollByCode {
  pollId: string;
  code: string;
  question: string;
  counts: Counts;
}

export async function getPollByCode(code: string): Promise<PollByCode | null> {
  const { data: poll } = await supabase
    .from("polls")
    .select("id, code, question")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!poll) return null;
  return {
    pollId: poll.id,
    code: poll.code,
    question: poll.question,
    counts: await getCounts(poll.id),
  };
}

export interface SetActiveResult {
  ok: boolean;
  error?: string;
  pollId?: string;
  code?: string;
  question?: string;
  channelId?: string;
  messageId?: string;
}

/** Close or reopen a poll the linked account owns, returning its message ref. */
export async function setPollActive(
  code: string,
  userId: string,
  active: boolean,
): Promise<SetActiveResult> {
  const { data: poll } = await supabase
    .from("polls")
    .select("id, user_id, question, code")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!poll) return { ok: false, error: `No poll found with code \`${code.toUpperCase()}\`.` };
  if (poll.user_id !== userId) {
    return { ok: false, error: "That poll belongs to a different account." };
  }

  const { error } = await supabase
    .from("polls")
    .update({ is_active: active })
    .eq("id", poll.id);
  if (error) return { ok: false, error: "Failed to update the poll." };

  const { data: ref } = await supabase
    .from("discord_poll_messages")
    .select("channel_id, message_id")
    .eq("poll_id", poll.id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  return {
    ok: true,
    pollId: poll.id,
    code: poll.code,
    question: poll.question,
    channelId: ref?.channel_id,
    messageId: ref?.message_id,
  };
}

export async function saveMessageRef(
  pollId: string,
  guildId: string,
  channelId: string,
  messageId: string,
): Promise<void> {
  await supabase.from("discord_poll_messages").insert({
    poll_id: pollId,
    guild_id: guildId,
    channel_id: channelId,
    message_id: messageId,
  });
}
