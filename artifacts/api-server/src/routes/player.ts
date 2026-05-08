import { Router } from "express";
import { z } from "zod/v4";
import {
  PlayTrackBody,
  VolumeRequest,
  SeekTrackBody,
  LoopRequest,
} from "@workspace/api-zod";
import { botBridge } from "../lib/bot-bridge.js";

export function createPlayerRouter() {
  const router = Router();

  router.get("/guilds/:guildId/player", async (req, res) => {
    const { guildId } = req.params;
    try {
      const state = botBridge.getPlayer(guildId);
      if (!state) {
        return res.status(404).json({ error: "not_found", message: "No active player for this guild" });
      }
      res.json(state);
    } catch (err) {
      req.log.error({ err }, "getPlayer failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.post("/guilds/:guildId/player/play", async (req, res) => {
    const { guildId } = req.params;
    try {
      const body = PlayTrackBody.parse(req.body);
      const result = await botBridge.playTrack(
        guildId,
        body.query,
        body.source ?? "ytsearch",
        body.voiceChannelId ?? undefined
      );
      res.json(result);
    } catch (err: any) {
      req.log.error({ err }, "playTrack failed");
      if (err?.name === "ZodError") return res.status(400).json({ error: "validation_error", message: String(err) });
      res.status(400).json({ error: "play_failed", message: err?.message ?? "Failed to play" });
    }
  });

  router.post("/guilds/:guildId/player/pause", async (req, res) => {
    const { guildId } = req.params;
    try {
      const state = await botBridge.pausePlayer(guildId);
      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: "pause_failed", message: err?.message });
    }
  });

  router.post("/guilds/:guildId/player/skip", async (req, res) => {
    const { guildId } = req.params;
    try {
      const state = await botBridge.skipTrack(guildId);
      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: "skip_failed", message: err?.message });
    }
  });

  router.post("/guilds/:guildId/player/stop", async (req, res) => {
    const { guildId } = req.params;
    try {
      const state = await botBridge.stopPlayer(guildId);
      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: "stop_failed", message: err?.message });
    }
  });

  router.post("/guilds/:guildId/player/volume", async (req, res) => {
    const { guildId } = req.params;
    try {
      const body = SetVolumeBody.parse(req.body);
      const state = await botBridge.setVolume(guildId, body.volume);
      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: "volume_failed", message: err?.message });
    }
  });

  router.post("/guilds/:guildId/player/seek", async (req, res) => {
    const { guildId } = req.params;
    try {
      const body = SeekTrackBody.parse(req.body);
      const state = await botBridge.seekTrack(guildId, body.position);
      res.json(state);
    } catch (err: any) {
      res.status(400).json({ error: "seek_failed", message: err?.message });
    }
  });

  return router;
}

const SetVolumeBody = z.object({ volume: z.number().min(0).max(200) });
