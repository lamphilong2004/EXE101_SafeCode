import { Router } from "express";
import { getAllUsers, getAllDisputes, resolveDispute, getStats, manageUserCredits, toggleBan } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

// All admin routes require authentication + admin role
adminRoutes.use(requireAuth, requireRole("admin"));

adminRoutes.get("/stats", getStats);
adminRoutes.get("/users", getAllUsers);
adminRoutes.put("/users/:id/ban", toggleBan);
adminRoutes.post("/users/:userId/credits", manageUserCredits);
adminRoutes.get("/disputes", getAllDisputes);
adminRoutes.post("/disputes/:fileId/resolve", resolveDispute);

// [NEW] Get all transactions for history
adminRoutes.get("/transactions", async (req, res, next) => {
  try {
    const { Transaction } = await import("../models/Transaction.js");
    const transactions = await Transaction.find()
      .populate("freelancerId", "name email")
      .populate("fileId", "title")
      .sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

// [NEW] Get all credit requests
adminRoutes.get("/credit-requests", async (req, res, next) => {
  try {
    const { CreditRequest } = await import("../models/CreditRequest.js");
    const requests = await CreditRequest.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// [NEW] Approve a credit request
adminRoutes.post("/credit-requests/:id/approve", async (req, res, next) => { console.log('Approve credit request called with id:', req.params.id, 'user:', req.user?.id); if (!req.user) { return res.status(401).json({ error: 'Authentication required' }); }
  try {
    const { CreditRequest } = await import("../models/CreditRequest.js");
    const { User } = await import("../models/User.js");
    const { CreditHistory } = await import("../models/CreditHistory.js");
    
    const request = await CreditRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: "Invalid or already processed request" });
    }

    // Process approval
    console.log('Setting status to approved');
    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();

    // Add credits to user
    console.log('Fetching user');
    const user = await User.findById(request.userId);
    console.log('Adding credits', request.amount, 'to user', user._id);
    user.credits += request.amount;
    await user.save(); console.log('User saved');

    // Log history
    console.log('Creating CreditHistory');
    await CreditHistory.create({
      userId: user._id,
      amount: request.amount,
      balanceAfter: user.credits,
      type: "topup",
      description: `Admin approved top-up request #${request._id}`,
    }); console.log('CreditHistory created');

    res.json({ success: true, message: "Request approved and credits added" });
  } catch (err) { console.log('Error in approval:', err); res.status(500).json({ error: err.message || 'Internal server error' }); }
});

// [NEW] Reject a credit request
adminRoutes.post("/credit-requests/:id/reject", async (req, res, next) => { if (!req.user) { return res.status(401).json({ error: 'Authentication required' }); }
  try {
    const { CreditRequest } = await import("../models/CreditRequest.js");
    const { adminNote } = req.body;
    
    const request = await CreditRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: "Invalid or already processed request" });
    }

    request.status = 'rejected';
    request.adminNote = adminNote || "No reason provided";
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();

    res.json({ success: true, message: "Request rejected" });
  } catch (err) {
    next(err);
  }
});
