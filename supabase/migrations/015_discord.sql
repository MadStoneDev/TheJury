-- Migration: Discord bot support.
--
-- discord_links      : a Discord guild attached to a TheJury account.
-- discord_link_codes : short-lived codes from /jury link, claimed on thejury.app.
-- discord_poll_messages : maps a poll to the Discord message the bot edits with
--                         live counts.
--
-- All three are written by the bot (service role) and the /api/discord/link
-- route (server). RLS is on with only a read-own policy for links; service role
-- bypasses RLS for everything else.

CREATE TABLE IF NOT EXISTS discord_links (
  guild_id   TEXT PRIMARY KEY,
  guild_name TEXT,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_link_codes (
  code       TEXT PRIMARY KEY,
  guild_id   TEXT NOT NULL,
  guild_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS discord_poll_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  guild_id   TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_links_user ON discord_links(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_poll_messages_poll ON discord_poll_messages(poll_id);

ALTER TABLE discord_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_poll_messages ENABLE ROW LEVEL SECURITY;

-- Users can see which servers are linked to their account. Everything else is
-- service-role only (bot + link endpoint), so no other policies are defined.
CREATE POLICY "Users read own discord links" ON discord_links
  FOR SELECT USING (user_id = auth.uid());
