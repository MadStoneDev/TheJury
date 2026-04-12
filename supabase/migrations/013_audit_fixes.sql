-- Migration: Security & integrity hardening from audit (2026-04-13)

-- =====================================================
-- 1. Vote uniqueness (prevents race-condition double votes)
-- =====================================================
-- Drop any pre-existing partial/unique index if present, then recreate as UNIQUE.
-- Uses partial unique indexes so NULL user_id / NULL fingerprint rows do not collide.

-- 1a. Deduplicate existing votes before creating unique indexes.
--     Keep the earliest vote per (poll, user) and (poll, fingerprint) pair.
WITH ranked_user_votes AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY poll_id, user_id
               ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM votes
    WHERE user_id IS NOT NULL
)
DELETE FROM votes
WHERE id IN (SELECT id FROM ranked_user_votes WHERE rn > 1);

WITH ranked_fp_votes AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY poll_id, voter_fingerprint
               ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM votes
    WHERE user_id IS NULL AND voter_fingerprint IS NOT NULL
)
DELETE FROM votes
WHERE id IN (SELECT id FROM ranked_fp_votes WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_user_per_poll
    ON votes (poll_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_fingerprint_per_poll
    ON votes (poll_id, voter_fingerprint)
    WHERE voter_fingerprint IS NOT NULL AND user_id IS NULL;

-- =====================================================
-- 2. Stripe webhook idempotency
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: only service-role (webhook handler) may access.

-- =====================================================
-- 3. Tighten poll_responses RLS
--    Previously: "Anyone can read poll responses" (blanket SELECT true)
--    Now: only poll owner, team members (if team poll), or the submitter.
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read poll responses" ON poll_responses;

CREATE POLICY "Poll owners can read responses" ON poll_responses
    FOR SELECT USING (
        poll_id IN (SELECT id FROM polls WHERE user_id = auth.uid())
    );

CREATE POLICY "Team members can read team poll responses" ON poll_responses
    FOR SELECT USING (
        poll_id IN (
            SELECT p.id FROM polls p
            INNER JOIN team_members tm ON tm.team_id = p.team_id
            WHERE tm.user_id = auth.uid() AND p.team_id IS NOT NULL
        )
    );

CREATE POLICY "Submitters can read own responses" ON poll_responses
    FOR SELECT USING (user_id IS NOT NULL AND user_id = auth.uid());

-- =====================================================
-- 4. Webhook secret storage note
--    Outgoing webhook HMAC signing requires plaintext secret access, so we
--    cannot one-way hash it. Instead:
--      - Mark secret as never-select-by-default in API layers (code-side).
--      - Future work: encrypt at rest with pgsodium.
--    For now we add a column comment to make the sensitivity explicit.
-- =====================================================
COMMENT ON COLUMN webhooks.secret IS
    'SENSITIVE: plaintext HMAC signing key. Never return in list/get API responses — only show once on create. TODO: encrypt via pgsodium.';
