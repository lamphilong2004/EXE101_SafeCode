import mongoose from 'mongoose';

const withdrawRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
    default: 'pending',
    index: true
  },
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    accountName: { type: String }
  },
  qrCodeUrl: {
    type: String
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
  }
}, { timestamps: true });

export const WithdrawRequest = mongoose.model('WithdrawRequest', withdrawRequestSchema);
