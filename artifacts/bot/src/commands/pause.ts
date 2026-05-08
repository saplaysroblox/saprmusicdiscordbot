import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause or resume playback"),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply("Nothing is playing right now.");
      return;
    }
    await player.pause(!player.paused);
    await interaction.reply(player.paused ? "Paused playback." : "Resumed playback.");
  },
};
