-- Seed the Australian-org demo poll shown in the landing-page hero widget.
-- Run in the Supabase SQL editor, or: supabase db execute < this file.
--
-- The hero (app/api/live-polls/random) prefers category = 'organisation', so
-- this single poll is what visitors see. It is safe to run repeatedly.
--
-- MONTHLY RESET: re-run Section 2 on a schedule (e.g. a monthly cron) to clear
-- accumulated votes and restore the starting distribution, so the demo doesn't
-- drift over time.

-- ── Section 1: the poll ────────────────────────────────────────────────────
-- Requires a unique index/constraint on demo_polls(question). If you don't have
-- one, use the seed API route (POST /api/live-polls/seed) instead.
insert into public.demo_polls
  (question, description, options, category, display_order, is_active)
values
  (
    'How does your organisation run votes today?',
    'A live demo. Have a go, then see how everyone answered.',
    '[{"id":"1","text":"Show of hands"},{"id":"2","text":"Paper ballots"},{"id":"3","text":"Email replies"},{"id":"4","text":"Google Forms or similar"},{"id":"5","text":"Something else"}]',
    'organisation',
    1,
    true
  )
on conflict (question) do nothing;

-- ── Section 2: reset + starting distribution (safe to re-run monthly) ───────
-- Clear every vote for this poll (both seed votes and real visitor votes)...
delete from public.demo_votes
where demo_poll_id in (
  select id from public.demo_polls
  where question = 'How does your organisation run votes today?'
);

-- ...then seed a plausible starting distribution so the first visitor doesn't
-- see zeroes. Counts per option: show of hands 34, paper 18, email 41,
-- forms 52, other 9 (total 154).
with poll as (
  select id
  from public.demo_polls
  where question = 'How does your organisation run votes today?'
),
dist(opt_id, cnt) as (
  values ('1', 34), ('2', 18), ('3', 41), ('4', 52), ('5', 9)
),
expanded as (
  select opt_id from dist, generate_series(1, cnt)
),
numbered as (
  select opt_id, row_number() over () as rn from expanded
)
insert into public.demo_votes
  (demo_poll_id, selected_options, voter_fingerprint, voted_at)
select
  (select id from poll),
  '["' || opt_id || '"]',
  'seed-' || rn,
  now()
from numbered
where exists (select 1 from poll);
