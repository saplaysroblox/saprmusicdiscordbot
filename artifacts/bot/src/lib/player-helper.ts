import type { MusicClient } from "./client.js";
import type { GuildMember } from "discord.js";
import { db, playHistoryTable } from "@workspace/db";

export async function getOrCreatePlayer(client: MusicClient, guildId: string, voiceChannelId: string) {
  let player = client.lavalink.getPlayer(guildId);
  if (!player) {
    player = client.lavalink.createPlayer({
      guildId,
      voiceChannelId,
      selfDeaf: true,
      selfMute: false,
      volume: 80,
    });
  }
  if (!player.connected) {
    await player.connect();
  }
  return player;
}

export function getVoiceChannel(member: GuildMember) {
  return member.voice.channel;
}

export async function logPlayHistory(
  guildId: string,
  guildName: string | undefined,
  track: {
    info: {
      title: string;
      author: string;
      duration: number;
      artworkUrl?: string | null;
      uri?: string | null;
      sourceName: string;
      requester?: { username?: string } | null;
    };
  }
) {
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
        track.info.requester && typeof track.info.requester === "object" && "username" in track.info.requester
          ? (track.info.requester as { username?: string }).username ?? null
          : null,
    });
  } catch {
    // non-critical
  }
}
