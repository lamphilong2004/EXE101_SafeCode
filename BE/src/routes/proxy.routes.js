import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { proxyDemo } from "../controllers/files.controller.js";
import fs from "fs";
import path from "path";

export const proxyRoutes = Router();

// GET /proxy/demo/:fileId
proxyRoutes.get("/demo/:fileId", requireAuth, requireRole("client"), proxyDemo);

// GET /proxy/mock-s3
proxyRoutes.get("/mock-s3", (req, res) => {
  const { bucket, key } = req.query;
  if (!bucket || !key) {
    return res.status(400).send("Missing bucket or key query params");
  }

  const localPath = path.join("uploads", String(bucket), String(key));
  if (!fs.existsSync(localPath)) {
    console.error(`[MOCK S3] File not found: ${localPath}`);
    return res.status(404).send("File not found in local mock S3");
  }

  res.setHeader("Content-Disposition", `attachment; filename="${path.basename(localPath)}"`);
  fs.createReadStream(localPath).pipe(res);
});
