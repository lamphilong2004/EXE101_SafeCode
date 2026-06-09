import { User } from "../models/User.js";
import { httpError } from "../middleware/error.js";
import { createNotification } from "../socket.js";

/**
 * Freelancer submits their KYC documents.
 * Body: { fullName, cccdNumber, cccdFront (base64/URL), cccdBack (base64/URL) }
 */
export async function submitKyc(req, res, next) {
  try {
    const { fullName, cccdNumber, cccdFront, cccdBack } = req.body || {};

    if (!fullName || !cccdNumber || !cccdFront || !cccdBack) {
      throw httpError(400, "fullName, cccdNumber, cccdFront, cccdBack are required");
    }

    const user = await User.findById(req.user.id);
    if (!user) throw httpError(401, "Unauthorized");

    if (user.kyc?.status === "approved") {
      throw httpError(409, "Your KYC has already been approved.");
    }

    user.kyc = {
      status: "pending",
      fullName: String(fullName).trim(),
      cccdNumber: String(cccdNumber).trim(),
      cccdFront: String(cccdFront),
      cccdBack: String(cccdBack),
      submittedAt: new Date(),
      reviewedAt: null,
      adminNote: null,
    };
    await user.save();

    res.json({ success: true, status: "pending" });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user's KYC status.
 */
export async function getMyKycStatus(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("kyc");
    if (!user) throw httpError(401, "Unauthorized");
    res.json({
      status: user.kyc?.status || "none",
      submittedAt: user.kyc?.submittedAt || null,
      reviewedAt: user.kyc?.reviewedAt || null,
      adminNote: user.kyc?.adminNote || null,
      fullName: user.kyc?.fullName || null,
    });
  } catch (err) {
    next(err);
  }
}

/* ─── Admin Only ─── */

/**
 * List all pending KYC requests (admin only).
 */
export async function getPendingKyc(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { "kyc.status": { $in: ["pending", "rejected"] } };
    if (req.query.status && ["pending", "approved", "rejected"].includes(req.query.status)) {
      filter["kyc.status"] = req.query.status;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email role kyc createdAt")
        .sort({ "kyc.submittedAt": -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin reviews a KYC submission: approve or reject.
 * Body: { action: 'approve' | 'reject', adminNote?: string }
 */
export async function reviewKyc(req, res, next) {
  try {
    const { userId } = req.params;
    const { action, adminNote } = req.body || {};

    if (!["approve", "reject"].includes(action)) {
      throw httpError(400, "action must be 'approve' or 'reject'");
    }

    const user = await User.findById(userId);
    if (!user) throw httpError(404, "User not found");
    if (user.kyc?.status !== "pending") {
      throw httpError(409, "No pending KYC submission for this user");
    }

    user.kyc.status = action === "approve" ? "approved" : "rejected";
    user.kyc.reviewedAt = new Date();
    user.kyc.adminNote = adminNote ? String(adminNote).trim() : null;
    await user.save();

    // Notify the user in real-time
    if (action === "approve") {
      createNotification(
        String(user._id),
        "Xác minh danh tính thành công! ✅",
        "Hồ sơ CCCD của bạn đã được Admin phê duyệt. Bạn có thể rút tiền và thực hiện giao dịch đầy đủ.",
        { type: "system" }
      );
    } else {
      createNotification(
        String(user._id),
        "Xác minh danh tính bị từ chối",
        `Hồ sơ CCCD của bạn bị từ chối. Lý do: ${adminNote || "Không đủ điều kiện"}. Vui lòng nộp lại.`,
        { type: "system" }
      );
    }

    res.json({ success: true, status: user.kyc.status });
  } catch (err) {
    next(err);
  }
}
