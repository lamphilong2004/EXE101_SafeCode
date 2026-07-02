import { WithdrawRequest } from "../models/WithdrawRequest.js";
import { User } from "../models/User.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { httpError } from "../middleware/error.js";
import mongoose from "mongoose";

// Config: 1 Credit = 2,000 VND
const CREDIT_CONVERSION_RATE = 2000;

export async function createWithdrawRequest(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, bankDetails, qrCodeUrl } = req.body;
    
    if (!amount || amount <= 0) {
      throw httpError(400, "Invalid withdrawal amount");
    }

    const user = await User.findById(req.user.id).session(session);
    if (!user) throw httpError(404, "User not found");

    if (user.credits < amount) {
      throw httpError(400, "Insufficient credits for withdrawal");
    }

    // Deduct credits immediately
    user.credits -= amount;
    await user.save({ session });

    const amountVND = amount * CREDIT_CONVERSION_RATE;

    const request = new WithdrawRequest({
      userId: user._id,
      amount,
      amountVND,
      bankDetails,
      qrCodeUrl,
      status: 'pending'
    });
    
    await request.save({ session });

    // Record credit history
    await CreditHistory.create([{
      userId: user._id,
      amount: -amount,
      balanceAfter: user.credits,
      type: "withdrawal",
      description: `Rút tiền: ${amountVND.toLocaleString()} VND`,
      referenceId: request._id,
      referenceModel: "WithdrawRequest"
    }], { session });

    await session.commitTransaction();
    res.status(201).json(request);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

export async function getMyWithdrawRequests(req, res, next) {
  try {
    const requests = await WithdrawRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

export async function getAllWithdrawRequests(req, res, next) {
  try {
    const requests = await WithdrawRequest.find()
      .populate("userId", "email fullname avatar")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

export async function approveWithdrawRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const request = await WithdrawRequest.findById(id);
    if (!request) throw httpError(404, "Withdraw request not found");
    if (request.status !== 'pending') throw httpError(400, `Cannot approve request with status ${request.status}`);

    request.status = 'approved';
    request.adminNote = adminNote || "Chuyển khoản thành công";
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    
    await request.save();

    res.json(request);
  } catch (err) {
    next(err);
  }
}

export async function rejectWithdrawRequest(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    if (!adminNote) {
      throw httpError(400, "Admin note is required for rejection");
    }

    const request = await WithdrawRequest.findById(id).session(session);
    if (!request) throw httpError(404, "Withdraw request not found");
    if (request.status !== 'pending') throw httpError(400, `Cannot reject request with status ${request.status}`);

    request.status = 'rejected';
    request.adminNote = adminNote;
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save({ session });

    // Refund credits to user
    const user = await User.findById(request.userId).session(session);
    user.credits += request.amount;
    await user.save({ session });

    // Record credit history
    await CreditHistory.create([{
      userId: user._id,
      amount: request.amount,
      balanceAfter: user.credits,
      type: "refund",
      description: `Hoàn tiền do từ chối yêu cầu rút số ${request._id.toString().slice(-6)}`,
      referenceId: request._id,
      referenceModel: "WithdrawRequest"
    }], { session });

    await session.commitTransaction();
    res.json(request);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}
