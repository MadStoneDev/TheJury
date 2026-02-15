-- Phase 10: Live poll columns for real-time presenter mode
ALTER TABLE polls ADD COLUMN IF NOT EXISTS live_mode boolean DEFAULT false;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS live_state text DEFAULT 'accepting_votes'
  CHECK (live_state IN ('accepting_votes', 'results_hidden', 'results_revealed', 'closed'));
ALTER TABLE polls ADD COLUMN IF NOT EXISTS live_current_question integer DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_polls_live_mode ON polls(live_mode) WHERE live_mode = true;
