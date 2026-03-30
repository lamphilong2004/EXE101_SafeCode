import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, register, updatePayoutSettings } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const authRoutes = Router();

// Stricter rate limit for auth endpoints (brute-force prevention)
const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please try again in 1 minute." },
});

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.get("/me", requireAuth, me);
authRoutes.put("/me/payout", requireAuth, requireRole("freelancer"), updatePayoutSettings);
