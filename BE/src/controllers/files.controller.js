import Busboy from "busboy";
import { PassThrough, Transform } from "stream";
import { pipeline } from "stream/promises";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { env } from "../config/env.js";
import { File } from "../models/File.js";
import { User } from "../models/User.js";
import { httpError } from "../middleware/error.js";
import {
  createAes256GcmCipherStream,
  createAes256GcmDecipherStream,
  generateAesKey,
  generateGcmIv,
  unwrapFileKey,
  wrapFileKey,
} from "../services/crypto.service.js";
import { createPresignedGetUrl, s3, uploadStreamToS3 } from "../services/s3.service.js";
import { validatePublicDemoUrl } from "../utils/validateUrl.js";
import { proxyWithHardTimeout } from "../services/proxy.service.js";

function nowIsoSafe() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function isSubscriptionActive(user) {
  if (!user.subscription) return false;
  if (user.subscription.status !== "active") return false;
  if (!user.subscription.currentPeriodEnd) return true;
  return new Date(user.subscription.currentPeriodEnd).getTime() > Date.now();
}

async function consumeUploadCreditIfNeeded(freelancerId) {
  const user = await User.findById(freelancerId);
  if (!user) throw httpError(401, "Unauthorized");

  if (isSubscriptionActive(user)) return;

  const updated = await User.findOneAndUpdate(
    { _id: freelancerId, credits: { $gte: 1 } },
    { $inc: { credits: -1 } },
    { new: true }
  );

  if (!updated) throw httpError(402, "Insufficient credits (or no active subscription)");
}

class ByteCounter extends Transform {
  constructor() {
    super();
    this.bytes = 0;
  }
  _transform(chunk, encoding, cb) {
    this.bytes += chunk.length;
    cb(null, chunk);
  }
}

export async function createFileListing(req, res, next) {
  try {
    const { title, description, price, intendedClientEmail, demo } = req.body || {};

    if (!title || !price?.amount || !price?.currency || !intendedClientEmail || !demo?.type) {
      throw httpError(400, "title, price{amount,currency}, intendedClientEmail, demo{type} are required");
    }

    if (!["none", "url", "build"].includes(demo.type)) throw httpError(400, "Invalid demo type");

    if (demo.type === "url") {
      if (!demo.url) throw httpError(400, "demo.url is required for demo type url");
      const v = validatePublicDemoUrl(String(demo.url));
      if (!v.ok) throw httpError(400, `Invalid demo.url: ${v.reason}`);
    }

    const file = await File.create({
      freelancerId: req.user.id,
      intendedClientEmail: String(intendedClientEmail).toLowerCase().trim(),
      title: String(title).trim(),
      description: description ? String(description) : "",
      price: {
        amount: Number(price.amount),
        currency: String(price.currency).toLowerCase(),
      },
      demo: {
        type: demo.type,
        url: demo.type === "url" ? String(demo.url) : null,
      },
      status: "Draft",
      s3: {
        bucket: null,
        key: null,
        region: null,
        contentType: "application/zip",
      },
      encryption: {
        alg: "aes-256-gcm",
        ivB64: null,
        authTagB64: null,
        keyWrapped: {
          scheme: "env-aesgcm",
          wrappedKeyB64: null,
          wrapIvB64: null,
          wrapAuthTagB64: null,
        },
      },
    });

    res.status(201).json({ fileId: String(file._id), status: file.status });
  } catch (err) {
    next(err);
  }
}

export async function getMyFiles(req, res, next) {
  try {
    const files = await File.find({ freelancerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ files });
  } catch (err) {
    next(err);
  }
}

export async function getAssignedFiles(req, res, next) {
  try {
    const files = await File.find({ intendedClientEmail: req.user.email })
      .populate("freelancerId", "name email payoutSettings")
      .sort({ createdAt: -1 });

    // Auto-lock expired trials
    const now = new Date();
    let changed = false;
    for (const f of files) {
      if (f.status === "Testing Phase" && f.trialEndsAt && f.trialEndsAt < now) {
        f.status = "Locked";
        await f.save();
        changed = true;
      }
    }

    res.json({ files });
  } catch (err) {
    next(err);
  }
}

