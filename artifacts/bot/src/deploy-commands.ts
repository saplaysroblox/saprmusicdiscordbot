import "dotenv/config";
import { REST, Routes } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;

const rest = new REST().setToken(token);

// Fetch existing commands so we can preserve the Entry Point command
const existing = (await rest.get(Routes.applicationCommands(clientId))) as any[];
const entryPoint = existing.find((c: any) => c.type === 4);

const commands = [
  {
    name: "play",
    description: "Play a song or playlist",
    type: 1,
    options: [
      { name: "query", description: "Song name, URL, or YouTube link", type: 3, required: true },
      {
        name: "source", description: "Search source", type: 3, required: false,
        choices: [
          { name: "YouTube", value: "ytsearch" },
          { name: "SoundCloud", value: "scsearch" },
          { name: "Direct URL", value: "url" },
        ],
      },
    ],
  },
  { name: "skip", description: "Skip the current track", type: 1 },
  { name: "pause", description: "Pause or resume playback", type: 1 },
  { name: "stop", description: "Stop playback and clear the queue", type: 1 },
  {
    name: "queue", description: "Show the current queue", type: 1,
    options: [{ name: "page", description: "Page number", type: 4, required: false, min_value: 1 }],
  },
  {
    name: "volume", description: "Set playback volume", type: 1,
    options: [{ name: "level", description: "Volume level (0-200)", type: 4, required: true, min_value: 0, max_value: 200 }],
  },
  { name: "shuffle", description: "Shuffle the queue", type: 1 },
  {
    name: "loop", description: "Set loop mode", type: 1,
    options: [{
      name: "mode", description: "Loop mode", type: 3, required: true,
      choices: [
        { name: "Off", value: "none" },
        { name: "Track", value: "track" },
        { name: "Queue", value: "queue" },
      ],
    }],
  },
  { name: "nowplaying", description: "Show the currently playing track", type: 1 },
  {
    name: "search", description: "Search and pick a track to play", type: 1,
    options: [
      { name: "query", description: "Search query", type: 3, required: true },
      {
        name: "source", description: "Search source", type: 3, required: false,
        choices: [
          { name: "YouTube", value: "ytsearch" },
          { name: "SoundCloud", value: "scsearch" },
        ],
      },
    ],
  },
];

// Include the Entry Point command if it exists (required by Discord)
const body = entryPoint ? [...commands, { id: entryPoint.id, name: entryPoint.name, type: entryPoint.type, description: entryPoint.description ?? "" }] : commands;

console.log(`Registering ${body.length} commands (${entryPoint ? "including Entry Point" : "no Entry Point found"})...`);
const data = await rest.put(Routes.applicationCommands(clientId), { body });
console.log(`Successfully registered ${(data as any[]).length} commands.`);
