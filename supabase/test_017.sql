-- test_017.sql — behavioural tests for 017_verified_anonymous_voting.sql
--
-- Run AFTER applying 017, as the postgres/superuser role (it uses SET ROLE and
-- session_replication_role). Everything runs inside one transaction that ROLLS
-- BACK at the end, so it leaves no data behind:
--
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/test_017.sql
--
-- A clean pass prints only `NOTICE: ok: ...` lines and "ALL TESTS PASSED".
-- Any failure aborts with `FAIL: ...` (ON_ERROR_STOP makes psql exit non-zero).
--
-- NOTE: fixtures are inserted with session_replication_role = replica so we can
-- create profiles without matching auth.users rows and create protected polls
-- without firing the tier trigger. If your `profiles` table has NOT NULL columns
-- beyond (id, subscription_tier) with no default, add them to the inserts below.

BEGIN;

-- Fixed fixture ids (kept obviously fake).
--   paid owner  : 000...a1     free owner : 000...a2
--   open poll   : 000...b1     anon poll  : 000...b2 (paid)
--   verified    : 000...b3 (paid)          free open  : 000...b4 (free)
--   options     : 000...c1/c2/c3            member token: 'TESTTOKEN0000000000000001'

SET session_replication_role = replica;  -- skip FK + triggers for fixtures

INSERT INTO profiles (id, subscription_tier) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'pro'),
  ('00000000-0000-0000-0000-0000000000a2', 'free');

INSERT INTO polls (id, code, user_id, question, allow_multiple, is_active,
                   has_time_limit, is_anonymous, requires_verification) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'TST-OPEN', '00000000-0000-0000-0000-0000000000a1', 'Open poll',      false, true, false, false, false),
  ('00000000-0000-0000-0000-0000000000b2', 'TST-ANON', '00000000-0000-0000-0000-0000000000a1', 'Anonymous poll', false, true, false, true,  false),
  ('00000000-0000-0000-0000-0000000000b3', 'TST-VERI', '00000000-0000-0000-0000-0000000000a1', 'Verified poll',  false, true, false, false, true),
  ('00000000-0000-0000-0000-0000000000b4', 'TST-FREE', '00000000-0000-0000-0000-0000000000a2', 'Free open poll', false, true, false, false, false);

INSERT INTO poll_options (id, poll_id, text, option_order) VALUES
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'A', 1),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b2', 'A', 1),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b3', 'A', 1);

INSERT INTO poll_members (id, poll_id, token, label) VALUES
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b3',
   'TESTTOKEN0000000000000001', 'Seat 1');

SET session_replication_role = DEFAULT;  -- triggers + FK back on for the tests

-- Helper: run the rest as a Supabase role with a JWT subject.
--   auth_as(role, sub) — sub NULL for the anon role.
-- (Implemented inline per section with SET LOCAL.)

-- ── 1. Direct client inserts on protected polls are rejected ────────────────
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
SET LOCAL ROLE authenticated;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO votes (poll_id, options, answers, user_id)
    VALUES ('00000000-0000-0000-0000-0000000000b2', '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb,
            '00000000-0000-0000-0000-0000000000a1');
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: direct insert on anonymous poll was allowed'; END IF;
  RAISE NOTICE 'ok: direct insert on anonymous poll rejected';
END $$;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO votes (poll_id, options, answers, user_id)
    VALUES ('00000000-0000-0000-0000-0000000000b3', '["00000000-0000-0000-0000-0000000000c3"]'::jsonb, '{}'::jsonb,
            '00000000-0000-0000-0000-0000000000a1');
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: direct insert on verified poll was allowed'; END IF;
  RAISE NOTICE 'ok: direct insert on verified poll rejected';
END $$;

RESET ROLE;

-- Non-owner (a different authenticated user who may not even see the poll row).
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
SET LOCAL ROLE authenticated;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO votes (poll_id, options, answers, user_id)
    VALUES ('00000000-0000-0000-0000-0000000000b2', '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb,
            '00000000-0000-0000-0000-0000000000a2');
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: non-owner direct insert on anonymous poll was allowed'; END IF;
  RAISE NOTICE 'ok: non-owner direct insert on anonymous poll rejected (helper not fooled by RLS)';
END $$;

RESET ROLE;

-- ── 2. Open poll: direct client insert still works ──────────────────────────
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  INSERT INTO votes (poll_id, options, answers, user_id)
  VALUES ('00000000-0000-0000-0000-0000000000b1', '["00000000-0000-0000-0000-0000000000c1"]'::jsonb, '{}'::jsonb,
          '00000000-0000-0000-0000-0000000000a1');
  RAISE NOTICE 'ok: direct insert on open poll accepted';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: direct insert on open poll was rejected: %', SQLERRM;
END $$;

RESET ROLE;

-- ── 3. Helper sees the real flags even under the anon role ──────────────────
SET LOCAL request.jwt.claims = '{"role":"anon"}';
SET LOCAL ROLE anon;

DO $$
BEGIN
  IF NOT public.poll_uses_protected_voting('00000000-0000-0000-0000-0000000000b2') THEN
    RAISE EXCEPTION 'FAIL: helper returned false for an anonymous poll under anon role';
  END IF;
  RAISE NOTICE 'ok: poll_uses_protected_voting() sees flags under anon role';
END $$;

-- ── 4. Verified voting: no token / valid once / reuse rejected ──────────────
DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b3', NULL, NULL,
                               '["00000000-0000-0000-0000-0000000000c3"]'::jsonb, '{}'::jsonb);
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: verified vote with no token was accepted'; END IF;
  RAISE NOTICE 'ok: verified vote without a token rejected';
END $$;