export async function startTrial(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status !== "Uploaded") throw httpError(409, "File must be in Uploaded state to start trial");

    fileDoc.status = "Testing Phase";
    fileDoc.trialEndsAt = new Date(Date.now() + 30 * 1000); // 30 seconds for demo
    await fileDoc.save();

    res.json({ success: true, status: fileDoc.status, trialEndsAt: fileDoc.trialEndsAt });
  } catch (err) {
    next(err);
  }
}

export async function uploadEncryptedZip(req, res, next) {
  try {
    const { fileId } = req.params;
    if (!fileId) throw httpError(400, "Missing fileId");

    const fileDoc = await File.findOne({ _id: fileId, freelancerId: req.user.id });
    if (!fileDoc) {
      console.log(`[UPLOAD] File not found: ${fileId} for user ${req.user.id}`);
      throw httpError(404, "File not found");
    }
    const contentType = req.headers["content-type"];
    console.log(`[UPLOAD] Received request with Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes("multipart/form-data")) {
      console.error(`[UPLOAD] Invalid Content-Type for upload: ${contentType}`);
      throw httpError(400, "Invalid Content-Type. Expected multipart/form-data.");
    }

    const bb = Busboy({
      headers: req.headers,
      limits: {
        files: 2,
        fileSize: 200 * 1024 * 1024,
      },
    });

    let archiveHandled = false;
    let buildHandled = fileDoc.demo?.type !== "build"; // if build demo, require buildBinary too

    const aesKey = generateAesKey();
    const iv = generateGcmIv();
    const cipher = createAes256GcmCipherStream(aesKey, iv);

    const counter = new ByteCounter();
    const encryptedBody = new PassThrough();

    const uploadKey = `encrypted/${fileId}/${nowIsoSafe()}.zip.enc`;

    let uploadPromise = null;
    let buildUploadPromise = null;

    bb.on("file", (fieldname, fileStream, info) => {
      console.log(`[UPLOAD] Busboy received file: ${fieldname}, filename: ${info.filename}`);
      const { filename, mimeType } = info;

      if (fieldname === "archive") {
        archiveHandled = true;

        uploadPromise = (async () => {
          try {
            console.log(`[UPLOAD] Starting archive pipeline...`);
            // pipe incoming zip -> count -> cipher -> pass -> S3 (fully streaming)
            const pipePromise = pipeline(fileStream, counter, cipher, encryptedBody);

            const { etag } = await uploadStreamToS3({
              bucket: env.S3_BUCKET_ENCRYPTED,
              key: uploadKey,
              body: encryptedBody,
              contentType: mimeType || "application/zip",
            });

            await pipePromise;

            const authTag = cipher.getAuthTag();
            const wrapped = wrapFileKey(aesKey);

            fileDoc.s3 = {
              bucket: env.S3_BUCKET_ENCRYPTED,
              key: uploadKey,
              region: env.AWS_REGION,
              contentType: mimeType || "application/zip",
              sizeBytes: counter.bytes,
              etag,
            };

            fileDoc.encryption = {
              alg: "aes-256-gcm",
              ivB64: iv.toString("base64"),
              authTagB64: authTag.toString("base64"),
              keyWrapped: {
                scheme: "env-aesgcm",
                ...wrapped,
              },
            };

            fileDoc.status = "Uploaded";
            fileDoc.uploadedAt = new Date();

            await fileDoc.save();
            console.log(`[UPLOAD] Archive upload success for fileId: ${fileId}`);
          } catch (uploadErr) {
            console.error(`[UPLOAD] Archive upload sub-process error:`, uploadErr);
            throw uploadErr;
          }
        })();

        return;
      }

      if (fieldname === "buildBinary") {
        if (fileDoc.demo?.type !== "build") {
          fileStream.resume();
          return;
        }

        buildHandled = true;

        const buildKey = `builds/${fileId}/${nowIsoSafe()}-${filename || "build.bin"}`;
        const buildCounter = new ByteCounter();
        const pass = new PassThrough();

        buildUploadPromise = (async () => {
          const pipePromise = pipeline(fileStream, buildCounter, pass);

          await uploadStreamToS3({
            bucket: env.S3_BUCKET_BUILDS,
            key: buildKey,
            body: pass,
            contentType: mimeType || "application/octet-stream",
          });

          await pipePromise;

          fileDoc.demo.buildS3 = {
            bucket: env.S3_BUCKET_BUILDS,
            key: buildKey,
            region: env.AWS_REGION,
            contentType: mimeType || "application/octet-stream",
            sizeBytes: buildCounter.bytes,
          };

          await fileDoc.save();
        })();

        return;
      }

      // ignore other file fields
      fileStream.resume();
    });

    bb.on("error", (err) => next(err));

    bb.on("finish", async () => {
      try {
        if (!archiveHandled) throw httpError(400, "Missing archive file field 'archive'");
        if (!buildHandled) throw httpError(400, "Missing buildBinary for demo type 'build'");
        if (!uploadPromise) throw httpError(500, "Upload not started");

        await uploadPromise;
        if (buildUploadPromise) await buildUploadPromise;

        res.json({ fileId: String(fileDoc._id), status: fileDoc.status });
      } catch (err) {
        console.error("[UPLOAD] Busboy Finish Error:", err);
        next(err);
      }
    });

    req.pipe(bb);
  } catch (err) {
    next(err);
  }
}

export async function downloadEncrypted(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (!fileDoc.s3?.bucket || !fileDoc.s3?.key) throw httpError(409, "File not uploaded yet");

    // MOCK MODE FOR DEV TESTING
    if (env.AWS_ACCESS_KEY_ID.startsWith("mock_")) {
      const url = await createPresignedGetUrl({
        bucket: fileDoc.s3.bucket,
        key: fileDoc.s3.key,
        expiresInSeconds: 60,
      });
      return res.redirect(url);
    }

    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: fileDoc.s3.bucket,
        Key: fileDoc.s3.key,
      })
    );

    if (!obj.Body) throw httpError(502, "S3 download failed");

    res.setHeader("Content-Type", fileDoc.s3.contentType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=encrypted_${String(fileDoc._id)}.zip.enc`
    );

    obj.Body.on("error", (err) => next(err));
    obj.Body.pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function downloadBuild(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.demo?.type !== "build") throw httpError(409, "No build demo for this file");
    if (!fileDoc.demo?.buildS3?.bucket || !fileDoc.demo?.buildS3?.key) throw httpError(409, "Build not uploaded");

    const url = await createPresignedGetUrl({
      bucket: fileDoc.demo.buildS3.bucket,
      key: fileDoc.demo.buildS3.key,
      expiresInSeconds: 60,
    });

    res.redirect(url);
  } catch (err) {
    next(err);
  }
}

