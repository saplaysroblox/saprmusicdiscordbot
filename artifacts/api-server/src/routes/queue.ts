import { Router } from "express";
import { z } from "zod/v4";
import { botBridge } from "../lib/bot-bridge.js";

export function createQueueRouter() {
  const router = Router();

  router.get("/guilds/:guildId/queue", async (req, res) => {
    const { guildId } = req.params;
    try {
      const queue = botBridge.getQueue(guildId);
      res.json(queue);
    } catch (err) {
      req.log.error({ err }, "getQueue failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.post("/guilds/:guildId/queue/shuffle", async (req, res) => {
    const { guildId } = req.params;
    try {
      const queue = await botBridge.shuffleQueue(guildId);
      res.json(queue);
    } catch (err: any) {
      res.status(400).json({ error: "shuffle_failed", message: err?.message });
    }
  });

  router.post("/guilds/:guildId/queue/loop", async (req, res) => {
    const { guildId } = req.params;
    try {
      const body = z.object({ mode: z.enum(["none", "track", "queue"]) }).parse(req.body);
      const state = await botBridge.setLoopMode(guildId, body.mode);
      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: "loop_failed", message: err?.message });
    }
  });

  router.delete("/guilds/:guildId/queue/:index", async (req, res) => {
    const { guildId } = req.params;
    const index = Number(req.params.index);
    if (isNaN(index)) return res.status(400).json({ error: "invalid_index" });
    try {
      const queue = await botBridge.removeFromQueue(guildId, index);
      res.json(queue);
    } catch (err: any) {
      res.status(400).json({ error: "remove_failed", message: err?.message });
    }
  });

  return router;
}
