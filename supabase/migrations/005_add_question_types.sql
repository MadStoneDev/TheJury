-- Migration: Add support for new question types
-- Adds answers column to votes, image_url to poll_options, poll_responses table

-- 1. Add answers JSONB column to votes for structured per-question data
-- Used by rating_scale, ranked_choice (not multiple_choice which uses options column)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';

-- 2. Add image_url to poll_options for image_choice question type
ALTER TABLE poll_options ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Create poll_responses table for open-ended text responses
CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES poll_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    voter_fingerprint TEXT,
    response_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for poll_responses
CREATE INDEX IF NOT EXISTS idx_poll_responses_question_id ON poll_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);

-- 5. Enable RLS on poll_responses
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read poll responses (needed for results display)
CREATE POLICY "Anyone can read poll responses" ON poll_responses
    FOR SELECT USING (true);

-- Anyone can insert poll responses (anonymous voting supported)
CREATE POLICY "Anyone can insert poll responses" ON poll_responses
    FOR INSERT WITH CHECK (true);

-- Poll owners can delete responses
CREATE POLICY "Poll owners can delete responses" ON poll_responses
    FOR DELETE USING (
        poll_id IN (SELECT id FROM polls WHERE user_id = auth.uid())
    );
