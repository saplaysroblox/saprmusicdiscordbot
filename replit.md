# Harmonia — Discord Music Bot + Dashboard

## Overview

pnpm workspace monorepo. Harmonia is a Discord music bot with a React web dashboard. The bot runs **in-process with the API server** so they share live state (no Redis/IPC needed).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild
- **Discord**: discord.js v14
- **Audio**: lavalink-client v2, Lavalink node (external)
- **Dashboard**: React + Vite + Tailwind + shadcn/ui

## Packages

| Package | Path | Role |
|---|---|---|
| `@workspace/api-server` | `artifacts/api-server` | Express API + Discord bot startup |
| `@workspace/music-dashboard` | `artifacts/music-dashboard` | React dashboard UI |
| `@workspace/bot` | `artifacts/bot` | Bot source + deploy-commands script |
| `@workspace/db` | `lib/db` | Drizzle schema + DB client |
| `@workspace/api-zod` | `lib/api-zod` | Zod schemas from OpenAPI codegen |
| `@workspace/api-client-react` | `lib/api-client-react` | React Query hooks from codegen |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI spec |

## Architecture

The **API server** starts the Discord bot in-process via `src/lib/start-bot.ts`. On `ClientReady`, the bot injects the Discord `Client` and `LavalinkManager` into the `botBridge` singleton (`src/lib/bot-bridge.ts`). All API routes then query the bridge for live player/guild state.

```
API Server process
├─ Express routes (/api/...)
│   └─ botBridge (singleton)
└─ Discord bot (in-process, wired to bridge on ready)
    ├─ discord.js Client
    └─ LavalinkManager → Lavalink node (external)
```

## Workflows

- `artifacts/api-server: API Server` — builds + runs API server (which also runs the bot)
- `artifacts/music-dashboard: web` — Vite dev server for the dashboard

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run generate` — generate SQL migration files (lib/db/drizzle/)
- `pnpm --filter @workspace/bot run deploy-commands` — register slash commands with Discord

## Self-Hosting (Docker)

Files: `Dockerfile`, `Dockerfile.dashboard`, `docker-compose.yml`, `nginx.conf`, `lavalink/application.yml`, `.env.example`

```sh
cp .env.example .env        # fill in DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, SESSION_SECRET
docker compose up -d --build
```

Dashboard available at `http://your-server-ip:3000`. The API runs migrations automatically on startup. Lavalink and PostgreSQL are included in the compose stack.

## Environment Variables

| Secret | Purpose |
|---|---|
| `DISCORD_BOT_TOKEN` | Bot login token |
| `DISCORD_CLIENT_ID` | Application/client ID |
| `DISCORD_CLIENT_SECRET` | OAuth secret (for future auth) |
| `LAVALINK_HOST` | Lavalink server hostname |
| `LAVALINK_PORT` | Lavalink server port |
| `LAVALINK_PASSWORD` | Lavalink auth password |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret |

## Database Tables

- `guild_settings` — per-guild config (DJ role, prefix, etc.)
- `play_history` — track play log (title, author, duration, guild, timestamp)

## Dashboard Pages

- `/` — Dashboard (stats, node status, recent history)
- `/servers` — Server list with icons + member counts
- `/servers/:guildId/player` — Player controls, now playing, queue management
- `/servers/:guildId/search` — Search YouTube/SoundCloud, add to queue
- `/servers/:guildId/settings` — Guild settings
- `/history` — Global play history
