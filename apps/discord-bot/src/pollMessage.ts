import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type { Counts } from "./db";
import { config } from "./config";

const EMERALD = 0x10b981;
const MAX_VOTE_BUTTONS = 20; // leave one row for the results link

function bar(pct: number): string {
  const filled = Math.round((pct / 100) * 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}

export function buildPollMessage(
  pollId: string,
  code: string,
  question: string,
  counts: Counts,
  opts: { closed?: boolean } = {},
) {
  const total = counts.total || 0;
  const lines = counts.options.map((o) => {
    const pct = total > 0 ? Math.round((o.count / total) * 100) : 0;
    return `**${o.text}**\n${bar(pct)}  ${o.count} · ${pct}%`;
  });

  const embed = new EmbedBuilder()
    .setColor(opts.closed ? 0x64748b : EMERALD)
    .setTitle(question)
    .setDescription(lines.join("\n\n") || "No options.")
    .setFooter({
      text: opts.closed
        ? `Poll ${code} · ${total} ${total === 1 ? "vote" : "votes"} · 🔒 voting closed`
        : `Poll ${code} · ${total} ${total === 1 ? "vote" : "votes"} · tap to vote`,
    });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  // No vote buttons once closed — just the results link.
  if (!opts.closed) {
    const voteButtons = counts.options
      .slice(0, MAX_VOTE_BUTTONS)
      .map((o) =>
        new ButtonBuilder()
          .setCustomId(`vote:${pollId}:${o.id}`)
          .setLabel(o.text.slice(0, 80))
          .setStyle(ButtonStyle.Secondary),
      );
    for (let i = 0; i < voteButtons.length; i += 5) {
      rows.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          voteButtons.slice(i, i + 5),
        ),
      );
    }
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("View full results")
        .setURL(`${config.theJuryUrl}/results/${code}`),
    ),
  );

  return { embeds: [embed], components: rows.slice(0, 5) };
}
