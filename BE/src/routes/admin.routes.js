import { Router } from "express";
import { getAllUsers, getAllDisputes, resolveDispute } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

// All admin routes require authentication + admin role
adminRoutes.use(requireAuth, requireRole("admin"));

adminRoutes.get("/users", getAllUsers);
adminRoutes.get("/disputes", getAllDisputes);
adminRoutes.post("/disputes/:fileId/resolve", resolveDispute);
