import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createCheckout, createPayosCheckout, createFilePaymentQr } from "../controllers/payments.controller.js";

export const paymentsRoutes = Router();

paymentsRoutes.post("/checkout/:fileId", requireAuth, requireRole("client"), createCheckout);
paymentsRoutes.post("/payos/:fileId", requireAuth, requireRole("client"), createPayosCheckout);
paymentsRoutes.post("/file-qr/:fileId", requireAuth, requireRole("client"), createFilePaymentQr);
