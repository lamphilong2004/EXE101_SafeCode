import crypto from "crypto";
import { env } from "../config/env.js";

const MASTER_KEY = Buffer.from(env.MASTER_KEY_B64, "base64");
if (MASTER_KEY.length !== 32) {
  throw new Error("MASTER_KEY_B64 must be 32 bytes base64 (AES-256 key)");
}

export function generateAesKey() {
  return crypto.randomBytes(32);
}

export function generateGcmIv() {
  return crypto.randomBytes(12);
}

export function createAes256GcmCipherStream(key, iv) {
  return crypto.createCipheriv("aes-256-gcm", key, iv);
}

export function createAes256GcmDecipherStream(key, iv, authTag) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher;
}

// Wrap (encrypt) a per-file AES key at rest using a server master key.
export function wrapFileKey(fileKey) {
  const wrapIv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, wrapIv);
  const wrapped = Buffer.concat([cipher.update(fileKey), cipher.final()]);
  const wrapAuthTag = cipher.getAuthTag();

  return {
    wrappedKeyB64: wrapped.toString("base64"),
    wrapIvB64: wrapIv.toString("base64"),
    wrapAuthTagB64: wrapAuthTag.toString("base64"),
  };
}

export function unwrapFileKey({ wrappedKeyB64, wrapIvB64, wrapAuthTagB64 }) {
  const wrapped = Buffer.from(wrappedKeyB64, "base64");
  const wrapIv = Buffer.from(wrapIvB64, "base64");
  const wrapAuthTag = Buffer.from(wrapAuthTagB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, wrapIv);
  decipher.setAuthTag(wrapAuthTag);

  const key = Buffer.concat([decipher.update(wrapped), decipher.final()]);
  if (key.length !== 32) throw new Error("Unwrapped key invalid length");
  return key;
}
