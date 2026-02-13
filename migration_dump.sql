-- ============================================================================
-- TheJury - Supabase Schema Export Utility
-- ============================================================================
--
-- HOW TO USE THIS FILE:
-- ---------------------
-- 1. Open your CLOUD Supabase project dashboard (the source)
-- 2. Navigate to the SQL Editor
-- 3. Copy ONE section at a time (between the === separator lines)
-- 4. Paste it into the SQL Editor and click "Run"
-- 5. The result will be a SINGLE cell containing all the SQL for that section
-- 6. Click on the cell, select all, and copy the raw text
-- 7. Save/paste it into your migration script for the self-hosted instance
-- 8. Repeat for each section
--
-- EXECUTION ORDER on the self-hosted instance:
--   1. Extensions
--   2. Custom Types/Enums
--   3. Sequences
--   4. Table Definitions
--   5. Primary Keys and Unique Constraints
--   6. Foreign Keys
--   7. Indexes
--   8. Functions
--   9. Triggers
--  10. RLS Enable
--  11. RLS Policies
--  12. Grants
--  13. Data Export (reference tables)
--
-- ============================================================================


-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================
SELECT string_agg(
    'CREATE EXTENSION IF NOT EXISTS "' || extname || '" WITH SCHEMA ' || COALESCE(nspname, 'public') || ';',
    chr(10) ORDER BY extname
) AS ddl
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname != 'plpgsql';


-- ============================================================================
-- SECTION 2: CUSTOM TYPES / ENUMS
-- ============================================================================
SELECT string_agg(
    type_ddl,
    chr(10) ORDER BY type_ddl
) AS ddl
FROM (
    SELECT 'CREATE TYPE public.' || t.typname || ' AS ENUM (' ||
           string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder) ||
           ');' AS type_ddl
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
) sub;


-- ============================================================================
-- SECTION 3: SEQUENCES
-- ============================================================================
SELECT string_agg(
    'CREATE SEQUENCE IF NOT EXISTS public.' || quote_ident(sequencename) ||
    ' AS ' || data_type ||
    ' INCREMENT BY ' || increment_by ||
    ' MINVALUE ' || min_value ||
    ' MAXVALUE ' || max_value ||
    ' START WITH ' || start_value ||
    CASE WHEN cycle THEN ' CYCLE' ELSE ' NO CYCLE' END || ';',
    chr(10) ORDER BY sequencename
) AS ddl
FROM pg_sequences
WHERE schemaname = 'public';


-- ============================================================================
-- SECTION 3b: SEQUENCE OWNERSHIP
-- ============================================================================
SELECT string_agg(
    'ALTER SEQUENCE public.' || quote_ident(s.relname) ||
    ' OWNED BY public.' || quote_ident(t.relname) || '.' || quote_ident(a.attname) || ';',
    chr(10) ORDER BY s.relname
) AS ddl
FROM pg_class s
JOIN pg_namespace ns ON s.relnamespace = ns.oid
JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
JOIN pg_class t ON d.refobjid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
WHERE s.relkind = 'S'
  AND ns.nspname = 'public';


-- ============================================================================
-- SECTION 4: TABLE DEFINITIONS
-- ============================================================================
SELECT string_agg(
    table_ddl,
    chr(10) || chr(10) ORDER BY table_name
) AS ddl
FROM (
    SELECT c.table_name,
           'CREATE TABLE IF NOT EXISTS public.' || c.table_name || ' (' || chr(10) ||
           string_agg(
               '    ' || c.column_name || ' ' || c.full_type ||
               CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
               CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END,
               ',' || chr(10) ORDER BY c.ordinal_position
           ) || chr(10) || ');' AS table_ddl
    FROM (
        SELECT
            cols.table_name,
            cols.column_name,
            cols.ordinal_position,
            cols.is_nullable,
            cols.column_default,
            CASE
                WHEN cols.data_type = 'ARRAY' THEN cols.udt_name || '[]'
                WHEN cols.data_type = 'USER-DEFINED' THEN cols.udt_name
                WHEN cols.character_maximum_length IS NOT NULL THEN
                    cols.data_type || '(' || cols.character_maximum_length || ')'
                WHEN cols.data_type = 'numeric' AND cols.numeric_precision IS NOT NULL THEN
                    cols.data_type || '(' || cols.numeric_precision || ',' || cols.numeric_scale || ')'
                ELSE cols.data_type
            END AS full_type
        FROM information_schema.columns cols
        WHERE cols.table_schema = 'public'
          AND cols.table_name NOT LIKE 'pg_%'
    ) c
    GROUP BY c.table_name
) sub;


