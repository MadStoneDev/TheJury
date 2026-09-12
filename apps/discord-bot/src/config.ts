import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  theJuryUrl: (process.env.THEJURY_URL || "https://thejury.app").replace(/\/$/, ""),
  // Optional: register slash commands to this one guild for instant testing.
  // Leave unset in production to register globally.
  discordTestGuildId: process.env.DISCORD_TEST_GUILD_ID?.trim() || undefined,
};
