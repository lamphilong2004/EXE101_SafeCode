import mongoose from "mongoose";

const PreviewSessionSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, default: Date.now },
    lastHeartbeat: { type: Date, default: Date.now },
    totalConsumed: { type: Number, default: 0 },
    isFreeSession: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "completed", "terminated"], default: "active" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index for heartbeat cleanup
PreviewSessionSchema.index({ lastHeartbeat: 1, status: 1 });

export const PreviewSession = mongoose.model("PreviewSession", PreviewSessionSchema);
