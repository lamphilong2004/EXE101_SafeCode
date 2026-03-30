import { User } from "../models/User.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { httpError } from "../middleware/error.js";

/* ─── Credit calculation constants ─── */

const BASE_COST = 1;

// Project type factor
const TYPE_FACTORS = {
  web: 2,    // URL demo — moderate server resources
  app: 5,    // Mobile build — heavy storage + processing
  code: 0,   // No demo — minimal resources
};

// File size tiers
const SIZE_TIERS = [
  { maxBytes: 50 * 1024 * 1024, cost: 0 },     // < 50MB: free
  { maxBytes: 200 * 1024 * 1024, cost: 2 },     // 50-200MB: +2
  { maxBytes: Infinity, cost: 5 },               // > 200MB: +5
];

// Sale conversion
const CREDIT_CONVERSION_RATE = 10_000; // 1 Credit = 10,000 VND
const PLATFORM_FEE_PERCENT = 0.10;     // 10% platform fee

/* ─── Public functions ─── */

/**
 * Calculate upload cost based on project type and file size.
 * Formula: base_cost + type_factor + size_factor
 */
export function calculateUploadCost({ projectType = "code", sizeBytes = 0 }) {
  const typeFactor = TYPE_FACTORS[projectType] ?? 0;
  const sizeTier = SIZE_TIERS.find(t => sizeBytes <= t.maxBytes);
  const sizeFactor = sizeTier ? sizeTier.cost : 5;

  return BASE_COST + typeFactor + sizeFactor;
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
 * Check subscription status.
 */
function isSubscriptionActive(user) {
  if (!user.subscription) return false;
  if (user.subscription.status !== "active") return false;
  if (!user.subscription.currentPeriodEnd) return true;
  return new Date(user.subscription.currentPeriodEnd).getTime() > Date.now();
}

/**
 * Deduct credits for a file upload.
 * Subscribers bypass credit deduction.
 * Returns the cost (0 if subscriber).
 */
export async function consumeCreditsForUpload(userId, { fileId, projectType, sizeBytes }) {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, "User not found");

  // Subscribers get free uploads
  if (isSubscriptionActive(user)) {
    await CreditHistory.create({
      userId,
      amount: 0,
      balanceAfter: user.credits,
      type: "upload",
      description: `Free upload (active subscription) — ${projectType}`,
      referenceId: fileId,
      referenceModel: "File",
      metadata: { sizeBytes, projectType, cost: 0, waived: true },
    });
    return 0;
  }

  const cost = calculateUploadCost({ projectType, sizeBytes });

  if (user.credits < cost) {
    throw httpError(402, `Insufficient credits. Need ${cost}, have ${user.credits}`);
  }

  // Atomic deduction to prevent race conditions
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true }
  );

  if (!updatedUser) {
    throw httpError(402, `Insufficient credits (race condition). Need ${cost}`);
  }

  await CreditHistory.create({
    userId,
    amount: -cost,
    balanceAfter: updatedUser.credits,
    type: "upload",
    description: `Upload fee: base(1) + type(${TYPE_FACTORS[projectType] ?? 0}) + size(${cost - 1 - (TYPE_FACTORS[projectType] ?? 0)})`,
    referenceId: fileId,
    referenceModel: "File",
    metadata: { sizeBytes, projectType, cost },
  });

  return cost;
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
