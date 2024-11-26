// Require the necessary discord.js classes
const fs = require("node:fs/promises"); // Use promises API
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const token = process.env.DISCORD_TOKEN;
console.log(token);
// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = await fs.readdir(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  // if (!interaction.isChatInputCommand()) return;

  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing command ${interaction.commandName}:`,
        error
      );
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({
          content: `Error executing command! Please try again later.`,
          ephemeral: true,
        });
      } else {
        interaction.reply({
          content: `Error executing command! Please try again later.`,
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
