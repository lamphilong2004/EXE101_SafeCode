import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { calculateUploadCost } from "../services/credit.service.js";
import { httpError } from "../middleware/error.js";

export const creditRoutes = Router();

// Any authenticated user can view their credit history
creditRoutes.get("/history", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      CreditHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CreditHistory.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ records, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// Estimate upload cost before committing
creditRoutes.post("/estimate", requireAuth, async (req, res, next) => {
  try {
    const { projectType, sizeBytes } = req.body || {};

    if (!projectType || sizeBytes === undefined) {
      throw httpError(400, "projectType and sizeBytes are required");
    }

    const cost = calculateUploadCost({
      projectType: projectType || "code",
      sizeBytes: Number(sizeBytes) || 0,
    });

    res.json({
      estimatedCredits: cost,
      breakdown: {
        baseCost: 1,
        typeFactor: projectType === "web" ? 2 : projectType === "app" ? 5 : 0,
        sizeFactor: cost - 1 - (projectType === "web" ? 2 : projectType === "app" ? 5 : 0),
      },
    });
  } catch (err) {
    next(err);
  }
});
