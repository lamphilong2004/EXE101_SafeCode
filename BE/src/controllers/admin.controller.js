import { User } from "../models/User.js";
import { File } from "../models/File.js";
import { Transaction } from "../models/Transaction.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { httpError } from "../middleware/error.js";
import { adjustCredits } from "../services/credit.service.js";

/* ─── Stats ─── */

export async function getStats(req, res, next) {
  try {
    const [totalUsers, totalFiles, totalDisputes, transactions] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      File.countDocuments({ status: { $in: ["Disputed", "AwaitingEvidence"] } }),
      Transaction.aggregate([
        { $match: { status: "Succeeded" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = transactions[0]?.totalRevenue || 0;
    const totalTransactions = transactions[0]?.count || 0;

    // Count total credits in circulation
    const creditAgg = await User.aggregate([
      { $group: { _id: null, totalCredits: { $sum: "$credits" } } },
    ]);
    const totalCreditsInCirculation = creditAgg[0]?.totalCredits || 0;

    res.json({
      totalUsers,
      totalFiles,
      totalDisputes,
      totalRevenue,
      totalTransactions,
      totalCreditsInCirculation,
    });
  } catch (err) {
    next(err);
  }
}

/* ─── Users (paginated) ─── */

export async function getAllUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}).select("-passwordHash -refreshTokenVersion").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    res.json({ users, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/* ─── Disputes (paginated) ─── */

export async function getAllDisputes(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { status: { $in: ["Disputed", "AwaitingEvidence"] } };

    const [disputes, total] = await Promise.all([
      File.find(filter)
        .populate("freelancerId", "name email phone payoutSettings")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      File.countDocuments(filter),
    ]);

    res.json({ disputes, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/* ─── Dispute Resolution ─── */

export async function resolveDispute(req, res, next) {
  try {
    const { fileId } = req.params;
    const { action } = req.body; // 'confirm' | 'reject' | 'requestMoreInfo'

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (!["Disputed", "AwaitingEvidence"].includes(fileDoc.status)) {
      throw httpError(409, "This case is not in a disputable state");
    }

    if (action === "confirm") {
      fileDoc.status = "Paid";
      fileDoc.paidAt = new Date();
      fileDoc.adminNote = "Admin force-confirmed payment.";
    } else if (action === "reject") {
      fileDoc.status = "Closed";
      fileDoc.adminNote = "Admin rejected dispute. Payment deemed invalid.";
    } else if (action === "requestMoreInfo") {
      fileDoc.status = "AwaitingEvidence";
      fileDoc.disputeDeadline = new Date(Date.now() + 48 * 3600 * 1000); // 48h deadline
      fileDoc.adminNote = "Admin requesting more evidence. 48h deadline.";
    } else {
      throw httpError(400, "action must be 'confirm', 'reject', or 'requestMoreInfo'");
    }

    await fileDoc.save();
    res.json({ success: true, status: fileDoc.status, adminNote: fileDoc.adminNote });
  } catch (err) {
    next(err);
  }
}

/* ─── Credit Management ─── */

export async function manageUserCredits(req, res, next) {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || typeof amount !== "number") {
      throw httpError(400, "amount (number) is required");
    }

    const newBalance = await adjustCredits(userId, {
      amount,
      reason: reason || "Admin adjustment",
      adminId: req.user.id,
    });

    res.json({ success: true, userId, newBalance });
  } catch (err) {
    next(err);
  }
}
