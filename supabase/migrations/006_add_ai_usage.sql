-- Migration: Add AI poll generation usage tracking

CREATE TABLE IF NOT EXISTS ai_poll_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- e.g. "2026-02"
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_poll_usage_user_month ON ai_poll_usage(user_id, month_year);

-- RLS
ALTER TABLE ai_poll_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can read own AI usage" ON ai_poll_usage
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert/update their own usage
CREATE POLICY "Users can manage own AI usage" ON ai_poll_usage
    FOR ALL USING (user_id = auth.uid());
