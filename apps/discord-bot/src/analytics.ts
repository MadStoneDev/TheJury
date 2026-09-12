// Optional server-side analytics via the GA4 Measurement Protocol. If
// GA_MEASUREMENT_ID + GA_API_SECRET are set the bot reports installs to the
// same GA4 property the web app uses; otherwise it just logs.

const measurementId = process.env.GA_MEASUREMENT_ID;
const apiSecret = process.env.GA_API_SECRET;

export async function trackBotInstalled(guildId: string): Promise<void> {
  console.log(`[analytics] bot_installed guild=${guildId}`);
  if (!measurementId || !apiSecret) return;
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: `guild.${guildId}`,
          events: [{ name: "bot_installed", params: { guild_id: guildId } }],
        }),
      },
    );
  } catch (err) {
    console.error("[analytics] failed to report bot_installed:", err);
  }
}
