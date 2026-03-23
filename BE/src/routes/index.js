import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { billingRoutes } from "./billing.routes.js";
import { filesRoutes } from "./files.routes.js";
import { paymentsRoutes } from "./payments.routes.js";
import { proxyRoutes } from "./proxy.routes.js";
import { webhooksRoutes } from "./webhooks.routes.js";
import { adminRoutes } from "./admin.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/billing", billingRoutes);
routes.use("/files", filesRoutes);
routes.use("/payments", paymentsRoutes);
routes.use("/proxy", proxyRoutes);
routes.use("/admin", adminRoutes);

// keep webhooks separate: uses raw body
routes.use("/webhooks", webhooksRoutes);
