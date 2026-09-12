import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Service-role client: the bot acts for many Discord users and manages the
// discord_* tables, so it bypasses RLS. Keep this key server-side only.
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false } },
);
