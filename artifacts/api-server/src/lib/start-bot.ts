import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  Interaction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  GuildMember,
} from "discord.js";
import { LavalinkManager } from "lavalink-client";
import { logger } from "./logger.js";
import { botBridge } from "./bot-bridge.js";
import { db, playHistoryTable } from "@workspace/db";

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

interface SlashCommand {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction, client: MusicClient) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction, client: MusicClient) => Promise<void>;
}

class MusicClient extends Client {
  commands: Collection<string, SlashCommand> = new Collection();
  lavalink!: LavalinkManager;
}

async function getOrCreatePlayer(client: MusicClient, guildId: string, voiceChannelId: string) {
  let player = client.lavalink.getPlayer(guildId);
  if (!player) {
    player = client.lavalink.createPlayer({ guildId, voiceChannelId, selfDeaf: true, selfMute: false, volume: 80 });
  }
  if (!player.connected) await player.connect();
  return player;
}

function getVoiceChannel(member: GuildMember) {
  return member.voice.channel;
}

async function logPlayHistory(guildId: string, guildName: string | undefined, track: any) {
  try {
    await db.insert(playHistoryTable).values({
      guildId,
      guildName: guildName ?? null,
      title: track.info.title,
      author: track.info.author,
      duration: track.info.duration,
      thumbnail: track.info.artworkUrl ?? null,
      uri: track.info.uri ?? null,
      sourceName: track.info.sourceName,
      requestedBy:
        track.info.requester && typeof track.info.requester === "object"
          ? (track.info.requester as any).username ?? null
          : null,
    });
  } catch {
    // non-critical
  }
}

// ──────────────────────────────────────────────────
// Slash Commands
// ──────────────────────────────────────────────────

const playCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist")
    .addStringOption((o) => o.setName("query").setDescription("Song name, URL, or YouTube link").setRequired(true))
    .addStringOption((o) =>
      o.setName("source").setDescription("Search source").addChoices(
        { name: "YouTube", value: "ytsearch" },
        { name: "SoundCloud", value: "scsearch" },
        { name: "Direct URL", value: "url" }
      )
    ),
  async execute(interaction, client) {
    await interaction.deferReply();
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const vc = member ? getVoiceChannel(member) : null;
    if (!vc) { await interaction.editReply("You must be in a voice channel to play music."); return; }
    const query = interaction.options.getString("query", true);
    const source = interaction.options.getString("source") ?? "ytsearch";
    try {
      const player = await getOrCreatePlayer(client, interaction.guildId!, vc.id);
      const result = await player.search(source === "url" ? query : `${source}:${query}`, interaction.user);
      if (!result || result.loadType === "empty" || result.loadType === "error") {
        await interaction.editReply("No results found."); return;
      }
      if (result.loadType === "playlist") {
        for (const t of result.tracks) player.queue.add(t);
        if (!player.playing && !player.paused) await player.play({ paused: false });
        await interaction.editReply(`Added playlist **${result.playlist?.name ?? "Unknown"}** (${result.tracks.length} tracks).`);
      } else {
        const track = result.tracks[0];
        player.queue.add(track);
        if (!player.playing && !player.paused) await player.play({ paused: false });
        await interaction.editReply(`Added **${track.info.title}** by ${track.info.author}.`);
      }
    } catch { await interaction.editReply("Failed to play. Is Lavalink connected?"); }
  },
};

const skipCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current track"),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.playing) { await interaction.reply("Nothing is playing."); return; }
    await player.skip();
    await interaction.reply("Skipped.");
  },
};

const pauseCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause or resume playback"),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) { await interaction.reply("Nothing is playing."); return; }
    await player.pause(!player.paused);
    await interaction.reply(player.paused ? "Paused." : "Resumed.");
  },
};

const stopCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop playback and clear the queue"),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) { await interaction.reply("Nothing is playing."); return; }
    player.queue.splice(0, player.queue.tracks.length);
    await player.stopPlaying(true, true);
    await interaction.reply("Stopped and cleared the queue.");
  },
};

const queueCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("queue").setDescription("Show the current queue")
    .addIntegerOption((o) => o.setName("page").setDescription("Page number").setMinValue(1)),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.queue.current) { await interaction.reply("The queue is empty."); return; }
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const perPage = 10;
    const tracks = player.queue.tracks;
    const current = player.queue.current;
    const embed = new EmbedBuilder().setTitle("Current Queue").setColor(0x5865f2)
      .setDescription(`**Now Playing:** [${current.info.title}](${current.info.uri ?? ""}) — ${fmtDuration(current.info.duration)}`);
    if (tracks.length > 0) {
      const slice = tracks.slice(page * perPage, (page + 1) * perPage);
      embed.addFields({
        name: `Up Next (${tracks.length} tracks)`,
        value: slice.map((t, i) => `${page * perPage + i + 1}. [${t.info.title}](${t.info.uri ?? ""}) — ${fmtDuration(t.info.duration)}`).join("\n"),
      });
    }
    await interaction.reply({ embeds: [embed] });
  },
};

const volumeCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("volume").setDescription("Set playback volume")
    .addIntegerOption((o) => o.setName("level").setDescription("Volume (0-200)").setMinValue(0).setMaxValue(200).setRequired(true)),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) { await interaction.reply("Nothing is playing."); return; }
    const level = interaction.options.getInteger("level", true);
    await player.setVolume(level);
    await interaction.reply(`Volume set to **${level}%**.`);
  },
};

const shuffleCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the queue"),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || player.queue.tracks.length < 2) { await interaction.reply("Not enough tracks to shuffle."); return; }
    player.queue.shuffle();
    await interaction.reply("Queue shuffled.");
  },
};

const loopCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("loop").setDescription("Set loop mode")
    .addStringOption((o) =>
      o.setName("mode").setDescription("Loop mode").setRequired(true).addChoices(
        { name: "Off", value: "none" },
        { name: "Track", value: "track" },
        { name: "Queue", value: "queue" }
      )
    ),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player) { await interaction.reply("Nothing is playing."); return; }
    const mode = interaction.options.getString("mode", true);
    const modeMap: Record<string, number> = { none: 0, track: 1, queue: 2 };
    player.setRepeatMode((modeMap[mode] ?? 0) as any);
    await interaction.reply(`Loop mode set to **${mode}**.`);
  },
};

const nowplayingCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show the currently playing track"),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.queue.current) { await interaction.reply("Nothing is playing."); return; }
    const track = player.queue.current;
    const pos = player.position;
    const dur = track.info.duration;
    const barLen = 20;
    const filled = Math.round((pos / dur) * barLen);
    const bar = "▓".repeat(filled) + "░".repeat(barLen - filled);
    const embed = new EmbedBuilder().setTitle("Now Playing").setColor(0x5865f2)
      .setDescription(`**[${track.info.title}](${track.info.uri ?? ""})**\nby ${track.info.author}`)
      .addFields(
        { name: "Progress", value: `${bar}\n${fmtDuration(pos)} / ${fmtDuration(dur)}`, inline: false },
        { name: "Volume", value: `${player.volume}%`, inline: true },
        { name: "Loop", value: String(player.repeatMode), inline: true },
        { name: "Source", value: track.info.sourceName, inline: true }
      );
    if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);
    await interaction.reply({ embeds: [embed] });
  },
};

const searchCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("search").setDescription("Search and pick a track to play")
    .addStringOption((o) => o.setName("query").setDescription("Search query").setRequired(true))
    .addStringOption((o) =>
      o.setName("source").setDescription("Search source").addChoices(
        { name: "YouTube", value: "ytsearch" },
        { name: "SoundCloud", value: "scsearch" }
      )
    ),
  async execute(interaction, client) {
    await interaction.deferReply();
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const vc = member ? getVoiceChannel(member) : null;
    if (!vc) { await interaction.editReply("You must be in a voice channel."); return; }
    const query = interaction.options.getString("query", true);
    const source = interaction.options.getString("source") ?? "ytsearch";
    const tempPlayer = client.lavalink.getPlayer(interaction.guildId!) ||
      client.lavalink.createPlayer({ guildId: interaction.guildId!, voiceChannelId: vc.id, selfDeaf: true, volume: 80 });
    const result = await tempPlayer.search(`${source}:${query}`, interaction.user);
    if (!result || result.tracks.length === 0) { await interaction.editReply("No results found."); return; }
    const tracks = result.tracks.slice(0, 10);
    const menu = new StringSelectMenuBuilder().setCustomId("search_select").setPlaceholder("Select a track")
      .addOptions(tracks.map((t, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(t.info.title.slice(0, 100))
          .setDescription(`${t.info.author} — ${fmtDuration(t.info.duration)}`)
          .setValue(String(i))
      ));
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const reply = await interaction.editReply({ content: "Select a track:", components: [row] });
    try {
      const collected = await reply.awaitMessageComponent({ componentType: ComponentType.StringSelect, filter: (i) => i.user.id === interaction.user.id, time: 30_000 });
      const track = tracks[Number(collected.values[0])];
      const player = await getOrCreatePlayer(client, interaction.guildId!, vc.id);
      player.queue.add(track);
      if (!player.playing && !player.paused) await player.play({ paused: false });
      await collected.update({ content: `Added **${track.info.title}** to the queue.`, components: [] });
    } catch { await interaction.editReply({ content: "Selection timed out.", components: [] }); }
  },
};

