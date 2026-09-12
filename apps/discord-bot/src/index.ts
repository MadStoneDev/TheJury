import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { config } from "./config";
import {
  createLinkCode,
  createPoll,
  getGuildUserId,
  getAccountTier,
  getCounts,
  getPollByCode,
  recordVote,
  saveMessageRef,
  setPollActive,
} from "./db";
import { buildPollMessage } from "./pollMessage";
import { parseCloseHours, nextFridays } from "./commands";
import { trackBotInstalled } from "./analytics";
import { startTopggAutopost } from "./topgg";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`TheJury bot online as ${c.user.tag}`);
  startTopggAutopost(c);
});

// Track installs (the bot joining a new server).
client.on(Events.GuildCreate, (guild) => {
  void trackBotInstalled(guild.id);
});

async function handleLink(i: ChatInputCommandInteraction) {
  const code = await createLinkCode(i.guildId!, i.guild?.name ?? null);
  await i.reply({
    flags: MessageFlags.Ephemeral,
    content:
      `**Link this server to your TheJury account**\n` +
      `1. Go to ${config.theJuryUrl}/link-discord (sign in)\n` +
      `2. Enter this code within 15 minutes:\n\n` +
      `**\`${code}\`**\n\n` +
      `Then polls created here show up in your dashboard.`,
  });
}

async function ensureLinked(i: ChatInputCommandInteraction): Promise<string | null> {
  const userId = await getGuildUserId(i.guildId!);
  if (!userId) {
    await i.reply({
      flags: MessageFlags.Ephemeral,
      content:
        "This server isn't linked yet. Run `/jury link` and follow the steps to connect it to your TheJury account.",
    });
    return null;
  }
  return userId;
}

async function postPoll(
  i: ChatInputCommandInteraction | ModalSubmitInteraction,
  userId: string,
  title: string,
  optionTexts: string[],
  opts: { allowMultiple: boolean; closeHours?: number },
) {
  if (optionTexts.length < 2 || optionTexts.length > 20) {
    await i.reply({
      flags: MessageFlags.Ephemeral,
      content: "Give me between 2 and 20 options.",
    });
    return;
  }
  const poll = await createPoll(userId, title, optionTexts, opts);
  const counts = await getCounts(poll.pollId);
  const msg = buildPollMessage(poll.pollId, poll.code, title, counts);
  await i.reply(msg);
  const sent = await i.fetchReply();
  await saveMessageRef(poll.pollId, i.guildId!, i.channelId!, sent.id);
}

