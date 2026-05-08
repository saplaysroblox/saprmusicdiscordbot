import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the queue"),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || player.queue.tracks.length < 2) {
      await interaction.reply("Not enough tracks in the queue to shuffle.");
      return;
    }
    player.queue.shuffle();
    await interaction.reply("Queue shuffled.");
  },
};
