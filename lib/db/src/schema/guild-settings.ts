import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const guildSettingsTable = pgTable("guild_settings", {
  guildId: text("guild_id").primaryKey(),
  prefix: text("prefix").notNull().default("!"),
  defaultVolume: integer("default_volume").notNull().default(80),
  djRoleId: text("dj_role_id"),
  textChannelId: text("text_channel_id"),
  autoplay: boolean("autoplay").notNull().default(false),
  announceNowPlaying: boolean("announce_now_playing").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGuildSettingsSchema = createInsertSchema(guildSettingsTable);
export type InsertGuildSettings = z.infer<typeof insertGuildSettingsSchema>;
export type GuildSettings = typeof guildSettingsTable.$inferSelect;