// /jury create opens a single modal: question, options (one per line), and
// optional "allow multiple?" + "auto-close after" text fields.
function textRow(input: TextInputBuilder) {
  return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

async function handleCreate(i: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("jurycreate")
    .setTitle("Create a poll")
    .addComponents(
      textRow(
        new TextInputBuilder()
          .setCustomId("q")
          .setLabel("Question")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(300)
          .setPlaceholder("What are we playing tonight?"),
      ),
      textRow(
        new TextInputBuilder()
          .setCustomId("opts")
          .setLabel("Options — one per line (2–20)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1500)
          .setPlaceholder("Ranked grind\nChill co-op\nParty games\nSomething new"),
      ),
      textRow(
        new TextInputBuilder()
          .setCustomId("multi")
          .setLabel("Allow multiple answers?")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(5)
          .setPlaceholder("yes / no (default: no)"),
      ),
      textRow(
        new TextInputBuilder()
          .setCustomId("close")
          .setLabel("Auto-close after (Pro)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder("e.g. 2h, 24h, 7d — leave blank for none"),
      ),
    );

  await i.showModal(modal);
}

async function handleCreateModal(i: ModalSubmitInteraction) {
  if (!i.guildId) {
    await i.reply({ flags: MessageFlags.Ephemeral, content: "Use this in a server." });
    return;
  }
  const userId = await getGuildUserId(i.guildId);
  if (!userId) {
    await i.reply({
      flags: MessageFlags.Ephemeral,
      content: "This server isn't linked yet — run `/jury link` first.",
    });
    return;
  }

  const question = i.fields.getTextInputValue("q").trim();
  const optionTexts = i.fields
    .getTextInputValue("opts")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const multiRaw = i.fields.getTextInputValue("multi").trim().toLowerCase();
  const allowMultiple = ["y", "yes", "true", "1", "on"].includes(multiRaw);
  let closeHours = parseCloseHours(i.fields.getTextInputValue("close") || null);

  // Auto-close (scheduling) is Pro. On Free, post without a deadline + nudge.
  let nudgeUpgrade = false;
  if (closeHours !== undefined && (await getAccountTier(userId)) === "free") {
    closeHours = undefined;
    nudgeUpgrade = true;
  }

  await postPoll(i, userId, question, [...new Set(optionTexts)], { allowMultiple, closeHours });

  if (nudgeUpgrade) {
    await i.followUp({
      flags: MessageFlags.Ephemeral,
      content: `⏱️ Auto-closing polls is a Pro feature — I posted this one without a deadline. Upgrade at ${config.theJuryUrl}/pricing to schedule closes.`,
    });
  }
}

async function handleSchedule(i: ChatInputCommandInteraction, userId: string) {
  const title = i.options.getString("title", true);
  const datesInput = i.options.getString("dates");
  const dates = datesInput
    ? datesInput.split(",").map((s) => s.trim()).filter(Boolean)
    : nextFridays(4);
  // Scheduling is availability: multi-select on.
  await postPoll(i, userId, title, [...new Set(dates)], { allowMultiple: true });
}

async function handleSetActive(
  i: ChatInputCommandInteraction,
  userId: string,
  active: boolean,
) {
  const code = i.options.getString("code", true);
  const res = await setPollActive(code, userId, active);
  if (!res.ok) {
    await i.reply({ flags: MessageFlags.Ephemeral, content: res.error ?? "Failed." });
    return;
  }

  // Update the original poll message (remove/restore vote buttons).
  if (res.channelId && res.messageId && res.pollId) {
    try {
      const ch = await client.channels.fetch(res.channelId);
      if (ch?.isTextBased()) {
        const msg = await ch.messages.fetch(res.messageId);
        const counts = await getCounts(res.pollId);
        const rebuilt = buildPollMessage(res.pollId, res.code!, res.question!, counts, {
          closed: !active,
        });
        await msg.edit({ embeds: rebuilt.embeds, components: rebuilt.components });
      }
    } catch {
      /* message may have been deleted — ignore */
    }
  }

  await i.reply({
    flags: MessageFlags.Ephemeral,
    content: active
      ? `✅ Reopened voting on \`${res.code}\`.`
      : `🔒 Closed voting on \`${res.code}\`.`,
  });
}

async function handleResults(i: ChatInputCommandInteraction) {
  const code = i.options.getString("code", true);
  const poll = await getPollByCode(code);
  if (!poll) {
    await i.reply({
      flags: MessageFlags.Ephemeral,
      content: `No poll found with code \`${code.toUpperCase()}\`.`,
    });
    return;
  }
  const msg = buildPollMessage(poll.pollId, poll.code, poll.question, poll.counts);
  await i.reply({
    flags: MessageFlags.Ephemeral,
    embeds: msg.embeds,
    components: [msg.components[msg.components.length - 1]], // just the results link
  });
}

async function handleVote(i: ButtonInteraction) {
  const [, pollId, optionId] = i.customId.split(":");
  await i.deferUpdate();
  const res = await recordVote(pollId, optionId, i.user.id);
  if (!res.ok) {
    await i.followUp({ flags: MessageFlags.Ephemeral, content: res.error ?? "Couldn't record your vote." });
    return;
  }
  // Refresh the message with new counts. The code lives in the results link.
  const counts = await getCounts(pollId);
  const linkBtn = i.message.components.at(-1);
  const url =
    linkBtn && "components" in linkBtn
      ? (linkBtn.components[0] as { url?: string }).url
      : undefined;
  const code = url ? url.split("/results/")[1] : "";
  const title = i.message.embeds[0]?.title ?? "Poll";
  const msg = buildPollMessage(pollId, code ?? "", title, counts);
  await i.editReply({ embeds: msg.embeds, components: msg.components });
  await i.followUp({ flags: MessageFlags.Ephemeral, content: "Vote counted." });
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith("vote:")) {
      await handleVote(interaction);
      return;
    }
    if (interaction.isModalSubmit() && interaction.customId === "jurycreate") {
      await handleCreateModal(interaction);
      return;
    }
    if (!interaction.isChatInputCommand() || interaction.commandName !== "jury") return;
    if (!interaction.guildId) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Use `/jury` inside a server.",
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "link") return void (await handleLink(interaction));
    if (sub === "results") return void (await handleResults(interaction));

    const userId = await ensureLinked(interaction);
    if (!userId) return;
    // create shows a modal (no immediate reply); schedule posts directly.
    if (sub === "create") await handleCreate(interaction);
    else if (sub === "schedule") await handleSchedule(interaction, userId);
    else if (sub === "close") await handleSetActive(interaction, userId, false);
    else if (sub === "reopen") await handleSetActive(interaction, userId, true);
  } catch (err) {
    console.error("Interaction error:", err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ flags: MessageFlags.Ephemeral, content: "Something went wrong. Try again." })
        .catch(() => {});
    }
  }
});

client.login(config.discordToken);
