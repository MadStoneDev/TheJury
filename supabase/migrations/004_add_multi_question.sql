-- Migration: Add multi-question support to polls
-- Creates poll_questions table, backfills existing polls, links poll_options to questions

-- 1. Create poll_questions table
CREATE TABLE IF NOT EXISTS poll_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice',
    question_order INTEGER NOT NULL DEFAULT 1,
    allow_multiple BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add question_id column to poll_options (nullable initially for backfill)
ALTER TABLE poll_options ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES poll_questions(id) ON DELETE CASCADE;

-- 3. Backfill: create a poll_question for each existing poll using polls.question
INSERT INTO poll_questions (poll_id, question_text, question_type, question_order, allow_multiple)
SELECT
    id AS poll_id,
    question AS question_text,
    'multiple_choice' AS question_type,
    1 AS question_order,
    allow_multiple
FROM polls
WHERE NOT EXISTS (
    SELECT 1 FROM poll_questions pq WHERE pq.poll_id = polls.id
);

-- 4. Link existing poll_options to their newly created poll_question
UPDATE poll_options
SET question_id = (
    SELECT pq.id
    FROM poll_questions pq
    WHERE pq.poll_id = poll_options.poll_id
    ORDER BY pq.question_order
    LIMIT 1
)
WHERE question_id IS NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poll_questions_poll_id ON poll_questions(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_question_id ON poll_options(question_id);

-- 6. Enable RLS on poll_questions
ALTER TABLE poll_questions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read poll questions (needed for voting)
CREATE POLICY "Anyone can read poll questions" ON poll_questions
    FOR SELECT USING (true);

-- RLS: Authenticated users can insert/update/delete their own poll's questions
CREATE POLICY "Users can manage their poll questions" ON poll_questions
    FOR ALL USING (
        poll_id IN (SELECT id FROM polls WHERE user_id = auth.uid())
    );
