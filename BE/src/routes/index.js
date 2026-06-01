import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { billingRoutes } from "./billing.routes.js";
import { creditRoutes } from "./credit.routes.js";
import { filesRoutes } from "./files.routes.js";
import { paymentsRoutes } from "./payments.routes.js";
import { proxyRoutes } from "./proxy.routes.js";
import { webhooksRoutes } from "./webhooks.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { previewRoutes } from "./preview.routes.js";
import { messagesRoutes } from "./messages.routes.js";
import { notificationsRoutes } from "./notifications.routes.js";
import { reviewsRoutes } from "./reviews.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/billing", billingRoutes);
routes.use("/credits", creditRoutes);
routes.use("/files", filesRoutes);
routes.use("/payments", paymentsRoutes);
routes.use("/proxy", proxyRoutes);
routes.use("/preview", previewRoutes);
routes.use("/admin", adminRoutes);
routes.use("/messages", messagesRoutes);
routes.use("/notifications", notificationsRoutes);
routes.use("/reviews", reviewsRoutes);

// keep webhooks separate: uses raw body
routes.use("/webhooks", webhooksRoutes);
