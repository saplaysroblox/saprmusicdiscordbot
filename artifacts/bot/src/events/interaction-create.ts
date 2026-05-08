import { Events, ChatInputCommandInteraction, Interaction } from "discord.js";
import type { MusicClient } from "../lib/client.js";
import { logger } from "../lib/logger.js";

export const event = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, client: MusicClient) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction as ChatInputCommandInteraction, client);
      } catch (err) {
        logger.error({ err }, `Error executing command ${interaction.commandName}`);
        const reply = { content: "An error occurred.", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command.autocomplete(interaction, client);
      }
    }
  },
};
