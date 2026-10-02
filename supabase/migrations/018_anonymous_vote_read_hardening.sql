-- 018_anonymous_vote_read_hardening.sql
-- Anonymous-ballot read hardening (follow-up to 017).
--
-- The base votes SELECT policies let the poll owner — and, via "Anyone can view
-- votes for active polls", any client — read raw vote rows for a poll. For an
-- anonymous poll the one genuinely sensitive field on those rows is the exact
-- `created_at`: it lets someone correlate a ballot with when a known person was
-- seen voting. (user_id / voter_fingerprint / member_id are already NULL on
-- anonymous ballots, and anon_hash is a non-reversible salt+pepper HMAC.)
--
-- Rather than hide columns (which would break the client-side tally that reads
-- options/answers, the analytics timestamp read, and the select("*") count
-- queries), we COARSEN the timestamp at the source: anonymous ballots store
-- created_at truncated to the day, so no reader — owner, public policy, or
-- analytics — ever sees a precise vote time. Non-anonymous polls are unchanged.
--
-- Only CREATE OR REPLACE + a one-time UPDATE; safe to run more than once.
-- (Take a backup first per the deploy checklist — this rewrites existing
-- anonymous vote timestamps.)

SET search_path = public, extensions;

-- ── Redefine cast_verified_vote to coarsen the timestamp for anonymous ballots
CREATE OR REPLACE FUNCTION public.cast_verified_vote(
  p_poll_id     uuid,
  p_token       text,       -- required iff the poll requires verification
  p_fingerprint text,       -- guest device fingerprint (anonymous polls); hashed here, never stored raw
  p_options     jsonb,      -- array of option ids (text)
  p_answers     jsonb       -- structured answers ({} if none)
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_poll        polls%ROWTYPE;
  v_member      poll_members%ROWTYPE;
  v_qcount      int;
  v_member_id   uuid := NULL;
  v_anon_hash   text := NULL;
  v_ident       text := NULL;
  v_salt        bytea;
  v_pepper      bytea;
  v_created_at  timestamptz;
BEGIN
  SELECT * INTO v_poll FROM polls WHERE polls.id = p_poll_id;
  IF v_poll.id IS NULL THEN
    RAISE EXCEPTION 'poll not found';
  END IF;

  -- This path is only for anonymous or verified polls.
  IF NOT (v_poll.is_anonymous OR v_poll.requires_verification) THEN
    RAISE EXCEPTION 'this poll does not use verified or anonymous voting';
  END IF;

  -- Tier is deliberately NOT re-checked here. The feature is gated when the poll
  -- is created (validatePollWriteForTier) and when the member roll is generated
  -- (add_poll_members). Re-checking the owner's CURRENT tier would stop an
  -- in-progress poll accepting votes if the owner downgraded mid-poll, so
  -- existing polls are grandfathered.

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

  -- Anonymous dedup by hashed identifier — ONLY for anonymous polls that are not
  -- also verified. For verified polls the single-use token is the dedup, so we
  -- must NOT add a fingerprint hash: two members voting from the same shared
  -- device would collide on anon_hash and the second, though holding a valid
  -- unused token, would be wrongly rejected. (A verified+anonymous ballot thus
  -- stores neither member_id nor anon_hash — fully unlinkable; the consumed
  -- token guarantees one vote.)
  --
  -- We never store a raw identifier. Prefer the signed-in account; otherwise the
  -- guest device fingerprint, with a domain-separator prefix so a uid and a
  -- fingerprint can't collide. A fingerprint is spoofable, so guest dedup is
  -- best-effort (verified voting is the hard guarantee) — but it restores the
  -- duplicate protection open polls have always had.
  IF v_poll.is_anonymous AND NOT v_poll.requires_verification THEN
    IF auth.uid() IS NOT NULL THEN
      v_ident := 'uid:' || auth.uid()::text;
    ELSIF p_fingerprint IS NOT NULL AND p_fingerprint <> '' THEN
      v_ident := 'fp:' || p_fingerprint;
    END IF;

    IF v_ident IS NOT NULL THEN
      INSERT INTO poll_anon_salts (poll_id) VALUES (p_poll_id)
        ON CONFLICT (poll_id) DO NOTHING;
      SELECT salt INTO v_salt FROM poll_anon_salts WHERE poll_anon_salts.poll_id = p_poll_id;
      SELECT pepper INTO v_pepper FROM app_secrets WHERE app_secrets.id = 1;
      v_anon_hash := encode(
        hmac(convert_to(v_ident, 'UTF8'), v_salt || v_pepper, 'sha256'),
        'hex'
      );
    END IF;
  END IF;

  -- Coarsen the stored timestamp for anonymous ballots so no reader can
  -- correlate a vote's exact moment with a known person. Non-anonymous ballots
  -- keep a precise time.
  v_created_at := CASE
    WHEN v_poll.is_anonymous THEN date_trunc('day', now())
    ELSE now()
  END;

  -- Never store user_id on anonymous/verified ballots.
  BEGIN
    INSERT INTO votes (poll_id, options, answers, anon_hash, member_id, user_id, created_at)
    VALUES (p_poll_id, p_options, coalesce(p_answers, '{}'::jsonb),
            v_anon_hash, v_member_id, NULL, v_created_at);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'you have already voted in this poll';
  END;

  IF v_poll.requires_verification THEN
    UPDATE poll_members SET used_at = now() WHERE poll_members.id = v_member.id;
  END IF;
END $$;

-- ── Retro-coarsen any anonymous ballots already cast under 017 ───────────────
UPDATE public.votes v
SET created_at = date_trunc('day', v.created_at)
FROM public.polls p
WHERE p.id = v.poll_id
  AND p.is_anonymous = true
  AND v.created_at <> date_trunc('day', v.created_at);
