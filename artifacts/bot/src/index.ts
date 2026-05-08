import "dotenv/config";
import { Collection } from "discord.js";
import { createClient } from "./lib/client.js";
import { logger } from "./lib/logger.js";
import { registerLavalinkEvents } from "./events/lavalink-track-start.js";
import { event as readyEvent } from "./events/ready.js";
import { event as interactionEvent } from "./events/interaction-create.js";
import { event as voiceStateEvent } from "./events/voice-state-update.js";
import { command as playCmd } from "./commands/play.js";
import { command as skipCmd } from "./commands/skip.js";
import { command as pauseCmd } from "./commands/pause.js";
import { command as stopCmd } from "./commands/stop.js";
import { command as queueCmd } from "./commands/queue.js";
import { command as volumeCmd } from "./commands/volume.js";
import { command as shuffleCmd } from "./commands/shuffle.js";
import { command as loopCmd } from "./commands/loop.js";
import { command as nowplayingCmd } from "./commands/nowplaying.js";
import { command as searchCmd } from "./commands/search.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) throw new Error("DISCORD_BOT_TOKEN is required");

const client = createClient();

// Register commands
for (const cmd of [
  playCmd,
  skipCmd,
  pauseCmd,
  stopCmd,
  queueCmd,
  volumeCmd,
  shuffleCmd,
  loopCmd,
  nowplayingCmd,
  searchCmd,
]) {
  client.commands.set(cmd.data.name, cmd);
}

// Register Discord events
client.on(readyEvent.name, (...args) => readyEvent.execute(client));
client.on(interactionEvent.name, (...args) =>
  interactionEvent.execute(args[0] as any, client)
);
client.on(voiceStateEvent.name, (...args) =>
  voiceStateEvent.execute(args[0] as any, args[1] as any, client)
);

// Lavalink events — forward raw gateway packets
client.on("raw", (d) => client.lavalink.sendRawData(d as any));

// Register lavalink events
registerLavalinkEvents(client);

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled rejection");
});

logger.info("Starting Harmonia bot...");
await client.login(token);
