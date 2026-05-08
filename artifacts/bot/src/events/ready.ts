import { Events } from "discord.js";
import type { MusicClient } from "../lib/client.js";
import { logger } from "../lib/logger.js";

export const event = {
  name: Events.ClientReady,
  once: true,
  async execute(client: MusicClient) {
    logger.info(`Logged in as ${client.user?.tag}`);
    await client.lavalink.init({ id: client.user!.id, username: client.user!.username });
    logger.info("Lavalink manager initialized");
  },
};
