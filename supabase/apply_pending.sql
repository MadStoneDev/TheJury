-- ============================================================================
-- apply_pending.sql — one script to bring a TheJury Supabase instance up to date
-- ============================================================================
-- Safe to run once, and safe to re-run (idempotent). Bundles:
--   * vote-uniqueness fix from migration 013 (stops duplicate voting)
--   * migration 014 (ai_poll_usage counter is server-write-only)
--   * migration 015 (Discord bot tables)
--   * migration 016 (public roadmap + profiles.role)
--   * the roadmap board seed (only inserted if the board is empty)
--   * the homepage live-poll demo set (gamer/community/fun questions)
--
-- Run it in the Supabase SQL editor, or: supabase db execute < apply_pending.sql
--
-- NOTE: this does NOT include the non-vote parts of migration 013
-- (stripe_webhook_events, poll_responses RLS) — those have been running in
-- production already. If 013 was never applied at all, run
-- supabase/migrations/013_audit_fixes.sql separately first.
-- ============================================================================

BEGIN;

-- ── 013: one vote per person per poll ──────────────────────────────────────
-- Deduplicate any existing double-votes (keep the earliest), then enforce it.
WITH ranked_user_votes AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY poll_id, user_id ORDER BY created_at ASC, id ASC
  ) AS rn
  FROM votes WHERE user_id IS NOT NULL
)
DELETE FROM votes WHERE id IN (SELECT id FROM ranked_user_votes WHERE rn > 1);

