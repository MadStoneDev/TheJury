-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_email TEXT,
    invite_status TEXT NOT NULL DEFAULT 'accepted' CHECK (invite_status IN ('pending', 'accepted', 'declined')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    UNIQUE(team_id, user_id)
);

-- Add team_id to polls (nullable - personal polls don't need a team)
ALTER TABLE polls ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team" ON teams
    FOR SELECT USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team owner can update team" ON teams
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owner can delete team" ON teams
    FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Members can view team members" ON team_members
    FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team admins can manage members" ON team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can view their own membership" ON team_members
    FOR SELECT USING (user_id = auth.uid());

-- Add brand_logo_url to profiles for custom embed branding (Team tier)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_logo_url TEXT DEFAULT NULL;
