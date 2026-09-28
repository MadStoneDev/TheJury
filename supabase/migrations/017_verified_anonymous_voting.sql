-- 017_verified_anonymous_voting.sql
-- Anonymous voting + verified (one-link-per-member) voting.
--
-- Design notes (see docs/anonymous-verified-voting-plan.md):
--  * Votes for anonymous/verified polls are cast ONLY through the SECURITY
--    DEFINER function cast_verified_vote(). It bypasses RLS, so it validates
--    everything itself: tier, active/time-window, option membership, and the
--    member token. Open non-anonymous polls keep the existing client insert.
--  * Anonymity is FROM THE POLL OWNER. The owner can see tallies and turnout
--    (used/total), never who cast which ballot, and never per-member timing.
--  * anon_hash is computed server-side inside the function from auth.uid() and
--    a per-poll salt combined with a global pepper. The client never supplies
--    it, and neither salt nor pepper is readable by any app role.
--  * A guest (not signed in) voting on an anonymous poll has no server-side
--    identifier, so repeat voting cannot be fully prevented — verified voting
--    is the mechanism when one-vote-per-person must be guaranteed.
--
-- Safe to run more than once.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Poll-level flags ────────────────────────────────────────────────────────
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_verification boolean NOT NULL DEFAULT false;

-- ── Secrets: never readable by any app role ──────────────────────────────────
-- Global pepper (one row). RLS on + no policy + REVOKE => unreachable via
-- PostgREST. SECURITY DEFINER functions (owned by the migration role) read it.
CREATE TABLE IF NOT EXISTS public.app_secrets (
  id     smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pepper bytea NOT NULL
);
INSERT INTO public.app_secrets (id, pepper)
  VALUES (1, gen_random_bytes(32))
  ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_secrets FROM anon, authenticated;

-- Per-poll random salt for anonymous dedup hashing. Not in the polls table, and
-- not readable by the poll owner, so the owner cannot recompute anon_hash.
CREATE TABLE IF NOT EXISTS public.poll_anon_salts (
  poll_id uuid PRIMARY KEY REFERENCES public.polls(id) ON DELETE CASCADE,
  salt    bytea NOT NULL DEFAULT gen_random_bytes(16)
);
ALTER TABLE public.poll_anon_salts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.poll_anon_salts FROM anon, authenticated;

-- ── Member roll for verified voting ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.poll_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  token      text NOT NULL,          -- url-safe, from gen_random_bytes(24)
  label      text NOT NULL,          -- required, e.g. "Seat 14" or a name
  email      text,                   -- optional, for later email distribution
  used_at    timestamptz,            -- null until redeemed
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS poll_members_token_key
  ON public.poll_members (token);
CREATE INDEX IF NOT EXISTS poll_members_poll_idx
  ON public.poll_members (poll_id);

ALTER TABLE public.poll_members ENABLE ROW LEVEL SECURITY;

-- Owners may read their roll (to distribute links) but NOT used_at — that would
-- let them correlate redemption times with vote timestamps. used_at is exposed
-- only as an aggregate via get_poll_turnout(). Writes go through the definer
-- functions below, so no INSERT/UPDATE grant here.
REVOKE ALL ON public.poll_members FROM anon, authenticated;
GRANT SELECT (id, poll_id, token, label, email, created_at)
  ON public.poll_members TO authenticated;
GRANT DELETE ON public.poll_members TO authenticated;

DROP POLICY IF EXISTS "Owners read their poll members" ON public.poll_members;
CREATE POLICY "Owners read their poll members" ON public.poll_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.polls p
            WHERE p.id = poll_members.poll_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Owners delete their poll members" ON public.poll_members;
CREATE POLICY "Owners delete their poll members" ON public.poll_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.polls p
            WHERE p.id = poll_members.poll_id AND p.user_id = auth.uid())
  );

