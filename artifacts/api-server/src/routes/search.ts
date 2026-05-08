import { Router } from "express";
import { botBridge } from "../lib/bot-bridge.js";

export function createSearchRouter() {
  const router = Router();

  router.get("/search", async (req, res) => {
    const q = req.query.q as string;
    const source = (req.query.source as string) ?? "ytsearch";

    if (!q) return res.status(400).json({ error: "validation_error", message: "Query parameter 'q' is required" });

    try {
      const result = await botBridge.search(q, source);
      res.json(result);
    } catch (err) {
      req.log.error({ err }, "search failed");
      res.status(500).json({ error: "search_failed", message: "Search failed" });
    }
  });

  return router;
}
