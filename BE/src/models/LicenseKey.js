import mongoose from "mongoose";

const LicenseKeySchema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, unique: true },
    salt: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { 
      type: String, 
      enum: ["ACTIVE", "EXPIRED", "REVOKED", "LOCKED"], 
      default: "ACTIVE" 
    },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    maxActivations: { type: Number, default: 3 },
    activations: [
      {
        deviceId: String,
        activatedAt: { type: Date, default: Date.now },
        ip: String
      }
    ],
    expiresAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes for fast lookup - keyHash is already unique from field def
LicenseKeySchema.index({ userId: 1, fileId: 1 });

export const LicenseKey = mongoose.model("LicenseKey", LicenseKeySchema);
