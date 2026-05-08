/**
 * Bot Bridge — singleton that holds a reference to the lavalink manager + discord client
 * injected by the bot process via IPC or exported directly when collocated.
 * For now we use in-process state shared via a module singleton.
 */
import type { LavalinkManager } from "lavalink-client";
import type { Client } from "discord.js";

export interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  hasActivePlayer: boolean;
}

export interface PlayerStateInfo {
  guildId: string;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  position: number;
  loopMode: string;
  currentTrack: TrackInfo | null;
  voiceChannelId: string | null;
  voiceChannelName: string | null;
  queueSize: number;
  nodeConnected: boolean;
}

export interface TrackInfo {
  encoded: string;
  identifier: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string | null;
  uri: string | null;
  sourceName: string;
  isStream: boolean;
  requestedBy: string | null;
}

export interface QueueInfo {
  guildId: string;
  tracks: TrackInfo[];
  totalDuration: number;
}

export class MusicBotBridge {
  private _discordClient: Client | null = null;
  private _lavalinkManager: LavalinkManager | null = null;

  setClient(client: Client) {
    this._discordClient = client;
  }

  setLavalink(lavalink: LavalinkManager) {
    this._lavalinkManager = lavalink;
  }

  get isReady() {
    return this._discordClient !== null && this._lavalinkManager !== null;
  }

  private get lavalink(): LavalinkManager {
    if (!this._lavalinkManager) throw new Error("Lavalink not initialized");
    return this._lavalinkManager;
  }

  private get discord(): Client {
    if (!this._discordClient) throw new Error("Discord client not initialized");
    return this._discordClient;
  }

