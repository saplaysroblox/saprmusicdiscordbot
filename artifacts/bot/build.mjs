import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts", "src/deploy-commands.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  external: [
    "discord.js",
    "lavalink-client",
    "pino",
    "pino-pretty",
    "dotenv",
    "pg",
    "pg-native",
    "drizzle-orm",
    "drizzle-orm/*",
    "@node-rs/*",
    "*.node",
  ],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

console.log("Bot build complete");
