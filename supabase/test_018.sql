-- test_018.sql — anonymous ballots store a coarsened (day-truncated) timestamp.
-- Run as postgres, inside a transaction that rolls back:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/test_018.sql
-- Clean pass prints `ok:` lines and "018 TESTS PASSED"; failure aborts.

BEGIN;

SET session_replication_role = replica;  -- skip FK + triggers for fixtures

INSERT INTO profiles (id, subscription_tier)
  VALUES ('00000000-0000-0000-0000-0000000000e1', 'pro');

INSERT INTO polls (id, code, user_id, question, allow_multiple, is_active,
                   has_time_limit, is_anonymous, requires_verification) VALUES
  ('00000000-0000-0000-0000-0000000000f1', 'T18-ANON', '00000000-0000-0000-0000-0000000000e1', 'Anon',     false, true, false, true,  false),
  ('00000000-0000-0000-0000-0000000000f2', 'T18-VERI', '00000000-0000-0000-0000-0000000000e1', 'Verified', false, true, false, false, true);

INSERT INTO poll_options (id, poll_id, text, option_order) VALUES
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000000f1', 'A', 1),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000000f2', 'A', 1);

INSERT INTO poll_members (id, poll_id, token, label) VALUES
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000000f2',
   'T18TOKEN00000000000000001', 'Seat 1');

SET session_replication_role = DEFAULT;

SET LOCAL request.jwt.claim.sub = '';
SET LOCAL request.jwt.claims = '{"role":"anon"}';
SET LOCAL ROLE anon;

-- Anonymous ballot → created_at must be day-truncated.
DO $$
DECLARE c timestamptz;
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000f1', NULL, 'fp-18',
                             '["00000000-0000-0000-0000-00000000a001"]'::jsonb, '{}'::jsonb);
  SELECT created_at INTO c FROM votes WHERE poll_id = '00000000-0000-0000-0000-0000000000f1' LIMIT 1;
  IF c <> date_trunc('day', c) THEN
    RAISE EXCEPTION 'FAIL: anonymous ballot timestamp not coarsened: %', c;
  END IF;
  RAISE NOTICE 'ok: anonymous ballot timestamp coarsened to the day (%)', c;
END $$;

-- Verified NON-anonymous ballot → precise timestamp (today, not midnight).
DO $$
DECLARE c timestamptz;
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000f2', 'T18TOKEN00000000000000001', NULL,
                             '["00000000-0000-0000-0000-00000000a002"]'::jsonb, '{}'::jsonb);
  SELECT created_at INTO c FROM votes WHERE poll_id = '00000000-0000-0000-0000-0000000000f2' LIMIT 1;
  IF c = date_trunc('day', c) THEN
    RAISE EXCEPTION 'FAIL: non-anonymous ballot timestamp was coarsened (expected precise): %', c;
  END IF;
  RAISE NOTICE 'ok: non-anonymous ballot keeps a precise timestamp (%)', c;
END $$;

RESET ROLE;

DO $$ BEGIN RAISE NOTICE '018 TESTS PASSED'; END $$;

ROLLBACK;
