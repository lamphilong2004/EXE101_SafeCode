import mongoose from "mongoose";

const FILE_STATUS = ["Draft", "Uploaded", "Testing Phase", "Locked", "Verifying Payment", "Paid", "Disputed", "AwaitingEvidence", "Delivered", "Canceled", "Closed"];
const DEMO_TYPES = ["none", "url", "build"];
const PROJECT_TYPES = ["web", "app", "code"];

const FileSchema = new mongoose.Schema(
  {
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    intendedClientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    projectType: { type: String, enum: PROJECT_TYPES, default: "code", index: true },

    price: {
      amount: { type: Number, required: true, min: 1 },
      currency: { type: String, required: true, default: "usd", lowercase: true },
    },

    status: { type: String, enum: FILE_STATUS, default: "Draft", index: true },

    // populated after encrypted upload completes
    s3: {
      bucket: { type: String, default: null },
      key: { type: String, default: null, index: true },
      region: { type: String, default: null },
      contentType: { type: String, default: "application/zip" },
      sizeBytes: { type: Number, default: null },
      etag: { type: String, default: null },
    },

    // populated after encrypted upload completes
    encryption: {
      alg: { type: String, default: "aes-256-gcm" },
      ivB64: { type: String, default: null },
      authTagB64: { type: String, default: null },
      keyWrapped: {
        scheme: { type: String, default: "env-aesgcm" },
        wrappedKeyB64: { type: String, default: null },
        wrapIvB64: { type: String, default: null },
        wrapAuthTagB64: { type: String, default: null },
      },
    },

    demo: {
      type: { type: String, enum: DEMO_TYPES, required: true, index: true },
      url: { type: String, default: null },
      buildS3: {
        bucket: { type: String, default: null },
        key: { type: String, default: null },
        region: { type: String, default: null },
        contentType: { type: String, default: null },
        sizeBytes: { type: Number, default: null },
      },
    },

    stripe: {
      checkoutSessionId: { type: String, default: null, index: true },
      paymentIntentId: { type: String, default: null, index: true },
      customerId: { type: String, default: null, index: true },
    },

    receipt: {
      imageUrl: { type: String, default: null },
      trackingLink: { type: String, default: null },
      submittedAt: { type: Date, default: null },
      verifiedByAI: { type: Boolean, default: false }
    },

    trialEndsAt: { type: Date, default: null },
    keyDownloadedAt: { type: Date, default: null },

    uploadedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    adminNote: { type: String, default: null },

    // Dispute management
    disputeDeadline: { type: Date, default: null },
  },
  { timestamps: true }
);

FileSchema.index({ freelancerId: 1, createdAt: -1 });
FileSchema.index({ intendedClientEmail: 1, status: 1, createdAt: -1 });

export const File = mongoose.model("File", FileSchema);