-- ── Vote columns for dedup / linkage ─────────────────────────────────────────
-- anon_hash: set only for signed-in anonymous voters (dedup, unlinkable).
-- member_id: set ONLY for verified + NON-anonymous polls. For verified +
--            anonymous polls it stays NULL so the ballot cannot be linked to a
--            member; one-vote is enforced by consuming the token instead.
ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS anon_hash text,
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.poll_members(id);
CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_anon_per_poll
  ON public.votes (poll_id, anon_hash) WHERE anon_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_member_per_poll
  ON public.votes (poll_id, member_id) WHERE member_id IS NOT NULL;

-- ── add_poll_members: generate the roll (owner + tier checked) ───────────────
-- Returns the created rows (with tokens) so the owner can download the links.
CREATE OR REPLACE FUNCTION public.add_poll_members(
  p_poll_id uuid,
  p_members jsonb          -- [{ "label": "...", "email": "..."? }, ...]
)
RETURNS TABLE (id uuid, label text, email text, token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_tier  text;
BEGIN
  SELECT user_id INTO v_owner FROM polls WHERE polls.id = p_poll_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  SELECT subscription_tier INTO v_tier FROM profiles WHERE profiles.id = v_owner;
  IF coalesce(v_tier, 'free') NOT IN ('pro', 'team') THEN
    RAISE EXCEPTION 'verified voting is not available on this plan';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_members) x
    WHERE coalesce(nullif(x->>'label', ''), '') = ''
  ) THEN
    RAISE EXCEPTION 'every member needs a label';
  END IF;

  RETURN QUERY
  WITH ins AS (
    INSERT INTO poll_members (poll_id, label, email, token)
    SELECT
      p_poll_id,
      nullif(x->>'label', ''),
      nullif(x->>'email', ''),
      replace(replace(replace(encode(gen_random_bytes(24), 'base64'),
              '+', '-'), '/', '_'), '=', '')
    FROM jsonb_array_elements(p_members) AS x
    RETURNING poll_members.id, poll_members.label,
              poll_members.email, poll_members.token
  )
  SELECT ins.id, ins.label, ins.email, ins.token FROM ins;
END $$;

