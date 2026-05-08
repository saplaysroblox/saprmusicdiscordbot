import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import { createGuildsRouter } from "./guilds.js";
import { createPlayerRouter } from "./player.js";
import { createQueueRouter } from "./queue.js";
import { createSearchRouter } from "./search.js";
import { createSettingsRouter } from "./settings.js";
import { createStatsRouter } from "./stats.js";
import { botBridge } from "../lib/bot-bridge.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(createGuildsRouter(botBridge));
router.use(createPlayerRouter());
router.use(createQueueRouter());
router.use(createSearchRouter());
router.use(createSettingsRouter());
router.use(createStatsRouter());

export default router;
