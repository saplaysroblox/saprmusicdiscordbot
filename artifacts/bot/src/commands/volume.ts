import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set playback volume")
    .addIntegerOption((opt) =>
      opt.setName("level").setDescription("Volume level (0-200)").setMinValue(0).setMaxValue(200).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply("Nothing is playing.");
      return;
    }
    const level = interaction.options.getInteger("level", true);
    await player.setVolume(level);
    await interaction.reply(`Volume set to **${level}%**.`);
  },
};
