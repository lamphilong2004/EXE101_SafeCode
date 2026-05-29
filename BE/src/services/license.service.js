import crypto from "crypto";
import { env } from "../config/env.js";
import { LicenseKey } from "../models/LicenseKey.js";
import { httpError } from "../middleware/error.js";

const LICENSE_SECRET = env.MASTER_KEY_HEX || "safecode_default_license_secret_123";

/**
 * Generate a signed license key string.
 * Format: SC-YYYYMM-RANDOM-SIGN
 */
export function generateSignedKey(userId, fileId) {
  const dateStr = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM
  const entropy = crypto.randomBytes(4).toString("hex").toUpperCase();
  const payload = `SC-${dateStr}-${entropy}-${userId.toString().slice(-4)}-${fileId.toString().slice(-4)}`;
  
  const signature = crypto
    .createHmac("sha256", LICENSE_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
    
  return `${payload}-${signature}`;
}

/**
 * Verify a license key string against its signature.
 */
export function verifyKeySignature(keyStr) {
  const parts = keyStr.split("-");
  if (parts.length !== 6) return false;
  
  const signature = parts.pop();
  const payload = parts.join("-");
  
  const expected = crypto
    .createHmac("sha256", LICENSE_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
    
  return signature === expected;
}

/**
 * Hash a key with a salt using SHA-256.
 */
export function hashKeyWithSalt(key, salt) {
  return crypto.createHash("sha256").update(key + salt).digest("hex");
}

/**
 * Issue a new license for a user/file.
 */
export async function issueLicense(userId, fileId) {
  const rawKey = generateSignedKey(userId, fileId);
  const salt = crypto.randomBytes(8).toString("hex");
  const keyHash = hashKeyWithSalt(rawKey, salt);
  
  await LicenseKey.create({
    keyHash,
    salt,
    userId,
    fileId,
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year default
  });
  
  return { key: rawKey }; // Return raw key ONLY once for email/UI
}

/**
 * Validate a license and register device if needed.
 */
export async function validateLicense(keyStr, { userId, fileId, deviceId, ip }) {
  if (!verifyKeySignature(keyStr)) {
    throw httpError(400, "Invalid license key format or signature");
  }

  // Find by user/file first to get salt and lockout status
  const license = await LicenseKey.findOne({ fileId, userId });
  if (!license) throw httpError(404, "License not found for this product/user");

  // Check Lockout
  if (license.status === "LOCKED") {
    if (license.lockUntil && license.lockUntil > new Date()) {
      const remaining = Math.ceil((license.lockUntil - new Date()) / 60000);
      throw httpError(403, `Account locked due to multiple failed attempts. Try again in ${remaining} minutes.`);
    } else {
      license.status = "ACTIVE";
      license.failedAttempts = 0;
    }
  }
  
  if (license.status !== "ACTIVE") {
    throw httpError(403, `License is ${license.status.toLowerCase()}`);
  }

  // Verify Hash
  const hashVal = hashKeyWithSalt(keyStr, license.salt);
  if (hashVal !== license.keyHash) {
    license.failedAttempts += 1;
    if (license.failedAttempts >= 5) {
      license.status = "LOCKED";
      license.lockUntil = new Date(Date.now() + 30 * 60000); // 30 min lock
    }
    await license.save();
    throw httpError(401, "Invalid license key");
  }

  // Success: reset attempts
  license.failedAttempts = 0;
  
  if (license.expiresAt && license.expiresAt < new Date()) {
    license.status = "EXPIRED";
    await license.save();
    throw httpError(403, "License has expired");
  }

  // Handle device binding
  const existingActivation = license.activations.find(a => a.deviceId === deviceId);
  if (!existingActivation) {
    if (license.activations.length >= license.maxActivations) {
      throw httpError(403, `Activation limit reached (${license.maxActivations} devices)`);
    }
    
    license.activations.push({ deviceId, ip, activatedAt: new Date() });
  }

  await license.save();
  return license;
}
