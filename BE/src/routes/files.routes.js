import { Router } from "express";
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
} from "../controllers/files.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const filesRoutes = Router();

// Freelancer
filesRoutes.post("/", requireAuth, requireRole("freelancer"), createFileListing);
filesRoutes.get("/mine", requireAuth, requireRole("freelancer"), getMyFiles);
filesRoutes.post("/:fileId/upload", requireAuth, requireRole("freelancer"), uploadEncryptedZip);

// Client
filesRoutes.get("/assigned", requireAuth, requireRole("client"), getAssignedFiles);
filesRoutes.put("/:fileId/start-trial", requireAuth, requireRole("client"), startTrial);
filesRoutes.get("/:fileId/download-encrypted", requireAuth, requireRole("client"), downloadEncrypted);
filesRoutes.get("/:fileId/demo-build", requireAuth, requireRole("client"), downloadBuild);
filesRoutes.get("/:fileId/encryption-meta", requireAuth, requireRole("client"), getEncryptionMeta);
filesRoutes.get("/:fileId/key", requireAuth, requireRole("client"), getDecryptionKey);
filesRoutes.post("/decrypt", requireAuth, requireRole("client"), decryptUploadedFile);

// Escrow / Manual Bank Transfer Flow
filesRoutes.post("/:fileId/receipt", requireAuth, requireRole("client"), uploadReceipt);
filesRoutes.post("/:fileId/confirm", requireAuth, requireRole("freelancer"), confirmPayment);
filesRoutes.post("/:fileId/dispute", requireAuth, requireRole("client"), disputePayment);
