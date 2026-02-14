-- Migration: Add A/B testing support

-- Experiments table - links to a poll
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id)
);

-- Variants table - each experiment has 2+ variants
CREATE TABLE IF NOT EXISTS poll_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Variant A", "Variant B"
    question_text TEXT NOT NULL, -- different wording for this variant
    weight INTEGER NOT NULL DEFAULT 50, -- percentage weight for assignment
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which variant each user saw
CREATE TABLE IF NOT EXISTS user_variant_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES poll_variants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    voter_fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_experiments_poll ON ab_experiments(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_variants_experiment ON poll_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_experiment ON user_variant_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_user ON user_variant_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_fingerprint ON user_variant_assignments(voter_fingerprint);

-- RLS
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_variant_assignments ENABLE ROW LEVEL SECURITY;

-- Policies: experiment owner can manage via poll ownership
CREATE POLICY "Users can manage own AB experiments" ON ab_experiments
    FOR ALL USING (poll_id IN (SELECT id FROM polls WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own poll variants" ON poll_variants
    FOR ALL USING (experiment_id IN (
        SELECT id FROM ab_experiments WHERE poll_id IN (SELECT id FROM polls WHERE user_id = auth.uid())
    ));

-- Anyone can read/insert variant assignments (for voting)
CREATE POLICY "Anyone can read variant assignments" ON user_variant_assignments
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create variant assignments" ON user_variant_assignments
    FOR INSERT WITH CHECK (true);
