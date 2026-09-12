import type { Client } from "discord.js";
import { config } from "./config";

// Posts the bot's server count to top.gg every 30 minutes. No-op unless
// TOPGG_TOKEN is set, so it's safe to run before you've listed the bot.
const TOKEN = process.env.TOPGG_TOKEN;
const INTERVAL_MS = 30 * 60 * 1000;

export function startTopggAutopost(client: Client<true>): void {
  if (!TOKEN) return;

  const post = async () => {
    try {
      const res = await fetch(
        `https://top.gg/api/bots/${config.discordClientId}/stats`,
        {
          method: "POST",
          headers: { Authorization: TOKEN, "Content-Type": "application/json" },
          body: JSON.stringify({ server_count: client.guilds.cache.size }),
        },
      );
      if (!res.ok) {
        console.error(`[topgg] stats post failed: ${res.status}`);
      }
    } catch (err) {
      console.error("[topgg] stats post error:", err);
    }
  };

  void post();
  setInterval(() => void post(), INTERVAL_MS);
}
