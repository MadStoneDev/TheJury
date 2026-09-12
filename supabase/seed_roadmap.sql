-- Seed the public roadmap board (run once, after migration 016).
--   supabase db execute < supabase/seed_roadmap.sql
-- or paste into the Supabase SQL editor. Edit statuses later with:
--   UPDATE roadmap_items SET status = 'in_progress' WHERE title = '…';

INSERT INTO roadmap_items (title, description, status, sort_order) VALUES
  -- Shipped
  ('Marketing site redesign', 'New homepage, use-case pages, pricing, dashboard and auth.', 'completed', 1),
  ('Two-tier pricing + lifetime', 'Free and Pro (monthly, annual, and a one-off lifetime).', 'completed', 2),
  ('Discord bot', '/jury create, schedule, results and link — polls straight from Discord.', 'completed', 3),
  ('Server-enforced plan limits', 'Free/Pro limits checked on the server, not just hidden in the UI.', 'completed', 4),
  ('Public API', 'Create scheduling polls and read results with an API key.', 'completed', 5),
  ('Public roadmap', 'This board — vote on what we build next.', 'completed', 6),

  -- In progress
  ('Polished /jury create + one vote per person', 'A proper form to create polls in Discord, and bulletproof one-vote-per-user.', 'in_progress', 1),

  -- Planned
  ('Scheduling → calendar invite', 'Turn the winning date into an .ics / Google Calendar link.', 'planned', 1),
  ('Ranked choice & rating polls in Discord', 'Bring the web vote methods to the bot.', 'planned', 2),
  ('Recurring polls', 'Auto-post a poll on a schedule — e.g. weekly game night.', 'planned', 3),
  ('Reminders before a poll closes', 'Ping people who haven''t voted yet.', 'planned', 4),
  ('Stream overlay for live polls', 'A transparent browser-source overlay for OBS/Streamlabs.', 'planned', 5),
  ('Role-restricted voting', 'Limit a poll to a specific Discord role.', 'planned', 6);
