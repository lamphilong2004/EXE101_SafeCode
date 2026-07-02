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

    // Build real chart data (last 7 days)
    const today = new Date();
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      
      const dayName = start.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('Th ', 'T');
      chartData.push({ name: dayName, doanhThu: 0, users: 0, start, end });
    }

    const txLast7Days = await Transaction.aggregate([
      { $match: { status: "Succeeded", createdAt: { $gte: chartData[0].start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, dailyRevenue: { $sum: "$amount" } } }
    ]);

    const usersLast7Days = await User.aggregate([
      { $match: { createdAt: { $gte: chartData[0].start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, dailyUsers: { $sum: 1 } } }
    ]);

    chartData.forEach(day => {
      const dateStr = new Date(day.start.getTime() + 7*3600*1000).toISOString().split('T')[0];
      const tx = txLast7Days.find(t => t._id === dateStr);
      const usr = usersLast7Days.find(u => u._id === dateStr);
      day.doanhThu = tx ? tx.dailyRevenue : 0;
      day.users = usr ? usr.dailyUsers : 0;
    });

    // Recent Activities (Mix of recent users and transactions)
    const recentUsers = await User.find({ role: { $ne: 'admin' }, isVerified: true }).sort({ createdAt: -1 }).limit(3);
    const recentTx = await Transaction.find({ status: "Succeeded" }).sort({ createdAt: -1 }).limit(3);
    
    let recentActivities = [
      ...recentUsers.map(u => ({ time: u.createdAt, action: `User ${u.name || u.email} vừa đăng ký tài khoản.`, type: 'info' })),
      ...recentTx.map(t => ({ time: t.createdAt, action: `Giao dịch ${t.amount.toLocaleString()} VNĐ vừa thanh toán thành công.`, type: 'success' }))
    ].sort((a, b) => b.time - a.time).slice(0, 5);

    // map time to string
    recentActivities = recentActivities.map(a => {
      const mins = Math.floor((new Date() - a.time) / 60000);
      let timeStr = mins < 60 ? `${mins} phút trước` : (mins < 1440 ? `${Math.floor(mins/60)} giờ trước` : `${Math.floor(mins/1440)} ngày trước`);
      if (mins === 0) timeStr = 'Mới đây';
      return { ...a, time: timeStr };
    });

    res.json({
      totalUsers,
      totalFiles,
      totalDisputes,
      totalRevenue,
      totalTransactions,
      totalCreditsInCirculation,
      chartData,
      recentActivities
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

export async function toggleBan(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw httpError(404, "User not found");
    if (user.role === 'admin') throw httpError(403, "Cannot ban an admin");

    user.isBanned = !user.isBanned;
    await user.save();
    
    res.json({ success: true, message: user.isBanned ? "Tài khoản đã bị khóa" : "Tài khoản đã được mở khóa", isBanned: user.isBanned });
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
