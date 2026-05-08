import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playback and clear the queue"),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply("Nothing is playing.");
      return;
    }
    player.queue.splice(0, player.queue.tracks.length);
    await player.stopPlaying(true, true);
    await interaction.reply("Stopped playback and cleared the queue.");
  },
};
