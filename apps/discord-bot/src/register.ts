import { REST, Routes } from "discord.js";
import { config } from "./config";
import { juryCommand } from "./commands";

// Registers the /jury command globally. Run once after deploying, and again
// whenever the command definition changes. Global commands can take up to an
// hour to propagate; for instant testing, register to a single guild instead.
async function main() {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  if (config.discordTestGuildId) {
    // Guild commands update instantly — ideal while developing.
    await rest.put(
      Routes.applicationGuildCommands(
        config.discordClientId,
        config.discordTestGuildId,
      ),
      { body: [juryCommand] },
    );
    console.log(
      `Registered /jury to test guild ${config.discordTestGuildId} (instant).`,
    );
  } else {
    // Global commands can take up to ~1 hour to propagate.
    await rest.put(Routes.applicationCommands(config.discordClientId), {
      body: [juryCommand],
    });
    console.log("Registered /jury globally (up to ~1h to propagate).");
  }
}

main().catch((err) => {
  console.error("Failed to register commands:", err);
  process.exit(1);
});
