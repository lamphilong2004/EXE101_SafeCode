import mongoose from "mongoose";

const TX_STATUS = ["Pending", "Succeeded", "Failed", "Refunded"];
const TX_TYPE = ["checkout", "refund"];

const TransactionSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true, index: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    clientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },

    type: { type: String, enum: TX_TYPE, required: true },
    status: { type: String, enum: TX_STATUS, default: "Pending", index: true },

    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "usd", lowercase: true },

    stripe: {
      eventId: { type: String, default: null, index: true, unique: true, sparse: true },
      checkoutSessionId: { type: String, default: null, index: true },
      paymentIntentId: { type: String, default: null, index: true },
      customerId: { type: String, default: null, index: true },
    },

    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

TransactionSchema.index({ fileId: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", TransactionSchema);
