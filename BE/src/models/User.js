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
    phone: { type: String, trim: true, default: null },

    credits: { type: Number, default: 0, min: 0 },

    payoutSettings: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
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
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