-- ============================================================================
-- SECTION 5: PRIMARY KEYS AND UNIQUE CONSTRAINTS
-- ============================================================================
SELECT string_agg(
    constraint_ddl,
    chr(10) ORDER BY constraint_ddl
) AS ddl
FROM (
    SELECT 'ALTER TABLE public.' || tc.table_name ||
           ' ADD CONSTRAINT ' || tc.constraint_name ||
           CASE tc.constraint_type
               WHEN 'PRIMARY KEY' THEN ' PRIMARY KEY ('
               WHEN 'UNIQUE' THEN ' UNIQUE ('
           END ||
           string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) ||
           ');' AS constraint_ddl
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
) sub;


-- ============================================================================
-- SECTION 6: FOREIGN KEYS
-- ============================================================================
SELECT string_agg(
    fk_ddl,
    chr(10) ORDER BY fk_ddl
) AS ddl
FROM (
    SELECT 'ALTER TABLE public.' || tc.table_name ||
           ' ADD CONSTRAINT ' || tc.constraint_name ||
           ' FOREIGN KEY (' ||
           string_agg(DISTINCT kcu.column_name, ', ' ORDER BY kcu.column_name) ||
           ') REFERENCES public.' || ccu.table_name ||
           ' (' || string_agg(DISTINCT ccu.column_name, ', ' ORDER BY ccu.column_name) || ')' ||
           CASE rc.delete_rule
               WHEN 'CASCADE' THEN ' ON DELETE CASCADE'
               WHEN 'SET NULL' THEN ' ON DELETE SET NULL'
               WHEN 'SET DEFAULT' THEN ' ON DELETE SET DEFAULT'
               WHEN 'RESTRICT' THEN ' ON DELETE RESTRICT'
               ELSE ''
           END ||
           CASE rc.update_rule
               WHEN 'CASCADE' THEN ' ON UPDATE CASCADE'
               WHEN 'SET NULL' THEN ' ON UPDATE SET NULL'
               WHEN 'SET DEFAULT' THEN ' ON UPDATE SET DEFAULT'
               WHEN 'RESTRICT' THEN ' ON UPDATE RESTRICT'
               ELSE ''
           END || ';' AS fk_ddl
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
    GROUP BY tc.table_name, tc.constraint_name, ccu.table_name, rc.delete_rule, rc.update_rule
) sub;


-- ============================================================================
-- SECTION 7: INDEXES (excluding PK/unique which were created in Section 5)
-- ============================================================================
SELECT string_agg(
    indexdef || ';',
    chr(10) ORDER BY tablename, indexname
) AS ddl
FROM pg_indexes i
WHERE i.schemaname = 'public'
  AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.constraint_name = i.indexname
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
  );


-- ============================================================================
-- SECTION 8: FUNCTIONS
-- ============================================================================
SELECT string_agg(
    pg_get_functiondef(p.oid) || ';',
    chr(10) || chr(10) ORDER BY p.proname
) AS ddl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';


-- ============================================================================
-- SECTION 9: TRIGGERS
-- ============================================================================
SELECT string_agg(
    pg_get_triggerdef(t.oid, true) || ';',
    chr(10) ORDER BY c.relname, t.tgname
) AS ddl
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal;


