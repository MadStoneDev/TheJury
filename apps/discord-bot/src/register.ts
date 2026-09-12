import { REST, Routes } from "discord.js";
import { config } from "./config";
import { juryCommand } from "./commands";

// Registers the /jury command globally. Run once after deploying, and again
// whenever the command definition changes. Global commands can take up to an
// hour to propagate; for instant testing, register to a single guild instead.
async function main() {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);
  await rest.put(Routes.applicationCommands(config.discordClientId), {
    body: [juryCommand],
  });
  console.log("Registered /jury command.");
}

main().catch((err) => {
  console.error("Failed to register commands:", err);
  process.exit(1);
});
