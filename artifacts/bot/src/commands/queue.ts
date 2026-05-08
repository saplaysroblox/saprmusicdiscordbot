import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue")
    .addIntegerOption((opt) =>
      opt.setName("page").setDescription("Page number").setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.queue.current) {
      await interaction.reply("The queue is empty.");
      return;
    }

    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const perPage = 10;
    const tracks = player.queue.tracks;
    const current = player.queue.current;

    const embed = new EmbedBuilder()
      .setTitle("Current Queue")
      .setColor(0x5865f2)
      .setDescription(
        `**Now Playing:** [${current.info.title}](${current.info.uri ?? ""}) — ${formatDuration(current.info.duration)}`
      );

    if (tracks.length > 0) {
      const pageSlice = tracks.slice(page * perPage, (page + 1) * perPage);
      embed.addFields({
        name: `Up Next (${tracks.length} tracks)`,
        value: pageSlice
          .map(
            (t, i) =>
              `${page * perPage + i + 1}. [${t.info.title}](${t.info.uri ?? ""}) — ${formatDuration(t.info.duration)}`
          )
          .join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
