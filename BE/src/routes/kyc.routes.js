import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { submitKyc, getMyKycStatus, getPendingKyc, reviewKyc } from "../controllers/kyc.controller.js";

const router = Router();

// Freelancer routes
router.get("/me", requireAuth, getMyKycStatus);
router.post("/submit", requireAuth, submitKyc);

// Admin routes
router.get("/pending", requireAuth, requireRole("admin"), getPendingKyc);
router.post("/:userId/review", requireAuth, requireRole("admin"), reviewKyc);

export default router;
