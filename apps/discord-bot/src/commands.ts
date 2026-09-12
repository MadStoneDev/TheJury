import { SlashCommandBuilder } from "discord.js";

export const juryCommand = new SlashCommandBuilder()
  .setName("jury")
  .setDescription("Create and run polls with TheJury")
  .addSubcommand((s) =>
    s
      .setName("create")
      .setDescription("Create a poll in this channel (opens a form)"),
  )
  .addSubcommand((s) =>
    s
      .setName("schedule")
      .setDescription("Propose dates and find a time everyone can make")
      .addStringOption((o) =>
        o.setName("title").setDescription("What are we scheduling?").setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName("dates")
          .setDescription("Comma-separated dates; blank = next 4 Fridays")
          .setRequired(false),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("results")
      .setDescription("Show results for a poll code")
      .addStringOption((o) =>
        o.setName("code").setDescription("The 6-character poll code").setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("close")
      .setDescription("Stop voting on a poll")
      .addStringOption((o) =>
        o.setName("code").setDescription("The 6-character poll code").setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("reopen")
      .setDescription("Reopen voting on a closed poll")
      .addStringOption((o) =>
        o.setName("code").setDescription("The 6-character poll code").setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("link")
      .setDescription("Link this server to your TheJury account"),
  )
  .toJSON();

/** Parse a close duration like "2h", "24h", "7d" into hours. */
export function parseCloseHours(input: string | null): number | undefined {
  if (!input) return undefined;
  const m = input.trim().match(/^(\d+)\s*([hd])$/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return m[2].toLowerCase() === "d" ? n * 24 : n;
}

/**
 * The next `count` Fridays as { label, date } — label for display, date as
 * YYYY-MM-DD (local) so the web can build a calendar invite from the winner.
 */
export function nextFridayOptions(count: number): { label: string; date: string }[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const out: { label: string; date: string }[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 5) {
      out.push({
        label: d.toLocaleDateString("en-AU", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      });
    }
  }
  return out;
}