  getGuilds(): GuildInfo[] {
    if (!this.isReady) return [];
    return this.discord.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      memberCount: g.memberCount,
      hasActivePlayer: !!this.lavalink.getPlayer(g.id),
    }));
  }

  getPlayer(guildId: string): PlayerStateInfo | null {
    if (!this.isReady) return null;
    const player = this.lavalink.getPlayer(guildId);
    if (!player) return null;

    const guild = this.discord.guilds.cache.get(guildId);
    const vc = guild?.channels.cache.get(player.voiceChannelId ?? "");
    const node = this.lavalink.nodeManager.leastUsedNodes("memory")[0];

    return {
      guildId,
      isPlaying: player.playing,
      isPaused: player.paused,
      volume: player.volume,
      position: player.position,
      loopMode: mapRepeatMode(player.repeatMode),
      currentTrack: player.queue.current ? mapTrack(player.queue.current) : null,
      voiceChannelId: player.voiceChannelId ?? null,
      voiceChannelName: vc?.name ?? null,
      queueSize: player.queue.tracks.length,
      nodeConnected: node?.connected ?? false,
    };
  }

  getQueue(guildId: string): QueueInfo {
    if (!this.isReady) return { guildId, tracks: [], totalDuration: 0 };
    const player = this.lavalink.getPlayer(guildId);
    if (!player) return { guildId, tracks: [], totalDuration: 0 };

    const tracks = player.queue.tracks.map(mapTrack);
    const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);
    return { guildId, tracks, totalDuration };
  }

  getNodeStatus() {
    if (!this.isReady) {
      return { connected: false, host: "", port: 0, players: 0, playingPlayers: 0 };
    }
    const nodes = this.lavalink.nodeManager.leastUsedNodes("memory");
    if (!nodes.length) {
      return { connected: false, host: "", port: 0, players: 0, playingPlayers: 0 };
    }
    const node = nodes[0];
    const stats = (node as any).stats ?? {};
    return {
      connected: node.connected,
      host: (node as any).options?.host ?? "",
      port: (node as any).options?.port ?? 0,
      players: stats.players ?? 0,
      playingPlayers: stats.playingPlayers ?? 0,
      uptime: stats.uptime ?? 0,
      memoryFree: stats.memory?.free ?? 0,
      memoryUsed: stats.memory?.used ?? 0,
      cpuCores: stats.cpu?.cores ?? 0,
      cpuLoad: stats.cpu?.lavalinkLoad ?? 0,
    };
  }

  async search(query: string, source: string) {
    if (!this.isReady) return { loadType: "empty", tracks: [] };
    const nodes = this.lavalink.nodeManager.leastUsedNodes("memory");
    if (!nodes.length) return { loadType: "empty", tracks: [] };

    const node = nodes[0];
    const searchQuery = source === "url" ? query : `${source}:${query}`;
    const result = await (node as any).request("GET", `/v4/loadtracks?identifier=${encodeURIComponent(searchQuery)}`).catch(() => null);
    if (!result) return { loadType: "empty", tracks: [] };

    return {
      loadType: result.loadType ?? "empty",
      tracks: (result.data?.tracks ?? result.tracks ?? []).slice(0, 20).map((t: any) => ({
        encoded: t.encoded,
        identifier: t.info?.identifier ?? "",
        title: t.info?.title ?? "Unknown",
        author: t.info?.author ?? "Unknown",
        duration: t.info?.length ?? 0,
        thumbnail: t.info?.artworkUrl ?? null,
        uri: t.info?.uri ?? null,
        sourceName: t.info?.sourceName ?? "",
        isStream: t.info?.isStream ?? false,
        requestedBy: null,
      })),
      playlistName: result.data?.info?.name ?? result.playlistInfo?.name ?? null,
    };
  }

  async playTrack(guildId: string, query: string, source: string, voiceChannelId?: string) {
    if (!this.isReady) throw new Error("Bot not ready");

    let player = this.lavalink.getPlayer(guildId);
    const vcId = voiceChannelId ?? player?.voiceChannelId;
    if (!vcId) throw new Error("No voice channel specified and no active player");

    if (!player) {
      player = this.lavalink.createPlayer({
        guildId,
        voiceChannelId: vcId,
        selfDeaf: true,
        volume: 80,
      });
    }
    if (!player.connected) await player.connect();

    const searchQuery = source === "url" ? query : `${source}:${query}`;
    const result = await player.search(searchQuery, { id: "dashboard", username: "Dashboard" });

    if (!result || result.loadType === "empty" || result.loadType === "error") {
      return { success: false, message: "No results found", tracksAdded: 0, track: null, playlistName: null };
    }

    if (result.loadType === "playlist") {
      for (const t of result.tracks) player.queue.add(t);
      if (!player.playing && !player.paused) await player.play({ paused: false });
      return {
        success: true,
        message: `Added ${result.tracks.length} tracks from playlist`,
        tracksAdded: result.tracks.length,
        track: null,
        playlistName: result.playlist?.name ?? null,
      };
    }

    const track = result.tracks[0];
    player.queue.add(track);
    if (!player.playing && !player.paused) await player.play({ paused: false });

    return {
      success: true,
      message: `Added ${track.info.title}`,
      tracksAdded: 1,
      track: mapTrack(track),
      playlistName: null,
    };
  }

  async pausePlayer(guildId: string) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    await player.pause(!player.paused);
    return this.getPlayer(guildId);
  }

  async skipTrack(guildId: string) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    await player.skip();
    return this.getPlayer(guildId);
  }

  async stopPlayer(guildId: string) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    player.queue.splice(0, player.queue.tracks.length);
    await player.stopPlaying(true, true);
    return this.getPlayer(guildId) ?? { guildId, isPlaying: false, isPaused: false, volume: 80, position: 0, loopMode: "none", currentTrack: null, voiceChannelId: null, voiceChannelName: null, queueSize: 0, nodeConnected: false };
  }

  async setVolume(guildId: string, volume: number) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    await player.setVolume(volume);
    return this.getPlayer(guildId);
  }

  async seekTrack(guildId: string, position: number) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    await player.seek(position);
    return this.getPlayer(guildId);
  }

  async shuffleQueue(guildId: string) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    player.queue.shuffle();
    return this.getQueue(guildId);
  }

  async setLoopMode(guildId: string, mode: string) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    // QueueRepeatMode: 0=OFF, 1=TRACK, 2=QUEUE
    const modeMap: Record<string, number> = {
      none: 0,
      track: 1,
      queue: 2,
    };
    player.setRepeatMode((modeMap[mode] ?? 0) as any);
    return this.getPlayer(guildId);
  }

  async removeFromQueue(guildId: string, index: number) {
    const player = this.lavalink.getPlayer(guildId);
    if (!player) throw new Error("No active player");
    player.queue.splice(index, 1);
    return this.getQueue(guildId);
  }

  getBotStats(startTime: number) {
    const mem = process.memoryUsage();
    let activePlayers = 0;
    let guildCount = 0;
    if (this.isReady) {
      guildCount = this.discord.guilds.cache.size;
      activePlayers = this.lavalink.playerManager?.size ?? 0;
    }
    return {
      guildCount,
      activePlayers,
      totalTracksPlayed: 0,
      uptimeMs: Date.now() - startTime,
      nodeConnected: this.getNodeStatus().connected,
      memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
    };
  }
}

function mapRepeatMode(mode: number): string {
  if (mode === 1) return "track";
  if (mode === 2) return "queue";
  return "none";
}

function mapTrack(t: any): TrackInfo {
  return {
    encoded: t.encoded ?? "",
    identifier: t.info?.identifier ?? "",
    title: t.info?.title ?? "Unknown",
    author: t.info?.author ?? "Unknown",
    duration: t.info?.length ?? t.info?.duration ?? 0,
    thumbnail: t.info?.artworkUrl ?? null,
    uri: t.info?.uri ?? null,
    sourceName: t.info?.sourceName ?? "",
    isStream: t.info?.isStream ?? false,
    requestedBy:
      t.info?.requester && typeof t.info.requester === "object"
        ? (t.info.requester as any).username ?? null
        : null,
  };
}

export const botBridge = new MusicBotBridge();
