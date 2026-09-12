-- Second batch of roadmap items (run once, after roadmap_add_items.sql).
-- Plain inserts — not a migration. Edit statuses later with UPDATE.
-- Adds the items surfaced in docs/FEATURES.md that weren't yet on the board,
-- and marks the calendar invite shipped.

-- Calendar invite is now live on the results page.
UPDATE roadmap_items
   SET status = 'completed'
 WHERE title = 'Scheduling → calendar invite';

INSERT INTO roadmap_items (title, description, status, sort_order) VALUES
  -- Bot
  ('Live countdown in the poll', 'Show a "closes in 3h" timer that ticks down in the poll message.', 'planned', 14),
  ('Auto-thread for discussion', 'Open a thread on each poll so people can talk it out while voting.', 'planned', 15),
  ('DM the winner on close', 'Send the result summary to the host — and optionally ping the winner.', 'planned', 16),

  -- Platform
  ('More gaming templates', 'LFG / availability and "who''s in" one-tap poll templates.', 'planned', 17),
  ('Calendar invites for API polls', 'Give API-created scheduling polls the same .ics / Google link.', 'planned', 18),
  ('Poll event webhooks', 'Fire a webhook on poll create, vote and close for your own automations.', 'planned', 19),
  ('Richer anonymity controls', 'Finer control over anonymous voting and hiding live results.', 'planned', 20);
