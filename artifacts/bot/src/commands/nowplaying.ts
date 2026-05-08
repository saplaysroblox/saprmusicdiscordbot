import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the currently playing track"),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.queue.current) {
      await interaction.reply("Nothing is playing right now.");
      return;
    }

    const track = player.queue.current;
    const pos = player.position;
    const dur = track.info.duration;
    const barLen = 20;
    const filled = Math.round((pos / dur) * barLen);
    const bar = "▓".repeat(filled) + "░".repeat(barLen - filled);

    const embed = new EmbedBuilder()
      .setTitle("Now Playing")
      .setColor(0x5865f2)
      .setDescription(`**[${track.info.title}](${track.info.uri ?? ""})**\nby ${track.info.author}`)
      .addFields(
        { name: "Progress", value: `${bar}\n${formatDuration(pos)} / ${formatDuration(dur)}`, inline: false },
        { name: "Volume", value: `${player.volume}%`, inline: true },
        { name: "Loop", value: String(player.repeatMode), inline: true },
        { name: "Source", value: track.info.sourceName, inline: true }
      );

    if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

    await interaction.reply({ embeds: [embed] });
  },
};
