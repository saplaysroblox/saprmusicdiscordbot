import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playHistoryTable = pgTable("play_history", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  guildName: text("guild_name"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  duration: integer("duration").notNull(),
  thumbnail: text("thumbnail"),
  uri: text("uri"),
  sourceName: text("source_name").notNull(),
  requestedBy: text("requested_by"),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const insertPlayHistorySchema = createInsertSchema(playHistoryTable).omit({ id: true, playedAt: true });
export type InsertPlayHistory = z.infer<typeof insertPlayHistorySchema>;
export type PlayHistory = typeof playHistoryTable.$inferSelect;
