import mongoose from "mongoose";

const CREDIT_TX_TYPES = ["upload", "sale", "deposit", "refund", "adjustment"];

const CreditHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true }, // positive = addition, negative = deduction
    balanceAfter: { type: Number, required: true },

    type: { type: String, enum: CREDIT_TX_TYPES, required: true, index: true },

    description: { type: String, default: "" },

    // Optional reference to related entity
    referenceId: { type: mongoose.Schema.Types.ObjectId, index: true },
    referenceModel: { type: String, enum: ["File", "Transaction"], default: null },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

CreditHistorySchema.index({ userId: 1, createdAt: -1 });

export const CreditHistory = mongoose.model("CreditHistory", CreditHistorySchema);