WITH ranked_fp_votes AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY poll_id, voter_fingerprint ORDER BY created_at ASC, id ASC
  ) AS rn
  FROM votes WHERE user_id IS NULL AND voter_fingerprint IS NOT NULL
)
DELETE FROM votes WHERE id IN (SELECT id FROM ranked_fp_votes WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_user_per_poll
  ON votes (poll_id, user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_fingerprint_per_poll
  ON votes (poll_id, voter_fingerprint)
  WHERE voter_fingerprint IS NOT NULL AND user_id IS NULL;

-- ── 014: ai_poll_usage counter is server-write-only ────────────────────────
DROP POLICY IF EXISTS "Users can manage own AI usage" ON ai_poll_usage;

-- ── 015: Discord bot ───────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users read own discord links" ON discord_links;
CREATE POLICY "Users read own discord links" ON discord_links
  FOR SELECT USING (user_id = auth.uid());

-- ── 016: public roadmap + user roles ───────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role smallint NOT NULL DEFAULT 3;

CREATE TABLE IF NOT EXISTS roadmap_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'planned'
              CHECK (status IN ('planned', 'in_progress', 'completed')),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS roadmap_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  voter_key  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, voter_key)
);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item ON roadmap_votes(item_id);
CREATE TABLE IF NOT EXISTS roadmap_suggestions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_roadmap_suggestions_created
  ON roadmap_suggestions(created_at DESC);

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read roadmap items" ON roadmap_items;
CREATE POLICY "Anyone can read roadmap items" ON roadmap_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users submit own suggestions" ON roadmap_suggestions;
CREATE POLICY "Users submit own suggestions" ON roadmap_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Seed the roadmap board (only if it's empty) ────────────────────────────
INSERT INTO roadmap_items (title, description, status, sort_order)
SELECT * FROM (VALUES
  -- Shipped
  ('Marketing site redesign', 'New homepage, use-case pages, pricing, dashboard and auth.', 'completed', 1),
  ('Two-tier pricing + lifetime', 'Free and Pro (monthly, annual, and a one-off lifetime).', 'completed', 2),
  ('Discord bot', '/jury create, schedule, results and link — polls straight from Discord.', 'completed', 3),
  ('Server-enforced plan limits', 'Free/Pro limits checked on the server, not just hidden in the UI.', 'completed', 4),
  ('Public API', 'Create scheduling polls and read results with an API key.', 'completed', 5),
  ('Public roadmap', 'This board — vote on what we build next.', 'completed', 6),
  ('Close / reopen a poll from Discord', 'Stop or restart voting with /jury close and /jury reopen.', 'completed', 7),
  ('Gaming poll templates', 'Game night, session scheduling, rate-the-session and ranked next-campaign picks.', 'completed', 10),
  -- In progress
  ('Polished /jury create + one vote per person', 'A proper form to create polls in Discord, and bulletproof one-vote-per-user.', 'in_progress', 1),
  -- Planned
  ('Scheduling → calendar invite', 'Turn the winning date into an .ics / Google Calendar link.', 'planned', 1),
  ('Ranked choice & rating polls in Discord', 'Bring the web vote methods to the bot.', 'planned', 2),
  ('Recurring polls', 'Auto-post a poll on a schedule — e.g. weekly game night.', 'planned', 3),
  ('Reminders before a poll closes', 'Ping people who haven''t voted yet.', 'planned', 4),
  ('Stream overlay for live polls', 'A transparent browser-source overlay for OBS/Streamlabs.', 'planned', 5),
  ('Role-restricted voting', 'Limit a poll to a specific Discord role.', 'planned', 6),
  ('Add-your-own-option button', 'Let voters suggest an option instead of the host listing them all.', 'planned', 7),
  ('Announce the winner on close', 'Post the result and ping the winning option when a poll closes.', 'planned', 8),
  ('Quorum / minimum votes', 'Mark a poll valid only once it hits a vote threshold.', 'planned', 9),
  ('Tournament bracket & seeding polls', 'A gaming-specific poll type that seeds a bracket from the votes.', 'planned', 11),
  ('Trending / community polls', 'A public page of active community polls for discovery.', 'planned', 12),
  ('Poll-closed & threshold notifications', 'Email or Discord DM when your poll closes or hits a target.', 'planned', 13)
) AS v(title, description, status, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM roadmap_items);

-- ── Homepage live-poll demo set ────────────────────────────────────────────
-- Gamer / community / fun questions the hero widget rotates through.
-- The unique index makes ON CONFLICT valid and keeps re-runs idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS demo_polls_question_key
  ON public.demo_polls (question);

INSERT INTO public.demo_polls
  (question, description, options, category, display_order, is_active)
VALUES
  ('Favourite gaming genre?', NULL,
   '[{"id":"1","text":"RPG"},{"id":"2","text":"Shooter"},{"id":"3","text":"Strategy"},{"id":"4","text":"Roguelike"},{"id":"5","text":"Fighting"},{"id":"6","text":"Sim / management"},{"id":"7","text":"Whatever''s free this week"}]',
   'gaming', 3, true),
  ('Favourite TCG?', NULL,
   '[{"id":"1","text":"Magic: The Gathering"},{"id":"2","text":"Pokémon"},{"id":"3","text":"Yu-Gi-Oh!"},{"id":"4","text":"One Piece"},{"id":"5","text":"Riftbound"},{"id":"6","text":"Lorcana"},{"id":"7","text":"I don''t play TCGs"}]',
   'gaming', 4, true),
  ('What do you think of TCGs?', NULL,
   '[{"id":"1","text":"Worth every cent"},{"id":"2","text":"Fun until I see the price"},{"id":"3","text":"A second mortgage"},{"id":"4","text":"Cardboard crack"},{"id":"5","text":"Never touched one"}]',
   'gaming', 5, true),
  ('Controller or mouse & keyboard?', NULL,
   '[{"id":"1","text":"MKB for life"},{"id":"2","text":"Controller"},{"id":"3","text":"Depends on the game"},{"id":"4","text":"Steam Deck"}]',
   'gaming', 6, true),
  ('Difficulty setting you actually pick?', NULL,
   '[{"id":"1","text":"Story"},{"id":"2","text":"Normal"},{"id":"3","text":"Hard"},{"id":"4","text":"Whatever drops the best loot"}]',
   'gaming', 7, true),
  ('The real reason your backlog is huge?', NULL,
   '[{"id":"1","text":"Steam sales"},{"id":"2","text":"New game every week"},{"id":"3","text":"I finish nothing"},{"id":"4","text":"What backlog"}]',
   'gaming', 8, true),
  ('Do you play board games?', NULL,
   '[{"id":"1","text":"All the time"},{"id":"2","text":"Only at Christmas"},{"id":"3","text":"Just the drinking kind"},{"id":"4","text":"Catan ruined my friendships"},{"id":"5","text":"Nope"}]',
   'community', 9, true),
  ('Which board game ends friendships?', NULL,
   '[{"id":"1","text":"Monopoly"},{"id":"2","text":"Catan"},{"id":"3","text":"Risk"},{"id":"4","text":"Uno"},{"id":"5","text":"We''re all still friends"}]',
   'community', 10, true),
  ('How do you settle a group decision?', NULL,
   '[{"id":"1","text":"Vote"},{"id":"2","text":"Loudest person wins"},{"id":"3","text":"Rock paper scissors"},{"id":"4","text":"Whoever paid last time"}]',
   'community', 11, true),
  ('Best excuse for missing the session?', NULL,
   '[{"id":"1","text":"Just one more game"},{"id":"2","text":"IRL got me"},{"id":"3","text":"Timezones"},{"id":"4","text":"I was on time, you weren''t"}]',
   'community', 12, true),
  ('Your setup?', NULL,
   '[{"id":"1","text":"Battlestation with RGB"},{"id":"2","text":"Laptop on the couch"},{"id":"3","text":"Console + TV"},{"id":"4","text":"Handheld"},{"id":"5","text":"Phone"}]',
   'gaming', 13, true),
  ('Pineapple on pizza?', NULL,
   '[{"id":"1","text":"Yes"},{"id":"2","text":"No"},{"id":"3","text":"Only after a raid win"},{"id":"4","text":"Anything past midnight"}]',
   'fun', 14, true)
ON CONFLICT (question) DO NOTHING;

-- Retire the two original corny demo polls (flip back to true to restore).
UPDATE public.demo_polls
   SET is_active = false
 WHERE question IN ('What are we queuing up tonight?', 'Best co-op game to play with friends?');

COMMIT;

-- After running, make yourself an admin (so the Suggestions modal shows up):
--   UPDATE profiles SET role = 10 WHERE id = '<your-user-id>';
