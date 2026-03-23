import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createCheckout } from "../controllers/payments.controller.js";

export const paymentsRoutes = Router();

paymentsRoutes.post("/checkout/:fileId", requireAuth, requireRole("client"), createCheckout);
