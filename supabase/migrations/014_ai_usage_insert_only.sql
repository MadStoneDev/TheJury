-- Migration: make ai_poll_usage server-writable only.
--
-- Previously "Users can manage own AI usage" (FOR ALL) let a user reset their
-- own monthly counter via a direct Supabase call and bypass the Free 3/month
-- AI limit. Drop that policy so users can only READ their usage (the SELECT
-- policy from 006 remains). All INSERT/UPDATE/DELETE now require the service
-- role, which only the server-side AI generation route uses.

DROP POLICY IF EXISTS "Users can manage own AI usage" ON ai_poll_usage;

-- "Users can read own AI usage" (SELECT USING user_id = auth.uid()) from
-- migration 006 is intentionally kept so the UI can still show usage.
