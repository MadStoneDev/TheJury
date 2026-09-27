-- ============================================================================
-- apply_pending.sql — one script to bring a TheJury Supabase instance up to date
-- ============================================================================
-- Safe to run once, and safe to re-run (idempotent). Bundles:
--   * vote-uniqueness fix from migration 013 (stops duplicate voting)
--   * migration 014 (ai_poll_usage counter is server-write-only)
--   * migration 015 (Discord bot tables)
--   * migration 016 (public roadmap + profiles.role)
--   * the roadmap board seed (Australian-org board; only if the board is empty)
--   * indexes supporting the homepage live-poll demo (content lives in
--     supabase/seed_demo_polls.sql)
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
-- Australian-org board. Kept in sync with supabase/seed_roadmap.sql (which
-- REPLACES the board wholesale); this copy only seeds a fresh, empty instance.
INSERT INTO roadmap_items (title, description, status, sort_order)
SELECT * FROM (VALUES
  -- Shipped
  ('Free and Pro plans', 'Free to start, with Pro monthly, annual or a one-off lifetime.', 'completed', 1),
  ('Five question types', 'Multiple choice, rating, ranked choice, image options and reactions.', 'completed', 2),
  ('Live results and CSV export', 'Watch results land live, and export every response.', 'completed', 3),
  ('No-account voting', 'Anyone can vote from a link, QR code or six-character code.', 'completed', 4),
  ('Discord bot', 'Create and run polls from a linked Discord server.', 'completed', 5),
  ('Public API', 'Create polls and read results with an API key.', 'completed', 6),
  ('Public roadmap', 'This board. Vote on what we build next.', 'completed', 7),
  -- In progress
  ('Results record (PDF)', 'A downloadable PDF with the question, options, eligible voters, counts and open and close times, ready for the minutes.', 'in_progress', 1),
  ('Verified voting', 'One private link per member for elections and motions, with one vote each.', 'in_progress', 2),
  -- Planned
  ('Server-enforced anonymous voting', 'Guarantee a response cannot be linked back to a voter.', 'planned', 1),
  ('Organisation accounts with multiple admins', 'One account for the organisation, with several admins.', 'planned', 2),
  ('Invoice billing', 'Pay by invoice on the Council and Enterprise plan.', 'planned', 3),
  ('Reminders before a poll closes', 'Nudge members who have not voted yet.', 'planned', 4),
  ('Meeting-date polls with calendar invite', 'Turn the winning date into a calendar link.', 'planned', 5)
) AS v(title, description, status, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM roadmap_items);

-- ── Homepage live-poll demo (indexes only) ─────────────────────────────────
-- The demo poll content itself lives in supabase/seed_demo_polls.sql (a single
-- Australian-org poll). These indexes support it:
--   * composite serves the results tally (demo_poll_id prefix) AND the
--     has-voted / vote dedup checks (demo_poll_id + voter_fingerprint), which
--     were previously sequential scans on demo_votes;
--   * the unique index makes seed_demo_polls' ON CONFLICT (question) valid.
CREATE INDEX IF NOT EXISTS idx_demo_votes_poll_fingerprint
  ON public.demo_votes (demo_poll_id, voter_fingerprint);
CREATE UNIQUE INDEX IF NOT EXISTS demo_polls_question_key
  ON public.demo_polls (question);

COMMIT;

-- After running, make yourself an admin (so the Suggestions modal shows up):
--   UPDATE profiles SET role = 10 WHERE id = '<your-user-id>';
