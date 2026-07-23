import mongoose from "mongoose";

const USER_ROLES = ["freelancer", "client", "admin"];

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: USER_ROLES, required: true, index: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },

    name: { type: String, trim: true },

    credits: { type: Number, default: 50, min: 0 },

    payoutSettings: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
      qrCodeUrl: { type: String, default: "" },
    },

    subscription: {
      plan: { type: String, default: null },
      status: { type: String, default: "inactive" },
      stripeCustomerId: { type: String, default: null, index: true },
      stripeSubscriptionId: { type: String, default: null, index: true },
      currentPeriodEnd: { type: Date, default: null },
    },

    refreshTokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },

    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    isVerified: { type: Boolean, default: false },
    verificationOtp: { type: String, default: null },
    verificationOtpExpires: { type: Date, default: null },

    kyc: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
        index: true,
      },
      cccdFront: { type: String, default: null },  // base64 or URL
      cccdBack:  { type: String, default: null },
      fullName:  { type: String, default: null },
      cccdNumber: { type: String, default: null },
      submittedAt: { type: Date, default: null },
      reviewedAt:  { type: Date, default: null },
      adminNote:   { type: String, default: null },
    },

    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
