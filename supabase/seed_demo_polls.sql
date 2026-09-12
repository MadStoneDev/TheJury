-- Seed gaming/community demo polls for the landing-page hero widget.
-- Safe to run repeatedly: existing questions are skipped via ON CONFLICT.
-- Requires a unique index/constraint on demo_polls(question); if you don't
-- have one, run the seed API route (POST /api/live-polls/seed) instead, which
-- checks for duplicates in application code.
--
-- Run in the Supabase SQL editor (or: supabase db execute < this file).

insert into public.demo_polls
  (question, description, options, category, display_order, is_active)
values
  (
    'What are we queuing up tonight?',
    'Squad''s in — pick the vibe for game night',
    '[{"id":"1","text":"Ranked grind"},{"id":"2","text":"Chill co-op"},{"id":"3","text":"Party games"},{"id":"4","text":"Something new"}]',
    'gaming',
    1,
    true
  ),
  (
    'Best co-op game to play with friends?',
    'Community pick — settle it once and for all',
    '[{"id":"1","text":"Minecraft"},{"id":"2","text":"Valheim"},{"id":"3","text":"Lethal Company"},{"id":"4","text":"It Takes Two"}]',
    'community',
    2,
    true
  )
on conflict (question) do nothing;
