import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createFileListing,
  decryptUploadedFile,
  downloadBuild,
  downloadEncrypted,
  getEncryptionMeta,
  getAssignedFiles,
  startTrial,
  getDecryptionKey,
  getMyFiles,
  uploadEncryptedZip,
  uploadReceipt,
  confirmPayment,
  disputePayment,
  getFileStatus,
  verifyRepo,
  completeOrder,
} from "../controllers/files.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const licenseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased for better UX during testing
  message: { message: "Too many activation attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const filesRoutes = Router();

// Freelancer
filesRoutes.post("/verify-repo", requireAuth, requireRole("freelancer"), verifyRepo);
filesRoutes.post("/", requireAuth, requireRole("freelancer"), createFileListing);
filesRoutes.get("/mine", requireAuth, requireRole("freelancer"), getMyFiles);
filesRoutes.post("/:fileId/upload", requireAuth, requireRole("freelancer"), uploadEncryptedZip);

// Client
filesRoutes.get("/assigned", requireAuth, requireRole("client"), getAssignedFiles);
filesRoutes.get("/:fileId/status", requireAuth, getFileStatus);
filesRoutes.put("/:fileId/start-trial", requireAuth, requireRole("client"), startTrial);
filesRoutes.get("/:fileId/download-encrypted", requireAuth, requireRole("client"), downloadEncrypted);
filesRoutes.get("/:fileId/demo-build", requireAuth, requireRole("client"), downloadBuild);
filesRoutes.get("/:fileId/encryption-meta", requireAuth, requireRole("client"), getEncryptionMeta);
filesRoutes.post("/:fileId/key", requireAuth, requireRole("client"), licenseLimiter, getDecryptionKey);
filesRoutes.post("/decrypt", requireAuth, requireRole("client"), decryptUploadedFile);

// Escrow / Manual Bank Transfer Flow
filesRoutes.post("/:fileId/receipt", requireAuth, requireRole("client"), uploadReceipt);
filesRoutes.post("/:fileId/confirm", requireAuth, requireRole("freelancer"), confirmPayment);
filesRoutes.post("/:fileId/dispute", requireAuth, requireRole("client"), disputePayment);
filesRoutes.post("/:fileId/complete-order", requireAuth, requireRole("client"), completeOrder);