-- ── get_poll_turnout: aggregate only (used / total), never timestamps ────────
CREATE OR REPLACE FUNCTION public.get_poll_turnout(p_poll_id uuid)
RETURNS TABLE (used bigint, total bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM polls WHERE polls.id = p_poll_id AND polls.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  RETURN QUERY
  SELECT count(*) FILTER (WHERE used_at IS NOT NULL), count(*)
  FROM poll_members WHERE poll_members.poll_id = p_poll_id;
END $$;

-- ── cast_verified_vote: the only vote path for anonymous/verified polls ──────
CREATE OR REPLACE FUNCTION public.cast_verified_vote(
  p_poll_id uuid,
  p_token   text,           -- required iff the poll requires verification
  p_options jsonb,          -- array of option ids (text)
  p_answers jsonb           -- structured answers ({} if none)
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_poll        polls%ROWTYPE;
  v_tier        text;
  v_member      poll_members%ROWTYPE;
  v_qcount      int;
  v_member_id   uuid := NULL;
  v_anon_hash   text := NULL;
  v_salt        bytea;
  v_pepper      bytea;
BEGIN
  SELECT * INTO v_poll FROM polls WHERE polls.id = p_poll_id;
  IF v_poll.id IS NULL THEN
    RAISE EXCEPTION 'poll not found';
  END IF;

  -- This path is only for anonymous or verified polls.
  IF NOT (v_poll.is_anonymous OR v_poll.requires_verification) THEN
    RAISE EXCEPTION 'this poll does not use verified or anonymous voting';
  END IF;

  -- Owner's tier must allow the enabled feature(s).
  SELECT subscription_tier INTO v_tier FROM profiles WHERE profiles.id = v_poll.user_id;
  IF coalesce(v_tier, 'free') NOT IN ('pro', 'team') THEN
    RAISE EXCEPTION 'this poll''s features are not available on its owner''s plan';
  END IF;

  -- Active + time window.
  IF NOT v_poll.is_active THEN
    RAISE EXCEPTION 'poll is not active';
  END IF;
  IF v_poll.has_time_limit THEN
    IF v_poll.start_date IS NOT NULL AND v_poll.start_date > now() THEN
      RAISE EXCEPTION 'voting has not started yet';
    END IF;
    IF v_poll.end_date IS NOT NULL AND v_poll.end_date < now() THEN
      RAISE EXCEPTION 'voting has ended';
    END IF;
  END IF;

  -- Every submitted option must belong to this poll.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(p_options) elem
    WHERE NOT EXISTS (
      SELECT 1 FROM poll_options po
      WHERE po.poll_id = p_poll_id AND po.id::text = elem
    )
  ) THEN
    RAISE EXCEPTION 'invalid option for this poll';
  END IF;

  -- Single-question polls honour allow_multiple (multi-question polls validate
  -- per question client-side, as with the open vote path).
  SELECT count(*) INTO v_qcount FROM poll_questions WHERE poll_questions.poll_id = p_poll_id;
  IF coalesce(v_qcount, 1) <= 1
     AND NOT v_poll.allow_multiple
     AND jsonb_array_length(p_options) > 1 THEN
    RAISE EXCEPTION 'this poll only allows a single selection';
  END IF;

  -- Verified: token required, valid, unused. Lock the row to consume it atomically.
  IF v_poll.requires_verification THEN
    IF p_token IS NULL OR p_token = '' THEN
      RAISE EXCEPTION 'a member link is required to vote in this poll';
    END IF;
    SELECT * INTO v_member FROM poll_members
      WHERE poll_members.poll_id = p_poll_id AND poll_members.token = p_token
      FOR UPDATE;
    IF v_member.id IS NULL THEN
      RAISE EXCEPTION 'invalid member link';
    END IF;
    IF v_member.used_at IS NOT NULL THEN
      RAISE EXCEPTION 'this member link has already been used';
    END IF;
    -- Store the member link only when the poll is NOT anonymous, so an
    -- anonymous verified ballot cannot be tied back to a member.
    IF NOT v_poll.is_anonymous THEN
      v_member_id := v_member.id;
    END IF;
  END IF;

  -- Anonymous: derive a per-poll, peppered hash of the signed-in voter. Guests
  -- (auth.uid() null) get no hash — repeat voting is not preventable for them.
  IF v_poll.is_anonymous AND auth.uid() IS NOT NULL THEN
    INSERT INTO poll_anon_salts (poll_id) VALUES (p_poll_id)
      ON CONFLICT (poll_id) DO NOTHING;
    SELECT salt INTO v_salt FROM poll_anon_salts WHERE poll_anon_salts.poll_id = p_poll_id;
    SELECT pepper INTO v_pepper FROM app_secrets WHERE app_secrets.id = 1;
    v_anon_hash := encode(
      hmac(convert_to(auth.uid()::text, 'UTF8'), v_salt || v_pepper, 'sha256'),
      'hex'
    );
  END IF;

  -- Never store user_id on anonymous/verified ballots.
  BEGIN
    INSERT INTO votes (poll_id, options, answers, anon_hash, member_id, user_id)
    VALUES (p_poll_id, p_options, coalesce(p_answers, '{}'::jsonb),
            v_anon_hash, v_member_id, NULL);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'you have already voted in this poll';
  END;

  IF v_poll.requires_verification THEN
    UPDATE poll_members SET used_at = now() WHERE poll_members.id = v_member.id;
  END IF;
END $$;

-- ── Execution grants ─────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.add_poll_members(uuid, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.get_poll_turnout(uuid) FROM public;
REVOKE ALL ON FUNCTION public.cast_verified_vote(uuid, text, jsonb, jsonb) FROM public;

GRANT EXECUTE ON FUNCTION public.add_poll_members(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_poll_turnout(uuid) TO authenticated;
-- Guests must be able to redeem a member link, so anon may execute the vote fn.
GRANT EXECUTE ON FUNCTION public.cast_verified_vote(uuid, text, jsonb, jsonb)
  TO anon, authenticated;
