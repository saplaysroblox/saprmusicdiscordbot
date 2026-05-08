import { Router } from "express";
import { db, playHistoryTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { botBridge } from "../lib/bot-bridge.js";

const startTime = Date.now();

export function createStatsRouter() {
  const router = Router();

  router.get("/stats", async (req, res) => {
    try {
      const stats = botBridge.getBotStats(startTime);
      res.json(stats);
    } catch (err) {
      req.log.error({ err }, "getBotStats failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.get("/history", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    try {
      const rows = await db
        .select()
        .from(playHistoryTable)
        .orderBy(desc(playHistoryTable.playedAt))
        .limit(limit);
      res.json(rows.map((r) => ({
        id: r.id,
        guildId: r.guildId,
        guildName: r.guildName ?? null,
        title: r.title,
        author: r.author,
        duration: r.duration,
        thumbnail: r.thumbnail ?? null,
        uri: r.uri ?? null,
        sourceName: r.sourceName,
        playedAt: r.playedAt.toISOString(),
        requestedBy: r.requestedBy ?? null,
      })));
    } catch (err) {
      req.log.error({ err }, "getPlayHistory failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.get("/node/status", async (req, res) => {
    try {
      const status = botBridge.getNodeStatus();
      res.json(status);
    } catch (err) {
      req.log.error({ err }, "getNodeStatus failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  return router;
}
