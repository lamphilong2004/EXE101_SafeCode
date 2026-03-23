import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getCredits } from "../controllers/billing.controller.js";

export const billingRoutes = Router();

billingRoutes.get("/credits", requireAuth, requireRole("freelancer"), getCredits);
