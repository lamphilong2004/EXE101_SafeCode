import { Router } from "express";
import { handleHeartbeat, stopPreview } from "../controllers/preview.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const previewRoutes = Router();

previewRoutes.post("/heartbeat", requireAuth, handleHeartbeat);
previewRoutes.post("/stop", requireAuth, stopPreview);
