import { Router } from "express";
import { login, me, register, updatePayoutSettings } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", requireAuth, me);
authRoutes.put("/me/payout", requireAuth, requireRole("freelancer"), updatePayoutSettings);
