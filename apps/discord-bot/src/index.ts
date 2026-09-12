import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
} from "discord.js";
import { config } from "./config";
import {
  createLinkCode,
  createPoll,
  getGuildUserId,
  getCounts,
  getPollByCode,
  recordVote,
  saveMessageRef,
} from "./db";
import { buildPollMessage } from "./pollMessage";
import { parseCloseHours, nextFridays } from "./commands";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`TheJury bot online as ${c.user.tag}`);
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
  i: ChatInputCommandInteraction,
  userId: string,
  title: string,
  optionTexts: string[],
  opts: { allowMultiple: boolean; closeHours?: number },
) {
  if (optionTexts.length < 2 || optionTexts.length > 20) {
    await i.reply({
      flags: MessageFlags.Ephemeral,
      content: "Give me between 2 and 20 comma-separated options.",
    });
    return;
  }
  const poll = await createPoll(userId, title, optionTexts, opts);
  const counts = await getCounts(poll.pollId);
  const msg = buildPollMessage(poll.pollId, poll.code, title, counts);
  await i.reply(msg);
  const sent = await i.fetchReply();
  await saveMessageRef(poll.pollId, i.guildId!, i.channelId, sent.id);
}

async function handleCreate(i: ChatInputCommandInteraction, userId: string) {
  const title = i.options.getString("title", true);
  const optionTexts = i.options
    .getString("options", true)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const closeHours = parseCloseHours(i.options.getString("close"));
  const allowMultiple = i.options.getBoolean("multi") ?? false;
  await postPoll(i, userId, title, [...new Set(optionTexts)], { allowMultiple, closeHours });
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
    if (sub === "create") await handleCreate(interaction, userId);
    else if (sub === "schedule") await handleSchedule(interaction, userId);
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
