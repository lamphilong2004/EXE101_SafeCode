import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['file_update', 'payment', 'dispute', 'system', 'message'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  link: {
    type: String
  }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