-- ============================================================================
-- SECTION 10: RLS ENABLE
-- ============================================================================
SELECT string_agg(
    'ALTER TABLE public.' || quote_ident(tablename) || ' ENABLE ROW LEVEL SECURITY;',
    chr(10) ORDER BY tablename
) AS ddl
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;


-- ============================================================================
-- SECTION 11: RLS POLICIES
-- ============================================================================
SELECT string_agg(
    'CREATE POLICY ' || quote_ident(policyname) ||
    ' ON public.' || quote_ident(tablename) ||
    CASE WHEN permissive = 'PERMISSIVE' THEN '' ELSE ' AS RESTRICTIVE' END ||
    ' FOR ' || cmd ||
    ' TO ' || array_to_string(roles, ', ') ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';',
    chr(10) || chr(10) ORDER BY tablename, policyname
) AS ddl
FROM pg_policies
WHERE schemaname = 'public';


-- ============================================================================
-- SECTION 12: TABLE GRANTS
-- ============================================================================
SELECT string_agg(
    'GRANT ' || privilege_type ||
    ' ON TABLE public.' || quote_ident(table_name) ||
    ' TO ' || grantee || ';',
    chr(10) ORDER BY table_name, grantee, privilege_type
) AS ddl
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role');


-- ============================================================================
-- SECTION 12b: FUNCTION GRANTS
-- ============================================================================
SELECT string_agg(
    'GRANT EXECUTE ON FUNCTION public.' ||
    p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' ||
    ' TO ' || acl.grantee || ';',
    chr(10) ORDER BY p.proname, acl.grantee
) AS ddl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN LATERAL (
    SELECT (aclexplode(p.proacl)).grantee AS grantee_oid,
           (aclexplode(p.proacl)).privilege_type AS privilege_type
) acl_raw
JOIN pg_roles r ON r.oid = acl_raw.grantee_oid
CROSS JOIN LATERAL (SELECT r.rolname AS grantee) acl
WHERE n.nspname = 'public'
  AND acl.grantee IN ('anon', 'authenticated', 'service_role');


-- ============================================================================
-- SECTION 13: DATA EXPORT
-- ============================================================================
-- Run these IN ORDER due to foreign key dependencies.
-- Insert order:
--   1. auth.users (needed by profiles, polls, votes, etc.)
--   2. profiles
--   3. achievement_types
--   4. polls
--   5. poll_options
--   6. votes
--   7. vote_edits
--   8. demo_polls
--   9. demo_votes
--  10. ab_experiments
--  11. poll_variants
--  12. user_variant_assignments
--  13. poll_embeds
--  14. user_stats
--  15. user_achievements
--  16. user_email_preferences
-- ============================================================================


