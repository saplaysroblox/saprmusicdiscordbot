import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track"),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.playing) {
      await interaction.reply("Nothing is playing right now.");
      return;
    }
    await player.skip();
    await interaction.reply("Skipped the current track.");
  },
};
