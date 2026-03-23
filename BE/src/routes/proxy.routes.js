import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { proxyDemo } from "../controllers/files.controller.js";

export const proxyRoutes = Router();

// GET /proxy/demo/:fileId
proxyRoutes.get("/demo/:fileId", requireAuth, requireRole("client"), proxyDemo);