-- ============================================================================
-- SECTION 13a: DATA - auth.users (CRITICAL - run this first!)
-- ============================================================================
-- This exports all user accounts including password hashes so users can
-- still log in on the self-hosted instance.
-- ============================================================================
SELECT string_agg(
    'INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) VALUES (' ||
    COALESCE(quote_literal(instance_id::text), 'NULL') || ', ' ||
    quote_literal(id::text) || ', ' ||
    COALESCE(quote_literal(aud), 'NULL') || ', ' ||
    COALESCE(quote_literal(role), 'NULL') || ', ' ||
    COALESCE(quote_literal(email), 'NULL') || ', ' ||
    COALESCE(quote_literal(encrypted_password), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_confirmed_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(invited_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(confirmation_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(confirmation_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(recovery_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(recovery_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change_token_new), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(last_sign_in_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(raw_app_meta_data::text), 'NULL') || '::jsonb, ' ||
    COALESCE(quote_literal(raw_user_meta_data::text), 'NULL') || '::jsonb, ' ||
    COALESCE(is_super_admin::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(updated_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_confirmed_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_change), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_change_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_change_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change_token_current), 'NULL') || ', ' ||
    COALESCE(email_change_confirm_status::text, '0') || ', ' ||
    COALESCE(quote_literal(banned_until::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(reauthentication_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(reauthentication_sent_at::text), 'NULL') || ', ' ||
    COALESCE(is_sso_user::text, 'false') || ', ' ||
    COALESCE(quote_literal(deleted_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM auth.users;


-- ============================================================================
-- SECTION 13b: DATA - profiles
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.profiles (id, username, avatar_url, created_at, updated_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    COALESCE(quote_literal(username), 'NULL') || ', ' ||
    COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(updated_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.profiles;


-- ============================================================================
-- SECTION 13c: DATA - achievement_types
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.achievement_types (id, name, description, icon, category, points, target_value, is_repeatable, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(name) || ', ' ||
    quote_literal(description) || ', ' ||
    quote_literal(icon) || ', ' ||
    quote_literal(category) || ', ' ||
    COALESCE(points::text, 'NULL') || ', ' ||
    COALESCE(target_value::text, 'NULL') || ', ' ||
    COALESCE(is_repeatable::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.achievement_types;


-- ============================================================================
-- SECTION 13d: DATA - polls
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.polls (id, code, user_id, question, description, allow_multiple, is_active, has_time_limit, start_date, end_date, show_results_to_voters, allow_vote_editing, embed_enabled, embed_settings, created_at, updated_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(code) || ', ' ||
    quote_literal(user_id) || ', ' ||
    quote_literal(question) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    COALESCE(allow_multiple::text, 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE(has_time_limit::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(start_date::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(end_date::text), 'NULL') || ', ' ||
    COALESCE(show_results_to_voters::text, 'NULL') || ', ' ||
    COALESCE(allow_vote_editing::text, 'NULL') || ', ' ||
    COALESCE(embed_enabled::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(embed_settings::text), 'NULL') || '::jsonb, ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(updated_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.polls;


-- ============================================================================
-- SECTION 13e: DATA - poll_options
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.poll_options (id, poll_id, text, option_order, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(poll_id) || ', ' ||
    quote_literal(text) || ', ' ||
    option_order::text || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.poll_options;


-- ============================================================================
-- SECTION 13f: DATA - votes
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.votes (id, poll_id, options, user_id, voter_fingerprint, voter_ip, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(poll_id) || ', ' ||
    COALESCE(quote_literal(options::text), 'NULL') || '::jsonb, ' ||
    COALESCE(quote_literal(user_id), 'NULL') || ', ' ||
    COALESCE(quote_literal(voter_fingerprint), 'NULL') || ', ' ||
    COALESCE(quote_literal(voter_ip::text), 'NULL') || '::inet, ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.votes;


-- ============================================================================
-- SECTION 13g: DATA - vote_edits
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.vote_edits (id, original_vote_id, previous_options, new_options, user_id, voter_fingerprint, voter_ip, edited_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(original_vote_id) || ', ' ||
    quote_literal(previous_options::text) || '::jsonb, ' ||
    quote_literal(new_options::text) || '::jsonb, ' ||
    COALESCE(quote_literal(user_id), 'NULL') || ', ' ||
    COALESCE(quote_literal(voter_fingerprint), 'NULL') || ', ' ||
    COALESCE(quote_literal(voter_ip), 'NULL') || ', ' ||
    COALESCE(quote_literal(edited_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.vote_edits;


-- ============================================================================
-- SECTION 13h: DATA - demo_polls
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.demo_polls (id, question, description, options, category, display_order, is_active, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(question) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    quote_literal(options::text) || '::jsonb, ' ||
    COALESCE(quote_literal(category), 'NULL') || ', ' ||
    COALESCE(display_order::text, 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.demo_polls;


-- ============================================================================
-- SECTION 13i: DATA - demo_votes
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.demo_votes (id, demo_poll_id, selected_options, voter_fingerprint, voted_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(demo_poll_id) || ', ' ||
    quote_literal(selected_options::text) || '::jsonb, ' ||
    quote_literal(voter_fingerprint) || ', ' ||
    COALESCE(quote_literal(voted_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.demo_votes;


-- ============================================================================
-- SECTION 13j: DATA - ab_experiments
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.ab_experiments (id, poll_id, name, traffic_split, is_active, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(poll_id) || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(traffic_split::text, 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.ab_experiments;


-- ============================================================================
-- SECTION 13k: DATA - poll_variants
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.poll_variants (id, experiment_id, question, variant_name, description, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(experiment_id) || ', ' ||
    quote_literal(question) || ', ' ||
    quote_literal(variant_name) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.poll_variants;


-- ============================================================================
-- SECTION 13l: DATA - user_variant_assignments
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.user_variant_assignments (id, experiment_id, variant_id, user_id, voter_fingerprint, voted, voted_at, assigned_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(experiment_id) || ', ' ||
    quote_literal(variant_id) || ', ' ||
    COALESCE(quote_literal(user_id), 'NULL') || ', ' ||
    COALESCE(quote_literal(voter_fingerprint), 'NULL') || ', ' ||
    COALESCE(voted::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(voted_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(assigned_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.user_variant_assignments;


-- ============================================================================
-- SECTION 13m: DATA - poll_embeds
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.poll_embeds (id, poll_id, domain, embed_type, first_seen, last_seen, total_views, total_votes) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(poll_id) || ', ' ||
    quote_literal(domain) || ', ' ||
    COALESCE(quote_literal(embed_type), 'NULL') || ', ' ||
    COALESCE(quote_literal(first_seen::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(last_seen::text), 'NULL') || ', ' ||
    COALESCE(total_views::text, 'NULL') || ', ' ||
    COALESCE(total_votes::text, 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.poll_embeds;


-- ============================================================================
-- SECTION 13n: DATA - user_stats
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.user_stats (user_id, polls_created, votes_cast, votes_received, total_points, level, consecutive_days, last_activity_date, updated_at) VALUES (' ||
    quote_literal(user_id) || ', ' ||
    COALESCE(polls_created::text, 'NULL') || ', ' ||
    COALESCE(votes_cast::text, 'NULL') || ', ' ||
    COALESCE(votes_received::text, 'NULL') || ', ' ||
    COALESCE(total_points::text, 'NULL') || ', ' ||
    COALESCE(level::text, 'NULL') || ', ' ||
    COALESCE(consecutive_days::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(last_activity_date::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(updated_at::text), 'NULL') ||
    ') ON CONFLICT (user_id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.user_stats;


-- ============================================================================
-- SECTION 13o: DATA - user_achievements
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.user_achievements (id, user_id, achievement_type_id, completed_at, progress, tier, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(user_id) || ', ' ||
    quote_literal(achievement_type_id) || ', ' ||
    COALESCE(quote_literal(completed_at::text), 'NULL') || ', ' ||
    COALESCE(progress::text, 'NULL') || ', ' ||
    COALESCE(tier::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.user_achievements;


-- ============================================================================
-- SECTION 13p: DATA - user_email_preferences
-- ============================================================================
SELECT string_agg(
    'INSERT INTO public.user_email_preferences (user_id, new_votes, achievement_notifications, poll_milestones, weekly_summary, created_at, updated_at) VALUES (' ||
    quote_literal(user_id) || ', ' ||
    COALESCE(new_votes::text, 'NULL') || ', ' ||
    COALESCE(achievement_notifications::text, 'NULL') || ', ' ||
    COALESCE(poll_milestones::text, 'NULL') || ', ' ||
    COALESCE(weekly_summary::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(updated_at::text), 'NULL') ||
    ') ON CONFLICT (user_id) DO NOTHING;',
    chr(10)
) AS ddl
FROM public.user_email_preferences;
