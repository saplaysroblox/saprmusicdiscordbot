import { Client, GatewayIntentBits, Collection } from "discord.js";
import { LavalinkManager } from "lavalink-client";
import type { SlashCommand } from "../types.js";

export class MusicClient extends Client {
  commands: Collection<string, SlashCommand> = new Collection();
  lavalink!: LavalinkManager;
  startTime = Date.now();
}

export function createClient(): MusicClient {
  const client = new MusicClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const lavalinkHost = process.env.LAVALINK_HOST ?? "localhost";
  const lavalinkPort = Number(process.env.LAVALINK_PORT ?? "2333");
  const lavalinkPassword = process.env.LAVALINK_PASSWORD ?? "youshallnotpass";

  client.lavalink = new LavalinkManager({
    nodes: [
      {
        authorization: lavalinkPassword,
        host: lavalinkHost,
        port: lavalinkPort,
        id: "main",
        retryAmount: 5,
        retryDelay: 3000,
      },
    ],
    sendToShard: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
    autoSkip: true,
    client: {
      id: process.env.DISCORD_CLIENT_ID!,
      username: "Harmonia",
    },
    playerOptions: {
      onDisconnect: {
        autoReconnect: true,
        destroyPlayer: false,
      },
      onEmptyQueue: {
        destroyAfterMs: 30_000,
      },
    },
  });

  return client;
}
