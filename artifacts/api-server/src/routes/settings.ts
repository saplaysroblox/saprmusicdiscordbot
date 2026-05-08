import { Router } from "express";
import { db, guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateGuildSettingsBody } from "@workspace/api-zod";

export function createSettingsRouter() {
  const router = Router();

  router.get("/guilds/:guildId/settings", async (req, res) => {
    const { guildId } = req.params;
    try {
      const rows = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.guildId, guildId));
      if (rows.length === 0) {
        const defaults = {
          guildId,
          prefix: "!",
          defaultVolume: 80,
          djRoleId: null,
          textChannelId: null,
          autoplay: false,
          announceNowPlaying: true,
        };
        await db.insert(guildSettingsTable).values({ ...defaults, updatedAt: new Date() }).onConflictDoNothing();
        return res.json(defaults);
      }
      const s = rows[0];
      res.json({
        guildId: s.guildId,
        prefix: s.prefix,
        defaultVolume: s.defaultVolume,
        djRoleId: s.djRoleId ?? null,
        textChannelId: s.textChannelId ?? null,
        autoplay: s.autoplay,
        announceNowPlaying: s.announceNowPlaying,
      });
    } catch (err) {
      req.log.error({ err }, "getGuildSettings failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.put("/guilds/:guildId/settings", async (req, res) => {
    const { guildId } = req.params;
    try {
      const body = UpdateGuildSettingsBody.parse(req.body);
      await db
        .insert(guildSettingsTable)
        .values({ guildId, prefix: "!", defaultVolume: 80, autoplay: false, announceNowPlaying: true, updatedAt: new Date(), ...body })
        .onConflictDoUpdate({
          target: guildSettingsTable.guildId,
          set: { ...body, updatedAt: new Date() },
        });
      const rows = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.guildId, guildId));
      const s = rows[0];
      res.json({
        guildId: s.guildId,
        prefix: s.prefix,
        defaultVolume: s.defaultVolume,
        djRoleId: s.djRoleId ?? null,
        textChannelId: s.textChannelId ?? null,
        autoplay: s.autoplay,
        announceNowPlaying: s.announceNowPlaying,
      });
    } catch (err: any) {
      req.log.error({ err }, "updateGuildSettings failed");
      if (err?.name === "ZodError") return res.status(400).json({ error: "validation_error", message: String(err) });
      res.status(500).json({ error: "internal_error" });
    }
  });

  return router;
}
