-- Migration: public roadmap + user roles.
--
-- profiles.role: 0 banned · 1 probation · 2 warned · 3 user (default) · 10 admin.
-- roadmap_items: the board (managed by SQL; public read).
-- roadmap_votes: one vote per person per item (users by account, guests by
--   device fingerprint). Managed entirely by the server (service role).
-- roadmap_suggestions: write-only for signed-in users; only readable via the
--   service role (admin-gated in app code).

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
  voter_key  TEXT NOT NULL, -- "user:<uuid>" or "fp:<fingerprint>"
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

-- Items are public to read; inserts/updates happen via SQL or the service role.
CREATE POLICY "Anyone can read roadmap items" ON roadmap_items
  FOR SELECT USING (true);

-- Votes: no public policies — all reads (counts) and writes go through the
-- service role, so voter identities are never exposed to the client.

-- Suggestions: a signed-in user may submit their own; no SELECT policy exists,
-- so they are unreadable except via the service role (admins, in app code).
CREATE POLICY "Users submit own suggestions" ON roadmap_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make yourself an admin after applying this migration:
--   UPDATE profiles SET role = 10 WHERE id = '<your-user-id>';
-- Add roadmap items:
--   INSERT INTO roadmap_items (title, description, status, sort_order)
--   VALUES ('Ranked choice in Discord', 'Vote by ranking options.', 'planned', 1);
