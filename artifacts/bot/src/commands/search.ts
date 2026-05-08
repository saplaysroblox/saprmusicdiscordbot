import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";
import { getOrCreatePlayer, getVoiceChannel } from "../lib/player-helper.js";

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search and pick a track to play")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Search query").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("source")
        .setDescription("Search source")
        .addChoices(
          { name: "YouTube", value: "ytsearch" },
          { name: "SoundCloud", value: "scsearch" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    await interaction.deferReply();

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member ? getVoiceChannel(member) : null;

    if (!voiceChannel) {
      await interaction.editReply("You must be in a voice channel to use search.");
      return;
    }

    const query = interaction.options.getString("query", true);
    const source = interaction.options.getString("source") ?? "ytsearch";

    const tempPlayer = client.lavalink.getPlayer(interaction.guildId!) ||
      client.lavalink.createPlayer({
        guildId: interaction.guildId!,
        voiceChannelId: voiceChannel.id,
        selfDeaf: true,
        volume: 80,
      });

    const result = await tempPlayer.search(`${source}:${query}`, interaction.user);

    if (!result || result.tracks.length === 0) {
      await interaction.editReply("No results found.");
      return;
    }

    const tracks = result.tracks.slice(0, 10);

    const menu = new StringSelectMenuBuilder()
      .setCustomId("search_select")
      .setPlaceholder("Select a track to play")
      .addOptions(
        tracks.map((t, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(t.info.title.slice(0, 100))
            .setDescription(`${t.info.author} — ${formatDuration(t.info.duration)}`)
            .setValue(String(i))
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const reply = await interaction.editReply({ content: "Select a track:", components: [row] });

    try {
      const collected = await reply.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (i) => i.user.id === interaction.user.id,
        time: 30_000,
      });

      const idx = Number(collected.values[0]);
      const track = tracks[idx];

      const player = await getOrCreatePlayer(client, interaction.guildId!, voiceChannel.id);
      player.queue.add(track);
      if (!player.playing && !player.paused) {
        await player.play({ paused: false });
      }

      await collected.update({
        content: `Added **${track.info.title}** to the queue.`,
        components: [],
      });
    } catch {
      await interaction.editReply({ content: "Selection timed out.", components: [] });
    }
  },
};
