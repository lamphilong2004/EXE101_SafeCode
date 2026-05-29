import { consumeHeartbeat } from "../services/credit.service.js";
import { PreviewSession } from "../models/PreviewSession.js";
import { httpError } from "../middleware/error.js";

/**
 * Handle heartbeat from frontend to keep sandbox alive and deduct credits.
 */
export async function handleHeartbeat(req, res, next) {
  try {
    const { fileId } = req.body;
    if (!fileId) throw httpError(400, "Missing fileId");

    const result = await consumeHeartbeat(req.user.id, fileId);
    
    res.json({
      success: true,
      ...result, // { cost, balance, isFree }
    });
  } catch (err) {
    // If credit deduction fails (insufficient credits), we send specialized status
    if (err.status === 402) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits. Sandbox will be terminated.",
        code: "INSUFFICIENT_CREDITS"
      });
    }
    next(err);
  }
}

/**
 * Explicitly stop a preview session.
 */
export async function stopPreview(req, res, next) {
  try {
    const { fileId } = req.body;
    await PreviewSession.findOneAndUpdate(
      { userId: req.user.id, fileId, status: "active" },
      { status: "completed", endTime: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
