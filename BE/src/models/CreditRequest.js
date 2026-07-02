import mongoose from 'mongoose';

const creditRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  amountVND: {
    type: Number,
    required: true,
    min: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  billImageUrl: {
    type: String,
    required: false
  },
  payosOrderCode: {
    type: Number,
    index: true
  },
  paymentLinkId: {
    type: String
  },
  bankAccountDetails: {
    type: String
  },
  aiVerification: {
    detected: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    suggestedAmount: { type: Number, default: null }
  },
  adminNote: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // For escrow file payments: who receives the credit and which file
  type: {
    type: String,
    enum: ['credit_purchase', 'file_payment'],
    default: 'credit_purchase'
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }
}, { timestamps: true });

export const CreditRequest = mongoose.model('CreditRequest', creditRequestSchema);
