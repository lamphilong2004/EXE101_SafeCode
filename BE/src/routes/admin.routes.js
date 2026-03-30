import { Router } from "express";
import { getAllUsers, getAllDisputes, resolveDispute, getStats, manageUserCredits } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

// All admin routes require authentication + admin role
adminRoutes.use(requireAuth, requireRole("admin"));

adminRoutes.get("/stats", getStats);
adminRoutes.get("/users", getAllUsers);
adminRoutes.post("/users/:userId/credits", manageUserCredits);
adminRoutes.get("/disputes", getAllDisputes);
adminRoutes.post("/disputes/:fileId/resolve", resolveDispute);
