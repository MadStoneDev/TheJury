-- Re-seed the public roadmap board for the Australian-org repositioning.
--   supabase db execute < supabase/seed_roadmap.sql
-- or paste into the Supabase SQL editor.
--
-- This REPLACES the board contents (it deletes existing rows first), removing
-- the gaming/Discord-flavoured items. Note: the Discord bot is still live; it is
-- simply no longer marketed, so it stays as a shipped item with neutral wording.
-- Supersedes supabase/roadmap_add_items.sql and the roadmap section of
-- supabase/apply_pending.sql — you don't need to run those any more.
--
-- NOTE: "Results record (PDF)", "Verified voting" and "Anonymous voting
-- enforced" are the target-state features the marketing copy references. They
-- sit here as in-progress/planned, which is the honest place for them.

DELETE FROM roadmap_items;

INSERT INTO roadmap_items (title, description, status, sort_order) VALUES
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
  ('Meeting-date polls with calendar invite', 'Turn the winning date into a calendar link.', 'planned', 5);
