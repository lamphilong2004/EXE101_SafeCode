import { User } from "../models/User.js";
import { File } from "../models/File.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { httpError } from "../middleware/error.js";

/* ─── Credit calculation constants ─── */

/* ─── Credit calculation constants V2 ─── */

const BASE_UPLOAD_COST = 1.0;
const BUILD_FEE = 2.0;
const PREVIEW_RATE_PER_MIN = 0.1;
const FREE_PREVIEW_MINS = 5;

const CREDIT_CONVERSION_RATE = 1_000; // 1 Credit = 1,000 VND
const PLATFORM_FEE_PERCENT = 0.00;    // 0% platform fee (Admin takes no commission)

/* ─── Public functions ─── */

import { PreviewSession } from "../models/PreviewSession.js";

/**
 * V2 formula: Simple flat fee for upload.
 */
export function calculateUploadCost({ trialMinutes = 0 } = {}) {
  // Base cost is 1.0, plus 0.2 CR per minute of trial provided to the client
  return BASE_UPLOAD_COST + (trialMinutes * 0.2);
}

/**
 * Calculate credits earned from a sale (after platform fee).
 */
export function calculateSaleCredits(amountInVnd) {
  const grossCredits = amountInVnd / CREDIT_CONVERSION_RATE;
  const netCredits = grossCredits * (1 - PLATFORM_FEE_PERCENT);
  return Math.floor(netCredits * 100) / 100; // 2 decimal places
}

/**
 * Deduct credits for a file upload.
 * Returns the cost.
 */
export async function consumeCreditsForUpload(userId, { fileId }) {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, "User not found");

  const file = await File.findById(fileId);
  if (!file) throw httpError(404, "File not found");

  const cost = calculateUploadCost({ trialMinutes: file.allocatedMinutes });

  if (user.credits < cost) {
    throw httpError(402, `Insufficient credits. Need ${cost}, have ${user.credits}`);
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true }
  );

  if (!updatedUser) throw httpError(402, "Insufficient credits (race condition)");

  await CreditHistory.create({
    userId,
    amount: -cost,
    balanceAfter: updatedUser.credits,
    type: "upload",
    description: "V2 Flat-rate upload fee",
    referenceId: fileId,
    referenceModel: "File",
  });

  return cost;
}

/**
 * Core V2 Logic: Heartbeat consumption for time-based billing.
 * Adjusted to 15s intervals for DEMO.
 */
export async function consumeHeartbeat(userId, fileId) {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, "User not found");

  const file = await File.findById(fileId);
  if (!file) throw httpError(404, "File not found");

  let session = await PreviewSession.findOne({ userId, fileId, status: "active" });
  if (!session) {
    session = await PreviewSession.create({ userId, fileId, status: "active" });
  }

  const now = new Date();
  
  // Calculate total seconds consumed in PREVIOUS sessions for this file
  const previousSessions = await PreviewSession.find({ 
    userId, 
    fileId, 
    _id: { $ne: session._id } 
  });
  const previousSeconds = previousSessions.reduce((acc, s) => {
    // If completed, use (endTime - startTime), else if terminated use (lastHeartbeat - startTime)
    const end = s.status === 'active' ? s.lastHeartbeat : (s.endTime || s.lastHeartbeat);
    return acc + Math.floor((end - s.startTime) / 1000);
  }, 0);

  const currentSeconds = Math.floor((now - session.startTime) / 1000);
  const totalSecondsElapsed = previousSeconds + currentSeconds;

  // Check if still within allocated trial minutes
  const allocatedSeconds = (file.allocatedMinutes || 0) * 60;
  
  // If user is within allocated trial time, heartbeat is free
  if (totalSecondsElapsed <= allocatedSeconds) {
    session.lastHeartbeat = now;
    session.isFreeSession = true;
    await session.save();
    return { 
      cost: 0, 
      balance: user.credits, 
      isFree: true, 
      trialMinutesRemaining: Math.max(0, (allocatedSeconds - totalSecondsElapsed) / 60)
    };
  }

  // If trial expired, start paid consumption: 0.1 CR per 15s pulse
  const cost = 0.1; 
  if (user.credits < cost) {
    session.status = "terminated";
    await session.save();
    throw httpError(402, "Insufficient credits to continue preview");
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true }
  );

  session.lastHeartbeat = now;
  session.totalConsumed += cost;
  session.isFreeSession = false;
  await session.save();

  await CreditHistory.create({
    userId,
    amount: -cost,
    balanceAfter: updatedUser.credits,
    type: "preview",
    description: `Sandbox Heartbeat (Paid after ${file.allocatedMinutes}m trial)`,
    referenceId: fileId,
    referenceModel: "File",
  });

  return { cost, balance: updatedUser.credits, isFree: false, trialMinutesRemaining: 0 };
}

/**
 * Add credits to freelancer after a confirmed sale.
 * Returns the amount earned.
 */
export async function rewardCreditsForSale(userId, { amountInVnd, fileId }) {
  const earned = calculateSaleCredits(amountInVnd);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: earned } },
    { new: true }
  );

  if (!updatedUser) throw httpError(404, "User not found");

  await CreditHistory.create({
    userId,
    amount: earned,
    balanceAfter: updatedUser.credits,
    type: "sale",
    description: `Earned from file sale (Gross: ${amountInVnd.toLocaleString()} VND, Fee: ${PLATFORM_FEE_PERCENT * 100}%)`,
    referenceId: fileId,
    referenceModel: "File",
    metadata: { amountInVnd, earned, platformFee: PLATFORM_FEE_PERCENT },
  });

  return earned;
}

/**
 * Admin: add or deduct credits for a user.
 */
export async function adjustCredits(userId, { amount, reason, adminId }) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: amount } },
    { new: true }
  );

  if (!updatedUser) throw httpError(404, "User not found");

  // Prevent negative balance
  if (updatedUser.credits < 0) {
    await User.findByIdAndUpdate(userId, { $inc: { credits: -amount } });
    throw httpError(400, "Cannot deduct more credits than user has");
  }

  await CreditHistory.create({
    userId,
    amount,
    balanceAfter: updatedUser.credits,
    type: "adjustment",
    description: reason || `Admin adjustment by ${adminId}`,
    metadata: { adminId, reason },
  });

  return updatedUser.credits;
}
