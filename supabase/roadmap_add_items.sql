-- Add the newer roadmap items (run once, after seed_roadmap.sql).
-- Plain inserts — not a migration. Edit statuses later with UPDATE.

INSERT INTO roadmap_items (title, description, status, sort_order) VALUES
  -- Bot
  ('Close / reopen a poll from Discord', 'Stop or restart voting with /jury close and /jury reopen.', 'in_progress', 7),
  ('Add-your-own-option button', 'Let voters suggest an option instead of the host listing them all.', 'planned', 7),
  ('Announce the winner on close', 'Post the result and ping the winning option when a poll closes.', 'planned', 8),
  ('Quorum / minimum votes', 'Mark a poll valid only once it hits a vote threshold.', 'planned', 9),

  -- Platform
  ('Gaming poll templates', 'Game night, tournament seeding, LFG/availability, rate-the-session.', 'planned', 10),
  ('Tournament bracket & seeding polls', 'A gaming-specific poll type that seeds a bracket from the votes.', 'planned', 11),
  ('Trending / community polls', 'A public page of active community polls for discovery.', 'planned', 12),
  ('Poll-closed & threshold notifications', 'Email or Discord DM when your poll closes or hits a target.', 'planned', 13);
