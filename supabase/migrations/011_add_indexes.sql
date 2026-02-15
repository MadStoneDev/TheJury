-- Performance indexes for frequently queried columns

-- polls: code lookups (getPollByCode)
CREATE INDEX IF NOT EXISTS idx_polls_code ON polls(code);

-- polls: user_id lookups (getUserPolls, getActivePollCount)
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);

-- poll_options: poll_id lookups (getPollResults)
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

-- votes: poll_id + user_id composite (hasUserVoted, submitVote duplicate check)
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON votes(poll_id, user_id) WHERE user_id IS NOT NULL;

-- votes: poll_id + fingerprint composite (anonymous vote duplicate check)
CREATE INDEX IF NOT EXISTS idx_votes_poll_fingerprint ON votes(poll_id, voter_fingerprint) WHERE voter_fingerprint IS NOT NULL;

-- poll_questions: poll_id lookups
CREATE INDEX IF NOT EXISTS idx_poll_questions_poll_id ON poll_questions(poll_id);

-- Indexes for tables that may not exist yet (created in migrations 009/010)
-- api_keys: key_hash lookups (API auth)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
  END IF;
END $$;

-- webhooks: user_id + is_active (webhook dispatch)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    CREATE INDEX IF NOT EXISTS idx_webhooks_user_active ON webhooks(user_id, is_active) WHERE is_active = true;
  END IF;
END $$;
