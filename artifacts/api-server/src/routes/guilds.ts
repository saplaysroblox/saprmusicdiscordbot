import { Router } from "express";
import type { MusicBotBridge } from "../lib/bot-bridge.js";

export function createGuildsRouter(bridge: MusicBotBridge) {
  const router = Router();

  router.get("/guilds", async (req, res) => {
    try {
      const guilds = bridge.getGuilds();
      res.json(guilds);
    } catch (err) {
      req.log.error({ err }, "Failed to list guilds");
      res.status(500).json({ error: "internal_error", message: "Failed to list guilds" });
    }
  });

  return router;
}
