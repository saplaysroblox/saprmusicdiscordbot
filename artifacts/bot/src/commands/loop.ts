import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";
export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set loop mode")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Loop mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "none" },
          { name: "Track", value: "track" },
          { name: "Queue", value: "queue" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply("Nothing is playing.");
      return;
    }
    const mode = interaction.options.getString("mode", true);
    // QueueRepeatMode: 0=OFF, 1=TRACK, 2=QUEUE
    const modeMap: Record<string, number> = {
      none: 0,
      track: 1,
      queue: 2,
    };
    player.setRepeatMode((modeMap[mode] ?? 0) as any);
    await interaction.reply(`Loop mode set to **${mode}**.`);
  },
};
