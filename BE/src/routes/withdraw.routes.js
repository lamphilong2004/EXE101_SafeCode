import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { 
  createWithdrawRequest, 
  getMyWithdrawRequests, 
  getAllWithdrawRequests, 
  approveWithdrawRequest, 
  rejectWithdrawRequest 
} from "../controllers/withdraw.controller.js";

export const withdrawRoutes = Router();

// Freelancer routes
withdrawRoutes.post("/", requireAuth, requireRole("freelancer"), createWithdrawRequest);
withdrawRoutes.get("/", requireAuth, requireRole("freelancer"), getMyWithdrawRequests);

// Admin routes
withdrawRoutes.get("/all", requireAuth, requireRole("admin"), getAllWithdrawRequests);
withdrawRoutes.post("/:id/approve", requireAuth, requireRole("admin"), approveWithdrawRequest);
withdrawRoutes.post("/:id/reject", requireAuth, requireRole("admin"), rejectWithdrawRequest);