export async function proxyDemo(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.demo?.type !== "url") throw httpError(409, "No URL demo for this file");

    const targetUrl = fileDoc.demo.url;
    const v = validatePublicDemoUrl(String(targetUrl));
    if (!v.ok) throw httpError(400, `Invalid demo.url: ${v.reason}`);

    // Hard 60-second session termination
    return proxyWithHardTimeout({ targetUrl, hardTimeoutMs: 60_000 })(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function getDecryptionKey(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status !== "Paid") throw httpError(402, "Payment required");

    const wrapped = fileDoc.encryption?.keyWrapped;
    if (!wrapped?.wrappedKeyB64 || !wrapped?.wrapIvB64 || !wrapped?.wrapAuthTagB64) {
      throw httpError(409, "Key not available");
    }

    const key = unwrapFileKey(wrapped);

    res.json({
      alg: fileDoc.encryption.alg,
      keyB64: key.toString("base64"),
      ivB64: fileDoc.encryption.ivB64,
      authTagB64: fileDoc.encryption.authTagB64,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEncryptionMeta(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status !== "Paid") throw httpError(402, "Payment required");

    if (!fileDoc.encryption?.ivB64 || !fileDoc.encryption?.authTagB64) {
      throw httpError(409, "Encryption metadata not available");
    }

    res.json({
      alg: fileDoc.encryption.alg,
      ivB64: fileDoc.encryption.ivB64,
      authTagB64: fileDoc.encryption.authTagB64,
    });
  } catch (err) {
    next(err);
  }
}

export async function decryptUploadedFile(req, res, next) {
  try {
    const bb = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: 250 * 1024 * 1024,
      },
    });

    let keyB64 = null;
    let ivB64 = null;
    let authTagB64 = null;

    let handledFile = false;

    bb.on("field", (name, val) => {
      if (name === "keyB64") keyB64 = val;
      if (name === "ivB64") ivB64 = val;
      if (name === "authTagB64") authTagB64 = val;
    });

    bb.on("file", async (fieldname, fileStream) => {
      if (fieldname !== "encryptedFile") {
        fileStream.resume();
        return;
      }

      handledFile = true;

      if (!keyB64 || !ivB64 || !authTagB64) {
        fileStream.resume();
        return next(httpError(400, "keyB64, ivB64, authTagB64 are required"));
      }

      const key = Buffer.from(String(keyB64), "base64");
      const iv = Buffer.from(String(ivB64), "base64");
      const authTag = Buffer.from(String(authTagB64), "base64");

      if (key.length !== 32) return next(httpError(400, "Invalid key length"));
      if (iv.length !== 12) return next(httpError(400, "Invalid iv length"));
      if (authTag.length !== 16) return next(httpError(400, "Invalid authTag length"));

      const decipher = createAes256GcmDecipherStream(key, iv, authTag);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=decrypted.zip");

      try {
        await pipeline(fileStream, decipher, res);
      } catch (err) {
        return next(httpError(400, "Decryption failed"));
      }
    });

    bb.on("finish", () => {
      if (!handledFile) return next(httpError(400, "Missing encryptedFile"));
    });

    bb.on("error", (err) => next(err));

    req.pipe(bb);
  } catch (err) {
    next(err);
  }
}

