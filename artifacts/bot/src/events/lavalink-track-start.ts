import type { MusicClient } from "../lib/client.js";
import { logPlayHistory } from "../lib/player-helper.js";
import { logger } from "../lib/logger.js";

export function registerLavalinkEvents(client: MusicClient) {
  client.lavalink.on("trackStart", async (player, track) => {
    logger.info({ guildId: player.guildId, track: track.info.title }, "Track started");

    const guild = client.guilds.cache.get(player.guildId);
    await logPlayHistory(player.guildId, guild?.name, track);
  });

  client.lavalink.on("trackEnd", async (player, track) => {
    logger.info({ guildId: player.guildId, track: track.info.title }, "Track ended");
  });

  client.lavalink.on("trackError", async (player, track, payload) => {
    logger.error({ guildId: player.guildId, track: track?.info.title, payload }, "Track error");
  });

  client.lavalink.on("playerDestroy", (player) => {
    logger.info({ guildId: player.guildId }, "Player destroyed");
  });

  client.lavalink.nodeManager.on("connect", (node) => {
    logger.info({ nodeId: node.id }, "Lavalink node connected");
  });

  client.lavalink.nodeManager.on("disconnect", (node, reason) => {
    logger.warn({ nodeId: node.id, reason }, "Lavalink node disconnected");
  });

  client.lavalink.nodeManager.on("error", (node, err) => {
    logger.error({ nodeId: node.id, err }, "Lavalink node error");
  });
}