// ──────────────────────────────────────────────────
// Client factory
// ──────────────────────────────────────────────────

function createClient(): MusicClient {
  const client = new MusicClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.lavalink = new LavalinkManager({
    nodes: [{
      authorization: process.env.LAVALINK_PASSWORD ?? "youshallnotpass",
      host: process.env.LAVALINK_HOST ?? "localhost",
      port: Number(process.env.LAVALINK_PORT ?? "2333"),
      id: "main",
      retryAmount: 5,
      retryDelay: 3000,
    }],
    sendToShard: (guildId, payload) => {
      client.guilds.cache.get(guildId)?.shard.send(payload);
    },
    autoSkip: true,
    client: { id: process.env.DISCORD_CLIENT_ID!, username: "Harmonia" },
    playerOptions: {
      onDisconnect: { autoReconnect: true, destroyPlayer: false },
      onEmptyQueue: { destroyAfterMs: 30_000 },
    },
  });

  return client;
}

// ──────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) { logger.warn("DISCORD_BOT_TOKEN not set — bot disabled"); return; }
  if (!process.env.DISCORD_CLIENT_ID) { logger.warn("DISCORD_CLIENT_ID not set — bot disabled"); return; }

  const client = createClient();

  for (const cmd of [playCmd, skipCmd, pauseCmd, stopCmd, queueCmd, volumeCmd, shuffleCmd, loopCmd, nowplayingCmd, searchCmd]) {
    client.commands.set(cmd.data.name, cmd);
  }

  client.once(Events.ClientReady, async () => {
    logger.info(`Logged in as ${client.user?.tag}`);
    await client.lavalink.init({ id: client.user!.id, username: client.user!.username });
    logger.info("Lavalink manager initialized");
    botBridge.setClient(client as any);
    botBridge.setLavalink(client.lavalink);
    logger.info("Bot bridge wired — dashboard API live");
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction as ChatInputCommandInteraction, client);
      } catch (err) {
        logger.error({ err }, `Error executing /${interaction.commandName}`);
        const reply = { content: "An error occurred.", ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
        else await interaction.reply(reply);
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) await command.autocomplete(interaction as AutocompleteInteraction, client);
    }
  });

  client.on(Events.VoiceStateUpdate, (oldState) => {
    if (!oldState.channelId) return;
    const player = client.lavalink.getPlayer(oldState.guild.id);
    if (!player) return;
    const guild = client.guilds.cache.get(oldState.guild.id);
    if (!guild) return;
    const vc = guild.channels.cache.get(player.voiceChannelId ?? "");
    if (!vc || !vc.isVoiceBased()) return;
    if (vc.members.filter((m) => !m.user.bot).size === 0) {
      setTimeout(async () => {
        const p = client.lavalink.getPlayer(oldState.guild.id);
        if (p) {
          const v = guild.channels.cache.get(p.voiceChannelId ?? "");
          if (v && v.isVoiceBased() && v.members.filter((m) => !m.user.bot).size === 0) await p.destroy();
        }
      }, 60_000);
    }
  });

  client.on("raw", (d) => client.lavalink.sendRawData(d as any));

  client.lavalink.on("trackStart", async (player, track) => {
    logger.info({ guildId: player.guildId, track: track.info.title }, "Track started");
    await logPlayHistory(player.guildId, client.guilds.cache.get(player.guildId)?.name, track);
  });
  client.lavalink.on("trackEnd", (player, track) => logger.info({ guildId: player.guildId, title: track.info.title }, "Track ended"));
  client.lavalink.on("trackError", (player, track, payload) => logger.error({ guildId: player.guildId, track: track?.info.title, payload }, "Track error"));
  client.lavalink.on("playerDestroy", (player) => logger.info({ guildId: player.guildId }, "Player destroyed"));
  client.lavalink.nodeManager.on("connect", (node) => logger.info({ nodeId: node.id }, "Lavalink node connected"));
  client.lavalink.nodeManager.on("disconnect", (node, reason) => logger.warn({ nodeId: node.id, reason }, "Lavalink node disconnected"));
  client.lavalink.nodeManager.on("error", (node, err) => logger.error({ nodeId: node.id, err }, "Lavalink node error"));

  process.on("unhandledRejection", (err) => logger.error({ err }, "Unhandled rejection"));

  logger.info("Starting Harmonia bot (in-process with API server)...");
  await client.login(token);
}