export async function uploadReceipt(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");

    const { imageUrl, trackingLink } = req.body;
    fileDoc.receipt = {
      imageUrl: imageUrl || null,
      trackingLink: trackingLink || null,
      submittedAt: new Date(),
      verifiedByAI: true // mock AI verification
    };
    fileDoc.status = "Verifying Payment";
    await fileDoc.save();

    res.json({ success: true, status: fileDoc.status });
  } catch (err) {
    next(err);
  }
}

export async function confirmPayment(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (String(fileDoc.freelancerId) !== String(req.user.id)) throw httpError(403, "Forbidden");
    if (fileDoc.status !== "Verifying Payment") throw httpError(409, "No pending receipt to confirm");

    const { action } = req.body;
    let unlockKeyB64 = null;

    if (action === 'confirm') {
      fileDoc.status = "Paid";
      fileDoc.paidAt = new Date();

      const wrapped = fileDoc.encryption?.keyWrapped;
      if (wrapped?.wrappedKeyB64 && wrapped?.wrapIvB64 && wrapped?.wrapAuthTagB64) {
        const key = unwrapFileKey(wrapped);
        unlockKeyB64 = key.toString("base64");
      }
    } else {
      fileDoc.status = "Disputed";
    }
    
    await fileDoc.save();
    res.json({ success: true, status: fileDoc.status, unlockKeyB64 });
  } catch(err) {
    next(err);
  }
}

export async function disputePayment(req, res, next) {
  try {
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status !== "Verifying Payment") throw httpError(409, "Can only dispute when verifying payment");

    fileDoc.status = "Disputed";
    await fileDoc.save();

    res.json({ success: true, status: fileDoc.status });
  } catch(err) {
    next(err);
  }
}
