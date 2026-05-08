import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../types.js";
import type { MusicClient } from "../lib/client.js";
import { getOrCreatePlayer, getVoiceChannel } from "../lib/player-helper.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Song name, URL, or YouTube link").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("source")
        .setDescription("Search source")
        .addChoices(
          { name: "YouTube", value: "ytsearch" },
          { name: "SoundCloud", value: "scsearch" },
          { name: "Direct URL", value: "url" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: MusicClient) {
    await interaction.deferReply();

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member ? getVoiceChannel(member) : null;

    if (!voiceChannel) {
      await interaction.editReply("You must be in a voice channel to play music.");
      return;
    }

    const query = interaction.options.getString("query", true);
    const source = interaction.options.getString("source") ?? "ytsearch";

    try {
      const player = await getOrCreatePlayer(client, interaction.guildId!, voiceChannel.id);

      const searchQuery = source === "url" ? query : `${source}:${query}`;
      const result = await player.search(searchQuery, interaction.user);

      if (!result || result.loadType === "empty" || result.loadType === "error") {
        await interaction.editReply("No results found for your query.");
        return;
      }

      if (result.loadType === "playlist") {
        for (const track of result.tracks) {
          player.queue.add(track);
        }
        if (!player.playing && !player.paused) {
          await player.play({ paused: false });
        }
        await interaction.editReply(
          `Added playlist **${result.playlist?.name ?? "Unknown"}** with ${result.tracks.length} tracks.`
        );
      } else {
        const track = result.tracks[0];
        player.queue.add(track);
        if (!player.playing && !player.paused) {
          await player.play({ paused: false });
        }
        await interaction.editReply(`Added **${track.info.title}** by ${track.info.author} to the queue.`);
      }
    } catch (err) {
      await interaction.editReply("Failed to play track. Is the Lavalink server connected?");
    }
  },
};