DO $$
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b3', 'TESTTOKEN0000000000000001', NULL,
                             '["00000000-0000-0000-0000-0000000000c3"]'::jsonb, '{}'::jsonb);
  RAISE NOTICE 'ok: verified vote with a valid token accepted';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: valid member token rejected: %', SQLERRM;
END $$;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b3', 'TESTTOKEN0000000000000001', NULL,
                               '["00000000-0000-0000-0000-0000000000c3"]'::jsonb, '{}'::jsonb);
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: reused member token was accepted'; END IF;
  RAISE NOTICE 'ok: reused member token rejected';
END $$;

-- ── 5a. Anonymous dedup — guest fingerprint ─────────────────────────────────
DO $$
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b2', NULL, 'fp-guest-1',
                             '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb);
  RAISE NOTICE 'ok: guest fingerprint vote accepted';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: first guest fingerprint vote rejected: %', SQLERRM;
END $$;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b2', NULL, 'fp-guest-1',
                               '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb);
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: duplicate guest fingerprint vote was accepted'; END IF;
  RAISE NOTICE 'ok: duplicate guest fingerprint vote rejected';
END $$;

DO $$
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b2', NULL, 'fp-guest-2',
                             '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb);
  RAISE NOTICE 'ok: a different guest fingerprint can vote';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: second distinct guest fingerprint rejected: %', SQLERRM;
END $$;

RESET ROLE;

-- ── 5b. Anonymous dedup — signed-in account ─────────────────────────────────
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b2', NULL, NULL,
                             '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb);
  RAISE NOTICE 'ok: signed-in anonymous vote accepted';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: signed-in anonymous vote rejected: %', SQLERRM;
END $$;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b2', NULL, NULL,
                               '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb);
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: duplicate signed-in anonymous vote was accepted'; END IF;
  RAISE NOTICE 'ok: duplicate signed-in anonymous vote rejected';
END $$;

RESET ROLE;

-- ── 6. Tier trigger: Free owner can't enable a flag; paid can ───────────────
DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    UPDATE polls SET is_anonymous = true WHERE id = '00000000-0000-0000-0000-0000000000b4';
  EXCEPTION WHEN others THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: Free owner enabled anonymous voting via direct update'; END IF;
  RAISE NOTICE 'ok: Free owner cannot enable a voting feature';
END $$;

DO $$
BEGIN
  UPDATE polls SET requires_verification = true WHERE id = '00000000-0000-0000-0000-0000000000b1';
  RAISE NOTICE 'ok: paid owner can enable a voting feature';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: paid owner blocked from enabling a voting feature: %', SQLERRM;
END $$;

-- ── 7. Downgraded owner: an active protected poll still accepts votes ───────
UPDATE profiles SET subscription_tier = 'free' WHERE id = '00000000-0000-0000-0000-0000000000a1';

SET LOCAL request.jwt.claims = '{"role":"anon"}';
SET LOCAL ROLE anon;

DO $$
BEGIN
  PERFORM cast_verified_vote('00000000-0000-0000-0000-0000000000b2', NULL, 'fp-after-downgrade',
                             '["00000000-0000-0000-0000-0000000000c2"]'::jsonb, '{}'::jsonb);
  RAISE NOTICE 'ok: downgraded owner''s active poll still accepts votes (grandfathered)';
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'FAIL: downgraded owner''s poll rejected a vote: %', SQLERRM;
END $$;

RESET ROLE;
UPDATE profiles SET subscription_tier = 'pro' WHERE id = '00000000-0000-0000-0000-0000000000a1';

-- ── 8. Turnout is visible to the owner (aggregate only) ─────────────────────
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
SET LOCAL ROLE authenticated;

DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM get_poll_turnout('00000000-0000-0000-0000-0000000000b3');
  IF r.used <> 1 OR r.total <> 1 THEN
    RAISE EXCEPTION 'FAIL: turnout expected 1/1, got %/%', r.used, r.total;
  END IF;
  RAISE NOTICE 'ok: turnout reports % of %', r.used, r.total;
END $$;

-- ── 9. Owner cannot read used_at, app_secrets, or poll_anon_salts ───────────
DO $$
DECLARE blocked boolean := false; v timestamptz;
BEGIN
  BEGIN
    SELECT used_at INTO v FROM poll_members WHERE poll_id = '00000000-0000-0000-0000-0000000000b3' LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'FAIL: owner could read poll_members.used_at'; END IF;
  RAISE NOTICE 'ok: owner cannot read poll_members.used_at';
END $$;

DO $$
DECLARE label_ok boolean := false; v text;
BEGIN
  SELECT label INTO v FROM poll_members WHERE poll_id = '00000000-0000-0000-0000-0000000000b3' LIMIT 1;
  IF v = 'Seat 1' THEN label_ok := true; END IF;
  IF NOT label_ok THEN RAISE EXCEPTION 'FAIL: owner could not read the allowed label column'; END IF;
  RAISE NOTICE 'ok: owner can read allowed columns (label)';
END $$;

DO $$
DECLARE blocked boolean := false; v bytea;
BEGIN
  BEGIN
    SELECT pepper INTO v FROM app_secrets LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'FAIL: owner could read app_secrets'; END IF;
  RAISE NOTICE 'ok: owner cannot read app_secrets';
END $$;

DO $$
DECLARE blocked boolean := false; v bytea;
BEGIN
  BEGIN
    SELECT salt INTO v FROM poll_anon_salts LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'FAIL: owner could read poll_anon_salts'; END IF;
  RAISE NOTICE 'ok: owner cannot read poll_anon_salts';
END $$;

RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL TESTS PASSED'; END $$;

ROLLBACK;
